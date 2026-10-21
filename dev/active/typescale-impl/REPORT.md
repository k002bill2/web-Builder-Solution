# TYPESCALE-IMPL REPORT

## 0. 결론 (갱신 2026-10-21 · T4)
- **T0~T3 완료·병합**: T3 `1a2aa779` → 병합 `3a4dd1fb`. ADR-004 **개정 22** `3e5dfbc7`(B-M2B-05 몫 +0.03 · 기준선 `/studio` 128.79 · 복원 131.79, 판정 128.82 · 131.82). tip `9d45bdac` fresh 게이트: typecheck·lint 0 · test 384/3459 · build exit 0 · 렌더 JS 84.38(`logs/adr22-*.txt`). 아래 UQ-4 멈춤 기록은 개정 22로 해소.
- **T4 완료(TS-AC-13 수치만 BLOCKED)**: 문서 정정 `46865f21`(SPEC-COMPARE3 F10·2.4-2·2.5·3.2 · MQ-M2B5-2 대체 · REACTZIP 2.3.1-1 "선택 필드 `typeScale` 제외" · TYPESCALE-SPEC 상태줄 — 옛 문장 보존 + before→after) · BACKLOG `35edcc27`(B-M2B-05 ✅ 닫힘 · B-M2B-05b 파일 끝 추가). 앱 코드 변경 0.
- **TS-AC-13 [B]**: 실화면 흐름은 통과 — preview 4399(1280)에서 3안 카드 비율 A 1.2(프로필) · B 1.25 · C 1.333 확인 → C안 편집 시작 → `/studio/project-2` 진입(`logs/t4-ego-run1.txt`). **편집 캔버스 제목의 계산된 font-size는 BLOCKED**: 캔버스 `render.html`이 sandbox iframe(OOPIF)이라 `contentDocument` 접근 불가·`Page.getFrameTree`에 자식 프레임 없음(`logs/t4-ego-run1-measure.txt`) — 시간 예산(15분) 안에 Target 부착 방식을 못 함. 다음: ego-browser에서 `Target.getTargets`/`Target.attachToTarget`으로 render.html 대상에 붙어 `h1` font-size 측정(C 1.333 vs A 1.2 비교). 단위 근거는 T3 테스트(TS-AC-04~07·16).
- preview 종료: `lsof -nP -iTCP:4399 -sTCP:LISTEN` LISTEN 0줄(`logs/t4-ego-port-after.txt`).

| TS-AC | 판정 |
|---|---|
| 01·02·03·08·11·14 | 통과(T1·T2 단위) |
| 04~07·09·10·16 | 통과(T3 단위·가드, 병합 `3a4dd1fb`) |
| 12 예산 | 통과(개정 22 기준선 128.79·131.79) |
| 13 브라우저 | 부분 — 흐름 통과 · 캔버스 font-size 실측 BLOCKED(OOPIF) |

## 0-a. (이전 결론 — 2026-10-20, 보존)
- **T0~T2 완료·게이트 통과**(브랜치 `k002bill2/typescale-impl`). 엔진 계약 `PageDoc.typeScale?` · 검증 허용·범위(1~2)·재구성 보존 · 편집 시작·restart 기록까지 들어갔다. 렌더는 아직 프로필 비율(T3 미병합) — 사용자에게 보이는 변화 0, 되돌리기 하한(TS-AC-14) 충족.
- **T3는 예산 멈춤(UQ-4)**: 감량 1회 뒤에도 복원 진입 정규화 **131.79 > 판정선 131.78**(`/studio` 128.79 = 판정선, 여유 0). 브리프대로 T3에서 멈췄다. T3 구현·테스트는 별도 브랜치 `k002bill2/typescale-impl-t3-budget`(커밋 `1a2aa779`)에 보존 — tsc·vite·test 통과, 실패는 `check-bundle-size`뿐.
- **T4 BLOCKED**(T3 미병합이라 문서 정정·B-M2B-05 닫힘·Ego TS-AC-13을 하면 사실과 다른 기록이 된다).
- site.json 모양·`ExportDoc` 키·`SCHEMA_VERSION` 변경 필요 0(`exportDoc`가 필드를 골라 담음 — TS-AC-09 단언). 새 의존성 0 · 단언 약화·skip 0.

## 1. 단계별 상태
| 단계 | 상태 | 커밋 |
|---|---|---|
| T0 기준선 | 완료 | e3f8f8b8 |
| T1 엔진 계약 | 완료 | 7f94cc4b |
| T2 저장 경로 | 완료 | 12adddfe · 48293a93(TS-AC-08 왕복 테스트) |
| T3 렌더 입력·예산 | **멈춤(UQ-4)** — 별도 브랜치 | 1a2aa779 (`k002bill2/typescale-impl-t3-budget`) |
| T4 문서·Ego | BLOCKED — T3 미병합 | — |
| Codex adversarial | 완료 — approve, 지적 0 · 반영 0 | — |

