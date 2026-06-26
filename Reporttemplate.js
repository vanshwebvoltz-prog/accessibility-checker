/**
 * reportTemplate.js
 *
 * Generates a detailed self-contained HTML report styled after
 * AccessibilityChecker.org — score gauge, WCAG 2.0/2.1/2.2 criteria panel,
 * 4-tab layout (Critical Issues / Passed / Manual / N/A), disabilities
 * affected tags, and WCAG Success Criteria per issue.
 */

// ─── WCAG criterion metadata ──────────────────────────────────────────────────
const WCAG_CRITERIA_MAP = {
  wcag111:  { id: "1.1.1",  title: "Non-text Content",                  level: "A",   ver: "2.0" },
  wcag121:  { id: "1.2.1",  title: "Audio-only & Video-only",            level: "A",   ver: "2.0" },
  wcag122:  { id: "1.2.2",  title: "Captions (Prerecorded)",             level: "A",   ver: "2.0" },
  wcag123:  { id: "1.2.3",  title: "Audio Description",                  level: "A",   ver: "2.0" },
  wcag124:  { id: "1.2.4",  title: "Captions (Live)",                    level: "AA",  ver: "2.0" },
  wcag125:  { id: "1.2.5",  title: "Audio Description (Prerecorded)",    level: "AA",  ver: "2.0" },
  wcag131:  { id: "1.3.1",  title: "Info and Relationships",             level: "A",   ver: "2.0" },
  wcag132:  { id: "1.3.2",  title: "Meaningful Sequence",                level: "A",   ver: "2.0" },
  wcag133:  { id: "1.3.3",  title: "Sensory Characteristics",            level: "A",   ver: "2.0" },
  wcag134:  { id: "1.3.4",  title: "Orientation",                        level: "AA",  ver: "2.1" },
  wcag135:  { id: "1.3.5",  title: "Identify Input Purpose",             level: "AA",  ver: "2.1" },
  wcag141:  { id: "1.4.1",  title: "Use of Color",                       level: "A",   ver: "2.0" },
  wcag142:  { id: "1.4.2",  title: "Audio Control",                      level: "A",   ver: "2.0" },
  wcag143:  { id: "1.4.3",  title: "Contrast (Minimum)",                 level: "AA",  ver: "2.0" },
  wcag144:  { id: "1.4.4",  title: "Resize Text",                        level: "AA",  ver: "2.0" },
  wcag145:  { id: "1.4.5",  title: "Images of Text",                     level: "AA",  ver: "2.0" },
  wcag146:  { id: "1.4.6",  title: "Contrast (Enhanced)",                level: "AAA", ver: "2.0" },
  wcag1410: { id: "1.4.10", title: "Reflow",                             level: "AA",  ver: "2.1" },
  wcag1411: { id: "1.4.11", title: "Non-text Contrast",                  level: "AA",  ver: "2.1" },
  wcag1412: { id: "1.4.12", title: "Text Spacing",                       level: "AA",  ver: "2.1" },
  wcag1413: { id: "1.4.13", title: "Content on Hover or Focus",          level: "AA",  ver: "2.1" },
  wcag211:  { id: "2.1.1",  title: "Keyboard",                           level: "A",   ver: "2.0" },
  wcag212:  { id: "2.1.2",  title: "No Keyboard Trap",                   level: "A",   ver: "2.0" },
  wcag213:  { id: "2.1.3",  title: "Keyboard (No Exception)",            level: "AAA", ver: "2.0" },
  wcag221:  { id: "2.2.1",  title: "Timing Adjustable",                  level: "A",   ver: "2.0" },
  wcag222:  { id: "2.2.2",  title: "Pause, Stop, Hide",                  level: "A",   ver: "2.0" },
  wcag224:  { id: "2.2.4",  title: "Interruptions",                      level: "AAA", ver: "2.0" },
  wcag231:  { id: "2.3.1",  title: "Three Flashes or Below Threshold",   level: "A",   ver: "2.0" },
  wcag233:  { id: "2.3.3",  title: "Animation from Interactions",        level: "AAA", ver: "2.1" },
  wcag241:  { id: "2.4.1",  title: "Bypass Blocks",                      level: "A",   ver: "2.0" },
  wcag242:  { id: "2.4.2",  title: "Page Titled",                        level: "A",   ver: "2.0" },
  wcag243:  { id: "2.4.3",  title: "Focus Order",                        level: "A",   ver: "2.0" },
  wcag244:  { id: "2.4.4",  title: "Link Purpose (In Context)",          level: "A",   ver: "2.0" },
  wcag245:  { id: "2.4.5",  title: "Multiple Ways",                      level: "AA",  ver: "2.0" },
  wcag246:  { id: "2.4.6",  title: "Headings and Labels",                level: "AA",  ver: "2.0" },
  wcag247:  { id: "2.4.7",  title: "Focus Visible",                      level: "AA",  ver: "2.0" },
  wcag249:  { id: "2.4.9",  title: "Link Purpose (Link Only)",           level: "AAA", ver: "2.0" },
  wcag2411: { id: "2.4.11", title: "Focus Not Obscured",                 level: "AA",  ver: "2.2" },
  wcag2412: { id: "2.4.12", title: "Focus Not Obscured (Enhanced)",      level: "AAA", ver: "2.2" },
  wcag251:  { id: "2.5.1",  title: "Pointer Gestures",                   level: "A",   ver: "2.1" },
  wcag252:  { id: "2.5.2",  title: "Pointer Cancellation",               level: "A",   ver: "2.1" },
  wcag253:  { id: "2.5.3",  title: "Label in Name",                      level: "A",   ver: "2.1" },
  wcag254:  { id: "2.5.4",  title: "Motion Actuation",                   level: "A",   ver: "2.1" },
  wcag255:  { id: "2.5.5",  title: "Target Size",                        level: "AAA", ver: "2.2" },
  wcag257:  { id: "2.5.7",  title: "Dragging Movements",                 level: "AA",  ver: "2.2" },
  wcag258:  { id: "2.5.8",  title: "Target Size (Minimum)",              level: "AA",  ver: "2.2" },
  wcag311:  { id: "3.1.1",  title: "Language of Page",                   level: "A",   ver: "2.0" },
  wcag312:  { id: "3.1.2",  title: "Language of Parts",                  level: "AA",  ver: "2.0" },
  wcag321:  { id: "3.2.1",  title: "On Focus",                           level: "A",   ver: "2.0" },
  wcag322:  { id: "3.2.2",  title: "On Input",                           level: "A",   ver: "2.0" },
  wcag323:  { id: "3.2.3",  title: "Consistent Navigation",              level: "AA",  ver: "2.0" },
  wcag324:  { id: "3.2.4",  title: "Consistent Identification",          level: "AA",  ver: "2.0" },
  wcag325:  { id: "3.2.5",  title: "Change on Request",                  level: "AAA", ver: "2.0" },
  wcag326:  { id: "3.2.6",  title: "Consistent Help",                    level: "A",   ver: "2.2" },
  wcag331:  { id: "3.3.1",  title: "Error Identification",               level: "A",   ver: "2.0" },
  wcag332:  { id: "3.3.2",  title: "Labels or Instructions",             level: "A",   ver: "2.0" },
  wcag333:  { id: "3.3.3",  title: "Error Suggestion",                   level: "AA",  ver: "2.0" },
  wcag334:  { id: "3.3.4",  title: "Error Prevention",                   level: "AA",  ver: "2.0" },
  wcag337:  { id: "3.3.7",  title: "Redundant Entry",                    level: "A",   ver: "2.2" },
  wcag338:  { id: "3.3.8",  title: "Accessible Authentication",          level: "AA",  ver: "2.2" },
  wcag411:  { id: "4.1.1",  title: "Parsing",                            level: "A",   ver: "2.0" },
  wcag412:  { id: "4.1.2",  title: "Name, Role, Value",                  level: "A",   ver: "2.0" },
  wcag413:  { id: "4.1.3",  title: "Status Messages",                    level: "AA",  ver: "2.1" },
};

