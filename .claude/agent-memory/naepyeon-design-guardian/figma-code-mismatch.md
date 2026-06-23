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

**BOTTOM BUTTON ROW UNIFIED (2026-06-22):** `.create-bottom-bar` was a DEAD class — left in create_screen.js Step1 (StepInput) by the reverted AIAssistPanel experiment but had NO CSS rule (removed during revert), so Step1's `[임시 저장][초안 생성하기]` rendered unstyled (no flex/gap/align). Fixed by migrating Step1 to the same `.create-bottom-actions` + `.create-bottom-actions-right` structure Step2/3 already use (left subtle button, right primary CTA). All 3 steps now share one bottom-row pattern with bare `<button className="btn ...">` + `<Icon size=14, primary color #fff>`. `.create-bottom-actions` CSS lives at styles.css ~1464. The string `create-bottom-bar` should no longer appear in any js (only a stale CURRUNT_TASK.md changelog mention remains). Reject any reintroduction of `.create-bottom-bar`.

**DRIFT + RE-REVERT (2026-06-22):** A v2 experiment (logged in CURRUNT_TASK.md) layered `ui/AIAssistPanel.js` — a FAB button + bottom slide-up drawer + lifted chat state in CreateScreen — ON TOP of the inline 2-column golden layout, then was partially reverted. This left two BROKEN `<AIAssistPanel>` call sites in create_screen.js: StepPreview referenced undefined vars (chatMessages/sendRevision it never received → render crash) and StepEdit rendered a duplicate disabled FAB. **The Figma node 56:8418 has NO FAB and NO drawer** — chat is the inline right column (`.create-chat-col`). Both call sites were REMOVED; StepEdit heading restored "초안 미리보기" (Step2/3 share heading). `ui/AIAssistPanel.js` file left in place (registered in index.html) but is now UNUSED by any screen — do not delete blind. CreateScreen still has orphaned lifted chat state (chatMessages/sendRevision/handleRiskCheck near line 996-1067) — dead but harmless, left untouched (payment-adjacent). If asked to clean up, that block is safe to remove. **Lesson: AIAssistPanel FAB/drawer is NOT in the approved design — reject any reintroduction.**
