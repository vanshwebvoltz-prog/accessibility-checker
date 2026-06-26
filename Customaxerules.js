/**
 * customAxeRules.js
 *
 * Comprehensive custom axe-core rules covering WCAG 2.0 (A/AA/AAA), WCAG 2.1, WCAG 2.2,
 * and industry best practices. 107 rules across 12 categories.
 *
 * Sources:
 *   - https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
 *   - https://www.w3.org/TR/WCAG22/
 *   - https://dequeuniversity.com/rules/axe/4.6
 *
 * Each check's evaluate function runs INSIDE the browser (via page.evaluate),
 * so it must be self-contained — no closures over Node variables.
 */

const customChecks = [

  // ============================================================
  // IMAGES & MEDIA
  // ============================================================
  {
    id: "custom-image-alt-check",
    evaluate: function (node) {
      const role = node.getAttribute("role");
      if (role === "none" || role === "presentation") return true;
      return node.getAttribute("alt") !== null;
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Image has an alt attribute",
        fail: "Image is missing an alt attribute — screen readers cannot describe it to blind users",
      },
    },
  },
  {
    id: "custom-input-image-alt-check",
    evaluate: function (node) {
      const alt = node.getAttribute("alt");
      const ariaLabel = node.getAttribute("aria-label");
      const ariaLabelledby = node.getAttribute("aria-labelledby");
      const value = node.getAttribute("value");
      return !!(alt || ariaLabel || ariaLabelledby || value);
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Image input has alternative text",
        fail: "Image input is missing alt text — screen reader users won't know what the button does",
      },
    },
  },
  {
    id: "custom-svg-img-alt-check",
    evaluate: function (node) {
      const role = node.getAttribute("role");
      if (role !== "img" && role !== "graphics-document" && role !== "graphics-symbol") return true;
      const ariaLabel = node.getAttribute("aria-label");
      const ariaLabelledby = node.getAttribute("aria-labelledby");
      const title = node.querySelector("title");
      return !!(ariaLabel || ariaLabelledby || (title && title.textContent.trim()));
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "SVG image has an accessible name",
        fail: "SVG with img role has no accessible name — add aria-label, aria-labelledby, or a <title> child element",
      },
    },
  },
  {
    id: "custom-role-img-alt-check",
    evaluate: function (node) {
      const ariaLabel = node.getAttribute("aria-label");
      const ariaLabelledby = node.getAttribute("aria-labelledby");
      const title = node.getAttribute("title");
      return !!(ariaLabel || ariaLabelledby || title);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Element with role=img has an accessible name",
        fail: "Element with role=img has no accessible name — add aria-label or aria-labelledby",
      },
    },
  },
  {
    id: "custom-video-caption-check",
    evaluate: function (node) {
      const tracks = node.querySelectorAll("track[kind='captions'], track[kind='subtitles']");
      return tracks.length > 0;
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Video has caption or subtitle tracks",
        fail: "Video element has no caption or subtitle tracks — deaf users cannot access the audio content",
      },
    },
  },
  {
    id: "custom-no-autoplay-check",
    evaluate: function (node) {
      if (!node.hasAttribute("autoplay")) return true;
      return node.hasAttribute("muted") || node.muted === true;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Media element does not autoplay unmuted audio",
        fail: "Media element autoplays with audio — this interferes with screen reader announcements and can startle users",
      },
    },
  },
  {
    id: "custom-object-alt-check",
    evaluate: function (node) {
      const ariaLabel = node.getAttribute("aria-label");
      const ariaLabelledby = node.getAttribute("aria-labelledby");
      const title = node.getAttribute("title");
      const innerText = node.textContent.trim();
      return !!(ariaLabel || ariaLabelledby || title || innerText);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Object element has fallback text or accessible label",
        fail: "Object element has no alternative text — add aria-label, title, or inner fallback content",
      },
    },
  },
  {
    id: "custom-image-redundant-alt-check",
    evaluate: function (node) {
      const alt = (node.getAttribute("alt") || "").trim().toLowerCase();
      if (!alt) return true;
      const figure = node.closest("figure");
      if (figure) {
        const cap = figure.querySelector("figcaption");
        if (cap && cap.textContent.trim().toLowerCase() === alt) return false;
      }
      const parent = node.parentElement;
      if (parent) {
        const siblingText = Array.from(parent.childNodes)
          .filter(function (n) { return n.nodeType === 3; })
          .map(function (n) { return n.textContent.trim().toLowerCase(); })
          .join(" ").trim();
        if (siblingText === alt) return false;
      }
      return true;
    },
    metadata: {
      impact: "minor",
      messages: {
        pass: "Image alt text does not duplicate adjacent visible text",
        fail: "Image alt text duplicates adjacent text — screen readers will announce the same content twice",
      },
    },
  },
  {
    id: "custom-image-map-area-alt-check",
    evaluate: function (node) {
      if (!node.getAttribute("href")) return true;
      const alt = node.getAttribute("alt");
      const ariaLabel = node.getAttribute("aria-label");
      return !!(alt || ariaLabel);
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Image map area has alternative text",
        fail: "Image map <area> element is missing alt text — screen readers cannot describe the link target",
      },
    },
  },
  {
    id: "custom-audio-transcript-check",
    evaluate: function (node) {
      const ariaDescribedby = node.getAttribute("aria-describedby");
      const next = node.nextElementSibling;
      const hasTranscriptLink = next &&
        (next.tagName.toLowerCase() === "a" ||
          next.textContent.toLowerCase().includes("transcript"));
      return !!(ariaDescribedby || hasTranscriptLink);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Audio element has an accessible transcript reference",
        fail: "Audio element has no transcript reference — deaf users cannot access the audio content",
      },
    },
  },

  // ============================================================
  // ARIA
  // ============================================================
  {
    id: "custom-aria-hidden-body-check",
    evaluate: function (node) {
      return node.getAttribute("aria-hidden") !== "true";
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "The document body does not have aria-hidden=true",
        fail: "The document body has aria-hidden='true', which hides the entire page from assistive technologies",
      },
    },
  },
  {
    id: "custom-aria-hidden-focus-check",
    evaluate: function (node) {
      const focusable = "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])";
      return !node.querySelector(focusable);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "aria-hidden element contains no focusable descendants",
        fail: "aria-hidden element contains focusable elements — keyboard users can focus them but screen readers won't announce them",
      },
    },
  },
  {
    id: "custom-aria-valid-role-check",
    evaluate: function (node) {
      var validRoles = [
        "alert","alertdialog","application","article","banner","button","cell",
        "checkbox","columnheader","combobox","complementary","contentinfo",
        "definition","dialog","directory","document","feed","figure","form",
        "grid","gridcell","group","heading","img","link","list","listbox",
        "listitem","log","main","marquee","math","menu","menubar","menuitem",
        "menuitemcheckbox","menuitemradio","navigation","none","note","option",
        "presentation","progressbar","radio","radiogroup","region","row",
        "rowgroup","rowheader","scrollbar","search","searchbox","separator",
        "slider","spinbutton","status","switch","tab","table","tablist",
        "tabpanel","term","textbox","timer","toolbar","tooltip","tree",
        "treegrid","treeitem","generic","graphics-document","graphics-object",
        "graphics-symbol",
      ];
      var roles = (node.getAttribute("role") || "").split(/\s+/).filter(Boolean);
      return roles.every(function (r) { return validRoles.indexOf(r) !== -1; });
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Element uses a valid ARIA role",
        fail: "Element has an invalid ARIA role value — assistive technologies will ignore or misinterpret the element",
      },
    },
  },
  {
    id: "custom-aria-deprecated-role-check",
    evaluate: function (node) {
      var deprecated = ["directory"];
      var role = (node.getAttribute("role") || "").trim();
      return deprecated.indexOf(role) === -1;
    },
    metadata: {
      impact: "minor",
      messages: {
        pass: "Element does not use a deprecated ARIA role",
        fail: "Element uses a deprecated ARIA role — update to a currently supported equivalent",
      },
    },
  },
  {
    id: "custom-aria-labelledby-valid-check",
    evaluate: function (node) {
      var labelledby = node.getAttribute("aria-labelledby");
      if (!labelledby) return true;
      return labelledby.split(/\s+/).every(function (id) {
        return !!document.getElementById(id);
      });
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "aria-labelledby references valid element IDs",
        fail: "aria-labelledby references one or more IDs that don't exist — the accessible name cannot be computed",
      },
    },
  },
  {
    id: "custom-aria-describedby-valid-check",
    evaluate: function (node) {
      var describedby = node.getAttribute("aria-describedby");
      if (!describedby) return true;
      return describedby.split(/\s+/).every(function (id) {
        return !!document.getElementById(id);
      });
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "aria-describedby references valid element IDs",
        fail: "aria-describedby references one or more missing IDs — the description will be empty for assistive technology users",
      },
    },
  },
  {
    id: "custom-aria-required-attr-check",
    evaluate: function (node) {
      var role = node.getAttribute("role");
      var required = {
        checkbox: ["aria-checked"],
        combobox: ["aria-expanded"],
        option: ["aria-selected"],
        radio: ["aria-checked"],
        scrollbar: ["aria-valuenow", "aria-valuemax", "aria-valuemin"],
        slider: ["aria-valuenow", "aria-valuemax", "aria-valuemin"],
        spinbutton: ["aria-valuenow"],
        switch: ["aria-checked"],
      };
      if (!role || !required[role]) return true;
      return required[role].every(function (attr) { return node.hasAttribute(attr); });
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Element with ARIA role has all required ARIA attributes",
        fail: "Element with ARIA role is missing required ARIA attributes — assistive technologies cannot convey the element's state",
      },
    },
  },
  {
    id: "custom-aria-required-children-check",
    evaluate: function (node) {
      var role = node.getAttribute("role");
      var req = {
        grid: ["row","rowgroup"], list: ["listitem"], listbox: ["option","group"],
        menu: ["menuitem","menuitemcheckbox","menuitemradio","group"],
        menubar: ["menuitem","menuitemcheckbox","menuitemradio"],
        radiogroup: ["radio"], tablist: ["tab"],
        tree: ["treeitem","group"], treegrid: ["row","rowgroup"],
      };
      if (!role || !req[role]) return true;
      var allowed = req[role];
      var childRoles = Array.from(node.children)
        .map(function (c) { return c.getAttribute("role"); })
        .filter(Boolean);
      return childRoles.some(function (r) { return allowed.indexOf(r) !== -1; });
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "ARIA role has required child roles present",
        fail: "ARIA role is missing required owned child roles — the widget will not function correctly for assistive technology users",
      },
    },
  },
  {
    id: "custom-aria-required-parent-check",
    evaluate: function (node) {
      var role = node.getAttribute("role");
      var req = {
        listitem: ["list","group"],
        menuitem: ["menu","menubar","group"],
        menuitemcheckbox: ["menu","menubar","group"],
        menuitemradio: ["menu","menubar","group","radiogroup"],
        option: ["listbox","group"],
        row: ["grid","rowgroup","table","treegrid"],
        tab: ["tablist"],
        treeitem: ["tree","group"],
      };
      if (!role || !req[role]) return true;
      var allowed = req[role];
      var ancestor = node.parentElement;
      while (ancestor) {
        var ar = ancestor.getAttribute("role");
        if (ar && allowed.indexOf(ar) !== -1) return true;
        ancestor = ancestor.parentElement;
      }
      return false;
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "ARIA role is contained by a valid required parent role",
        fail: "ARIA role is not contained within the required parent role — the widget structure is invalid for assistive technologies",
      },
    },
  },
  {
    id: "custom-aria-dialog-name-check",
    evaluate: function (node) {
      return !!(node.getAttribute("aria-label") || node.getAttribute("aria-labelledby"));
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "ARIA dialog has an accessible name",
        fail: "ARIA dialog or alertdialog has no accessible name — screen reader users won't know the dialog's purpose when it opens",
      },
    },
  },
  {
    id: "custom-aria-text-check",
    evaluate: function (node) {
      var focusable = "a[href], button, input, select, textarea, [tabindex]";
      return !node.querySelector(focusable);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Element with role=text has no focusable descendants",
        fail: "Element with role=text contains focusable descendants — role=text must only wrap static text content",
      },
    },
  },
  {
    id: "custom-aria-treeitem-name-check",
    evaluate: function (node) {
      return !!(
        node.getAttribute("aria-label") ||
        node.getAttribute("aria-labelledby") ||
        node.textContent.trim()
      );
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "ARIA treeitem has an accessible name",
        fail: "ARIA treeitem has no accessible name — screen reader users will not be able to identify this tree node",
      },
    },
  },
  {
    id: "custom-aria-expanded-button-check",
    evaluate: function (node) {
      var controls = node.getAttribute("aria-controls") || node.getAttribute("aria-haspopup");
      if (!controls) return true;
      return node.getAttribute("aria-expanded") !== null;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Button with aria-controls/aria-haspopup has aria-expanded",
        fail: "Button controls or has a popup but is missing aria-expanded — screen readers cannot convey the open/closed state",
      },
    },
  },
  {
    id: "custom-aria-live-region-check",
    evaluate: function (node) {
      var val = node.getAttribute("aria-live");
      if (!val) return true;
      return ["off", "polite", "assertive"].indexOf(val) !== -1;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "aria-live attribute has a valid value",
        fail: "aria-live attribute has an invalid value — screen readers will not announce changes to this region correctly",
      },
    },
  },
  {
    id: "custom-presentation-role-conflict-check",
    evaluate: function (node) {
      var role = node.getAttribute("role");
      if (role !== "none" && role !== "presentation") return true;
      var hasAriaAttrs = Array.from(node.attributes).some(function (a) {
        return a.name.startsWith("aria-") && a.name !== "aria-hidden";
      });
      return !hasAriaAttrs && !node.hasAttribute("tabindex");
    },
    metadata: {
      impact: "minor",
      messages: {
        pass: "Presentational element has no conflicting ARIA attributes or tabindex",
        fail: "Element marked as presentation/none has ARIA attributes or tabindex — these will be ignored since the element is presentational",
      },
    },
  },

  // ============================================================
  // COLOR & CONTRAST
  // ============================================================
  {
    id: "custom-color-contrast-check",
    evaluate: function (node) {
      function parseRgb(str) {
        var m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return m ? [+m[1], +m[2], +m[3]] : null;
      }
      function lum(rgb) {
        return rgb.map(function (c) {
          var s = c / 255;
          return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        }).reduce(function (sum, c, i) {
          return sum + c * [0.2126, 0.7152, 0.0722][i];
        }, 0);
      }
      var style = window.getComputedStyle(node);
      var fg = parseRgb(style.color);
      var bg = parseRgb(style.backgroundColor);
      if (!fg || !bg) return true;
      var L1 = lum(fg), L2 = lum(bg);
      var ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      var fs = parseFloat(style.fontSize);
      var bold = parseInt(style.fontWeight, 10) >= 700 || style.fontWeight === "bold";
      var large = fs >= 24 || (bold && fs >= 18.67);
      return ratio >= (large ? 3.0 : 4.5);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Text meets WCAG AA contrast ratio (4.5:1 normal, 3:1 large text)",
        fail: "Text does not meet WCAG AA minimum contrast ratio — low vision users may be unable to read this content",
      },
    },
  },
  {
    id: "custom-color-contrast-enhanced-check",
    evaluate: function (node) {
      function parseRgb(str) {
        var m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return m ? [+m[1], +m[2], +m[3]] : null;
      }
      function lum(rgb) {
        return rgb.map(function (c) {
          var s = c / 255;
          return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        }).reduce(function (sum, c, i) {
          return sum + c * [0.2126, 0.7152, 0.0722][i];
        }, 0);
      }
      var style = window.getComputedStyle(node);
      var fg = parseRgb(style.color);
      var bg = parseRgb(style.backgroundColor);
      if (!fg || !bg) return true;
      var L1 = lum(fg), L2 = lum(bg);
      var ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      var fs = parseFloat(style.fontSize);
      var bold = parseInt(style.fontWeight, 10) >= 700 || style.fontWeight === "bold";
      var large = fs >= 24 || (bold && fs >= 18.67);
      return ratio >= (large ? 4.5 : 7.0);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Text meets WCAG AAA enhanced contrast (7:1 normal, 4.5:1 large text)",
        fail: "Text does not meet WCAG AAA enhanced contrast ratio — consider increasing contrast for maximum accessibility",
      },
    },
  },
  {
    id: "custom-non-text-contrast-check",
    evaluate: function (node) {
      function parseRgb(str) {
        var m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return m ? [+m[1], +m[2], +m[3]] : null;
      }
      function lum(rgb) {
        return rgb.map(function (c) {
          var s = c / 255;
          return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        }).reduce(function (sum, c, i) {
          return sum + c * [0.2126, 0.7152, 0.0722][i];
        }, 0);
      }
      var style = window.getComputedStyle(node);
      var border = parseRgb(style.borderColor);
      var bg = parseRgb(style.backgroundColor);
      if (!border || !bg) return true;
      if (style.borderStyle === "none" || style.borderWidth === "0px") return true;
      var L1 = lum(border), L2 = lum(bg);
      var ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      return ratio >= 3.0;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "UI component border meets 3:1 non-text contrast ratio (WCAG 1.4.11)",
        fail: "UI component border does not meet the 3:1 non-text contrast requirement — low-vision users may not perceive the component boundary",
      },
    },
  },
  {
    id: "custom-focus-visible-check",
    evaluate: function (node) {
      var style = window.getComputedStyle(node);
      if (style.outlineStyle === "none" || style.outlineWidth === "0px") {
        var shadow = style.boxShadow;
        return shadow && shadow !== "none";
      }
      return true;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Interactive element has a visible focus indicator",
        fail: "Interactive element has outline removed with no substitute — keyboard users cannot see which element is focused",
      },
    },
  },
  {
    id: "custom-color-not-sole-means-check",
    evaluate: function (node) {
      var cls = Array.from(node.classList).join(" ").toLowerCase();
      var isStatus = cls.includes("error") || cls.includes("warning") || cls.includes("success") || cls.includes("alert");
      if (!isStatus) return true;
      var hasIcon = !!node.querySelector("svg, img, [aria-label], [role='img']");
      var hasText = node.textContent.trim().length > 0;
      return hasIcon || hasText;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Status indicator uses more than color to convey meaning",
        fail: "Status indicator may rely solely on color — include an icon or text so color-blind users can interpret the status",
      },
    },
  },

  // ============================================================
  // KEYBOARD & FOCUS
  // ============================================================
  {
    id: "custom-skip-navigation-check",
    evaluate: function (node) {
      var links = document.querySelectorAll("a[href^='#']");
      for (var i = 0; i < links.length; i++) {
        var t = links[i].textContent.toLowerCase();
        if (t.includes("skip") || t.includes("jump") || t.includes("bypass")) return true;
      }
      return false;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Page has a skip navigation link",
        fail: "Page has no skip navigation link — keyboard-only users must tab through all navigation on every page load",
      },
    },
  },
  {
    id: "custom-accesskeys-unique-check",
    evaluate: function (node) {
      var key = node.getAttribute("accesskey");
      if (!key) return true;
      return document.querySelectorAll("[accesskey='" + key + "']").length === 1;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "accesskey value is unique across the document",
        fail: "Duplicate accesskey value — only one element will respond to this keyboard shortcut, causing unpredictable behavior",
      },
    },
  },
  {
    id: "custom-scrollable-keyboard-check",
    evaluate: function (node) {
      var style = window.getComputedStyle(node);
      var ov = style.overflow + style.overflowX + style.overflowY;
      if (!ov.includes("scroll") && !ov.includes("auto")) return true;
      return node.getAttribute("tabindex") !== null ||
        !!node.querySelector("a[href], button, input, select, textarea, [tabindex]");
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Scrollable region is keyboard accessible",
        fail: "Scrollable region cannot be reached by keyboard — add tabindex='0' or ensure it contains focusable content",
      },
    },
  },
  {
    id: "custom-nested-interactive-check",
    evaluate: function (node) {
      var sel = "a[href], button, input, select, textarea, [role='button'], [role='link'], [role='checkbox'], [role='radio']";
      return !node.querySelector(sel);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Interactive control has no nested interactive descendants",
        fail: "Interactive controls are nested — this is invalid HTML and creates inconsistent screen reader behavior",
      },
    },
  },
  {
    id: "custom-frame-focusable-check",
    evaluate: function (node) {
      var tabindex = node.getAttribute("tabindex");
      if (!tabindex || parseInt(tabindex, 10) !== -1) return true;
      try {
        var inner = node.contentDocument || (node.contentWindow && node.contentWindow.document);
        if (!inner) return true;
        return !inner.querySelector("a[href], button, input, select, textarea");
      } catch (e) { return true; }
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Frame with focusable content does not have tabindex=-1",
        fail: "Frame containing focusable content has tabindex=-1 — keyboard users cannot access the frame's interactive elements",
      },
    },
  },
  {
    id: "custom-no-keyboard-trap-check",
    evaluate: function (node) {
      var role = node.getAttribute("role");
      if (role !== "dialog" && role !== "alertdialog") return true;
      var closeBtn = node.querySelector(
        "button[aria-label*='close' i], button[aria-label*='dismiss' i], button[aria-label*='cancel' i], [data-dismiss]"
      );
      return !!(closeBtn || node.getAttribute("aria-describedby"));
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Dialog has a visible close or dismiss mechanism",
        fail: "Dialog appears to have no close button — keyboard users may become trapped inside",
      },
    },
  },
  {
    id: "custom-skip-link-focusable-check",
    evaluate: function (node) {
      var href = node.getAttribute("href");
      if (!href || !href.startsWith("#")) return true;
      var target = document.getElementById(href.substring(1));
      if (!target) return false;
      var focusableTags = ["a", "button", "input", "select", "textarea"];
      return focusableTags.indexOf(target.tagName.toLowerCase()) !== -1 ||
        target.getAttribute("tabindex") !== null;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Skip link target exists and is focusable",
        fail: "Skip link target does not exist or is not focusable — the skip link provides no benefit to keyboard users",
      },
    },
  },

  // ============================================================
  // FORMS & INPUTS
  // ============================================================
  {
    id: "custom-label-check",
    evaluate: function (node) {
      var type = (node.getAttribute("type") || "").toLowerCase();
      if (["hidden","submit","reset","button","image"].indexOf(type) !== -1) return true;
      var id = node.id;
      return !!(
        (id && document.querySelector("label[for='" + id + "']")) ||
        node.getAttribute("aria-label") ||
        node.getAttribute("aria-labelledby") ||
        node.closest("label") ||
        node.getAttribute("title")
      );
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Form element has an accessible label",
        fail: "Form element has no associated label — screen reader users will not know the field's purpose",
      },
    },
  },
  {
    id: "custom-autocomplete-valid-check",
    evaluate: function (node) {
      var ac = node.getAttribute("autocomplete");
      if (!ac) return true;
      var valid = [
        "off","on","name","honorific-prefix","given-name","additional-name",
        "family-name","honorific-suffix","nickname","email","username",
        "new-password","current-password","one-time-code","organization-title",
        "organization","street-address","address-line1","address-line2",
        "address-line3","address-level4","address-level3","address-level2",
        "address-level1","country","country-name","postal-code","cc-name",
        "cc-given-name","cc-additional-name","cc-family-name","cc-number",
        "cc-exp","cc-exp-month","cc-exp-year","cc-csc","cc-type",
        "transaction-currency","transaction-amount","language","bday",
        "bday-day","bday-month","bday-year","sex","tel","tel-country-code",
        "tel-national","tel-area-code","tel-local","tel-extension","impp",
        "url","photo",
      ];
      return ac.split(/\s+/).every(function (t) {
        return valid.indexOf(t) !== -1 || t.startsWith("section-");
      });
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "autocomplete attribute uses a valid token",
        fail: "autocomplete attribute has an invalid value — assistive technologies that rely on autocomplete for form filling will not work correctly",
      },
    },
  },
  {
    id: "custom-select-name-check",
    evaluate: function (node) {
      var id = node.id;
      return !!(
        (id && document.querySelector("label[for='" + id + "']")) ||
        node.getAttribute("aria-label") ||
        node.getAttribute("aria-labelledby") ||
        node.closest("label")
      );
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Select element has an accessible name",
        fail: "Select element has no associated label — screen reader users will not know what to select",
      },
    },
  },
  {
    id: "custom-fieldset-legend-check",
    evaluate: function (node) {
      var legend = node.querySelector("legend");
      return !!(legend && legend.textContent.trim());
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Fieldset has a non-empty legend",
        fail: "Fieldset is missing a <legend> — grouped form controls have no group label for screen reader users",
      },
    },
  },
  {
    id: "custom-form-multiple-labels-check",
    evaluate: function (node) {
      var id = node.id;
      if (!id) return true;
      return document.querySelectorAll("label[for='" + id + "']").length <= 1;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Form field has at most one label element",
        fail: "Form field has multiple <label> elements — screen readers may announce all labels, creating a confusing experience",
      },
    },
  },
  {
    id: "custom-required-field-indication-check",
    evaluate: function (node) {
      if (!node.hasAttribute("required") && node.getAttribute("aria-required") !== "true") return true;
      return node.hasAttribute("required") || node.getAttribute("aria-required") === "true";
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Required field is indicated accessibly via required or aria-required",
        fail: "Required field is not accessibly indicated — use the required attribute or aria-required='true'",
      },
    },
  },
  {
    id: "custom-input-type-valid-check",
    evaluate: function (node) {
      var valid = [
        "button","checkbox","color","date","datetime-local","email","file",
        "hidden","image","month","number","password","radio","range","reset",
        "search","submit","tel","text","time","url","week",
      ];
      return valid.indexOf((node.getAttribute("type") || "text").toLowerCase()) !== -1;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Input element has a valid type attribute",
        fail: "Input element has an unrecognized type — browsers will fall back to type=text, which may confuse screen reader users",
      },
    },
  },
  {
    id: "custom-input-password-autocomplete-check",
    evaluate: function (node) {
      if ((node.getAttribute("type") || "").toLowerCase() !== "password") return true;
      var ac = node.getAttribute("autocomplete");
      return ac === "current-password" || ac === "new-password" || ac === "off";
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Password input has appropriate autocomplete attribute",
        fail: "Password input is missing autocomplete='current-password' or 'new-password' — password managers and users with cognitive disabilities rely on this",
      },
    },
  },

  // ============================================================
  // DOCUMENT STRUCTURE
  // ============================================================
  {
    id: "custom-document-title-check",
    evaluate: function (node) {
      var title = document.querySelector("title");
      return !!(title && title.textContent.trim());
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Document has a non-empty <title> element",
        fail: "Document is missing a <title> — screen reader users rely on the title to understand the page's purpose",
      },
    },
  },
  {
    id: "custom-html-lang-check",
    evaluate: function (node) {
      var lang = node.getAttribute("lang");
      return !!(lang && lang.trim());
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "HTML element has a lang attribute",
        fail: "HTML element is missing a lang attribute — screen readers will use their default language, which may cause incorrect pronunciation",
      },
    },
  },
  {
    id: "custom-html-lang-valid-check",
    evaluate: function (node) {
      var lang = (node.getAttribute("lang") || "").trim();
      if (!lang) return true;
      return /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{1,8})*$/.test(lang);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "HTML lang attribute is a valid BCP 47 language tag",
        fail: "HTML lang attribute has an invalid value — screen readers may not switch to the correct language voice",
      },
    },
  },
  {
    id: "custom-meta-refresh-check",
    evaluate: function (node) {
      var content = node.getAttribute("content") || "";
      var match = content.match(/^\s*(\d+)\s*(?:;\s*url=.*)?$/i);
      if (!match) return true;
      return parseInt(match[1], 10) === 0;
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Page does not use a timed meta refresh",
        fail: "Page uses timed meta refresh — this disrupts screen reader navigation and violates WCAG 2.2.1",
      },
    },
  },
  {
    id: "custom-meta-viewport-zoom-check",
    evaluate: function (node) {
      var content = node.getAttribute("content") || "";
      return !(/user-scalable\s*=\s*(no|0)/i.test(content)) &&
        !(/maximum-scale\s*=\s*1(?:\.0+)?\b/i.test(content));
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Viewport does not prevent text scaling or zooming",
        fail: "Viewport meta tag disables user zoom — low vision users who rely on zoom cannot access the content",
      },
    },
  },
  {
    id: "custom-duplicate-id-check",
    evaluate: function (node) {
      if (!node.id) return true;
      return document.querySelectorAll("[id='" + node.id + "']").length === 1;
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Element ID is unique in the document",
        fail: "Duplicate ID found — ARIA and label references to this ID will only resolve to the first element, breaking accessibility relationships",
      },
    },
  },
  {
    id: "custom-list-structure-check",
    evaluate: function (node) {
      var tag = node.tagName.toLowerCase();
      var allowed = (tag === "ol" || tag === "ul")
        ? ["li", "script", "template"]
        : ["dt", "dd", "div", "script", "template"];
      return Array.from(node.children).every(function (c) {
        return allowed.indexOf(c.tagName.toLowerCase()) !== -1;
      });
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "List element only contains valid child elements",
        fail: "List element contains invalid children — only <li> is permitted in <ul>/<ol>; only <dt>/<dd> in <dl>",
      },
    },
  },
  {
    id: "custom-definition-list-check",
    evaluate: function (node) {
      var valid = ["dt","dd","div","script","template"];
      return Array.from(node.children).every(function (c) {
        return valid.indexOf(c.tagName.toLowerCase()) !== -1;
      });
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Definition list is structured correctly",
        fail: "Definition list contains invalid children — only <dt>, <dd>, or <div> groupings are valid",
      },
    },
  },
  {
    id: "custom-frame-title-check",
    evaluate: function (node) {
      return !!(
        node.getAttribute("title") ||
        node.getAttribute("aria-label") ||
        node.getAttribute("aria-labelledby")
      );
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Frame has an accessible name",
        fail: "iframe or frame is missing a title attribute — screen reader users won't know the purpose of the embedded content",
      },
    },
  },
  {
    id: "custom-frame-title-unique-check",
    evaluate: function (node) {
      var title = (node.getAttribute("title") || "").trim().toLowerCase();
      if (!title) return true;
      var all = Array.from(document.querySelectorAll("iframe[title], frame[title]"));
      var matches = all.filter(function (f) {
        return (f.getAttribute("title") || "").trim().toLowerCase() === title;
      });
      return matches.length === 1;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Frame title is unique in the document",
        fail: "Multiple frames share the same title — screen reader users cannot distinguish between them",
      },
    },
  },
  {
    id: "custom-blink-check",
    evaluate: function (node) {
      return node.tagName.toLowerCase() !== "blink";
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "No <blink> element used",
        fail: "<blink> element found — blinking content can trigger seizures and is an obsolete HTML element",
      },
    },
  },
  {
    id: "custom-marquee-check",
    evaluate: function (node) {
      return node.tagName.toLowerCase() !== "marquee";
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "No <marquee> element used",
        fail: "<marquee> element found — moving content cannot be paused, violating WCAG 2.2.2",
      },
    },
  },
  {
    id: "custom-lang-parts-check",
    evaluate: function (node) {
      var lang = (node.getAttribute("lang") || "").trim();
      if (!lang) return true;
      return /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{1,8})*$/.test(lang);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Inline lang attribute is a valid BCP 47 language tag",
        fail: "Inline lang attribute has an invalid value — screen readers use this to switch language voice and will mispronounce content",
      },
    },
  },

  // ============================================================
  // LANDMARKS & NAVIGATION
  // ============================================================
  {
    id: "custom-landmark-main-check",
    evaluate: function (node) {
      return !!(document.querySelector("main") || document.querySelector("[role='main']"));
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Page has a main landmark",
        fail: "Page has no <main> element or role=main — screen reader users cannot jump directly to the main content",
      },
    },
  },
  {
    id: "custom-landmark-duplicate-main-check",
    evaluate: function (node) {
      var count = document.querySelectorAll("main, [role='main']").length;
      return count <= 1;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Page has at most one main landmark",
        fail: "Page has multiple main landmarks — there should only be one main content area per page",
      },
    },
  },
  {
    id: "custom-landmark-banner-top-level-check",
    evaluate: function (node) {
      var p = node.parentElement;
      if (!p) return true;
      var t = p.tagName.toLowerCase();
      var r = p.getAttribute("role");
      var sectional = ["article","aside","main","nav","section"];
      var sectRoles = ["article","complementary","main","navigation","region"];
      return sectional.indexOf(t) === -1 && (!r || sectRoles.indexOf(r) === -1);
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Banner landmark is at the top level",
        fail: "Banner landmark is nested inside a sectional element — it should be a direct child of body",
      },
    },
  },
  {
    id: "custom-landmark-contentinfo-top-level-check",
    evaluate: function (node) {
      var p = node.parentElement;
      if (!p) return true;
      var t = p.tagName.toLowerCase();
      var r = p.getAttribute("role");
      var sectional = ["article","aside","main","nav","section"];
      var sectRoles = ["article","complementary","main","navigation","region"];
      return sectional.indexOf(t) === -1 && (!r || sectRoles.indexOf(r) === -1);
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Contentinfo landmark is at the top level",
        fail: "Contentinfo/footer landmark is nested — it should be at the top level of the document",
      },
    },
  },
  {
    id: "custom-landmark-unique-check",
    evaluate: function (node) {
      var role = node.getAttribute("role") || node.tagName.toLowerCase();
      var siblings = Array.from(document.querySelectorAll("[role='" + role + "']"));
      if (siblings.length <= 1) return true;
      var labels = siblings.map(function (s) {
        return (s.getAttribute("aria-label") || s.getAttribute("aria-labelledby") || "").trim();
      });
      var nonEmpty = labels.filter(function (l) { return l.length > 0; });
      return nonEmpty.length === siblings.length && new Set(nonEmpty).size === nonEmpty.length;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Landmark is unique or has a unique accessible label",
        fail: "Multiple landmarks of the same type exist without unique labels — screen reader users cannot distinguish between them",
      },
    },
  },
  {
    id: "custom-page-region-check",
    evaluate: function (node) {
      var landmarks = "main, header, footer, nav, aside, section[aria-label], section[aria-labelledby], [role='main'], [role='banner'], [role='contentinfo'], [role='navigation'], [role='complementary'], [role='search'], [role='form'], [role='region']";
      return !!node.closest(landmarks);
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Content is contained within a landmark region",
        fail: "Content is outside any landmark region — screen reader users who navigate by landmarks will miss this content",
      },
    },
  },
  {
    id: "custom-page-heading-one-check",
    evaluate: function (node) {
      return !!(
        document.querySelector("h1") ||
        document.querySelector("[role='heading'][aria-level='1']")
      );
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Page has at least one h1 heading",
        fail: "Page has no h1 heading — screen reader users who navigate by headings cannot identify the main topic",
      },
    },
  },
  {
    id: "custom-heading-one-unique-check",
    evaluate: function (node) {
      return document.querySelectorAll("h1").length <= 1;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Page has exactly one h1 heading",
        fail: "Page has multiple h1 headings — each page should have a single main heading",
      },
    },
  },

  // ============================================================
  // TABLES
  // ============================================================
  {
    id: "custom-table-headers-check",
    evaluate: function (node) {
      if (!node.querySelector("th")) return true;
      return !!node.querySelector("th[scope]") || !!node.querySelector("td[headers]");
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Table uses scope or headers attributes for cell-to-header association",
        fail: "Data table has no scope or headers attributes — screen readers cannot associate data cells with their headers",
      },
    },
  },
  {
    id: "custom-scope-attr-valid-check",
    evaluate: function (node) {
      var scope = node.getAttribute("scope");
      if (!scope) return true;
      return ["row","col","rowgroup","colgroup"].indexOf(scope.toLowerCase()) !== -1;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Table scope attribute has a valid value",
        fail: "Table scope attribute has an invalid value — valid values are: row, col, rowgroup, colgroup",
      },
    },
  },
  {
    id: "custom-table-duplicate-name-check",
    evaluate: function (node) {
      var caption = node.querySelector("caption");
      var summary = node.getAttribute("summary");
      if (!caption || !summary) return true;
      return caption.textContent.trim().toLowerCase() !== summary.trim().toLowerCase();
    },
    metadata: {
      impact: "minor",
      messages: {
        pass: "Table caption and summary do not contain duplicate text",
        fail: "Table <caption> and summary attribute contain the same text — screen readers may announce it twice",
      },
    },
  },
  {
    id: "custom-td-headers-attr-check",
    evaluate: function (node) {
      var headers = node.getAttribute("headers");
      if (!headers) return true;
      return headers.split(/\s+/).every(function (id) {
        var el = document.getElementById(id);
        return el && el.tagName.toLowerCase() === "th";
      });
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Cell headers attribute references only <th> elements",
        fail: "Cell headers attribute references a non-<th> element — only <th> elements should be referenced",
      },
    },
  },
  {
    id: "custom-th-has-data-cells-check",
    evaluate: function (node) {
      var table = node.closest("table");
      return !!(table && table.querySelector("td"));
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Table header cell has associated data cells",
        fail: "Table has <th> header cells but no <td> data cells — the table structure may be incorrect",
      },
    },
  },
  {
    id: "custom-table-fake-caption-check",
    evaluate: function (node) {
      if (node.querySelector("caption")) return true;
      var firstRow = node.querySelector("tr");
      if (!firstRow) return true;
      var cells = firstRow.querySelectorAll("td");
      if (cells.length === 1) {
        var colspan = parseInt(cells[0].getAttribute("colspan") || "1", 10);
        var secondRow = node.querySelector("tr:nth-child(2)");
        var totalCols = secondRow ? secondRow.querySelectorAll("td, th").length : 0;
        if (totalCols > 1 && colspan >= totalCols) return false;
      }
      return true;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Table uses <caption> element for its caption",
        fail: "Table appears to use a data row as a caption — use the <caption> element for proper semantics",
      },
    },
  },

  // ============================================================
  // LINKS
  // ============================================================
  {
    id: "custom-link-distinguishable-check",
    evaluate: function (node) {
      var style = window.getComputedStyle(node);
      return style.textDecoration.includes("underline") ||
        parseInt(style.fontWeight, 10) >= 700 ||
        (style.borderBottom && style.borderBottom !== "none" && !style.borderBottom.includes("0px"));
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Link is distinguishable from surrounding text without relying solely on color",
        fail: "Link may only be distinguished by color — color-blind users may not identify it as a link",
      },
    },
  },
  {
    id: "custom-identical-links-check",
    evaluate: function (node) {
      var href = node.getAttribute("href");
      var text = node.textContent.trim().toLowerCase();
      if (!href || !text) return true;
      var all = Array.from(document.querySelectorAll("a[href='" + href + "']"));
      var names = all.map(function (l) { return l.textContent.trim().toLowerCase(); });
      return new Set(names).size === 1;
    },
    metadata: {
      impact: "minor",
      messages: {
        pass: "Links with identical destinations have consistent accessible names",
        fail: "Links with the same destination have different accessible names — inconsistent for screen reader users navigating by links list",
      },
    },
  },
  {
    id: "custom-link-href-valid-check",
    evaluate: function (node) {
      var href = (node.getAttribute("href") || "").trim();
      return href !== "" && href !== "#" && href !== "javascript:void(0)" && href !== "javascript:;";
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Link has a meaningful href value",
        fail: "Link has an empty, '#', or javascript:void(0) href — use a <button> for actions or provide a real URL",
      },
    },
  },

  // ============================================================
  // WCAG 2.1 SPECIFIC
  // ============================================================
  {
    id: "custom-avoid-inline-spacing-check",
    evaluate: function (node) {
      var style = node.getAttribute("style") || "";
      return !/(letter-spacing|word-spacing|line-height|margin-bottom)\s*:\s*[^;]+!important/i.test(style);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Element does not use !important to lock text spacing properties",
        fail: "Element uses !important on text spacing — users who override spacing (needed for reading disorders) cannot do so (WCAG 1.4.12)",
      },
    },
  },
  {
    id: "custom-label-content-name-mismatch-check",
    evaluate: function (node) {
      var visible = node.textContent.trim().toLowerCase();
      var ariaLabel = (node.getAttribute("aria-label") || "").toLowerCase();
      if (!visible || !ariaLabel) return true;
      return ariaLabel.includes(visible) || visible.includes(ariaLabel);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Element's accessible name includes its visible label text",
        fail: "Element's aria-label does not match its visible text — voice control users who speak the visible label cannot activate this element (WCAG 2.5.3)",
      },
    },
  },
  {
    id: "custom-pointer-gestures-check",
    evaluate: function (node) {
      if (node.getAttribute("draggable") !== "true") return true;
      return node.hasAttribute("onkeydown") ||
        node.hasAttribute("onkeyup") ||
        node.hasAttribute("onkeypress");
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Draggable element has a keyboard-accessible alternative",
        fail: "Draggable element has no keyboard event handlers — users who cannot drag have no alternative (WCAG 2.5.1)",
      },
    },
  },
  {
    id: "custom-content-on-hover-check",
    evaluate: function (node) {
      if (node.getAttribute("role") !== "tooltip") return true;
      var id = node.id;
      if (!id) return true;
      return !!document.querySelector("[aria-describedby='" + id + "']");
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Tooltip is properly associated with a trigger element via aria-describedby",
        fail: "Tooltip is not associated with a trigger — hover-triggered content should be dismissable and persistent (WCAG 1.4.13)",
      },
    },
  },

  // ============================================================
  // WCAG 2.2 SPECIFIC
  // ============================================================
  {
    id: "custom-focus-not-obscured-check",
    evaluate: function (node) {
      var style = window.getComputedStyle(node);
      if (["fixed","sticky"].indexOf(style.position) === -1) return true;
      return node.getBoundingClientRect().height < 100;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Element unlikely to obscure keyboard focus indicator",
        fail: "Large sticky/fixed element may obscure focused elements — ensure focused elements are not fully hidden behind sticky headers or footers (WCAG 2.4.12)",
      },
    },
  },
  {
    id: "custom-dragging-alternative-check",
    evaluate: function (node) {
      var isDraggable = node.getAttribute("draggable") === "true" || node.hasAttribute("ondragstart");
      if (!isDraggable) return true;
      return node.hasAttribute("onclick") ||
        node.hasAttribute("onkeydown") ||
        node.getAttribute("aria-grabbed") !== null;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Draggable element has a single-pointer or keyboard alternative",
        fail: "Draggable element relies on drag without an alternative — users with motor impairments need a single-click alternative (WCAG 2.5.7)",
      },
    },
  },
  {
    id: "custom-target-size-enhanced-check",
    evaluate: function (node) {
      var rect = node.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44;
    },
    metadata: {
      impact: "minor",
      messages: {
        pass: "Target meets AAA minimum size of 44x44px",
        fail: "Target is smaller than the 44x44px AAA minimum — consider enlarging for optimal touch accessibility (WCAG 2.5.5)",
      },
    },
  },
  {
    id: "custom-consistent-help-check",
    evaluate: function (node) {
      var text = node.textContent.trim().toLowerCase();
      var isHelp = text.includes("help") || text.includes("support") || text.includes("contact");
      if (!isHelp) return true;
      return !!node.closest("nav, header, footer, [role='navigation'], [role='banner'], [role='contentinfo']");
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Help link is in a consistent landmark location",
        fail: "Help/support link is not in a standard landmark region — consistent placement helps users with cognitive disabilities find assistance (WCAG 3.2.6)",
      },
    },
  },
  {
    id: "custom-redundant-entry-check",
    evaluate: function (node) {
      var type = (node.getAttribute("type") || "").toLowerCase();
      if (["hidden","submit","reset","button"].indexOf(type) !== -1) return true;
      var isMultiStep = !!(
        document.querySelector("[data-step], [aria-current='step'], .wizard, .multi-step")
      );
      if (!isMultiStep) return true;
      return !!node.getAttribute("autocomplete");
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Form field in multi-step form supports autocomplete",
        fail: "Input in a multi-step form lacks autocomplete — users may need to re-enter information already provided (WCAG 3.3.7)",
      },
    },
  },

  // ============================================================
  // ORIGINAL RULES (retained)
  // ============================================================
  {
    id: "custom-target-size-check",
    evaluate: function (node) {
      var rect = node.getBoundingClientRect();
      return rect.width >= 24 && rect.height >= 24;
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
      var hasPlaceholder = node.hasAttribute("placeholder");
      var hasLabel =
        node.hasAttribute("aria-label") ||
        node.hasAttribute("aria-labelledby") ||
        !!document.querySelector('label[for="' + node.id + '"]');
      return !(hasPlaceholder && !hasLabel);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Input has a proper label, not just a placeholder",
        fail: "Input relies on placeholder text instead of a real label — placeholder disappears on focus and is not reliably announced by screen readers",
      },
    },
  },
  {
    id: "custom-empty-link-check",
    evaluate: function (node) {
      var text = node.textContent.trim();
      var hasAriaLabel = node.hasAttribute("aria-label");
      var hasTitle = node.hasAttribute("title");
      var hasImgAlt = !!node.querySelector("img[alt]:not([alt=''])");
      return text.length > 0 || hasAriaLabel || hasTitle || hasImgAlt;
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Link has accessible text content",
        fail: "Link has no discernible text — screen reader users will hear only 'link' with no indication of the destination",
      },
    },
  },
  {
    id: "custom-generic-link-text-check",
    evaluate: function (node) {
      var generic = [
        "click here","read more","learn more","here","more","link",
        "this","details","info","information","page","go","open",
      ];
      return generic.indexOf(node.textContent.trim().toLowerCase()) === -1;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Link text is descriptive",
        fail: "Link text is generic (e.g. 'click here') and doesn't describe the destination — a problem for screen reader users navigating by links list",
      },
    },
  },
  {
    id: "custom-heading-skip-check",
    evaluate: function (node) {
      var headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
      var index = headings.indexOf(node);
      if (index <= 0) return true;
      var curr = parseInt(node.tagName.charAt(1), 10);
      var prev = parseInt(headings[index - 1].tagName.charAt(1), 10);
      return curr - prev <= 1;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Heading level follows logical document outline",
        fail: "Heading level skips one or more levels (e.g. h2 → h4), breaking the document outline for screen reader users",
      },
    },
  },
  {
    id: "custom-new-tab-warning-check",
    evaluate: function (node) {
      if (node.getAttribute("target") !== "_blank") return true;
      var combined = [
        node.textContent,
        node.getAttribute("aria-label") || "",
        node.getAttribute("title") || "",
      ].join(" ").toLowerCase();
      return combined.includes("new tab") ||
        combined.includes("new window") ||
        combined.includes("opens in") ||
        node.hasAttribute("aria-describedby");
    },
    metadata: {
      impact: "minor",
      messages: {
        pass: "Link opening in a new tab warns the user beforehand",
        fail: "Link opens in a new tab/window without warning — disorienting for screen reader and low-vision users",
      },
    },
  },
  {
    id: "custom-blank-target-noopener-check",
    evaluate: function (node) {
      if (node.getAttribute("target") !== "_blank") return true;
      var rel = (node.getAttribute("rel") || "").toLowerCase();
      return rel.includes("noopener") || rel.includes("noreferrer");
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Link with target=_blank includes rel=noopener/noreferrer",
        fail: "Link opens in a new tab without rel='noopener' — leaves the new page with window.opener access to this page",
      },
    },
  },
  {
    id: "custom-redundant-title-check",
    evaluate: function (node) {
      var title = (node.getAttribute("title") || "").trim().toLowerCase();
      if (!title) return true;
      return title !== node.textContent.trim().toLowerCase();
    },
    metadata: {
      impact: "minor",
      messages: {
        pass: "Title attribute adds information beyond the visible text",
        fail: "Title attribute exactly duplicates the element's visible text — screen readers will announce the same content twice",
      },
    },
  },
  {
    id: "custom-positive-tabindex-check",
    evaluate: function (node) {
      var tabindex = node.getAttribute("tabindex");
      if (tabindex === null) return true;
      var value = parseInt(tabindex, 10);
      return Number.isNaN(value) || value <= 0;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Element does not use a positive tabindex",
        fail: "Element uses a positive tabindex, which overrides the natural DOM tab order and creates a confusing keyboard navigation sequence",
      },
    },
  },
  {
    id: "custom-form-missing-submit-check",
    evaluate: function (node) {
      return !!node.querySelector(
        "button[type='submit'], input[type='submit'], button:not([type])"
      );
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Form has a discoverable submit control",
        fail: "Form has no submit button — keyboard-only and screen reader users may have no way to submit the form",
      },
    },
  },
  {
    id: "custom-table-caption-check",
    evaluate: function (node) {
      if (!node.querySelector("th")) return true;
      return !!node.querySelector("caption") ||
        node.hasAttribute("aria-label") ||
        node.hasAttribute("aria-labelledby");
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Data table has a caption or accessible label",
        fail: "Data table has no <caption> or aria-label — screen reader users hear headers with no context for what the table represents",
      },
    },
  },

  // ============================================================
  // ADDITIONAL BEST PRACTICES
  // ============================================================
  {
    id: "custom-empty-heading-check",
    evaluate: function (node) {
      return !!(
        node.textContent.trim() ||
        node.getAttribute("aria-label") ||
        node.getAttribute("aria-labelledby")
      );
    },
    metadata: {
      impact: "minor",
      messages: {
        pass: "Heading has discernible text",
        fail: "Heading element has no text content — empty headings appear in the heading list and confuse screen reader users",
      },
    },
  },
  {
    id: "custom-empty-table-header-check",
    evaluate: function (node) {
      return !!(node.textContent.trim() || node.getAttribute("aria-label"));
    },
    metadata: {
      impact: "minor",
      messages: {
        pass: "Table header cell has discernible text",
        fail: "Table header cell is empty — screen readers cannot describe the column or row to users",
      },
    },
  },
  {
    id: "custom-server-side-image-map-check",
    evaluate: function (node) {
      return !node.hasAttribute("ismap");
    },
    metadata: {
      impact: "minor",
      messages: {
        pass: "Image does not use a server-side image map",
        fail: "Image uses ismap (server-side image map) — keyboard users cannot activate specific regions",
      },
    },
  },
  {
    id: "custom-button-name-check",
    evaluate: function (node) {
      return !!(
        node.textContent.trim() ||
        node.getAttribute("aria-label") ||
        node.getAttribute("aria-labelledby") ||
        node.getAttribute("title") ||
        node.getAttribute("value")
      );
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Button has an accessible name",
        fail: "Button has no accessible name — screen reader users will hear only 'button' with no indication of the action",
      },
    },
  },
  {
    id: "custom-input-button-name-check",
    evaluate: function (node) {
      return !!(
        node.getAttribute("value") ||
        node.getAttribute("aria-label") ||
        node.getAttribute("aria-labelledby") ||
        node.getAttribute("title")
      );
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Input button has an accessible name",
        fail: "Input button has no value or accessible label — screen reader users will not know what the button does",
      },
    },
  },
  {
    id: "custom-css-animation-reducible-check",
    evaluate: function (node) {
      var style = window.getComputedStyle(node);
      if (style.animationIterationCount === "infinite") return false;
      return true;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Element animation is not infinite — ensure prefers-reduced-motion is respected",
        fail: "Element has infinite animation — respect prefers-reduced-motion media query for users with vestibular disorders (WCAG 2.3.3)",
      },
    },
  },
  {
    id: "custom-abbr-title-check",
    evaluate: function (node) {
      var title = node.getAttribute("title");
      return !!(title && title.trim());
    },
    metadata: {
      impact: "minor",
      messages: {
        pass: "Abbreviation has a title attribute with its expansion",
        fail: "Abbreviation (<abbr>) has no title attribute — the full expansion is not available to users who may not know the acronym",
      },
    },
  },
  {
    id: "custom-time-element-check",
    evaluate: function (node) {
      var dt = node.getAttribute("datetime");
      if (!dt) return true;
      return /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2})?)?)?)?$/.test(dt);
    },
    metadata: {
      impact: "minor",
      messages: {
        pass: "Time element has a valid machine-readable datetime attribute",
        fail: "Time element has an invalid datetime attribute — assistive technologies and search engines cannot parse the date/time correctly",
      },
    },
  },
  {
    id: "custom-details-summary-check",
    evaluate: function (node) {
      var summary = node.querySelector("summary");
      return !!(summary && summary.textContent.trim());
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Details element has a visible summary",
        fail: "Details element has no <summary> — the disclosure widget cannot be properly identified by screen readers",
      },
    },
  },
  {
    id: "custom-dialog-modal-check",
    evaluate: function (node) {
      var role = node.getAttribute("role");
      if (role !== "dialog" && role !== "alertdialog") return true;
      return node.getAttribute("aria-modal") === "true";
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Dialog element has aria-modal='true'",
        fail: "Dialog element is missing aria-modal='true' — screen readers may not confine virtual cursor to the dialog",
      },
    },
  },

  // ============================================================
  // AODA / WCAG 2.0 AA — MISSING CRITERIA (Ontario compliance)
  // AODA IASR s.14 mandates WCAG 2.0 Level AA for all Ontario
  // organizations with 50+ workers. Deadline: Jan 1 2021.
  // Next compliance report due: Dec 31 2026.
  // ============================================================

  // --- WCAG 1.2.3 / 1.2.5 — Audio Description (Prerecorded) ---
  {
    id: "custom-audio-description-check",
    evaluate: function (node) {
      var descTracks = node.querySelectorAll("track[kind='descriptions']");
      if (descTracks.length > 0) return true;
      // Acceptable alternative: aria-describedby pointing at a text description
      return node.hasAttribute("aria-describedby");
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Video has an audio description track or text alternative",
        fail: "Video has no audio description track (<track kind='descriptions'>) — blind users cannot access visual-only information in the video (WCAG 1.2.3 / AODA IASR s.14)",
      },
    },
  },

  // --- WCAG 1.3.2 — Meaningful Sequence ---
  {
    id: "custom-meaningful-sequence-check",
    evaluate: function (node) {
      var style = window.getComputedStyle(node);
      // Detect CSS order values that diverge heavily from DOM order (flex/grid reordering)
      var order = parseInt(style.order || "0", 10);
      return order === 0 || (order >= -1 && order <= 1);
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Element does not use extreme CSS order reordering",
        fail: "Element has a large CSS order value — visual reading order may differ from DOM order, confusing screen reader users who follow the DOM sequence (WCAG 1.3.2)",
      },
    },
  },

  // --- WCAG 1.3.3 — Sensory Characteristics ---
  {
    id: "custom-sensory-characteristics-check",
    evaluate: function (node) {
      var text = node.textContent.toLowerCase();
      var patterns = [
        /\b(click|press|tap)\s+the\s+(round|square|circular|red|green|blue|yellow|left|right|above|below)\s+(button|link|icon)\b/,
        /\bbutton\s+(on\s+the\s+)?(left|right|top|bottom|above|below)\b/,
        /\bthe\s+(red|green|blue|yellow|orange|purple)\s+(button|link|icon|field)\b/,
      ];
      return !patterns.some(function (p) { return p.test(text); });
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Instructions do not appear to rely solely on sensory characteristics",
        fail: "Instructions may rely on shape, color, or location alone to identify UI elements — users who are blind or color-blind cannot follow these instructions (WCAG 1.3.3)",
      },
    },
  },

  // --- WCAG 1.4.2 — Audio Control ---
  {
    id: "custom-audio-control-check",
    evaluate: function (node) {
      // Audio playing longer than 3 seconds must have a pause/stop/volume control
      var hasControls = node.hasAttribute("controls");
      var isMuted = node.hasAttribute("muted") || node.muted === true;
      var isAutoplay = node.hasAttribute("autoplay");
      if (!isAutoplay) return true; // Not autoplaying — no issue
      return hasControls || isMuted;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Autoplaying audio is muted or provides playback controls",
        fail: "Audio autoplays without controls and is not muted — screen reader users need a mechanism to pause or stop audio that interferes with speech output (WCAG 1.4.2 / AODA)",
      },
    },
  },

  // --- WCAG 1.4.4 — Resize Text ---
  {
    id: "custom-resize-text-check",
    evaluate: function (node) {
      var style = window.getComputedStyle(node);
      var fontSize = style.fontSize || "";
      // Flag text set in px on body/paragraph-level elements (not headings or UI)
      if (!fontSize.endsWith("px")) return true;
      var px = parseFloat(fontSize);
      // Text smaller than 12px that is set in fixed px is a concern
      return px >= 12;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Text size is not set too small in fixed pixels",
        fail: "Text is set in very small fixed pixels — use relative units (em, rem, %) so users can resize text to 200% without loss of content (WCAG 1.4.4 / AODA)",
      },
    },
  },

  // --- WCAG 1.4.5 — Images of Text ---
  {
    id: "custom-images-of-text-check",
    evaluate: function (node) {
      var alt = (node.getAttribute("alt") || "").trim();
      var role = node.getAttribute("role");
      if (role === "none" || role === "presentation" || alt === "") return true;
      // Flag images whose alt text reads like body copy (sentence of 30+ chars, no proper noun start)
      return alt.length < 30 || /^[A-Z]/.test(alt) === false;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Image does not appear to replace text content",
        fail: "Image may contain text that should be real HTML text — images of text cannot be resized, recolored, or read by screen readers as efficiently as live text (WCAG 1.4.5 / AODA)",
      },
    },
  },

  // --- WCAG 2.2.1 — Timing Adjustable / Session Timeout Warning ---
  {
    id: "custom-timing-adjustable-check",
    evaluate: function (node) {
      // Heuristic: check for session expiry / timeout indicators in text
      var text = node.textContent.toLowerCase();
      var hasTimeoutText = /session\s*(will\s*)?(expire|timeout|end|log\s*out)/i.test(text) ||
        /you\s*will\s*be\s*(logged|signed)\s*out/i.test(text);
      if (!hasTimeoutText) return true;
      // If there IS a timeout message, check it also offers an extension mechanism
      var hasExtendLink = !!node.querySelector("button, a[href], input[type='button'], input[type='submit']");
      return hasExtendLink;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Session timeout warning includes a mechanism to extend the session",
        fail: "Session timeout warning detected but no button or link to extend the session — users with disabilities need at least 20 seconds to respond, or the ability to turn off the timeout (WCAG 2.2.1 / AODA)",
      },
    },
  },

  // --- WCAG 2.3.1 — Three Flashes or Below Threshold ---
  {
    id: "custom-three-flashes-check",
    evaluate: function (node) {
      var style = window.getComputedStyle(node);
      var duration = style.animationDuration || "0s";
      var count = style.animationIterationCount || "1";
      var durationSec = parseFloat(duration);
      // Flash risk: very short animation cycles that repeat many times or infinitely
      if (durationSec > 0 && durationSec < 0.34 && (count === "infinite" || parseInt(count, 10) > 3)) {
        return false;
      }
      return true;
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Element animation does not appear to flash at a seizure-triggering rate",
        fail: "Element has a very fast repeating animation (< 0.34s cycle) that may flash more than 3 times per second — this can trigger photosensitive seizures (WCAG 2.3.1 / AODA)",
      },
    },
  },

  // --- WCAG 2.4.5 — Multiple Ways to Find Content ---
  {
    id: "custom-multiple-ways-check",
    evaluate: function (node) {
      var hasSearch = !!(
        document.querySelector("input[type='search']") ||
        document.querySelector("form[role='search']") ||
        document.querySelector("[aria-label*='search' i]") ||
        document.querySelector("[placeholder*='search' i]")
      );
      var hasSiteMap = !!(
        document.querySelector("a[href*='sitemap' i]") ||
        document.querySelector("a[href*='site-map' i]") ||
        document.querySelector("a:not([hidden])") // has navigation links as alternative
      );
      return hasSearch || hasSiteMap;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Page has a search form or navigational links to help users find content",
        fail: "Page has no search function or site map — AODA requires at least two ways to find content within a website (WCAG 2.4.5)",
      },
    },
  },

  // --- WCAG 2.4.6 — Headings and Labels Describe Topic or Purpose ---
  {
    id: "custom-headings-labels-check",
    evaluate: function (node) {
      var text = node.textContent.trim();
      if (!text) return true; // Empty headings caught by other rule
      // Flag headings that are just numbers, single characters, or punctuation
      return !/^[\d\W]+$/.test(text) && text.length >= 2;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Heading has a meaningful, descriptive text label",
        fail: "Heading text is too short or non-descriptive — headings must describe the topic or purpose of the section they introduce (WCAG 2.4.6 / AODA)",
      },
    },
  },

  // --- WCAG 3.2.1 — On Focus (no context change on focus) ---
  {
    id: "custom-on-focus-check",
    evaluate: function (node) {
      var onfocus = node.getAttribute("onfocus") || "";
      // Flag common patterns that cause context change on focus
      var dangerous = /\b(submit|navigate|window\.location|location\.href|\.submit\(\)|\.click\(\))\b/i;
      return !dangerous.test(onfocus);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Element does not trigger navigation or form submission on focus",
        fail: "Element has an onfocus handler that may submit a form or navigate the page — receiving focus must not cause a change of context (WCAG 3.2.1 / AODA)",
      },
    },
  },

  // --- WCAG 3.2.2 — On Input (no unexpected context change) ---
  {
    id: "custom-on-input-check",
    evaluate: function (node) {
      var onchange = node.getAttribute("onchange") || "";
      var dangerous = /\b(submit|window\.location|location\.href|\.submit\(\))\b/i;
      if (dangerous.test(onchange)) return false;
      // Also flag <select> without a submit button that uses onchange to navigate
      if (node.tagName.toLowerCase() === "select") {
        if (dangerous.test(onchange)) return false;
      }
      return true;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Input change does not auto-submit or navigate unexpectedly",
        fail: "Element has an onchange handler that submits a form or navigates — changing an input value must not cause unexpected context change without user confirmation (WCAG 3.2.2 / AODA)",
      },
    },
  },

  // --- WCAG 3.3.1 — Error Identification ---
  {
    id: "custom-error-identification-check",
    evaluate: function (node) {
      var ariaInvalid = node.getAttribute("aria-invalid");
      if (ariaInvalid !== "true") return true; // No error state, skip
      // If field is marked invalid, error text must be linked via aria-errormessage or aria-describedby
      var errMsg = node.getAttribute("aria-errormessage");
      var descBy = node.getAttribute("aria-describedby");
      if (errMsg) {
        var errEl = document.getElementById(errMsg);
        return !!(errEl && errEl.textContent.trim());
      }
      if (descBy) {
        var ids = descBy.split(/\s+/);
        return ids.some(function (id) {
          var el = document.getElementById(id);
          return el && el.textContent.trim().length > 0;
        });
      }
      return false;
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "Invalid field has a text error message linked via aria-errormessage or aria-describedby",
        fail: "Field is marked aria-invalid='true' but has no linked text error message — screen reader users will not know what the error is (WCAG 3.3.1 / AODA)",
      },
    },
  },

  // --- WCAG 3.3.3 — Error Suggestion ---
  {
    id: "custom-error-suggestion-check",
    evaluate: function (node) {
      var errMsgId = node.getAttribute("aria-errormessage");
      var descById = node.getAttribute("aria-describedby");
      var ariaInvalid = node.getAttribute("aria-invalid");
      if (ariaInvalid !== "true") return true;
      var msgEl = null;
      if (errMsgId) msgEl = document.getElementById(errMsgId);
      else if (descById) {
        var ids = descById.split(/\s+/);
        for (var i = 0; i < ids.length; i++) {
          var el = document.getElementById(ids[i]);
          if (el && el.textContent.trim()) { msgEl = el; break; }
        }
      }
      if (!msgEl) return true; // No message found, covered by 3.3.1 rule
      var msg = msgEl.textContent.trim().toLowerCase();
      // Message should contain actionable suggestion words
      var suggestive = /\b(must|should|please|enter|provide|include|use|format|example|e\.g\.|required|at least|maximum|minimum|valid|correct|check)\b/i;
      return suggestive.test(msg);
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Error message includes a suggestion for how to correct the input",
        fail: "Error message exists but does not suggest how to correct the error — include specific instructions like the required format or expected values (WCAG 3.3.3 / AODA)",
      },
    },
  },

  // --- WCAG 3.3.4 — Error Prevention (Legal, Financial, Data) ---
  {
    id: "custom-error-prevention-check",
    evaluate: function (node) {
      var html = node.innerHTML.toLowerCase();
      var isHighStakes = /\b(payment|credit.card|debit|billing|checkout|purchase|order|delete|remove|cancel\s*account|legal|agreement|consent|submit\s*application)\b/i.test(html);
      if (!isHighStakes) return true;
      // High-stakes forms must have confirmation, review step, or be reversible
      var hasConfirm = !!(
        node.querySelector("[aria-label*='confirm' i], [value*='confirm' i]") ||
        /\b(confirm|review\s*your|check\s*your|are\s*you\s*sure|cancel\s*anytime|undo)\b/i.test(html)
      );
      return hasConfirm;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "High-stakes form has a confirmation or review mechanism",
        fail: "Form involves financial, legal, or irreversible actions but has no confirmation step — users must be able to review, correct, and confirm submissions (WCAG 3.3.4 / AODA)",
      },
    },
  },

  // ============================================================
  // AODA IASR — ONTARIO-SPECIFIC REQUIREMENTS
  // Beyond WCAG 2.0: documents, feedback, accessibility statement
  // ============================================================

  // AODA IASR s.14 — Accessible Document Formats (PDF links)
  {
    id: "custom-pdf-accessibility-check",
    evaluate: function (node) {
      var href = (node.getAttribute("href") || "").toLowerCase();
      if (!href.endsWith(".pdf")) return true;
      // PDF link should warn users or provide an accessible HTML alternative
      var text = node.textContent.toLowerCase();
      var title = (node.getAttribute("title") || "").toLowerCase();
      var combined = text + " " + title;
      var hasPdfWarning = combined.includes("pdf") || combined.includes("opens") || combined.includes("download");
      var hasAltLink = !!(
        node.nextElementSibling &&
        (node.nextElementSibling.textContent.toLowerCase().includes("html") ||
         node.nextElementSibling.textContent.toLowerCase().includes("accessible"))
      );
      return hasPdfWarning || hasAltLink;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "PDF link warns users about the file format or provides an accessible alternative",
        fail: "Link points to a PDF without warning users of the format — PDFs must be tagged and accessible, or an HTML alternative must be provided (AODA IASR s.14)",
      },
    },
  },

  // AODA IASR s.14 — Non-HTML Documents (Word, Excel, PowerPoint)
  {
    id: "custom-accessible-documents-check",
    evaluate: function (node) {
      var href = (node.getAttribute("href") || "").toLowerCase();
      var officeExts = [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".odt", ".ods", ".odp"];
      var isOffice = officeExts.some(function (ext) { return href.endsWith(ext); });
      if (!isOffice) return true;
      // Must indicate file type and ideally provide accessible alternative
      var text = node.textContent.toLowerCase();
      var title = (node.getAttribute("title") || "").toLowerCase();
      var combined = text + " " + title;
      return combined.includes("word") || combined.includes("excel") || combined.includes("powerpoint") ||
        combined.includes(".doc") || combined.includes(".xls") || combined.includes(".ppt") ||
        combined.includes("download") || combined.includes("opens");
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Office document link indicates the file format to users",
        fail: "Link to a Word/Excel/PowerPoint file does not indicate the file format — AODA requires all publicly available documents to be provided in accessible formats or accompanied by accessible alternatives (AODA IASR s.14)",
      },
    },
  },

  // AODA IASR — Accessibility Statement / Policy Link
  {
    id: "custom-accessibility-statement-check",
    evaluate: function (node) {
      var links = document.querySelectorAll("a[href]");
      for (var i = 0; i < links.length; i++) {
        var t = links[i].textContent.toLowerCase();
        var h = (links[i].getAttribute("href") || "").toLowerCase();
        if (
          t.includes("accessibility") || t.includes("accessibilité") ||
          h.includes("accessibility") || h.includes("accessib")
        ) return true;
      }
      return false;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Page contains a link to an accessibility statement or policy",
        fail: "No accessibility statement link found — AODA requires organizations to publish an accessibility policy and multi-year plan, and provide a feedback process. Link to your accessibility statement from every page.",
      },
    },
  },

  // AODA IASR — Accessible Feedback Mechanism
  {
    id: "custom-feedback-mechanism-check",
    evaluate: function (node) {
      var links = document.querySelectorAll("a[href]");
      for (var i = 0; i < links.length; i++) {
        var t = links[i].textContent.toLowerCase();
        var h = (links[i].getAttribute("href") || "").toLowerCase();
        if (
          t.includes("contact") || t.includes("feedback") || t.includes("support") ||
          t.includes("help") || t.includes("report") || t.includes("complaint") ||
          h.includes("contact") || h.includes("feedback") || h.startsWith("mailto:")
        ) return true;
      }
      // Also accept visible contact form on the page
      return !!(document.querySelector("form[action*='contact'], form[id*='contact'], form[class*='contact']"));
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Page provides an accessible feedback or contact mechanism",
        fail: "No contact, feedback, or support link found — AODA requires organizations to establish and maintain an accessible process for receiving and responding to feedback from people with disabilities (AODA IASR s.11)",
      },
    },
  },

  // AODA / WCAG 2.1 2.5.2 — Pointer Cancellation
  {
    id: "custom-pointer-cancellation-check",
    evaluate: function (node) {
      var onmousedown = node.getAttribute("onmousedown") || "";
      var ontouchstart = node.getAttribute("ontouchstart") || "";
      var dangerous = /\b(submit|navigate|window\.location|location\.href|\.submit\(\)|\.click\(\)|open\()\b/i;
      return !dangerous.test(onmousedown) && !dangerous.test(ontouchstart);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Element does not trigger irreversible actions on pointer-down events",
        fail: "Element performs navigation or submission on mousedown/touchstart — actions should fire on the up-event (click/mouseup/touchend) so users can cancel by moving the pointer away (WCAG 2.5.2)",
      },
    },
  },

  // AODA / WCAG 2.1 2.5.4 — Motion Actuation
  {
    id: "custom-motion-actuation-check",
    evaluate: function (node) {
      // Detect inline motion event handlers
      var hasMotion =
        node.getAttribute("ondevicemotion") ||
        node.getAttribute("ondeviceorientation") ||
        node.getAttribute("onorientationchange");
      if (!hasMotion) return true;
      // There must be an alternative UI mechanism
      var hasAlternative = node.querySelector("button, a[href], input[type='button']") ||
        node.hasAttribute("onclick") ||
        node.hasAttribute("onkeydown");
      return !!hasAlternative;
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "Motion-controlled feature has a UI alternative",
        fail: "Motion event handler found without a UI alternative — users who cannot physically tilt or shake a device must be able to operate the same feature through conventional UI (WCAG 2.5.4 / AODA)",
      },
    },
  },

  // AODA / WCAG 2.0 3.2.3 — Consistent Navigation
  {
    id: "custom-consistent-navigation-check",
    evaluate: function (node) {
      // Heuristic: check that nav landmark has at least 3 links (trivial navs are not real navs)
      var links = node.querySelectorAll("a[href]");
      return links.length >= 2;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Navigation region contains multiple links",
        fail: "Navigation landmark has fewer than 2 links — navigation components must be presented in the same relative order each time they appear across pages (WCAG 3.2.3 / AODA)",
      },
    },
  },

  // AODA — CAPTCHA Accessibility
  {
    id: "custom-captcha-alternative-check",
    evaluate: function (node) {
      var alt = (node.getAttribute("alt") || "").toLowerCase();
      var ariaLabel = (node.getAttribute("aria-label") || "").toLowerCase();
      var combined = alt + " " + ariaLabel;
      var isCaptcha = combined.includes("captcha") || combined.includes("verify") ||
        (node.id || "").toLowerCase().includes("captcha") ||
        (node.className || "").toLowerCase().includes("captcha");
      if (!isCaptcha) return true;
      // CAPTCHA must offer an audio alternative
      var page = document.body.innerHTML.toLowerCase();
      return page.includes("audio captcha") || page.includes("audio challenge") ||
        !!document.querySelector("audio") || !!document.querySelector("[data-callback]");
    },
    metadata: {
      impact: "critical",
      messages: {
        pass: "CAPTCHA provides an audio or alternative verification method",
        fail: "CAPTCHA found without an accessible audio alternative — blind users cannot complete visual CAPTCHAs without an alternative format (AODA / WCAG 1.1.1)",
      },
    },
  },

  // AODA — Language of Page must be set (Ontario bilingual context)
  {
    id: "custom-aoda-language-check",
    evaluate: function (node) {
      var lang = (node.getAttribute("lang") || "").trim().toLowerCase();
      if (!lang) return false;
      // AODA / Ontario context: lang must be 'en', 'fr', or valid sub-variant
      return /^(en|fr)(-[a-z]{2,8})?$/.test(lang) || /^[a-z]{2,3}(-[a-z0-9]{1,8})*$/.test(lang);
    },
    metadata: {
      impact: "serious",
      messages: {
        pass: "HTML lang attribute is set to a valid language (English or French for Ontario compliance)",
        fail: "HTML lang attribute is missing or invalid — AODA requires accessible content in the language of the page; Ontario organizations serving the public should specify 'en' or 'fr' (AODA IASR / WCAG 3.1.1)",
      },
    },
  },

  // AODA — Table of Contents / Site Navigation (WCAG 2.4.5 Multiple Ways)
  {
    id: "custom-site-navigation-check",
    evaluate: function (node) {
      // Page should have a nav or role=navigation with meaningful links
      var navs = document.querySelectorAll("nav, [role='navigation']");
      return navs.length > 0;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Page has at least one navigation landmark",
        fail: "Page has no <nav> or role='navigation' landmark — without site navigation, users cannot find content via multiple pathways as required by WCAG 2.4.5 / AODA",
      },
    },
  },

  // AODA — Print/Download Accessibility: prefers-reduced-motion support
  {
    id: "custom-reduced-motion-check",
    evaluate: function (node) {
      var style = window.getComputedStyle(node);
      var animation = style.animationName;
      var transition = style.transition;
      // If element has animations, we can't check @media prefers-reduced-motion from JS
      // Instead flag elements with infinite or long-duration animations as needing review
      if (!animation || animation === "none") return true;
      var iterCount = style.animationIterationCount || "1";
      if (iterCount === "infinite") return false; // Should be caught by other rule
      return true;
    },
    metadata: {
      impact: "moderate",
      messages: {
        pass: "Element animation is not infinite",
        fail: "Element has a repeating animation — implement @media (prefers-reduced-motion: reduce) to disable or minimize motion for users with vestibular disorders (AODA / WCAG 2.3.3)",
      },
    },
  },
];

