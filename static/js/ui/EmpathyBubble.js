// ui/EmpathyBubble.js — 홈 공감 섹션 말풍선 컴포넌트 (PRD v1.2 / 설계규칙 §EmpathyBubble)
// CSS: .empathy-section / .empathy-bubbles / .empathy-bubble (styles.css 이미 정의)
//
// ── EmpathyBubble (단일 말풍선) ──────────────────────────────
// Props:
//   side     : 'left' | 'right' — 말풍선 정렬 방향
//   children : string — 말풍선 텍스트
//
// ── EmpathySection (공감 섹션 전체) ─────────────────────────
// Props:
//   title    : string — 섹션 상단 소제목 (선택)
//   cta      : ReactNode — 섹션 하단 CTA 버튼 (선택)
//   bubbles  : [{ side, text }] — 말풍선 목록 (미제공 시 기본값)
//
// 사용 예시 (전체 섹션):
//   <EmpathySection />
//
// 사용 예시 (커스텀):
//   <EmpathySection
//     bubbles={[
//       { side: "left",  text: "억울한 일이 있는데 어디서부터 시작해야 할지 모르겠어요." },
//       { side: "right", text: "변호사 비용이 너무 비싸서 망설여져요." },
//     ]}
//   />

const DEFAULT_BUBBLES = [
  { side: "left",  text: "억울한 일이 있거나, 해결이 안 되는 일이 있으면 답답하기만 하셨죠?" },
  { side: "right", text: "무조건 변호사를 찾아가기도 겁나고, 무슨 이야기를 어떻게 해야 하는지 막막하셨죠?" },
  { side: "left",  text: "상대방이 이렇게 답했는데 이제 어떡하지? 매번 변호사 상담하기도 난감하셨죠?" },
];

window.EmpathyBubble = function EmpathyBubble({ side = "left", children }) {
  return (
    <div className={`empathy-bubble ${side}`}>
      {children}
    </div>
  );
};

window.EmpathySection = function EmpathySection({
  title   = "내편문서가 도와드릴게요",
  bubbles = DEFAULT_BUBBLES,
  cta     = null,
}) {
  return (
    <section className="empathy-section">
      <div>
        {title && (
          <div style={{
            textAlign: "center", marginBottom: 40,
            fontSize: 13, fontWeight: 700,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            {title}
          </div>
        )}

        <div className="empathy-bubbles">
          {bubbles.map((b, i) => (
            <EmpathyBubble key={i} side={b.side}>{b.text}</EmpathyBubble>
          ))}
        </div>

        {cta && (
          <div style={{ textAlign: "center", marginTop: 48 }}>
            {cta}
          </div>
        )}
      </div>
    </section>
  );
};
