// src/utils/prompt.js

const titles = {
  prompt: "Write 3 potential titles for the video.\n",
  example: "## Potential Titles\n\n1. Title I - Title Hard\n\n2. Title II - Title Harder\n\n3. Title II - Title Hard with a Vengeance\n",
}

const summary = {
  prompt: "Write a one sentence summary of the transcript and a one paragraph summary. The one sentence summary shouldn't exceed 180 characters (roughly 30 words). The one paragraph summary should be approximately 600-1200 characters (roughly 100-200 words).\n",
  example: "## Episode Summary\n\nOne sentence summary which doesn't exceed 180 characters (or roughly 30 words).\n\ntl;dr: One paragraph summary which doesn't exceed approximately 600-1200 characters (or roughly 100-200 words)\n",
}

const shortChapters = {
  prompt: "Create chapters based on the topics discussed throughout. Include timestamps for when these chapters begin. Chapters shouldn't be shorter than 1-2 minutes or longer than 5-6 minutes. Write a one paragraph description for each chapter that's at least 50 words. Note the very last timestamp and make sure the chapters extend to the end of the episode.\n",
  example: "## Chapters\n\n00:00 - Introduction and Beginning of Episode\n\nThe episode starts with a discussion on the importance of creating and sharing projects.\n\n02:56 - Guest Introduction and Background\n\nIntroduction of guests followed by host discussing the guests' background and journey.\n",
}

const longChapters = {
  prompt: "Create chapters based on the topics discussed throughout. Include timestamps for when these chapters begin. Chapters shouldn't be shorter than 1-2 minutes or longer than 5-6 minutes. Write a one to two paragraph description for each chapter that's at least 75 words or longer. Note the very last timestamp and make sure the chapters extend to the end of the episode.\n",
  example: "## Chapters\n\n00:00 - Exploring Recent Trends in Technology\n\nIn this chapter, the conversation begins with an overview of the latest impactful trends in the technology sector. The host outlines significant advancements across various domains such as artificial intelligence, blockchain technology, and renewable energy sources. Each trend is discussed in relation to its potential to revolutionize industries, influence global economic structures, and drive sustainable practices worldwide. The dialogue further explores how these technological innovations are integrated into everyday business and personal life, emphasizing their roles in addressing complex challenges like climate change, privacy, and cybersecurity.\n\n02:56 - Deep Dive into Artificial Intelligence\n\nThis chapter offers a comprehensive analysis of artificial intelligence (AI), a cornerstone of modern technological innovation. The host, alongside expert guests, delves into the evolution of AI technologies, including sophisticated machine learning algorithms and complex neural networks. The discussion covers the integration of AI in various sectors such as healthcare, where it enhances diagnostic precision, finance, where it drives smarter investment strategies, and automotive, where it is pivotal in developing autonomous vehicles. Special attention is given to the ethical dimensions of AI deployment, particularly concerns regarding data privacy, algorithmic bias, and the future of employment in an increasingly automated world.\n",
}

const takeaways = {
  prompt: "Include three key takeaways the listener should get from the episode.\n",
  example: "## Key Takeaways\n\n1. Key takeaway goes here\n2. Another key takeaway goes here\n3. The final key takeaway goes here\n",
}

const questions = {
  prompt: "Include a list of 10 questions designed to check the listeners comprehension of the material contained throughout. Make sure that the questions cover all the major sections of the file.",
  example: "## Questions to Check Comprehension\n\n1. What is this audio file about?\n2. What are the three primary frontend frameworks described throughout?\n3. What do the speakers consider to be the biggest challenges facing frontend developers today?\n4. Question 4.\n5. Question 5.\n6. Question 6.\n7. Question 7.\n8. Question 8.\n9. Question 9.\n10. Question 10.",
}

export const PROMPT = `This is a transcript with timestamps.

${titles.prompt}
${summary.prompt}
${shortChapters.prompt}
${longChapters.prompt}
${takeaways.prompt}
${questions.prompt}

Format the output like so:

${titles.example}
${summary.example}
${shortChapters.example}
${longChapters.example}
${takeaways.example}
${questions.example}

TRANSCRIPT ATTACHED
`

console.log(PROMPT)