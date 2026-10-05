# M2C-5 QA 브리프 — M2c 최종 게이트(F2 시안 등급) · 독립 QA

- 역할 QA(구현자와 분리) / Orca managed Claude Code / worktree m2c-5-qa / base `b2da3c4`(M2C-1·2·3S·3·4 병합). `app/node_modules` lock 그대로 `npm ci` 완료.
- 목적: M2c 완료 판정 근거를 **새 실행**으로 만든다. 구현 레인 자체 판정은 참고만. 결함은 고치지 않고 재현·심각도(P0~P3)·증거로 보고.
- 정본: `docs/design/m2c/SPEC.md` 8절 IMG-AC·**9절 QB-1~12**·11절 브라우저 한계, `docs/04-plan/M2C_PLAN.md` 4절(F2 종료 게이트), MQ-M2C.md. 레인 기록: `dev/active/{m2c-1,m2c-2,m2c-3s,m2c-3,m2c-4}/JARVIS_FINAL.md`(특히 M2C-3·4 "이관"), `docs/06-handoff/BACKLOG.md` B-M2C-01·B-M2B-09.

## 범위 (순서 = 우선순위)
1. **QB-1~12 전부** 실측. fixture는 자체 제작만(캔버스 패턴 + 직접 붙인 EXIF·방향 태그, 12MP·41MP·11MB·잘린 파일·형식 위장·SVG 포함 — `dev/active/m2c-5-qa/fixtures/` 생성 스크립트와 함께). 외부 이미지·실사진·크롤링 0.
2. **M2C-3 이관:** Ego Lite 4폭(1280·1024·768·390)에서 이미지 펼침 → 파일 선택 → 실패 문구 → 대체텍스트/장식 → 제거 → 캔버스 반영. Developer REPORT 미갱신이므로 IMG-AC-08·09·11~16 ↔ 테스트 대조표를 QA가 작성.
3. **M2C-4 이관:** 정적 HTML 이미지 육안(QB-8) — 품질 게이트를 통과하는 문서를 앱 안 조작으로 만든 뒤 내보내기(게이트 우회·코드 수정 금지; 통과 문서를 만들 수 없으면 경로와 함께 "환경/데이터 한계"로). 실브라우저 PNG 이미지 포함 3폭 × 5회 높이 동일(QB-9).
4. **시각 회귀 기준선 재생성:** M2B-6 기준선(`dev/active/m2b-6-qa/` 스크립트) 재실행 → 그라디언트→결정적 SVG 변경분을 "의도된 변경"으로 분류해 새 기준선(30×3폭)을 `dev/active/m2c-5-qa/baseline/`에 + 결정성(2회 픽셀 차이 0). 의도 밖 변화는 결함 후보로.
5. **F2 게이트 판정:** 모든 섹션 실렌더 + 폰트 + 모션 + 이미지 슬롯 = 사용자 이미지 또는 자체 그래픽 + 정적 HTML·PNG에 같은 이미지.
6. **B-M2C-01 관찰:** 큰 이미지 문서(보관 한도 근처)로 정적 HTML 내보내기 시 실패 여부·사용자 안내 문구 확인(고치지 말 것).
7. 회귀 게이트: 전체 vitest 기본 1회 exit0·Errors0(부하 타임아웃 시 단독 후 전체 1회), build 번들 표.

## 제약
- 앱 코드·테스트·docs·design·package*.json/lock·CLAUDE.md·scripts 수정 0. 쓰기는 `dev/active/m2c-5-qa/`만. 새 의존성 0. BRIEF P0 명시 커밋.
- **Ego Lite(영환님 지시):** 화면을 실제로 보고 판정, 캡처는 `dev/active/m2c-5-qa/shots/`. 끝나면 이 레인이 연 Ego Lite 창·탭 모두 `finish({keep:[]})`로 닫고 `listTaskSpaces()`=[] 재확인 기록. 앱 안 클릭만(QB-10 새로고침만 예외·기록).
- Safari·Firefox 실측 환경 없음 → "미검증". 모의 결과를 실측이라 쓰지 않음, N/A를 PASS로 쓰지 않음.
- 서브에이전트 0, 4337/4339 loopback·자기 PID cwd 확인 종료·리슨 0, main 5480 무접촉, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리:** 70턴 도달 시 새 측정 중단 → Ego Lite 창 닫기 → vitest → REPORT 마감. REPORT(한국어): meta·QB 표(PASS/결함/환경 한계/미검증 + 증거 경로)·IMG-AC 대조표·결함 목록·기준선 사용법·F2 판정·**M2c Go/조건부 Go/No-Go**·책임/환경.
