/**
 * customAxeRules.js
 *
 * Defines custom axe-core rules beyond the built-in WCAG ruleset.
 * These get injected into the page alongside axe-core itself, then
 * registered via axe.configure() before axe.run() is called.
 *
 * To add a new rule:
 *   1. Add a check function (the actual test logic, runs per-element)
 *   2. Add a rule entry (ties a check to a selector + metadata)
 *   3. Add the rule id to CUSTOM_RULE_IDS so it's included in results
 *
 * Reference: https://github.com/dequelabs/axe-core/blob/master/doc/API.md#api-name-axeconfigure
 */

// Each check's evaluate function runs INSIDE the browser (via page.evaluate),
// so it must be self-contained — no closures over Node variables, no
// references to anything outside the function body itself.
const customChecks = [
  {
    id: "custom-target-size-check",
    evaluate: function (node) {
      const rect = node.getBoundingClientRect();
      const minSize = 24; // WCAG 2.2 AA target size minimum (px)
      return rect.width >= minSize && rect.height >= minSize;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Target meets minimum size of 24x24px",
        fail: "Target is smaller than the recommended 24x24px minimum tap/click area",
      },
    },
  },
  {
    id: "custom-placeholder-as-label-check",
    evaluate: function (node) {
      const hasPlaceholder = node.hasAttribute("placeholder");
      const hasLabel =
        node.hasAttribute("aria-label") ||
        node.hasAttribute("aria-labelledby") ||
        !!document.querySelector(`label[for="${node.id}"]`);
      // Fails if it ONLY has a placeholder and nothing else
      return !(hasPlaceholder && !hasLabel);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Input has a proper label, not just a placeholder",
        fail: "Input relies on placeholder text instead of a real label — placeholder text disappears on focus and is not reliably announced by screen readers",
      },
    },
  },
  {
    id: "custom-empty-link-check",
    evaluate: function (node) {
      const text = node.textContent.trim();
      const hasAriaLabel = node.hasAttribute("aria-label");
      const hasTitle = node.hasAttribute("title");
      const hasImgAlt = !!node.querySelector("img[alt]:not([alt=''])");
      return text.length > 0 || hasAriaLabel || hasTitle || hasImgAlt;
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Link has accessible text content",
        fail: "Link has no discernible text — screen reader users will hear only 'link', with no indication of where it goes",
      },
    },
  },
  {
    id: "custom-generic-link-text-check",
    evaluate: function (node) {
      const genericPhrases = [
        "click here",
        "read more",
        "learn more",
        "here",
        "more",
        "link",
      ];
      const text = node.textContent.trim().toLowerCase();
      return !genericPhrases.includes(text);
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Link text is descriptive",
        fail: "Link text is generic (e.g. 'click here') and doesn't describe the destination out of context — a problem for screen reader users navigating by links list",
      },
    },
  },
  {
    id: "custom-heading-skip-check",
    evaluate: function (node) {
      // Compares this heading's level against the previously rendered heading
      const headings = Array.from(
        document.querySelectorAll("h1, h2, h3, h4, h5, h6")
      );
      const index = headings.indexOf(node);
      if (index <= 0) return true; // first heading, nothing to compare

      const currentLevel = parseInt(node.tagName.charAt(1), 10);
      const prevLevel = parseInt(headings[index - 1].tagName.charAt(1), 10);

      // Fails if this heading skips more than one level deeper than the previous
      return currentLevel - prevLevel <= 1;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Heading level follows logical document outline",
        fail: "Heading level skips one or more levels (e.g. h2 followed directly by h4), breaking the document outline for screen reader users",
      },
    },
  },
  {
    id: "custom-new-tab-warning-check",
    evaluate: function (node) {
      const opensNewTab = node.getAttribute("target") === "_blank";
      if (!opensNewTab) return true; // not applicable, passes trivially

      const text = node.textContent.toLowerCase();
      const ariaLabel = (node.getAttribute("aria-label") || "").toLowerCase();
      const title = (node.getAttribute("title") || "").toLowerCase();
      const combined = text + " " + ariaLabel + " " + title;

      const indicatesNewTab =
        combined.includes("new tab") ||
        combined.includes("new window") ||
        combined.includes("opens in");

      // Also accept a visually-hidden icon/span with new-tab wording, or an
      // aria-describedby pointing at such text
      const hasDescribedBy = node.hasAttribute("aria-describedby");

      return indicatesNewTab || hasDescribedBy;
    },
    metadata: {
      impact: "minor",
      messages: {
        pass: "Link opening in a new tab warns the user beforehand",
        fail: "Link opens in a new tab/window without warning the user — this is disorienting for screen reader and low-vision users who may not notice a new tab opened",
      },
    },
  },
  {
    id: "custom-blank-target-noopener-check",
    evaluate: function (node) {
      if (node.getAttribute("target") !== "_blank") return true;
      const rel = (node.getAttribute("rel") || "").toLowerCase();
      return rel.includes("noopener") || rel.includes("noreferrer");
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Link with target=_blank includes rel=noopener/noreferrer",
        fail: "Link opens in a new tab without rel='noopener', leaving the new page with window.opener access to this page (a security and performance issue, commonly checked alongside accessibility audits)",
      },
    },
  },
  {
    id: "custom-redundant-title-check",
    evaluate: function (node) {
      const title = (node.getAttribute("title") || "").trim().toLowerCase();
      if (!title) return true; // no title attribute, not applicable
      const text = node.textContent.trim().toLowerCase();
      // Fails if title is just an exact duplicate of the visible text —
      // screen readers will announce the same string twice
      return title !== text;
    },
    metadata: {
      impact: "minor",
      messages: {
        pass: "Title attribute (if present) adds information beyond the visible text",
        fail: "The title attribute exactly duplicates the element's visible text, causing screen readers to announce the same content twice",
      },
    },
  },
  {
    id: "custom-positive-tabindex-check",
    evaluate: function (node) {
      const tabindex = node.getAttribute("tabindex");
      if (tabindex === null) return true;
      const value = parseInt(tabindex, 10);
      // 0 and -1 are fine (standard patterns); only positive values break
      // natural tab order
      return Number.isNaN(value) || value <= 0;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Element does not use a positive tabindex",
        fail: "Element uses a positive tabindex value, which overrides the natural DOM tab order and creates a confusing, hard-to-maintain keyboard navigation sequence",
      },
    },
  },
  {
    id: "custom-form-missing-submit-check",
    evaluate: function (node) {
      const hasSubmitButton = !!node.querySelector(
        "button[type='submit'], input[type='submit'], button:not([type])"
      );
      return hasSubmitButton;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Form has a discoverable submit control",
        fail: "Form has no submit button (button[type=submit], input[type=submit], or a default button) — keyboard-only and screen reader users may have no way to know how to submit the form, especially if submission relies solely on a JS click handler on a non-semantic element",
      },
    },
  },
  {
    id: "custom-table-caption-check",
    evaluate: function (node) {
      // Only flag data tables (those with th elements), skip layout tables
      const hasHeaders = !!node.querySelector("th");
      if (!hasHeaders) return true;

      const hasCaption = !!node.querySelector("caption");
      const hasAriaLabel =
        node.hasAttribute("aria-label") || node.hasAttribute("aria-labelledby");

      return hasCaption || hasAriaLabel;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Data table has a caption or accessible label describing its purpose",
        fail: "Data table (has <th> headers) has no <caption> or aria-label — screen reader users hear column/row headers with no context for what the table represents",
      },
    },
  },
];

