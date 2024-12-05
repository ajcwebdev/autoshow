#!/bin/bash

# Usage:
#
#   ./scripts/create_clips.sh <markdown_file> <video_file>

# Example:
# 
#   ./scripts/create_clips.sh content/2021-05-10-thoughts-on-lambda-school-layoffs.md content/2021-05-10-thoughts-on-lambda-school-layoffs.wav

# Check for correct number of arguments
if [ $# -ne 2 ]; then
    echo "Usage: $0 <markdown_file> <video_file>"
    exit 1
fi

# Input arguments
markdown_file="$1"
video_file="$2"

# Arrays to hold timestamps and titles
timestamps=()
titles=()

# Read the markdown file
while read -r line; do
    if [[ "$line" =~ ^###[[:space:]]([0-9]{1,2}:[0-9]{2}(:[0-9]{2})?)[[:space:]]-[[:space:]](.*)$ ]]; then
        timestamp="${BASH_REMATCH[1]}"
        title="${BASH_REMATCH[3]}"
        timestamps+=("$timestamp")
        titles+=("$title")
    fi
done < "$markdown_file"

# Check if we have any chapters
if [ ${#timestamps[@]} -eq 0 ]; then
    echo "No chapters found in $markdown_file"
    exit 1
fi

# Get total duration of the video in seconds
total_duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$video_file")
total_duration_seconds=$(printf "%.0f" "$total_duration")

# Function to convert timestamp to seconds
timestamp_to_seconds() {
    local time_str="$1"
    local h=0
    local m=0
    local s=0
    IFS=':' read -r -a time_parts <<< "$time_str"
    if [ ${#time_parts[@]} -eq 3 ]; then
        h="${time_parts[0]}"
        m="${time_parts[1]}"
        s="${time_parts[2]}"
    elif [ ${#time_parts[@]} -eq 2 ]; then
        h=0
        m="${time_parts[0]}"
        s="${time_parts[1]}"
    else
        echo "Invalid time format: $time_str"
        exit 1
    fi
    total_seconds=$((10#$h * 3600 + 10#$m * 60 + 10#$s))
    echo "$total_seconds"
}

# Function to sanitize titles for filenames
sanitize() {
    local s="$1"
    s="$(echo "$s" | tr '[:upper:]' '[:lower:]')"  # Convert to lowercase
    s="$(echo "$s" | sed 's/[^a-z0-9]/-/g')"       # Replace non-alphanumerics with dashes
    s="$(echo "$s" | sed 's/--*/-/g')"             # Replace multiple dashes with a single dash
    s="$(echo "$s" | sed 's/^-//' | sed 's/-$//')" # Trim leading and trailing dashes
    echo "$s"
}

# Loop over chapters
num_chapters=${#timestamps[@]}

for ((i=0; i<num_chapters; i++)); do
    start_time="${timestamps[i]}"
    title="${titles[i]}"
    sanitized_title="$(sanitize "$title")"
    start_seconds=$(timestamp_to_seconds "$start_time")

    if [ $i -lt $((num_chapters - 1)) ]; then
        end_time="${timestamps[i+1]}"
        end_seconds=$(timestamp_to_seconds "$end_time")
    else
        end_seconds=$total_duration_seconds
    fi

    duration_seconds=$((end_seconds - start_seconds))

    if [ $duration_seconds -le 0 ]; then
        echo "Invalid duration for clip: $title"
        continue
    fi

    # Now, use ffmpeg to extract the clip
    output_file="${sanitized_title}.mp4"
    echo "Extracting clip: $output_file (Start: $start_time, Duration: $duration_seconds seconds)"
    ffmpeg -y -ss "$start_time" -i "$video_file" -t "$duration_seconds" -c copy "$output_file"
done
