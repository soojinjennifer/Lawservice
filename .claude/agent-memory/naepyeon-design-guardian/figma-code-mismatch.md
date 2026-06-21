---
name: figma-code-mismatch
description: Figma frame named "CreateStep2" (node 56:8418) actually depicts the code's STEP 3 (edit/chat) layout
metadata:
  type: project
---

In the LawService Figma file (fileKey m4eXgFV2wYycSBY8a0itIX), the frame node **56:8418 is named "CreateStep2"** but its content is the code's **STEP 3 (수정·저장)** layout:
- DocChip "내용증명" + heading "초안 미리보기"
- StepIndicator shows STEP 2 as "현재"
- Left: full generated 내용증명 document body
- Right: AI 어시스턴트 chat panel WITH 위험문장검사 결과 cards + quick-suggestion buttons (더 강한 어조로 / 더 정중한 표현으로 / 법조항 인용 추가 / 단락 요약 / 위험문장 검사) + composer
- Below: 증거 자료 list (3 horizontal cards) + bottom button row
- LegalNoticeBox + footer

**Why:** The Figma frame appears to be a hybrid/in-progress: StepIndicator+heading say "STEP 2 미리보기" but body is the STEP-3 chat/edit composition. Internal layer names are raw-import-style (Background+Border, HorizontalBorder, Pre) — likely an HtmlToDesign raw frame, not a clean component-instance final frame.

The page list: 04. Pages = 28:108 (final frames, but get_metadata found NO "Create*" named frame there yet), 05.Archive raw imports = 53:4652.

**RESOLVED (2026-06-21):** User confirmed mapping (B) — align Figma 56:8418 design to code STEP 3 (StepEdit). Decision: chat-panel is rendered in BOTH Step2 (StepPreview) and Step3 (StepEdit). In Step2 it is shown DISABLED (`.create-chat-col.is-disabled` → pointer-events:none on chat-panel + a `.chat-disabled-overlay` "AI 수정은 다음 단계에서"). In Step3 it is active (existing /api/revise + risk-check logic untouched).

**Layout applied (both steps):** Figma golden layout now in code = top 2-column `.create-edit-layout` (left `.create-doc-col` document body | right `.create-chat-col` chat 380px, equal height) + full-width `.create-bottom-actions` button row + full-width `.create-evidence-row` (EvidenceUploader mode=preview, evidence cards in auto-fill grid). These 4 CSS classes were ADDED to styles.css (~line 1353). The old `.preview-layout`/`.preview-evidence-panel`/`.preview-document-panel` CSS rules are now UNUSED by create_screen.js (left in place, possibly still used by mypage — do not delete blind).

**How to apply:** Step2 chat = disabled-by-design, not a bug. Evidence is a full-width row BELOW the doc+chat columns, NOT a right sidebar. Only visual/layout was changed; generate/revise/download/risk-check APIs untouched.
