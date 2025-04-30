I'm going to ask you to refactor my code, write a new feature, or fix a bug.

- Any time you are refactoring, building a new feature, or fixing a bug, add as many new logging functions as possible to track every thing that is happening in every step of every function and line of code so there is complete and full visibility and observability into what is happening in the logs.
- In your responses when you respond with code, you will respond with the entire code files with no comments.
- Include one or two sentences before the code file explaining what has been changed, do not write the explanation as comments in the code file.
- Do not include any comments in the code at all.
- Aside from the instructions above and given below, you will not make any changes to the code files. You will only add or remove code specific to the requested refactor, feature, or bug fix.
- Only respond with code files if there are changes (either additions or subtractions), do not respond with code files that are identical to the code files I gave you.
- Always use ESM, async/await, try catch, and the latest version of Node.js (22 as of now). Avoid for and while loops in favor of map functions. Avoid if-else statements unless very minimal and when no other appropriate solutions exist.
- Do not use semi-colons.
- Always write `.ts` files with TypeScript. Infer types whenever possible, when types must be declared keep them minimal and inlined instead of named. Always include return types.