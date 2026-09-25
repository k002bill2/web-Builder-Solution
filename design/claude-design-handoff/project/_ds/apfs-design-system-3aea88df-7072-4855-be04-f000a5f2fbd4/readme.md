# APFS Design System

A production design system for **APFS — 농업정책보험금융원 (Agricultural Policy Insurance & Finance Service)**, a Korean public institution that administers agricultural policy insurance and finance. The system is built on the foundations of the **Wanted (원티드)** design language — a mature, Korean-first product design system — and re-skinned with the APFS brand mark.

> **Sources.** Everything here was reconstructed from the attached Figma file **"APFS Design System.fig"** (1,296 local components, 1,007 design variables across 17 token collections, pages: Foundation, Color (Atomic + Semantic), Typography, Grid, Theme, Icon, Logo, Spacing, Component). Token values, the type scale, the icon set and the button/control specs were read directly from that file. The reader is not assumed to have access; this README captures what matters.

## What this is for

Generating well-branded interfaces and assets for APFS / Wanted-style products — recruitment & career surfaces, member dashboards, public-service web flows — either as throwaway prototypes/mocks or as production reference. Korean (한국어) is the primary content language.

---

## Content fundamentals

How APFS / Wanted product copy reads:

- **Language:** Korean-first. UI labels, buttons, and body copy are written in 한국어. English appears only for the brand mark (APFS), loan-words, and developer-facing labels.
- **Voice:** calm, plain, trustworthy — this is a public finance institution. Helpful and direct, never playful or hype-driven. Component descriptions in the source read like *"사용자가 원하는 동작을 수행할 수 있도록 돕습니다."* ("Helps users carry out the action they want.").
- **Address:** addresses the user politely and impersonally using the **-요 / -습니다** register (존댓말). Avoids "나/너" pronouns; speaks in terms of the task ("지원하기", "저장한 공고").
- **Casing:** English words use sentence case, not ALL CAPS (except the APFS wordmark and tiny status markers like "NEW", "D-2").
- **Buttons & actions:** short verb phrases — "지원하기", "더보기", "전체보기", "새 공고 등록", "취소". Avoid full sentences on controls.
- **Numbers & dates:** Korean date format "2월 13일(화)", relative time "3시간 전", countdowns "D-2", currency in 원/만원.
- **Emoji:** not used in product UI. Status is carried by icons + colour, not emoji.
- **Tone examples:** info "지원이 접수되었습니다", warning "마감이 2일 남았습니다", error "필수 항목을 입력해 주세요".

---

## Visual foundations

The aesthetic is **clean, neutral, high-contrast and quietly confident** — content-first, with the brand blue used sparingly as the single action accent.

- **Colour.** A near-neutral canvas (white `#FFFFFF` / cool grey `#F7F7F8`) carries layered grey text (label colours are *alpha over a cool-neutral base*, not solid greys — `label-alternative` ≈ `#70737C` at 61%). One brand action colour: **blue `#3366FF`**. A dark "inverse" surface `#2C2C2C` is used for secondary solid buttons, footers and snackbars. Status uses green `#00BF40`, red `#FF4242`, orange `#FF9200`. A 9-hue **accent palette** (foreground-on-tint pairs) colours category tags and chips. The **APFS brand mark** uses a blue→cyan gradient (`#1A75FF → #2AB5E8`), echoing finance (blue) + agriculture (green/cyan).
- **Type.** **Pretendard JP / Pretendard** throughout (a Korean+Latin superfamily). Four weights: Regular 400, Medium 500, SemiBold 600, Bold 700. Titles are Bold with slight negative tracking (-0.02 to -0.03em); body is Regular with generous, Korean-tuned line-height (~1.6) and a hair of positive tracking for Hangul readability. No serif, no display face.
- **Spacing.** Strict **4px grid** (2, 4, 6, 8, 12, 16, 24, 32, 48, 64…). Desktop content max-width 1060px. Comfortable but efficient density — this is an information-dense product system.
- **Backgrounds.** Flat. White or `#F7F7F8`. **No gradients on surfaces** (gradient is reserved for the brand mark only), no photographic hero washes by default, no patterns or textures. Sections are separated by hairlines or an 8px sunken divider, not boxes-in-boxes.
- **Corners.** Soft but not pill-everything: controls and inputs `12px`, cards `16px`, sheets/dialogs `28px`, chips/avatars/badges fully round.
- **Borders.** Hairline `1px` in alpha-grey (`rgba(112,115,124,0.22)`). Inputs use a slightly heavier `1.5px` that turns blue on focus.
- **Shadows.** Soft, **neutral, never coloured** — four steps from a 1px hairline lift to a 28px card float. Cards typically use a border *or* `shadow-2`, rarely both.
- **Elevation vs. capsules.** Floating UI (toasts, tooltips, menus) uses a dark translucent capsule with blur; on-surface emphasis uses tints and fills, not heavy shadows.
- **Transparency & blur.** Used for overlays (scrim `rgba(0,0,0,0.5)`), the dark snackbar/tooltip capsules (`backdrop-filter: blur`), and the alpha label/line/fill tokens. Sparingly, purposefully.
- **Animation.** Subtle and quick. Standard easing `cubic-bezier(0.4,0,0.2,1)`, durations 120–320ms. Buttons **scale to 0.97 on press**; switches/thumbs use an emphasized ease; dialogs fade+pop 8px. No bounce, no decorative looping motion.
- **Hover / press.** Hover = a subtle fill veil or one step darker (`primary → primary-hover`); press = scale-down + a touch darker. Focus = a 3px brand-blue ring (`--focus-ring`).
- **Imagery vibe.** When photography appears it's natural, bright and professional (people at work, offices) — not heavily filtered; warm-neutral. Company/academy avatars are square-rounded; people avatars are circular.

