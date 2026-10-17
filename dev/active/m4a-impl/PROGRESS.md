# M4-a-2 PROGRESS — 정적 zip 내보내기 구현

브리프: `dev/active/m4a-impl/BRIEF.md` · 정본: `docs/design/m4a/EXPORT-SPEC.md` 8a · base `d8e548e5`

## 체크리스트
- [x] 0. BRIEF·PROGRESS 커밋 (7e599112)
- [x] CP1 storeZip 작성기 + 단위(CRC 벡터·파서·unzip -t/zipinfo·경로 거절·ZIP64 throw·결정적 시각)
- [x] CP2 렌더 문서 참조 직렬화(Q17 B·Q5) · HTML_MAX 유지 · 기존 정적 HTML 테스트 통과 · 20MB 이미지 단위(EXP-AC-17)
- [x] CP2 완료 → REPORT 초안 커밋 (c7863aeb)
- [x] CP3 zip 조립(index.html·assets/images·assets/fonts·OFL.txt·LICENSES.md) · 파일명 규칙 · ZIP_MAX 64MB
- [x] CP4 금지 패턴 검사 확장(허용표·외부 href·브랜드 0) · F-11·F-12
- [x] CP5 UI ExportButtons 2버튼 · 상태 문구 청크 · 성공 Callout 보조 문장(Q14)
- [x] 예산: 개정 18(8aa9a60f)로 해제 — R2 fresh build 진입 128.71 · 복원 131.69 = 기준선(증분 0, 기준선 갱신 불필요)
- [x] fresh typecheck·lint·test·build (3105 passed · build exit 0)
- [x] R2 fresh 게이트(병합 뒤): typecheck 0 · lint 0 · test 353파일 3127 passed · build exit 0 (`logs/*-r2.txt`)
- [ ] Ego Lite 1회 — BLOCKED: 결정 1 멈춤(+0.01) — 개정 18 판단 후 재개(Ego Lite → Codex 순) · preview 미실행, lsof 4395 리스너 0 기록
- [x] Codex 1회(R2, `adversarial-review --scope branch --base d8e548e5` + 관점 4개) — needs-attention P2 2건 → 반영 1회(TDD RED `logs/codex-fix-red.txt` → GREEN 3129 passed · 진입 128.71 불변) `logs/codex-r2.txt`
- [x] REPORT 최종 · untracked 0

## 로그
- R2(BRIEF-R2): fresh 게이트 통과 → Codex 먼저(수정이 생기면 Ego Lite가 최종 코드를 보도록) → Ego Lite → REPORT
- 02:49 착수 · CP1 서브에이전트(worktree) ∥ 메인 CP2
- CP1 c568e661 · CP2 c7863aeb · CP3+CP4 575576b8 · CP5 fe4671a1
- 예산: CP2 정규화 0 → CP5 +0.01(StudioLayout gzip 19.58→19.59 버튼 글자) → 감량 1회(isFormat includes) 효과 없음·되돌림 → 멈춤
- 편차: data 3파일(SPEC 1.3) · PngSave.test.tsx:122 병렬 겹침(hunk 분리) · 용량 초과 = 재시도 사유 경로 — REPORT 3절
