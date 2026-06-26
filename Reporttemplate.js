/**
 * reportTemplate.js
 *
 * Generates a self-contained HTML report (no CDN dependencies, no jQuery,
 * no Bootstrap) from the combined audit data: accessibility (axe results),
 * network capture, and console logs.
 *
 * Why self-contained: this file gets saved to disk and may be opened later,
 * offline, or on a machine with no internet access. Pulling in jQuery/
 * Bootstrap/Popper from a CDN means the report can render broken (dead
 * accordions, unstyled tables) if those CDNs are unreachable - which
 * defeats the purpose of a saved report.
 */

const CUSTOM_TAG = "custom";

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
  const order = { critical: 4, serious: 3, moderate: 2, minor: 1 };
  return order[impact] || 0;
}

function impactColor(impact) {
  const colors = {
    critical: "#B91C1C",
    serious: "#B45309",
    moderate: "#A16207",
    minor: "#475569",
  };
  return colors[impact] || "#475569";
}

function renderViolationCard(violation, isCustom) {
  const impact = violation.impact || "minor";
  const color = impactColor(impact);
  const nodeCount = violation.nodes ? violation.nodes.length : 0;

  const nodesHtml = (violation.nodes || [])
    .map((node, i) => {
      const target = Array.isArray(node.target) ? node.target.join(", ") : "";
      const html = node.html || "";
      const failureSummary = node.failureSummary || "";
      return `
        <div class="node">
          <div class="node-index">${i + 1}</div>
          <div class="node-body">
            <div class="node-selector"><span class="node-label">Selector</span><code>${escapeHtml(target)}</code></div>
            <div class="node-html"><span class="node-label">Element</span><code>${escapeHtml(html)}</code></div>
            ${failureSummary ? `<div class="node-fix"><span class="node-label">Fix</span>${escapeHtml(failureSummary)}</div>` : ""}
          </div>
        </div>`;
    })
    .join("");

  return `
    <details class="violation-card" data-impact="${escapeHtml(impact)}" data-origin="${isCustom ? "custom" : "builtin"}">
      <summary>
        <span class="impact-bar" style="background:${color}"></span>
        <span class="violation-title">${escapeHtml(violation.help || violation.id)}</span>
        <span class="violation-meta">
          ${isCustom ? '<span class="tag tag-custom">custom</span>' : ""}
          <span class="tag tag-impact" style="color:${color};border-color:${color}">${escapeHtml(impact)}</span>
          <span class="tag tag-count">${nodeCount} ${nodeCount === 1 ? "element" : "elements"}</span>
        </span>
      </summary>
      <div class="violation-body">
        <p class="violation-desc">${escapeHtml(violation.description)}</p>
        <div class="violation-id">Rule ID: <code>${escapeHtml(violation.id)}</code></div>
        ${nodesHtml}
      </div>
    </details>`;
}

function renderPassRow(pass) {
  return `
    <tr>
      <td><code>${escapeHtml(pass.id)}</code></td>
      <td>${escapeHtml(pass.help)}</td>
      <td class="num">${pass.nodes ? pass.nodes.length : 0}</td>
    </tr>`;
}

function renderNetworkRow(req) {
  const statusClass =
    req.status >= 500 ? "status-5xx" :
    req.status >= 400 ? "status-4xx" :
    req.status >= 300 ? "status-3xx" :
    req.status >= 200 ? "status-2xx" : "status-none";

  return `
    <tr>
      <td class="${statusClass}">${req.status || (req.failed ? "FAILED" : "—")}</td>
      <td>${escapeHtml(req.method)}</td>
      <td class="url-cell" title="${escapeHtml(req.url)}">${escapeHtml(req.url)}</td>
      <td>${escapeHtml(req.resourceType)}</td>
      <td class="num">${req.totalDurationMs != null ? req.totalDurationMs + " ms" : "—"}</td>
      <td class="num">${req.encodedDataLength ? Math.round(req.encodedDataLength / 1024) + " KB" : "—"}</td>
    </tr>`;
}

function renderConsoleRow(entry) {
  const typeClass = entry.type === "error" || entry.type === "pageerror" ? "console-error" : entry.type === "warning" ? "console-warn" : "console-log";
  return `
    <tr class="${typeClass}">
      <td>${escapeHtml(entry.type)}</td>
      <td>${escapeHtml(entry.text)}</td>
    </tr>`;
}

/**
 * Builds the full HTML report string.
 * @param {object} report - the combinedReport object built in server.js
 * @param {string[]} customRuleIds - ids belonging to custom rules
 */
