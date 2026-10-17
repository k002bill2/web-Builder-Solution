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
- [x] Ego Lite 1회(R2, space 36) — 결함 1건 발견·수정(09c4309d) 뒤 재실측: R1·R2 통과 · R4 부분(실패 alert는 수정 전 build만) · R5 unzip -t 통과(Windows는 QA) · R1b 관찰 · R3 BLOCKED: 실화면 20MB+ 미실행(입력 한도로 10장+ 필요, 턴 상한 초과) — 단위 EXP-AC-17만 · preview 종료 lsof 4395·4396 리스너 0 · IDB 삭제 · finish({keep:[]})
- [x] Codex 1회(R2, `adversarial-review --scope branch --base d8e548e5` + 관점 4개) — needs-attention P2 2건 → 반영 1회(TDD RED `logs/codex-fix-red.txt` → GREEN 3129 passed · 진입 128.71 불변) `logs/codex-r2.txt`
- [x] REPORT 최종 · untracked 0
- [x] R2 REPORT 갱신(결론 · 1절 개정 18 행 · EXP-AC-02·14 부분 사유 · 7절 Codex · 8절 Ego Lite R1~R5)

## 로그
- 열린 항목: 09c4309d Codex 미검토(다음 레인 1회 권고) · R3 · R5 Windows · "(zip)을" 조사 — REPORT 10절(9절 = FIX1)
- Ego Lite 1차(space 36): zip OK · 단일 HTML 실패 → CDP 예외 정지로 원인 = F-14 브랜드 검사가 인라인 글꼴 base64까지 검사(우연 4글자) → TDD 수정(`logs/ego-fix-red.txt` → 3130 passed · 진입 128.71) → 새 build로 재실측
- R2(BRIEF-R2): fresh 게이트 통과 → Codex 먼저(수정이 생기면 Ego Lite가 최종 코드를 보도록) → Ego Lite → REPORT
- 02:49 착수 · CP1 서브에이전트(worktree) ∥ 메인 CP2
- CP1 c568e661 · CP2 c7863aeb · CP3+CP4 575576b8 · CP5 fe4671a1
- 예산: CP2 정규화 0 → CP5 +0.01(StudioLayout gzip 19.58→19.59 버튼 글자) → 감량 1회(isFormat includes) 효과 없음·되돌림 → 멈춤
- 편차: data 3파일(SPEC 1.3) · PngSave.test.tsx:122 병렬 겹침(hunk 분리) · 용량 초과 = 재시도 사유 경로 — REPORT 3절

## FIX1 (BRIEF-FIX1 · base a834eb88)
- [x] F0. BRIEF-FIX1·PROGRESS 커밋
- [x] F1. M-1·M-2 — `clean()`에 template·animate·set·animateMotion·animateTransform(localName) · RED 퍼즈 M06·M07·M12·M13·M41·M42·M43
- [x] F2. L-2 — F-14 제외를 CSS의 `url(data:font/…;base64,…)`로만 · RED 주석 경계·notice·M2a·M2c
- [x] F3. L-1 — `url(`·`image-set(`·`@import` 출현 수 = 엄격 매치 수 · 킷 이스케이프
- [x] F4. 문구 "정적 사이트(zip)을" → "를"
- [x] F5. fresh typecheck·lint·test·build · 예산(진입 128.71 · 복원 131.69 증분 0)
- [x] F6. Codex 1회(`adversarial-review --scope branch --base a834eb88`) · 반영 1회 — needs-attention P2 2·P3 1 → P2-1 반영(3134 passed · 진입 128.71) · P2-2·P3 사유 기록(REPORT 9절)
- [x] F7. REPORT 9절 FIX1 · untracked 0
