"""
AI 법률 문서 자동화 서비스 — Flask 백엔드

역할:
  · 브라우저는 정적인 HTML/CSS/JS 만 다룬다 (API 키 노출 X)
  · 모든 Claude API 호출과 .docx 생성은 이 서버가 담당한다

엔드포인트:
  GET  /                      → templates/index.html 렌더링
  POST /api/generate          → JSON 입력 → Claude 초안 생성 → JSON 반환
  POST /api/revise            → 초안 + 수정 요청 → Claude 수정 → JSON 반환
  POST /api/download_docx     → 편집된 텍스트 → .docx 파일 응답

실행:
    pip install flask anthropic python-docx python-dotenv
    python server.py
브라우저:
    http://localhost:5001
"""

import io
import os
import re
from datetime import date

from dotenv import load_dotenv
load_dotenv(override=True)

from flask import Flask, jsonify, render_template, request, send_file, send_from_directory
import anthropic
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

from doc_templates import DOC_TEMPLATES

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static"),
    static_url_path="/static",
)


# ── 한글(East Asian) 폰트 적용 헬퍼 ──────────────────────────
def _set_korean_font(run, font_name: str) -> None:
    run.font.name = font_name
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.insert(0, rfonts)
    rfonts.set(qn("w:ascii"), font_name)
    rfonts.set(qn("w:hAnsi"), font_name)
    rfonts.set(qn("w:eastAsia"), font_name)
    rfonts.set(qn("w:cs"), font_name)


def _format_timeline(events):
    rows = []
    for ev in events or []:
        t = (ev.get("time") or "").strip()
        c = (ev.get("content") or "").strip()
        if t or c:
            rows.append(f"  · [{t or '시점 미상'}] {c or '(내용 미입력)'}")
    return "\n".join(rows) if rows else "(미입력)"


def build_prompt(doc_type, sender, receiver, case_info,
                 timeline_events, facts, request_text):
    today = date.today().strftime("%Y년 %m월 %d일")
    timeline_block = _format_timeline(timeline_events)
    has_timeline = timeline_block != "(미입력)"
    timeline_instruction = (
        "\n6. [시간순별 사건 경위] 의 각 항목을 본문의 사실관계/사건 경위 섹션에\n"
        "   반드시 시간 순서대로 통합·서술할 것. 시각([…])을 그대로 인용하고,\n"
        "   사건내용은 격식 있는 문장으로 풀어 쓰며, '먼저', '이후', '그 다음',\n"
        "   '마지막으로' 등 접속어를 자연스럽게 사용할 것.\n"
        if has_timeline else ""
    )
    return f"""당신은 한국 법률 실무에 능통한 전문 법률 보조원입니다.
아래 [의뢰인 정보]를 바탕으로 「{doc_type}」 초안을 작성해 주세요.

반드시 아래 [문서 양식 가이드]의 구조와 정형 문구를 그대로 지키고,
실제 우체국 또는 법원에 제출 가능한 수준의 격식 있는 한국어로 작성하십시오.

[문서 양식 가이드]
{DOC_TEMPLATES[doc_type]["format_guide"]}

[의뢰인 정보]
- 작성일자(오늘): {today}
- 발신인/작성자: {sender or "(미입력)"}
- 수신인: {receiver or "(미입력)"}
- 사건 표시: {case_info or "(해당 없음)"}
- 시간순별 사건 경위 (시간 → 사건내용):
{timeline_block}
- 사건 경위 및 사실관계 (자유 서술):
{facts or "(미입력)"}
- 요구사항/주장 결론:
{request_text or "(미입력)"}

[작성 지시]
1. 양식 가이드의 모든 섹션을 빠짐없이 포함할 것.
2. 각 섹션 제목(예: 발 신 인, - 아 래 -, - 끝 -, 다 음, 증 명 방 법,
   첨 부 서 류, 항 소 취 지, 항 소 이 유 등)은 그대로 한 줄로 출력할 것.
3. 본문은 자연스러운 한국어 격식체로 작성하고, 추측 표현은 최소화할 것.
4. 마크다운 기호(#, *, -, > 등)나 코드블록을 사용하지 말 것.
5. 문서의 마지막 줄에 다음 안내 문구를 별도 단락으로 추가할 것:
   「본 문서는 법률적 참고용 초안이며, 실제 제출 전 반드시 전문가와 상담하십시오.」{timeline_instruction}
"""


CENTER_KEYWORDS = (
    "내 용 증 명", "내  용  증  명",
    "소 견 서", "소  견  서",
    "준 비 서 면", "준  비  서  면",
    "항 소 이 유 서", "항   소   이   유   서",
    "- 아  래 -", "- 아 래 -", "- 아래 -", "- 끝 -",
    "다 음", "다  음", "다        음",
    "항 소 취 지", "항   소   취   지",
    "항 소 이 유", "항   소   이   유",
    "청 구 취 지", "청   구   취   지",
    "청 구 원 인", "청   구   원   인",
    "증 명 방 법", "증   명   방   법",
    "입 증 방 법", "입   증   방   법",
    "소 명 자 료", "소  명  자  료",
    "첨 부 서 류", "첨   부   서   류",
)
RIGHT_KEYWORDS = ("(인)", "대표이사")


