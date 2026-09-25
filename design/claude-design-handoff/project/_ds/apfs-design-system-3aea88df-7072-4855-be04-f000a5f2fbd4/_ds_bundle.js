/* @ds-bundle: {"format":3,"namespace":"APFSDesignSystem_3aea88","components":[{"name":"Button","sourcePath":"components/action/Button.jsx"},{"name":"IconButton","sourcePath":"components/action/IconButton.jsx"},{"name":"TextButton","sourcePath":"components/action/TextButton.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"Logo","sourcePath":"components/core/Logo.jsx"},{"name":"Avatar","sourcePath":"components/display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"Chip","sourcePath":"components/display/Chip.jsx"},{"name":"Divider","sourcePath":"components/display/Divider.jsx"},{"name":"Tag","sourcePath":"components/display/Tag.jsx"},{"name":"Callout","sourcePath":"components/feedback/Callout.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Select","sourcePath":"components/input/Select.jsx"},{"name":"TextField","sourcePath":"components/input/TextField.jsx"},{"name":"Card","sourcePath":"components/layout/Card.jsx"},{"name":"ListCell","sourcePath":"components/layout/ListCell.jsx"},{"name":"Tabs","sourcePath":"components/layout/Tabs.jsx"},{"name":"Checkbox","sourcePath":"components/selection/Checkbox.jsx"},{"name":"Radio","sourcePath":"components/selection/Radio.jsx"},{"name":"SegmentedControl","sourcePath":"components/selection/SegmentedControl.jsx"},{"name":"Switch","sourcePath":"components/selection/Switch.jsx"}],"sourceHashes":{"components/action/Button.jsx":"20a69a203b0e","components/action/IconButton.jsx":"577faa4fa51b","components/action/TextButton.jsx":"109fa0c7c01b","components/core/Icon.jsx":"02fd1250236f","components/core/Logo.jsx":"c0466242a95a","components/core/util.jsx":"1ee26619e63c","components/display/Avatar.jsx":"d55577273837","components/display/Badge.jsx":"8f92b8ea0241","components/display/Chip.jsx":"8726d0690698","components/display/Divider.jsx":"018d4722f765","components/display/Tag.jsx":"d05e1ba3564e","components/feedback/Callout.jsx":"5cb15998aa7c","components/feedback/Dialog.jsx":"d8ca7d315a24","components/feedback/Toast.jsx":"ee14781a072c","components/feedback/Tooltip.jsx":"90d245756543","components/input/Select.jsx":"c331f2791032","components/input/TextField.jsx":"49bc6c794340","components/layout/Card.jsx":"e119a98f4faa","components/layout/ListCell.jsx":"826388d7ac8e","components/layout/Tabs.jsx":"06ce8e2de17a","components/selection/Checkbox.jsx":"b692ff39865f","components/selection/Radio.jsx":"5aa4ab10064c","components/selection/SegmentedControl.jsx":"27374bf8624c","components/selection/Switch.jsx":"d318bcfa8244","ui_kits/career/parts.jsx":"786cccf88ba2","ui_kits/career/screens.jsx":"42e802f852d2"},"inlinedExternals":[],"unexposedExports":[{"name":"iconUrl","sourcePath":"components/core/util.jsx"},{"name":"injectOnce","sourcePath":"components/core/util.jsx"}]} */

