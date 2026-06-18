import type { ArticleContent } from '../../contentTypes';

export const developersOverviewContent: ArticleContent = {
  blocks: [
    { type: 'heading', id: 'overview', level: 2, text: 'Developer guide' },
    {
      type: 'paragraph',
      text: 'These docs are for developers building on top of VerifyWise. They cover how to connect your own systems to the platform, with quickstarts, how things behave and API references. For step-by-step help using the screens, see the product guides instead.',
    },
    { type: 'heading', id: 'whats-here', level: 2, text: "What's covered today" },
    {
      type: 'paragraph',
      text: 'Right now the guide covers Agent Control: how to connect an agent so its tool calls are checked before they run.',
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'More guides are coming',
      text: 'This section will grow to cover other developer topics, such as routing model calls through the LLM proxy and the public API. For now, start with Agent Control below.',
    },
    { type: 'heading', id: 'agent-control', level: 2, text: 'Agent Control' },
    {
      type: 'paragraph',
      text: 'Agent Control governs what your agent does. Read these in order, or jump to the API reference when you need a specific endpoint.',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Agent Control: how it works', text: 'What Agent Control governs and the two ways to connect an agent.' },
        { bold: 'Connect your agent', text: 'Get a tool call checked in about 5 minutes with the bundled hook.' },
        { bold: 'Governing tool calls', text: 'The four decisions, approval polling, run correlation and fail-modes.' },
        { bold: 'API reference', text: 'Endpoints, headers, auth and error codes for the tool-call hook.' },
      ],
    },
    {
      type: 'article-links',
      title: 'Start here',
      items: [
        {
          collectionId: 'developers',
          articleId: 'agent-control-overview',
          title: 'Agent Control: how it works',
          description: 'The concepts behind connecting an agent.',
        },
        {
          collectionId: 'developers',
          articleId: 'connect-your-agent',
          title: 'Connect your agent',
          description: 'The 5-minute quickstart.',
        },
      ],
    },
  ],
};
