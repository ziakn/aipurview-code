import type { ArticleContent } from '@user-guide-content/contentTypes';

export const useCasesContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'A use case describes how your organization applies an AI system to achieve a specific outcome. It is the central container in VerifyWise: everything else, including risks, frameworks, assessments, controls, vendors, and models, connects back to a use case.',
    },
    {
      type: 'paragraph',
      text: 'Each use case gets a unique identifier (UC-001, UC-002, etc.) and tracks the AI system from initial scoping through deployment and monitoring. You define its risk classification, assign an owner, link compliance frameworks, and build a risk register, all within a single view.',
    },
    {
      type: 'heading',
      id: 'creating-a-use-case',
      level: 2,
      text: 'Creating a use case',
    },
    {
      type: 'paragraph',
      text: 'Go to the Use cases page and click New use case. Before the form opens, you may see an optional screening step that asks whether the project involves AI. You can skip it or answer the questions. Either way, you land on the creation form.',
    },
    {
      type: 'heading',
      id: 'required-fields',
      level: 3,
      text: 'Required fields',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Title', text: 'A short name for the use case (up to 64 characters). Must be unique within your organization.' },
        { bold: 'Goal', text: 'What the AI system is meant to achieve (up to 256 characters).' },
        { bold: 'Owner', text: 'The person responsible for this use case. They receive an email notification when assigned.' },
        { bold: 'Start date', text: 'When work on the use case began or is expected to begin.' },
        { bold: 'AI risk classification', text: 'One of: Prohibited, High risk, Limited risk, or Minimal risk. This determines the level of oversight required under the EU AI Act.' },
        { bold: 'Type of high risk role', text: 'Your organization\'s role relative to the AI system: Deployer, Provider, Distributor, Importer, User, Product manufacturer, or Authorized representative.' },
        { bold: 'Geography', text: 'Where the AI system operates: Global, Europe, North America, South America, Asia, or Africa.' },
        { bold: 'Target industry', text: 'The sector in which the AI system is deployed.' },
      ],
    },
    {
      type: 'heading',
      id: 'optional-fields',
      level: 3,
      text: 'Optional fields',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Description', text: 'A longer explanation of the AI system and how it works.' },
        { bold: 'Members', text: 'Team members who need access. The owner is included automatically.' },
        { bold: 'Status', text: 'Defaults to "Not started." Other options: In progress, Under review, Completed, Closed, On hold, Rejected.' },
        { bold: 'Approval workflow', text: 'If your organization uses approval workflows, you can assign one here. Framework creation is deferred until the use case is approved.' },
      ],
    },
    {
      type: 'heading',
      id: 'frameworks',
      level: 3,
      text: 'Linking frameworks',
    },
    {
      type: 'paragraph',
      text: 'During creation you choose which compliance frameworks apply. VerifyWise supports EU AI Act, ISO 42001, ISO 27001, and NIST AI RMF out of the box, plus any plugin frameworks your organization has installed. You can add or remove frameworks later from the use case settings.',
    },
    {
      type: 'paragraph',
      text: 'Frameworks can be scoped to a single use case (project-based) or shared across the entire organization (organization-wide). Choose project-based when different AI systems face different regulatory requirements.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'If an approval workflow is assigned, framework creation is deferred until the use case is approved. You can still fill in basic fields while approval is pending.',
    },
    {
      type: 'heading',
      id: 'use-case-view',
      level: 2,
      text: 'Inside a use case',
    },
    {
      type: 'paragraph',
      text: 'Click any use case to open its detail view. The page is organized into tabs, each covering a different aspect of governance.',
    },
    {
      type: 'heading',
      id: 'overview-tab',
      level: 3,
      text: 'Overview tab',
    },
    {
      type: 'paragraph',
      text: 'Shows the use case metadata, which frameworks are linked, and a summary of risk levels. This is the landing tab when you open a use case.',
    },
    {
      type: 'heading',
      id: 'risks-tab',
      level: 3,
      text: 'Use case risks tab',
    },
    {
      type: 'paragraph',
      text: 'A dedicated risk register scoped to this use case. You can create, edit, and delete risks here. Each risk can be linked to specific framework controls and assessments. The tab shows a count badge so you can see how many risks exist at a glance.',
    },
    {
      type: 'paragraph',
      text: 'Risks created here also appear in the global Risk management page, where you can see them alongside risks from other use cases.',
    },
    {
      type: 'heading',
      id: 'linked-models-tab',
      level: 3,
      text: 'Linked models tab',
    },
    {
      type: 'paragraph',
      text: 'Shows which AI models from your model inventory are associated with this use case. You can link and unlink models here. This connection helps auditors understand which models power which business processes.',
    },
    {
      type: 'heading',
      id: 'frameworks-tab',
      level: 3,
      text: 'Frameworks and regulations tab',
    },
    {
      type: 'paragraph',
      text: 'Two sub-tabs here: Controls and Assessments. Controls tracks your compliance progress against each framework\'s requirements. Assessments tracks the questionnaire-style evaluations. Progress percentages are calculated automatically based on how many items are complete.',
    },
    {
      type: 'heading',
      id: 'settings-tab',
      level: 3,
      text: 'Settings tab',
    },
    {
      type: 'paragraph',
      text: 'Edit the use case\'s basic information, change ownership, manage team members, add or remove frameworks, and delete the use case. Every change is recorded in the audit trail.',
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Deleting a use case is permanent. Any pending approval requests are withdrawn automatically before deletion.',
    },
    {
      type: 'heading',
      id: 'approval-workflows',
      level: 2,
      text: 'Approval workflows',
    },
    {
      type: 'paragraph',
      text: 'If your organization requires sign-off before a use case can proceed, assign an approval workflow during creation. While the use case awaits approval:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'You can still edit basic fields (title, goal, description, status)' },
        { text: 'The Frameworks, Risks, and Linked models tabs are locked' },
        { text: 'Framework creation is deferred until approval is granted' },
        { text: 'If the use case is rejected, tabs remain locked and the status reflects the rejection' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Once approved, all deferred frameworks are created and every tab becomes available.',
    },
    {
      type: 'heading',
      id: 'list-view',
      level: 2,
      text: 'Managing the use case list',
    },
    {
      type: 'paragraph',
      text: 'The main use cases page shows all non-organizational use cases. You can customize how the list is displayed and find what you need quickly.',
    },
    {
      type: 'heading',
      id: 'filtering-and-search',
      level: 3,
      text: 'Filtering and search',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Search', text: 'Searches across use case title and UC ID.' },
        { bold: 'Filter by', text: 'Name, risk level, owner, status, or start date.' },
        { bold: 'Group by', text: 'Risk level, role, owner, or status. Groups can be collapsed and sorted.' },
        { bold: 'Column visibility', text: 'Toggle which columns appear in the table. Options include UC ID, title, risk classification, role, start date, and last updated.' },
      ],
    },
    {
      type: 'heading',
      id: 'export',
      level: 3,
      text: 'Exporting',
    },
    {
      type: 'paragraph',
      text: 'Export the full list to CSV or Excel. The export includes UC ID, title, risk level, role, start date, last updated, owner, and status.',
    },
    {
      type: 'heading',
      id: 'project-scope',
      level: 2,
      text: 'Project scope',
    },
    {
      type: 'paragraph',
      text: 'Each use case can have a detailed scope definition that captures technical and compliance characteristics of the AI system.',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'AI environment description', text: 'How the AI system is deployed and operated.' },
        { bold: 'Technology type', text: 'Machine learning, NLP, computer vision, or other categories.' },
        { bold: 'New AI technology', text: 'Whether the system uses novel or experimental AI approaches.' },
        { bold: 'Personal data usage', text: 'Whether the system processes personal data (relevant for GDPR).' },
        { bold: 'Ongoing monitoring', text: 'Whether post-deployment monitoring is in place.' },
        { bold: 'Unintended outcomes', text: 'Potential adverse effects identified during scoping.' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Based on these characteristics, VerifyWise calculates a risk level (High, Medium, or Low) and generates relevant compliance requirements. For example, a system that processes personal data triggers GDPR compliance and DPIA requirements automatically.',
    },
    {
      type: 'heading',
      id: 'roles-and-permissions',
      level: 2,
      text: 'Roles and permissions',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Admin', text: 'Full access. Can create, edit, delete, manage settings, and handle approvals.' },
        { bold: 'Editor', text: 'Can create and edit use cases, add frameworks and risks.' },
        { bold: 'Reviewer', text: 'Read access plus the ability to approve or reject decisions.' },
        { bold: 'Auditor', text: 'Read-only access for review and compliance verification.' },
      ],
    },
    {
      type: 'heading',
      id: 'notifications',
      level: 2,
      text: 'Notifications',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise sends notifications at key points in the use case lifecycle:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'When someone is assigned as owner of a use case' },
        { text: 'When a team member is added (with a role-specific email)' },
        { text: 'When an approval status changes (pending, approved, or rejected)' },
        { text: 'When a use case is created (Slack, if configured)' },
      ],
    },
    {
      type: 'heading',
      id: 'connections',
      level: 2,
      text: 'How use cases connect to other features',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Risk management', text: 'Risks created within a use case appear in the global risk register. You can also link existing risks to use cases from the risk management page.' },
        { bold: 'Frameworks', text: 'Each use case tracks compliance progress against its linked frameworks. Controls and assessments are scoped to the use case.' },
        { bold: 'Model inventory', text: 'Link AI models to use cases so auditors can trace which models serve which business processes.' },
        { bold: 'Vendors', text: 'Vendor risks can be associated with specific use cases.' },
        { bold: 'Dashboard', text: 'The main dashboard aggregates data across all use cases, showing overall compliance progress, risk distribution, and task status.' },
        { bold: 'Evidence hub', text: 'Evidence items can be linked to specific use cases for audit trails.' },
      ],
    },
    {
      type: 'heading',
      id: 'best-practices',
      level: 2,
      text: 'Tips',
    },
    {
      type: 'numbered-list',
      items: [
        { text: 'One use case per AI system. Do not bundle unrelated AI applications into a single use case. Auditors and regulators expect clear boundaries.' },
        { text: 'Set risk classification early. The EU AI Act classification determines how much documentation and oversight you need. Getting it right at the start saves rework.' },
        { text: 'Assign ownership deliberately. The owner receives notifications and is accountable for keeping the use case current. Pick someone with actual authority over the AI system.' },
        { text: 'Link frameworks during creation. It is easier to track compliance from day one than to backfill later.' },
        { text: 'Use the scope section. The auto-generated compliance requirements based on your answers can surface obligations you might otherwise miss.' },
      ],
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'risk-management',
          articleId: 'risk-assessment',
          title: 'Conducting risk assessments',
          description: 'Learn how to identify and evaluate risks within your use cases',
        },
        {
          collectionId: 'ai-governance',
          articleId: 'model-inventory',
          title: 'Model inventory',
          description: 'Track and manage the AI models powering your use cases',
        },
        {
          collectionId: 'compliance',
          articleId: 'eu-ai-act',
          title: 'EU AI Act compliance',
          description: 'Understand how risk classification maps to regulatory requirements',
        },
        {
          collectionId: 'ai-governance',
          articleId: 'intake-forms',
          title: 'Intake forms',
          description: 'Set up intake workflows for new AI project submissions',
        },
      ],
    },
  ],
};