def make_docx(text: str, title: str) -> bytes:
    BODY_FONT = "바탕체"
    TITLE_FONT = "맑은 고딕"

    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = BODY_FONT
    style.font.size = Pt(11)
    spr = style.element.get_or_add_rPr()
    sf = spr.find(qn("w:rFonts"))
    if sf is None:
        sf = OxmlElement("w:rFonts")
        spr.insert(0, sf)
    for attr in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
        sf.set(qn(attr), BODY_FONT)

    for section in doc.sections:
        section.top_margin = Cm(2.5)
        section.bottom_margin = Cm(2.5)
        section.left_margin = Cm(2.5)
        section.right_margin = Cm(2.5)

    for raw_line in text.split("\n"):
        line = raw_line.rstrip()
        if not line.strip():
            doc.add_paragraph("")
            continue
        p = doc.add_paragraph()
        run = p.add_run(line)
        stripped = line.strip()
        is_title_line = (stripped in CENTER_KEYWORDS
                         or stripped == title
                         or stripped.endswith("귀중"))
        if stripped in CENTER_KEYWORDS or stripped == title:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run.bold = True
            if (stripped == title
                or any(t in stripped for t in
                       ("내 용 증 명", "소 견 서", "준 비 서 면", "항 소 이 유 서"))):
                run.font.size = Pt(18)
        elif any(stripped.startswith(k) or stripped.endswith(k) for k in RIGHT_KEYWORDS):
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        elif re.match(r"^\d{4}\s*[\.년]\s*\d{1,2}\s*[\.월]\s*\d{1,2}", stripped):
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        elif stripped.endswith("귀중"):
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run.bold = True
        else:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        _set_korean_font(run, TITLE_FONT if is_title_line else BODY_FONT)

    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.getvalue()


# ── 라우트 ────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template(
        "index.html",
        supabase_url=os.environ.get("SUPABASE_URL", ""),
        supabase_anon_key=os.environ.get("SUPABASE_ANON_KEY", ""),
    )


@app.route("/images/<path:filename>")
def serve_image(filename):
    img_dir = os.path.join(BASE_DIR, "images")
    return send_from_directory(img_dir, filename)


@app.route("/api/generate", methods=["POST"])
def api_generate():
    data = request.get_json(force=True)
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return jsonify({"error": "서버에 Anthropic API 키가 설정되지 않았습니다. .env 파일을 확인해 주세요."}), 500

    doc_type = data.get("doc_type")
    if doc_type not in DOC_TEMPLATES:
        return jsonify({"error": f"알 수 없는 문서 종류: {doc_type}"}), 400
    if not (data.get("facts") or "").strip():
        return jsonify({"error": "사건 경위(facts) 는 필수입니다."}), 400

    prompt = build_prompt(
        doc_type=doc_type,
        sender=data.get("sender", ""),
        receiver=data.get("receiver", ""),
        case_info=data.get("case_info", ""),
        timeline_events=data.get("timeline_events", []),
        facts=data.get("facts", ""),
        request_text=data.get("request", ""),
    )
    try:
        client = anthropic.Anthropic(api_key=api_key)
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=3500,
            messages=[{"role": "user", "content": prompt}],
        )
        return jsonify({"draft": resp.content[0].text.strip()})
    except Exception as e:
        return jsonify({"error": f"Claude 호출 실패: {e}"}), 500


@app.route("/api/revise", methods=["POST"])
def api_revise():
    data = request.get_json(force=True)
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return jsonify({"error": "서버에 Anthropic API 키가 설정되지 않았습니다. .env 파일을 확인해 주세요."}), 500

    draft = (data.get("draft") or "").strip()
    revision_request = (data.get("revision_request") or "").strip()

    if not draft:
        return jsonify({"error": "수정할 초안이 없습니다."}), 400
    if not revision_request:
        return jsonify({"error": "수정 요청 내용을 입력해주세요."}), 400

    prompt = f"""다음은 한국 법률 문서 초안입니다:

{draft}

사용자가 아래와 같이 수정을 요청했습니다:
{revision_request}

위 수정 요청을 반영하여 법률 문서 초안을 수정해주세요.
- 수정 요청에 언급된 내용만 변경하고, 나머지는 원본을 그대로 유지하세요.
- 격식 있는 한국어 법률 문서 양식을 유지하세요.
- 마크다운 기호(#, *, -, > 등)를 사용하지 마세요.
- 수정된 문서 전체를 반환해주세요."""

    try:
        client = anthropic.Anthropic(api_key=api_key)
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=3500,
            messages=[{"role": "user", "content": prompt}],
        )
        return jsonify({"draft": resp.content[0].text.strip()})
    except Exception as e:
        return jsonify({"error": f"Claude 호출 실패: {e}"}), 500


