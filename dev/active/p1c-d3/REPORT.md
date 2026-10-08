# P1C-D3 REPORT — `/projects` "이 브라우저 저장소" 영역

base `d4a0ee5` · 브랜치 `k002bill2/p1c-d3` · 커밋: `53769ec` BRIEF P0 → `23f60ed` 영역·사용량·persist·강등·W1 → (이 커밋) 거절 문장 표시 수정·REPORT·캡처.

## 1. 바꾼 파일 (D2 쓰기 파일 겹침 0 — `data/persistence/**`·`localSync` 수정 0, 값 import 0)
| 파일 | 내용 |
|---|---|
| `app/src/features/projects/storageUsage.ts` (+test) | 1.3 사용량 순수 함수 — 1024²·toFixed(1)·"약"·0.1MB 미만·80% 문장(quota>0일 때만)·GB 변환 없음 |
| `app/src/features/projects/storageCheck.ts` (+test) | 1.7·1.8 강등 재확인 — none·blocked·newer·invalid(깨진 봉투·낮은 버전=이행 실패)·ok. 연결 즉시 close + onversionchange close |
| `app/src/components/projects/BrowserStorageSection.tsx` (+test) | 2절 1~3줄: 상태 문장(local) / 강등 Callout warning(memory) · 사용량(local) · 80% 이상이면 1.7 할당량 문장 · persisted 조회 → "자동 삭제 막기 요청"(assistive) → 결과 문장 갱신 · 영역 `role=status`("저장소 알림") 1개 · newer면 "새로고침" 버튼 |
| `app/src/pages/ProjectsPage.tsx` (+test) | W1 local/memory 분기 · 목록 아래(0개여도) 영역 배치(로딩 중엔 없음) |

## 2. 판단·SPEC과 다르게 한 곳 (한 줄씩)
- 영역은 **페이지 청크 정적**(지연 청크 아님): 지연이면 `check-bundle-size.mjs` auto 목록 수정 필요(이 레인 쓰기 범위 밖) — 정적이면 측정이 자동으로 정직. 첫 화면 96.05/100 여유 있음.
- `entryRead` 재사용 안 함: `/studio` 진입 공유 모듈이라 청크 재분할 위험 → DB 이름·봉투 규칙을 리터럴로 두고 같음은 `storageCheck.test`에서 `ENTRY_DB_NAME`과 단언(entryRead 머리 주석의 선례와 같은 방식).
- memory인데 재확인이 이상 없음(경합)일 때 SPEC 문장이 없어 W1 memory 문장("이 브라우저에 저장할 수 없어 새로고침하면…")으로 대신.
- 거절 시 보이는 줄 = 거절 문장(축출 문장 대체) + 버튼 유지(재요청), persist 예외도 거절 문장(오류 문구 0).
- persistence 쪽 신규 값 **필요 없음** — `repository.persistence` 읽기 + 영역 자체 재확인으로 충분(멈춤 사유 없음).
- 범위 밖(D4·D2): 지우기 버튼·대화상자, 다중 탭 문장, BroadcastChannel 구독 — 넣지 않음. invalid 문장이 "'이 브라우저 데이터 지우기'"를 가리키므로 D4 병합 전까지는 버튼이 없음.

## 3. 번들 (build 로그 실측)
| 시나리오 | 기준(53769ec) | 23f60ed | 최종 | 관문 |
|---|---|---|---|---|
| `/projects` 첫 화면 / 진입 | 94.04 / 101.39 | 96.03 / 103.38 | **96.05 / 103.41** | ≤100 / ≤125 통과 |
| `/studio/:projectId` 진입 | 129.62 | 129.61 | **129.65** | 스크립트 멈춤선(>129.65) 이하 · 브리프 "그대로"와는 +0.03 차이 |
| 복원 진입 | 132.65 | 132.65 | **132.68** | ±0.03 이내(경계) |