const customRules = [
  {
    id: "custom-target-size-check",
    selector: "button, a, input[type='button'], input[type='submit'], [role='button']",
    tags: ["custom", "best-practice", "wcag22aa"],
    metadata: {
      description: "Ensures interactive targets meet the minimum 24x24px size",
      help: "Interactive elements should be at least 24x24 CSS pixels",
    },
    any: ["custom-target-size-check"],
    all: [],
    none: [],
  },
  {
    id: "custom-placeholder-as-label-check",
    selector: "input[type='text'], input[type='email'], input[type='search'], input[type='tel'], textarea",
    tags: ["custom", "best-practice"],
    metadata: {
      description: "Ensures form fields aren't relying on placeholder text as their only label",
      help: "Form fields should have a real label, not just placeholder text",
    },
    any: ["custom-placeholder-as-label-check"],
    all: [],
    none: [],
  },
  {
    id: "custom-empty-link-check",
    selector: "a[href]",
    tags: ["custom", "wcag2a", "wcag244"],
    metadata: {
      description: "Ensures links have discernible text",
      help: "Links must have text content, an aria-label, a title, or an alt-text image inside",
    },
    any: ["custom-empty-link-check"],
    all: [],
    none: [],
  },
  {
    id: "custom-generic-link-text-check",
    selector: "a[href]",
    tags: ["custom", "best-practice"],
    metadata: {
      description: "Flags generic, non-descriptive link text",
      help: "Link text should describe the destination without relying on surrounding context",
    },
    any: ["custom-generic-link-text-check"],
    all: [],
    none: [],
  },
  {
    id: "custom-heading-skip-check",
    selector: "h1, h2, h3, h4, h5, h6",
    tags: ["custom", "best-practice", "wcag131"],
    metadata: {
      description: "Ensures heading levels don't skip (e.g. h2 -> h4)",
      help: "Heading levels should descend by no more than one level at a time",
    },
    any: ["custom-heading-skip-check"],
    all: [],
    none: [],
  },
  {
    id: "custom-new-tab-warning-check",
    selector: "a[target='_blank']",
    tags: ["custom", "best-practice", "wcag2a"],
    metadata: {
      description: "Ensures links opening in a new tab warn the user beforehand",
      help: "Links with target=_blank should indicate they open in a new tab/window",
    },
    any: ["custom-new-tab-warning-check"],
    all: [],
    none: [],
  },
  {
    id: "custom-blank-target-noopener-check",
    selector: "a[target='_blank']",
    tags: ["custom", "best-practice", "security"],
    metadata: {
      description: "Ensures target=_blank links include rel=noopener",
      help: "Links with target=_blank should include rel='noopener' or 'noreferrer'",
    },
    any: ["custom-blank-target-noopener-check"],
    all: [],
    none: [],
  },
  {
    id: "custom-redundant-title-check",
    selector: "a[title], button[title]",
    tags: ["custom", "best-practice"],
    metadata: {
      description: "Flags title attributes that exactly duplicate visible text",
      help: "Title attribute should add information, not repeat the visible text verbatim",
    },
    any: ["custom-redundant-title-check"],
    all: [],
    none: [],
  },
  {
    id: "custom-positive-tabindex-check",
    selector: "[tabindex]",
    tags: ["custom", "best-practice", "wcag2a", "wcag243"],
    metadata: {
      description: "Flags positive tabindex values that override natural tab order",
      help: "Avoid positive tabindex values; use 0 or -1 instead",
    },
    any: ["custom-positive-tabindex-check"],
    all: [],
    none: [],
  },
  {
    id: "custom-form-missing-submit-check",
    selector: "form",
    tags: ["custom", "best-practice", "wcag2a"],
    metadata: {
      description: "Ensures forms have a discoverable submit control",
      help: "Forms should include a real submit button, not rely solely on JS handlers",
    },
    any: ["custom-form-missing-submit-check"],
    all: [],
    none: [],
  },
  {
    id: "custom-table-caption-check",
    selector: "table",
    tags: ["custom", "best-practice", "wcag2a", "wcag131"],
    metadata: {
      description: "Ensures data tables have a caption or accessible label",
      help: "Data tables (with <th> headers) should have a <caption> or aria-label",
    },
    any: ["custom-table-caption-check"],
    all: [],
    none: [],
  },
];

const CUSTOM_RULE_IDS = customRules.map((r) => r.id);

module.exports = {
  customChecks,
  customRules,
  CUSTOM_RULE_IDS,
};