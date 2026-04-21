import type { ArticleContent } from '../../contentTypes';

export const leaderboardContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'What is the leaderboard?',
    },
    {
      type: 'paragraph',
      text: 'The leaderboard ranks models based on their performance in arena comparisons. Every time you run a head-to-head battle in the Arena, the results feed into the leaderboard so you can see which models perform best over time.',
    },
    {
      type: 'heading',
      id: 'accessing',
      level: 2,
      text: 'Viewing the leaderboard',
    },
    {
      type: 'paragraph',
      text: 'Click **Leaderboard** in the LLM Evals sidebar. The leaderboard is organization-scoped, so it shows rankings from all arena comparisons run by anyone in your org.',
    },
    {
      type: 'heading',
      id: 'rankings',
      level: 2,
      text: 'How rankings work',
    },
    {
      type: 'paragraph',
      text: 'Rankings are calculated from arena comparison results. When a judge model evaluates two responses, the winner gets a higher ranking. Models that win more often rise to the top.',
    },
    {
      type: 'paragraph',
      text: 'The leaderboard shows each model\'s win rate, total comparisons and average scores across evaluation criteria like helpfulness, accuracy and coherence.',
    },
    {
      type: 'heading',
      id: 'using-rankings',
      level: 2,
      text: 'Using the leaderboard',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Identify which models consistently outperform others on your specific prompts' },
        { text: 'Track how model performance changes as you add more arena comparisons' },
        { text: 'Use ranking data to justify model selection decisions in compliance documentation' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      text: 'Run arena comparisons across different prompt types to get a well-rounded picture of model performance. A model that excels at coding tasks might not rank as well on creative writing.',
    },
  ],
};
