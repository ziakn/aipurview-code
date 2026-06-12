import { execSync } from "node:child_process";

const output = execSync("npm run i18n:audit:strict -- --json", { encoding: "utf8" });
const start = output.indexOf("{");
const data = JSON.parse(output.slice(start));
const withApostrophe = data.de.filter((s) => s.includes("'"));
console.log("DE gaps with apostrophe:", withApostrophe.length);
withApostrophe.slice(0, 40).forEach((s) => console.log("  ", s));