// ─── WCAG tag → disabilities affected ────────────────────────────────────────
const TAG_TO_DISABILITIES = {
  wcag111:  ["Blind", "Low Vision"],
  wcag121:  ["Deaf", "Hard of Hearing"],
  wcag122:  ["Deaf", "Hard of Hearing"],
  wcag123:  ["Deaf", "Hard of Hearing"],
  wcag124:  ["Deaf", "Hard of Hearing"],
  wcag125:  ["Deaf", "Hard of Hearing"],
  wcag131:  ["Blind", "Low Vision", "Cognitive"],
  wcag132:  ["Blind", "Cognitive"],
  wcag133:  ["Blind", "Cognitive"],
  wcag134:  ["Motor"],
  wcag135:  ["Cognitive", "Motor"],
  wcag141:  ["Color Blind", "Low Vision"],
  wcag142:  ["Blind", "Low Vision"],
  wcag143:  ["Low Vision", "Color Blind"],
  wcag144:  ["Low Vision"],
  wcag145:  ["Blind", "Low Vision"],
  wcag146:  ["Low Vision"],
  wcag1410: ["Low Vision"],
  wcag1411: ["Low Vision", "Color Blind"],
  wcag1412: ["Low Vision", "Cognitive"],
  wcag1413: ["Low Vision", "Motor"],
  wcag211:  ["Motor", "Blind"],
  wcag212:  ["Motor", "Blind"],
  wcag213:  ["Motor"],
  wcag221:  ["Cognitive", "Motor"],
  wcag222:  ["Cognitive", "Seizure"],
  wcag224:  ["Cognitive"],
  wcag231:  ["Seizure"],
  wcag233:  ["Vestibular"],
  wcag241:  ["Blind", "Motor"],
  wcag242:  ["Blind", "Cognitive"],
  wcag243:  ["Blind", "Motor"],
  wcag244:  ["Blind", "Cognitive"],
  wcag245:  ["Blind", "Motor", "Cognitive"],
  wcag246:  ["Blind", "Cognitive"],
  wcag247:  ["Motor", "Blind"],
  wcag249:  ["Blind", "Cognitive"],
  wcag2411: ["Motor", "Low Vision"],
  wcag2412: ["Motor", "Low Vision"],
  wcag251:  ["Motor"],
  wcag252:  ["Motor"],
  wcag253:  ["Motor"],
  wcag254:  ["Motor"],
  wcag255:  ["Motor"],
  wcag257:  ["Motor"],
  wcag258:  ["Motor"],
  wcag311:  ["Blind", "Cognitive"],
  wcag312:  ["Blind", "Cognitive"],
  wcag321:  ["Cognitive", "Blind"],
  wcag322:  ["Cognitive"],
  wcag323:  ["Cognitive"],
  wcag324:  ["Blind", "Cognitive"],
  wcag325:  ["Cognitive"],
  wcag326:  ["Cognitive"],
  wcag331:  ["Blind", "Cognitive"],
  wcag332:  ["Blind", "Cognitive"],
  wcag333:  ["Cognitive"],
  wcag334:  ["Cognitive"],
  wcag337:  ["Cognitive", "Motor"],
  wcag338:  ["Cognitive"],
  wcag411:  ["Blind", "Low Vision"],
  wcag412:  ["Blind", "Low Vision"],
  wcag413:  ["Blind", "Low Vision"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function impactRank(impact) {
  return { critical: 4, serious: 3, moderate: 2, minor: 1 }[impact] || 0;
}

function impactColor(impact) {
  return { critical: "#DC2626", serious: "#EA580C", moderate: "#CA8A04", minor: "#64748B" }[impact] || "#64748B";
}

function impactBg(impact) {
  return { critical: "#FEF2F2", serious: "#FFF7ED", moderate: "#FEFCE8", minor: "#F8FAFC" }[impact] || "#F8FAFC";
}

function impactLabel(impact) {
  return { critical: "Critical", serious: "Serious", moderate: "Moderate", minor: "Minor" }[impact] || "Minor";
}

// Extract unique WCAG criteria objects from a tags array
function getCriteria(tags) {
  const seen = new Set();
  const result = [];
  for (const tag of (tags || [])) {
    const c = WCAG_CRITERIA_MAP[tag];
    if (c && !seen.has(c.id)) { seen.add(c.id); result.push(c); }
  }
  return result;
}

// Extract unique disability strings from a tags array
function getDisabilities(tags) {
  const seen = new Set();
  for (const tag of (tags || [])) {
    for (const d of (TAG_TO_DISABILITIES[tag] || [])) seen.add(d);
  }
  // For best-practice rules with no wcag criteria, use generic set
  if (seen.size === 0) {
    ["Blind", "Low Vision"].forEach(d => seen.add(d));
  }
  return Array.from(seen);
}

function calculateScore(violations, passes, incomplete) {
  const total = violations.length + passes.length + incomplete.length;
  if (total === 0) return 100;
  const passRate = passes.length / total;
  const penalty = violations.reduce((sum, v) => {
    return sum + ({ critical: 1.5, serious: 1.2, moderate: 0.8, minor: 0.4 }[v.impact] || 1);
  }, 0);
  return Math.max(0, Math.min(100, Math.round(passRate * 100 - penalty)));
}

function scoreColor(score) {
  if (score >= 90) return "#16A34A";
  if (score >= 75) return "#CA8A04";
  if (score >= 50) return "#EA580C";
  return "#DC2626";
}

// SVG donut gauge — 3/4 arc, clockwise from bottom-left
function renderGauge(score) {
  const R = 54;
  const cx = 70, cy = 70;
  const circ = 2 * Math.PI * R;           // ≈ 339.29
  const arcLen = circ * 0.75;             // ≈ 254.47  (3/4 of circle)
  const gap = circ - arcLen;              // ≈ 84.82
  const progress = (score / 100) * arcLen;
  const col = scoreColor(score);

  return `<svg viewBox="0 0 140 120" width="160" height="140" aria-label="Audit score: ${score} out of 100">
    <!-- Track -->
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#E5E7EB" stroke-width="10"
      stroke-dasharray="${arcLen.toFixed(2)} ${gap.toFixed(2)}"
      stroke-linecap="round"
      transform="rotate(135 ${cx} ${cy})"/>
    <!-- Progress -->
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${col}" stroke-width="10"
      stroke-dasharray="${progress.toFixed(2)} ${(circ - progress).toFixed(2)}"
      stroke-linecap="round"
      transform="rotate(135 ${cx} ${cy})"/>
    <!-- Score number -->
    <text x="${cx}" y="${cy + 8}" text-anchor="middle"
      font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"
      font-size="28" font-weight="700" fill="${col}">${score}</text>
  </svg>`;
}

// Disability pill tags — show first 2, rest as "+N more"
function renderDisabilityTags(tags) {
  const disabilities = getDisabilities(tags);
  if (!disabilities.length) return "";
  const visible = disabilities.slice(0, 2);
  const rest = disabilities.length - 2;
  const pills = visible.map(d =>
    `<span class="dtag">${escapeHtml(d)}</span>`
  ).join("");
  const more = rest > 0 ? `<span class="dtag dtag-more">+${rest} more</span>` : "";
  return pills + more;
}

// WCAG criteria column — primary criterion + expand badge
function renderCriteriaCell(tags) {
  const criteria = getCriteria(tags);
  const isBestPractice = !criteria.length && (tags || []).includes("best-practice");
  const isAoda = (tags || []).includes("aoda");

  if (isBestPractice && isAoda) {
    return `<span class="wcag-tag wcag-bp">Best Practice</span><span class="wcag-tag wcag-aoda">AODA</span>`;
  }
  if (isBestPractice) {
    return `<span class="wcag-tag wcag-bp">Best Practice</span>`;
  }
  if (!criteria.length && isAoda) {
    return `<span class="wcag-tag wcag-aoda">AODA IASR</span>`;
  }
  if (!criteria.length) {
    return `<span class="wcag-tag wcag-bp">—</span>`;
  }
  const first = criteria[0];
  const rest = criteria.length - 1;
  const versionBadge = `<span class="wcag-ver">${first.ver}</span>`;
  const levelBadge = `<span class="wcag-lvl wcag-lvl-${first.level.toLowerCase()}">${first.level}</span>`;
  const extra = rest > 0 ? `<span class="wcag-more">+${rest}</span>` : "";
  return `<span class="wcag-tag">${levelBadge} ${versionBadge} ${escapeHtml(first.id)} ${escapeHtml(first.title)}</span>${extra}`;
}

// Renders the expanding element details inside an issue row
function renderElements(nodes) {
  if (!nodes || !nodes.length) return "";
  return nodes.map((node, i) => {
    const target = Array.isArray(node.target) ? node.target.join(", ") : (node.target || "");
    const html = node.html || "";
    const fix = node.failureSummary || "";
    return `<div class="elem-row">
      <span class="elem-num">${i + 1}</span>
      <div class="elem-detail">
        ${target ? `<div class="elem-line"><span class="elem-lbl">Selector</span><code>${escapeHtml(target)}</code></div>` : ""}
        ${html ? `<div class="elem-line"><span class="elem-lbl">Element</span><code>${escapeHtml(html)}</code></div>` : ""}
        ${fix ? `<div class="elem-line elem-fix"><span class="elem-lbl">Fix</span>${escapeHtml(fix)}</div>` : ""}
      </div>
    </div>`;
  }).join("");
}

// Full issue row (violations + incomplete)
function renderIssueRow(item, index, isCustom, rowType) {
  const impact = item.impact || "minor";
  const color = impactColor(impact);
  const bg = impactBg(impact);
  const nodeCount = (item.nodes || []).length;
  const id = `row-${rowType}-${index}`;

  const criteriaHtml = renderCriteriaCell(item.tags);
  const disabilityHtml = renderDisabilityTags(item.tags);
  const elemHtml = renderElements(item.nodes);

  const impactIcon = rowType === "incomplete"
    ? `<span class="issue-icon icon-manual" title="Needs manual review">?</span>`
    : `<span class="issue-icon" style="background:${color}" title="${impactLabel(impact)}">!</span>`;

  return `
  <div class="issue-row" id="${id}" data-impact="${impact}" data-origin="${isCustom ? "custom" : "builtin"}">
    <div class="issue-summary" onclick="toggleRow('${id}')">
      <span class="col-num">${index}</span>
      <div class="col-issue">
        ${impactIcon}
        <div class="issue-text">
          <div class="issue-title">${escapeHtml(item.help || item.id)}</div>
          <div class="issue-desc">${escapeHtml(item.description || "")}</div>
          <div class="issue-rule"><code>${escapeHtml(item.id)}</code>
            ${isCustom ? '<span class="tag-custom-pill">custom</span>' : ""}
            <span class="impact-pill" style="background:${bg};color:${color};border:1px solid ${color}">${impactLabel(impact)}</span>
          </div>
        </div>
      </div>
      <div class="col-elements">
        ${nodeCount > 0 ? `<span class="elem-badge">${nodeCount} ${nodeCount === 1 ? "element" : "elements"}</span>` : `<span class="elem-badge-na">—</span>`}
      </div>
      <div class="col-disabilities">${disabilityHtml}</div>
      <div class="col-wcag">${criteriaHtml}<span class="expand-arrow" aria-hidden="true">▾</span></div>
    </div>
    ${elemHtml ? `<div class="issue-detail" id="${id}-detail" hidden>${elemHtml}</div>` : ""}
  </div>`;
}

// Passed check row
function renderPassRow(pass, index) {
  const criteriaHtml = renderCriteriaCell(pass.tags);
  const nodeCount = (pass.nodes || []).length;
  return `
  <div class="pass-row">
    <span class="col-num">${index}</span>
    <div class="col-issue">
      <span class="pass-icon">✓</span>
      <div class="issue-text">
        <div class="issue-title">${escapeHtml(pass.help || pass.id)}</div>
        <div class="issue-rule"><code>${escapeHtml(pass.id)}</code></div>
      </div>
    </div>
    <div class="col-elements"><span class="elem-badge-pass">${nodeCount} ${nodeCount === 1 ? "element" : "elements"}</span></div>
    <div class="col-disabilities">${renderDisabilityTags(pass.tags)}</div>
    <div class="col-wcag">${criteriaHtml}</div>
  </div>`;
}

// Not-applicable row
function renderNaRow(item, index) {
  const criteriaHtml = renderCriteriaCell(item.tags);
  return `
  <div class="pass-row">
    <span class="col-num">${index}</span>
    <div class="col-issue">
      <span class="na-icon">—</span>
      <div class="issue-text">
        <div class="issue-title">${escapeHtml(item.help || item.id)}</div>
        <div class="issue-rule"><code>${escapeHtml(item.id)}</code></div>
      </div>
    </div>
    <div class="col-elements"><span class="elem-badge-na">N/A</span></div>
    <div class="col-disabilities">${renderDisabilityTags(item.tags)}</div>
    <div class="col-wcag">${criteriaHtml}</div>
  </div>`;
}

function renderNetworkRow(req) {
  const sc = req.status >= 500 ? "s5" : req.status >= 400 ? "s4" : req.status >= 300 ? "s3" : req.status >= 200 ? "s2" : "s0";
  return `<tr>
    <td class="net-status ${sc}">${req.status || (req.failed ? "ERR" : "—")}</td>
    <td>${escapeHtml(req.method)}</td>
    <td class="net-url" title="${escapeHtml(req.url)}">${escapeHtml(req.url)}</td>
    <td>${escapeHtml(req.resourceType)}</td>
    <td class="num">${req.totalDurationMs != null ? req.totalDurationMs + " ms" : "—"}</td>
    <td class="num">${req.encodedDataLength ? Math.round(req.encodedDataLength / 1024) + " KB" : "—"}</td>
  </tr>`;
}

function renderConsoleRow(e) {
  const cls = e.type === "error" || e.type === "pageerror" ? "cerr" : e.type === "warning" ? "cwarn" : "";
  return `<tr class="${cls}"><td>${escapeHtml(e.type)}</td><td>${escapeHtml(e.text)}</td></tr>`;
}

// ─── Main export ──────────────────────────────────────────────────────────────
function buildHtmlReport(report, customRuleIds) {
  const customIdSet = new Set(customRuleIds || []);

  const violations  = ((report.accessibility && report.accessibility.violations)   || []).slice().sort((a, b) => impactRank(b.impact) - impactRank(a.impact));
  const passes      = (report.accessibility && report.accessibility.passes)        || [];
  const incomplete  = (report.accessibility && report.accessibility.incomplete)    || [];
  const inapplicable= (report.accessibility && report.accessibility.inapplicable)  || [];

  const networkRequests = (report.network && report.network.requests) || [];
  const networkSummary  = (report.network && report.network.summary)  || {};
  const consoleLogs     = report.console || [];

  const score = calculateScore(violations, passes, incomplete);
  const col   = scoreColor(score);
  const gauge = renderGauge(score);

  const auditDate = new Date(report.timestamp || Date.now()).toLocaleString();
  const pageUrl   = report.finalUrl || report.requestedUrl || report.url || "";

  const criticalN = violations.filter(v => v.impact === "critical").length;
  const seriousN  = violations.filter(v => v.impact === "serious").length;
  const moderateN = violations.filter(v => v.impact === "moderate").length;
  const minorN    = violations.filter(v => v.impact === "minor").length;

  const violationsHtml   = violations.map((v, i) => renderIssueRow(v, i + 1, customIdSet.has(v.id), "v")).join("");
  const passesHtml       = passes.map((p, i) => renderPassRow(p, i + 1)).join("");
  const incompleteHtml   = incomplete.map((m, i) => renderIssueRow(m, i + 1, false, "m")).join("");
  const inapplicableHtml = inapplicable.map((n, i) => renderNaRow(n, i + 1)).join("");

  const networkHtml = networkRequests.slice().sort((a, b) => (b.totalDurationMs || 0) - (a.totalDurationMs || 0)).map(renderNetworkRow).join("");
  const consoleHtml = consoleLogs.map(renderConsoleRow).join("");
  const consoleErrors = consoleLogs.filter(l => l.type === "error" || l.type === "pageerror").length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Accessibility Audit — ${escapeHtml(pageUrl)}</title>
<style>
:root{
  --bg:#F9FAFB;--surface:#FFFFFF;--border:#E5E7EB;--text:#111827;--muted:#6B7280;
  --green:#16A34A;--red:#DC2626;--orange:#EA580C;--amber:#CA8A04;--blue:#2563EB;
  --sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  --mono:ui-monospace,'SF Mono',Menlo,Consolas,monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--sans);background:var(--bg);color:var(--text);line-height:1.5;-webkit-font-smoothing:antialiased}

/* ── Page header ── */
.page-hdr{background:var(--surface);border-bottom:1px solid var(--border);padding:1.25rem 2rem;position:sticky;top:0;z-index:20}
.page-hdr h1{font-size:1.1rem;font-weight:600;margin-bottom:.2rem}
.page-hdr h1 a{color:var(--blue);text-decoration:none}
.page-hdr h1 a:hover{text-decoration:underline}
.hdr-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}
.hdr-meta{font-size:.78rem;color:var(--muted);margin-top:.15rem}
.dl-btn{font:inherit;font-size:.8rem;padding:.4rem 1rem;background:var(--surface);border:1px solid var(--border);border-radius:6px;cursor:pointer;color:var(--text);display:flex;align-items:center;gap:.4rem;white-space:nowrap}
.dl-btn:hover{background:var(--bg)}

/* ── Layout ── */
.container{max-width:1100px;margin:0 auto;padding:2rem}

/* ── Summary panels ── */
.panels{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.75rem}
@media(max-width:700px){.panels{grid-template-columns:1fr}}
.panel{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.5rem}
.panel-title{font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:1rem}

/* Score panel */
.score-inner{display:flex;align-items:center;gap:1.5rem}
.score-text p{font-size:.8rem;color:var(--muted);max-width:200px;line-height:1.4;margin-top:.5rem}
.score-breakdown{display:flex;flex-direction:column;gap:.3rem;margin-top:.75rem;font-size:.8rem}
.sb-row{display:flex;align-items:center;gap:.5rem}
.sb-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}

