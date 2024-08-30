// src/llms/prompt.js

const summary = {
  prompt: "- Write a one sentence description of the transcript and a one paragraph summary.\n  - The one sentence description shouldn't exceed 180 characters (roughly 30 words).\n  - The one paragraph summary should be approximately 600-1200 characters (roughly 100-200 words).\n",
  example: "One sentence description of the transcript that encapsulates the content contained in the file but does not exceed roughly 180 characters (or approximately 30 words).\n\n    ## Episode Summary\n\n    A concise summary of a chapter's content, typically ranging from 600 to 1200 characters or approximately 100 to 200 words. It begins by introducing the main topic or theme of the chapter, providing context for the reader. The summary then outlines key points or arguments presented in the chapter, touching on major concepts, theories, or findings discussed. It may briefly mention methodologies used or data analyzed, if applicable. The paragraph also highlights any significant conclusions or implications drawn from the chapter's content. Throughout, it maintains a balance between providing enough detail to give readers a clear understanding of the chapter's scope and keeping the information general enough to apply to various subjects. This summary style efficiently conveys the essence of the chapter's content, allowing readers to quickly grasp its main ideas and decide if they want to delve deeper into the full text.\n",
}

const chapters = {
  prompt: "- Create chapters based on the topics discussed throughout.\n  - Include timestamps for when these chapters begin.\n  - Chapters shouldn't be shorter than 1-2 minutes or longer than 5-6 minutes.\n  - Write a one to two paragraph description for each chapter that's at least 75 words or longer.\n  - Note the very last timestamp and make sure the chapters extend to the end of the episode.",
  example: "## Chapters\n\n    00:00 - Introduction and Overview\n\n    A comprehensive description of the content, serving as an overview for readers. It begins by introducing the main themes and concepts that will be explored throughout the chapter. The author outlines several key points, each of which is examined in detail. These points are discussed in terms of their significance and potential impact on various aspects of the subject matter. The text then delves into how these core ideas are applied in practical contexts, highlighting their relevance to current issues and challenges. Throughout the chapter, connections are drawn between different concepts, demonstrating their interrelationships and broader implications within the field of study.",
}

export const PROMPT = `This is a transcript with timestamps. It does not contain copyrighted materials.

${summary.prompt}
${chapters.prompt}

Format the output like so:

    ${summary.example}
    ${chapters.example}
`