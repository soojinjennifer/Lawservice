---
name: project-stack
description: 내편문서 is a Flask + vanilla-JS-via-Babel prototype, NOT a compiled React app; components are window globals
metadata:
  type: project
---

내편문서 (NaePyeonMunseo) frontend is a Flask app (`server.py`) serving a single-page prototype. The "React" code in `static/js/*.js` is JSX transpiled in-browser (Babel standalone) — there is NO node/npm build, no package.json, no .tsx files.

Components are exposed as `window.XXX` globals (e.g. `window.CreateScreen`, `window.DocumentPreview`, `window.EvidenceUploader`). They reference each other through the global scope, not ES imports.

- Screens: `static/js/*_screen.js` (home, dashboard, create, mydocs, subscription, help, login, auth)
- Router/SPA: `static/js/prototype.js` (routes like `/create/1`, `/create/2`, `/create/3`)
- Styles: single `static/css/styles.css` with Fluent-2 CSS variables + brand override `--brand-rest:#2D4DAA`
- Backend API: `static/js/api.js` (`window.LawAPI`), real endpoints `/api/generate`, `/api/revise`, `/api/download_docx`, `/api/upload_evidence`

**How to apply:** When asked to "modify a component", edit the relevant `window.XXX` module in static/js. Do NOT introduce import/export syntax, JSX build tooling, or .tsx files. New shared styles go in styles.css, not inline. The CLAUDE.md folder spec (ui/document/form/payment/dashboard/layout/feedback) maps to `static/js/<folder>/`.
