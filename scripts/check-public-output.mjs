import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const problems = [];
async function walk(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isSymbolicLink()) {
      problems.push(`Symlink in public output: ${path.relative(root, file)}`);
      continue;
    }
    if ([".git", "node_modules", ".npmrc", ".git-credentials"].includes(item.name) || /^\.env(?:\.|$)/i.test(item.name)) {
      problems.push(`Private configuration in public output: ${path.relative(root, file)}`);
    }
    if (item.isDirectory()) await walk(file);
  }
}
await stat(path.join(root, "index.html"));
await walk(root);
// The public calendar API must expose only display metadata, never article
// bodies, arbitrary frontmatter, or plaintext password values.
const posts = JSON.parse(await readFile(path.join(root, "api", "allPostMeta.json"), "utf8"));
const allowed = new Set(["id", "title", "description", "published", "category", "password"]);
if (!Array.isArray(posts)) problems.push("Post metadata must be an array");
else for (const post of posts) {
  if (typeof post.password !== "boolean" || Object.keys(post).some(key => !allowed.has(key))) {
    problems.push("Unexpected or sensitive fields in public post metadata");
    break;
  }
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
} else console.log("Public output checks passed: no private configuration paths; post metadata is allowlisted.");
