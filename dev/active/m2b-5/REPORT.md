# M2B-5 REPORT — 3안 실렌더 나란히 비교 (Developer) · **S1 멈춤선 초과로 구현 중단**

## 1. 요약
- **결론**: SPEC 7.4 S1 시제품에서 6.2 멈춤선 `/studio/:projectId` 진입 **> 127.37** 을 넘었다(1차 127.56 · 배치 변경 1회차 뒤 127.50). 브리프 규칙("멈춤선 넘으면 배치 변경 ≤2회, 그래도 넘으면 구현 중단·보고")에 따라 **S2~S5 미착수, 중단·보고**한다.
- 남은 유일한 배치 대안(`readRenderMessage` 로컬 사본)은 실험 빌드에서 모든 멈춤선을 통과했지만(127.33), 브리프 제약 "postMessage 출처·소스 검증 재사용"과 충돌해 **적용하지 않았다** — 영환님 결정 사항(5절).
- 브랜치 상태: 버튼 "3안 실제 화면으로 비교"는 보이고, 누르면 비교 청크를 받아 변환 3건만 계산한다(숨은 stub, 대화상자·iframe 0). **이 상태로 머지 금지**(사용자에게 보이는 버튼이 아무것도 열지 않는다).

## 2. meta
| 항목 | 값 |
|---|---|
| 책임 역할 | Developer |
| 실행 환경 | Orca managed worktree `m2b-5` + Claude Code (Opus 5.5, 서브에이전트 0) |
| 브랜치 · base | `k002bill2/m2b-5` · `48487d5`(SPEC 병합 지점) |
| 정본 | `docs/design/m2b/SPEC-COMPARE3.md` · `MQ-M2B5.md` 1~4 ★A |
| 서버 | 개발·미리보기 서버 기동 0(S5 미착수) → 종료할 자기 PID 없음 · main 5480 무접촉 |
| 수정 금지 대상 | package*.json·lock·CLAUDE.md·docs/design·docs/decisions·예산 값 **수정 0** (`git diff 48487d5 --stat` 확인) |

## 3. 커밋표
| SHA | 내용 |
|---|---|
| f1b07bb | P0 BRIEF·PROGRESS 골격(BRIEF 명시 커밋) |
| 514da95 | S0 `check-bundle-size.mjs` `/profile (3안 있음)` 시나리오 추가 — 실측 121.11 |
| 333e540 | S1 새 테스트 수 사전 예측(+9 → 213 · 1849) |
| 66d2f0c | S1 시제품(버튼·로더·변환, iframe 0) + 배치 변경 1회차(docKitTokens 복제·대조) |
| 8339bd6 | S1 측정·게이트 로그 |
| 26c4e43 | PROGRESS — 멈춤선 판정 |
| (이 커밋) | REPORT · Codex 결과 |

## 4. 6.2 예산 표 (gzip KB, `npm run build` 출력 — logs/s0-build · s1-build · s1b-build · final-build · s1c-experiment-build)
| 대상 | baseline | S0 | S1 1차 | S1 1회차 = 최종 커밋 | 실험(리더 사본, 미커밋) | 멈춤선 |
|---|---|---|---|---|---|---|
| `/profile` 첫 | 99.61 | 99.61 | 99.61 | 99.61 | 99.61 | > 99.64 |
| `/catalog` 첫 | 99.66 | 99.66 | 99.65 | 99.66 | 99.65 | > 99.69 |
| `/references/:id` 첫 | 97.00 | 97.00 | 97.00 | 97.01 | 97.00 | > 97.03 |
| `/compare` 첫 · 진입 | 98.84 · 121.72 | 같음 | 98.83 · 121.69 | 98.84 · 121.70 | 98.83 · 121.69 | > 98.87 |
| `/profile` 진입(잡 없음) | 118.67 | 118.67 | 119.00 | 119.02 | 119.00 | > 119.50 |
| `/profile (3안 있음)` 진입 | ≈121.11 | **121.11** | 121.45 | 121.46 | 121.44 | > 122.00 |
| `/studio/:projectId` 진입 | 127.34 | 127.34 | **127.56** | **127.50 ✗** | 127.33 | > 127.37 |
| 렌더 JS · CSS | 83.03 · 8.75 | 같음 | 같음 | 같음 | 같음 | 변화 시 멈춤 |
| 비교 조작 뒤 청크 | — | — | 17.92 | 17.78 | 17.67 | > 25 |

- 스크립트 판정은 모두 통과(build exit 0, `/studio` 127.50 ≤ 한도 128). **멈춤의 근거는 SPEC 6.2 멈춤선(±0.03 공유 청크 분할 감지)이지 스크립트 실패가 아니다.**
- `/profile` 진입 +0.35는 SPEC 추정 +0.10~0.25를 넘지만 멈춤선 안. 원인: profileEngine 청크 8.93 → 9.29(버튼·로더 이음새·문구 3개).

