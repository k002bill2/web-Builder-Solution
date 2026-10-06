# EDITOR-REST-0 REPORT — 편집기 잔여 실렌더 기준 재명세·계획 (코드 0)

## 1. 산출물
| 파일 | 내용 |
|---|---|
| `docs/design/editor-rest/SPEC.md` | 1.1 구현 상태 표(L1 경로) · 1.2 막힌 검증 연결 · 2절 시드 게이트 차단 원인·QA 경로 · 3절 재명세(테마·스냅샷·게이트 해소·내보내기 잔여·실행 취소) · ER-AC 29개(r1 +S9·S10)([U]/[G]/[B]) · QB-R1~R7 · 깨질 테스트 · 접근성 · 예산 배치 |
| `docs/04-plan/EDITOR_REST_PLAN.md` | 레인 6개(ER-1 QA ∥ ER-2 테마 ∥ ER-3a 저장소 → ER-3b 스냅샷 화면 → ER-4 실행 취소 → ER-5 QA) · 쓰기 경로 병렬 판정(StudioLayout.tsx 기준) · 시간 추정 · preview QA 환경 |
| `docs/design/editor-rest/MQ.md` | MQ-R1 스냅샷 메모리 지금(★A) · R2 B-M2C-09 지금 QA(★A) · R3 예산 상향 없음(★A) · R4 대화상자 실렌더 없음(★A) · R5 필드 편집 기록(★A) |

## 2. 핵심 사실 (L1)
1. 테마 바꾸기 `swapTheme`·`diffSlotValues` 코드 0건. `ThemePanel`(StudioPanels.tsx:65-77)은 h2·Tag·링크만(`?v=` 없음).
2. 스냅샷 `createSnapshot`·`restoreSnapshot` 그리고 **`resolveConflict`도** 메모리 저장소 `missing`(memoryProjectRepository.ts:101-103). 충돌 화면은 있으나 도달·동작 불가.
3. 실행 취소는 섹션 연산만 기록(useSectionOps.ts:61-81) · 키보드·redo·더보기 0. 필드 편집은 기록 밖.
4. E-S24 경고 확인 대화상자는 구현됨(ExportAfter.tsx:13-52).
5. **B-M2C-09 원인**: 게이트 규칙·시드 모두 정상. 기존 문서를 대비 통과 버전으로 옮기는 길(테마 바꾸기·"새로 시작" UI)이 없어 차단이 영구화. ref-e·밝은 카드는 AA 통과(contrastAaRegression.test.ts 스냅샷) → 새 프로젝트 경로로 지금 QA 가능(브라우저 미실측).
6. 예산: `/studio` 첫 화면 91.75/100 · 진입 127.05/128 · 멈춤 127.39 → 여유 0.34(`logs/build.txt:152,162`, `npm run build` EXIT 0).

## 3. 검증
- `cd app && npm run build` → EXIT 0(`dev/active/editor-rest-spec/logs/build.txt`). 코드 변경 0이라 typecheck·lint·test는 실행하지 않음(빌드에 tsc 포함).
- Ego Lite 미실시(PROGRESS 사유) · 서버 기동 0 · 4337 리슨 0 · main 5480 무접촉.
- Codex: 아래 4절.

## 4. Codex
| 라운드 | 명령 | 결과 | 반영 |
|---|---|---|---|
| r1 | `codex-companion.mjs adversarial-review --scope branch --base 7240651`(원문 `logs/codex-adv-r1.txt`) | **완료 · needs-attention** — P1 2 · P2 1. 예산 127.05/127.39·StudioLayout 직렬 판정 결함 없음. ref-e A/B/C 메타 입력 뒤 게이트 차단 0을 코드 실행으로 확인 | 3건 모두 반영(SPEC r1): 스냅샷·복원 전 미저장 편집 저장(ER-AC-S9) · 복원 = 저장 훅 revision 동기화(ER-AC-S10 · PLAN ER-3b에 `useDocSave.ts`) · 테마가 기존 섹션 모션을 바꾸지 않음(3.1 정정) |

## 5. 남은 것 · 사용자 필요
- MQ-R1~R5 회신(★ 전부 A 추천).
- BACKLOG 후보(이 레인은 수정 0 — Jarvis 등록): 프로필 "새로 시작"(EQ-2 A) UI 미구현 · `resolveConflict` 메모리 missing.
