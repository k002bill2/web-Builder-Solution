# SEC-M4A-10 BRIEF — 프로젝트 파일 가져오기 신뢰 경계 · 내보낸 HTML CSP 검토 (Security, 읽기 전용 + 로컬 테스트)

책임 역할: Security / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (자동 진행 — BACKLOG B-M4A-10 Medium)
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/sec-readproject` (base origin/main `41fcfd25`). 범위: 로컬 코드·로컬 단위 테스트·로컬 생성 산출물만. 외부 송신·네트워크 스캔 0.
선행 근거: `dev/active/m4a-appsec/REPORT.md`(도달성 4번 [미확인] readProject · 항목 6 CSP 권고) · BACKLOG B-M4A-10.

## 검토
1. **가져오기 경로 전수**: 프로젝트 파일 가져오기(`readProject`·`validatePageDoc`·관련 zod 스키마·IDB 쓰기) — 파일 → 파싱 → 검증 → 저장 → 렌더/내보내기까지 데이터 흐름 표. 검증을 우회해 저장소에 들어가는 필드가 있는지.
2. **주입 퍼즈(임시 테스트, 되돌림)**: 악성 프로젝트 파일 30건 이상 — 문자열 필드에 HTML/스크립트·`javascript:`·CSS 주입(`kitVars`·팔레트·글꼴 이름·링크 href·이미지 MIME·data URL·이미지 크기 폭탄·깊은 중첩·프로토타입 오염 `__proto__`·`constructor`)·거대 배열. 각 입력 → 거절/정규화/통과 + 통과 시 렌더 iframe·정적 내보내기 결과에 무엇이 남는지.
3. **이미지 Blob 경로**: 가져온 이미지의 MIME 스니핑·SVG 업로드 처리(스크립트 SVG가 렌더·내보내기에 실리는지).
4. **CSP**: 내보낸 HTML·zip `index.html`에 생성기 고정 CSP meta를 넣을 때의 최소 정책안(현재 산출물이 쓰는 리소스: 인라인 style·메뉴 스크립트·data:/상대 이미지·글꼴) — **권고안 문서만**, 구현 0. 인라인 스크립트 해시 필요 여부.
5. 심각도 판정(Critical/High = 머지 차단급 결함 보고 · Medium = 수정 권고 · Low/Info) + 수정 패치 제안(검증된 경우 `patches/`).

## 산출
- `dev/active/sec-readproject/{BRIEF,PROGRESS,REPORT}.md` + `logs/`·`patches/`. 서브에이전트: 읽기 전용 2개(1·3 병렬 조사) 허용. 최대 60턴, 48턴부터 마감.

## 공통
- 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. 첫 2턴 BRIEF·PROGRESS 커밋, **REPORT 초안(잠정 결론 줄) 10턴 안**, 항목마다 갱신 커밋. 사실/추정/미확인 구분.
- **앱 코드 커밋 0**(임시 테스트·패치는 `patches/`로 보존 후 복원). Codex는 `--help` 없이 1회까지.
- 마감 전 `git status --short` node_modules 외 빈 값 · `git diff -- app/` 빈 값.