function buildHtmlReport(report, customRuleIds) {
  const customIdSet = new Set(customRuleIds || []);
  const violations = (report.accessibility.violations || []).slice().sort(
    (a, b) => impactRank(b.impact) - impactRank(a.impact)
  );
  const passes = report.accessibility.passes || [];
  const networkRequests = (report.network && report.network.requests) || [];
  const networkSummary = (report.network && report.network.summary) || {};
  const consoleLogs = report.console || [];

  const customViolations = violations.filter((v) => customIdSet.has(v.id));
  const builtInViolations = violations.filter((v) => !customIdSet.has(v.id));

  const violationCardsHtml = violations
    .map((v) => renderViolationCard(v, customIdSet.has(v.id)))
    .join("");

  const passRowsHtml = passes.map(renderPassRow).join("");

  const networkRowsHtml = networkRequests
    .slice()
    .sort((a, b) => (b.totalDurationMs || 0) - (a.totalDurationMs || 0))
    .map(renderNetworkRow)
    .join("");

  const consoleRowsHtml = consoleLogs.map(renderConsoleRow).join("");

  const errorCount = consoleLogs.filter(
    (l) => l.type === "error" || l.type === "pageerror"
  ).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Accessibility Audit — ${escapeHtml(report.finalUrl || report.requestedUrl || report.url || "")}</title>
<style>
  :root {
    --bg: #FAFAF8;
    --surface: #FFFFFF;
    --border: #E5E1D8;
    --text: #1A1A1A;
    --text-muted: #6B6B68;
    --accent-amber: #B45309;
    --accent-green: #15803D;
    --accent-slate: #475569;
    --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: var(--sans);
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  .header {
    position: sticky;
    top: 0;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 1.25rem 2rem;
    z-index: 10;
  }

  .header h1 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 0.15rem;
  }

  .header .url {
    font-family: var(--mono);
    font-size: 0.85rem;
    color: var(--text-muted);
    word-break: break-all;
  }

  .summary-bar {
    display: flex;
    gap: 1.5rem;
    margin-top: 0.9rem;
    flex-wrap: wrap;
  }

  .summary-stat {
    display: flex;
    flex-direction: column;
  }

  .summary-stat .num {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
  }

  .summary-stat .label {
    font-size: 0.72rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-top: 0.2rem;
  }

  .summary-stat.violations .num { color: var(--accent-amber); }
  .summary-stat.passes .num { color: var(--accent-green); }
  .summary-stat.custom .num { color: var(--accent-slate); }

  main {
    max-width: 980px;
    margin: 0 auto;
    padding: 2rem;
  }

  section { margin-bottom: 2.5rem; }

  section > h2 {
    font-size: 0.95rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }

  .filter-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .filter-btn {
    font: inherit;
    font-size: 0.8rem;
    padding: 0.35rem 0.8rem;
    border: 1px solid var(--border);
    background: var(--surface);
    border-radius: 999px;
    cursor: pointer;
    color: var(--text);
  }

  .filter-btn.active {
    background: var(--text);
    color: var(--surface);
    border-color: var(--text);
  }

  .violation-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 0.6rem;
    overflow: hidden;
  }

  .violation-card[data-hidden="true"] { display: none; }

  .violation-card summary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    cursor: pointer;
    list-style: none;
  }

  .violation-card summary::-webkit-details-marker { display: none; }

  .impact-bar {
    width: 4px;
    height: 1.4rem;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .violation-title {
    flex: 1;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .violation-meta {
    display: flex;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .tag {
    font-size: 0.68rem;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .tag-custom {
    background: #EEF2FF;
    border-color: #C7D2FE;
    color: #4338CA;
  }

  .tag-impact { font-weight: 600; }

  .tag-count {
    color: var(--text-muted);
    background: var(--bg);
  }

  .violation-body {
    padding: 0 1rem 1rem;
    border-top: 1px solid var(--border);
  }

  .violation-desc {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0.75rem 0 0.5rem;
  }

  .violation-id {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
  }

  .violation-id code, code {
    font-family: var(--mono);
    background: #F1EFE7;
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    font-size: 0.8rem;
  }

  .node {
    display: flex;
    gap: 0.6rem;
    padding: 0.6rem 0;
    border-top: 1px dashed var(--border);
  }

  .node:first-child { border-top: none; }

  .node-index {
    flex-shrink: 0;
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .node-body { flex: 1; min-width: 0; }

  .node-selector, .node-html, .node-fix {
    font-size: 0.78rem;
    margin-bottom: 0.3rem;
    word-break: break-word;
  }

  .node-selector code, .node-html code {
    display: inline-block;
    max-width: 100%;
    overflow-wrap: break-word;
    white-space: pre-wrap;
  }

  .node-label {
    display: inline-block;
    font-size: 0.68rem;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 0.03em;
    margin-right: 0.4rem;
    min-width: 4.5rem;
  }

  .node-fix { color: var(--accent-amber); }

  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    font-size: 0.82rem;
  }

  th, td {
    text-align: left;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border);
  }

  th {
    background: var(--bg);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--text-muted);
  }

  tr:last-child td { border-bottom: none; }

  td.num { text-align: right; font-family: var(--mono); }

  .url-cell {
    max-width: 380px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--mono);
    font-size: 0.76rem;
  }

  .status-2xx { color: var(--accent-green); font-weight: 600; }
  .status-3xx { color: var(--accent-slate); font-weight: 600; }
  .status-4xx, .status-5xx { color: var(--accent-amber); font-weight: 600; }

  .console-error td:first-child { color: #B91C1C; font-weight: 600; }
  .console-warn td:first-child { color: var(--accent-amber); font-weight: 600; }

  .empty-state {
    padding: 1.5rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.85rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .net-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .net-summary-grid .box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.75rem;
  }

  .net-summary-grid .box .num { font-size: 1.25rem; font-weight: 700; }
  .net-summary-grid .box .label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }

  @media (max-width: 640px) {
    .header, main { padding: 1rem; }
    .url-cell { max-width: 160px; }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>Accessibility &amp; Diagnostics Report</h1>
    <div class="url">${escapeHtml(report.finalUrl || report.requestedUrl || report.url || "")}</div>
    <div class="summary-bar">
      <div class="summary-stat violations">
        <div class="num">${violations.length}</div>
        <div class="label">Violations</div>
      </div>
      <div class="summary-stat custom">
        <div class="num">${customViolations.length}</div>
        <div class="label">From custom rules</div>
      </div>
      <div class="summary-stat passes">
        <div class="num">${passes.length}</div>
        <div class="label">Passed checks</div>
      </div>
      <div class="summary-stat">
        <div class="num">${networkRequests.length}</div>
        <div class="label">Network requests</div>
      </div>
      <div class="summary-stat">
        <div class="num">${errorCount}</div>
        <div class="label">Console errors</div>
      </div>
    </div>
  </div>

  <main>
    <section id="violations-section">
      <h2>Violations (${violations.length})</h2>
      <div class="filter-row">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="builtin">Built-in (${builtInViolations.length})</button>
        <button class="filter-btn" data-filter="custom">Custom (${customViolations.length})</button>
      </div>
      ${violations.length ? violationCardsHtml : '<div class="empty-state">No violations found.</div>'}
    </section>

    <section id="network-section">
      <h2>Network (${networkRequests.length} requests)</h2>
      <div class="net-summary-grid">
        <div class="box"><div class="num">${networkSummary.failedRequests || 0}</div><div class="label">Failed</div></div>
        <div class="box"><div class="num">${networkSummary.totalTransferredKB || 0} KB</div><div class="label">Transferred</div></div>
        <div class="box"><div class="num">${networkSummary.slowestRequest ? networkSummary.slowestRequest.totalDurationMs + " ms" : "—"}</div><div class="label">Slowest request</div></div>
      </div>
      ${networkRequests.length ? `
      <table>
        <thead><tr><th>Status</th><th>Method</th><th>URL</th><th>Type</th><th>Time</th><th>Size</th></tr></thead>
        <tbody>${networkRowsHtml}</tbody>
      </table>` : '<div class="empty-state">No network requests captured.</div>'}
    </section>

    <section id="console-section">
      <h2>Console (${consoleLogs.length} entries)</h2>
      ${consoleLogs.length ? `
      <table>
        <thead><tr><th>Type</th><th>Message</th></tr></thead>
        <tbody>${consoleRowsHtml}</tbody>
      </table>` : '<div class="empty-state">No console output captured.</div>'}
    </section>

    <section id="passes-section">
      <h2>Passed checks (${passes.length})</h2>
      ${passes.length ? `
      <table>
        <thead><tr><th>Rule ID</th><th>Description</th><th>Elements</th></tr></thead>
        <tbody>${passRowsHtml}</tbody>
      </table>` : '<div class="empty-state">No passed checks recorded.</div>'}
    </section>
  </main>

  <script>
    // Plain JS, no jQuery: filter violation cards by built-in vs custom origin.
    document.querySelectorAll(".filter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var filter = btn.getAttribute("data-filter");
        document.querySelectorAll(".violation-card").forEach(function (card) {
          var origin = card.getAttribute("data-origin");
          var show = filter === "all" || filter === origin;
          card.setAttribute("data-hidden", show ? "false" : "true");
        });
      });
    });
  </script>
</body>
</html>`;
}

module.exports = { buildHtmlReport };