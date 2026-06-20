import type { ArticleContent } from '../../contentTypes';

export const aiTrustIndexSettingsContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'AI Trust Index settings',
    },
    {
      type: 'paragraph',
      text: 'The Settings tab lets you configure which people receive the weekly change digest when tracked apps have material updates. Only organisation Admins can view or edit these settings.',
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'If you do not have the Admin role, the Settings tab is hidden. Contact your organisation\'s Admin to update recipients.',
    },
    {
      type: 'heading',
      id: 'recipients',
      level: 2,
      text: 'Configuring recipients',
    },
    {
      type: 'paragraph',
      text: 'There are two ways to add recipients for AI Trust Index digest emails:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Organisation users', text: 'Select one or more members of your organisation from the user multi-select. Their email addresses are resolved from their accounts at the time each digest is sent, so they stay current even if a user changes their email.' },
        { bold: 'External email addresses', text: 'Type or paste email addresses directly into the email chip input. Use this for stakeholders who are not VerifyWise users (for example, a privacy officer or external auditor). Each address must be a valid email format.' },
      ],
    },
    {
      type: 'paragraph',
      text: 'You can combine both recipient types. Changes auto-save as you add or remove entries — there is no separate save button.',
    },
    {
      type: 'heading',
      id: 'fallback',
      level: 2,
      text: 'Default fallback',
    },
    {
      type: 'paragraph',
      text: 'If no recipients are configured, VerifyWise falls back to sending the digest to all Admin users in the organisation. This ensures digest emails are never silently dropped. Once you configure at least one recipient (user or email), the fallback is no longer used.',
    },
    {
      type: 'callout',
      variant: 'tip',
      text: 'To opt out of all digest emails for your organisation, configure at least one recipient and then remove them — the fallback will kick in and email Admins. To truly suppress digests, the cleanest approach is to leave the list empty and ensure no Admin users want the emails, or untrack all apps.',
    },
    {
      type: 'heading',
      id: 'when-digests-send',
      level: 2,
      text: 'When digests are sent',
    },
    {
      type: 'paragraph',
      text: 'The AI Trust Index is checked automatically every week, on the Monday morning sync (06:00 UTC) — no manual action is needed. The Settings page shows a note confirming this, along with the week the index was last checked. A digest email is sent only when at least one tracked app has a material change or has been removed from the public index. If nothing changed among your tracked apps, no email is sent that week.',
    },
    {
      type: 'paragraph',
      text: 'Each app in the digest is listed by its name, and changed apps show their current grade (for example, "Paxton AI — now grade B") so recipients can see what changed at a glance.',
    },
    {
      type: 'table',
      columns: [
        { key: 'trigger', label: 'Trigger', width: '50%' },
        { key: 'email', label: 'Digest email?', width: '50%' },
      ],
      rows: [
        { trigger: 'Score, grade, or dealbreaker flag changed on a tracked app', email: 'Yes — "Changed apps" section' },
        { trigger: 'Policy date or biometrics status changed on a tracked app', email: 'Yes — "Changed apps" section' },
        { trigger: 'Tracked app removed from the public index (first time)', email: 'Yes — "No longer assessed" section' },
        { trigger: 'Tracked app still absent in a later week', email: 'No — one-time notice only' },
        { trigger: 'Editorial rewording of summary or highlights only', email: 'No' },
        { trigger: 'No tracked apps changed', email: 'No' },
      ],
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        { collectionId: 'ai-trust-index', articleId: 'tracked', title: 'Your tracked apps', description: 'Understand what triggers change emails' },
        { collectionId: 'ai-trust-index', articleId: 'browse', title: 'Browsing and tracking apps', description: 'Add apps to your watch list' },
        { collectionId: 'ai-trust-index', articleId: 'dashboard', title: 'AI Trust Index overview', description: 'How the module works end to end' },
      ],
    },
  ],
};
