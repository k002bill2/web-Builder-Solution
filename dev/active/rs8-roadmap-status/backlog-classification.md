# 3. 열린 백로그 분류 (`docs/06-handoff/BACKLOG.md` @ 494a7c6f)

분류: **(a)** 다음 단계에 흡수 · **(b)** 별건 유지 · **(c)** 닫아도 됨(근거). "열림" = 결정/ID 열에 ✅ 닫힘이 없거나 🔶 부분 · ⏳ · ⏸ · 미정인 행. 문서상 열림이지만 실제는 닫힌 행은 (c)로 표시하고 BACKLOG 갱신만 권한다(이 레인은 docs 수정 0).

| ID | 남은 것(요지) | 분류 | 근거 / 흡수 대상 |
|---|---|---|---|
| B-M2B-05 | 3안 `axes.typeScale`을 편집 문서·킷 토큰까지 전달(엔진 계약·저장 검증·내보내기 변경) | **(a)** 후보 B(M2b 잔여) | `typeScale`은 `domain/composeCandidates.ts`·`domain/generation.ts`·`features/profile/CandidateCard.tsx`에만 있음 — `kit/`·`engine/` 0건(grep, 사실). 엔진 계약 변경이라 사전 결정 필요 |
| B-M2B-09 | M2B-6 QA 미검증 QB·MF-AC·CMP 다수 + Safari·Firefox | **(a)** 후보 A의 QA 레인(4.5 릴리스 게이트) | 실측 환경 문제(Ego Lite 렌더 정지). 릴리스 게이트에서 브라우저 매트릭스로 한 번에 재검하는 것이 맞음 |
| B-M2C-01 | `HTML_MAX` 8,000,000자 < 이미지 보관 30MB → 큰 문서 정적 HTML 실패 가능 | **(a)** 후보 A(4.2 내보내기) | `render/htmlMessage.ts:8` 그대로(사실). BACKLOG 결정 열 자체가 "렌더 쪽 레인 또는 M4 zip" |
| B-M2C-03 | ⏳ QB-10 잃은 이미지 — ADR-007 P1 레인으로 해소 예정 | **(c)** | ADR-007 P1·P2 완료 기록(`ed73cc80` "영속 트랙 마감" · `60092712` P1d) · `data/persistence/idbPersistence.ts` 존재. 새로고침 = 프로젝트 소실 전제가 사라짐. QB-10 재검은 B-M2C-09 ①로 이미 PASS |
| B-M2C-09 | ③ 캔버스 픽셀 대조(교차 출처 iframe 환경 한계)만 남음 | **(a)** 후보 A 4.1 시각 회귀 또는 **(c)** | ①·② 닫힘. ③은 도구 한계 — 3뷰포트 스크린샷 게이트(4.1)를 만들면 같은 수단으로 해소, 안 만들면 "수단 없음"으로 닫음 |
| B-ER-01 | RS-AC-08d IDB 쪽 미단언 | **(b)** 테스트 보강 별건(소) | `docs/design/restart/INTEGRATE-6.md:407` "범위 밖 — BACKLOG B-ER-01 행에서 처리". 단위 테스트 1건 규모 |
| B-ER-08 | 문서상 "FIELD-UNDO-2·FU-BLUR 미병합" · FU-QB-3 한글 IME 수동 1회 | **(c)** + 잔여 1건 (a) | `a4766b5`·`f4b95da`(FIELD-UNDO-2) · `8a9e409`(FU-BLUR) 모두 origin/main 조상(`git merge-base --is-ancestor`, 사실) · `8497c884` "기준선 FU-BLUR 포함". 남은 FU-QB-3 IME 수동 1회는 릴리스 게이트 QA 체크 항목으로 흡수 |
| B-ER-09 | <1280 "스냅샷" 버튼을 더보기로 이동 | **(b)** | `/studio` 진입 변경 → B-RS-06 규칙(착수 때 감량/ADR 개정 결정). 현재 여유 0.47(128.66/129.13). UX 다듬기 레인(`rs8-ux-polish-spec`)과 겹칠 수 있음 — 그쪽 산출물 확인 필요(미확인) |
| B-M3P-03 | GEN-MARK-IMPL "병합 대기" | **(c)** | `67e5e1c8 merge: GEN-MARK-IMPL` origin/main(사실) |
| B-M3P-04 | 썸네일 재요청 — 운영 캐시 정책에서 확인 | **(b)** M5/배포 시 | 호스팅 미정(M5). 배포 전엔 판정 불가 |
| B-GM-03b | `/profile` 출처 목록 라이선스 영문 원값 | **(b)** 또는 후보 B 흡수 | `/profile` 예산 99.53/100(여유 0.47). 한국어 맵 재사용 — 소규모. 후보 B가 `/profile`을 건드리면 같이 |
| B-RS-03 | `PendingStart` 실화면만 남음 → B-RS-16 | **(c)** (B-RS-16으로 이관) | 행 자체가 "남은 것 → B-RS-16"으로 넘김 |
| B-RS-08 | L1 U14-b 검출 테스트 미확보(Low) | **(b)** | RS7-C에서 Low 판정 · 제품 영향 0 |
| B-RS-09 | stale 탭 행 첫 문구 — 잠금 없는 `peek`/reason 필드 필요 | **(b)** (병렬 레인 `rs8-row-reason` 담당 추정) | 재개 조건이 새 인터페이스(승인 필요). 레인 이름상 RS8 병렬 레인이 다루는 것으로 보임(미확인) |
| B-RS-10 | 폐기 시간 초과 시 alert 2개 | **(b)** UX 다듬기 묶음 | 문구/역할 정리 — `rs8-ux-polish-spec`와 겹칠 가능성(미확인) |
| B-RS-11 | 편집기 `role=status` 2개 | **(b)** UX 다듬기 묶음 · 또는 후보 A 4.1(a11y) | a11y 정리. `/studio` 진입 영향 가능 |
| B-RS-12 | 390 상태 줄·"버리고 새로고침" 화면 밖 | **(b)** UX 다듬기 묶음 | 레이아웃(sticky) — `/studio` 진입 CSS 영향 |
| B-RS-13 | 폐기 대화상자 390 Tab 2회째 BODY | **(c)** 후보(추정) / 실기기 1회 확인 | 네이티브 `showModal` 순환이 브라우저 UI로 나가는 동작이면 정상(WAI-ARIA APG 허용 범위). 추정이라 QA 1회 확인 뒤 닫기 권장 |
| B-RS-14 | `/compare` 조작 뒤 `memoryProfileAdjust` +0.66 · 판정 밖 | **(c)** | 판정 밖 지표 · 의도된 상쇄 대가(M2d). 기록 유지로 충분 |
| B-RS-16 | `PendingStart` 실화면 미관측 — 주입 없이 경로 없음(추정) | **(c)** 또는 (b) | 단위 대체 `ProjectsRowPriority.test.tsx`(RS7-M1)로 가드됨. 실화면 생성 수단이 없으면 "단위 가드로 수용" 닫기 권장 |
| B-RS-19 | ① 미리보기 잠금 passive effect 창 ② 미재현 flaky 후보 2 | **(b)** | ① 이론상 창·미재현 ② 미재현. 재발 시 재개 |
| B-QA-01 | QA 턴 예산·Ego 캡처 요령 | **(c)** (운영 메모) | 브리프 작성 지침 — 작업 항목 아님. 4.6 운영 문서로 옮기면 (a) |

닫힌 행(✅ 표기 · 이 분류 대상 아님): D-QA01, B-DET-01·02, B-DOC-01, B-M2B-01~04·06~08, B-M2C-02·04~08, B-TEST-01, B-ER-02~07·10·11, B-M3P-01·02·05~08, B-GM-01~03, B-RS-01·02·04~07·15·17·18. 취소: B-DET-03, B-QA-01(구, 취소된 px 측정 — 같은 ID가 2번 쓰임: 210행 취소 · 242행 운영 메모).

요약: (a) 흡수 4(B-M2B-05→B · B-M2B-09·B-M2C-01·B-M2C-09③→A) + 잔여 1(FU-QB-3→A QA) · (b) 별건 10 · (c) 닫아도 됨 7(B-M2C-03·B-ER-08 본체·B-M3P-03·B-RS-03·B-RS-14·B-RS-16·B-QA-01(운영)) + 확인 후 닫기 1(B-RS-13).
