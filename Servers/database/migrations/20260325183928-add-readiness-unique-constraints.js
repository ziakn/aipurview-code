'use strict';

/**
 * Add unique constraints to readiness tables for upsert (ON CONFLICT) support.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Unique constraint on control_readiness_scores for upsert
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_ctrl_readiness_control_fw_org
        ON control_readiness_scores(control_id, framework_type, organization_id)
    `);

    // Unique constraint on framework_readiness_scores for upsert
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_fw_readiness_fw_org
        ON framework_readiness_scores(framework_type, organization_id)
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS uq_ctrl_readiness_control_fw_org
    `);
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS uq_fw_readiness_fw_org
    `);
  }
};
