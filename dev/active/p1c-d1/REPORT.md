# P1C-D1 REPORT — 로컬 영속과 어긋난 문구 교체 (W2~W7)

판정: **완료** — typecheck·lint·build·전체 vitest exit 0 · 번들 관문 이내 · 마감 grep 사용자 문자열 0. Codex 0(Jarvis 몫). Ego Lite 생략(문구는 테스트·grep 증거).

## 1. 커밋
- `0c9bf99` P0 BRIEF·PROGRESS
- `dd0ce52` 구현 — 문구 6곳 + 테스트 5곳(amend·rebase 0)

## 2. 교체 (SPEC 1.2)
| # | 파일 | 새 문구 |
|---|------|---------|
| W2 | `components/studio/StudioEmptyStates.tsx` | 이 브라우저에 저장된 프로젝트만 열 수 있습니다 |
| W3 | `pages/ProfilePage.tsx` | 이 브라우저에 저장된 프로필만 열 수 있습니다 |
| W4 | `components/studio/StudioPanels.tsx` | 코드 생성기 연결 후(M2) 내보낼 수 있습니다. |
| W5 | `components/studio/ExportAfter.tsx` (`KEEP`) | 지금 문서는 자동으로 저장됩니다 — 이 시점을 따로 남기려면 '스냅샷'에서 저장하세요 |
| W6 | `components/studio/ImageSlotPanel.tsx` | 고른 이미지는 문서와 함께 저장됩니다 — 툴바에 '이 탭에 저장됨'이 보이면 **편집기를 나가거나 새로고침하면** 다시 골라야 합니다 |
| W7 | `features/studio/images/store/imageStore.ts` | 이 프로젝트의 이미지가 24개 · 60MB를 넘습니다 — 쓰지 않는 슬롯의 이미지를 지운 뒤 고르세요 |

분기 추가 0 — 문자열 리터럴만 교체.

## 3. W6 [확인 필요] 결론 — 대안 문구 채택 (L1 코드 근거)
- `data/memoryProjectRepository.ts:142` `...(local && { images: ... })` — 이미지 보관자(`ImageKeeper.images`)는 **local 모드에만** 붙는다. memory(강등) 모드에는 없다.
- `components/studio/StudioLayout.tsx:295` 이미지 맵은 편집 틀의 `useState<RenderImages>()` — memory 모드에서는 이 state가 유일한 보관처라 편집기 언마운트(이탈)와 함께 사라진다. 재진입 시 복원 경로(`restoreImages`)도 local 분기 안에만 있다.
- 따라서 memory 모드는 새로고침뿐 아니라 편집기 이탈에도 이미지를 잃음 → SPEC 지시대로 "새로고침 뒤" 대신 "편집기를 나가거나 새로고침하면"을 썼다.

## 4. 테스트 (TDD)
- 기대값 먼저 변경: `StudioEmptyStates.test` · `ProfilePage.test` · `ExportFlow.test`(정규식 접두 일치 유지) · `ImageSlotPanel.test` · `imageStore.test` → **RED 5 failed / 82 passed**(커밋 안 함) → 교체 → **GREEN 87 passed**.
- 단언 약화·skip 0 — 같은 matcher(getByText 정확 일치·findByText 정규식·toEqual)를 문구만 바꿔 유지.
- W4는 고정 테스트가 없다(`GatePanel` 대체 캡션은 `StudioLayout`이 늘 `exports`를 넘겨 앱 경로에서 안 보임). 새 테스트 추가 안 함 — 범위 밖.
- `StudioLayout.test`는 옛 문구 고정 없음(W8 '이 탭에 저장됨'만 — 변경 0이라 유지).

## 5. 번들 (`npm run build` → check-bundle-size)
| 라우트 | 관문 | 실측 |
|--------|------|------|
| `/studio/:projectId` | ≤129.65 | **129.59** ✅ (D2 보고 129.64 대비 −0.05) |
| 저장 데이터 복원 진입 | ≤132.68 | **132.62** ✅ (D2 보고 132.67 대비 −0.05) |
| `/profile` · (3안 있음) | 증가 0 | **119.82 · 122.29** ✅ (P1a2 기록 119.86·122.33보다 작음, 문자열 짧아짐) |
| `/projects` · `/compare` | ≤125 | 103.52 · 122.59 |

- `/profile` 기준선은 이 base에서 따로 재지 않았다 [추정: 문자열이 짧아져 증가 불가 + 이전 기록보다 작음].

## 6. 검증 명령 (app/, fresh)
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0
- `npx vitest --run` exit 0 — **268 files / 2349 tests passed**
- `grep -rnE "서버 연결 전|이 탭에 저장돼|이 탭의 편집기 안에서만|이 탭에 보관한" app/src --include='*.ts*'` → 1건: `pages/ProjectsPage.test.tsx:102` `queryByText(/서버 연결 전/)).not.toBeInTheDocument()` — **부재 단언**(옛 문구가 없음을 확인하는 회귀 가드)이고 D3·D4 영역 파일(쓰기 금지)이라 유지. 사용자 문자열은 0건.

## 7. 범위 준수
- 쓰기 파일 = W2~W7 소스 6 + 테스트 5 + dev/active/p1c-d1. `data/persistence/**`·`components/projects/**`·`ProjectsPage`·엔진·계약·docs·lock 수정 0, 새 의존성 0, 서브에이전트 0, push/merge/삭제 0, main 5480 무접촉.

## 8. 열린 항목
- W6 대안 문구는 local 모드에서도 "편집기를 나가거나"를 말하지만 조건절("'이 탭에 저장됨'이 보이면" = memory 모드)이 붙어 있어 local 사용자에게는 해당 없음 — 문장이 길어진 점(조작 뒤 lazy 청크라 진입 번들 영향 0)은 디자인 검토 시 참고.
- Codex 검증: Jarvis 몫.
