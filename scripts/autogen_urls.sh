#!/bin/bash

# Function to process a single URL
process_url() {
    url="$1"

    # Use yt-dlp to get the video metadata
    video_id=$(yt-dlp --print id "$url")
    duration_hours=$(yt-dlp --print filename -o "%(duration>%H)s" "$url")
    duration_minutes=$(yt-dlp --print filename -o "%(duration>%M)s" "$url")
    duration_seconds=$(yt-dlp --print filename -o "%(duration>%S)s" "$url")
    webpage_url=$(yt-dlp --print webpage_url "$url")
    uploader=$(yt-dlp --print uploader "$url")
    uploader_url=$(yt-dlp --print uploader_url "$url")
    title=$(yt-dlp --print title "$url")
    upload_date=$(yt-dlp --print filename -o "%(upload_date>%Y-%m-%d)s" "$url")
    thumbnail=$(yt-dlp --print thumbnail "$url")

    id="content/${video_id}"

    # Use video metadata to create frontmatter for each video
    echo -e "---" > "${id}.md"
    echo -e "duration: \"${duration_hours}:${duration_minutes}:${duration_seconds}\"" >> "${id}.md"
    echo -e "showLink: \"${webpage_url}\"" >> "${id}.md"
    echo -e "channel: \"${uploader}\"" >> "${id}.md"
    echo -e "channelURL: \"${uploader_url}\"" >> "${id}.md"
    echo -e "title: \"${title}\"" >> "${id}.md"
    echo -e "publishDate: \"${upload_date}\"" >> "${id}.md"
    echo -e "ogImage: \"${thumbnail}\"" >> "${id}.md"
    echo -e "---\n" >> "${id}.md"

    # Download and extract audio as WAV into the content directory using video ID in the filename
    yt-dlp \
      --extract-audio \
      --audio-format wav \
      --postprocessor-args "ffmpeg: -ar 16000" \
      -o "${id}.wav" \
      "$url"

    # Run the whisper.cpp processing using video ID in the filename
    ./whisper.cpp/main \
      -m "whisper.cpp/models/ggml-large-v2.bin" \
      -f "${id}.wav" \
      -of "${id}" \
      --output-lrc

    node scripts/transform.js "${video_id}"

    cat "${id}.md" scripts/prompt.md "${id}.txt" > "content/${upload_date}-${video_id}.md"
    rm "${id}.wav" "${id}.lrc" "${id}.txt" "${id}.md"

    echo "Process completed successfully for URL: $url"
}

# Function to process URLs from an existing file
process_existing_file() {
    file_path="$1"
    if [[ ! -f "$file_path" ]]; then
        echo "File not found: $file_path"
        return 1
    fi

    while IFS= read -r url; do
        if [[ -n "$url" ]]; then
            process_url "$url"
        fi
    done < "$file_path"
}

# Main function to retrieve playlist URLs or process existing URLs
autogen() {
    if [[ "$#" -eq 0 ]]; then
        echo "Usage: autogen [option] <input>"
        echo "Options:"
        echo "  --playlist-url: Process a YouTube playlist URL"
        echo "  --urls-file: Process an existing urls.md file"
        return 1
    fi

    case "$1" in
        --playlist-url)
            playlist_url="$2"
            # Retrieve all video URLs from the playlist and write them to urls.md
            yt-dlp \
              --flat-playlist \
              -s \
              --print "url" \
              "$playlist_url" > content/urls.md
            process_existing_file content/urls.md
            ;;
        --urls-file)
            file_path="$2"
            process_existing_file "$file_path"
            ;;
        *)
            echo "Invalid option: $1"
            echo "Use --playlist-url for processing a YouTube playlist URL"
            echo "Or --urls-file for processing an existing urls.md file"
            return 1
            ;;
    esac
}

# Call autogen function if script is executed, not when sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    autogen "$@"
fi