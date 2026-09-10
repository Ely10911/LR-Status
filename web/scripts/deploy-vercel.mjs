/**
 * Deploys the prebuilt web/dist to the "lr-status" project on Vercel.
 * Usage: VERCEL_TOKEN=... bun web/scripts/deploy-vercel.mjs
 */
import fs from "node:fs";
import path from "node:path";

const PROJECT = "prj_YcaM9mqb9SonweqlkWOzwM1SFgbl";
const DIST = path.resolve(process.cwd(), "dist");
const token = process.env.VERCEL_TOKEN;

if (!token) {
  console.error("Missing VERCEL_TOKEN");
  process.exit(1);
}

/** Recursively collect all file paths under a directory. */
function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

// Files go at the deployment root (prebuilt deployment, no build step).
const files = walk(DIST).map((file) => ({
  file: path.relative(DIST, file).split(path.sep).join("/"),
  data: fs.readFileSync(file).toString("base64"),
  encoding: "base64",
}));

// vercel.json at the root supplies the SPA rewrite.
const vercelJsonPath = path.resolve(process.cwd(), "vercel.json");
if (fs.existsSync(vercelJsonPath)) {
  files.push({
    file: "vercel.json",
    data: fs.readFileSync(vercelJsonPath).toString("base64"),
    encoding: "base64",
  });
}

const res = await fetch("https://api.vercel.com/v13/deployments", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "lr-status",
    project: PROJECT,
    target: "production",
    files,
    projectSettings: { framework: null },
  }),
});
const deployment = await res.json();
if (!res.ok) {
  console.error("Failed to create deployment:", JSON.stringify(deployment));
  process.exit(1);
}
console.log(`Deployment created: ${deployment.id} (state: ${deployment.readyState})`);
console.log(`URL: ${deployment.url}`);

// Poll until ready.
for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  const poll = await (
    await fetch(`https://api.vercel.com/v13/deployments/${deployment.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  ).json();
  if (poll.readyState === "READY") {
    console.log(`Deploy live: https://${poll.url}`);
    process.exit(0);
  }
  if (["ERROR", "CANCELED"].includes(poll.readyState)) {
    console.error("Deploy failed:", JSON.stringify(poll.errorMessage ?? poll.readyState));
    process.exit(1);
  }
  console.log(`Waiting… state: ${poll.readyState}`);
}
console.error("Timed out waiting for deployment");
process.exit(1);