### 4.1 원인 증거 (청크 diff, gzip)
- 1차: 비교 청크가 `render/protocol`(readRenderMessage)과 `features/studio/docPurpose`(docKitTokens)를 값 import → 편집기 `StudioLayout` 청크와 공유되어 `protocol` 청크 0.88KB 신설(docPurpose + readRenderMessage), StudioLayout 16.77 → 16.09 → `/studio` +0.22.
- 배치 변경 1회차(SPEC 3.2가 미리 허용한 대안): `compareKitTokens`로 docKitTokens 복제 + 대조 it(보정·촘촘·어두운 카드·미디어 비율·부분 레코드). `protocol` 0.34KB(readRenderMessage만)·StudioLayout 16.57 → `/studio` +0.16. 여전히 초과.
- `startDocWrite` 분할(memoryDocBook 8.30 → 2.41 + startDocWrite 6.29)은 `/studio` 진입과 무관: `getDoc`은 docBook을 받지 않는다(`app/src/data/memoryProjectRepository.ts:91` `book?.docOf`). docBook은 startDoc·saveDoc·내보내기(조작 뒤)에서만 받는다.
- 판정 대안 검토: SPEC 3.2 (a′) `judgeExport` 분리는 비교 청크 > 25KB용 대안이라 해당 없음(17.78), protocol 분할을 줄이지 못한다. 공통·ProfilePage 청크로 옮기기는 첫 화면 증가 금지 위반. 남는 것은 readRenderMessage 복제뿐.

## 5. 영환님 결정 필요 (1개만 고르면 S2부터 재개 가능)
| 안 | 내용 | 실측 · 대가 |
|---|---|---|
| **A (추천)** | 비교 청크에 `readRenderMessage`·모양 검사 헬퍼 **로컬 사본** + 대조 가드(protocol.ts 원본과 소스 텍스트 동일 + 테스트 코퍼스 동작 동일)로 "재사용" 제약을 완화 승인 | 실험 빌드 `/studio` **127.33**(−0.01) · 모든 멈춤선 안. 대가: 같은 검사 코드가 2곳(가드가 표류를 잡음). SPEC 2.3·5가 이미 `/render.html`·폭 상수에 같은 "로컬 상수 + 대조 가드"를 쓴다 |
| B | `/studio` 멈춤선·예산을 재판단(+0.16 수용) — ADR-004 개정 사항 | 코드 그대로 진행 가능. 대가: `/studio` 실여유 0.36 → 0.20, 공유 청크 1개 영구 |
| C | 비교 기능 보류(이 브랜치 폐기 또는 S1까지만 보관) | 대가: M2B-5 미완 |

## 6. CMP-AC별 근거 (구현된 범위만)
| # | 상태 | 근거 |
|---|---|---|
| U1 | ✅ | `pages/ProfileCompare.test.tsx` "잡 없음·만드는 중 = DOM에 없음 → …카드 목록 아래 · 편집 시작 위" · "전부 실패한 잡 = 버튼 없음" |
| U2 | ✅ | 같은 파일 "누르기 전 요청 0 → aria-busy '불러오는 중…' · startDoc 0" · "청크 실패 → role=alert + 다시 시도 → 새 요청" |
| U3 | 부분 | `features/profile/compareFrame.test.ts` 수신 판정(다른 프레임·창·모양 틀림 무시). 열별 상태 연결은 S2(미착수) |
| U5 | ✅ | `features/profile/comparePreviews.test.ts` 결정성(같은 hash·preview·고정 시각) · 쓰기 0 · 실패 안 · UNKNOWN_VARIANT · 킷 토큰 대조 |
| G1 | ✅ | `engineImportGuard` 통과(비교 파일은 engine 직접 import 0 — 타입도 `data/startDocWrite`에서 파생) · 전체 suite |
| G5 | 부분 | 새 시나리오 `/profile (3안 있음)` 존재 ✅ · 멈춤선 전부 안 ✗(`/studio`) |
| U4·U6~U12·G2·G3·G4·B1~B6 | 미착수 | S2~S5 BLOCKED(1절) |

## 7. 테스트 delta
- baseline(fresh, logs/baseline-full-vitest.txt): 210 files · 1840 passed · exit 0
- S1 예측 +9(213 · 1849, 커밋 333e540) → 실제 **+10 → 213 files · 1850 passed · exit 0 · Errors 0**(logs/final-full-vitest.txt). 차이 1 = 배치 변경 1회차의 복제 대조 it.
- RED: logs/s1-red.txt(3 failed + 2파일 import 실패) → GREEN 표적 3파일 10 passed.
- 기존 테스트 수정 0 · 단언 약화·skip 0. 내 새 테스트 전제 1건 정정: "프로젝트 없는 프로필" — 보드 확정이 프로젝트를 만들어 전제가 틀렸음 → "프로젝트를 읽지 않고 보는 버전만으로 문서 + 변환 뒤 편집 문서 0"으로 바꿈(쓰기 0 단언은 더 강해짐).
- 게이트: typecheck · lint exit 0(logs/s1-gate.txt) · build exit 0(logs/final-build.txt).

## 8. Codex 검증
- `codex-companion review --scope branch --base 48487d5` 1라운드 — 결과는 8.1에 기록(logs/codex-review.txt).

## 9. 한계 · 주의
- 브랜치의 버튼은 누르면 숨은 stub만 그린다(사용자에게 아무 변화 없음) — 재개 전 머지 금지.
- `CANDIDATE_TEXT.preview` 문장 교체(SPEC 2.4)·캡션·대화상자·프레임·알림·선택 연동·브라우저 검증(B1~B6)은 미착수.
- 로더 이음새 `compareLoader.ts`는 `candidateResultsLoader.ts`와 같은 패턴을 복제(공유 헬퍼로 묶으면 기존 청크 바이트가 바뀌어 별도 측정 필요 — 이번에 하지 않음).
- 책임/환경: 판정·측정은 이 worktree 실측. 서브에이전트 0. push·merge·삭제 0.
