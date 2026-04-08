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
  if (process.env.NODE_ENV === "production") {
    return;
  }

  if (process.env.DEV_AUTO_BOOTSTRAP !== "true") {
    return;
  }

  // Validate required env vars — fail fast with clear error
  const missing = REQUIRED_VARS.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `[dev-bootstrap] missing required env vars: ${missing.join(", ")}`
    );
  }

  const email = process.env.DEV_ADMIN_EMAIL!;
  const password = process.env.DEV_ADMIN_PASSWORD!;

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

  // Idempotency check + organization/admin creation added in a follow-up commit.
}
