import type { ArticleContent } from '../../contentTypes';

export const reportsContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Evaluation reports',
    },
    {
      type: 'paragraph',
      text: 'The reports page lets you generate structured evaluation reports from your experiment results. Reports follow the EvalCards standard for AI evaluation documentation.',
    },
    {
      type: 'heading',
      id: 'generating',
      level: 2,
      text: 'Generating a report',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Go to the **Reports** tab in your project.' },
        { text: 'Click **Generate report** to open the configuration modal.' },
        { text: 'Give your report a title. The project name is pre-filled as a default.' },
        { text: 'Choose a format: **PDF** for a full document or **CSV** for raw data.' },
        { text: 'Select which completed experiments to include.' },
        { text: 'Pick the sections you want (evaluation context, metric results, safety assessment and more).' },
        { text: 'Click **Generate**. The report may take up to a minute to produce.' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'You need at least one completed experiment before you can generate a report. If none are available, the generate button will be disabled.',
    },
    {
      type: 'heading',
      id: 'report-sections',
      level: 2,
      text: 'Report sections',
    },
    {
      type: 'paragraph',
      text: 'When configuring a report, you can choose which sections to include. Options typically cover evaluation context, metric results, safety assessment, comparative analysis and methodology.',
    },
    {
      type: 'paragraph',
      text: 'You can also toggle **Include detailed samples** to add individual test case results, and **Include arena** to add arena comparison data if you\'ve run any.',
    },
    {
      type: 'heading',
      id: 'viewing',
      level: 2,
      text: 'Viewing and downloading reports',
    },
    {
      type: 'paragraph',
      text: 'PDF reports open in an inline viewer right on the page. From the viewer toolbar you can download the file or open it in a new browser tab. CSV reports download automatically.',
    },
    {
      type: 'paragraph',
      text: 'All generated reports appear in a history table below the generate button. The table shows the report title, format, number of experiments included, file size and creation date. Click any row to view a PDF or download a CSV.',
    },
    {
      type: 'heading',
      id: 'deleting',
      level: 2,
      text: 'Deleting reports',
    },
    {
      type: 'paragraph',
      text: 'Click the trash icon next to any report in the history table. You\'ll be asked to confirm before the report is permanently removed.',
    },
  ],
};
