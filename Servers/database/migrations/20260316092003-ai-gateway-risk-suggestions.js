'use strict';

/**
 * AI Gateway Risk Suggestions
 *
 * Creates two tables:
 * - ai_gateway_risk_settings: per-org condition toggles + thresholds
 * - ai_gateway_risk_suggestions: detected risk conditions awaiting review
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`SET search_path TO verifywise, public;`);

    // Risk condition settings (user-configurable thresholds)
    await queryInterface.sequelize.query(`
      CREATE TABLE ai_gateway_risk_settings (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        condition_id VARCHAR(64) NOT NULL,
        is_enabled BOOLEAN DEFAULT true,
        threshold JSONB DEFAULT '{}',
        severity_override VARCHAR(16),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id, condition_id)
      );

      CREATE INDEX idx_gw_risk_settings_org ON ai_gateway_risk_settings(organization_id);
    `);

    // Risk suggestions (detected conditions awaiting review)
    await queryInterface.sequelize.query(`
      CREATE TABLE ai_gateway_risk_suggestions (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        condition_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        severity VARCHAR(16) NOT NULL,
        evidence JSONB DEFAULT '{}',
        compliance_tags TEXT[] DEFAULT '{}',
        suggested_mitigation TEXT,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        accepted_risk_id INTEGER,
        dismiss_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE INDEX idx_gw_risk_suggestions_org ON ai_gateway_risk_suggestions(organization_id, status);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`SET search_path TO verifywise, public;`);
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS ai_gateway_risk_suggestions CASCADE;
      DROP TABLE IF EXISTS ai_gateway_risk_settings CASCADE;
    `);
  }
};