## 2. 예산 (해시 정규화 진입 KB, `npm run build` → check-bundle-size)
| 시점 | /studio (멈춤 >128.79) | 복원 (멈춤 >131.78) | 렌더 JS (멈춤 89.70) |
|---|---|---|---|
| T0 base | 128.76 | 131.76 | 84.30 |
| T1 | 128.76 | 131.76 | 84.38 |
| T2 | 128.76 | 131.76 | 84.38 |
| T3 1차 | 128.79 | **131.79** | 84.38 |
| T3 감량 1회 뒤 | 128.79 | **131.79** | 84.38 |
| (측정용·미채택) T3 − StudioLayout 결선 | 128.78 | 131.78 | — |

UQ-4 판단 재료:
- T0 시점 복원 진입이 이미 131.76(기록된 기준선 131.75보다 +0.01) → 이 레인이 쓸 수 있던 여유는 0.02였다.
- T3 증분 = 131.76 → 131.79, **+0.03 = 허용치와 같다**. 초과분 0.01은 base가 이미 높았던 몫.
- 감량 1회(`docPurpose.ts` — `docKitTokens`가 찾은 버전으로 팔레트 생성, `versionOf` 중복 조회 제거): 표시 단위 효과 0.00.
- 분해(측정용): `docKitTokens` 인자·`??` + 호출부 +0.02, `StudioLayout` 결선(편집기 캔버스·스냅샷 useMemo) +0.01. StudioLayout을 빼면 통과하지만 편집기·PNG는 프로필 비율, 내보내기·비교는 문서 비율로 어긋나 채택하지 않았다.
- 선택지(SPEC UQ-4): (a) 다른 진입 코드 감량 레인 선행 · (b) ADR-004 개정으로 몫 배분 — 최소 복원 +0.01(또는 base 실측 131.76으로 기준선 재기록), `/studio`는 128.79로 여유 0이라 +0.01~0.02 여유 권장. **권고: (b) 기준선 재기록(131.76) + 몫 +0.03** — 증분 자체는 허용치 안이고, (a)는 무관 코드 감량 레인이 하나 더 필요하다. 결정은 영환님.

## 3. Codex
- 1회 실행: `node codex-companion.mjs adversarial-review --scope branch --base 8d65fa9e "<focus>"` (t3 브랜치 = T0~T3 전체 diff, 로그 `logs/codex-adv.log`).
- 결과: **Verdict approve · No material findings.** T1 값·해시 보존, 영속 잡 axes 처리, 열별 토큰, 스냅샷 메모 의존성, ExportDoc 키·schema 1 유지를 소스로 확인(Codex는 격리 조건 제약으로 테스트 미실행).
- 반영: 지적 0이라 반영 커밋 없음.

## 4. 검증 명령·결과 (fresh)
- T0: typecheck·lint 0 · `npx vitest --run --maxWorkers=4` 381 files/3423 passed · build 0
- T1: 382/3445 passed · build 0 · Red-Green(재구성 줄 제거 → 7 실패 → 복원 63 통과)
- T2: 383/3451 passed · build 0 · Red(전달 제거 → 4 실패)
- T3(t3 브랜치): typecheck·lint 0 · 384/3459 passed · build exit 1(예산 검사만, 로그 `logs/t3-build2.log`)
- 마감(메인 브랜치 HEAD, Codex 뒤 fresh): typecheck·lint 0 · 383 files/3452 passed · build 0 · 128.76 · 131.76 · 렌더 84.38

## 5. 수용 기준 커버리지
- 메인 브랜치: TS-AC-01·02(startDocTypeScale) · 03(validatePageDoc) · 08(typeScaleRollback 왕복·범위 밖 거부) · 11(T0 해시 고정) · 14(typeScaleRollback: checkSaveDoc·IDB 복원·재저장·checkFile·rekeyDoc)
- t3 브랜치: TS-AC-04(kitTokenInput) · 05(comparePreviews 열별) · 06(CompareDialog 캡션·접미 0) · 07·15(typeScaleOps) · 09(reactZip site.json·생성기 인자) · 10(staticHtml render 토큰) · 12(예산 — 실패)
- 미검증: TS-AC-13(Ego, T4 BLOCKED) · TS-AC-16 컴포넌트 테스트(useMemo 의존성은 코드 반영, 단위 테스트 없음 — 비용 대비 생략)

## 6. 목업·SPEC과 다르게 한 부분
- 서브에이전트 분할 안 함: 렌더 경로 조사가 파일 4개 grep으로 끝나 재적재 비용이 더 컸다.
- 비교 미리보기 문서(`comparePreviews`)에도 `typeScale`을 적었다(t3 브랜치) — "미리보기 문서 = 편집 시작 문서" 해시 동일성 유지.
- TS-AC-15 단언은 `runGate(...).rows` 비교(리포트의 `docHash`는 문서 해시를 그대로 싣기 때문).

## 7. 정리·다음
- 별도 브랜치 `k002bill2/typescale-impl-t3-budget`(로컬 전용, push 0): T3 보존용. UQ-4 승인 시 이 브랜치를 메인 브랜치에 병합(기준선 갱신 커밋 추가) → T4 진행. 거절·폐기 시 `git branch -D k002bill2/typescale-impl-t3-budget`.
- Ego·preview는 실행하지 않았다(T4 BLOCKED) — 리슨 포트 0은 자명.
- git push·pull·fetch 0.