(() => {

const __ds_ns = (window.APFSDesignSystem_3aea88 = window.APFSDesignSystem_3aea88 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Icon — renders an APFS SVG glyph, recolourable via `color` (uses the SVG
 * as a CSS mask so any single-colour icon inherits the given colour).
 *
 * Provide either `src` (an exact path to the .svg) or `name` + `base`.
 * Default base assumes assets live at `assets/icons/` relative to the page;
 * pass `base` to point at the right relative location from your HTML.
 */
function Icon({
  name,
  src,
  base = "assets/icons/",
  size = 24,
  color = "currentColor",
  className = "",
  style = {},
  ...rest
}) {
  const url = src || `${base}${name}.svg`;
  return /*#__PURE__*/React.createElement("i", _extends({
    className: `apfs-icon ${className}`,
    style: {
      width: size,
      height: size,
      color,
      WebkitMask: `url("${url}") center / contain no-repeat`,
      mask: `url("${url}") center / contain no-repeat`,
      backgroundColor: "currentColor",
      display: "inline-block",
      flex: "none",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/util.jsx
try { (() => {
/** Inject a stylesheet once per page (keyed by id). Lets bundled components
 *  use real :hover / :active / :focus-visible without external CSS files. */
function injectOnce(id, css) {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

/** Resolve an icon asset path from a base + name (mirrors <Icon>). */
function iconUrl(name, base = "assets/icons/") {
  return `${base}${name}.svg`;
}
Object.assign(__ds_scope, { injectOnce, iconUrl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/util.jsx", error: String((e && e.message) || e) }); }

// components/action/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-btn{
  --_h:40px; --_px:16px; --_fs:14px; --_radius:var(--radius-md); --_gap:6px;
  display:inline-flex; align-items:center; justify-content:center; gap:var(--_gap);
  height:var(--_h); padding:0 var(--_px); border-radius:var(--_radius);
  font-family:var(--font-sans); font-size:var(--_fs); font-weight:var(--weight-semibold);
  letter-spacing:-0.01em; line-height:1; border:1px solid transparent; cursor:pointer;
  white-space:nowrap; user-select:none; transition:background var(--duration-fast) var(--ease-standard),
  border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard),
  transform var(--duration-fast) var(--ease-standard); box-sizing:border-box; text-decoration:none;
}
.apfs-btn:focus-visible{ outline:none; box-shadow:var(--focus-ring); }
.apfs-btn:active{ transform:scale(0.97); }
.apfs-btn[disabled]{ cursor:not-allowed; transform:none; }
.apfs-btn--sm{ --_h:32px; --_px:12px; --_fs:13px; --_radius:var(--radius-sm); }
.apfs-btn--lg{ --_h:52px; --_px:22px; --_fs:16px; --_radius:var(--radius-md); }
.apfs-btn--full{ width:100%; }
.apfs-btn--iconOnly{ padding:0; width:var(--_h); }

.apfs-btn--primary{ background:var(--primary); color:var(--on-primary); }
.apfs-btn--primary:hover:not([disabled]){ background:var(--primary-hover); }
.apfs-btn--primary[disabled]{ background:var(--fill-strong); color:var(--label-disable); }

.apfs-btn--secondary{ background:var(--brand-inverse); color:var(--on-brand-inverse); }
.apfs-btn--secondary:hover:not([disabled]){ background:var(--brand-inverse-hover); }
.apfs-btn--secondary[disabled]{ background:var(--fill-strong); color:var(--label-disable); }

.apfs-btn--assistive{ background:var(--fill-normal); color:var(--label-normal); }
.apfs-btn--assistive:hover:not([disabled]){ background:var(--fill-strong); }
.apfs-btn--assistive[disabled]{ background:var(--fill-alternative); color:var(--label-disable); }

.apfs-btn--outline{ background:var(--background-normal); color:var(--label-normal); border-color:var(--line-normal); }
.apfs-btn--outline:hover:not([disabled]){ background:var(--fill-normal); border-color:var(--line-strong); }
.apfs-btn--outline[disabled]{ color:var(--label-disable); border-color:var(--line-alternative); }

.apfs-btn__spin{ width:1.15em; height:1.15em; border-radius:50%;
  border:2px solid currentColor; border-top-color:transparent; animation:apfs-spin 0.7s linear infinite; }
@keyframes apfs-spin{ to{ transform:rotate(360deg); } }
`;

/**
 * Button — primary action control. Variants: primary (brand blue), secondary
 * (brand dark), assistive (subtle fill), outline. Supports sizes, leading/
 * trailing icons, icon-only, full-width, loading and disabled states.
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  iconOnly = false,
  fullWidth = false,
  loading = false,
  disabled = false,
  iconBase = "assets/icons/",
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-btn-css", CSS);
  const iconSize = size === "sm" ? 16 : size === "lg" ? 22 : 20;
  const cls = ["apfs-btn", `apfs-btn--${variant}`, size !== "md" && `apfs-btn--${size}`, fullWidth && "apfs-btn--full", iconOnly && "apfs-btn--iconOnly", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls,
    disabled: disabled || loading
  }, rest), loading ? /*#__PURE__*/React.createElement("span", {
    className: "apfs-btn__spin",
    "aria-label": "loading"
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, leadingIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: leadingIcon,
    base: iconBase,
    size: iconSize
  }), !iconOnly && children, iconOnly && !leadingIcon && children, trailingIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: trailingIcon,
    base: iconBase,
    size: iconSize
  })));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/action/Button.jsx", error: String((e && e.message) || e) }); }

// components/action/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-iconbtn{
  --_s:40px; --_radius:var(--radius-md);
  display:inline-flex; align-items:center; justify-content:center;
  width:var(--_s); height:var(--_s); border-radius:var(--_radius);
  border:1px solid transparent; cursor:pointer; background:transparent; color:var(--label-normal);
  transition:background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard),
  border-color var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard);
}
.apfs-iconbtn:focus-visible{ outline:none; box-shadow:var(--focus-ring); }
.apfs-iconbtn:active{ transform:scale(0.93); }
.apfs-iconbtn[disabled]{ cursor:not-allowed; color:var(--label-disable); transform:none; }
.apfs-iconbtn--sm{ --_s:32px; --_radius:var(--radius-sm); }
.apfs-iconbtn--lg{ --_s:48px; }
.apfs-iconbtn--round{ --_radius:var(--radius-full); }

.apfs-iconbtn--ghost:hover:not([disabled]){ background:var(--fill-normal); }
.apfs-iconbtn--fill{ background:var(--fill-normal); }
.apfs-iconbtn--fill:hover:not([disabled]){ background:var(--fill-strong); }
.apfs-iconbtn--outline{ border-color:var(--line-normal); }
.apfs-iconbtn--outline:hover:not([disabled]){ background:var(--fill-normal); border-color:var(--line-strong); }
.apfs-iconbtn--primary{ background:var(--primary); color:var(--on-primary); }
.apfs-iconbtn--primary:hover:not([disabled]){ background:var(--primary-hover); }
`;

/**
 * IconButton — a square (or round) button carrying a single icon.
 * Variants: ghost, fill, outline, primary.
 */
function IconButton({
  icon,
  variant = "ghost",
  size = "md",
  round = false,
  disabled = false,
  iconBase = "assets/icons/",
  "aria-label": ariaLabel,
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-iconbtn-css", CSS);
  const iconSize = size === "sm" ? 18 : size === "lg" ? 24 : 22;
  const cls = ["apfs-iconbtn", `apfs-iconbtn--${variant}`, size !== "md" && `apfs-iconbtn--${size}`, round && "apfs-iconbtn--round", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls,
    disabled: disabled,
    "aria-label": ariaLabel
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    base: iconBase,
    size: iconSize
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/action/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/action/TextButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-textbtn{
  display:inline-flex; align-items:center; gap:2px; background:none; border:none; padding:0;
  font-family:var(--font-sans); font-weight:var(--weight-semibold); font-size:14px; line-height:20px;
  cursor:pointer; color:var(--label-alternative); transition:color var(--duration-fast) var(--ease-standard);
}
.apfs-textbtn:focus-visible{ outline:none; text-decoration:underline; text-underline-offset:3px; }
.apfs-textbtn--sm{ font-size:13px; }
.apfs-textbtn--lg{ font-size:16px; }
.apfs-textbtn--primary{ color:var(--primary); }
.apfs-textbtn--primary:hover{ color:var(--primary-hover); }
.apfs-textbtn--neutral{ color:var(--label-normal); }
.apfs-textbtn--neutral:hover{ color:var(--label-alternative); }
.apfs-textbtn--assistive:hover{ color:var(--label-normal); }
.apfs-textbtn[disabled]{ color:var(--label-disable); cursor:not-allowed; }
.apfs-textbtn--underline{ text-decoration:underline; text-underline-offset:3px; }
`;

/**
 * TextButton — a label-only, link-style button. Tones: primary (blue),
 * neutral (strong text), assistive (muted). Optional leading/trailing icon.
 */
function TextButton({
  children,
  tone = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  underline = false,
  disabled = false,
  iconBase = "assets/icons/",
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-textbtn-css", CSS);
  const iconSize = size === "lg" ? 20 : 16;
  const cls = ["apfs-textbtn", `apfs-textbtn--${tone}`, size !== "md" && `apfs-textbtn--${size}`, underline && "apfs-textbtn--underline", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls,
    disabled: disabled
  }, rest), leadingIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: leadingIcon,
    base: iconBase,
    size: iconSize
  }), children, trailingIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: trailingIcon,
    base: iconBase,
    size: iconSize
  }));
}
Object.assign(__ds_scope, { TextButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/action/TextButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-logo{ display:inline-flex; align-items:baseline; gap:10px; font-family:var(--font-sans);
  line-height:1; user-select:none; }
.apfs-logo__mark{ font-weight:var(--weight-bold); letter-spacing:-0.02em; font-style:normal;
  background:var(--apfs-gradient); -webkit-background-clip:text; background-clip:text; color:transparent; }
.apfs-logo__name{ font-weight:var(--weight-bold); letter-spacing:-0.03em; color:var(--label-normal); }
.apfs-logo--mono .apfs-logo__mark{ background:none; -webkit-background-clip:initial; background-clip:initial;
  color:var(--label-normal); }
.apfs-logo--white .apfs-logo__mark{ background:none; -webkit-background-clip:initial; background-clip:initial; color:#fff; }
.apfs-logo--white .apfs-logo__name{ color:#fff; }
`;

/**
 * Logo — the APFS brand lockup. "APFS" wordmark in the blue→cyan brand
 * gradient, with an optional Korean institution name. Variants: brand
 * (gradient, default), mono (single colour), white (on dark).
 */
function Logo({
  size = 28,
  showName = false,
  name = "농업정책보험금융원",
  variant = "brand",
  className = "",
  style = {},
  ...rest
}) {
  __ds_scope.injectOnce("apfs-logo-css", CSS);
  const cls = ["apfs-logo", variant !== "brand" && `apfs-logo--${variant}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls,
    style: {
      fontSize: size,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "apfs-logo__mark"
  }, "APFS"), showName && /*#__PURE__*/React.createElement("span", {
    className: "apfs-logo__name",
    style: {
      fontSize: size * 0.82
    }
  }, name));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Logo.jsx", error: String((e && e.message) || e) }); }

// components/display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-avatar{ position:relative; display:inline-flex; align-items:center; justify-content:center;
  background:var(--fill-strong); color:var(--label-alternative); font-family:var(--font-sans);
  font-weight:var(--weight-semibold); overflow:hidden; flex:none; border-radius:var(--radius-full); }
.apfs-avatar img{ width:100%; height:100%; object-fit:cover; display:block; }
.apfs-avatar--square{ border-radius:var(--radius-md); }
.apfs-avatar__verify{ position:absolute; right:-1px; bottom:-1px; width:38%; height:38%;
  background:var(--primary); border-radius:50%; box-shadow:0 0 0 2px var(--background-normal);
  display:flex; align-items:center; justify-content:center; }
.apfs-avatar__verify svg{ width:62%; height:62%; color:#fff; }
`;
const SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  "2xl": 96
};
function initials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "";
  // Korean names: first 2 chars; Latin: first letters of first/last
  if (/[\u3131-\uD79D]/.test(name)) return name.slice(0, 2);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

/**
 * Avatar — circular (or rounded-square) user/company image with initials
 * fallback and an optional verified badge.
 */
function Avatar({
  src,
  name = "",
  size = "md",
  shape = "circle",
  verified = false,
  alt,
  className = "",
  style = {},
  ...rest
}) {
  __ds_scope.injectOnce("apfs-avatar-css", CSS);
  const px = SIZES[size] || size;
  const cls = ["apfs-avatar", shape === "square" && "apfs-avatar--square", className].filter(Boolean).join(" ");
  const fontSize = (typeof px === "number" ? px : 40) * 0.4;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls,
    style: {
      width: px,
      height: px,
      fontSize,
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt ?? name
  }) : /*#__PURE__*/React.createElement("span", null, initials(name)), verified && /*#__PURE__*/React.createElement("span", {
    className: "apfs-avatar__verify"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12.5l4.5 4.5L19 7"
  }))));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-badge{ display:inline-flex; align-items:center; justify-content:center; font-family:var(--font-sans);
  font-weight:var(--weight-bold); line-height:1; box-sizing:border-box; }
.apfs-badge--dot{ width:8px; height:8px; border-radius:50%; background:var(--status-negative); }
.apfs-badge--count{ min-width:18px; height:18px; padding:0 5px; border-radius:var(--radius-full);
  background:var(--status-negative); color:#fff; font-size:11px; }
.apfs-badge--new{ height:18px; padding:0 6px; border-radius:var(--radius-full); background:var(--status-negative);
  color:#fff; font-size:11px; letter-spacing:0.02em; }
.apfs-badge--ring{ box-shadow:0 0 0 2px var(--background-normal); }
`;

/**
 * Badge — a notification dot, numeric count, or "N"/"NEW" marker. Typically
 * overlaid on icons or avatars (position it with a wrapping relative span).
 */
function Badge({
  kind = "dot",
  count,
  max = 99,
  label,
  ring = false,
  className = "",
  style = {},
  ...rest
}) {
  __ds_scope.injectOnce("apfs-badge-css", CSS);
  if (kind === "dot") {
    return /*#__PURE__*/React.createElement("span", _extends({
      className: ["apfs-badge", "apfs-badge--dot", ring && "apfs-badge--ring", className].filter(Boolean).join(" "),
      style: style
    }, rest));
  }
  if (kind === "new") {
    return /*#__PURE__*/React.createElement("span", _extends({
      className: ["apfs-badge", "apfs-badge--new", ring && "apfs-badge--ring", className].filter(Boolean).join(" "),
      style: style
    }, rest), label ?? "NEW");
  }
  const shown = typeof count === "number" && count > max ? `${max}+` : count;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["apfs-badge", "apfs-badge--count", ring && "apfs-badge--ring", className].filter(Boolean).join(" "),
    style: style
  }, rest), shown);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-chip{ display:inline-flex; align-items:center; gap:4px; height:36px; padding:0 14px;
  border-radius:var(--radius-full); border:1px solid var(--line-normal); background:var(--background-normal);
  font-family:var(--font-sans); font-size:14px; font-weight:var(--weight-medium); color:var(--label-normal);
  cursor:pointer; white-space:nowrap; user-select:none;
  transition:background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard),
  color var(--duration-fast) var(--ease-standard); }
.apfs-chip:hover{ background:var(--fill-normal); }
.apfs-chip--sm{ height:30px; padding:0 12px; font-size:13px; }
.apfs-chip--lg{ height:40px; padding:0 16px; font-size:15px; }
.apfs-chip--selected{ background:var(--label-normal); border-color:var(--label-normal); color:var(--background-normal); }
.apfs-chip--selected:hover{ background:var(--label-normal); }
.apfs-chip--primary.apfs-chip--selected{ background:var(--primary); border-color:var(--primary); color:#fff; }
.apfs-chip__close{ display:inline-flex; margin-right:-4px; opacity:0.7; }
.apfs-chip__close:hover{ opacity:1; }
.apfs-chip[disabled]{ opacity:0.4; cursor:not-allowed; }
`;

/**
 * Chip — a selectable / removable pill used for filters and multi-select.
 * Toggles `selected`; supports a leading icon and a trailing close button.
 */
function Chip({
  children,
  selected = false,
  onClick,
  onRemove,
  leadingIcon,
  size = "md",
  tone = "neutral",
  disabled = false,
  iconBase = "assets/icons/",
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-chip-css", CSS);
  const cls = ["apfs-chip", size !== "md" && `apfs-chip--${size}`, tone === "primary" && "apfs-chip--primary", selected && "apfs-chip--selected", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls,
    "aria-pressed": selected,
    onClick: onClick,
    disabled: disabled
  }, rest), leadingIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: leadingIcon,
    base: iconBase,
    size: 16
  }), children, onRemove && /*#__PURE__*/React.createElement("span", {
    className: "apfs-chip__close",
    onClick: e => {
      e.stopPropagation();
      onRemove(e);
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    base: iconBase,
    size: 16
  })));
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Chip.jsx", error: String((e && e.message) || e) }); }

// components/display/Divider.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-divider{ border:none; background:var(--line-neutral); }
.apfs-divider--h{ width:100%; height:1px; margin:0; }
.apfs-divider--v{ width:1px; align-self:stretch; min-height:1em; }
.apfs-divider--thick.apfs-divider--h{ height:8px; background:var(--background-alternative); }
.apfs-divider--label{ display:flex; align-items:center; gap:12px; color:var(--label-alternative);
  font-family:var(--font-sans); font-size:13px; }
.apfs-divider--label::before, .apfs-divider--label::after{ content:""; flex:1; height:1px; background:var(--line-neutral); }
`;

/**
 * Divider — a hairline rule. Horizontal by default; `orientation="vertical"`
 * for inline separators, `thick` for an 8px section break, or pass children
 * to render a centred label between two rules.
 */
function Divider({
  orientation = "horizontal",
  thick = false,
  children,
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-divider-css", CSS);
  if (children) {
    return /*#__PURE__*/React.createElement("div", _extends({
      className: ["apfs-divider--label", className].filter(Boolean).join(" ")
    }, rest), children);
  }
  const cls = ["apfs-divider", orientation === "vertical" ? "apfs-divider--v" : "apfs-divider--h", thick && "apfs-divider--thick", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("hr", _extends({
    className: cls
  }, rest));
}
Object.assign(__ds_scope, { Divider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Divider.jsx", error: String((e && e.message) || e) }); }

// components/display/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-tag{ display:inline-flex; align-items:center; gap:4px; height:24px; padding:0 8px;
  border-radius:var(--radius-sm); font-family:var(--font-sans); font-size:13px; font-weight:var(--weight-semibold);
  line-height:1; white-space:nowrap; }
.apfs-tag--lg{ height:28px; padding:0 10px; font-size:14px; }
.apfs-tag--sm{ height:20px; padding:0 6px; font-size:12px; border-radius:var(--radius-xs); }
.apfs-tag--solid{ color:#fff; }
.apfs-tag--outline{ background:transparent; border:1px solid currentColor; }
`;
const TONES = {
  neutral: ["var(--label-neutral)", "var(--fill-strong)"],
  blue: ["var(--accent-blue)", "var(--accent-blue-bg)"],
  green: ["var(--accent-green)", "var(--accent-green-bg)"],
  red: ["var(--accent-red)", "var(--accent-red-bg)"],
  orange: ["var(--accent-orange)", "var(--accent-orange-bg)"],
  violet: ["var(--accent-violet)", "var(--accent-violet-bg)"],
  purple: ["var(--accent-purple)", "var(--accent-purple-bg)"],
  pink: ["var(--accent-pink)", "var(--accent-pink-bg)"],
  cyan: ["var(--accent-cyan)", "var(--accent-cyan-bg)"],
  lime: ["var(--accent-lime)", "var(--accent-lime-bg)"]
};

/**
 * Tag — a small coloured label for categories, statuses and metadata.
 * `tone` selects an accent pair; `variant` is tint (default), solid or outline.
 */
function Tag({
  children,
  tone = "neutral",
  variant = "tint",
  size = "md",
  className = "",
  style = {},
  ...rest
}) {
  __ds_scope.injectOnce("apfs-tag-css", CSS);
  const [fg, bg] = TONES[tone] || TONES.neutral;
  const cls = ["apfs-tag", size !== "md" && `apfs-tag--${size}`, variant !== "tint" && `apfs-tag--${variant}`, className].filter(Boolean).join(" ");
  const s = variant === "solid" ? {
    background: fg,
    ...style
  } : variant === "outline" ? {
    color: fg,
    ...style
  } : {
    color: fg,
    background: bg,
    ...style
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls,
    style: s
  }, rest), children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Callout.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-callout{ display:flex; gap:10px; padding:14px 16px; border-radius:var(--radius-md);
  font-family:var(--font-sans); font-size:14px; line-height:20px; color:var(--label-normal); }
.apfs-callout__icon{ flex:none; margin-top:1px; }
.apfs-callout__body{ flex:1; min-width:0; }
.apfs-callout__title{ font-weight:var(--weight-semibold); margin-bottom:2px; }
.apfs-callout__text{ color:var(--label-alternative); }
.apfs-callout--info{ background:var(--status-informative-bg); }
.apfs-callout--info .apfs-callout__icon{ color:var(--status-informative); }
.apfs-callout--success{ background:var(--status-positive-bg); }
.apfs-callout--success .apfs-callout__icon{ color:var(--status-positive); }
.apfs-callout--warning{ background:var(--status-cautionary-bg); }
.apfs-callout--warning .apfs-callout__icon{ color:var(--status-cautionary); }
.apfs-callout--error{ background:var(--status-negative-bg); }
.apfs-callout--error .apfs-callout__icon{ color:var(--status-negative); }
`;
const ICONS = {
  info: "circle-info",
  success: "circle-check",
  warning: "warning",
  error: "warning"
};

/**
 * Callout — an inline banner conveying status. Tones: info, success, warning,
 * error. Optional title; body content as children.
 */
function Callout({
  tone = "info",
  title,
  children,
  icon,
  iconBase = "assets/icons/",
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-callout-css", CSS);
  const cls = ["apfs-callout", `apfs-callout--${tone}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "apfs-callout__icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon || ICONS[tone],
    base: iconBase,
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    className: "apfs-callout__body"
  }, title && /*#__PURE__*/React.createElement("div", {
    className: "apfs-callout__title"
  }, title), children && /*#__PURE__*/React.createElement("div", {
    className: "apfs-callout__text"
  }, children)));
}
Object.assign(__ds_scope, { Callout });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Callout.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-dialog__scrim{ position:fixed; inset:0; background:var(--overlay-dim); z-index:1000;
  display:flex; align-items:center; justify-content:center; padding:20px;
  animation:apfs-fade var(--duration-normal) var(--ease-standard); }
.apfs-dialog{ background:var(--surface-elevated); border-radius:var(--radius-2xl); width:100%; max-width:420px;
  box-shadow:var(--shadow-4); overflow:hidden; animation:apfs-pop var(--duration-normal) var(--ease-emphasized);
  font-family:var(--font-sans); }
.apfs-dialog__head{ padding:28px 28px 0; }
.apfs-dialog__title{ font-size:20px; font-weight:var(--weight-bold); color:var(--label-normal);
  letter-spacing:-0.01em; }
.apfs-dialog__desc{ margin-top:8px; font-size:15px; line-height:22px; color:var(--label-alternative); }
.apfs-dialog__body{ padding:16px 28px 0; }
.apfs-dialog__foot{ display:flex; gap:8px; padding:24px 28px 28px; }
.apfs-dialog__foot > *{ flex:1; }
@keyframes apfs-fade{ from{ opacity:0; } }
@keyframes apfs-pop{ from{ opacity:0; transform:translateY(8px) scale(0.97); } }
`;

/**
 * Dialog — a centred modal with scrim. Provide `title`, optional `description`,
 * body `children`, and a `footer` (typically two Buttons). Renders only when
 * `open` is true; clicking the scrim calls `onClose`.
 */
function Dialog({
  open = true,
  title,
  description,
  children,
  footer,
  onClose,
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-dialog-css", CSS);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "apfs-dialog__scrim",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", _extends({
    className: ["apfs-dialog", className].filter(Boolean).join(" "),
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation()
  }, rest), (title || description) && /*#__PURE__*/React.createElement("div", {
    className: "apfs-dialog__head"
  }, title && /*#__PURE__*/React.createElement("div", {
    className: "apfs-dialog__title"
  }, title), description && /*#__PURE__*/React.createElement("div", {
    className: "apfs-dialog__desc"
  }, description)), children && /*#__PURE__*/React.createElement("div", {
    className: "apfs-dialog__body"
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "apfs-dialog__foot"
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-toast{ display:inline-flex; align-items:center; gap:10px; max-width:420px;
  padding:14px 16px; border-radius:var(--radius-md); background:rgba(30,30,32,0.94);
  color:#fff; font-family:var(--font-sans); font-size:14px; line-height:20px; box-shadow:var(--shadow-3);
  backdrop-filter:blur(4px); }
.apfs-toast__icon{ flex:none; }
.apfs-toast__msg{ flex:1; min-width:0; }
.apfs-toast__action{ flex:none; background:none; border:none; cursor:pointer; padding:0 2px;
  color:var(--blue-70); font-family:var(--font-sans); font-size:14px; font-weight:var(--weight-semibold); }
.apfs-toast--success .apfs-toast__icon{ color:var(--green-60, #1ed45a); }
.apfs-toast--error .apfs-toast__icon{ color:var(--red-60, #ff6363); }
`;

/**
 * Toast — a transient dark snackbar. Render it inside a fixed-position
 * container; provide `message`, optional status `tone`, and an action.
 */
function Toast({
  message,
  tone = "neutral",
  icon,
  actionLabel,
  onAction,
  iconBase = "assets/icons/",
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-toast-css", CSS);
  const showIcon = icon || (tone === "success" ? "circle-check" : tone === "error" ? "warning" : null);
  const cls = ["apfs-toast", tone !== "neutral" && `apfs-toast--${tone}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls,
    role: "status"
  }, rest), showIcon && /*#__PURE__*/React.createElement("span", {
    className: "apfs-toast__icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: showIcon,
    base: iconBase,
    size: 20
  })), /*#__PURE__*/React.createElement("span", {
    className: "apfs-toast__msg"
  }, message), actionLabel && /*#__PURE__*/React.createElement("button", {
    className: "apfs-toast__action",
    onClick: onAction
  }, actionLabel));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-tooltip{ position:relative; display:inline-flex; }
.apfs-tooltip__bubble{ position:absolute; z-index:50; background:rgba(30,30,32,0.95); color:#fff;
  font-family:var(--font-sans); font-size:13px; line-height:18px; font-weight:var(--weight-medium);
  padding:7px 10px; border-radius:var(--radius-sm); white-space:nowrap; pointer-events:none;
  opacity:0; transform:translateY(2px); transition:opacity var(--duration-fast) var(--ease-standard),
  transform var(--duration-fast) var(--ease-standard); box-shadow:var(--shadow-2); }
.apfs-tooltip:hover .apfs-tooltip__bubble, .apfs-tooltip:focus-within .apfs-tooltip__bubble{ opacity:1; transform:translateY(0); }
.apfs-tooltip__bubble::after{ content:""; position:absolute; width:7px; height:7px; background:inherit; transform:rotate(45deg); }
.apfs-tooltip--top .apfs-tooltip__bubble{ bottom:calc(100% + 8px); left:50%; translate:-50% 0; }
.apfs-tooltip--top .apfs-tooltip__bubble::after{ bottom:-3px; left:50%; margin-left:-3px; }
.apfs-tooltip--bottom .apfs-tooltip__bubble{ top:calc(100% + 8px); left:50%; translate:-50% 0; }
.apfs-tooltip--bottom .apfs-tooltip__bubble::after{ top:-3px; left:50%; margin-left:-3px; }
.apfs-tooltip--right .apfs-tooltip__bubble{ left:calc(100% + 8px); top:50%; translate:0 -50%; }
.apfs-tooltip--right .apfs-tooltip__bubble::after{ left:-3px; top:50%; margin-top:-3px; }
.apfs-tooltip--left .apfs-tooltip__bubble{ right:calc(100% + 8px); top:50%; translate:0 -50%; }
.apfs-tooltip--left .apfs-tooltip__bubble::after{ right:-3px; top:50%; margin-top:-3px; }
`;

/**
 * Tooltip — wraps a trigger and shows `content` on hover/focus.
 * `placement` is top (default), bottom, left or right.
 */
function Tooltip({
  content,
  placement = "top",
  children,
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-tooltip-css", CSS);
  const cls = ["apfs-tooltip", `apfs-tooltip--${placement}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls
  }, rest), children, /*#__PURE__*/React.createElement("span", {
    className: "apfs-tooltip__bubble",
    role: "tooltip"
  }, content));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/input/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-select{ display:flex; flex-direction:column; gap:6px; font-family:var(--font-sans); width:100%; }
.apfs-select__label{ font-size:14px; font-weight:var(--weight-semibold); color:var(--label-normal); }
.apfs-select__box{ position:relative; display:flex; align-items:center; }
.apfs-select__box select{ appearance:none; width:100%; height:48px; padding:0 44px 0 16px;
  background:var(--background-normal); border:1.5px solid var(--line-normal); border-radius:var(--radius-md);
  font-family:var(--font-sans); font-size:16px; color:var(--label-normal); cursor:pointer; outline:none;
  transition:border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
.apfs-select__box select:hover{ border-color:var(--line-strong); }
.apfs-select__box select:focus-visible{ border-color:var(--primary); box-shadow:var(--focus-ring); }
.apfs-select--placeholder .apfs-select__box select{ color:var(--label-assistive); }
.apfs-select__chevron{ position:absolute; right:16px; pointer-events:none; color:var(--label-alternative);
  width:18px; height:18px; }
.apfs-select--sm .apfs-select__box select{ height:40px; font-size:15px; padding:0 40px 0 12px; }
.apfs-select--disabled .apfs-select__box select{ background:var(--fill-normal); color:var(--label-disable);
  border-color:var(--line-alternative); cursor:not-allowed; }
`;

/**
 * Select — labelled dropdown built on a styled native <select>.
 * `options` is an array of {label, value}; pass `placeholder` for an empty
 * leading option.
 */
function Select({
  label,
  options = [],
  value,
  defaultValue,
  onChange,
  placeholder,
  disabled = false,
  size = "md",
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-select-css", CSS);
  const isEmpty = (value ?? defaultValue ?? (placeholder ? "" : undefined)) === "";
  const cls = ["apfs-select", size === "sm" && "apfs-select--sm", disabled && "apfs-select--disabled", placeholder && isEmpty && "apfs-select--placeholder", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("label", {
    className: cls
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "apfs-select__label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "apfs-select__box"
  }, /*#__PURE__*/React.createElement("select", _extends({
    value: value,
    defaultValue: defaultValue ?? (placeholder ? "" : undefined),
    onChange: onChange,
    disabled: disabled
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), /*#__PURE__*/React.createElement("svg", {
    className: "apfs-select__chevron",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 9l6 6 6-6"
  }))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/input/Select.jsx", error: String((e && e.message) || e) }); }

// components/input/TextField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-field{ display:flex; flex-direction:column; gap:6px; font-family:var(--font-sans); width:100%; }
.apfs-field__label{ font-size:14px; font-weight:var(--weight-semibold); color:var(--label-normal); }
.apfs-field__label span{ color:var(--status-negative); margin-left:2px; }
.apfs-field__box{ display:flex; align-items:center; gap:8px; height:48px; padding:0 16px;
  background:var(--background-normal); border:1.5px solid var(--line-normal); border-radius:var(--radius-md);
  transition:border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
.apfs-field__box:hover{ border-color:var(--line-strong); }
.apfs-field__box:focus-within{ border-color:var(--primary); box-shadow:var(--focus-ring); }
.apfs-field__box input{ flex:1; min-width:0; border:none; outline:none; background:transparent;
  font-family:var(--font-sans); font-size:16px; color:var(--label-normal); }
.apfs-field__box input::placeholder{ color:var(--label-assistive); }
.apfs-field--sm .apfs-field__box{ height:40px; padding:0 12px; }
.apfs-field--sm .apfs-field__box input{ font-size:15px; }
.apfs-field__box .apfs-icon{ color:var(--label-alternative); }
.apfs-field--error .apfs-field__box{ border-color:var(--status-negative); }
.apfs-field--error .apfs-field__box:focus-within{ box-shadow:0 0 0 3px rgba(255,66,66,0.22); }
.apfs-field--disabled .apfs-field__box{ background:var(--fill-normal); border-color:var(--line-alternative); }
.apfs-field--disabled .apfs-field__box input{ color:var(--label-disable); }
.apfs-field__help{ font-size:13px; color:var(--label-alternative); }
.apfs-field--error .apfs-field__help{ color:var(--status-negative); }
`;

/**
 * TextField — labelled text input with optional leading/trailing icon,
 * helper text and error state.
 */
function TextField({
  label,
  required = false,
  placeholder,
  value,
  defaultValue,
  onChange,
  leadingIcon,
  trailingIcon,
  helpText,
  error = false,
  disabled = false,
  size = "md",
  type = "text",
  iconBase = "assets/icons/",
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-field-css", CSS);
  const cls = ["apfs-field", size === "sm" && "apfs-field--sm", error && "apfs-field--error", disabled && "apfs-field--disabled", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("label", {
    className: cls
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "apfs-field__label"
  }, label, required && /*#__PURE__*/React.createElement("span", null, "*")), /*#__PURE__*/React.createElement("span", {
    className: "apfs-field__box"
  }, leadingIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: leadingIcon,
    base: iconBase,
    size: 20
  }), /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    placeholder: placeholder,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    disabled: disabled
  }, rest)), trailingIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: trailingIcon,
    base: iconBase,
    size: 20
  })), helpText && /*#__PURE__*/React.createElement("span", {
    className: "apfs-field__help"
  }, helpText));
}
Object.assign(__ds_scope, { TextField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/input/TextField.jsx", error: String((e && e.message) || e) }); }

// components/layout/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-card{ background:var(--surface-elevated); border-radius:var(--radius-lg); box-sizing:border-box;
  font-family:var(--font-sans); color:var(--label-normal); overflow:hidden; }
.apfs-card--bordered{ border:1px solid var(--line-neutral); }
.apfs-card--shadow{ box-shadow:var(--shadow-2); }
.apfs-card--pad{ padding:20px; }
.apfs-card--interactive{ cursor:pointer; transition:transform var(--duration-fast) var(--ease-standard),
  box-shadow var(--duration-normal) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard); }
.apfs-card--interactive:hover{ transform:translateY(-2px); box-shadow:var(--shadow-3); }
`;

/**
 * Card — a surface container. `variant` chooses bordered (default) or shadow;
 * `padded` adds 20px padding; `interactive` adds a hover lift.
 */
function Card({
  variant = "bordered",
  padded = true,
  interactive = false,
  children,
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-card-css", CSS);
  const cls = ["apfs-card", `apfs-card--${variant}`, padded && "apfs-card--pad", interactive && "apfs-card--interactive", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Card.jsx", error: String((e && e.message) || e) }); }

// components/layout/ListCell.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-cell{ display:flex; align-items:center; gap:12px; padding:14px 4px; width:100%;
  font-family:var(--font-sans); text-align:left; background:none; border:none; box-sizing:border-box; }
.apfs-cell--button{ cursor:pointer; border-radius:var(--radius-sm);
  transition:background var(--duration-fast) var(--ease-standard); }
.apfs-cell--button:hover{ background:var(--fill-normal); }
.apfs-cell__lead{ flex:none; display:flex; align-items:center; color:var(--label-normal); }
.apfs-cell__body{ flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.apfs-cell__title{ font-size:16px; font-weight:var(--weight-medium); color:var(--label-normal);
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.apfs-cell__desc{ font-size:14px; color:var(--label-alternative); overflow:hidden;
  text-overflow:ellipsis; white-space:nowrap; }
.apfs-cell__trail{ flex:none; display:flex; align-items:center; gap:6px; color:var(--label-alternative);
  font-size:15px; }
.apfs-cell__chevron{ color:var(--label-assistive); }
`;

/**
 * ListCell — a single list row: leading content (icon/avatar), a title with
 * optional description, and trailing content (value, control or chevron).
 * Renders as a button when `onClick`/`chevron` is set.
 */
function ListCell({
  leading,
  title,
  description,
  trailing,
  chevron = false,
  onClick,
  iconBase = "assets/icons/",
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-cell-css", CSS);
  const interactive = !!onClick || chevron;
  const cls = ["apfs-cell", interactive && "apfs-cell--button", className].filter(Boolean).join(" ");
  const Tag = interactive ? "button" : "div";
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls,
    onClick: onClick
  }, rest), leading && /*#__PURE__*/React.createElement("span", {
    className: "apfs-cell__lead"
  }, leading), /*#__PURE__*/React.createElement("span", {
    className: "apfs-cell__body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "apfs-cell__title"
  }, title), description && /*#__PURE__*/React.createElement("span", {
    className: "apfs-cell__desc"
  }, description)), (trailing || chevron) && /*#__PURE__*/React.createElement("span", {
    className: "apfs-cell__trail"
  }, trailing, chevron && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    className: "apfs-cell__chevron",
    name: "chevron-right",
    base: iconBase,
    size: 20
  })));
}
Object.assign(__ds_scope, { ListCell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/ListCell.jsx", error: String((e && e.message) || e) }); }

// components/layout/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-tabs{ display:flex; gap:24px; border-bottom:1px solid var(--line-neutral); font-family:var(--font-sans); }
.apfs-tabs__tab{ position:relative; appearance:none; background:none; border:none; cursor:pointer;
  padding:12px 0; font-size:16px; font-weight:var(--weight-semibold); color:var(--label-alternative);
  line-height:24px; white-space:nowrap; transition:color var(--duration-fast) var(--ease-standard); }
.apfs-tabs__tab:hover{ color:var(--label-normal); }
.apfs-tabs__tab--active{ color:var(--label-normal); }
.apfs-tabs__tab--active::after{ content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px;
  background:var(--label-normal); border-radius:2px; }
.apfs-tabs__count{ margin-left:4px; color:var(--label-assistive); font-weight:var(--weight-medium); }
.apfs-tabs__tab--active .apfs-tabs__count{ color:var(--primary); }
.apfs-tabs--fill{ gap:0; }
.apfs-tabs--fill .apfs-tabs__tab{ flex:1; text-align:center; }
`;

/**
 * Tabs — underline tab bar. `items` is an array of {label, value, count?}.
 * Controlled via `value`/`onChange`, or uncontrolled with `defaultValue`.
 */
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  fill = false,
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-tabs-css", CSS);
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? items[0]?.value);
  const current = isControlled ? value : internal;
  const select = v => {
    if (!isControlled) setInternal(v);
    onChange && onChange(v);
  };
  const cls = ["apfs-tabs", fill && "apfs-tabs--fill", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls,
    role: "tablist"
  }, rest), items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.value,
    role: "tab",
    "aria-selected": current === it.value,
    className: `apfs-tabs__tab${current === it.value ? " apfs-tabs__tab--active" : ""}`,
    onClick: () => select(it.value)
  }, it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
    className: "apfs-tabs__count"
  }, it.count))));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/selection/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-check{ display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-family:var(--font-sans);
  font-size:15px; line-height:22px; color:var(--label-normal); user-select:none; }
.apfs-check input{ position:absolute; opacity:0; width:0; height:0; }
.apfs-check__box{ width:20px; height:20px; border-radius:6px; border:1.5px solid var(--line-strong);
  background:var(--background-normal); display:inline-flex; align-items:center; justify-content:center; flex:none;
  transition:background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard); }
.apfs-check__box svg{ width:13px; height:13px; opacity:0; transform:scale(0.6);
  transition:opacity var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard); }
.apfs-check input:checked + .apfs-check__box{ background:var(--primary); border-color:var(--primary); }
.apfs-check input:checked + .apfs-check__box svg{ opacity:1; transform:scale(1); color:#fff; }
.apfs-check input:focus-visible + .apfs-check__box{ box-shadow:var(--focus-ring); }
.apfs-check--disabled{ cursor:not-allowed; color:var(--label-disable); }
.apfs-check--disabled .apfs-check__box{ background:var(--fill-normal); border-color:var(--line-normal); }
.apfs-check--round .apfs-check__box{ border-radius:var(--radius-full); }
`;

/** Checkbox — square (or round) boolean control with label. */
function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  round = false,
  name,
  value,
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-check-css", CSS);
  const cls = ["apfs-check", disabled && "apfs-check--disabled", round && "apfs-check--round", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("label", {
    className: cls
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    checked: checked,
    defaultChecked: defaultChecked,
    onChange: onChange,
    disabled: disabled,
    name: name,
    value: value
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "apfs-check__box"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12.5l4.5 4.5L19 7"
  }))), label != null && /*#__PURE__*/React.createElement("span", {
    className: "apfs-check__label"
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/selection/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/selection/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-radio{ display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-family:var(--font-sans);
  font-size:15px; line-height:22px; color:var(--label-normal); user-select:none; }
.apfs-radio input{ position:absolute; opacity:0; width:0; height:0; }
.apfs-radio__dot{ width:20px; height:20px; border-radius:50%; border:1.5px solid var(--line-strong);
  background:var(--background-normal); display:inline-flex; align-items:center; justify-content:center; flex:none;
  transition:border-color var(--duration-fast) var(--ease-standard); }
.apfs-radio__dot::after{ content:""; width:10px; height:10px; border-radius:50%; background:var(--primary);
  transform:scale(0); transition:transform var(--duration-fast) var(--ease-standard); }
.apfs-radio input:checked + .apfs-radio__dot{ border-color:var(--primary); }
.apfs-radio input:checked + .apfs-radio__dot::after{ transform:scale(1); }
.apfs-radio input:focus-visible + .apfs-radio__dot{ box-shadow:var(--focus-ring); }
.apfs-radio--disabled{ cursor:not-allowed; color:var(--label-disable); }
.apfs-radio--disabled .apfs-radio__dot{ background:var(--fill-normal); border-color:var(--line-normal); }
`;

/** Radio — single-choice control with label. Group by shared `name`. */
function Radio({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  name,
  value,
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-radio-css", CSS);
  const cls = ["apfs-radio", disabled && "apfs-radio--disabled", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("label", {
    className: cls
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "radio",
    checked: checked,
    defaultChecked: defaultChecked,
    onChange: onChange,
    disabled: disabled,
    name: name,
    value: value
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "apfs-radio__dot"
  }), label != null && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/selection/Radio.jsx", error: String((e && e.message) || e) }); }

// components/selection/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-seg{ display:inline-flex; padding:4px; gap:2px; background:var(--fill-normal);
  border-radius:var(--radius-md); font-family:var(--font-sans); }
.apfs-seg__item{ appearance:none; border:none; background:transparent; cursor:pointer;
  padding:6px 16px; border-radius:var(--radius-sm); font-size:14px; font-weight:var(--weight-semibold);
  color:var(--label-alternative); line-height:20px; white-space:nowrap;
  transition:background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
.apfs-seg__item:hover:not(.apfs-seg__item--active){ color:var(--label-normal); }
.apfs-seg__item--active{ background:var(--background-normal); color:var(--label-normal); box-shadow:var(--shadow-1); }
.apfs-seg--sm .apfs-seg__item{ padding:4px 12px; font-size:13px; }
`;

/**
 * SegmentedControl — a compact group of mutually-exclusive options rendered
 * as a pill toggle. `options` is an array of {label, value}.
 */
function SegmentedControl({
  options = [],
  value,
  defaultValue,
  onChange,
  size = "md",
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-seg-css", CSS);
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? options[0]?.value);
  const current = isControlled ? value : internal;
  const select = v => {
    if (!isControlled) setInternal(v);
    onChange && onChange(v);
  };
  const cls = ["apfs-seg", size === "sm" && "apfs-seg--sm", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls,
    role: "tablist"
  }, rest), options.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    role: "tab",
    "aria-selected": current === o.value,
    className: `apfs-seg__item${current === o.value ? " apfs-seg__item--active" : ""}`,
    onClick: () => select(o.value)
  }, o.label)));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/selection/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/selection/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.apfs-switch{ display:inline-flex; align-items:center; gap:10px; cursor:pointer; font-family:var(--font-sans);
  font-size:15px; color:var(--label-normal); user-select:none; }
.apfs-switch input{ position:absolute; opacity:0; width:0; height:0; }
.apfs-switch__track{ width:48px; height:28px; border-radius:var(--radius-full); background:var(--fill-strong);
  padding:2px; flex:none; transition:background var(--duration-normal) var(--ease-standard); }
.apfs-switch__thumb{ width:24px; height:24px; border-radius:50%; background:#fff; box-shadow:var(--shadow-1);
  transition:transform var(--duration-normal) var(--ease-emphasized); }
.apfs-switch input:checked + .apfs-switch__track{ background:var(--primary); }
.apfs-switch input:checked + .apfs-switch__track .apfs-switch__thumb{ transform:translateX(20px); }
.apfs-switch input:focus-visible + .apfs-switch__track{ box-shadow:var(--focus-ring); }
.apfs-switch--sm .apfs-switch__track{ width:40px; height:24px; }
.apfs-switch--sm .apfs-switch__thumb{ width:20px; height:20px; }
.apfs-switch--sm input:checked + .apfs-switch__track .apfs-switch__thumb{ transform:translateX(16px); }
.apfs-switch--disabled{ cursor:not-allowed; color:var(--label-disable); }
.apfs-switch--disabled .apfs-switch__track{ background:var(--fill-normal); }
`;

/** Switch — on/off toggle. Use for instant settings, not form submission. */
function Switch({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  size = "md",
  className = "",
  ...rest
}) {
  __ds_scope.injectOnce("apfs-switch-css", CSS);
  const cls = ["apfs-switch", size === "sm" && "apfs-switch--sm", disabled && "apfs-switch--disabled", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("label", {
    className: cls
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch",
    checked: checked,
    defaultChecked: defaultChecked,
    onChange: onChange,
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "apfs-switch__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "apfs-switch__thumb"
  })), label != null && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/selection/Switch.jsx", error: String((e && e.message) || e) }); }

// ui_kits/career/parts.jsx
try { (() => {
/* APFS / Wanted career platform — shared mock data + chrome.
   Exposes helpers on window for screens.jsx + index.html. */

const IB = "../../assets/icons/";
const JOBS = [{
  id: 1,
  role: "프론트엔드 개발자",
  company: "원티드랩",
  loc: "서울 강남구",
  type: "정규직",
  tags: ["React", "TypeScript"],
  reward: "1,500,000",
  dday: "D-7",
  status: "채용중",
  color: "blue"
}, {
  id: 2,
  role: "프로덕트 디자이너",
  company: "토스",
  loc: "서울 강남구",
  type: "정규직",
  tags: ["Figma", "UX"],
  reward: "2,000,000",
  dday: "D-2",
  status: "마감임박",
  color: "orange"
}, {
  id: 3,
  role: "백엔드 엔지니어",
  company: "카카오",
  loc: "경기 성남시",
  type: "정규직",
  tags: ["Kotlin", "Spring"],
  reward: "1,800,000",
  dday: "상시",
  status: "채용중",
  color: "green"
}, {
  id: 4,
  role: "데이터 분석가",
  company: "쿠팡",
  loc: "서울 송파구",
  type: "계약직",
  tags: ["SQL", "Python"],
  reward: "1,000,000",
  dday: "D-14",
  status: "채용중",
  color: "violet"
}, {
  id: 5,
  role: "그로스 마케터",
  company: "당근",
  loc: "서울 서초구",
  type: "정규직",
  tags: ["CRM", "Growth"],
  reward: "1,200,000",
  dday: "D-5",
  status: "채용중",
  color: "blue"
}, {
  id: 6,
  role: "iOS 개발자",
  company: "네이버",
  loc: "경기 성남시",
  type: "정규직",
  tags: ["Swift", "iOS"],
  reward: "1,700,000",
  dday: "신규",
  status: "신규",
  color: "cyan"
}];
const CATEGORIES = ["전체", "개발", "디자인", "기획", "마케팅", "데이터", "영업", "HR"];
function won(n) {
  return "₩" + n;
}

/* Global navigation bar */
function GNB({
  onNav,
  active = "채용",
  onProfile
}) {
  const {
    Logo,
    Icon,
    IconButton,
    Avatar,
    Badge
  } = window.APFSDesignSystem_3aea88;
  const items = ["채용", "커리어", "소셜", "AI 면접"];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 20,
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(8px)",
      borderBottom: "1px solid var(--line-neutral)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1060,
      margin: "0 auto",
      height: 60,
      display: "flex",
      alignItems: "center",
      gap: 28,
      padding: "0 20px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onNav && onNav("home"),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    size: 24,
    showName: true
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: 22,
      flex: 1
    }
  }, items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it,
    onClick: () => onNav && onNav("home"),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      font: `${it === active ? 700 : 500} 15px var(--font-sans)`,
      color: it === active ? "var(--label-normal)" : "var(--label-alternative)"
    }
  }, it))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "search",
    variant: "ghost",
    iconBase: IB,
    "aria-label": "\uAC80\uC0C9"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    variant: "ghost",
    iconBase: IB,
    "aria-label": "\uC54C\uB9BC"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 6,
      right: 6
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    kind: "dot",
    ring: true
  }))), /*#__PURE__*/React.createElement(IconButton, {
    icon: "bookmark",
    variant: "ghost",
    iconBase: IB,
    "aria-label": "\uC800\uC7A5"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onProfile,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      marginLeft: 4
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "\uAE40\uBBFC\uC544",
    size: "sm"
  })))));
}

/* A job posting card */
function JobCard({
  job,
  saved,
  onToggleSave,
  onOpen
}) {
  const {
    Card,
    Tag,
    Avatar,
    IconButton,
    Icon
  } = window.APFSDesignSystem_3aea88;
  return /*#__PURE__*/React.createElement(Card, {
    variant: "bordered",
    interactive: true,
    onClick: () => onOpen && onOpen(job),
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 14,
      right: 14
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: saved ? "bookmark-fill" : "bookmark",
    variant: "ghost",
    size: "sm",
    iconBase: IB,
    "aria-label": "\uC800\uC7A5",
    onClick: e => {
      e.stopPropagation();
      onToggleSave && onToggleSave(job.id);
    },
    style: saved ? {
      color: "var(--primary)"
    } : {}
  })), /*#__PURE__*/React.createElement(Avatar, {
    name: job.company,
    shape: "square",
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "apfs-heading2",
    style: {
      marginBottom: 4
    }
  }, job.role), /*#__PURE__*/React.createElement("div", {
    className: "apfs-body3",
    style: {
      color: "var(--label-alternative)"
    }
  }, job.company, " \xB7 ", job.loc)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    tone: job.color
  }, job.status), /*#__PURE__*/React.createElement(Tag, {
    tone: "neutral",
    variant: "outline"
  }, job.type), job.tags.map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t,
    tone: "neutral"
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 14,
      paddingTop: 12,
      borderTop: "1px solid var(--line-alternative)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      color: "var(--primary)",
      font: "600 13px var(--font-sans)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "coins",
    base: IB,
    size: 16
  }), " \uD569\uACA9\uBCF4\uC0C1\uAE08 ", won(job.reward)), /*#__PURE__*/React.createElement("span", {
    className: "apfs-caption1",
    style: {
      color: job.dday === "마감임박" || job.dday.startsWith("D-") ? "var(--status-negative)" : "var(--label-alternative)",
      fontWeight: 600
    }
  }, job.dday)));
}
Object.assign(window, {
  APFS_JOBS: JOBS,
  APFS_CATS: CATEGORIES,
  APFS_IB: IB,
  GNB,
  JobCard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/career/parts.jsx", error: String((e && e.message) || e) }); }

// ui_kits/career/screens.jsx
try { (() => {
/* APFS / Wanted career platform — screens. Exposes Login/Home/Detail on window. */

const IB2 = "../../assets/icons/";
const BB = "../../assets/brand/";

/* ---------------- Login ---------------- */
function LoginScreen({
  onLogin
}) {
  const {
    Logo,
    Button,
    TextField,
    Divider
  } = window.APFSDesignSystem_3aea88;
  const providers = [{
    name: "Apple로 계속하기",
    src: BB + "logo-apple.svg",
    bg: "#fff"
  }, {
    name: "네이버로 계속하기",
    src: BB + "logo-naver.svg",
    bg: "#fff"
  }, {
    name: "LinkedIn으로 계속하기",
    src: BB + "logo-linkedin.svg",
    bg: "#fff"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--background-alternative)",
      padding: "48px 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 400,
      background: "var(--surface-elevated)",
      borderRadius: "var(--radius-2xl)",
      boxShadow: "var(--shadow-2)",
      padding: 36
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    size: 34
  }), /*#__PURE__*/React.createElement("div", {
    className: "apfs-title3",
    style: {
      marginTop: 18
    }
  }, "\uB2E4\uC2DC \uC624\uC2E0 \uAC78 \uD658\uC601\uD574\uC694"), /*#__PURE__*/React.createElement("div", {
    className: "apfs-body3",
    style: {
      color: "var(--label-alternative)",
      marginTop: 6
    }
  }, "APFS \uCEE4\uB9AC\uC5B4\uB85C \uB85C\uADF8\uC778\uD558\uC138\uC694")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "\uC774\uBA54\uC77C",
    placeholder: "name@apfs.or.kr",
    leadingIcon: "mail",
    iconBase: IB2
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "\uBE44\uBC00\uBC88\uD638",
    type: "password",
    placeholder: "\uBE44\uBC00\uBC88\uD638 \uC785\uB825",
    trailingIcon: "eye",
    iconBase: IB2
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    onClick: onLogin
  }, "\uB85C\uADF8\uC778")), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "20px 0"
    }
  }, /*#__PURE__*/React.createElement(Divider, null, "\uB610\uB294")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, providers.map(p => /*#__PURE__*/React.createElement("button", {
    key: p.name,
    onClick: onLogin,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      height: 48,
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--line-normal)",
      background: p.bg,
      cursor: "pointer",
      font: "600 15px var(--font-sans)",
      color: "var(--label-normal)"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: p.src,
    alt: "",
    style: {
      width: 18,
      height: 18
    }
  }), " ", p.name))), /*#__PURE__*/React.createElement("div", {
    className: "apfs-caption1",
    style: {
      textAlign: "center",
      marginTop: 24,
      color: "var(--label-alternative)"
    }
  }, "\uCC98\uC74C\uC774\uC2E0\uAC00\uC694? ", /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onLogin && onLogin();
    },
    style: {
      color: "var(--primary)",
      fontWeight: 600,
      textDecoration: "none"
    }
  }, "\uD68C\uC6D0\uAC00\uC785"))));
}

