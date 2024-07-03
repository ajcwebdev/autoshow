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
    # base="whisper.cpp/models/ggml-base.bin"
    # medium="whisper.cpp/models/ggml-medium.bin"
    large="whisper.cpp/models/ggml-large-v2.bin"

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
    ./whisper.cpp/main -m "${large}" -f "${id}.wav" -of "${id}" --output-lrc

    # Transform the transcription output using grep and awk
    originalPath="${id}.lrc"
    finalPath="${id}.txt"
    grep -v '^\[by:whisper\.cpp\]$' "$originalPath" | awk '{ gsub(/\.[0-9]+/, "", $1); print }' > "$finalPath"

    # Combine files to form the final output and clean up intermediate files
    cat "${id}.md" prompt.md "${id}.txt" > "${final}.md"
    rm "${id}.wav" "${id}.lrc" "${id}.txt" "${id}.md"

    echo "Process completed successfully for URL: $url"
}

process_video_file() {
    file_path="$1"
    base_name=$(basename "$file_path" .mkv)
    id="content/${base_name}"
    final="content/${base_name}"
    large="whisper.cpp/models/ggml-large-v2.bin"

    echo "---" > "${id}.md"
    echo "showLink: local_file" >> "${id}.md"
    echo "title: ${base_name}" >> "${id}.md"
    echo -e "---\n" >> "${id}.md"
    ffmpeg -i "$file_path" -acodec pcm_s16le -ac 1 -ar 16000 "${id}.wav"
    ./whisper.cpp/main -m "${large}" -f "${id}.wav" -of "${id}" --output-lrc
    originalPath="${id}.lrc"
    finalPath="${id}.txt"
    grep -v '^\[by:whisper\.cpp\]$' "$originalPath" | awk '{ gsub(/\.[0-9]+/, "", $1); print }' > "$finalPath"
    cat "${id}.md" prompt.md "${id}.txt" > "${final}.md"
    rm "${id}.wav" "${id}.lrc" "${id}.txt"
    echo "Process completed successfully for file: $file_path"
}

# Define function to process a YouTube playlist
process_playlist() {
    # Variable for the playlist URL
    playlist_url="$1"

    # Retrieve all video URLs from the playlist and write them to urls.md
    yt-dlp --flat-playlist -s --print "url" "$playlist_url" > content/urls.md

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

process_rss() {
    # Variable for the RSS feed URL
    rss_url="$1"

    # Use curl to download the RSS feed and grep to extract audio file URLs
    # Extracting URLs from the <source> tag in your provided RSS format
    curl -s "$rss_url" | grep -oP '<source src="\K[^"]+' > rss_urls.md

    # Process each audio URL from rss_urls.md
    while IFS= read -r url; do
        if [[ -n "$url" ]]; then
            process_video "$url"
        fi
    done < rss_urls.md
}

# Main function to decide whether to process a video, playlist, or URLs file
main() {
    mode="$1"
    input="$2"
    if [[ "$#" -ne 2 ]]; then
        echo "Usage: $0 --video <video_url> | --playlist <playlist_url> | --urls <file_path> | --rss <rss_url> | --file <video_path>"
        return 1
    fi
    case "$mode" in
        --video)
            process_video "$input"
            ;;
        --playlist)
            process_playlist "$input"
            ;;
        --urls)
            process_urls_file "$input"
            ;;
        --rss)
            process_rss "$input"
            ;;
        --file)
            process_video_file "$input"
            ;;
        *)
            echo "Invalid option. Use --video, --playlist, --urls, --rss, or --file"
            return 1
            ;;
    esac
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
