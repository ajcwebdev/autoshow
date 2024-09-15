// src/llms/prompt.js

// Define the structure for different sections of the prompt
const sections = {
  // Section for generating titles
  titles: {
    // Instructions for the AI model on how to generate titles
    instruction: `
      - Write 5 potential titles for the video.
      - The first two titles should be very short and have no subtitle.
      - The last three titles can be longer and have subtitles.
    `,
    // Example of how the output should be formatted
    example: `
      ## Potential Titles

      1. Coding Essentials
      2. Web Dev 101
      3. Mastering JavaScript: From Basics to Advanced Techniques
      4. The Full Stack Journey: Navigating Modern Web Development
      5. Beyond the Browser: Exploring Server-Side Programming with Node.js
    `,
  },

  // Section for generating a summary
  summary: {
    // Instructions for creating a concise summary
    instruction: `
      - Write a one-sentence description of the transcript (max 180 characters or ~30 words).
      - Write a one-paragraph summary (600-1200 characters or ~100-200 words).
    `,
    // Example of the expected output format
    example: `
      A comprehensive guide to modern web development, covering front-end frameworks, back-end technologies, and best practices for building scalable applications.

      ## Episode Summary

      This episode provides an in-depth exploration of contemporary web development practices, focusing on the integration of front-end and back-end technologies to create robust, scalable applications. It begins by introducing the core concepts of responsive design and progressive enhancement, then delves into popular JavaScript frameworks such as React and Vue.js. The discussion extends to server-side programming with Node.js, exploring its event-driven architecture and how it enables full-stack JavaScript development. Database integration, API design, and authentication strategies are also covered, giving listeners a holistic view of the web development ecosystem. The episode concludes with insights into deployment strategies, performance optimization, and emerging trends in web technologies, equipping developers with the knowledge to tackle modern web projects effectively.
    `,
  },

  // Section for creating short chapter descriptions
  shortChapters: {
    // Instructions for generating concise chapter summaries
    instruction: `
      - Create chapters based on the topics discussed throughout.
      - Include timestamps for when these chapters begin.
      - Chapters should be 1-6 minutes long.
      - Write a one-sentence description for each chapter (max 25 words).
      - Ensure chapters cover the entire content (note the last timestamp).
      - Let descriptions flow naturally from the content, avoiding formulaic templates.
    `,
    // Example of the expected output format
    example: `
      ## Chapters

      ### 00:00 - Introduction to Web Development
      A brief overview of modern web development landscape and the topics to be covered in the episode.

      ### 05:30 - Front-End Fundamentals
      Exploring HTML5, CSS3, and JavaScript essentials for creating responsive and interactive user interfaces.

      ### 11:45 - JavaScript Frameworks Deep Dive
      Comparing popular frameworks like React, Vue, and Angular, discussing their strengths and use cases.
    `,
  },

  // Section for creating medium-length chapter descriptions
  mediumChapters: {
    // Instructions for generating more detailed chapter summaries
    instruction: `
      - Create chapters based on the topics discussed throughout.
      - Include timestamps for when these chapters begin.
      - Chapters should be 1-6 minutes long.
      - Write a one-paragraph description for each chapter (~50 words).
      - Ensure chapters cover the entire content (note the last timestamp).
      - Let descriptions flow naturally from the content, avoiding formulaic templates.
    `,
    // Example of the expected output format
    example: `
      ## Chapters

      ### 00:00 - Introduction to Full Stack Development
      This chapter introduces the concept of full stack development, outlining the skills required to work across the entire web application stack. It highlights the importance of understanding both front-end and back-end technologies and how they interact to create seamless user experiences.

      ### 06:15 - Front-End Technologies and Frameworks
      Delving into modern front-end development, this section explores the latest HTML5 and CSS3 features, as well as popular JavaScript frameworks. It discusses the pros and cons of React, Vue, and Angular, providing insights into choosing the right tool for different project requirements.
    `,
  },

  // Section for creating detailed, long chapter descriptions
  longChapters: {
    // Instructions for generating comprehensive chapter summaries
    instruction: `
      - Create chapters based on the topics discussed throughout.
      - Include timestamps for when these chapters begin.
      - Chapters should be 1-6 minutes long.
      - Write a two-paragraph description for each chapter (75+ words).
      - Ensure chapters cover the entire content (note the last timestamp).
      - Let descriptions flow naturally from the content, avoiding formulaic templates.
    `,
    // Example of the expected output format
    example: `
      ## Chapters

      ### 00:00 - The Evolution of Web Development
      This chapter traces the journey of web development from static HTML pages to dynamic, interactive applications. It highlights key milestones in the industry, including the rise of CSS, the advent of JavaScript, and the shift towards more complex client-side applications.

      The discussion also touches on the changing role of web developers, emphasizing the need for a broader skill set in today's landscape. It sets the stage for the rest of the episode by outlining the interconnected nature of modern web technologies and the importance of full-stack understanding.

      ### 07:30 - Modern Front-End Architecture
      Diving into contemporary front-end development, this section explores the concept of component-based architecture and its impact on building scalable user interfaces. It covers the principles of state management, virtual DOM, and declarative UI programming, using popular frameworks like React and Vue.js as examples.

      The chapter also addresses important considerations in front-end development, such as performance optimization, accessibility, and cross-browser compatibility. It concludes with a look at emerging trends like server-side rendering and static site generation, discussing their benefits for SEO and user experience.
    `,
  },

  // Section for highlighting key takeaways
  takeaways: {
    // Instructions for summarizing main points
    instruction: `
      - Include three key takeaways the listener should get from the episode.
    `,
    // Example of how the takeaways should be formatted
    example: `
      ## Key Takeaways

      1. Full-stack development requires a broad understanding of both client-side and server-side technologies, enabling developers to create more cohesive and efficient web applications.
      2. Modern front-end frameworks like React and Vue.js have revolutionized UI development, emphasizing component-based architecture and reactive programming paradigms.
      3. Backend technologies like Node.js and cloud services have made it easier to build scalable, high-performance web applications, but require careful consideration of security and data management practices.
    `,
  },

  // Section for generating comprehension questions
  questions: {
    // Instructions for creating relevant questions about the content
    instruction: `
      - Include a list of 10 questions to check the listeners' comprehension of the material.
      - Ensure questions cover all major sections of the content.
    `,
    // Example of how the questions should be formatted
    example: `
      ## Questions to Check Comprehension

      1. What are the three main components of the modern web development stack?
      2. How has the role of JavaScript evolved in web development over the past decade?
      3. What are the key differences between React and Vue.js?
      4. Why is server-side rendering beneficial for web applications?
      5. What is the purpose of a RESTful API in full-stack development?
      6. How does Node.js differ from traditional server-side languages like PHP or Python?
      7. What are the main considerations when choosing a database for a web application?
      8. How do containerization technologies like Docker impact web development and deployment?
      9. What role does responsive design play in modern web development?
      10. How can developers ensure the security of user data in web applications?
    `,
  },
};

