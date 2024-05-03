#!/bin/bash

# Define function to process a single YouTube video
process_video() {
    # Variable to hold the URL of the video
    url="$1"

    # Extract video metadata using yt-dlp and construct an identifier for output files
    video_id=$(yt-dlp --print id "$url")
    id="content/${video_id}"
    upload_date=$(yt-dlp --print filename -o "%(upload_date>%Y-%m-%d)s" "$url")
    final="content/${upload_date}-${video_id}"
    base="whisper.cpp/models/ggml-base.bin"
    medium="whisper.cpp/models/ggml-medium.bin"
    large-v2="whisper.cpp/models/ggml-large-v2.bin"

    # Append each piece of metadata directly, and end markdown file with frontmatter delimiter
    echo "---" > "${id}.md"
    echo "showLink: \"$(yt-dlp --print webpage_url "$url")\"" >> "${id}.md"
    echo "channel: \"$(yt-dlp --print uploader "$url")\"" >> "${id}.md"
    echo "channelURL: \"$(yt-dlp --print uploader_url "$url")\"" >> "${id}.md"
    echo "title: \"$(yt-dlp --print title "$url")\"" >> "${id}.md"
    echo "publishDate: \"$(yt-dlp --print filename -o "%(upload_date>%Y-%m-%d)s" "$url")\"" >> "${id}.md"
    echo "coverImage: \"$(yt-dlp --print thumbnail "$url")\"" >> "${id}.md"
    echo -e "---\n" >> "${id}.md"

    # Download audio and convert to WAV format
    yt-dlp -x --audio-format wav --postprocessor-args "ffmpeg: -ar 16000" -o "${id}.wav" "$url"

    # Transcribe audio using the Whisper model
    ./whisper.cpp/main -m "${base}" -f "${id}.wav" -of "${id}" --output-lrc

    # Transform the transcription output using a Node.js script
    node scripts/transform.js "${video_id}"

    # Combine files to form the final output and clean up intermediate files
    cat "${id}.md" scripts/prompt.md "${id}.txt" > "${final}.md"
    rm "${id}.wav" "${id}.lrc" "${id}.txt" "${id}.md"

    echo "Process completed successfully for URL: $url"
}

# Define function to process a YouTube playlist
process_playlist() {
    # Variable for the playlist URL
    playlist_url="$1"

    # Retrieve all video URLs from the playlist and write them to urls.md
    yt-dlp \
      --flat-playlist \
      -s \
      --print "url" \
      "$playlist_url" > content/urls.md

    # Process each video URL from urls.md
    while IFS= read -r url; do
        if [[ -n "$url" ]]; then
            process_video "$url"
        fi
    done < content/urls.md
}

# Define function to process URLs from a file
process_urls_file() {
    # Variable for the file path
    file_path="$1"

    # Check if the file exists
    if [[ ! -f "$file_path" ]]; then
        echo "File not found: $file_path"
        return 1
    fi

    # Process each URL from the file
    while IFS= read -r url; do
        if [[ -n "$url" ]]; then
            process_video "$url"
        fi
    done < "$file_path"
}

# Main function to decide whether to process a video, playlist, or URLs file
main() {
    # First argument: either --video, --playlist, or --urls
    mode="$1"

    # Second argument: the URL of the video, playlist, or the file path
    input="$2"

    # Validate input arguments
    if [[ "$#" -ne 2 ]]; then
        echo "Usage: $0 --video <video_url> | --playlist <playlist_url> | --urls <file_path>"
        return 1
    fi

    # Determine the operation mode based on the first argument
    case "$mode" in
        --video)
            process_video "$input"  # Process a single video
            ;;
        --playlist)
            process_playlist "$input"  # Process a playlist
            ;;
        --urls)
            process_urls_file "$input"  # Process URLs from a file
            ;;
        *)
            echo "Invalid option. Use --video, --playlist, or --urls"
            return 1
            ;;
    esac
}

# Ensure the script is not being sourced and call main with all passed arguments
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
