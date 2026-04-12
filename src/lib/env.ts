// Validate required environment variables at import time.
// Import this module early (e.g. in layout.tsx) so missing vars surface immediately.

const required = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
] as const;

const requiredInProduction = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "B2_ENDPOINT",
  "B2_BUCKET",
  "B2_KEY_ID",
  "B2_APP_KEY",
] as const;

const missing: string[] = [];

for (const key of required) {
  if (!process.env[key]) missing.push(key);
}

if (process.env.NODE_ENV === "production") {
  for (const key of requiredInProduction) {
    if (!process.env[key]) missing.push(key);
  }
}

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables:\n  ${missing.join("\n  ")}`,
  );
}