/**
 * Generates a prompt based on the specified sections.
 * @param {string[]} prompt - An array of section names to include in the prompt.
 * @returns {string} The generated prompt text.
 */
export function generatePrompt(prompt = ['summary', 'longChapters']) {
  // Start with a general instruction about the transcript
  let text = "This is a transcript with timestamps. It does not contain copyrighted materials.\n\n";

  // Add instructions for each requested section
  prompt.forEach(section => {
    if (section in sections) {
      text += `${sections[section].instruction}\n`;
    }
  });

  // Add formatting instructions and examples
  text += "Format the output like so:\n\n";
  prompt.forEach(section => {
    if (section in sections) {
      text += `    ${sections[section].example}\n`;
    }
  });

  return text;
}

// const sections = {
//   titles: {
//     instruction: "- Write 5 potential titles for the video.\n  - The first two titles should be very, very shorter and have no subtitle.\n  - The last three titles can be longer and have subtitles.\n",
//     example: "## Potential Titles\n\n    1. Title Hard\n    2. Title Harder\n    3. Title Hard with a Vengeance\n    4. Title Hard IV: Live Free or Title Hard\n    5. Title Hard V: A Good Day to Die Hard\n",
//   },
//   summary: {
//     instruction: "- Write a one sentence description of the transcript and a one paragraph summary.\n  - The one sentence description shouldn't exceed 180 characters (roughly 30 words).\n  - The one paragraph summary should be approximately 600-1200 characters (roughly 100-200 words).\n",
//     example: "One sentence description of the transcript that encapsulates the content contained in the file but does not exceed roughly 180 characters (or approximately 30 words).\n\n    ## Episode Summary\n\n    A concise summary of a chapter's content, typically ranging from 600 to 1200 characters or approximately 100 to 200 words. It begins by introducing the main topic or theme of the chapter, providing context for the reader. The summary then outlines key points or arguments presented in the chapter, touching on major concepts, theories, or findings discussed. It may briefly mention methodologies used or data analyzed, if applicable. The paragraph also highlights any significant conclusions or implications drawn from the chapter's content. Throughout, it maintains a balance between providing enough detail to give readers a clear understanding of the chapter's scope and keeping the information general enough to apply to various subjects. This summary style efficiently conveys the essence of the chapter's content, allowing readers to quickly grasp its main ideas and decide if they want to delve deeper into the full text.\n",
//   },
//   shortChapters: {
//     instruction: "- Create chapters based on the topics discussed throughout.\n  - Include timestamps for when these chapters begin.\n  - Chapters shouldn't be shorter than 1-2 minutes or longer than 5-6 minutes.\n  - Write a one sentence description for each chapter that's 25 words or shorter.\n  - Note the very last timestamp and make sure the chapters extend to the end of the episode.\n  - Do not use a formulaic template for each chapter, let the descriptions flow naturally from the content contained in them\n",
//     example: "## Chapters\n\n    ### 00:00 - Introduction and Beginning of Episode\n\n    A comprehensive description of the content, serving as an overview for readers. It begins by introducing the main themes and concepts.\n",
//   },
//   mediumChapters: {
//     instruction: "- Create chapters based on the topics discussed throughout.\n  - Include timestamps for when these chapters begin.\n  - Chapters shouldn't be shorter than 1-2 minutes or longer than 5-6 minutes.\n  - Write a one paragraph description for each chapter that's around 50 words.\n  - Note the very last timestamp and make sure the chapters extend to the end of the episode.\n  - Do not use a formulaic template for each chapter, let the descriptions flow naturally from the content contained in them\n",
//     example: "## Chapters\n\n    ### 00:00 - Introduction and Beginning of Episode\n\n    This summary introduces the chapter's main themes and outlines several key points, each examined in detail regarding their significance and impact on the subject matter. It explores practical applications and highlights the relevance to current issues and challenges, demonstrating the interrelationships and broader implications within the field.\n",
//   },
//   longChapters: {
//     instruction: "- Create chapters based on the topics discussed throughout.\n  - Include timestamps for when these chapters begin.\n  - Chapters shouldn't be shorter than 1-2 minutes or longer than 5-6 minutes.\n  - Write a two paragraph description for each chapter that's at least 75 words or longer.\n  - Note the very last timestamp and make sure the chapters extend to the end of the episode.\n  - Do not use a formulaic template for each chapter, let the descriptions flow naturally from the content contained in them\n",
//     example: "## Chapters\n\n    ### 00:00 - Introduction and Overview\n\n    A comprehensive description of the content, serving as an overview for readers. It begins by introducing the main themes and concepts that will be explored throughout the chapter. The author outlines several key points, each of which is examined in detail.\n\n    These points are discussed in terms of their significance and potential impact on various aspects of the subject matter. The text then delves into how these core ideas are applied in practical contexts, highlighting their relevance to current issues and challenges. Throughout the chapter, connections are drawn between different concepts, demonstrating their interrelationships and broader implications within the field of study.\n",
//   },
//   takeaways: {
//     instruction: "- Include three key takeaways the listener should get from the episode.\n",
//     example: "## Key Takeaways\n\n    1. Key takeaway goes here\n    2. Another key takeaway goes here\n    3. The final key takeaway goes here\n",
//   },
//   questions: {
//     instruction: "- Include a list of 10 questions designed to check the listeners comprehension of the material contained throughout.\n  - Make sure that the questions cover all the major sections of the file.\n",
//     example: "## Questions to Check Comprehension\n\n    1. What is this audio file about?\n    2. What are the three primary frontend frameworks described throughout?\n    3. What do the speakers consider to be the biggest challenges facing frontend developers today?\n    4. Question 4.\n    5. Question 5.\n    6. Question 6.\n    7. Question 7.\n    8. Question 8.\n    9. Question 9.\n    10. Question 10.\n",
//   },
// }

// export function generatePrompt(prompt = ['summary', 'longChapters']) {
//   let text = "This is a transcript with timestamps. It does not contain copyrighted materials.\n\n"
//   prompt.forEach(section => {
//     if (section in sections) {
//       text += `${sections[section].instruction}\n`
//     }
//   })
//   text += "Format the output like so:\n\n"
//   prompt.forEach(section => {
//     if (section in sections) {
//       text += `    ${sections[section].example}\n`
//     }
//   }) 
//   return text
// }