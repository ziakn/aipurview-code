"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `SET search_path TO verifywise, public;`
    );

    // Feature 2: Labels table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS ai_gateway_prompt_labels (
        id SERIAL PRIMARY KEY,
        prompt_id INTEGER NOT NULL REFERENCES ai_gateway_prompts(id) ON DELETE CASCADE,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        label_name VARCHAR(64) NOT NULL,
        version_id INTEGER NOT NULL REFERENCES ai_gateway_prompt_versions(id) ON DELETE CASCADE,
        assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_ai_gateway_prompt_labels_prompt_label UNIQUE(prompt_id, label_name)
      )
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_gateway_prompt_labels_org
        ON ai_gateway_prompt_labels(organization_id);
      CREATE INDEX IF NOT EXISTS idx_ai_gateway_prompt_labels_prompt
        ON ai_gateway_prompt_labels(prompt_id);
    `);

    // Feature 5: Test datasets table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS ai_gateway_prompt_test_datasets (
        id SERIAL PRIMARY KEY,
        prompt_id INTEGER NOT NULL REFERENCES ai_gateway_prompts(id) ON DELETE CASCADE,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        test_cases JSONB DEFAULT '[]',
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_gateway_prompt_test_datasets_org
        ON ai_gateway_prompt_test_datasets(organization_id);
      CREATE INDEX IF NOT EXISTS idx_ai_gateway_prompt_test_datasets_prompt
        ON ai_gateway_prompt_test_datasets(prompt_id);
    `);

    // Feature 6: Add commit_message to versions
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_gateway_prompt_versions
      ADD COLUMN IF NOT EXISTS commit_message TEXT
    `);

    // Feature 2: Add prompt_label to endpoints
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_gateway_endpoints
      ADD COLUMN IF NOT EXISTS prompt_label VARCHAR(64) DEFAULT 'production'
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `SET search_path TO verifywise, public;`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE ai_gateway_endpoints DROP COLUMN IF EXISTS prompt_label`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE ai_gateway_prompt_versions DROP COLUMN IF EXISTS commit_message`
    );
    await queryInterface.sequelize.query(
      `DROP TABLE IF EXISTS ai_gateway_prompt_test_datasets CASCADE`
    );
    await queryInterface.sequelize.query(
      `DROP TABLE IF EXISTS ai_gateway_prompt_labels CASCADE`
    );
  },
};
