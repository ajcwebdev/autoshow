#!/bin/bash

# Define function to process a single YouTube video
process_video() {
    # Variable to hold the URL of the video
    url="$1"

    # Extract video metadata using yt-dlp
    video_id=$(yt-dlp --print id "$url")

    # Construct an identifier for output files
    id="content/${video_id}"

    duration_hours=$(yt-dlp --print filename -o "%(duration>%H)s" "$url")
    duration_minutes=$(yt-dlp --print filename -o "%(duration>%M)s" "$url")
    duration_seconds=$(yt-dlp --print filename -o "%(duration>%S)s" "$url")

    webpage_url=$(yt-dlp --print webpage_url "$url")
    uploader=$(yt-dlp --print uploader "$url")
    uploader_url=$(yt-dlp --print uploader_url "$url")
    title=$(yt-dlp --print title "$url")
    upload_date=$(yt-dlp --print filename -o "%(upload_date>%Y-%m-%d)s" "$url")
    thumbnail=$(yt-dlp --print thumbnail "$url")

    # Write metadata to a markdown file as frontmatter
    echo -e "---" > "${id}.md"
    echo -e "showLink: \"${webpage_url}\"" >> "${id}.md"
    echo -e "channel: \"${uploader}\"" >> "${id}.md"
    echo -e "channelURL: \"${uploader_url}\"" >> "${id}.md"
    echo -e "title: \"${title}\"" >> "${id}.md"
    echo -e "publishDate: \"${upload_date}\"" >> "${id}.md"
    echo -e "coverImage: \"${thumbnail}\"" >> "${id}.md"
    echo -e "---\n" >> "${id}.md"

    # Download audio and convert to WAV format
    yt-dlp \
      --extract-audio \
      --audio-format wav \
      --postprocessor-args "ffmpeg: -ar 16000" \
      -o "${id}.wav" \
      "$url"

    # Transcribe audio using the Whisper model
    ./whisper.cpp/main \
      -m "whisper.cpp/models/ggml-large-v2.bin" \
      -f "${id}.wav" \
      -of "${id}" \
      --output-lrc

    # Transform the transcription output using a Node.js script
    node scripts/transform.js "${video_id}"

    # Combine files to form the final output and clean up intermediate files
    cat "${id}.md" scripts/prompt.md "${id}.txt" > "content/${upload_date}-${video_id}.md"
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

# Main function to decide whether to process a video or a playlist
main() {
    # First argument: either --video or --playlist
    mode="$1"

    # Second argument: the URL of the video or playlist
    url="$2"

    # Validate input arguments
    if [[ "$#" -ne 2 ]]; then
        echo "Usage: $0 --video <video_url> | --playlist <playlist_url>"
        return 1
    fi

    # Determine the operation mode based on the first argument
    case "$mode" in
        --video)
            process_video "$url"  # Process a single video
            ;;
        --playlist)
            process_playlist "$url"  # Process a playlist
            ;;
        *)
            echo "Invalid option. Use --video or --playlist"
            return 1
            ;;
    esac
}

# Ensure the script is not being sourced and call main with all passed arguments
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
