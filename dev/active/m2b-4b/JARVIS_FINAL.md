# Jarvis 최종 회수 — M2B-4b 모션 L0~L2

- base 8236a2c / 최종 HEAD 15ee60e. worker 101/100 error_max_turns였지만 종료 전 구현·브라우저 판정·전체 suite·Codex R1/R2·REPORT 마감이 모두 커밋되었고 작업 트리 clean·서버 LISTEN 0 → 재실행 없이 회수.
- 책임: Developer 구현·자체 브라우저 판정 → Codex 2라운드 → Jarvis 소스·자동검증·병합. 독립 QA 아님(M2B-6).

## 결과
- kit/motion.css(CSS만, reduced-motion 미디어·data-motion-play 조상 조건, transform/opacity, 반복 1), 렌더 data-motion = min(motion,maxMotion) 첫 화면 3자리만, 정적 HTML만 data-motion-play, PNG 캡처 방어 규칙. 고정 메뉴 script 바이트 불변.
- 브라우저(Developer, Ego Lite Chromium): B1 캔버스 최종 상태, B2 PNG L2=L0 픽셀 차이 0(9조합), B3 정적 HTML 1.0초 최종·reduce/print 즉시 최종, B4 3폭 넘침 0, B5 200%·시트 Esc.
- Codex R1 P2(grid 타일 A 확대 돌출) → 타일 A 확대 제외로 수정 62de09f, R2 결함 0. SPEC 1.4 "타일 A 안쪽 확대" 미구현 = 명세 편차(REPORT 기록).

## Jarvis 새 실행
- typecheck·lint·build exit0, 기본 npx vitest run 3회 각 210파일 1840/1840 exit0.
- 번들: 이번 build 출력 기준(로그 logs/jarvis-final/build.txt). Developer 바이트: 렌더 JS 83,029B(+158, SPEC 추정 대비 +8B) · CSS 8,753B · /studio 진입 +6B · /compare 진입 +29B(±30B 여유 1B, 앱 코드 변경 0 — 청크 해시 변화).

## 한계·후속
- /compare 여유 1B → M2B-5 시작 전 예산 실측 필수(대상 화면이라 ±30B 타화면 규칙과 별도로 /compare 자체 예산 100/125 기준 판정).
- Ego Lite에서 로드 애니메이션 뒤 전환 정지 현상(환경 한계 추정) → 시트 측정은 header만 남긴 사본. Safari·Firefox 미실측. M2B-6 대상.
- Jarvis는 소스 diff·원시 로그를 확인했고 별도 브라우저 재측정은 하지 않음. push·배포 없음, main 5480 무접촉.
