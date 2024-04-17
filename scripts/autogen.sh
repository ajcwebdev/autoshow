#!/bin/bash

# Function to process a single URL
process_url() {
    url="$1"

    # Use yt-dlp to get the video metadata
    video_id=$(yt-dlp --print id "$url")
    video_duration_hours=$(yt-dlp --print filename -o "%(duration>%H)s" "$url")
    video_duration_minutes=$(yt-dlp --print filename -o "%(duration>%M)s" "$url")
    video_duration_seconds=$(yt-dlp --print filename -o "%(duration>%S)s" "$url")
    video_webpage_url=$(yt-dlp --print webpage_url "$url")
    video_uploader=$(yt-dlp --print uploader "$url")
    video_uploader_url=$(yt-dlp --print uploader_url "$url")
    video_title=$(yt-dlp --print title "$url")
    video_upload_date=$(yt-dlp --print filename -o "%(upload_date>%Y-%m-%d)s" "$url")
    video_thumbnail=$(yt-dlp --print thumbnail "$url")

    # Use video metadata to create frontmatter for each video
    echo -e "---" > "content/${video_id}_temp.md"
    echo -e "showLink: \"${video_webpage_url}\"" >> "content/${video_id}_temp.md"
    echo -e "channel: \"${video_uploader}\"" >> "content/${video_id}_temp.md"
    echo -e "channelURL: \"${video_uploader_url}\"" >> "content/${video_id}_temp.md"
    echo -e "title: \"${video_title}\"" >> "content/${video_id}_temp.md"
    echo -e "publishDate: \"${video_upload_date}\"" >> "content/${video_id}_temp.md"
    echo -e "coverImage: \"${video_thumbnail}\"" >> "content/${video_id}_temp.md"
    echo -e "---\n" >> "content/${video_id}_temp.md"

    # Download and extract audio as WAV into the content directory using video ID in the filename
    yt-dlp --extract-audio \
      --audio-format wav \
      --postprocessor-args "ffmpeg: -ar 16000" \
      -o "content/${video_id}.wav" \
      "$url"

    # Run the whisper.cpp processing using video ID in the filename
    ./whisper.cpp/main \
      -m "whisper.cpp/models/ggml-large-v2.bin" \
      -f "content/${video_id}.wav" \
      -of "content/${video_id}" \
      --output-lrc

    node scripts/transform.js "${video_id}"

    cat "content/${video_id}_temp.md" scripts/prompt.md "content/${video_id}.md" > "content/${video_upload_date}-${video_id}.md"
    rm "content/${video_id}.wav" "content/${video_id}.lrc" "content/${video_id}.md" "content/${video_id}_temp.md"

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
    yt-dlp --flat-playlist -s --print "url" "$playlist_url" > content/urls.md

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