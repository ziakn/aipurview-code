'use strict';

/**
 * ISO 42001 Clause 6.1 split into 6.1.1, 6.1.2, 6.1.3, 6.1.4.
 *
 * Per user request: add four new subclauses as additional rows (not a replace).
 * Any existing tenant answer on the merged '6.1' row is left untouched. Every
 * organization that has an ISO 42001 project gets four fresh empty tenant rows
 * (one per new subclause) so the tenant UI surfaces them as unfilled.
 *
 * Adds:
 *   6.1.1  General — actions to address risks and opportunities
 *   6.1.2  AI risk assessment
 *   6.1.3  AI risk treatment
 *   6.1.4  AI system impact assessment
 *
 * Struct INSERTs use ON CONFLICT DO NOTHING (uniqueness by clause_id +
 * subclause_id is enforced at app level; if a row already exists with the same
 * subclause_id under the same clause, we skip it). Tenant INSERTs guard against
 * duplicates by checking NOT EXISTS for the (projects_frameworks_id,
 * subclause_meta_id) pair.
 */

const NEW_SUBCLAUSES = [
  {
    subclause_id: '6.1.1',
    order_no: 3,
    title: 'General — actions to address risks and opportunities',
    summary:
      'When planning for the AIMS, consider the issues from 4.1, requirements from 4.2, and determine risks and opportunities that need to be addressed to ensure the AIMS can achieve its intended outcomes, prevent or reduce undesired effects, and achieve continual improvement.',
    questions: [
      'Have we identified risks and opportunities considering the context (4.1) and interested parties (4.2)?',
      'Do our planned actions integrate into AIMS processes?',
      'How do we evaluate the effectiveness of these actions?',
    ],
    evidence_examples: [
      'Risk and opportunity register linked to context analysis',
      'Planning records showing integration into AIMS processes',
      'Effectiveness evaluation records',
    ],
  },
  {
    subclause_id: '6.1.2',
    order_no: 4,
    title: 'AI risk assessment',
    summary:
      'Define and apply an AI risk assessment process that establishes risk criteria, identifies risks to individuals, groups, and societies from AI systems, analyzes and evaluates those risks, and selects treatment options.',
    questions: [
      'Is there a documented AI risk assessment methodology with defined risk criteria?',
      'Are risks to individuals, groups, and societies from AI systems systematically identified?',
      'How are identified risks analyzed (likelihood, severity, affected parties)?',
      'How are risks evaluated against acceptance criteria?',
    ],
    evidence_examples: [
      'AI risk assessment methodology document',
      'Risk criteria definitions (likelihood scales, impact scales, acceptance thresholds)',
      'AI risk assessment reports per system',
      'Risk register with analysis and evaluation results',
    ],
  },
  {
    subclause_id: '6.1.3',
    order_no: 5,
    title: 'AI risk treatment',
    summary:
      'Define and apply an AI risk treatment process to select appropriate treatment options, determine controls (referencing Annex A), produce a Statement of Applicability, and formulate a risk treatment plan.',
    questions: [
      'How are risk treatment options selected for each identified AI risk?',
      'Is there a Statement of Applicability (SoA) documenting which Annex A controls apply and which are excluded with justification?',
      'Is there a documented risk treatment plan with owners, timelines, and resources?',
      'Have risk owners approved the risk treatment plan and accepted residual risks?',
    ],
    evidence_examples: [
      'AI risk treatment plan',
      'Statement of Applicability (SoA)',
      'Risk owner approval records',
      'Residual risk acceptance documentation',
    ],
  },
  {
    subclause_id: '6.1.4',
    order_no: 6,
    title: 'AI system impact assessment',
    summary:
      'Define and apply an AI system impact assessment process to assess potential consequences — positive and negative — of AI systems on individuals, groups, and societies, considering the AI system lifecycle.',
    questions: [
      'Is there a documented impact assessment methodology for AI systems?',
      'Are both positive and negative impacts on individuals, groups, and societies assessed?',
      'At which lifecycle stages are impact assessments conducted or updated?',
      'How are impact assessment results fed into risk treatment and system design decisions?',
    ],
    evidence_examples: [
      'AI impact assessment methodology',
      'Completed impact assessment reports per AI system',
      'Records linking impact findings to design or treatment decisions',
    ],
  },
];

