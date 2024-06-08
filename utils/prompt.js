const titles = {
  prompt: "Write 3 potential titles for the video.\n",
  example: "## Potential Titles\n\n1. Title I - Title Hard\n\n2. Title II - Title Harder\n\n3. Title II - Title Hard with a Vengeance\n",
}

const summary = {
  prompt: "Write a one sentence summary of the transcript and a one paragraph summary. The one sentence summary shouldn't exceed 180 characters (roughly 30 words). The one paragraph summary should be approximately 600-1200 characters (roughly 100-200 words).\n",
  example: "## Episode Summary\n\nOne sentence summary which doesn't exceed 180 characters (or roughly 30 words).\n\ntl;dr: One paragraph summary which doesn't exceed approximately 600-1200 characters (or roughly 100-200 words)\n",
}

const chapters = {
  prompt: "Create chapters based on the topics discussed throughout. Include timestamps for when these chapters begin. Chapters shouldn't be shorter than 1-2 minutes or longer than 5-6 minutes. Write a one paragraph description for each chapter that's at least 100 words or longer. Note the very last timestamp and make sure the chapters extend to the end of the episode.\n",
  example: "## Chapters\n\n00:00 - Introduction and Beginning of Episode\n\nThe episode starts with a discussion on the importance of creating and sharing projects.\n\n02:56 - Guest Introduction and Background\n\nIntroduction of guests followed by host discussing the guests' background and journey.\n",
}

const takeaways = {
  prompt: "Include three key takeaways the listener should get from the episode.",
  example: "## Key Takeaways\n\n1. Key takeaway goes here\n2. Another key takeaway goes here\n3. The final key takeaway goes here",
}

export const PROMPT = `This is a transcript with timestamps.

${titles.prompt}
${summary.prompt}
${chapters.prompt}
${takeaways.prompt}

Format the output like so:

${titles.example}
${summary.example}
${chapters.example}
${takeaways.example}

TRANSCRIPT ATTACHED
`

console.log(PROMPT)