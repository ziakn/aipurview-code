import { sequelize } from "../database/db";
import { createOrganizationQuery } from "./organization.utils";
import { createNewUserWrapper } from "../controllers/user.ctrl";

const REQUIRED_VARS = [
  "DEV_ORG_NAME",
  "DEV_ADMIN_EMAIL",
  "DEV_ADMIN_PASSWORD",
  "DEV_ADMIN_NAME",
  "DEV_ADMIN_SURNAME",
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Dev-only bootstrap: on first startup, create initial organization and admin user
 * from environment variables so developers don't need to manually onboard every fresh DB.
 *
 * Hard-gated — completely inert outside development and when flag is off.
 */
export async function devAutoBootstrap(): Promise<void> {
  // Hard prod guard — never run in production, regardless of flag
  const nodeEnv = (process.env.NODE_ENV ?? "").trim().toLowerCase();
  const flag = (process.env.DEV_AUTO_BOOTSTRAP ?? "").trim().toLowerCase();
  if (nodeEnv === "production") {
    return;
  }

  if (flag !== "true") {
    return;
  }

  // Idempotency — skip if any organization already exists
  let count = 0;
  try {
    const [rows] = await sequelize.query(
      "SELECT COUNT(*)::int AS count FROM organizations"
    );
    count = (rows as Array<{ count: number }>)[0]?.count ?? 0;
  } catch (err: any) {
    if (err?.parent?.code === "42P01" || err?.original?.code === "42P01") {
      throw new Error(
        "[dev-bootstrap] organizations table not found — run `npx sequelize db:migrate` first"
      );
    }
    throw err;
  }
  if (count > 0) {
    console.log(
      "[dev-bootstrap] organizations already exist, skipping"
    );
    return;
  }

  // Validate required env vars — fail fast with clear error
  const missing = REQUIRED_VARS.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `[dev-bootstrap] missing required env vars: ${missing.join(", ")}`
    );
  }

  const orgName = process.env.DEV_ORG_NAME!;
  const email = process.env.DEV_ADMIN_EMAIL!;
  const password = process.env.DEV_ADMIN_PASSWORD!;
  const name = process.env.DEV_ADMIN_NAME!;
  const surname = process.env.DEV_ADMIN_SURNAME!;

  if (!EMAIL_RE.test(email)) {
    throw new Error(
      `[dev-bootstrap] DEV_ADMIN_EMAIL is not a valid email: ${email}`
    );
  }

  // Password strength is enforced by UserModel.createNewUser; we duplicate a
  // lightweight pre-check here for a friendlier startup error message.
  const strong =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);
  if (!strong) {
    throw new Error(
      "[dev-bootstrap] DEV_ADMIN_PASSWORD must be ≥8 chars and contain upper, lower, and digit"
    );
  }

  const transaction = await sequelize.transaction();
  try {
    const org = await createOrganizationQuery(
      { name: orgName, logo: undefined as any },
      transaction
    );

    await createNewUserWrapper(
      {
        name,
        surname,
        email,
        password,
        roleId: 1, // Admin
        organizationId: org.id!,
      },
      transaction
    );

    await transaction.commit();
    console.log(
      `[dev-bootstrap] created org "${orgName}" (id=${org.id}) and admin ${email}`
    );
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
