"use strict";

/**
 * Tracks scenario activations and links them to the tasks created.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS governance_scenario_activations (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL,
        scenario_id INTEGER NOT NULL REFERENCES governance_scenarios(id) ON DELETE CASCADE,
        activated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        activated_at TIMESTAMPTZ DEFAULT NOW(),
        deactivated_at TIMESTAMPTZ,
        tasks_created INTEGER DEFAULT 0,
        frameworks_assigned INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_governance_scenario_activations_org
        ON governance_scenario_activations (organization_id);
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_governance_scenario_activations_scenario
        ON governance_scenario_activations (scenario_id);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS governance_scenario_activations;
    `);
  },
};
