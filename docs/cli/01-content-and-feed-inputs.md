# Content and Feed Inputs

## Outline

- [file - Process Single Audio or Video File](#file-process-single-audio-or-video-file)
- [video - Process Single Video URLs](#video-process-single-video-urls)
- [urls - Process Multiple Videos Specified in a URLs File](#urls-process-multiple-videos-specified-in-a-urls-file)
- [playlist - Process Multiple Videos in YouTube Playlist](#playlist-process-multiple-videos-in-youtube-playlist)
- [channel - Process All Videos from a YouTube Channel](#channel-process-all-videos-from-a-youtube-channel)
- [rss - Process Podcast RSS Feed](#rss-process-podcast-rss-feed)

If you want to keep the downloaded audio file for debugging or reprocessing purposes, use `--saveAudio`. This prevents the CLI from deleting WAV files after finishing its run.

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --saveAudio
```

## file - Process Single Audio or Video File

Run on `audio.mp3` on the `content` directory:

```bash
npm run as -- --file "content/audio.mp3"
```

## video - Process Single Video URLs

Run on a single YouTube video.

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk"
```

## urls - Process Multiple Videos Specified in a URLs File

Run on an arbitrary list of URLs in `example-urls.md`.

```bash
npm run as -- --urls "content/example-urls.md"
```

Run on URLs file and generate JSON info file with markdown metadata of each video:

```bash
npm run as -- --info --urls "content/example-urls.md"
```

## playlist - Process Multiple Videos in YouTube Playlist

Run on multiple YouTube videos in a playlist.

```bash
npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"
```

Run on playlist URL and generate JSON info file with markdown metadata of each video in the playlist:

```bash
npm run as -- --info --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"
```

## channel - Process All Videos from a YouTube Channel

Process all videos from a YouTube channel (both live and non-live):

```bash
npm run as -- --channel "https://www.youtube.com/@ajcwebdev"
```

Process videos starting from the oldest instead of newest:

```bash
npm run as -- --channel "https://www.youtube.com/@ajcwebdev" --order oldest
```

Process a certain number of the most recent videos, for example the last three videos released on the channel:

```bash
npm run as -- --channel "https://www.youtube.com/@ajcwebdev" --last 1
```

Run on a YouTube channel and generate JSON info file with markdown metadata of each video:

```bash
npm run as -- --channel "https://www.youtube.com/@ajcwebdev" --info
```

## rss - Process Podcast RSS Feed

Process local XML file containing an RSS feed:

```bash
npm run as -- --rss "content/feed.xml"
```

Process RSS feed from newest to oldest (default behavior):

```bash
npm run as -- --rss "https://ajcwebdev.substack.com/feed"
```

Process RSS feed from oldest to newest:

```bash
npm run as -- --rss "https://feeds.transistor.fm/fsjam-podcast" --order oldest
```

Process a certain number of the most recent items, for example the last three episodes released on the feed:

```bash
npm run as -- --rss "https://feeds.transistor.fm/fsjam-podcast" --last 3
```

Process a single specific episode from a podcast RSS feed by providing the episode's audio URL with the `--item` option:

```bash
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --item "https://api.substack.com/feed/podcast/36236609/fd1f1532d9842fe1178de1c920442541.mp3"
```

Run on a podcast RSS feed and generate JSON info file with markdown metadata of each item:

```bash
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --info
```

Process multiple RSS feeds:

```bash
npm run as -- --rss "https://ajcwebdev.substack.com/feed" "https://feeds.transistor.fm/fsjam-podcast"
```

Process multiple RSS feeds listed in a `.md` file:

```bash
npm run as -- --rss "content/example-rss-feeds.md" --last 2
```

Download episodes from a specific number of previous days, for example to download episodes from the last 7 days:

```bash
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --lastDays 7
```

Download episodes from a specific date:

```bash
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --date 2021-05-10
```

Download episodes from multiple dates:

```bash
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --date 2021-05-10 2022-05-10
```

Download episodes from multiple dates on multiple RSS feeds:

```bash
npm run as -- \
  --rss "https://ajcwebdev.substack.com/feed" \
  "https://feeds.transistor.fm/fsjam-podcast" \
  --date 2021-05-10 2022-05-10
```