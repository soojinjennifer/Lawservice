// api.js — Backend API calls for AI 법률문서 서비스

const DOC_TYPE_MAP = {
  notice:   "내용증명",
  opinion:  "소견서",
  brief:    "준비서면",
  appeal:   "항소이유서",
  contract: "계약서",
};

window.LawAPI = {
  // POST /api/generate
  async generate({ docType, sender, receiver, caseInfo, timelineEvents, facts, request }) {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doc_type: DOC_TYPE_MAP[docType] || docType,
        sender, receiver,
        case_info: caseInfo,
        timeline_events: timelineEvents,
        facts,
        request,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "초안 생성에 실패했습니다.");
    return data.draft;
  },

  // POST /api/revise
  async revise({ draft, revisionRequest }) {
    const res = await fetch("/api/revise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft, revision_request: revisionRequest }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "수정에 실패했습니다.");
    return data.draft;
  },

  // POST /api/download_docx — triggers browser download
  async downloadDocx({ text, title }) {
    const res = await fetch("/api/download_docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, title }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "다운로드에 실패했습니다.");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cd = res.headers.get("Content-Disposition") || "";
    const match = cd.match(/filename="?([^"]+)"?/);
    a.download = match ? match[1] : `법률문서_${title}.docx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  },
};
