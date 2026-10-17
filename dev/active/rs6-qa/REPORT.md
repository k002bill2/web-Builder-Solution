# RS6 최종 QA REPORT — 저장 코어 제품 연결 통합 판정 (초안)

QA 세션(구현 레인과 별도) · 브랜치 `k002bill2/rs6-qa` · 대상 base `0a809b87`(L0~L5 반영) · 2026-10-17
상태: **초안** — 실화면·대조표 채우는 중.

## 0. 판정
- (작성 중) 게이트 4종 fresh 결과는 5절. 실화면 결과 확정 뒤 판정.

## 1. 위험 해소표
| 위험 | 정의 | 판정 | 근거 |
|---|---|---|---|
| RS4-R1 | 뒤로 재진입 시 idle 거짓 표시 | (실화면 대기) | |
| RS4-R8 | 뒤로·주소 이동 무경고 손실 | (실화면 대기) | |
| BD-1 | 같은 탭 다른 어댑터 객체 | (대조표 대기) | |
| LV-1 | commit 미종료 → 무기한 대기 | (대조표 대기) | |
| LV-2 | discard 읽기 미종료 → discarding 고정 | (대조표 대기) | |
| H4 | 다른 탭·낡은 증명 × Web Locks | (실화면 B3 대기) | |

## 2. RS6-AC 대조표
(서브에이전트 읽기 전용 결과 통합 예정)

## 3. 실화면
- 환경: `npm run build`(fresh, exit 0) → `npx vite preview --host 127.0.0.1 --port 4385 --strictPort` · Ego Lite TaskSpace 23 · origin `http://127.0.0.1:4385` 1개.
- 기동 직후: `indexedDB.databases()` = `[]` · `navigator.locks.query().held` = `[]`.
- 경로: 새 프로젝트 → 카탈로그 비교 추가(모던 카페·동네 치과) → 비교 보드 "A 전부 선택" → 프로필 확정(v1) → 3안 → A안 선택 → "A안으로 편집 시작" → `/studio/project-1`. 진입 직후 held = `[design-studio-writer:exclusive]` · DB `design-studio`(docs `project-1`).

## 4. notes 분류 (제안)
(작성 예정)

## 5. fresh 게이트 (`app/`, 직렬, HEAD e33e8e6b = 0a809b87 + docs)
| 명령 | 결과 | 로그 |
|---|---|---|
| `npm run typecheck` | exit 0 | `logs/rs6qa-tc.log` |
| `npm run lint` | exit 0 | `logs/rs6qa-lint.log` |
| `npm test -- --run` | **1차: 340 files 중 1 failed · 3021/3022** — `src/pages/keyboardA11y.test.tsx` "다음 항목 → 이전 항목 → 펼침 버튼 순으로 포커스" `toHaveFocus` 실패(서브에이전트 병행 부하 중). 단독 재실행 9/9 통과. 전체 재실행 결과는 최종본에 | `logs/rs6qa-test.log` |
| `npm run build` | exit 0 · `/studio` 정규화 **129.12**(멈춤 >129.14) · raw 130.43(≤130.5) · 복원 정규화 **132.10**(멈춤 >132.12) · 복원 raw 133.47 | `logs/rs6qa-build.log` |

## 6. 사실 / 추정 / 미확인
(작성 예정)
