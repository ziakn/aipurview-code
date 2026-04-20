'use strict';

/**
 * Reseeds the EU AI Act struct tables to pick up:
 *   - The new Prohibited practices category (order_no = 0)
 *   - The rewritten General-purpose AI category (order_no = 13 content replaced)
 *   - Five new categories (order_no 14-18): risk classification, QMS, provider
 *     technical requirements, conformity / market access, deployer data rights
 *   - The expanded transparency category (order_no = 8) with three new Art 50(2-4)
 *     top-level controls
 *   - Per-row `article` metadata
 *
 * `roles` and `risk_tiers` are not columns on these tables — they live in the
 * category-level junction tables created by
 * 20260417151000-add-eu-act-roles-risk-tiers-junctions.js.
 *
 * Idempotent: uses ON CONFLICT DO NOTHING + UPDATE fallback so it's safe to
 * re-run on already-seeded DBs.
 */
module.exports = {
  async up(queryInterface) {
    const { ControlCategories } = require('../../dist/structures/EU-AI-Act/compliance-tracker/controlCategories.struct');

    const t = await queryInterface.sequelize.transaction();
    try {
      const [[framework]] = await queryInterface.sequelize.query(
        `SELECT id FROM verifywise.frameworks WHERE name = 'EU AI Act' LIMIT 1;`,
        { transaction: t }
      );
      if (!framework) {
        console.warn('[reseed-eu-act] EU AI Act framework not found — skipping');
        await t.commit();
        return;
      }
      const frameworkId = framework.id;

      for (const category of ControlCategories) {
        const [[catRow]] = await queryInterface.sequelize.query(
          `INSERT INTO verifywise.controlcategories_struct_eu
             (framework_id, title, order_no, is_demo, article)
           VALUES (:frameworkId, :title, :order_no, false, :article)
           ON CONFLICT DO NOTHING
           RETURNING id;`,
          {
            transaction: t,
            replacements: {
              frameworkId,
              title: category.title,
              order_no: category.order_no,
              article: category.article ?? null,
            },
          }
        );

        let categoryId = catRow?.id;
        if (!categoryId) {
          const [[existing]] = await queryInterface.sequelize.query(
            `UPDATE verifywise.controlcategories_struct_eu
             SET title = :title, article = :article
             WHERE framework_id = :frameworkId AND order_no = :order_no
             RETURNING id;`,
            {
              transaction: t,
              replacements: {
                frameworkId,
                title: category.title,
                order_no: category.order_no,
                article: category.article ?? null,
              },
            }
          );
          categoryId = existing?.id;
        }
        if (!categoryId || !Array.isArray(category.controls)) continue;

        for (const control of category.controls) {
          const controlArticle = control.article ?? category.article ?? null;
          const [[ctlRow]] = await queryInterface.sequelize.query(
            `INSERT INTO verifywise.controls_struct_eu
               (control_category_id, title, description, order_no, is_demo, article)
             VALUES (:categoryId, :title, :description, :order_no, false, :article)
             ON CONFLICT DO NOTHING
             RETURNING id;`,
            {
              transaction: t,
              replacements: {
                categoryId,
                title: control.title,
                description: control.description || '',
                order_no: control.order_no,
                article: controlArticle,
              },
            }
          );

          let controlId = ctlRow?.id;
          if (!controlId) {
            const [[existing]] = await queryInterface.sequelize.query(
              `UPDATE verifywise.controls_struct_eu
               SET title = :title, description = :description, article = :article
               WHERE control_category_id = :categoryId AND order_no = :order_no
               RETURNING id;`,
              {
                transaction: t,
                replacements: {
                  categoryId,
                  title: control.title,
                  description: control.description || '',
                  order_no: control.order_no,
                  article: controlArticle,
                },
              }
            );
            controlId = existing?.id;
          }
          if (!controlId || !Array.isArray(control.subControls)) continue;

          for (const sc of control.subControls) {
            const scArticle = sc.article ?? controlArticle;
            const [[scRow]] = await queryInterface.sequelize.query(
              `INSERT INTO verifywise.subcontrols_struct_eu
                 (control_id, title, description, order_no, is_demo, article)
               VALUES (:controlId, :title, :description, :order_no, false, :article)
               ON CONFLICT DO NOTHING
               RETURNING id;`,
              {
                transaction: t,
                replacements: {
                  controlId,
                  title: sc.title,
                  description: sc.description || '',
                  order_no: sc.order_no,
                  article: scArticle,
                },
              }
            );

            if (!scRow?.id) {
              await queryInterface.sequelize.query(
                `UPDATE verifywise.subcontrols_struct_eu
                 SET title = :title, description = :description, article = :article
                 WHERE control_id = :controlId AND order_no = :order_no;`,
                {
                  transaction: t,
                  replacements: {
                    controlId,
                    title: sc.title,
                    description: sc.description || '',
                    order_no: sc.order_no,
                    article: scArticle,
                  },
                }
              );
            }
          }
        }
      }

      await t.commit();
      console.log('[reseed-eu-act] reseed complete');
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM verifywise.controlcategories_struct_eu
      WHERE framework_id IN (SELECT id FROM verifywise.frameworks WHERE name = 'EU AI Act')
        AND order_no IN (0, 14, 15, 16, 17, 18);
    `);
  },
};