/* WCAG criteria panel */
.panel-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}
.panel-hdr .panel-title{margin-bottom:0}
.wcag-link{font-size:.75rem;color:var(--blue);text-decoration:none}
.criteria-list{display:flex;flex-direction:column;gap:.5rem}
.criteria-row{display:flex;align-items:center;gap:.75rem;padding:.5rem .75rem;border-radius:8px;background:var(--bg);border:1px solid var(--border)}
.criteria-icon{width:1.5rem;height:1.5rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;flex-shrink:0}
.ic-crit{background:#FEF2F2;color:#DC2626;border:1.5px solid #FECACA}
.ic-pass{background:#F0FDF4;color:#16A34A;border:1.5px solid #BBF7D0}
.ic-manual{background:#EFF6FF;color:#2563EB;border:1.5px solid #BFDBFE}
.ic-na{background:#F9FAFB;color:#6B7280;border:1.5px solid #E5E7EB}
.criteria-label{flex:1;font-size:.85rem;font-weight:500}
.criteria-count{font-size:.95rem;font-weight:700;min-width:2.5rem;text-align:right}
.criteria-count.cc-crit{color:#DC2626}
.criteria-count.cc-pass{color:#16A34A}
.criteria-count.cc-manual{color:#2563EB}
.criteria-count.cc-na{color:#6B7280}

/* ── Tabs ── */
.tabs{display:flex;gap:.25rem;border-bottom:2px solid var(--border);margin-bottom:0;flex-wrap:wrap}
.tab-btn{font:inherit;font-size:.83rem;padding:.65rem 1.1rem;background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;color:var(--muted);font-weight:500;display:flex;align-items:center;gap:.4rem;white-space:nowrap}
.tab-btn:hover{color:var(--text)}
.tab-btn.active{color:var(--blue);border-bottom-color:var(--blue)}
.tab-btn .tc{display:inline-flex;align-items:center;justify-content:center;min-width:1.5rem;height:1.4rem;border-radius:999px;font-size:.72rem;font-weight:700;padding:0 .35rem}
.tc-crit{background:#FEF2F2;color:#DC2626}
.tc-pass{background:#F0FDF4;color:#16A34A}
.tc-manual{background:#EFF6FF;color:#2563EB}
.tc-na{background:#F9FAFB;color:#9CA3AF;border:1px solid #E5E7EB}

/* ── Filter row ── */
.filter-bar{display:flex;align-items:center;gap:.5rem;padding:.75rem 0;flex-wrap:wrap}
.filter-btn{font:inherit;font-size:.76rem;padding:.25rem .7rem;border:1px solid var(--border);border-radius:999px;background:var(--surface);cursor:pointer;color:var(--text)}
.filter-btn.active{background:var(--text);color:#fff;border-color:var(--text)}

/* ── Table header ── */
.tbl-hdr{display:grid;grid-template-columns:2.5rem 1fr 10rem 14rem 16rem;gap:0;background:var(--bg);border:1px solid var(--border);border-bottom:none;padding:.5rem .75rem;border-radius:8px 8px 0 0;font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
@media(max-width:900px){.tbl-hdr{display:none}}

/* ── Issue rows ── */
.issue-row{background:var(--surface);border:1px solid var(--border);border-top:none;transition:box-shadow .15s}
.issue-row:last-child{border-radius:0 0 8px 8px}
.issue-row:hover{box-shadow:0 1px 6px rgba(0,0,0,.07)}
.issue-summary{display:grid;grid-template-columns:2.5rem 1fr 10rem 14rem 16rem;gap:0;padding:.85rem .75rem;cursor:pointer;align-items:start}
@media(max-width:900px){
  .issue-summary{grid-template-columns:2.5rem 1fr;grid-template-rows:auto auto auto}
  .col-elements,.col-disabilities,.col-wcag{grid-column:2;padding:.2rem 0}
}
.col-num{font-size:.8rem;color:var(--muted);padding-top:.1rem;font-weight:600}
.col-issue{display:flex;gap:.65rem;align-items:flex-start}
.col-elements,.col-disabilities,.col-wcag{padding-top:.05rem}
.issue-icon{width:1.3rem;height:1.3rem;border-radius:50%;color:#fff;font-size:.7rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:.1rem}
.icon-manual{background:#2563EB}
.issue-text{min-width:0}
.issue-title{font-size:.88rem;font-weight:500;line-height:1.35}
.issue-desc{font-size:.78rem;color:var(--muted);margin-top:.2rem;line-height:1.4}
.issue-rule{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;margin-top:.35rem}
.issue-rule code{font-family:var(--mono);font-size:.72rem;background:#F3F4F6;padding:.1rem .3rem;border-radius:4px;color:var(--muted)}
.tag-custom-pill{font-size:.66rem;background:#EEF2FF;color:#4338CA;border:1px solid #C7D2FE;border-radius:999px;padding:.1rem .4rem;text-transform:uppercase;letter-spacing:.03em}
.impact-pill{font-size:.68rem;border-radius:999px;padding:.1rem .45rem;font-weight:600}
.elem-badge{display:inline-block;font-size:.78rem;font-weight:600;background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;border-radius:6px;padding:.2rem .6rem}
.elem-badge-pass{display:inline-block;font-size:.78rem;font-weight:600;background:#D1FAE5;color:#065F46;border:1px solid #A7F3D0;border-radius:6px;padding:.2rem .6rem}
.elem-badge-na{font-size:.78rem;color:var(--muted)}
.dtag{display:inline-block;font-size:.72rem;background:#F3F4F6;color:#374151;border:1px solid #E5E7EB;border-radius:999px;padding:.15rem .55rem;margin:.1rem .1rem .1rem 0}
.dtag-more{color:var(--muted)}
.wcag-tag{display:inline-flex;align-items:center;gap:.3rem;flex-wrap:wrap;font-size:.75rem;color:var(--text)}
.wcag-lvl{font-size:.65rem;font-weight:700;border-radius:4px;padding:.1rem .3rem}
.wcag-lvl-a{background:#DBEAFE;color:#1D4ED8}
.wcag-lvl-aa{background:#E0E7FF;color:#4338CA}
.wcag-lvl-aaa{background:#EDE9FE;color:#6D28D9}
.wcag-ver{font-size:.65rem;color:var(--muted);background:#F3F4F6;border-radius:3px;padding:.05rem .25rem}
.wcag-more{font-size:.7rem;color:var(--blue);cursor:pointer;margin-left:.2rem}
.wcag-bp{font-size:.75rem;color:#92400E;background:#FEF3C7;border:1px solid #FDE68A;border-radius:6px;padding:.15rem .5rem}
.wcag-aoda{font-size:.75rem;color:#065F46;background:#D1FAE5;border:1px solid #6EE7B7;border-radius:6px;padding:.15rem .5rem;margin-left:.25rem;font-weight:600}
.expand-arrow{font-size:.7rem;color:var(--muted);margin-left:auto;display:block;transition:transform .2s;margin-top:.1rem}
.issue-row.open .expand-arrow{transform:rotate(180deg)}

/* ── Expanded element detail ── */
.issue-detail{padding:.5rem .75rem 1rem;border-top:1px dashed var(--border);background:#FAFAFA}
.elem-row{display:flex;gap:.6rem;padding:.55rem 0;border-top:1px dashed #F3F4F6}
.elem-row:first-child{border-top:none}
.elem-num{width:1.4rem;height:1.4rem;border-radius:50%;background:#F3F4F6;color:var(--muted);font-size:.68rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:.1rem}
.elem-detail{flex:1;min-width:0}
.elem-line{font-size:.78rem;margin-bottom:.3rem;word-break:break-word}
.elem-line code{font-family:var(--mono);background:#F3F4F6;padding:.1rem .3rem;border-radius:4px;font-size:.75rem;display:inline;word-break:break-all}
.elem-lbl{display:inline-block;font-size:.65rem;text-transform:uppercase;color:var(--muted);letter-spacing:.03em;min-width:4.5rem;margin-right:.35rem}
.elem-fix{color:#92400E}
.elem-fix .elem-lbl{color:#92400E}

/* ── Pass rows ── */
.pass-row{display:grid;grid-template-columns:2.5rem 1fr 10rem 14rem 16rem;gap:0;padding:.75rem .75rem;background:var(--surface);border:1px solid var(--border);border-top:none;align-items:start}
.pass-row:last-child{border-radius:0 0 8px 8px}
.pass-icon{color:var(--green);font-size:1rem;font-weight:700;margin-top:.05rem;flex-shrink:0}
.na-icon{color:var(--muted);font-size:.9rem;margin-top:.1rem}

/* ── Empty state ── */
.empty{padding:2rem;text-align:center;color:var(--muted);font-size:.85rem;background:var(--surface);border:1px solid var(--border);border-radius:0 0 8px 8px}

/* ── Tab panes ── */
.tab-pane{display:none}
.tab-pane.active{display:block}

/* ── Network & Console accordion ── */
.accordion{background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-top:1.5rem}
.accordion summary{display:flex;align-items:center;gap:.5rem;padding:1rem 1.25rem;cursor:pointer;font-weight:600;font-size:.88rem;list-style:none;user-select:none}
.accordion summary::-webkit-details-marker{display:none}
.accordion summary .acc-arrow{margin-left:auto;font-size:.7rem;transition:transform .2s;color:var(--muted)}
.accordion[open] summary .acc-arrow{transform:rotate(180deg)}
.accordion-body{padding:1rem 1.25rem;border-top:1px solid var(--border)}

/* ── Net summary grid ── */
.net-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:.75rem;margin-bottom:1rem}
.net-box{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:.75rem}
.net-box .nb-num{font-size:1.2rem;font-weight:700}
.net-box .nb-lbl{font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.03em;margin-top:.1rem}

/* ── Tables ── */
table{width:100%;border-collapse:collapse;font-size:.8rem}
th,td{text-align:left;padding:.45rem .7rem;border-bottom:1px solid var(--border)}
th{font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.03em;color:var(--muted);background:var(--bg)}
tr:last-child td{border-bottom:none}
td.num{text-align:right;font-family:var(--mono)}
.net-url{max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--mono);font-size:.72rem}
.net-status{font-weight:700;font-family:var(--mono)}
.s2{color:var(--green)} .s3{color:#64748B} .s4,.s5{color:var(--orange)} .s0{color:var(--muted)}
.cerr td:first-child{color:var(--red);font-weight:600}
.cwarn td:first-child{color:var(--amber);font-weight:600}

@media(max-width:640px){
  .container{padding:1rem}
  .page-hdr{padding:1rem}
  .tbl-hdr,.col-disabilities,.col-wcag{display:none}
  .issue-summary,.pass-row{grid-template-columns:2.5rem 1fr}
}
</style>
</head>
<body>

<!-- PAGE HEADER -->
<div class="page-hdr">
  <div class="hdr-row">
    <div>
      <h1>Audit results for <a href="${escapeHtml(pageUrl)}" target="_blank" rel="noopener">${escapeHtml(pageUrl)}</a></h1>
      <div class="hdr-meta">Scanned ${escapeHtml(auditDate)}</div>
    </div>
    <button class="dl-btn" onclick="downloadReport()">⬇ Download audit</button>
  </div>
</div>

<div class="container">

  <!-- SUMMARY PANELS -->
  <div class="panels">

    <!-- Score gauge -->
    <div class="panel">
      <div class="panel-title">Audit Score</div>
      <div class="score-inner">
        <div>${gauge}</div>
        <div class="score-text">
          <p style="color:${col};font-weight:700;font-size:1rem">${score < 90 ? "At risk" : "Good"}</p>
          <p>Websites with a score lower than 90 are at risk of accessibility lawsuits.</p>
          <div class="score-breakdown">
            <div class="sb-row"><span class="sb-dot" style="background:#DC2626"></span><span>${criticalN} critical</span></div>
            <div class="sb-row"><span class="sb-dot" style="background:#EA580C"></span><span>${seriousN} serious</span></div>
            <div class="sb-row"><span class="sb-dot" style="background:#CA8A04"></span><span>${moderateN} moderate</span></div>
            <div class="sb-row"><span class="sb-dot" style="background:#94A3B8"></span><span>${minorN} minor</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- WCAG criteria -->
    <div class="panel">
      <div class="panel-hdr">
        <div class="panel-title">WCAG 2.2 Criteria</div>
        <a class="wcag-link" href="https://www.w3.org/TR/WCAG22/" target="_blank" rel="noopener">ⓘ What is WCAG?</a>
      </div>
      <div class="criteria-list">
        <div class="criteria-row">
          <div class="criteria-icon ic-crit">!</div>
          <span class="criteria-label">Critical Issues</span>
          <span class="criteria-count cc-crit">${violations.length}</span>
        </div>
        <div class="criteria-row">
          <div class="criteria-icon ic-pass">✓</div>
          <span class="criteria-label">Passed Audits</span>
          <span class="criteria-count cc-pass">${passes.length}</span>
        </div>
        <div class="criteria-row">
          <div class="criteria-icon ic-manual">?</div>
          <span class="criteria-label">Required Manual Audits</span>
          <span class="criteria-count cc-manual">${incomplete.length}</span>
        </div>
        <div class="criteria-row">
          <div class="criteria-icon ic-na">—</div>
          <span class="criteria-label">Not Applicable</span>
          <span class="criteria-count cc-na">${inapplicable.length}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- TAB NAV -->
  <div class="tabs">
    <button class="tab-btn active" data-tab="violations">
      <span class="tc tc-crit">!</span> Critical Issues <span class="tc tc-crit">${violations.length}</span>
    </button>
    <button class="tab-btn" data-tab="passes">
      <span class="tc tc-pass">✓</span> Passed Audits <span class="tc tc-pass">${passes.length}</span>
    </button>
    <button class="tab-btn" data-tab="incomplete">
      <span class="tc tc-manual">?</span> Required Manual Audits <span class="tc tc-manual">${incomplete.length}</span>
    </button>
    <button class="tab-btn" data-tab="inapplicable">
      <span class="tc tc-na">—</span> Not Applicable <span class="tc tc-na">${inapplicable.length}</span>
    </button>
  </div>

  <!-- ── VIOLATIONS TAB ── -->
  <div class="tab-pane active" id="pane-violations">
    <div class="filter-bar">
      <span style="font-size:.78rem;color:var(--muted);margin-right:.25rem">Filter:</span>
      <button class="filter-btn active" data-impact="all">All (${violations.length})</button>
      ${criticalN ? `<button class="filter-btn" data-impact="critical" style="color:#DC2626;border-color:#FECACA">Critical (${criticalN})</button>` : ""}
      ${seriousN  ? `<button class="filter-btn" data-impact="serious"  style="color:#EA580C;border-color:#FED7AA">Serious (${seriousN})</button>` : ""}
      ${moderateN ? `<button class="filter-btn" data-impact="moderate" style="color:#CA8A04;border-color:#FDE68A">Moderate (${moderateN})</button>` : ""}
      ${minorN    ? `<button class="filter-btn" data-impact="minor"    style="color:#64748B;border-color:#CBD5E1">Minor (${minorN})</button>` : ""}
    </div>
    ${violations.length ? `
    <div class="tbl-hdr">
      <span>#</span><span>Issue</span><span>Failing Elements</span><span>Disabilities Affected</span><span>WCAG Success Criteria</span>
    </div>
    <div id="violations-list">${violationsHtml}</div>
    ` : '<div class="empty">🎉 No violations found — great job!</div>'}
  </div>

  <!-- ── PASSES TAB ── -->
  <div class="tab-pane" id="pane-passes">
    ${passes.length ? `
    <div class="tbl-hdr" style="margin-top:.75rem">
      <span>#</span><span>Rule</span><span>Elements Checked</span><span>Disabilities Covered</span><span>WCAG Success Criteria</span>
    </div>
    ${passesHtml}
    ` : '<div class="empty">No passed audits recorded.</div>'}
  </div>

  <!-- ── MANUAL AUDITS TAB ── -->
  <div class="tab-pane" id="pane-incomplete">
    ${incomplete.length ? `
    <div style="padding:.75rem 0;font-size:.82rem;color:var(--muted)">
      These checks could not be fully automated. A human reviewer should verify each item.
    </div>
    <div class="tbl-hdr">
      <span>#</span><span>Item</span><span>Elements</span><span>Disabilities Affected</span><span>WCAG Success Criteria</span>
    </div>
    ${incompleteHtml}
    ` : '<div class="empty">No manual audits required.</div>'}
  </div>

  <!-- ── NOT APPLICABLE TAB ── -->
  <div class="tab-pane" id="pane-inapplicable">
    ${inapplicable.length ? `
    <div class="tbl-hdr" style="margin-top:.75rem">
      <span>#</span><span>Rule</span><span></span><span>Disabilities</span><span>WCAG Criterion</span>
    </div>
    ${inapplicableHtml}
    ` : '<div class="empty">No inapplicable rules.</div>'}
  </div>

  <!-- ── NETWORK ── -->
  <details class="accordion">
    <summary>
      🌐 Network &mdash; ${networkRequests.length} requests
      &nbsp;<span style="font-size:.78rem;color:var(--muted);font-weight:400">${networkSummary.totalTransferredKB || 0} KB transferred &bull; ${networkSummary.failedRequests || 0} failed</span>
      <span class="acc-arrow">▾</span>
    </summary>
    <div class="accordion-body">
      <div class="net-grid">
        <div class="net-box"><div class="nb-num">${networkRequests.length}</div><div class="nb-lbl">Requests</div></div>
        <div class="net-box"><div class="nb-num" style="color:${(networkSummary.failedRequests||0)>0?"#DC2626":"inherit"}">${networkSummary.failedRequests || 0}</div><div class="nb-lbl">Failed</div></div>
        <div class="net-box"><div class="nb-num">${networkSummary.totalTransferredKB || 0} KB</div><div class="nb-lbl">Transferred</div></div>
        <div class="net-box"><div class="nb-num">${networkSummary.slowestRequest ? networkSummary.slowestRequest.totalDurationMs + " ms" : "—"}</div><div class="nb-lbl">Slowest</div></div>
      </div>
      ${networkRequests.length ? `
      <table>
        <thead><tr><th>Status</th><th>Method</th><th>URL</th><th>Type</th><th>Time</th><th>Size</th></tr></thead>
        <tbody>${networkHtml}</tbody>
      </table>` : '<p style="color:var(--muted);font-size:.85rem">No network requests captured.</p>'}
    </div>
  </details>

  <!-- ── CONSOLE ── -->
  <details class="accordion">
    <summary>
      🖥 Console &mdash; ${consoleLogs.length} entries
      ${consoleErrors > 0 ? `&nbsp;<span style="color:#DC2626;font-size:.78rem;font-weight:600">${consoleErrors} error${consoleErrors>1?"s":""}</span>` : ""}
      <span class="acc-arrow">▾</span>
    </summary>
    <div class="accordion-body">
      ${consoleLogs.length ? `
      <table>
        <thead><tr><th>Type</th><th>Message</th></tr></thead>
        <tbody>${consoleHtml}</tbody>
      </table>` : '<p style="color:var(--muted);font-size:.85rem">No console output captured.</p>'}
    </div>
  </details>

</div><!-- /container -->

<script>
(function () {
  // ── Tab switching ──
  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tab = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
      document.querySelectorAll(".tab-pane").forEach(function (p) { p.classList.remove("active"); });
      btn.classList.add("active");
      var pane = document.getElementById("pane-" + tab);
      if (pane) pane.classList.add("active");
    });
  });

  // ── Impact filter (violations tab) ──
  document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var impact = btn.getAttribute("data-impact");
      document.querySelectorAll("#violations-list .issue-row").forEach(function (row) {
        row.style.display = (impact === "all" || row.getAttribute("data-impact") === impact) ? "" : "none";
      });
    });
  });
})();

// ── Expand / collapse issue detail ──
function toggleRow(id) {
  var row = document.getElementById(id);
  var detail = document.getElementById(id + "-detail");
  if (!detail) return;
  var isOpen = !detail.hidden;
  detail.hidden = isOpen;
  row.classList.toggle("open", !isOpen);
}

// ── Download report ──
function downloadReport() {
  var blob = new Blob([document.documentElement.outerHTML], { type: "text/html" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "accessibility-audit.html";
  a.click();
  URL.revokeObjectURL(a.href);
}
</script>
</body>
</html>`;
}

module.exports = { buildHtmlReport };
