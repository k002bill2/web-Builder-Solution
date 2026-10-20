# B-M2B-05 PROGRESS — 3안 제목 비율 축 전달 영향 범위 명세

브리프: `BRIEF.md` · 산출: `docs/design/m2b/TYPESCALE-SPEC.md` · 앱 코드 수정 0 · 외부 리서치 0

## 체크리스트
- [x] BRIEF·PROGRESS 커밋
- [x] 코드 흐름 조사 — 생성·편집 시작 경로 (서브에이전트 1, 읽기 전용)
- [x] 코드 흐름 조사 — 렌더·내보내기 경로 (서브에이전트 2, 읽기 전용)
- [x] SPEC §1 현재 흐름 표 (파일:줄)
- [x] SPEC §2 전달 방안 비교 (최소 2안, ★)
- [x] SPEC §3 사용자에게 보이는 변화
- [x] SPEC §4 수용 기준 TS-AC-xx · 구현 단계 분할 (재승인 지점)
- [x] SPEC §5 설계 질문 TSQ-xx · 사용자 질의 분리
- [x] Codex adversarial-review 1회 + 반영 — needs-attention, P2 2건(되돌리기 하한 · 스냅샷 전환 의존성) 모두 반영(SPEC r1)
- [x] 최종 커밋 · `git status --short` 빈 값

## 서브에이전트 결과
- 서브에이전트 1(생성·편집 시작 경로, 읽기 전용): 완료. 소실 지점 `memoryDocBook.ts:425` · `startDocWrite.ts:30-41` · `validatePageDoc.ts:34` 엄격 키 — 핵심 줄 직접 대조 일치.
- 서브에이전트 2(렌더·내보내기 경로, 읽기 전용): 완료. `docKitTokens`(`docPurpose.ts:42-56`) 단일 입력 · `KitTokenInput`·`site.json` v1 모양 불변 가능 · `/studio` 허용 0.03KB — 직접 대조 일치.
- 주의: 중간에 존재하지 않는 경로(`engine/pipeline/*`)가 섞인 결과 텍스트가 한 번 보였으나 실제 에이전트 보고가 아니었고 grep으로 부재 확인 → 폐기.

## 로그
- 2026-10-20 시작. base `cedbf587`.
- SPEC r0 작성(★B PageDoc 선택 필드 · A 순수 파생 · C 프로필 새 버전). 커밋 7fd65f90.
- advisor 반영: validatePageDoc 재구성(:129-143) = 소실 ② · 게이트 scale 참조 0 · DATA_SCHEMA_VERSION 부재(삭제) · 이름표·테마 바꾸기 모순 정정. 커밋 24389bf6.
- rekeyDoc 펼침 유지 · IDB 복원 checkSaveDoc 실패 = unreadable(되돌리기 비용). 커밋 1a445cc9.
- Codex adversarial-review 1회 실행(--scope branch --base cedbf587, 로그 /tmp/m2b05-codex.log).
- Codex r1 결과(1a445cc9 기준): [P2] TS-AC-14를 저장·복원 성공 기준으로 강화(재구성 누락 = 해시 불일치 실패) · [P2] StudioLayout useMemo 의존성에 typeScale(같은 버전 스냅샷 전환). 둘 다 이 diff가 쓴 문장 → 반영, 남은 지적 0.
