import { Client } from "pg";

async function main() {
  const admin = new Client({
    user: "postgres",
    password: "1377",
    host: "localhost",
    port: 5432,
    database: "postgres",
  });
  await admin.connect();

  await admin.query(
    `SELECT pg_terminate_backend(pid)
     FROM pg_stat_activity
     WHERE datname = 'verifywise_test' AND pid <> pg_backend_pid()`,
  );

  await admin.query(`DROP DATABASE IF EXISTS "verifywise_test"`);
  await admin.query(`CREATE DATABASE "verifywise_test"`);

  console.log("verifywise_test reset");
  await admin.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
