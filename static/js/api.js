// api.js — Backend API calls for AI 법률문서 서비스

const DOC_TYPE_MAP = {
  notice:   "내용증명",
  opinion:  "소견서",
  brief:    "준비서면",
  rebuttal: "상대방 반박문",
  appeal:   "항소이유서",
  contract: "계약서",
};

window.LawAPI = {
  // 결제 권한 게이트 식별자(X-User-Id)를 모든 호출에 동봉 (Phase 1: Supabase user.id)
  _authHeaders() {
    const h = { "Content-Type": "application/json" };
    try {
      const uid = window.AuthStore && window.AuthStore.getUserId && window.AuthStore.getUserId();
      if (uid) h["X-User-Id"] = uid;
    } catch (_) {}
    return h;
  },

  // 응답이 비정상이면 status/code를 보존한 Error를 던진다 (FR-30 403 분기용)
  _makeApiError(res, data, fallback) {
    const err = new Error((data && (data.message || data.error)) || fallback);
    err.status = res.status;
    err.code = data && data.error;       // PAYMENT_REQUIRED | REVISION_LIMIT_EXCEEDED 등
    err.body = data;
    return err;
  },

  // POST /api/generate
  async generate({ docType, sender, receiver, caseInfo, timelineEvents, facts, request, evidence_list }) {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: this._authHeaders(),
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
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw this._makeApiError(res, data, "초안 생성에 실패했습니다.");
    return data.draft;
  },

  // POST /api/revise
  async revise({ draft, revisionRequest, docType }) {
    const res = await fetch("/api/revise", {
      method: "POST",
      headers: this._authHeaders(),
      body: JSON.stringify({ draft, revision_request: revisionRequest, doc_type: DOC_TYPE_MAP[docType] || docType || null }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw this._makeApiError(res, data, "수정에 실패했습니다.");
    return data.draft;
  },

  // POST /api/suggest_strategies — 초안 설득력 강화 전략 2종 제안 (FR-24)
  async suggestStrategies(draft) {
    const res = await fetch("/api/suggest_strategies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft }),
    });
    if (!res.ok) throw new Error("전략 생성 실패");
    const data = await res.json();
    return data.strategies; // [{title, description}]
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
  async downloadDocx({ text, title, docType }) {
    const res = await fetch("/api/download_docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, title, doc_type: docType || null }),
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

// ── 건별 결제 API (PRD 건별결제 v1.0 §7, FR-25~FR-30) ───────────
// 서버 라우트(payment_routes.py)와 1:1 매핑. status/code 보존 에러 throw.
window.LawAPI.payment = {
  async _post(path, body) {
    const res = await fetch(path, {
      method: "POST",
      headers: window.LawAPI._authHeaders(),
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw window.LawAPI._makeApiError(res, data, "결제 처리에 실패했습니다.");
    return data;
  },

  // POST /api/payment/prepare → { order_id, amount, order_name, doc_type, client_key }
  prepare(docType) {
    return this._post("/api/payment/prepare", { doc_type: docType });
  },

  // POST /api/payment/confirm → { success, payment_id, document_access_id, receipt_url }
  // mockForceFail: 개발용 강제 실패 (PRD §5.3) — failType 문자열 또는 true
  confirm({ paymentKey, orderId, amount, mockForceFail }) {
    const body = { payment_key: paymentKey, order_id: orderId, amount };
    if (mockForceFail) body._mock_force_fail = mockForceFail;
    return this._post("/api/payment/confirm", body);
  },

  // POST /api/payment/cancel (환불, FR-28)
  cancel(paymentId, reason) {
    return this._post("/api/payment/cancel", { payment_id: paymentId, cancel_reason: reason });
  },

  // GET /api/payment/history (FR-29) → { total, page, per_page, items: [...] }
  async history({ page, perPage, status } = {}) {
    const qs = new URLSearchParams();
    if (page) qs.set("page", page);
    if (perPage) qs.set("per_page", perPage);
    if (status) qs.set("status", status);
    const url = "/api/payment/history" + (qs.toString() ? "?" + qs.toString() : "");
    const res = await fetch(url, { headers: window.LawAPI._authHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw window.LawAPI._makeApiError(res, data, "결제 내역 조회에 실패했습니다.");
    return data;
  },

  // GET /api/payment/access-check (FR-30) → { hasAccess, accessType, isFreeTrialEligible, revisionsRemaining }
  async accessCheck(docType) {
    const res = await fetch("/api/payment/access-check?docType=" + encodeURIComponent(docType), {
      headers: window.LawAPI._authHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw window.LawAPI._makeApiError(res, data, "접근 권한 확인에 실패했습니다.");
    return data;
  },

  // GET /api/user/trial_status (PRD §8.2) → { doc_type, free_trial_used, revision_remaining }
  async trialStatus() {
    const res = await fetch("/api/user/trial_status", {
      headers: window.LawAPI._authHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw window.LawAPI._makeApiError(res, data, "무료 체험 상태 조회에 실패했습니다.");
    return data;
  },
};

// ── 나의 문서 / 진행현황 DB 연동 API (설계 PRD §3, FR-10·FR-16) ───
// 서버 라우트(server.py /api/documents*)와 1:1 매핑. status/code 보존 에러 throw.
window.LawAPI.documents = {
  // GET /api/documents → { items, total, page, per_page }
  async list(params = {}) {
    const qs = new URLSearchParams();
    if (params.page)     qs.set("page", params.page);
    if (params.perPage)  qs.set("per_page", params.perPage);
    if (params.docType)  qs.set("doc_type", params.docType);
    if (params.status)   qs.set("status", params.status);
    if (params.q)        qs.set("q", params.q);
    if (params.sort)     qs.set("sort", params.sort);
    const url = "/api/documents" + (qs.toString() ? "?" + qs.toString() : "");
    const res = await fetch(url, { headers: window.LawAPI._authHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw window.LawAPI._makeApiError(res, data, "문서 목록 조회에 실패했습니다.");
    return data;
  },

  // GET /api/documents/stats → { this_month, saved, in_progress, free_trial_remaining }
  async stats() {
    const res = await fetch("/api/documents/stats", { headers: window.LawAPI._authHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw window.LawAPI._makeApiError(res, data, "문서 통계 조회에 실패했습니다.");
    return data;
  },

  // POST /api/documents → { id, doc_type, status, current_step }
  async create(docType) {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: window.LawAPI._authHeaders(),
      body: JSON.stringify({ doc_type: docType }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw window.LawAPI._makeApiError(res, data, "문서 생성에 실패했습니다.");
    return data;
  },

  // GET /api/documents/<id> → 단건 문서 (draft_text·input_data 포함)
  async get(id) {
    const res = await fetch("/api/documents/" + encodeURIComponent(id), {
      headers: window.LawAPI._authHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw window.LawAPI._makeApiError(res, data, "문서 조회에 실패했습니다.");
    return data;
  },

  // PATCH /api/documents/<id> → 갱신된 row
  async update(id, fields) {
    const res = await fetch("/api/documents/" + encodeURIComponent(id), {
      method: "PATCH",
      headers: window.LawAPI._authHeaders(),
      body: JSON.stringify(fields || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw window.LawAPI._makeApiError(res, data, "문서 수정에 실패했습니다.");
    return data;
  },

  // DELETE /api/documents/<id> (soft-delete) → { success, id }
  async remove(id) {
    const res = await fetch("/api/documents/" + encodeURIComponent(id), {
      method: "DELETE",
      headers: window.LawAPI._authHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw window.LawAPI._makeApiError(res, data, "문서 삭제에 실패했습니다.");
    return data;
  },
};
