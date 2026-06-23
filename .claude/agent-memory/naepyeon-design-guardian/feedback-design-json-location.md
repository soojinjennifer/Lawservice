---
name: feedback-design-json-location
description: Save any design-related JSON/dump files under LawService/Design, not project root or temp
metadata:
  type: feedback
---

When saving design-related JSON files (e.g. Figma metadata dumps, design token exports), save them under `LawService/Design/` subfolder.

**Why:** User explicitly redirected a JSON write to `LawService/Design` during the CreateStep Figma work — they keep design artifacts grouped there.

**How to apply:** Any time you persist a design export, Figma dump, or token JSON, target `C:\Users\sooji\OneDrive\LawService\Design\`. Do not scatter them in repo root, /tmp, or ad-hoc folders.