/* ---------------- Home / job feed ---------------- */
function HomeScreen({
  onNav,
  onOpenJob
}) {
  const {
    Tabs,
    Chip,
    SegmentedControl,
    TextField,
    Card,
    Avatar,
    Icon
  } = window.APFSDesignSystem_3aea88;
  const [cat, setCat] = React.useState("전체");
  const [tab, setTab] = React.useState("추천");
  const [sort, setSort] = React.useState("latest");
  const [saved, setSaved] = React.useState({
    1: true
  });
  const toggle = id => setSaved(s => ({
    ...s,
    [id]: !s[id]
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--background-normal)",
      minHeight: "100%"
    }
  }, /*#__PURE__*/React.createElement(window.GNB, {
    onNav: onNav,
    active: "\uCC44\uC6A9",
    onProfile: () => onNav("login")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--background-alternative)",
      borderBottom: "1px solid var(--line-neutral)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1060,
      margin: "0 auto",
      padding: "36px 20px 28px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "apfs-display2",
    style: {
      marginBottom: 16
    }
  }, "\uC9C0\uAE08, \uB2F9\uC2E0\uC744 \uCC3E\uB294 \uACF3"), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 520
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    placeholder: "\uC9C1\uBB34, \uD68C\uC0AC, \uC9C0\uC5ED\uC744 \uAC80\uC0C9\uD558\uC138\uC694",
    leadingIcon: "search",
    iconBase: IB2
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 16,
      flexWrap: "wrap"
    }
  }, window.APFS_CATS.map(c => /*#__PURE__*/React.createElement(Chip, {
    key: c,
    iconBase: IB2,
    tone: "primary",
    selected: cat === c,
    onClick: () => setCat(c)
  }, c))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1060,
      margin: "0 auto",
      padding: "8px 20px 48px",
      display: "grid",
      gridTemplateColumns: "1fr 280px",
      gap: 28
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      margin: "8px 0 4px"
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      label: "추천",
      value: "추천"
    }, {
      label: "전체",
      value: "전체",
      count: 1240
    }, {
      label: "최근 본",
      value: "최근"
    }]
  }), /*#__PURE__*/React.createElement(SegmentedControl, {
    size: "sm",
    value: sort,
    onChange: setSort,
    options: [{
      label: "최신순",
      value: "latest"
    }, {
      label: "보상순",
      value: "reward"
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
      marginTop: 16
    }
  }, window.APFS_JOBS.map(j => /*#__PURE__*/React.createElement(window.JobCard, {
    key: j.id,
    job: j,
    saved: !!saved[j.id],
    onToggleSave: toggle,
    onOpen: onOpenJob
  })))), /*#__PURE__*/React.createElement("aside", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      position: "sticky",
      top: 76,
      alignSelf: "start"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    variant: "bordered"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "\uAE40\uBBFC\uC544",
    size: "lg",
    verified: true
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "apfs-heading2"
  }, "\uAE40\uBBFC\uC544 \uB2D8"), /*#__PURE__*/React.createElement("div", {
    className: "apfs-caption1",
    style: {
      color: "var(--label-alternative)"
    }
  }, "\uD504\uB860\uD2B8\uC5D4\uB4DC \xB7 3\uB144\uCC28"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "apfs-caption1",
    style: {
      color: "var(--label-alternative)"
    }
  }, "\uD504\uB85C\uD544 \uC644\uC131\uB3C4"), /*#__PURE__*/React.createElement("span", {
    className: "apfs-caption1",
    style: {
      color: "var(--primary)",
      fontWeight: 700
    }
  }, "72%")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      borderRadius: 99,
      background: "var(--fill-strong)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "72%",
      height: "100%",
      background: "var(--apfs-gradient)"
    }
  })))), /*#__PURE__*/React.createElement(Card, {
    variant: "bordered",
    padded: false
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "6px 16px"
    }
  }, [["businessbag", "지원 현황", "4"], ["bookmark", "저장한 공고", "12"], ["graduation", "커리어 코칭", "NEW"]].map(([ic, t, v]) => /*#__PURE__*/React.createElement(window.APFSDesignSystem_3aea88.ListCell, {
    key: t,
    iconBase: IB2,
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: ic,
      base: IB2
    }),
    title: t,
    trailing: /*#__PURE__*/React.createElement("span", {
      style: {
        color: v === "NEW" ? "var(--status-negative)" : "var(--primary)",
        fontWeight: 700,
        fontSize: 13
      }
    }, v),
    chevron: true
  })))))));
}

