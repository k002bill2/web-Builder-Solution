# Jarvis 최종 회수 — M2B-5 3안 실렌더 비교

- base 48487d5 / 최종 HEAD 940b833. 실행: ① 49턴 success = S1 멈춤선 초과 중단(/studio 127.50) → 위임 결정 A(DECISION-A.md, 25417e9) ② 재개 92턴 success(S2~S6). max_turns 없음.
- 책임: Developer 구현·자체 브라우저 판정 → Codex 3라운드(R1·R2 P2 수정, R3 0) → Jarvis 소스·자동검증·병합. 독립 QA 아님(M2B-6).

## 결과
- /profile 3안 영역 "3안 실제 화면으로 비교" → 전체 폭 dialog(≥1280 3열, 미만 1안씩), 열마다 sandbox="allow-scripts" 렌더 iframe(inert 감싸개)·상태 7종·Wireframe 폴백·이 안 선택. 저장소 쓰기 0, 렌더 문서·/studio·StructureCanvas 변경 0.
- 결정 A: readRenderMessage·모양 검사 로컬 사본 + 대조 가드(소스 정규화 동일·22종×출처×소스×프레임 코퍼스 동일·음성 검증 1회). 출처/소스 조건 완화 0.
- check-bundle-size.mjs: /profile (3안 있음) 시나리오·비교 afterAction 키 추가만(한도·판정 변경 0).
- 테스트 예측 단계별 RED 전 커밋·실측 일치, 1840→1873(+33). 기존 테스트 수정 0.

## Jarvis 새 실행
- typecheck·lint·build exit0, 기본 npx vitest run 3회 각 216파일 1873/1873 exit0.
- 번들(이번 build 출력, logs/jarvis-final/build.txt). Developer 최종: /profile 첫 99.62 · 진입 119.13(+0.46, SPEC 추정 초과·멈춤선 안) · 3안 있음 121.59 · /studio 진입 127.35 · 렌더 83.03/8.75 · 비교 청크 21.19.
- Jarvis는 소스·원시 로그를 확인했고 별도 브라우저 재측정·캡처는 하지 않음.

## M2B-6 이관 (QA 필수 확인)
- 비교 대화상자 스크린샷 0(CDP 캡처 타임아웃 4회) → QB1·QB2 육안 판독(1280 29% 축소 판독성 포함) 필요.
- B5 프레임 안 모션 최종 상태 직접 측정 불가, B6 선택 실패 경로 브라우저 미실측.
- 키보드 순서: 스크롤 영역(tabIndex=0)이 "이 안 선택"보다 먼저 — SPEC 2.1·4절 충돌. QA가 실사용 판정 후 SPEC 정정 여부 결정.
- 열기 직후 축소 전 1280 프레임 순간 노출 가능성(ResizeObserver 반영 전) — 실사용 영향 확인.
- /studio 멈춤선 ±0.03이 청크 해시 잡음(±1~11B)과 같은 크기 — 판정 흔들림 위험(ADR 개정 사항은 아님, 기록만).
- push·배포 없음, main 5480 무접촉.
