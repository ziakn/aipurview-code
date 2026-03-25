'use strict';

/**
 * Add unique constraints to readiness tables for upsert (ON CONFLICT) support.
 * Include project_id to allow per-project scores without overwriting each other.
 * Also create a history table for trend tracking.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Unique constraint on control_readiness_scores — includes project_id
    // COALESCE(project_id, 0) handles NULL project_id for org-wide scores
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_ctrl_readiness_control_fw_proj_org
        ON control_readiness_scores(control_id, framework_type, COALESCE(project_id, 0), organization_id)
    `);

    // Unique constraint on framework_readiness_scores — includes project_id
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_fw_readiness_fw_proj_org
        ON framework_readiness_scores(framework_type, COALESCE(project_id, 0), organization_id)
    `);

    // History table for trend tracking — INSERT-only, never overwritten
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS readiness_history (
        id SERIAL PRIMARY KEY,
        framework_type VARCHAR(50) NOT NULL,
        project_id INTEGER,
        avg_score INTEGER NOT NULL,
        total_controls INTEGER,
        ready_count INTEGER,
        needs_work_count INTEGER,
        at_risk_count INTEGER,
        not_started_count INTEGER,
        calculated_at TIMESTAMPTZ DEFAULT NOW(),
        organization_id INTEGER NOT NULL
      )
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_readiness_history_lookup
        ON readiness_history(framework_type, organization_id, calculated_at DESC)
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS uq_ctrl_readiness_control_fw_proj_org
    `);
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS uq_fw_readiness_fw_proj_org
    `);
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS readiness_history CASCADE
    `);
  }
};
