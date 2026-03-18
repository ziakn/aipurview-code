import type { ArticleContent } from '@user-guide-content/contentTypes';

export const quantitativeRiskAssessmentContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'Quantitative risk assessment adds financial modeling to your AI risk register using the FAIR (Factor Analysis of Information Risk) methodology. Instead of only categorizing risks as "high" or "low," you can estimate the actual monetary impact — how much a risk event could cost your organization per year, and whether your mitigation controls are worth the investment.',
    },
    {
      type: 'paragraph',
      text: 'When enabled, each risk gains a Quantitative tab with fields for event frequency, loss magnitude across four categories, control effectiveness, and mitigation cost. VerifyWise calculates your Annualized Loss Expectancy (ALE), residual exposure after controls, and return on investment in real time.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Quantitative assessment works alongside qualitative scoring — enabling it does not remove severity/likelihood ratings. You get both perspectives on every risk.',
    },
    {
      type: 'heading',
      id: 'enabling-the-feature',
      level: 2,
      text: 'Enabling quantitative risk assessment',
    },
    {
      type: 'paragraph',
      text: 'Quantitative risk assessment is an organization-level setting that must be enabled by an Admin before it becomes available.',
    },
    {
      type: 'numbered-list',
      items: [
        { text: 'Navigate to Settings in the sidebar' },
        { text: 'Click on the Features tab' },
        { text: 'Find "Quantitative risk assessment" and toggle it on' },
        { text: 'A Quantitative tab will now appear when you create or edit any risk' },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Only users with the Admin role can enable or disable this feature. Other roles will see the toggle but cannot change it.',
    },
    {
      type: 'heading',
      id: 'the-fair-model',
      level: 2,
      text: 'The FAIR model',
    },
    {
      type: 'paragraph',
      text: 'FAIR (Factor Analysis of Information Risk) is an internationally recognized framework for quantifying risk in financial terms. VerifyWise implements a streamlined version focused on four key calculations:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'PERT estimate', text: 'A weighted average of your min, most likely, and max values using the formula (min + 4 x likely + max) / 6. This gives more weight to the most likely outcome while accounting for uncertainty.' },
        { bold: 'Annualized Loss Expectancy (ALE)', text: 'How much you can expect to lose per year. Calculated as PERT(event frequency) x Total Loss (sum of PERT estimates across all loss categories).' },
        { bold: 'Residual ALE', text: 'Your expected loss after controls are applied. Calculated as ALE x (1 - control effectiveness / 100). If your controls are 70% effective, residual ALE is 30% of the original.' },
        { bold: 'Return on Investment (ROI)', text: 'Whether your mitigation spend is worth it. Calculated as ((ALE - Residual ALE) - mitigation cost) / mitigation cost x 100. A positive ROI means your controls save more than they cost.' },
      ],
    },
    {
      type: 'heading',
      id: 'filling-out-the-form',
      level: 2,
      text: 'Filling out the quantitative risk form',
    },
    {
      type: 'paragraph',
      text: 'When you open a risk and click the Quantitative tab, you will see five sections. The Risk Exposure Summary at the top updates in real time as you fill in values below.',
    },
    {
      type: 'heading',
      id: 'risk-exposure-summary',
      level: 3,
      text: 'Risk Exposure Summary',
    },
    {
      type: 'paragraph',
      text: 'This card sits at the top of the form and shows your live-calculated metrics: Total Loss (PERT), Annualized Loss (ALE), Residual ALE, and ROI. Before you enter any data, it shows a placeholder message. As you fill in frequency and loss values, the numbers update instantly.',
    },
    {
      type: 'heading',
      id: 'industry-benchmarks',
      level: 3,
      text: 'Start from an industry benchmark',
    },
    {
      type: 'paragraph',
      text: 'Rather than estimating from scratch, you can select an industry benchmark to pre-fill all frequency and loss fields. VerifyWise includes 19 benchmarks across six industries, each sourced from regulatory penalty data and industry research.',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Cross-Industry', text: 'EU AI Act prohibited practices, high-risk system non-compliance, governance failures, data quality, deepfake/synthetic media' },
        { bold: 'Technology', text: 'AI hiring bias, training data privacy breach, adversarial attacks, supply chain compromise, IP infringement' },
        { bold: 'Financial Services', text: 'Lending bias, data breach, model failure in critical decisions, transparency failure' },
        { bold: 'Healthcare', text: 'Diagnostic bias, data breach, model failure in diagnosis' },
        { bold: 'Automotive & Transport', text: 'Autonomous system failure' },
        { bold: 'Government', text: 'AI transparency failure in public services' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Benchmarks are starting points, not final assessments. After applying a benchmark, adjust the values to match your specific context, risk tolerance, and organizational size.',
    },
    {
      type: 'heading',
      id: 'event-frequency',
      level: 3,
      text: 'Event frequency',
    },
    {
      type: 'paragraph',
      text: 'Estimate how often this risk event is expected to occur per year using three-point estimates:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Min', text: 'The best-case scenario — the lowest reasonable frequency' },
        { bold: 'Most likely', text: 'Your best estimate of the actual frequency' },
        { bold: 'Max', text: 'The worst-case scenario — the highest reasonable frequency' },
      ],
    },
    {
      type: 'paragraph',
      text: 'For example, an event frequency of min: 0.1, most likely: 0.3, max: 0.8 means you expect this risk event to occur roughly once every 3 years on average, but it could happen as rarely as once in 10 years or as often as once every 15 months.',
    },
    {
      type: 'heading',
      id: 'loss-magnitude',
      level: 3,
      text: 'Loss magnitude',
    },
    {
      type: 'paragraph',
      text: 'Estimate the monetary impact per occurrence across four loss categories, each with min/most likely/max:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Regulatory fines', text: 'Penalties from regulators (e.g., GDPR fines up to 4% of global turnover, EU AI Act fines up to 7% or EUR 35M)' },
        { bold: 'Operational costs', text: 'Internal costs to respond to and recover from the incident (staff time, system remediation, business disruption)' },
        { bold: 'Litigation costs', text: 'Legal fees, settlements, and judgments from lawsuits related to the risk event' },
        { bold: 'Reputational damage', text: 'Loss of customer trust, brand value, and future revenue due to negative publicity' },
      ],
    },
    {
      type: 'heading',
      id: 'mitigation-controls',
      level: 3,
      text: 'Mitigation and ROI',
    },
    {
      type: 'paragraph',
      text: 'After estimating your exposure, assess how effective your controls are and what they cost:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Control effectiveness', text: 'Use the slider to set how effective your current controls are at preventing or reducing the risk event (0% = no controls, 100% = fully mitigated). This directly reduces your Residual ALE.' },
        { bold: 'Annual mitigation cost', text: 'Enter the total annual cost of your mitigation measures. This is used to calculate ROI — whether your controls save more than they cost.' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'A positive ROI (shown in green) means your mitigation investment is paying off. A negative ROI (shown in red) suggests you may be overspending on controls relative to the risk reduction achieved.',
    },
    {
      type: 'heading',
      id: 'dashboard-portfolio',
      level: 2,
      text: 'Portfolio view on the dashboard',
    },
    {
      type: 'paragraph',
      text: 'When quantitative assessment is enabled and at least one risk has been quantified, the main dashboard shows three additional cards:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'AI portfolio exposure', text: 'Your total ALE across all quantified risks, residual exposure, risk reduction achieved, total mitigation spend, and overall ROI' },
        { bold: 'Exposure trend (90 days)', text: 'A line chart showing how your total ALE and residual ALE have changed over the past 90 days' },
        { bold: 'Loss category breakdown', text: 'A breakdown of your total exposure by loss category (regulatory, operational, litigation, reputational) showing which areas carry the most financial risk' },
      ],
    },
    {
      type: 'heading',
      id: 'standards-compliance',
      level: 2,
      text: 'Standards and compliance mapping',
    },
    {
      type: 'paragraph',
      text: 'Quantitative risk assessment directly supports compliance with multiple regulatory frameworks:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'EU AI Act', text: 'Articles 9 (risk management system), 14 (human oversight), 15 (accuracy and robustness), and 99 (penalties). Quantitative assessment provides the documented financial risk analysis required for high-risk AI systems.' },
        { bold: 'ISO 42001', text: 'Clause 8.2 (AI risk assessment) requires organizations to determine the likelihood and consequences of AI risks. FAIR quantification satisfies this requirement with structured monetary estimates.' },
        { bold: 'NIST AI RMF', text: 'The Map and Measure functions call for characterizing AI risks and their impacts. Quantitative metrics provide the measurable risk data the framework recommends.' },
        { bold: 'GDPR', text: 'Data protection impact assessments benefit from financial quantification of potential breach consequences, especially for training data privacy risks.' },
      ],
    },
    {
      type: 'heading',
      id: 'best-practices',
      level: 2,
      text: 'Best practices',
    },
    {
      type: 'numbered-list',
      items: [
        { text: 'Start with benchmarks, then customize. Industry benchmarks provide calibrated starting points based on real regulatory penalties and incident data.' },
        { text: 'Be honest about uncertainty. The three-point estimate (min/likely/max) is designed to capture uncertainty — wide ranges are better than false precision.' },
        { text: 'Review quarterly. Risk landscapes change as regulations evolve, models are updated, and new threats emerge. Schedule regular reviews of your quantitative assessments.' },
        { text: 'Compare across risks. Use ALE values to prioritize which risks deserve the most mitigation investment. A risk with $5M ALE deserves more attention than one with $50K.' },
        { text: 'Track ROI over time. The portfolio trend chart shows whether your overall risk exposure is decreasing. If your mitigation ROI is consistently negative, consider reallocating resources.' },
      ],
    },
  ],
};
