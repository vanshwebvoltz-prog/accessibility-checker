/**
 * uploadReports.js
 * Uploads HTML reports from ./reports/ to S3.
 * Each file gets:
 *   - <meta name="robots" content="noindex, nofollow"> injected into <head>
 *   - x-robots-tag: noindex metadata on the S3 object
 *   - CacheControl: no-store so browsers/CDNs don't cache stale reports
 *
 * Usage:
 *   S3_BUCKET=my-bucket node uploadReports.js
 *   S3_BUCKET=my-bucket S3_PREFIX=audits/ AWS_REGION=ca-central-1 node uploadReports.js
 *
 * Required env vars:
 *   S3_BUCKET   — target bucket name
 *
 * Optional env vars:
 *   AWS_REGION  — defaults to ca-central-1
 *   S3_PREFIX   — folder prefix inside bucket, e.g. "reports/" (default: "reports/")
 *
 * AWS credentials are read from the standard chain:
 *   ~/.aws/credentials, AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars, or IAM role.
 */

const fs   = require("fs");
const path = require("path");

let S3Client, PutObjectCommand;
try {
  ({ S3Client, PutObjectCommand } = require("@aws-sdk/client-s3"));
} catch {
  console.error(
    'Missing dependency. Run:  npm install @aws-sdk/client-s3\n'
  );
  process.exit(1);
}

// ── DigitalOcean Spaces credentials ──────────────────────────────────────────
const ACCESS_KEY  = "DO8014QNXG39EBB9GEQY";
const SECRET_KEY  = "x92toIubBpQbwN6A9ZlOhge3nrX21M0JyAhonlK4z1A";
// ─────────────────────────────────────────────────────────────────────────────

const BUCKET      = process.env.S3_BUCKET || "kamaldhari-development-spaces";
const REGION      = process.env.AWS_REGION || "blr1";
const PREFIX      = process.env.S3_PREFIX  || "reports/";
const REPORTS_DIR = path.join(__dirname, "reports");

const s3 = new S3Client({
  region: REGION,
  endpoint: `https://${REGION}.digitaloceanspaces.com`,
  credentials: {
    accessKeyId:     ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

// Inject <meta name="robots" content="noindex, nofollow"> right after <head>
function injectNoIndex(html) {
  if (/<meta[^>]+name=["']robots["']/i.test(html)) return html;
  return html.replace(
    /(<head[^>]*>)/i,
    '$1\n  <meta name="robots" content="noindex, nofollow">'
  );
}

async function uploadFile(filePath, filename) {
  const raw  = fs.readFileSync(filePath, "utf8");
  const body = injectNoIndex(raw);

  await s3.send(
    new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         `${PREFIX}${filename}`,
      Body:        body,
      ContentType: "text/html; charset=utf-8",
      CacheControl: "no-store, no-cache",
      ACL: "public-read",
      Metadata: {
        "x-robots-tag": "noindex",
      },
    })
  );

  console.log(`  ✓  ${filename}  →  s3://${BUCKET}/${PREFIX}${filename}`);
}

async function main() {
  if (!fs.existsSync(REPORTS_DIR)) {
    console.error("reports/ directory not found — run an audit first.");
    process.exit(1);
  }

  const files = fs.readdirSync(REPORTS_DIR).filter((f) => f.endsWith(".html"));

  if (!files.length) {
    console.log("No HTML files found in reports/. Nothing to upload.");
    return;
  }

  console.log(`\nUploading ${files.length} report(s) to s3://${BUCKET}/${PREFIX}\n`);

  let ok = 0, fail = 0;

  for (const filename of files) {
    try {
      await uploadFile(path.join(REPORTS_DIR, filename), filename);
      ok++;
    } catch (err) {
      console.error(`  ✗  ${filename}  —  ${err.message}`);
      fail++;
    }
  }

  console.log(`\nDone — ${ok} uploaded, ${fail} failed.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
