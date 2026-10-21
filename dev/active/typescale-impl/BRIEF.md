# TYPESCALE-IMPL BRIEF — 3안 제목 비율 축 전달 구현 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-21
승인: 영환님 "4A" — TYPESCALE-SPEC r1 ★B 채택, **UQ-1(엔진 계약 `PageDoc.typeScale?`)·UQ-2(`validatePageDoc` 허용 목록, SCHEMA_VERSION 유지, 구버전 되돌리기 시 새 문서 거부 수용) 승인.** TSQ-1~5 전부 ★.
정본: `docs/design/m2b/TYPESCALE-SPEC.md` r1(2.6 ★B · 4.1 TS-AC · 4.2 T0~T4 · 6 위험). base origin/main `8d65fa9e`.

## 순서 (단계마다 커밋 + typecheck·lint·test(`--maxWorkers=4`)·build + 예산 기록)
1. **T0** 측정·고정 테스트만(현행 문서 해시·`docKitTokens` 결과 기준선).
2. **T1** `PageDoc.typeScale?` · `validatePageDoc` 선택 키·범위(1~2)·**재구성 값 보존** · 엔진 `CandidatePlan.typeScale?` → `createDocFromCandidate` 기록. T1만으로 되돌리기 하한이 되도록(TS-AC-14).
3. **T2** 저장 경로(`StartDocInput.typeScale`·`memoryDocBook.ts:425`·restart·가져오기 왕복).
4. **T3** `docKitTokens(series, profileVersion, typeScale?)` · 호출부 `useMemo` 의존성에 `typeScale` 추가(TS-AC-16) · `staticHtml.ts`·`reactZip.ts` · `compareKitTokens` 대조 · 예산 실측(TS-AC-12).
5. **T4** 문서 정정(SPEC-COMPARE3 F10 · MQ-M2B5-2 · REACTZIP-SPEC 2.3.1-1) · BACKLOG B-M2B-05 닫힘 · B-M2B-05b(편집기 비율 UI) 등록 · Ego 실화면 TS-AC-13 1회(stdout은 `logs/`에 tee, preview `--port 4399 --strictPort` 종료 후 리슨 0).
6. Codex adversarial 1회(`--help` 금지)·반영 1회 · REPORT 결론.

## 멈춤 조건
- **예산**: `/studio` 128.76(멈춤 > 128.79) · 복원 131.76(멈춤 > 131.78). 넘으면 같은 진입 청크 안 감량 1회 → 그래도 넘으면 T3에서 멈추고 수치 보고(UQ-4 — 상향은 사용자 결정).
- `site.json` v1 모양·`ExportDoc` 키·`SCHEMA_VERSION` 변경이 필요해지면 멈추고 보고. 새 의존성 0. 단언 약화·skip 0. 기존 문서(필드 없음) 결과 불변.
- 서브에이전트 분할: 권장(T3 렌더 경로 읽기 조사 ∥ T2 테스트 작성, 쓰기 파일 겹침 금지).
- **git push·pull·fetch 금지.** 첫 2턴 BRIEF·PROGRESS 커밋, REPORT 초안 12턴 안, 항목마다 커밋. 마감 전 `git status --short` 빈 값. 최대 100턴, 85턴부터 마감.
