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
  async generate({ docType, sender, receiver, caseInfo, timelineEvents, facts, request, evidence_list }) {
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
        evidence_list: evidence_list || [],
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

  // POST /api/upload_evidence — 증거 파일 업로드 + 명명규칙 저장 (multipart)
  async uploadEvidence({ file, docType, seq }) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", docType || "");
    formData.append("seq", String(seq || 1));

    const res = await fetch("/api/upload_evidence", {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error((data && (data.error || data.message)) || "증거 파일 업로드에 실패했습니다.");
    }
    return data;
  },

  // 증거 파일 다운로드 URL 생성
  evidenceDownloadUrl(filename) {
    if (!filename) return "";
    return "/api/download_evidence/" + encodeURIComponent(filename);
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
    // Content-Disposition 파싱: 한글명이 담긴 filename*(UTF-8) 우선, 없으면 filename= 폴백
    const cd = res.headers.get("Content-Disposition") || "";
    let filename = "";
    const star = cd.match(/filename\*=UTF-8''([^;]+)/i);
    if (star) {
      try { filename = decodeURIComponent(star[1].trim()); }
      catch { filename = star[1].trim(); }
    } else {
      const m = cd.match(/filename="?([^";]+)"?/);
      if (m) filename = m[1].trim();
    }
    a.download = filename || `법률문서_${title}.docx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  },
};
