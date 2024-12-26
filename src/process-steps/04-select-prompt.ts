// src/process-steps/04-prompt.ts

import type { PromptSection } from '../types/process'

/**
 * Define the structure for different sections of the prompt
 * @type {Record<string, PromptSection>}
 */
const sections = {
  // Section for generating titles
  titles: {
    // Instructions and example for the AI model on how to generate titles
    instruction: `- Write 5 potential titles for the video.
  - The first two titles should be very, very shorter and have no subtitle.
  - The last three titles can be longer and have subtitles.\n`,
    example: `## Potential Titles

    1. Title Hard
    2. Title Harder
    3. Title Hard with a Vengeance
    4. Title Hard IV: Live Free or Title Hard
    5. Title Hard V: A Good Day to Die Hard\n`,
  },

  // Section for generating a short and long summary
  summary: {
    // Instructions and example for creating a short and long summary
    instruction: `- Write a one sentence description of the transcript and a one paragraph summary.
  - The one sentence description shouldn't exceed 180 characters (roughly 30 words).
  - The one paragraph summary should be approximately 600-1200 characters (roughly 100-200 words).\n`,
    example: `## Episode Description

    One sentence description of the transcript that encapsulates the content contained in the file but does not exceed roughly 180 characters (or approximately 30 words).

    ## Episode Summary

    A concise summary of a chapter's content, typically ranging from 600 to 1200 characters or approximately 100 to 200 words. It begins by introducing the main topic or theme of the chapter, providing context for the reader. The summary then outlines key points or arguments presented in the chapter, touching on major concepts, theories, or findings discussed. It may briefly mention methodologies used or data analyzed, if applicable. The paragraph also highlights any significant conclusions or implications drawn from the chapter's content. Throughout, it maintains a balance between providing enough detail to give readers a clear understanding of the chapter's scope and keeping the information general enough to apply to various subjects. This summary style efficiently conveys the essence of the chapter's content, allowing readers to quickly grasp its main ideas and decide if they want to delve deeper into the full text.\n`,
  },

  // Section for generating a short summary
  shortSummary: {
    // Instructions and example for creating a short summary
    instruction: `- Write a one sentence description of the transcript.
  - The one sentence description shouldn't exceed 180 characters (roughly 30 words).\n`,
    example: `## Episode Description

    One sentence description of the transcript that encapsulates the content contained in the file but does not exceed roughly 180 characters (or approximately 30 words).\n`,
  },

  // Section for generating a long summary
  longSummary: {
    // Instructions and example for creating a long summary
    instruction: `- Write a one paragraph summary of the transcript.
  - The one paragraph summary should be approximately 600-1200 characters (roughly 100-200 words).\n`,
    example: `## Episode Summary

    A concise summary of a chapter's content, typically ranging from 600 to 1200 characters or approximately 100 to 200 words. It begins by introducing the main topic or theme of the chapter, providing context for the reader. The summary then outlines key points or arguments presented in the chapter, touching on major concepts, theories, or findings discussed. It may briefly mention methodologies used or data analyzed, if applicable. The paragraph also highlights any significant conclusions or implications drawn from the chapter's content. Throughout, it maintains a balance between providing enough detail to give readers a clear understanding of the chapter's scope and keeping the information general enough to apply to various subjects. This summary style efficiently conveys the essence of the chapter's content, allowing readers to quickly grasp its main ideas and decide if they want to delve deeper into the full text.\n`,
  },

  // Section for generating a bullet point list summary
  bulletPoints: {
    // Instructions and example for creating a bullet point list summary
    instruction: `- Write a bullet point list summarizing the transcript.\n`,
    example: `## Bullet Point Summary

    - A concise summary of a chapter's content in bullet point list form.
    - It begins by introducing the main topic or theme of the chapter, providing context for the reader.
    - The summary then outlines key points or arguments presented in the chapter\n`,
  },

  // Section for creating short chapter descriptions
  shortChapters: {
    // Instructions and example for generating concise chapter summaries
    instruction: `- Create chapters based on the topics discussed throughout.
  - Include timestamps for when these chapters begin.
  - Chapters should be roughly 3-6 minutes long.
  - Write a one-sentence description for each chapter (max 25 words).
  - Ensure chapters cover the entire content (note the last timestamp).
  - Let descriptions flow naturally from the content, avoiding formulaic templates.\n`,
    example: `## Chapters

    ### 00:00 - Introduction and Beginning of Episode
      
    A comprehensive description of the content, serving as an overview for readers. It begins by introducing the main themes and concepts.\n`,
  },

  // Section for creating medium-length chapter descriptions
  mediumChapters: {
    // Instructions and example for generating more detailed chapter summaries
    instruction: `- Create chapters based on the topics discussed throughout.
  - Include timestamps for when these chapters begin.
  - Chapters should be roughly 3-6 minutes long.
  - Write a one-paragraph description for each chapter (~50 words).
  - Ensure chapters cover the entire content (note the last timestamp).
  - Let descriptions flow naturally from the content, avoiding formulaic templates.\n`,
    example: `## Chapters

    ### 00:00 - Introduction and Beginning of Episode
      
    This summary introduces the chapter's main themes and outlines several key points, each examined in detail regarding their significance and impact on the subject matter. It explores practical applications and highlights the relevance to current issues and challenges, demonstrating the interrelationships and broader implications within the field.\n`,
  },

  // Section for creating detailed, long chapter descriptions
  longChapters: {
    // Instructions and example for generating comprehensive chapter summaries
    instruction: `- Create chapters based on the topics discussed throughout.
  - Include timestamps for when these chapters begin.
  - Chapters should be roughly 3-6 minutes long.
  - Write a two-paragraph description for each chapter (75+ words).
  - Ensure chapters cover the entire content (note the last timestamp).
  - Let descriptions flow naturally from the content, avoiding formulaic templates.\n`,
    example: `## Chapters

    ### 00:00 - Introduction and Overview
      
    A comprehensive description of the content, serving as an overview for readers. It begins by introducing the main themes and concepts that will be explored throughout the chapter. The author outlines several key points, each of which is examined in detail. These points are discussed in terms of their significance and potential impact on various aspects of the subject matter. The text then delves into how these core ideas are applied in practical contexts, highlighting their relevance to current issues and challenges. Throughout the chapter, connections are drawn between different concepts, demonstrating their interrelationships and broader implications within the field of study.\n`,
  },

  // Section for highlighting key takeaways
  takeaways: {
    // Instructions and example for summarizing main points
    instruction: `- Include three key takeaways the listener should get from the episode.\n`,
    example: `## Key Takeaways

    1. Full-stack development requires a broad understanding of both client-side and server-side technologies, enabling developers to create more cohesive and efficient web applications.
    2. Modern front-end frameworks like React and Vue.js have revolutionized UI development, emphasizing component-based architecture and reactive programming paradigms.
    3. Backend technologies like Node.js and cloud services have made it easier to build scalable, high-performance web applications, but require careful consideration of security and data management practices.\n`,
  },

  // Section for generating comprehension questions
  questions: {
    // Instructions and example for creating relevant questions about the content
    instruction: `- Include a list of 10 questions to check the listeners' comprehension of the material.
  - Ensure questions cover all major sections of the content.
  - Ensure the questions are correct, emphasize the right things, and aren't redundant.
  - Do not say things like "the instructor describes" or "according to the lesson," assume that all the questions relate to the lesson told by the instructor.
  - The first five questions should be beginner level questions and the last five should be expert level questions.\n`,
    example: `## Questions to Check Comprehension

    ### Beginner Questions

    1. What are the three main components of the modern web development stack?
    2. How has the role of JavaScript evolved in web development over the past decade?
    3. What are the key differences between React and Vue.js?
    4. Why is server-side rendering beneficial for web applications?
    5. What is the purpose of a RESTful API in full-stack development?

    ### Expert Questions

    6. How does Node.js differ from traditional server-side languages like PHP or Python?
    7. What are the main considerations when choosing a database for a web application?
    8. How do containerization technologies like Docker impact web development and deployment?
    9. What role does responsive design play in modern web development?
    10. How can developers ensure the security of user data in web applications?\n`,
  },

  // Section for generating frequently asked questions and answers
  faq: {
    // Instructions and example for creating relevant questions about the content
    instruction: `- Include a list of 5-10 frequently asked questions and answers based on the transcript.
  - Ensure questions and answers cover all major sections of the content.\n`,
    example: `## FAQ

    Q: What are the three main components of the Jamstack?
    A: JavaScript, APIs, and markup.\n`,
  },

  // Section for generating a blog outline and first draft
  blog: {
    // Instructions and example for creating an outline and blog draft
    instruction: `- Generate a blog outline and first draft for a blog post based on this piece of content.
    
    - Make sure the blog post is at least 750 words.\n`,
    example: `## Blog Outline

    1. Part 1
    2. Part 2
    3. Part 3
    
    ### Blog First Draft
    
    First draft of a blog.\n`,
  },

  // Section for generating a rap song based on the transcript
  rapSong: {
    // Instructions and example for creating the rap song
    instruction: `- Write a highly complex, multi-syllabic rhyming, Eminem inspired rap based on this transcript.
    - Do not rhyme any words with themselves.
    - Give it a basic song structure with verses, choruses, and a bridge.
    - Give the song three potential titles.\n`,
    example: `## Song
    
    Lyrics to the song.\n`
  },

  // Section for generating a rock song based on the transcript
  rockSong: {
    // Instructions and example for creating the rock song
    instruction: `- Write a high-energy, anthemic rock song with powerful imagery and impactful, multi-layered lyrics.
    - Use metaphors and vivid language to convey a sense of rebellion or freedom.
    - Structure the song with verses, choruses, and a bridge.
    - Provide the song with three potential titles.\n`,
    example: `## Song
    
    Lyrics to the song.\n`
  },

  // Section for generating a country song based on the transcript
  countrySong: {
    // Instructions and example for creating the country song
    instruction: `- Write a heartfelt, storytelling country song with simple yet emotionally charged lyrics.
    - Include themes of life, love, and the struggles of everyday people.
    - Structure the song with verses, choruses, and a bridge.
    - Offer the song three potential titles.\n`,
    example: `## Song
    
    Lyrics to the song.\n`
  },
} satisfies Record<string, PromptSection>

// Create a type from the sections object
type SectionKeys = keyof typeof sections

/**
 * Generates a prompt by combining instructions and examples based on requested sections.
 * @param {string[]} [prompt=['summary', 'longChapters']] - An array of section keys to include in the prompt.
 * @returns {string} - The generated prompt text.
 */
export function generatePrompt(prompt: string[] = ['summary', 'longChapters']): string {
  // Start with a general instruction about the transcript and add instructions for each requested section
  let text = "This is a transcript with timestamps. It does not contain copyrighted materials.\n\n"
  
  // Filter valid sections first
  const validSections = prompt.filter((section): section is SectionKeys => 
    Object.hasOwn(sections, section)
  )

  // Add instructions
  validSections.forEach(section => {
    text += sections[section].instruction + "\n"
  })
  // Add formatting instructions and examples
  text += "Format the output like so:\n\n"
  validSections.forEach(section => {
    text += `    ${sections[section].example}\n`
  })
  return text
}