- `/studio`·복원의 ±0.0x 변동은 **해시 잡음**[L1 실측]: 이 레인은 `/studio` closure 파일을 바꾸지 않았고, 23f60ed→최종 사이 변경은 `BrowserStorageSection` 한 파일(ProjectsRoute 청크)뿐인데 −0.01→+0.03으로 움직였다. 원인: 공용 `index-*.js`가 `ProjectsRoute-<hash>`를 2회 담고, `index` 해시가 바뀌면 이를 import하는 36개 청크 내용이 바뀐다. `index` 해시만 무작위 문자열 15개로 바꿔 gzip 합계를 재면 −0.058~+0.027KB 흔들림(재현: dist에서 `D9PND5a3`를 crypto 무작위 8자로 replaceAll 후 gzipSync 합계).
- **Jarvis 판단 요청**: 내용 기여 0이지만 브리프 "129.62 그대로"의 숫자는 +0.03. D2·D4 병합 때도 같은 잡음이 다시 생긴다 — 관문을 "멈춤선 이하"로 읽을지 결정 필요.

## 4. 검증 (fresh 실행)
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npx vitest run` exit 0 — **267 파일 / 2331 테스트 통과** · `npm run build` exit 0(최종 수치 위 표).
- TDD: PROGRESS에 예측 → RED(새 모듈 3파일 import 실패 + ProjectsPage 3건) 예측과 일치 → GREEN. Ego Lite에서 찾은 거절 문장 미표시 → 테스트 먼저 RED 2건 → GREEN. 단언 약화·skip 0 (ProjectsPage "60자 이름" 쿼리는 h2가 2개가 되어 `name: long` 지정 — 단언 동일).
- AC-C07: 경계값 0·104857·104858·12.34MB·1024MB·80%/79%·quota 0/없음·usage 없음 단위 테스트.
- AC-C15: 진입 시 `persist` 호출 0(단위) · 실측에서도 버튼 전 persisted=false, 권한 창 없음.
- AC-C12(W1): 옛 문구 "서버 연결 전" ProjectsPage에서 제거, 테스트 갱신.

## 5. Ego Lite (build + `vite preview --port 4339`, 창 normal 확인, `captureBeyondViewport:false`+clip 3장)
1. `shots/1-empty-projects.png` — 빈 `/projects`: W1 local 문구 "프로젝트는 이 브라우저에 저장됩니다 — …" + 영역(상태 문장·"사용량 0.1MB 미만"·축출 문장·버튼).
2. `shots/2-area-usage.png` — 보드 확정으로 프로젝트 1개 뒤 영역(목록 1행, 사용량 "0.1MB 미만" — 이미지 없는 프로젝트라 작음; AC-C07 "이미지 1장 뒤 증가" 실측은 안 함).
3. `shots/3-persist-result.png` — 버튼 클릭 → Ego Lite(localhost)가 거절 → 보이는 문장 "브라우저가 요청을 받지 않았습니다" + 버튼 유지 · status 낭독 같은 문장 · `role=status` 2개(프로젝트 알림·저장소 알림). 받아들임 경로는 단위 테스트로만.
- 추가 실측(캡처 없음, AC-C10 ii): `studio/state` 봉투에 `schemaVersion: 99` 주입 → 새로고침 → 영역에 1.8 newer 문장 + "새로고침" 버튼, W1 memory 문구, 저장 레코드 99 그대로(쓰기 0).
- 정리: `indexedDB.deleteDatabase("design-studio")` = deleted(blocked 아님 → 영역 연결이 닫혀 있음 확인) · `databases()` 빈 배열 · `finish({keep:[]})` · 내 공간(23)만 사용 · preview 종료, 4339 리슨 0. main 5480·다른 공간 무접촉.
- 미실측: AC-C10 (i) 사설·시크릿 창(blocked) — 단위 테스트로만.

## 6. 남은 것 / 요청
- Codex 검증은 Jarvis 몫(이 레인 실행 안 함).
- 3절 `/studio` +0.03 해시 잡음 관문 해석 결정.
- D4: 영역 4줄(지우기 버튼) 자리 = `BrowserStorageSection` 맨 아래, 영역 `role=status`("저장소 알림") 재사용 가능.