---

## Iconography

- **Source set.** A bespoke line-icon family from the Figma file (the Wanted icon set), ~400 glyphs on a 24×24 frame. Single-colour, `fill="currentColor"`, with a clear **outline (`*FillFalse`) vs. filled (`*FillFillTrue`)** pairing — outline for default, filled for active/selected (e.g. bookmark, heart, bell, home).
- **In this kit.** A curated ~55-icon subset is copied into **`assets/icons/`** as raw SVG. They are recoloured via CSS mask (see the `Icon` component / `.apfs-icon` utility) so any icon inherits the current text colour. Use 24px in most UI, 20px inline, 16–18px in dense chips/labels. Hit targets stay ≥ 44px.
- **Brand/login marks.** Full-colour provider marks (Apple, Naver, LinkedIn) live in **`assets/brand/`** for auth screens.
- **No emoji, no ad-hoc Unicode glyphs** as icons. If a needed glyph is missing, add it to `assets/icons/` from the source set rather than substituting an off-brand library.
- *Substitutions flagged:* a handful of universal geometric glyphs (chevrons, check, plus/minus, arrows, the "more" dots) were regenerated as clean 24×24 SVGs to match the line weight; the Google/Kakao colour marks were not present as standalone SVGs in the export.

---

## Index / manifest

**Root**
- `styles.css` — the single entry point consumers link (only `@import`s).
- `readme.md` — this guide. · `SKILL.md` — Agent-Skill wrapper.

**`tokens/`** — global CSS custom properties (all `@import`ed by `styles.css`)
- `fonts.css` (Pretendard via CDN + family vars) · `colors.css` (primitives + semantic, light + `[data-theme="dark"]`) · `typography.css` (scale + `.apfs-*` utility classes) · `spacing.css` · `shape.css` (radius, borders, shadows, motion) · `base.css` (reset + `.apfs-icon`).

**`components/`** — 23 React primitives (compiled to `window.APFSDesignSystem_3aea88`)
- `core/` — **Icon**, **Logo**, util
- `action/` — **Button**, **IconButton**, **TextButton**
- `selection/` — **Checkbox**, **Radio**, **Switch**, **SegmentedControl**
- `input/` — **TextField**, **Select**
- `display/` — **Tag**, **Badge**, **Chip**, **Avatar**, **Divider**
- `feedback/` — **Callout**, **Toast**, **Tooltip**, **Dialog**
- `layout/` — **Card**, **ListCell**, **Tabs**

**`guidelines/`** — foundation specimen cards (Colors, Type, Spacing, Brand) shown in the Design System tab.

**`ui_kits/`** — full-screen product recreations (see each kit's `README.md`).

**`assets/`** — `icons/` (line icon SVGs), `brand/` (provider marks).

### Using components in a card / page
```html
<link rel="stylesheet" href="path/to/styles.css" />
<script src="path/to/_ds_bundle.js"></script>
<script type="text/babel">
  const { Button, Tag, Icon } = window.APFSDesignSystem_3aea88;
  // icons resolve from assets/icons/ — pass iconBase as the relative path
</script>
```
