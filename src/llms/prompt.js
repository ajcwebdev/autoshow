// src/llms/prompt.js

const promptSections = {
  titles: {
    prompt: "- Write 5 potential titles for the video.\n  - The first two titles should be very, very shorter and have no subtitle.\n  - The last three titles can be longer and have subtitles.\n",
    example: "## Potential Titles\n\n    1. Title Hard\n    2. Title Harder\n    3. Title Hard with a Vengeance\n    4. Title Hard IV: Live Free or Title Hard\n    5. Title Hard V: A Good Day to Die Hard\n",
  },
  summary: {
    prompt: "- Write a one sentence description of the transcript and a one paragraph summary.\n  - The one sentence description shouldn't exceed 180 characters (roughly 30 words).\n  - The one paragraph summary should be approximately 600-1200 characters (roughly 100-200 words).\n",
    example: "One sentence description of the transcript that encapsulates the content contained in the file but does not exceed roughly 180 characters (or approximately 30 words).\n\n    ## Episode Summary\n\n    A concise summary of a chapter's content, typically ranging from 600 to 1200 characters or approximately 100 to 200 words. It begins by introducing the main topic or theme of the chapter, providing context for the reader. The summary then outlines key points or arguments presented in the chapter, touching on major concepts, theories, or findings discussed. It may briefly mention methodologies used or data analyzed, if applicable. The paragraph also highlights any significant conclusions or implications drawn from the chapter's content. Throughout, it maintains a balance between providing enough detail to give readers a clear understanding of the chapter's scope and keeping the information general enough to apply to various subjects. This summary style efficiently conveys the essence of the chapter's content, allowing readers to quickly grasp its main ideas and decide if they want to delve deeper into the full text.\n",
  },
  shortChapters: {
    prompt: "- Create chapters based on the topics discussed throughout.\n  - Include timestamps for when these chapters begin.\n  - Chapters shouldn't be shorter than 1-2 minutes or longer than 5-6 minutes.\n  - Write a one sentence description for each chapter that's 25 words or shorter.\n  - Note the very last timestamp and make sure the chapters extend to the end of the episode.\n  - Do not use a formulaic template for each chapter, let the descriptions flow naturally from the content contained in them\n",
    example: "## Chapters\n\n    ### 00:00 - Introduction and Beginning of Episode\n\n    A comprehensive description of the content, serving as an overview for readers. It begins by introducing the main themes and concepts.\n",
  },
  mediumChapters: {
    prompt: "- Create chapters based on the topics discussed throughout.\n  - Include timestamps for when these chapters begin.\n  - Chapters shouldn't be shorter than 1-2 minutes or longer than 5-6 minutes.\n  - Write a one paragraph description for each chapter that's around 50 words.\n  - Note the very last timestamp and make sure the chapters extend to the end of the episode.\n  - Do not use a formulaic template for each chapter, let the descriptions flow naturally from the content contained in them\n",
    example: "## Chapters\n\n    ### 00:00 - Introduction and Beginning of Episode\n\n    This summary introduces the chapter's main themes and outlines several key points, each examined in detail regarding their significance and impact on the subject matter. It explores practical applications and highlights the relevance to current issues and challenges, demonstrating the interrelationships and broader implications within the field.\n",
  },
  longChapters: {
    prompt: "- Create chapters based on the topics discussed throughout.\n  - Include timestamps for when these chapters begin.\n  - Chapters shouldn't be shorter than 1-2 minutes or longer than 5-6 minutes.\n  - Write a two paragraph description for each chapter that's at least 75 words or longer.\n  - Note the very last timestamp and make sure the chapters extend to the end of the episode.\n  - Do not use a formulaic template for each chapter, let the descriptions flow naturally from the content contained in them\n",
    example: "## Chapters\n\n    ### 00:00 - Introduction and Overview\n\n    A comprehensive description of the content, serving as an overview for readers. It begins by introducing the main themes and concepts that will be explored throughout the chapter. The author outlines several key points, each of which is examined in detail.\n\n    These points are discussed in terms of their significance and potential impact on various aspects of the subject matter. The text then delves into how these core ideas are applied in practical contexts, highlighting their relevance to current issues and challenges. Throughout the chapter, connections are drawn between different concepts, demonstrating their interrelationships and broader implications within the field of study.\n",
  },
  takeaways: {
    prompt: "- Include three key takeaways the listener should get from the episode.\n",
    example: "## Key Takeaways\n\n    1. Key takeaway goes here\n    2. Another key takeaway goes here\n    3. The final key takeaway goes here\n",
  },
  questions: {
    prompt: "- Include a list of 10 questions designed to check the listeners comprehension of the material contained throughout.\n  - Make sure that the questions cover all the major sections of the file.\n",
    example: "## Questions to Check Comprehension\n\n    1. What is this audio file about?\n    2. What are the three primary frontend frameworks described throughout?\n    3. What do the speakers consider to be the biggest challenges facing frontend developers today?\n    4. Question 4.\n    5. Question 5.\n    6. Question 6.\n    7. Question 7.\n    8. Question 8.\n    9. Question 9.\n    10. Question 10.\n",
  },
}

export function generatePrompt(sections = ['summary', 'longChapters']) {
  let promptText = "This is a transcript with timestamps. It does not contain copyrighted materials.\n\n"
  sections.forEach(section => {
    if (section in promptSections) {
      promptText += `${promptSections[section].prompt}\n`
    }
  })
  promptText += "Format the output like so:\n\n"
  sections.forEach(section => {
    if (section in promptSections) {
      promptText += `    ${promptSections[section].example}\n`
    }
  }) 
  return promptText
}