/* ---------------- Job detail ---------------- */
function JobDetailScreen({
  job,
  onNav,
  onApply
}) {
  const {
    IconButton,
    Tag,
    Avatar,
    Button,
    Icon,
    Divider,
    Callout
  } = window.APFSDesignSystem_3aea88;
  const j = job || window.APFS_JOBS[0];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--background-normal)",
      minHeight: "100%"
    }
  }, /*#__PURE__*/React.createElement(window.GNB, {
    onNav: onNav,
    active: "\uCC44\uC6A9",
    onProfile: () => onNav("login")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1060,
      margin: "0 auto",
      padding: "16px 20px 48px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onNav("home"),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--label-alternative)",
      font: "600 14px var(--font-sans)",
      padding: "8px 0"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-left",
    base: IB2,
    size: 18
  }), " \uCC44\uC6A9 \uBAA9\uB85D"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 320px",
      gap: 32,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: j.company,
    shape: "square",
    size: "xl"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "apfs-title1"
  }, j.role), /*#__PURE__*/React.createElement("div", {
    className: "apfs-body2",
    style: {
      color: "var(--label-alternative)",
      marginTop: 4
    }
  }, j.company, " \xB7 ", j.loc))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 16,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    tone: j.color
  }, j.status), /*#__PURE__*/React.createElement(Tag, {
    tone: "neutral",
    variant: "outline"
  }, j.type), j.tags.map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t,
    tone: "blue"
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "24px 0"
    }
  }, /*#__PURE__*/React.createElement(Divider, null)), /*#__PURE__*/React.createElement(Callout, {
    tone: "info",
    title: "\uD569\uACA9\uBCF4\uC0C1\uAE08 \uC548\uB0B4",
    iconBase: IB2
  }, "\uC774 \uACF5\uACE0\uC5D0 \uD569\uACA9\uD558\uBA74 \uD569\uACA9\uBCF4\uC0C1\uAE08 ", won2(j.reward), "\uC774 \uC9C0\uAE09\uB429\uB2C8\uB2E4."), [["주요 업무", ["서비스 프론트엔드 개발 및 운영", "디자인 시스템 컴포넌트 구축", "성능 최적화 및 접근성 개선"]], ["자격 요건", ["React·TypeScript 실무 경험 3년 이상", "REST API 연동 및 상태관리 경험", "협업 도구(Figma, Git) 능숙"]], ["우대 사항", ["대규모 트래픽 서비스 경험", "공공·금융 도메인 이해"]]].map(([h, items]) => /*#__PURE__*/React.createElement("section", {
    key: h,
    style: {
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "apfs-heading1",
    style: {
      marginBottom: 12
    }
  }, h), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      paddingLeft: 20,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, items.map(t => /*#__PURE__*/React.createElement("li", {
    key: t,
    className: "apfs-body1",
    style: {
      color: "var(--label-neutral)"
    }
  }, t)))))), /*#__PURE__*/React.createElement("aside", {
    style: {
      position: "sticky",
      top: 76,
      alignSelf: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px solid var(--line-neutral)",
      borderRadius: "var(--radius-lg)",
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "apfs-caption1",
    style: {
      color: "var(--label-alternative)"
    }
  }, "\uB9C8\uAC10"), /*#__PURE__*/React.createElement("span", {
    className: "apfs-label",
    style: {
      color: "var(--status-negative)"
    }
  }, j.dday)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      marginTop: 14,
      color: "var(--primary)",
      font: "700 18px var(--font-sans)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "coins",
    base: IB2,
    size: 20
  }), " ", won2(j.reward)), /*#__PURE__*/React.createElement("div", {
    className: "apfs-caption1",
    style: {
      color: "var(--label-alternative)",
      marginBottom: 16
    }
  }, "\uD569\uACA9\uBCF4\uC0C1\uAE08"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    onClick: onApply
  }, "\uC9C0\uC6D0\uD558\uAE30"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    leadingIcon: "bookmark",
    iconBase: IB2,
    fullWidth: true
  }, "\uC800\uC7A5"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    leadingIcon: "share",
    iconBase: IB2,
    fullWidth: true
  }, "\uACF5\uC720")))))));
}
function won2(n) {
  return "₩" + n;
}
Object.assign(window, {
  LoginScreen,
  HomeScreen,
  JobDetailScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/career/screens.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.TextButton = __ds_scope.TextButton;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.Divider = __ds_scope.Divider;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Callout = __ds_scope.Callout;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.TextField = __ds_scope.TextField;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.ListCell = __ds_scope.ListCell;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Switch = __ds_scope.Switch;

})();
