# Jarvis 최종 회수 — M2B-4a 폰트 자체 호스팅

- base 254e322 / 최종 HEAD 6b09d44. 실행: ① 101/100 error_max_turns(구현·브라우저 대부분 커밋, woff2 서명 수정 미커밋) → Jarvis 서버 cwd 확인 종료·WIP 0f40de1 ② 사전승인 축소 재개 29턴 success ③ ★A 수정 레인(Codex P2) ④ "추천대로 진행" 위임 수정 레인 2(P2-a, 래퍼 meta 비어 있음 — 커밋·원시로그로 판정). 연속 max_turns 아님.
- 책임: Developer 구현·자체 브라우저 판정 → Codex 3라운드 → Jarvis 소스·자동검증·병합. 독립 QA 아님(M2B-6).

## 결과
- E0: R-1 1안(같은 서버 url()) dev·preview 통과, R-3 PNG data: 폰트 반영(음성 검증 포함), R-5 Pretendard = 공식 v1.3.9 바이트 동일, Noto 원본 google/fonts 커밋 고정·sha256.
- 자산: Kit Sans KR 400/700 합 347,936B, Kit Serif KR 합 715,496B(≤900KB), RFN 사후 검사 0건(nameID 7·11·25 삭제로 해소, 제외 범위 확대 없음), OFL·SOURCE.md. 프로젝트 의존성·lock 변경 0, 서브셋 도구는 저장소 밖 venv.
- 로드: 렌더 문서 kit/fonts.css 6규칙·별칭 스택·font-synthesis none, 정적 HTML·PNG data: 인라인(쓰는 면만)·OFL 고지 주석, 내보내기 글꼴 실패/5초 = 실패(파일 0). woff2 서명 검사로 SPA 폴백 HTML 200 오인 차단(B9 실측 발견, 사전 예측 없이 들어간 사후 기록 수정).
- Codex 1·2라운드 P2 2건(부분 실패 뒤 늦은 성공·폴백 뒤 면별 재측정) 수정 5b8f176·f234a02(TDD 예측→RED→GREEN). 3라운드 새 지적 0.

## Jarvis 새 실행
- typecheck·lint·build exit0, 기본 npx vitest run 3회 각 208파일 1827/1827 exit0, Errors 보고 없음(이번 실행에서는 부하 타임아웃 재현 없음).
- 번들: 렌더 JS 82.87KB / CSS 8.03KB, /studio 첫 91.78 / 진입 127.33KB, /compare 진입 121.70KB. 예산 상향 0.
- Jarvis는 소스 diff·원시 로그를 확인했고 별도 브라우저 재측정은 하지 않음.

## 열린 항목·한계
- P2-b(kit/siteFonts.ts:27): 폴백 섹션 표식이 대응 밖 굵기(700·600)를 요청 → 편집 캔버스 한정. 30/30 이후 폴백은 unknown 변형뿐이고 내보내기는 UNRENDERED_SECTIONS로 차단되어 결과물 글꼴 불일치 없음. BACKLOG B-M2B-04로 이관.
- B9-PNG 4.9초 경계 흔들림(5초 상한에 받기 시간 포함) — 정의 유지, M2B-6에서 측정 여유 확인.
- 운영 정적 호스팅은 woff2에 Origin: null 대응 ACAO 헤더 필요(R-1 전제).
- 정적 HTML 크기(참고): Serif 1.00MB · Pretendard 0.77MB · Sans 0.51MB.
- Chromium만 검증. 모션은 M2B-4b. push·배포 없음, main 5480 무접촉.
