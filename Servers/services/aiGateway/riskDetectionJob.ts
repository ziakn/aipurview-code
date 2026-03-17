/**
 * AI Gateway Risk Detection Job
 *
 * BullMQ job handler that runs risk condition evaluation for all orgs
 * with gateway data, creates suggestion records, and sends email notifications.
 */

import { sequelize } from "../../database/db";
import { evaluateAllConditions } from "./riskConditions";
import { createSuggestionQuery } from "../../utils/aiGatewayRisk.utils";
import { compileMjmlToHtml } from "../../tools/mjmlCompiler";
import { readFileSync } from "fs";
import { join } from "path";
import sendEmail from "../automations/actions/sendEmail";

const SEVERITY_EMAIL_COLORS: Record<string, string> = {
  critical: "#DC2626",
  high: "#EA580C",
  medium: "#D97706",
  low: "#2563EB",
};

// Cache MJML template at module scope — read once per process
let _cachedMjml: string | null = null;
function getMjmlTemplate(): string {
  if (!_cachedMjml) {
    const templatePath = join(__dirname, "../../templates", "ai-gateway-risk-suggestions.mjml");
    _cachedMjml = readFileSync(templatePath, "utf-8");
  }
  return _cachedMjml;
}

/**
 * Run risk detection across all organizations that have gateway spend data.
 */
export async function runRiskDetection(): Promise<void> {
  // Get all org IDs that have any gateway data
  const orgs = (await sequelize.query(
    `SELECT DISTINCT organization_id FROM ai_gateway_endpoints`
  )) as [{ organization_id: number }[], number];

  for (const { organization_id: orgId } of orgs[0]) {
    try {
      const newSuggestions = await evaluateAllConditions(orgId);

      // Create suggestion records in parallel
      if (newSuggestions.length > 0) {
        await Promise.all(
          newSuggestions.map((suggestion) =>
            createSuggestionQuery(orgId, {
              condition_id: suggestion.condition_id,
              title: suggestion.title,
              description: suggestion.description,
              severity: suggestion.severity,
              evidence: suggestion.evidence,
              compliance_tags: suggestion.compliance_tags,
              suggested_mitigation: suggestion.suggested_mitigation,
            })
          )
        );
        await notifyAdmins(orgId, newSuggestions);
      }
    } catch (err) {
      console.error(`Risk detection failed for org ${orgId}:`, err);
    }
  }
}

/**
 * Send email notification to org admins about new risk suggestions.
 */
async function notifyAdmins(
  orgId: number,
  suggestions: { title: string; severity: string; description: string }[]
): Promise<void> {
  try {
    // Get admin emails for this org
    const admins = (await sequelize.query(
      `SELECT u.email, u.name FROM users u
       JOIN user_roles ur ON u.id = ur.user_id AND ur.organization_id = :orgId
       JOIN roles r ON ur.role_id = r.id
       WHERE r.name = 'Admin' AND u.organization_id = :orgId`,
      { replacements: { orgId } }
    )) as [{ email: string; name: string }[], number];

    if (admins[0].length === 0) return;

    const mjmlTemplate = getMjmlTemplate();
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    // Build suggestion list HTML
    const suggestionRows = suggestions
      .map((s) => {
        const color = SEVERITY_EMAIL_COLORS[s.severity] || "#667085";
        return `<tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #EAECF0;">
            <span style="display: inline-block; font-size: 11px; font-weight: 500; color: ${color}; background: ${color}1a; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">${s.severity}</span>
            &nbsp; <strong style="color: #344054;">${s.title}</strong>
            <br/><span style="font-size: 13px; color: #667085;">${s.description.slice(0, 120)}${s.description.length > 120 ? "..." : ""}</span>
          </td>
        </tr>`;
      })
      .join("");

    const templateData: Record<string, string> = {
      suggestion_count: String(suggestions.length),
      suggestion_rows: suggestionRows,
      gateway_url: `${frontendUrl}/ai-gateway/settings`,
    };

    const subject = `${suggestions.length} new risk suggestion${suggestions.length > 1 ? "s" : ""} detected in your AI Gateway`;
    await Promise.all(
      admins[0].map((admin) => {
        const html = compileMjmlToHtml(mjmlTemplate, {
          ...templateData,
          recipient_name: admin.name || "Admin",
        });
        return sendEmail({ to: [admin.email], subject, body: html });
      })
    );
  } catch (err) {
    console.error(`Failed to send risk suggestion emails for org ${orgId}:`, err);
  }
}
