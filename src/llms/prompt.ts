// src/llms/prompt.ts

import type { PromptSection } from '../types.js'

/**
 * Define the structure for different sections of the prompt
 * @type {Record<string, PromptSection>}
 */
const sections = {
  // Section for generating titles
  titles: {
    // Instructions for the AI model on how to generate titles
    instruction: `- Write 5 potential titles for the video.
  - The first two titles should be very, very shorter and have no subtitle.
  - The last three titles can be longer and have subtitles.\n`,
    // Example of how the output should be formatted
    example: `## Potential Titles
      
    1. Title Hard
    2. Title Harder
    3. Title Hard with a Vengeance
    4. Title Hard IV: Live Free or Title Hard
    5. Title Hard V: A Good Day to Die Hard\n`,
  },

  // Section for generating a summary
  summary: {
    // Instructions for creating a concise summary
    instruction: `- Write a one sentence description of the transcript and a one paragraph summary.
  - The one sentence description shouldn't exceed 180 characters (roughly 30 words).
  - The one paragraph summary should be approximately 600-1200 characters (roughly 100-200 words).\n`,
    // Example of the expected output format
    example: `One sentence description of the transcript that encapsulates the content contained in the file but does not exceed roughly 180 characters (or approximately 30 words).

    ## Episode Summary

    A concise summary of a chapter's content, typically ranging from 600 to 1200 characters or approximately 100 to 200 words. It begins by introducing the main topic or theme of the chapter, providing context for the reader. The summary then outlines key points or arguments presented in the chapter, touching on major concepts, theories, or findings discussed. It may briefly mention methodologies used or data analyzed, if applicable. The paragraph also highlights any significant conclusions or implications drawn from the chapter's content. Throughout, it maintains a balance between providing enough detail to give readers a clear understanding of the chapter's scope and keeping the information general enough to apply to various subjects. This summary style efficiently conveys the essence of the chapter's content, allowing readers to quickly grasp its main ideas and decide if they want to delve deeper into the full text.\n`,
  },

  // Section for creating short chapter descriptions
  shortChapters: {
    // Instructions for generating concise chapter summaries
    instruction: `- Create chapters based on the topics discussed throughout.
  - Include timestamps for when these chapters begin.
  - Chapters should be roughly 3-6 minutes long.
  - Write a one-sentence description for each chapter (max 25 words).
  - Ensure chapters cover the entire content (note the last timestamp).
  - Let descriptions flow naturally from the content, avoiding formulaic templates.\n`,
    // Example of the expected output format
    example: `## Chapters

    ### 00:00 - Introduction and Beginning of Episode
      
    A comprehensive description of the content, serving as an overview for readers. It begins by introducing the main themes and concepts.\n`,
  },

  // Section for creating medium-length chapter descriptions
  mediumChapters: {
    // Instructions for generating more detailed chapter summaries
    instruction: `- Create chapters based on the topics discussed throughout.
  - Include timestamps for when these chapters begin.
  - Chapters should be roughly 3-6 minutes long.
  - Write a one-paragraph description for each chapter (~50 words).
  - Ensure chapters cover the entire content (note the last timestamp).
  - Let descriptions flow naturally from the content, avoiding formulaic templates.\n`,
    // Example of the expected output format
    example: `## Chapters

    ### 00:00 - Introduction and Beginning of Episode
      
    This summary introduces the chapter's main themes and outlines several key points, each examined in detail regarding their significance and impact on the subject matter. It explores practical applications and highlights the relevance to current issues and challenges, demonstrating the interrelationships and broader implications within the field.\n`,
  },

  // Section for creating detailed, long chapter descriptions
  longChapters: {
    // Instructions for generating comprehensive chapter summaries
    instruction: `- Create chapters based on the topics discussed throughout.
  - Include timestamps for when these chapters begin.
  - Chapters should be roughly 3-6 minutes long.
  - Write a two-paragraph description for each chapter (75+ words).
  - Ensure chapters cover the entire content (note the last timestamp).
  - Let descriptions flow naturally from the content, avoiding formulaic templates.\n`,
    // Example of the expected output format
    example: `## Chapters

    ### 00:00 - Introduction and Overview
      
    A comprehensive description of the content, serving as an overview for readers. It begins by introducing the main themes and concepts that will be explored throughout the chapter. The author outlines several key points, each of which is examined in detail. These points are discussed in terms of their significance and potential impact on various aspects of the subject matter. The text then delves into how these core ideas are applied in practical contexts, highlighting their relevance to current issues and challenges. Throughout the chapter, connections are drawn between different concepts, demonstrating their interrelationships and broader implications within the field of study.\n`,
  },

  // Section for highlighting key takeaways
  takeaways: {
    // Instructions for summarizing main points
    instruction: `- Include three key takeaways the listener should get from the episode.\n`,
    // Example of how the takeaways should be formatted
    example: `## Key Takeaways

    1. Full-stack development requires a broad understanding of both client-side and server-side technologies, enabling developers to create more cohesive and efficient web applications.
    2. Modern front-end frameworks like React and Vue.js have revolutionized UI development, emphasizing component-based architecture and reactive programming paradigms.
    3. Backend technologies like Node.js and cloud services have made it easier to build scalable, high-performance web applications, but require careful consideration of security and data management practices.\n`,
  },

  // Section for generating comprehension questions
  questions: {
    // Instructions for creating relevant questions about the content
    instruction: `- Include a list of 10 questions to check the listeners' comprehension of the material.
  - Ensure questions cover all major sections of the content.\n`,
    // Example of how the questions should be formatted
    example: `## Questions to Check Comprehension

    1. What are the three main components of the modern web development stack?
    2. How has the role of JavaScript evolved in web development over the past decade?
    3. What are the key differences between React and Vue.js?
    4. Why is server-side rendering beneficial for web applications?
    5. What is the purpose of a RESTful API in full-stack development?
    6. How does Node.js differ from traditional server-side languages like PHP or Python?
    7. What are the main considerations when choosing a database for a web application?
    8. How do containerization technologies like Docker impact web development and deployment?
    9. What role does responsive design play in modern web development?
    10. How can developers ensure the security of user data in web applications?\n`,
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