module.exports = {
  async up(queryInterface) {
    const t = await queryInterface.sequelize.transaction();
    try {
      const [[framework]] = await queryInterface.sequelize.query(
        `SELECT id FROM verifywise.frameworks
         WHERE name ILIKE 'ISO 42001%' OR name ILIKE 'ISO/IEC 42001%'
         LIMIT 1;`,
        { transaction: t }
      );
      if (!framework) {
        console.warn('[iso42001-split-6.1] ISO 42001 framework not found — skipping');
        await t.commit();
        return;
      }
      const frameworkId = framework.id;

      const [[clause6]] = await queryInterface.sequelize.query(
        `SELECT id FROM verifywise.clauses_struct_iso
         WHERE framework_id = :frameworkId AND clause_no = 6
         LIMIT 1;`,
        { transaction: t, replacements: { frameworkId } }
      );
      if (!clause6) {
        console.warn('[iso42001-split-6.1] Clause 6 not found — skipping');
        await t.commit();
        return;
      }
      const clauseId = clause6.id;

      // 1) Insert the 4 new struct rows (template), idempotent by clause_id + subclause_id
      const newStructIds = [];
      for (const sub of NEW_SUBCLAUSES) {
        // Check if row already exists for this (clause_id, subclause_id) pair
        const [[existing]] = await queryInterface.sequelize.query(
          `SELECT id FROM verifywise.subclauses_struct_iso
           WHERE clause_id = :clauseId AND subclause_id = :subclause_id
           LIMIT 1;`,
          { transaction: t, replacements: { clauseId, subclause_id: sub.subclause_id } }
        );
        let structId = existing?.id;
        if (!structId) {
          const [[inserted]] = await queryInterface.sequelize.query(
            `INSERT INTO verifywise.subclauses_struct_iso
               (clause_id, subclause_id, title, summary, questions, evidence_examples, order_no, is_demo)
             VALUES
               (:clauseId, :subclause_id, :title, :summary, :questions, :evidence_examples, :order_no, false)
             RETURNING id;`,
            {
              transaction: t,
              replacements: {
                clauseId,
                subclause_id: sub.subclause_id,
                title: sub.title,
                summary: sub.summary,
                questions: sub.questions,
                evidence_examples: sub.evidence_examples,
                order_no: sub.order_no,
              },
            }
          );
          structId = inserted.id;
        }
        newStructIds.push(structId);
      }

      // 2) For every projects_frameworks row tied to this ISO 42001 framework,
      //    insert 4 empty tenant rows — one per new struct row. Skip pairs that
      //    already exist (idempotent re-run safe).
      for (const structId of newStructIds) {
        await queryInterface.sequelize.query(
          `INSERT INTO verifywise.subclauses_iso
             (organization_id, projects_frameworks_id, subclause_meta_id, status)
           SELECT pf.organization_id, pf.id, :structId, 'Not started'
           FROM verifywise.projects_frameworks pf
           WHERE pf.framework_id = :frameworkId
             AND NOT EXISTS (
               SELECT 1 FROM verifywise.subclauses_iso si
               WHERE si.projects_frameworks_id = pf.id
                 AND si.subclause_meta_id = :structId
             );`,
          { transaction: t, replacements: { structId, frameworkId } }
        );
      }

      await t.commit();
      console.log('[iso42001-split-6.1] added 6.1.1, 6.1.2, 6.1.3, 6.1.4 struct rows + empty tenant rows per org');
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    // Remove the 4 new struct rows; FK ON DELETE CASCADE cleans up tenant rows.
    await queryInterface.sequelize.query(`
      DELETE FROM verifywise.subclauses_struct_iso
      WHERE subclause_id IN ('6.1.1', '6.1.2', '6.1.3', '6.1.4')
        AND clause_id IN (
          SELECT id FROM verifywise.clauses_struct_iso
          WHERE clause_no = 6
            AND framework_id IN (
              SELECT id FROM verifywise.frameworks
              WHERE name ILIKE 'ISO 42001%' OR name ILIKE 'ISO/IEC 42001%'
            )
        );
    `);
  },
};
