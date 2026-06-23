import { Client } from "pg";

async function main() {
  const client = new Client({
    user: "postgres",
    password: "1377",
    host: "localhost",
    port: 5432,
    database: "verifywise_test",
  });
  await client.connect();
  const res = await client.query(
    `SELECT pid, state, query_start, query
     FROM pg_stat_activity
     WHERE datname = 'verifywise_test'`,
  );
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