@app.route("/api/download_docx", methods=["POST"])
def api_download_docx():
    data = request.get_json(force=True)
    text = data.get("text", "")
    title = data.get("title", "법률문서")
    if not text.strip():
        return jsonify({"error": "본문이 비어 있습니다."}), 400
    blob = make_docx(text, title)
    filename = f"{title}_{date.today().strftime('%Y%m%d')}.docx"
    return send_file(
        io.BytesIO(blob),
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


@app.route("/api/upload_evidence", methods=["POST"])
def api_upload_evidence():
    """증거 파일 업로드 + AI 날짜·내용 추출 (FR-17)"""
    if "file" not in request.files:
        return jsonify({"error": "파일이 없습니다."}), 400

    f = request.files["file"]
    filename = f.filename or "unknown"

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return jsonify({"filename": filename, "extractedDate": None, "summary": "API 키 미설정"})

    try:
        import base64
        raw = f.read()
        b64 = base64.standard_b64encode(raw).decode()
        mime = f.content_type or "application/octet-stream"

        client = anthropic.Anthropic(api_key=api_key)

        if mime.startswith("image/"):
            resp = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=300,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "image", "source": {"type": "base64", "media_type": mime, "data": b64}},
                        {"type": "text", "text": (
                            "이 문서 이미지에서 가장 중요한 날짜(YYYY-MM-DD 형식)와 "
                            "핵심 내용을 한 줄로 추출해 주세요. "
                            "JSON으로만 응답: {\"date\": \"YYYY-MM-DD\", \"summary\": \"...\"}"
                        )},
                    ],
                }],
            )
        else:
            resp = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=300,
                messages=[{
                    "role": "user",
                    "content": (
                        f"파일명: {filename}\n"
                        "이 문서에서 가장 중요한 날짜(YYYY-MM-DD)와 핵심 내용 한 줄을 추출하세요. "
                        "JSON으로만 응답: {\"date\": \"YYYY-MM-DD\", \"summary\": \"...\"}"
                    ),
                }],
            )

        import json as _json
        raw_text = resp.content[0].text.strip()
        # JSON 파싱 시도
        try:
            result = _json.loads(raw_text)
        except Exception:
            result = {"date": None, "summary": raw_text[:120]}

        return jsonify({
            "filename": filename,
            "extractedDate": result.get("date"),
            "summary": result.get("summary", ""),
        })
    except Exception as e:
        return jsonify({"filename": filename, "extractedDate": None, "summary": f"추출 실패: {e}"})


@app.route("/api/analyze_opponent", methods=["POST"])
def api_analyze_opponent():
    """상대방 문서 분석 + 반박 목록 생성 (FR-19)"""
    data = request.get_json(force=True)
    doc_kind  = data.get("docKind", "문서")
    doc_text  = data.get("docText", "")   # 텍스트로 붙여넣은 경우
    my_facts  = data.get("myFacts", "")   # 내 사건 경위 (컨텍스트용)

    if not doc_text.strip():
        return jsonify({"error": "분석할 문서 내용이 없습니다."}), 400

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return jsonify({"error": "API 키 미설정"}), 500

    prompt = f"""당신은 법률 전문가입니다.
아래 상대방 {doc_kind} 내용을 분석하여 주요 주장을 추출하고, 각 주장에 대한 반박 초안을 작성해 주세요.

[상대방 문서]
{doc_text}

[내 사건 경위 (참고)]
{my_facts}

다음 JSON 형식으로만 응답하세요:
{{
  "claims": [
    {{
      "claim": "상대방 주장 요약",
      "rebuttal": "반박 초안",
      "riskLevel": "normal 또는 caution (인정 위험이 있으면 caution)"
    }}
  ],
  "summary": "전체 반박 주장 통합 초안 (2-3문단)"
}}"""

    try:
        client = anthropic.Anthropic(api_key=api_key)
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        import json as _json
        raw_text = resp.content[0].text.strip()
        try:
            result = _json.loads(raw_text)
        except Exception:
            result = {"claims": [], "summary": raw_text}
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"분석 실패: {e}"}), 500


@app.route("/api/purchase", methods=["POST"])
def api_purchase():
    """건별 구매 기록 생성 (FR-21) — 실제 결제 게이트웨이 연동 전 목업"""
    data = request.get_json(force=True)
    doc_type   = data.get("docType", "")
    price      = data.get("price", 0)
    method     = data.get("method", "card")

    if not doc_type:
        return jsonify({"error": "문서 종류 누락"}), 400

    # 실제 구현 시: 결제 게이트웨이 호출 후 DB에 구매 기록 저장
    return jsonify({
        "success": True,
        "purchaseId": f"PUR-{date.today().strftime('%Y%m%d')}-MOCK",
        "docType": doc_type,
        "price": price,
        "method": method,
        "message": "구매가 완료되었습니다.",
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
