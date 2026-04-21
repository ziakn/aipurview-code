import type { ArticleContent } from '../../contentTypes';

export const playgroundContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'What is the playground?',
    },
    {
      type: 'paragraph',
      text: 'The playground is a chat interface where you can talk to any model you\'ve configured in your organization. It\'s useful for quick testing before you set up a formal experiment.',
    },
    {
      type: 'heading',
      id: 'accessing',
      level: 2,
      text: 'Accessing the playground',
    },
    {
      type: 'paragraph',
      text: 'Click **Playground** in the LLM Evals sidebar. The playground doesn\'t require a project to be selected, so you can use it at any time.',
    },
    {
      type: 'heading',
      id: 'chatting',
      level: 2,
      text: 'Chatting with a model',
    },
    {
      type: 'paragraph',
      text: 'Pick a provider and model from the dropdown at the top. Type your message in the input field and press Enter or click **Send**. The model\'s response streams back in real time.',
    },
    {
      type: 'paragraph',
      text: 'You can send follow-up messages to continue the conversation. The full chat history is sent with each request, so the model has context from earlier turns.',
    },
    {
      type: 'heading',
      id: 'switching-models',
      level: 2,
      text: 'Switching models',
    },
    {
      type: 'paragraph',
      text: 'Change the model at any point using the dropdown. Switching models clears the current conversation and starts a fresh session.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'You need at least one API key configured in **Settings** before you can use the playground. If no keys are set up, the model selector will be empty.',
    },
    {
      type: 'heading',
      id: 'use-cases',
      level: 2,
      text: 'When to use it',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Test a model\'s behavior on specific prompts before building a full experiment' },
        { text: 'Compare how different models respond to the same question (switch models between chats)' },
        { text: 'Verify that a newly added API key works correctly' },
        { text: 'Explore model capabilities during evaluation planning' },
      ],
    },
  ],
};
