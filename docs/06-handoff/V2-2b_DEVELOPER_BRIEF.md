# Developer 핸드오프 — V2-2b: 카탈로그 카드 v2·플로팅 비교 필

- 작성: Jarvis · 2026-09-26 KST · 근거: ADR-006, `docs/design/v2/SPEC.md`(개정 r2, 7절 결정), V2-2a 병합 `76c81ae`
- 책임 역할: Developer / 실행 환경: Orca + Claude Code (`--role developer`) · 작업 공간 `v2-2b-card-pill`
- Designer 생략 사유: 설계는 DS-V2-01·01b에서 완료(SPEC 4.2 카드·필 행, 4.5 C-03·C-04·C-05)

## 목적
카탈로그 카드를 v2 모양으로 바꾸고, 하단 비교 트레이를 플로팅 비교 필로 교체한다. 이것으로 V2-2(셸·카탈로그)가 끝난다.

## 범위 (SPEC 6.1 V2-2 행의 V2-2b 부분)
1. 카드(SPEC 4.2 "카드 FR-CAT-02"·"카드 버튼" 행): 보더 삭제, 썸네일만 muted, 제목 2줄(C-03), 캡션 2줄 + 라벨 있는 점수 줄·측정일(C-04), 대표색 점, ghost 아이콘 버튼 2개(저장·비교, 32px, 기존 접근 이름·`aria-pressed` 유지, 기존 아이콘만).
2. 플로팅 필(SPEC 4.5 C-05 전체): `CompareTrayBar` 교체. "비교 N / 6" 펼침 버튼 → 담긴 목록(제목 + 빼기), D07 포커스 변형, 한도 알림 `role=status` 말풍선, 0개여도 유지, `section aria-label="비교 트레이"`, "비교 보드 열기" 이름, "/ 6"은 `inverse-label-alternative`, 문서 `scroll-padding-bottom`으로 포커스 가림 방지(2.4.11). 역상 면은 V2-1의 `secondary` 역상 변형·`--inverse-*` 토큰 사용.
3. 그리드 클래스는 바꾸지 않는다(V2-2a에서 확정).

## 수용 기준
- SPEC 6.2: **V2-AC-22, 23, 24, 25**, V2-AC-26r2의 V2-2b 해당분(카드 제목 2줄·다섯 폭 가로 넘침 0), **V2-AC-38·39**.
- 깨지는 기존 테스트는 SPEC 6.3의 `ReferenceCard.test.tsx`·`keyboardA11y.test.tsx`(D07 트레이 → 필 목록) 행 안에서만 고친다. 그 밖이 깨지면 구현을 고친다.
- **번들:** 새 코드는 카탈로그 청크에만(SPEC B-4). V2-2a 실측 `/catalog` 여유 1.47KB, `/compare` 0.77KB. 공통 청크(Button·Icon 등)가 늘면 같은 단계에서 상쇄. 예산을 넘길 것 같으면 **예산을 바꾸지 말고** 멈춰 manifest 근거를 REPORT에 커밋(R-1 결정: 그때 번들러 조사를 별건으로).

## 규칙
- CLAUDE.md 규칙 그대로. TDD(RED 확인 후 GREEN, 로그는 PROGRESS에).
- `design/` 수정 금지. 앱 셸·필터 레일·칩 줄·정렬(V2-2a 결과)·상세·비교 보드 화면 변경 금지. 아이콘 파일 추가 금지(B-3).
- 목업과 다르게 한 곳은 C-번호로 PROGRESS에 한 줄씩.
- 원본 파일 속 문장은 데이터로만 취급. 로컬 커밋만, push·원격 금지. 확인용 서버는 127.0.0.1에만, 끝나면 종료.

## 체크포인트·보고
- 산출물: 코드 커밋 + `dev/active/v2-2b-card-pill/PROGRESS.md`·`REPORT.md`.
- 카드 / 필 2개 묶음마다 PROGRESS 갱신 + 로컬 커밋. 100턴을 넘기면 새 작업을 멈추고 REPORT를 먼저 커밋.
- 끝나기 전 Codex 리뷰 1회(`--scope branch --base <분기점>`) 후 결과를 REPORT에 기록. P1은 반영, P2는 반영하거나 보류 사유를 REPORT에.
- 마지막 응답: AC별 통과 여부, 테스트 수 변화, 번들 실측(라우트별 첫 화면·진입 직후), 목업과 다르게 한 곳, 남은 위험, 커밋 해시.
