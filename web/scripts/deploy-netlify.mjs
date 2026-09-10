/**
 * Deploys web/dist to the existing Netlify site using the Netlify API.
 * Usage: NETLIFY_AUTH_TOKEN=... bun web/scripts/deploy-netlify.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const SITE_ID = "a38d4bc4-6b84-4ce7-9c20-d620cee64c4a";
const DIST = path.resolve(process.cwd(), "dist");
const API = "https://api.netlify.com/api/v1";
const token = process.env.NETLIFY_AUTH_TOKEN;

if (!token) {
  console.error("Missing NETLIFY_AUTH_TOKEN");
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

const headers = { Authorization: `Bearer ${token}` };

// 1. Compute sha1 digests and create a deploy.
const files = {};
for (const file of walk(DIST)) {
  const rel = "/" + path.relative(DIST, file).split(path.sep).join("/");
  files[rel] = crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex");
}

const createRes = await fetch(`${API}/sites/${SITE_ID}/deploys`, {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({ files, async: false }),
});
const deploy = await createRes.json();
if (!createRes.ok) {
  console.error("Failed to create deploy:", JSON.stringify(deploy));
  process.exit(1);
}
console.log(`Deploy created: ${deploy.id} (state: ${deploy.state})`);

// 2. Upload any files Netlify hasn't seen before.
for (const rel of deploy.required ?? []) {
  const body = fs.readFileSync(path.join(DIST, rel));
  const upRes = await fetch(`${API}/deploys/${deploy.id}/files${rel}`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/octet-stream" },
    body,
  });
  if (!upRes.ok) {
    console.error(`Failed to upload ${rel}: HTTP ${upRes.status}`);
    process.exit(1);
  }
  console.log(`Uploaded ${rel}`);
}

// 3. Poll until the deploy is live.
for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  const pollRes = await fetch(`${API}/deploys/${deploy.id}`, { headers });
  const poll = await pollRes.json();
  if (poll.state === "ready") {
    console.log(`Deploy live: ${poll.ssl_url ?? poll.url}`);
    process.exit(0);
  }
  if (["error", "canceled"].includes(poll.state)) {
    console.error("Deploy failed:", JSON.stringify(poll.error_message ?? poll.state));
    process.exit(1);
  }
  console.log(`Waiting… state: ${poll.state}`);
}
console.error("Timed out waiting for deploy");
process.exit(1);
