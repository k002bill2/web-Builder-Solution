# M2C-TODO PROGRESS — T-1(B-M2B-07) · T-2(B-M2C-08)

base `83c06e5` · 기준선 vitest 227파일 2041 · `/studio` 진입 127.07(멈춤 >127.39) · 렌더 JS 84.19 / CSS 8.80

## 테스트 수 예측 (RED 전 커밋)
- T-1: 새 테스트 **0** · 개정 1(`ContactForm.test.tsx` "비활성 모양" → 이름·뜻 개정 + `:disabled` 블록·안내 상자 단언 추가, 기본 규칙 단언 유지). RED = 그 1건 실패. 합계 2041 유지.
- T-2: 새 테스트 **7**(`ImageSlotPanel.test.tsx` 새 describe "IMG-AC-30 (B-M2C-08)"): ① 지우기 초기화+status+포커스 ② 바꾸기 초기화+표 문장+편집 1회 ③ 첫 넣기 유지 ④ 잃은 이미지 다시 고르기 유지+표 문장 ⑤ 바꾸기 실패 유지 ⑥ R-09 바꾸기 뒤 차단·지우기 뒤 0 ⑦ 스위치 끄기 alt 채운 값 유지. RED 예상 = ①②④⑥ 실패, ③⑤⑦ 통과(현재 동작 고정). 합계 2048.

## 체크리스트
- [x] P0: BRIEF·PROGRESS·예측 커밋
- [x] T-1 RED(로그 logs/t1-red.txt)
- [x] T-1 GREEN(kit.css · logs/t1-green.txt)
- [x] T-2 RED(로그 logs/t2-red.txt)
- [x] T-2 GREEN(ImageSlotField.tsx · logs/t2-green.txt)
- [x] typecheck · lint · build(번들 전 행) · 전체 vitest exit0
- [x] Ego Lite: 비활성 폼 1280·390 · 대체텍스트 초기화 캡처 · finish({keep:[]}) · listTaskSpaces()=[] · 서버 종료·리슨 0 — 캡처 7장 완료, 창·서버 정리는 Jarvis가 수행(space 79 닫음·listTaskSpaces()=[]·4337 종료)
- [x] Codex review --scope branch --base 83c06e5 (≤2) — r1 지적 0 (logs/codex-r1.txt)
- [x] REPORT.md

## 재개 기록 (2026-10-06)
- 1차 실행 61/60 턴 한도 종료 → 재개: 로그·shots 커밋 `6206f38` · Codex r1 지적 0 · REPORT 작성.
