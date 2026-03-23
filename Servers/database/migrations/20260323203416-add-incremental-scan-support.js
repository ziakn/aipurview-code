'use strict';

/**
 * Adds incremental scan support columns to ai_detection_scans and ai_detection_findings.
 *
 * ai_detection_scans:
 *   - scan_mode: 'full' (default) or 'incremental'
 *   - base_commit_sha / head_commit_sha: git SHAs for incremental diff
 *   - baseline_scan_id: FK to the full scan used as baseline
 *   - changed_files_count: number of files in the diff
 *
 * ai_detection_findings:
 *   - finding_status: 'active' (default), 'fixed', or 'carried_forward'
 *   - index on (scan_id, finding_status) for efficient filtering
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // --- ai_detection_scans columns ---
    await queryInterface.addColumn('ai_detection_scans', 'scan_mode', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'full',
    });

    await queryInterface.addColumn('ai_detection_scans', 'base_commit_sha', {
      type: Sequelize.STRING(40),
      allowNull: true,
    });

    await queryInterface.addColumn('ai_detection_scans', 'head_commit_sha', {
      type: Sequelize.STRING(40),
      allowNull: true,
    });

    await queryInterface.addColumn('ai_detection_scans', 'baseline_scan_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'ai_detection_scans',
        key: 'id',
      },
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('ai_detection_scans', 'changed_files_count', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // --- ai_detection_findings columns ---
    await queryInterface.addColumn('ai_detection_findings', 'finding_status', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'active',
    });

    // --- Index for efficient filtering by finding_status ---
    await queryInterface.addIndex('ai_detection_findings', ['scan_id', 'finding_status'], {
      name: 'idx_findings_scan_id_finding_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'ai_detection_findings',
      'idx_findings_scan_id_finding_status'
    );
    await queryInterface.removeColumn('ai_detection_findings', 'finding_status');
    await queryInterface.removeColumn('ai_detection_scans', 'changed_files_count');
    await queryInterface.removeColumn('ai_detection_scans', 'baseline_scan_id');
    await queryInterface.removeColumn('ai_detection_scans', 'head_commit_sha');
    await queryInterface.removeColumn('ai_detection_scans', 'base_commit_sha');
    await queryInterface.removeColumn('ai_detection_scans', 'scan_mode');
  },
};
