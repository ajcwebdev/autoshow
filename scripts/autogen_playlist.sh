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
    echo -e "showLink: \"${webpage_url}\"" >> "${id}.md"
    echo -e "channel: \"${uploader}\"" >> "${id}.md"
    echo -e "channelURL: \"${uploader_url}\"" >> "${id}.md"
    echo -e "title: \"${title}\"" >> "${id}.md"
    echo -e "publishDate: \"${upload_date}\"" >> "${id}.md"
    echo -e "coverImage: \"${thumbnail}\"" >> "${id}.md"
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

# Main function to retrieve playlist URLs and process each one
autogen() {
    # Check if a playlist URL argument was provided
    if [ "$#" -ne 1 ]; then
        echo "Usage: autogen <youtube_playlist_url>"
        return 1
    fi

    playlist_url="$1"

    # Retrieve all video URLs from the playlist and write them to urls.md
    yt-dlp \
      --flat-playlist \
      -s \
      --print "url" \
      "$playlist_url" > content/urls.md

    # Read URLs from urls.md and process each one
    while IFS= read -r url; do
        if [[ -n "$url" ]]; then
            process_url "$url"
        fi
    done < content/urls.md
}

# Call autogen function if script is executed, not when sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    autogen "$@"
fi