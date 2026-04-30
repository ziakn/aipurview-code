'use strict';

/**
 * Copy LLM Evals provider keys into AI Gateway key storage so a single
 * encrypted store backs evals + gateway. Skips when the org already has an
 * active gateway key for the same logical provider (google/gemini treated as one).
 */

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      INSERT INTO verifywise.ai_gateway_api_keys (
        organization_id,
        key_name,
        provider,
        encrypted_key,
        is_active,
        created_at,
        updated_at
      )
      SELECT
        e.organization_id,
        'Migrated from LLM Evals',
        CASE WHEN LOWER(e.provider) = 'google' THEN 'gemini' ELSE LOWER(e.provider) END,
        e.api_key_encrypted,
        true,
        COALESCE(e.created_at, NOW()),
        COALESCE(e.updated_at, NOW())
      FROM verifywise.llm_evals_api_keys e
      WHERE NOT EXISTS (
        SELECT 1
        FROM verifywise.ai_gateway_api_keys g
        WHERE g.organization_id = e.organization_id
          AND g.is_active = true
          AND (
            CASE
              WHEN LOWER(e.provider) IN ('google', 'gemini') THEN
                LOWER(g.provider) IN ('google', 'gemini')
              ELSE LOWER(g.provider) = LOWER(e.provider)
            END
          )
      );
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM verifywise.ai_gateway_api_keys
      WHERE key_name = 'Migrated from LLM Evals';
    `);
  },
};