// =============================================================
// RULES — ties each check ID to a CSS selector + metadata
// =============================================================
const customRules = [

  // Images & Media
  { id: "custom-image-alt-check", selector: "img", tags: ["custom","wcag2a","wcag111"], metadata: { description: "Ensures <img> elements have an alt attribute", help: "Images must have an alt attribute (empty for decorative)" }, any: ["custom-image-alt-check"], all: [], none: [] },
  { id: "custom-input-image-alt-check", selector: "input[type='image']", tags: ["custom","wcag2a","wcag111","wcag412"], metadata: { description: "Ensures <input type='image'> has alternative text", help: "Image inputs must have alt text or an aria-label" }, any: ["custom-input-image-alt-check"], all: [], none: [] },
  { id: "custom-svg-img-alt-check", selector: "svg", tags: ["custom","wcag2a","wcag111"], metadata: { description: "Ensures SVG elements with an img role have accessible text", help: "SVGs with role=img must have aria-label or a <title> child" }, any: ["custom-svg-img-alt-check"], all: [], none: [] },
  { id: "custom-role-img-alt-check", selector: "[role='img']", tags: ["custom","wcag2a","wcag111"], metadata: { description: "Ensures elements with role=img have an accessible name", help: "Elements with role=img require aria-label or aria-labelledby" }, any: ["custom-role-img-alt-check"], all: [], none: [] },
  { id: "custom-video-caption-check", selector: "video", tags: ["custom","wcag2a","wcag122"], metadata: { description: "Ensures video elements have captions or subtitles", help: "Videos must have a <track kind='captions'> or <track kind='subtitles'>" }, any: ["custom-video-caption-check"], all: [], none: [] },
  { id: "custom-no-autoplay-check", selector: "audio[autoplay], video[autoplay]", tags: ["custom","wcag2a","wcag142"], metadata: { description: "Ensures autoplay media is muted", help: "Autoplay audio/video must be muted to avoid interfering with screen readers" }, any: ["custom-no-autoplay-check"], all: [], none: [] },
  { id: "custom-object-alt-check", selector: "object", tags: ["custom","wcag2a","wcag111"], metadata: { description: "Ensures <object> elements have alternative text", help: "Objects need aria-label, title, or inner fallback text" }, any: ["custom-object-alt-check"], all: [], none: [] },
  { id: "custom-image-redundant-alt-check", selector: "img[alt]", tags: ["custom","best-practice"], metadata: { description: "Ensures image alt text does not duplicate adjacent visible text", help: "Alt text that duplicates adjacent text causes screen readers to announce it twice" }, any: ["custom-image-redundant-alt-check"], all: [], none: [] },
  { id: "custom-image-map-area-alt-check", selector: "area[href]", tags: ["custom","wcag2a","wcag244","wcag412"], metadata: { description: "Ensures image map <area> elements have alternative text", help: "Linked areas in image maps must have alt text" }, any: ["custom-image-map-area-alt-check"], all: [], none: [] },
  { id: "custom-audio-transcript-check", selector: "audio", tags: ["custom","wcag2a","wcag121"], metadata: { description: "Ensures audio elements have a transcript reference", help: "Audio content requires an accessible transcript for deaf users" }, any: ["custom-audio-transcript-check"], all: [], none: [] },

  // ARIA
  { id: "custom-aria-hidden-body-check", selector: "body", tags: ["custom","wcag2a","wcag131","wcag412"], metadata: { description: "Ensures aria-hidden='true' is not on the document body", help: "Applying aria-hidden to body hides the entire page from assistive technology" }, any: ["custom-aria-hidden-body-check"], all: [], none: [] },
  { id: "custom-aria-hidden-focus-check", selector: "[aria-hidden='true']", tags: ["custom","wcag2a","wcag412"], metadata: { description: "Ensures aria-hidden elements contain no focusable descendants", help: "Focusable elements inside aria-hidden containers are reachable by keyboard but invisible to screen readers" }, any: ["custom-aria-hidden-focus-check"], all: [], none: [] },
  { id: "custom-aria-valid-role-check", selector: "[role]", tags: ["custom","wcag2a","wcag412"], metadata: { description: "Ensures role attribute uses a valid ARIA role value", help: "Invalid ARIA roles are ignored or misinterpreted by assistive technologies" }, any: ["custom-aria-valid-role-check"], all: [], none: [] },
  { id: "custom-aria-deprecated-role-check", selector: "[role]", tags: ["custom","wcag2a","wcag412"], metadata: { description: "Ensures elements do not use deprecated ARIA roles", help: "Update deprecated roles to currently supported equivalents" }, any: ["custom-aria-deprecated-role-check"], all: [], none: [] },
  { id: "custom-aria-labelledby-valid-check", selector: "[aria-labelledby]", tags: ["custom","wcag2a","wcag412"], metadata: { description: "Ensures aria-labelledby references valid IDs", help: "All IDs in aria-labelledby must exist in the document" }, any: ["custom-aria-labelledby-valid-check"], all: [], none: [] },
  { id: "custom-aria-describedby-valid-check", selector: "[aria-describedby]", tags: ["custom","wcag2a","wcag412"], metadata: { description: "Ensures aria-describedby references valid IDs", help: "All IDs in aria-describedby must exist in the document" }, any: ["custom-aria-describedby-valid-check"], all: [], none: [] },
  { id: "custom-aria-required-attr-check", selector: "[role='checkbox'], [role='combobox'], [role='option'], [role='radio'], [role='scrollbar'], [role='slider'], [role='spinbutton'], [role='switch']", tags: ["custom","wcag2a","wcag412"], metadata: { description: "Ensures ARIA roles have all required attributes", help: "Roles like checkbox and slider require specific state attributes such as aria-checked or aria-valuenow" }, any: ["custom-aria-required-attr-check"], all: [], none: [] },
  { id: "custom-aria-required-children-check", selector: "[role='grid'], [role='list'], [role='listbox'], [role='menu'], [role='menubar'], [role='radiogroup'], [role='tablist'], [role='tree'], [role='treegrid']", tags: ["custom","wcag2a","wcag131"], metadata: { description: "Ensures ARIA container roles own required child roles", help: "Container roles like list and menu must contain their required owned elements" }, any: ["custom-aria-required-children-check"], all: [], none: [] },
  { id: "custom-aria-required-parent-check", selector: "[role='listitem'], [role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio'], [role='option'], [role='row'], [role='tab'], [role='treeitem']", tags: ["custom","wcag2a","wcag131"], metadata: { description: "Ensures ARIA child roles are contained by a required parent role", help: "Roles like listitem and tab must be contained by their required parent roles" }, any: ["custom-aria-required-parent-check"], all: [], none: [] },
  { id: "custom-aria-dialog-name-check", selector: "[role='dialog'], [role='alertdialog']", tags: ["custom","best-practice"], metadata: { description: "Ensures ARIA dialogs have an accessible name", help: "Dialogs must have aria-label or aria-labelledby so screen readers announce their purpose" }, any: ["custom-aria-dialog-name-check"], all: [], none: [] },
  { id: "custom-aria-text-check", selector: "[role='text']", tags: ["custom","best-practice"], metadata: { description: "Ensures role='text' elements have no focusable descendants", help: "role=text must only wrap static text — focusable children make it invalid" }, any: ["custom-aria-text-check"], all: [], none: [] },
  { id: "custom-aria-treeitem-name-check", selector: "[role='treeitem']", tags: ["custom","wcag2a","wcag412"], metadata: { description: "Ensures ARIA treeitem nodes have an accessible name", help: "Every treeitem must have text or an aria-label so users can identify the tree node" }, any: ["custom-aria-treeitem-name-check"], all: [], none: [] },
  { id: "custom-aria-expanded-button-check", selector: "button[aria-controls], button[aria-haspopup]", tags: ["custom","best-practice"], metadata: { description: "Ensures buttons that control popups have aria-expanded", help: "Buttons with aria-controls or aria-haspopup must also have aria-expanded to communicate open/closed state" }, any: ["custom-aria-expanded-button-check"], all: [], none: [] },
  { id: "custom-aria-live-region-check", selector: "[aria-live]", tags: ["custom","best-practice"], metadata: { description: "Ensures aria-live attributes use valid values", help: "Valid values are: off, polite, assertive" }, any: ["custom-aria-live-region-check"], all: [], none: [] },
  { id: "custom-presentation-role-conflict-check", selector: "[role='none'], [role='presentation']", tags: ["custom","best-practice"], metadata: { description: "Ensures presentational elements have no conflicting ARIA attributes", help: "Elements with role=none/presentation must not have global ARIA attributes or tabindex" }, any: ["custom-presentation-role-conflict-check"], all: [], none: [] },

  // Color & Contrast
  { id: "custom-color-contrast-check", selector: "p, span, h1, h2, h3, h4, h5, h6, li, td, th, label, a, button, input, textarea", tags: ["custom","wcag2aa","wcag143"], metadata: { description: "Ensures text meets WCAG AA minimum contrast ratio", help: "Normal text needs 4.5:1, large text needs 3:1" }, any: ["custom-color-contrast-check"], all: [], none: [] },
  { id: "custom-color-contrast-enhanced-check", selector: "p, span, h1, h2, h3, h4, h5, h6, li, td, th, label, a, button", tags: ["custom","wcag2aaa","wcag146"], metadata: { description: "Ensures text meets WCAG AAA enhanced contrast ratio", help: "Normal text needs 7:1, large text needs 4.5:1" }, any: ["custom-color-contrast-enhanced-check"], all: [], none: [] },
  { id: "custom-non-text-contrast-check", selector: "button, input, select, textarea, [role='button'], [role='checkbox'], [role='radio'], [role='slider'], [role='spinbutton']", tags: ["custom","wcag21aa","wcag1411"], metadata: { description: "Ensures UI component borders meet 3:1 non-text contrast", help: "Visible boundaries of UI components need at least 3:1 contrast (WCAG 1.4.11)" }, any: ["custom-non-text-contrast-check"], all: [], none: [] },
  { id: "custom-focus-visible-check", selector: "a, button, input, select, textarea, [tabindex='0'], [role='button'], [role='link']", tags: ["custom","wcag2aa","wcag2411"], metadata: { description: "Ensures interactive elements have a visible focus indicator", help: "Do not remove outline without providing an alternative focus indicator" }, any: ["custom-focus-visible-check"], all: [], none: [] },
  { id: "custom-color-not-sole-means-check", selector: "[class*='error'], [class*='warning'], [class*='success'], [class*='alert'], [role='alert'], [role='status']", tags: ["custom","wcag2a","wcag141"], metadata: { description: "Ensures status indicators use more than color to convey meaning", help: "Color-blind users need icons or text in addition to color coding" }, any: ["custom-color-not-sole-means-check"], all: [], none: [] },

  // Keyboard & Focus
  { id: "custom-skip-navigation-check", selector: "body", tags: ["custom","wcag2a","wcag241"], metadata: { description: "Ensures the page has a skip navigation link", help: "A skip link lets keyboard users bypass repeated navigation" }, any: ["custom-skip-navigation-check"], all: [], none: [] },
  { id: "custom-accesskeys-unique-check", selector: "[accesskey]", tags: ["custom","best-practice"], metadata: { description: "Ensures accesskey values are unique across the document", help: "Duplicate accesskeys produce unpredictable behavior" }, any: ["custom-accesskeys-unique-check"], all: [], none: [] },
  { id: "custom-scrollable-keyboard-check", selector: "*", tags: ["custom","wcag2a","wcag211"], metadata: { description: "Ensures scrollable regions are keyboard accessible", help: "Scrollable elements need tabindex='0' or focusable children" }, any: ["custom-scrollable-keyboard-check"], all: [], none: [] },
  { id: "custom-nested-interactive-check", selector: "a[href], button, [role='button'], [role='link']", tags: ["custom","wcag2a","wcag412"], metadata: { description: "Ensures interactive controls are not nested", help: "Nested interactive controls create invalid HTML and inconsistent screen reader behavior" }, any: ["custom-nested-interactive-check"], all: [], none: [] },
  { id: "custom-frame-focusable-check", selector: "iframe[tabindex], frame[tabindex]", tags: ["custom","wcag2a","wcag211"], metadata: { description: "Ensures frames with focusable content do not have tabindex=-1", help: "Frames with interactive content must be keyboard reachable" }, any: ["custom-frame-focusable-check"], all: [], none: [] },
  { id: "custom-no-keyboard-trap-check", selector: "[role='dialog'], [role='alertdialog']", tags: ["custom","wcag2a","wcag211"], metadata: { description: "Ensures dialogs have a close or dismiss mechanism", help: "Dialogs without a close button can trap keyboard users" }, any: ["custom-no-keyboard-trap-check"], all: [], none: [] },
  { id: "custom-skip-link-focusable-check", selector: "a[href^='#']", tags: ["custom","best-practice","wcag241"], metadata: { description: "Ensures skip link targets exist and are focusable", help: "A skip link is only useful if its target can receive focus" }, any: ["custom-skip-link-focusable-check"], all: [], none: [] },

  // Forms & Inputs
  { id: "custom-label-check", selector: "input:not([type='hidden']):not([type='submit']):not([type='reset']):not([type='button']):not([type='image']), textarea", tags: ["custom","wcag2a","wcag412"], metadata: { description: "Ensures form elements have an accessible label", help: "Every form input must be associated with a label" }, any: ["custom-label-check"], all: [], none: [] },
  { id: "custom-autocomplete-valid-check", selector: "input[autocomplete], textarea[autocomplete], select[autocomplete]", tags: ["custom","wcag21aa","wcag135"], metadata: { description: "Ensures autocomplete attribute uses valid tokens", help: "Invalid autocomplete tokens prevent password managers and assistive tech from filling fields" }, any: ["custom-autocomplete-valid-check"], all: [], none: [] },
  { id: "custom-select-name-check", selector: "select", tags: ["custom","wcag2a","wcag412"], metadata: { description: "Ensures select elements have an accessible name", help: "Every select must have a label, aria-label, or aria-labelledby" }, any: ["custom-select-name-check"], all: [], none: [] },
  { id: "custom-fieldset-legend-check", selector: "fieldset", tags: ["custom","best-practice","wcag131"], metadata: { description: "Ensures fieldsets have a non-empty legend", help: "The <legend> provides a group label for the controls inside the fieldset" }, any: ["custom-fieldset-legend-check"], all: [], none: [] },
  { id: "custom-form-multiple-labels-check", selector: "input[id], textarea[id], select[id]", tags: ["custom","wcag2a","wcag332"], metadata: { description: "Ensures form fields do not have multiple <label> elements", help: "Multiple labels cause screen readers to announce redundant information" }, any: ["custom-form-multiple-labels-check"], all: [], none: [] },
  { id: "custom-required-field-indication-check", selector: "input[required], input[aria-required='true'], textarea[required], select[required]", tags: ["custom","best-practice"], metadata: { description: "Ensures required fields are indicated accessibly", help: "Use the required attribute or aria-required='true' to communicate required state" }, any: ["custom-required-field-indication-check"], all: [], none: [] },
  { id: "custom-input-type-valid-check", selector: "input[type]", tags: ["custom","best-practice"], metadata: { description: "Ensures input type attribute uses a valid value", help: "Unknown input types fall back to text and may confuse screen reader users" }, any: ["custom-input-type-valid-check"], all: [], none: [] },
  { id: "custom-input-password-autocomplete-check", selector: "input[type='password']", tags: ["custom","wcag21aa","wcag135"], metadata: { description: "Ensures password inputs have appropriate autocomplete", help: "Use autocomplete='current-password' or 'new-password' for password fields" }, any: ["custom-input-password-autocomplete-check"], all: [], none: [] },

  // Document Structure
  { id: "custom-document-title-check", selector: "html", tags: ["custom","wcag2a","wcag242"], metadata: { description: "Ensures the document has a non-empty <title>", help: "The page title is the first thing screen reader users hear and must be descriptive" }, any: ["custom-document-title-check"], all: [], none: [] },
  { id: "custom-html-lang-check", selector: "html", tags: ["custom","wcag2a","wcag311"], metadata: { description: "Ensures the <html> element has a lang attribute", help: "Missing lang causes screen readers to use their default language, potentially mispronouncing content" }, any: ["custom-html-lang-check"], all: [], none: [] },
  { id: "custom-html-lang-valid-check", selector: "html[lang]", tags: ["custom","wcag2a","wcag311"], metadata: { description: "Ensures the HTML lang attribute is a valid BCP 47 tag", help: "An invalid lang value prevents screen readers from selecting the correct voice" }, any: ["custom-html-lang-valid-check"], all: [], none: [] },
  { id: "custom-meta-refresh-check", selector: "meta[http-equiv='refresh']", tags: ["custom","wcag2a","wcag221"], metadata: { description: "Ensures meta refresh does not auto-redirect after a delay", help: "Timed page refreshes disrupt screen reader navigation" }, any: ["custom-meta-refresh-check"], all: [], none: [] },
  { id: "custom-meta-viewport-zoom-check", selector: "meta[name='viewport']", tags: ["custom","wcag2aa","wcag144"], metadata: { description: "Ensures viewport meta does not disable user zoom", help: "user-scalable=no or maximum-scale=1 prevents low-vision users from zooming" }, any: ["custom-meta-viewport-zoom-check"], all: [], none: [] },
  { id: "custom-duplicate-id-check", selector: "[id]", tags: ["custom","wcag2a","wcag412"], metadata: { description: "Ensures element IDs are unique in the document", help: "Duplicate IDs break ARIA references and label associations" }, any: ["custom-duplicate-id-check"], all: [], none: [] },
  { id: "custom-list-structure-check", selector: "ul, ol", tags: ["custom","wcag2a","wcag131"], metadata: { description: "Ensures lists only contain valid child elements", help: "Only <li> elements are valid direct children of <ul> and <ol>" }, any: ["custom-list-structure-check"], all: [], none: [] },
  { id: "custom-definition-list-check", selector: "dl", tags: ["custom","wcag2a","wcag131"], metadata: { description: "Ensures definition lists are structured correctly", help: "Only <dt>, <dd>, or <div> groupings are valid inside <dl>" }, any: ["custom-definition-list-check"], all: [], none: [] },
  { id: "custom-frame-title-check", selector: "iframe, frame", tags: ["custom","wcag2a","wcag412"], metadata: { description: "Ensures frames have an accessible name", help: "Every iframe needs a title, aria-label, or aria-labelledby" }, any: ["custom-frame-title-check"], all: [], none: [] },
  { id: "custom-frame-title-unique-check", selector: "iframe[title], frame[title]", tags: ["custom","wcag2a","wcag412"], metadata: { description: "Ensures frame titles are unique", help: "Multiple frames with the same title cannot be distinguished by screen reader users" }, any: ["custom-frame-title-unique-check"], all: [], none: [] },
  { id: "custom-blink-check", selector: "blink", tags: ["custom","wcag2a","wcag222"], metadata: { description: "Ensures <blink> elements are not used", help: "<blink> is obsolete and can trigger seizures in photosensitive users" }, any: ["custom-blink-check"], all: [], none: [] },
  { id: "custom-marquee-check", selector: "marquee", tags: ["custom","wcag2a","wcag222"], metadata: { description: "Ensures <marquee> elements are not used", help: "<marquee> moves continuously and cannot be paused" }, any: ["custom-marquee-check"], all: [], none: [] },
  { id: "custom-lang-parts-check", selector: "[lang]:not(html)", tags: ["custom","wcag2aa","wcag312"], metadata: { description: "Ensures inline lang attributes are valid BCP 47 tags", help: "Inline lang attributes must use valid language codes for proper pronunciation" }, any: ["custom-lang-parts-check"], all: [], none: [] },

  // Landmarks & Navigation
  { id: "custom-landmark-main-check", selector: "body", tags: ["custom","best-practice"], metadata: { description: "Ensures the page has a main landmark", help: "A <main> element lets screen reader users jump directly to main content" }, any: ["custom-landmark-main-check"], all: [], none: [] },
  { id: "custom-landmark-duplicate-main-check", selector: "body", tags: ["custom","best-practice"], metadata: { description: "Ensures there is at most one main landmark", help: "Multiple main landmarks confuse screen reader users about the primary content" }, any: ["custom-landmark-duplicate-main-check"], all: [], none: [] },
  { id: "custom-landmark-banner-top-level-check", selector: "header, [role='banner']", tags: ["custom","best-practice"], metadata: { description: "Ensures the banner landmark is at the top level", help: "Banner/header landmarks must not be nested inside sectional elements" }, any: ["custom-landmark-banner-top-level-check"], all: [], none: [] },
  { id: "custom-landmark-contentinfo-top-level-check", selector: "footer, [role='contentinfo']", tags: ["custom","best-practice"], metadata: { description: "Ensures the contentinfo landmark is at the top level", help: "Footer/contentinfo landmarks must not be nested inside sectional elements" }, any: ["custom-landmark-contentinfo-top-level-check"], all: [], none: [] },
  { id: "custom-landmark-unique-check", selector: "[role='navigation'], [role='complementary'], [role='form'], [role='region'], [role='search']", tags: ["custom","best-practice"], metadata: { description: "Ensures repeated landmarks have unique accessible labels", help: "Multiple same-type landmarks need unique aria-label to be distinguishable" }, any: ["custom-landmark-unique-check"], all: [], none: [] },
  { id: "custom-page-region-check", selector: "main > *, article, section, aside", tags: ["custom","best-practice"], metadata: { description: "Ensures page content is within landmark regions", help: "Content outside landmarks is skipped by screen reader users navigating by landmarks" }, any: ["custom-page-region-check"], all: [], none: [] },
  { id: "custom-page-heading-one-check", selector: "body", tags: ["custom","best-practice"], metadata: { description: "Ensures the page has at least one h1 heading", help: "An h1 is the primary topic identifier for screen reader users navigating by headings" }, any: ["custom-page-heading-one-check"], all: [], none: [] },
  { id: "custom-heading-one-unique-check", selector: "body", tags: ["custom","best-practice"], metadata: { description: "Ensures the page has exactly one h1 heading", help: "Multiple h1 headings make it unclear which is the primary page topic" }, any: ["custom-heading-one-unique-check"], all: [], none: [] },

  // Tables
  { id: "custom-table-headers-check", selector: "table", tags: ["custom","wcag2a","wcag131"], metadata: { description: "Ensures data tables use scope or headers attributes", help: "Tables with headers need scope or headers attributes so screen readers can associate cells" }, any: ["custom-table-headers-check"], all: [], none: [] },
  { id: "custom-scope-attr-valid-check", selector: "[scope]", tags: ["custom","best-practice"], metadata: { description: "Ensures table scope attribute uses a valid value", help: "Valid scope values: row, col, rowgroup, colgroup" }, any: ["custom-scope-attr-valid-check"], all: [], none: [] },
  { id: "custom-table-duplicate-name-check", selector: "table[summary]", tags: ["custom","best-practice"], metadata: { description: "Ensures table caption and summary are not duplicates", help: "Identical caption and summary cause screen readers to announce the same text twice" }, any: ["custom-table-duplicate-name-check"], all: [], none: [] },
  { id: "custom-td-headers-attr-check", selector: "td[headers]", tags: ["custom","wcag2a","wcag131"], metadata: { description: "Ensures cell headers attribute only references <th> elements", help: "The headers attribute must point to th elements, not td elements" }, any: ["custom-td-headers-attr-check"], all: [], none: [] },
  { id: "custom-th-has-data-cells-check", selector: "th", tags: ["custom","wcag2a","wcag131"], metadata: { description: "Ensures <th> elements have associated data cells", help: "Header cells without data cells indicate a likely structural error" }, any: ["custom-th-has-data-cells-check"], all: [], none: [] },
  { id: "custom-table-fake-caption-check", selector: "table", tags: ["custom","wcag2a","wcag131"], metadata: { description: "Ensures tables with captions use the <caption> element", help: "Use <caption> instead of a spanning data row for the table title" }, any: ["custom-table-fake-caption-check"], all: [], none: [] },

  // Links
  { id: "custom-link-distinguishable-check", selector: "a[href]", tags: ["custom","wcag2a","wcag141"], metadata: { description: "Ensures links in text are distinguishable without relying solely on color", help: "Links must have underline, weight, or another non-color indicator" }, any: ["custom-link-distinguishable-check"], all: [], none: [] },
  { id: "custom-identical-links-check", selector: "a[href]", tags: ["custom","wcag2aaa","wcag249"], metadata: { description: "Ensures links with identical destinations have consistent accessible names", help: "Links to the same URL should have the same accessible name for consistent navigation" }, any: ["custom-identical-links-check"], all: [], none: [] },
  { id: "custom-link-href-valid-check", selector: "a[href]", tags: ["custom","best-practice"], metadata: { description: "Ensures links have meaningful href values", help: "Empty or javascript:void(0) hrefs are not meaningful — use <button> for actions" }, any: ["custom-link-href-valid-check"], all: [], none: [] },

  // WCAG 2.1
  { id: "custom-avoid-inline-spacing-check", selector: "*", tags: ["custom","wcag21aa","wcag1412"], metadata: { description: "Ensures inline !important does not lock text spacing", help: "Text spacing must be overridable by user stylesheets for users with reading disorders" }, any: ["custom-avoid-inline-spacing-check"], all: [], none: [] },
  { id: "custom-label-content-name-mismatch-check", selector: "a, button, [role='button'], [role='link'], input[type='submit']", tags: ["custom","wcag21a","wcag253"], metadata: { description: "Ensures visible text is included in the accessible name", help: "Voice control users speak the visible label — it must match the accessible name" }, any: ["custom-label-content-name-mismatch-check"], all: [], none: [] },
  { id: "custom-pointer-gestures-check", selector: "[draggable='true']", tags: ["custom","wcag21a","wcag251"], metadata: { description: "Ensures draggable elements have keyboard alternatives", help: "All drag operations need a single-pointer or keyboard alternative for users who cannot drag" }, any: ["custom-pointer-gestures-check"], all: [], none: [] },
  { id: "custom-content-on-hover-check", selector: "[role='tooltip']", tags: ["custom","wcag21aa","wcag1413"], metadata: { description: "Ensures tooltips are properly associated with their trigger", help: "Hover-triggered tooltips must be dismissable and persistent (WCAG 1.4.13)" }, any: ["custom-content-on-hover-check"], all: [], none: [] },

  // WCAG 2.2
  { id: "custom-focus-not-obscured-check", selector: "header, footer, nav, [style*='position: fixed'], [style*='position: sticky']", tags: ["custom","wcag22aa","wcag2412"], metadata: { description: "Ensures sticky/fixed elements do not fully obscure keyboard focus", help: "Focused elements must not be completely hidden behind sticky headers or footers (WCAG 2.4.12)" }, any: ["custom-focus-not-obscured-check"], all: [], none: [] },
  { id: "custom-dragging-alternative-check", selector: "[draggable='true'], [ondragstart]", tags: ["custom","wcag22aa","wcag257"], metadata: { description: "Ensures drag-and-drop has a single-pointer alternative", help: "Provide a click-based or keyboard alternative for all drag functionality (WCAG 2.5.7)" }, any: ["custom-dragging-alternative-check"], all: [], none: [] },
  { id: "custom-target-size-enhanced-check", selector: "button, a, input[type='button'], input[type='submit'], [role='button']", tags: ["custom","wcag22aaa","wcag255"], metadata: { description: "Ensures interactive targets meet 44x44px AAA minimum size", help: "44x44px targets are recommended for optimal touch accessibility (WCAG 2.5.5)" }, any: ["custom-target-size-enhanced-check"], all: [], none: [] },
  { id: "custom-consistent-help-check", selector: "a", tags: ["custom","wcag22a","wcag326"], metadata: { description: "Ensures help links are in a consistent landmark location", help: "Help and support links should appear in the same landmark position across pages (WCAG 3.2.6)" }, any: ["custom-consistent-help-check"], all: [], none: [] },
  { id: "custom-redundant-entry-check", selector: "input:not([type='hidden']):not([type='submit'])", tags: ["custom","wcag22a","wcag337"], metadata: { description: "Ensures inputs in multi-step forms support autocomplete", help: "Prevent users from re-entering information already provided earlier in the form (WCAG 3.3.7)" }, any: ["custom-redundant-entry-check"], all: [], none: [] },

  // Original Rules
  { id: "custom-target-size-check", selector: "button, a, input[type='button'], input[type='submit'], [role='button']", tags: ["custom","best-practice","wcag22aa"], metadata: { description: "Ensures interactive targets meet the 24x24px minimum size", help: "Interactive elements should be at least 24x24 CSS pixels" }, any: ["custom-target-size-check"], all: [], none: [] },
  { id: "custom-placeholder-as-label-check", selector: "input[type='text'], input[type='email'], input[type='search'], input[type='tel'], textarea", tags: ["custom","best-practice"], metadata: { description: "Ensures form fields are not labeled solely by placeholder text", help: "Form fields must have a real label, not just placeholder text" }, any: ["custom-placeholder-as-label-check"], all: [], none: [] },
  { id: "custom-empty-link-check", selector: "a[href]", tags: ["custom","wcag2a","wcag244"], metadata: { description: "Ensures links have discernible text", help: "Links must have text, aria-label, title, or an img with alt text" }, any: ["custom-empty-link-check"], all: [], none: [] },
  { id: "custom-generic-link-text-check", selector: "a[href]", tags: ["custom","best-practice"], metadata: { description: "Flags generic non-descriptive link text", help: "Link text should describe the destination without relying on context" }, any: ["custom-generic-link-text-check"], all: [], none: [] },
  { id: "custom-heading-skip-check", selector: "h1, h2, h3, h4, h5, h6", tags: ["custom","best-practice","wcag131"], metadata: { description: "Ensures heading levels do not skip", help: "Heading levels should descend by no more than one level at a time" }, any: ["custom-heading-skip-check"], all: [], none: [] },
  { id: "custom-new-tab-warning-check", selector: "a[target='_blank']", tags: ["custom","best-practice","wcag2a"], metadata: { description: "Ensures links opening in a new tab warn the user", help: "Links with target=_blank should indicate they open in a new tab" }, any: ["custom-new-tab-warning-check"], all: [], none: [] },
  { id: "custom-blank-target-noopener-check", selector: "a[target='_blank']", tags: ["custom","best-practice","security"], metadata: { description: "Ensures target=_blank links include rel=noopener", help: "Links with target=_blank should include rel='noopener' or 'noreferrer'" }, any: ["custom-blank-target-noopener-check"], all: [], none: [] },
  { id: "custom-redundant-title-check", selector: "a[title], button[title]", tags: ["custom","best-practice"], metadata: { description: "Flags title attributes that duplicate visible text", help: "Title attribute should add information, not repeat the visible text" }, any: ["custom-redundant-title-check"], all: [], none: [] },
  { id: "custom-positive-tabindex-check", selector: "[tabindex]", tags: ["custom","best-practice","wcag2a","wcag243"], metadata: { description: "Flags positive tabindex values", help: "Avoid positive tabindex — use 0 or -1 instead" }, any: ["custom-positive-tabindex-check"], all: [], none: [] },
  { id: "custom-form-missing-submit-check", selector: "form", tags: ["custom","best-practice","wcag2a"], metadata: { description: "Ensures forms have a discoverable submit control", help: "Forms should include a real submit button" }, any: ["custom-form-missing-submit-check"], all: [], none: [] },
  { id: "custom-table-caption-check", selector: "table", tags: ["custom","best-practice","wcag2a","wcag131"], metadata: { description: "Ensures data tables have a caption or accessible label", help: "Data tables (with <th> headers) should have a <caption> or aria-label" }, any: ["custom-table-caption-check"], all: [], none: [] },

  // Additional Best Practices
  { id: "custom-empty-heading-check", selector: "h1, h2, h3, h4, h5, h6", tags: ["custom","best-practice"], metadata: { description: "Ensures headings have discernible text", help: "Empty headings appear in screen reader heading lists and confuse users" }, any: ["custom-empty-heading-check"], all: [], none: [] },
  { id: "custom-empty-table-header-check", selector: "th", tags: ["custom","best-practice"], metadata: { description: "Ensures table header cells have discernible text", help: "Empty table headers prevent screen readers from describing columns or rows" }, any: ["custom-empty-table-header-check"], all: [], none: [] },
  { id: "custom-server-side-image-map-check", selector: "img[ismap]", tags: ["custom","wcag2a","wcag211"], metadata: { description: "Ensures server-side image maps are not used", help: "Server-side image maps cannot be navigated without a mouse" }, any: ["custom-server-side-image-map-check"], all: [], none: [] },
  { id: "custom-button-name-check", selector: "button", tags: ["custom","wcag2a","wcag412"], metadata: { description: "Ensures buttons have an accessible name", help: "Buttons must have visible text, aria-label, or aria-labelledby" }, any: ["custom-button-name-check"], all: [], none: [] },
  { id: "custom-input-button-name-check", selector: "input[type='button'], input[type='submit'], input[type='reset']", tags: ["custom","wcag2a","wcag412"], metadata: { description: "Ensures input buttons have an accessible name", help: "Input buttons must have a value attribute or aria-label" }, any: ["custom-input-button-name-check"], all: [], none: [] },
  { id: "custom-css-animation-reducible-check", selector: "*", tags: ["custom","wcag2aaa","wcag233"], metadata: { description: "Ensures animations are not infinite without a way to pause", help: "Infinite animations must respect prefers-reduced-motion for users with vestibular disorders" }, any: ["custom-css-animation-reducible-check"], all: [], none: [] },
  { id: "custom-abbr-title-check", selector: "abbr", tags: ["custom","best-practice"], metadata: { description: "Ensures abbreviations have a title with their expansion", help: "The <abbr> title attribute exposes the full word to screen readers and on hover" }, any: ["custom-abbr-title-check"], all: [], none: [] },
  { id: "custom-time-element-check", selector: "time[datetime]", tags: ["custom","best-practice"], metadata: { description: "Ensures <time> elements have a valid datetime attribute", help: "A valid ISO 8601 datetime lets assistive technologies and parsers interpret the date correctly" }, any: ["custom-time-element-check"], all: [], none: [] },
  { id: "custom-details-summary-check", selector: "details", tags: ["custom","best-practice"], metadata: { description: "Ensures <details> elements have a visible <summary>", help: "Without a summary, the disclosure widget has no accessible label" }, any: ["custom-details-summary-check"], all: [], none: [] },
  { id: "custom-dialog-modal-check", selector: "[role='dialog'], [role='alertdialog']", tags: ["custom","best-practice"], metadata: { description: "Ensures ARIA dialogs have aria-modal='true'", help: "aria-modal confines the screen reader virtual cursor to the dialog content" }, any: ["custom-dialog-modal-check"], all: [], none: [] },

  // ============================================================
  // AODA / WCAG 2.0 AA — Missing Criteria + Ontario-specific
  // ============================================================
  { id: "custom-audio-description-check", selector: "video", tags: ["custom","wcag2a","wcag123","aoda"], metadata: { description: "Videos must have an audio description track or text alternative (WCAG 1.2.3)", help: "Add <track kind='descriptions'> or an aria-describedby text alternative to the video element" }, any: ["custom-audio-description-check"], all: [], none: [] },
  { id: "custom-meaningful-sequence-check", selector: "[style*='order']", tags: ["custom","wcag2a","wcag132","aoda"], metadata: { description: "CSS order property must not create a reading sequence that differs significantly from the DOM order (WCAG 1.3.2)", help: "Ensure the visual reading order matches the DOM order so screen reader users encounter content logically" }, any: ["custom-meaningful-sequence-check"], all: [], none: [] },
  { id: "custom-sensory-characteristics-check", selector: "p, li, dd, td, figcaption, div", tags: ["custom","wcag2a","wcag133","aoda"], metadata: { description: "Instructions must not rely solely on shape, color, size, or spatial location (WCAG 1.3.3)", help: "Supplement any color, shape, or position references with text labels so all users can follow the instructions" }, any: ["custom-sensory-characteristics-check"], all: [], none: [] },
  { id: "custom-audio-control-check", selector: "audio[autoplay]", tags: ["custom","wcag2a","wcag142","aoda"], metadata: { description: "Autoplaying audio must be muted or have visible playback controls (WCAG 1.4.2)", help: "Add the controls attribute or muted attribute to autoplaying audio elements" }, any: ["custom-audio-control-check"], all: [], none: [] },
  { id: "custom-resize-text-check", selector: "p, li, td, span, div", tags: ["custom","wcag2aa","wcag144","aoda"], metadata: { description: "Text must not be sized so small in fixed pixels that it cannot be resized to 200% (WCAG 1.4.4)", help: "Use relative units (em, rem, %) for font sizes so users can enlarge text using browser settings" }, any: ["custom-resize-text-check"], all: [], none: [] },
  { id: "custom-images-of-text-check", selector: "img", tags: ["custom","wcag2aa","wcag145","aoda"], metadata: { description: "Images must not be used to present text that can be displayed as live HTML text (WCAG 1.4.5)", help: "Replace images of text with actual HTML text styled with CSS; exceptions: logos and text that is part of the image's content" }, any: ["custom-images-of-text-check"], all: [], none: [] },
  { id: "custom-timing-adjustable-check", selector: "[class*='timeout'], [id*='timeout'], [class*='session'], [id*='session'], [class*='expire'], [id*='expire']", tags: ["custom","wcag2aa","wcag221","aoda"], metadata: { description: "Session timeouts must be adjustable or warn users before they expire (WCAG 2.2.1)", help: "Provide a button or link to extend the session when displaying timeout warnings; allow at least 20 seconds to respond" }, any: ["custom-timing-adjustable-check"], all: [], none: [] },
  { id: "custom-three-flashes-check", selector: "[style*='animation'], [class*='flash'], [class*='blink'], [class*='strobe'], [class*='pulse']", tags: ["custom","wcag2a","wcag231","aoda"], metadata: { description: "Content must not flash more than 3 times per second — this can trigger photosensitive seizures (WCAG 2.3.1)", help: "Remove or throttle rapid-fire animations; use CSS animation-duration > 0.34s or animation-iteration-count ≤ 3" }, any: ["custom-three-flashes-check"], all: [], none: [] },
  { id: "custom-multiple-ways-check", selector: "html", tags: ["custom","wcag2aa","wcag245","aoda"], metadata: { description: "Multiple ways to find content must be available — such as a search form or site map (WCAG 2.4.5)", help: "Add a search field (input[type='search']) or a link to a sitemap; at least two methods of finding content are required" }, any: ["custom-multiple-ways-check"], all: [], none: [] },
  { id: "custom-headings-labels-check", selector: "h1, h2, h3, h4, h5, h6", tags: ["custom","wcag2aa","wcag246","aoda"], metadata: { description: "Headings and labels must describe the topic or purpose of their section (WCAG 2.4.6)", help: "Write headings as meaningful descriptions — avoid single-character, number-only, or punctuation-only headings" }, any: ["custom-headings-labels-check"], all: [], none: [] },
  { id: "custom-on-focus-check", selector: "[onfocus]", tags: ["custom","wcag2a","wcag321","aoda"], metadata: { description: "Receiving focus must not cause a change of context such as form submission or navigation (WCAG 3.2.1)", help: "Remove form submissions and page navigations from onfocus handlers; reserve these for onclick/onkeydown" }, any: ["custom-on-focus-check"], all: [], none: [] },
  { id: "custom-on-input-check", selector: "input[onchange], select[onchange], textarea[onchange]", tags: ["custom","wcag2a","wcag322","aoda"], metadata: { description: "Changing an input value must not automatically submit a form or navigate the page (WCAG 3.2.2)", help: "Remove auto-submit and navigation from onchange handlers; require an explicit submit action from the user" }, any: ["custom-on-input-check"], all: [], none: [] },
  { id: "custom-error-identification-check", selector: "[aria-invalid='true']", tags: ["custom","wcag2a","wcag331","aoda"], metadata: { description: "Fields marked as invalid must have a linked text error message via aria-errormessage or aria-describedby (WCAG 3.3.1)", help: "Add aria-errormessage='error-id' pointing to an element with a descriptive error text, or use aria-describedby" }, any: ["custom-error-identification-check"], all: [], none: [] },
  { id: "custom-error-suggestion-check", selector: "[aria-invalid='true']", tags: ["custom","wcag2aa","wcag333","aoda"], metadata: { description: "Error messages must suggest how to correct the mistake when the expected format is known (WCAG 3.3.3)", help: "Include actionable language in error messages such as 'Please enter a valid email address (e.g. name@example.com)'" }, any: ["custom-error-suggestion-check"], all: [], none: [] },
  { id: "custom-error-prevention-check", selector: "form", tags: ["custom","wcag2aa","wcag334","aoda"], metadata: { description: "Forms involving financial, legal, or irreversible actions must allow users to review, correct, and confirm before final submission (WCAG 3.3.4)", help: "Add a review/confirmation step, or a clear cancellation mechanism for payment and legal forms" }, any: ["custom-error-prevention-check"], all: [], none: [] },

  // AODA IASR — Ontario-specific
  { id: "custom-pdf-accessibility-check", selector: "a[href$='.pdf'], a[href$='.PDF']", tags: ["custom","aoda","best-practice"], metadata: { description: "Links to PDF files must warn users of the format and provide an accessible alternative when needed (AODA IASR s.14)", help: "Include '(PDF)' in the link text or title attribute; provide a linked HTML alternative for complex documents" }, any: ["custom-pdf-accessibility-check"], all: [], none: [] },
  { id: "custom-accessible-documents-check", selector: "a[href$='.doc'], a[href$='.docx'], a[href$='.xls'], a[href$='.xlsx'], a[href$='.ppt'], a[href$='.pptx']", tags: ["custom","aoda","best-practice"], metadata: { description: "Links to Office documents must indicate the file format (AODA IASR s.14)", help: "Include the file type in the link text (e.g. 'Annual Report (Word)') and ensure the document itself meets AODA accessibility requirements" }, any: ["custom-accessible-documents-check"], all: [], none: [] },
  { id: "custom-accessibility-statement-check", selector: "html", tags: ["custom","aoda"], metadata: { description: "Every page must contain a link to the organization's accessibility statement or policy (AODA IASR)", help: "Add a link with text containing 'Accessibility' in the header, footer, or navigation — point it to your accessibility policy and multi-year plan" }, any: ["custom-accessibility-statement-check"], all: [], none: [] },
  { id: "custom-feedback-mechanism-check", selector: "html", tags: ["custom","aoda"], metadata: { description: "Every page must provide an accessible feedback or contact mechanism for users with disabilities (AODA IASR s.11)", help: "Include a 'Contact Us' or 'Feedback' link in the header or footer; ensure the contact form is fully keyboard-accessible and works with screen readers" }, any: ["custom-feedback-mechanism-check"], all: [], none: [] },
  { id: "custom-pointer-cancellation-check", selector: "[onmousedown], [ontouchstart]", tags: ["custom","wcag21","wcag252","aoda"], metadata: { description: "Single-pointer actions must not execute on the down event — users must be able to cancel by moving the pointer away (WCAG 2.5.2)", help: "Move activation logic from onmousedown/ontouchstart to onclick or onmouseup/ontouchend so users can abort accidental activations" }, any: ["custom-pointer-cancellation-check"], all: [], none: [] },
  { id: "custom-motion-actuation-check", selector: "[ondevicemotion], [ondeviceorientation], [onorientationchange]", tags: ["custom","wcag21","wcag254","aoda"], metadata: { description: "Features operated by device motion must have a UI alternative and be disableable (WCAG 2.5.4)", help: "Add a button, slider, or other conventional UI control that performs the same action as the motion gesture" }, any: ["custom-motion-actuation-check"], all: [], none: [] },
  { id: "custom-consistent-navigation-check", selector: "nav, [role='navigation']", tags: ["custom","wcag2aa","wcag323","aoda"], metadata: { description: "Navigation components must contain at least two links to be meaningful (WCAG 3.2.3)", help: "Ensure navigation regions have multiple links and are consistently presented across pages in the same relative order" }, any: ["custom-consistent-navigation-check"], all: [], none: [] },
  { id: "custom-captcha-alternative-check", selector: "img[alt*='captcha' i], img[id*='captcha' i], img[class*='captcha' i], [class*='captcha' i]", tags: ["custom","wcag2a","wcag111","aoda"], metadata: { description: "CAPTCHAs must provide an audio or alternative verification method for blind users (AODA / WCAG 1.1.1)", help: "Implement an audio CAPTCHA option alongside visual CAPTCHAs; consider using accessible alternatives like reCAPTCHA v3 or honeypot fields" }, any: ["custom-captcha-alternative-check"], all: [], none: [] },
  { id: "custom-aoda-language-check", selector: "html", tags: ["custom","wcag2a","wcag311","aoda"], metadata: { description: "The HTML lang attribute must be set to a valid BCP 47 language code — 'en' or 'fr' for Ontario public-sector organizations (WCAG 3.1.1 / AODA)", help: "Set lang='en' or lang='fr' on the <html> element to match the primary language of the page content" }, any: ["custom-aoda-language-check"], all: [], none: [] },
  { id: "custom-site-navigation-check", selector: "html", tags: ["custom","wcag2aa","wcag245","aoda"], metadata: { description: "Every page must have at least one navigation landmark to provide multiple ways to find content (WCAG 2.4.5 / AODA)", help: "Add a <nav> element or role='navigation' landmark containing the site navigation links" }, any: ["custom-site-navigation-check"], all: [], none: [] },
  { id: "custom-reduced-motion-check", selector: "[style*='animation-name'], [class*='animate'], [class*='transition']", tags: ["custom","best-practice","aoda"], metadata: { description: "Infinite animations should respect prefers-reduced-motion to support users with vestibular disorders (WCAG 2.3.3 / AODA)", help: "Add @media (prefers-reduced-motion: reduce) { animation: none; } to disable non-essential animations for users who prefer reduced motion" }, any: ["custom-reduced-motion-check"], all: [], none: [] },
];

const CUSTOM_RULE_IDS = customRules.map(function (r) { return r.id; });

module.exports = {
  customChecks,
  customRules,
  CUSTOM_RULE_IDS,
};
