# M2B-4a Developer 브리프 — 폰트 자체 호스팅(E0 실측 · 서브셋 자산 · 로드 · 내보내기 실패 정책)

- 역할 Developer / Orca managed Claude Code / worktree m2b-4a / base `254e322`(30/30 + M2B-3 명세 병합).
- 정본: `docs/design/m2b/SPEC-MOTION-FONT.md` 0절·2절·3절·4절(폰트 MF-AC)·5절, `MQ-M2B3.md`(1~5 모두 ★A 확정). 모션(1절, MF-AC-U1~U5·G1·B1~B5)은 **M2B-4b 범위 — 이번 구현 0**.
- 영환님 결정: 원본 OFL 서브셋 woff2 + 라이선스 저장소 커밋, npm 폰트 패키지 0. 서브셋 도구는 **저장소 밖**에서만.
- baseline: suite 205파일 1802 · 렌더 JS 82.28KB · CSS 7.82KB · /studio 첫 91.78 · 진입 127.34KB · /compare 진입 121.72KB(±30B 여유 4B 주의).

## 순서 (단계마다 PROGRESS 갱신 · 명시 경로 커밋)
- **P0** BRIEF·PROGRESS·REPORT 골격·gate, worktree app `npm ci`(lock 불변), baseline 전체 suite·바이트 기록.
- **E0 실측(구현 전, 결과로 분기)**
  1. R-1: 불투명 출처 렌더 iframe(`sandbox="allow-scripts"`)의 같은 서버 woff2 `@font-face` 요청이 Vite dev(4337)와 운영 빌드 preview에서 로드되는지. 통과 → SPEC 2.4 1안, 막힘 → 2안(ArrayBuffer `FontFace`). 2안도 SPEC 범위 안이므로 별도 승인 불요. 둘 다 실패면 멈춤 보고.
  2. R-3: SVG foreignObject 이미지 안 `data:` 폰트가 PNG에 실제 반영되는지(MF-AC-B6 음성 검증 포함).
  3. R-5: 저장소 `app/src/assets/fonts/Pretendard-{Regular,Bold}.subset.woff2` sha256을 공식 릴리스(커밋/태그 고정 URL) 서브셋과 대조. 불일치면 공식 파일로 교체 여부를 멈춤 보고(임의 교체 금지).
  4. google/fonts Noto Sans KR·Noto Serif KR 원본을 **커밋 해시 고정 URL**로 받고 sha256 기록.
- **P1 자산**: 저장소 밖 venv(예: `$TMPDIR`/scratch)에 fonttools·brotli 설치 — 프로젝트 의존성 추가 0. SPEC 2.5·2.6 재현 명령으로 `Kit Sans KR`·`Kit Serif KR` 400·700 서브셋 생성, RFN 이름 교체·사후 검사 0건 출력을 `SOURCE.md`에 기록, OFL.txt 동봉. 실측 크기를 3.2 예산표에 기록(Noto Serif가 ≤900KB 넘으면 멈춤 보고).
- **P2 렌더 문서 로드**: `kit/fonts.css`(또는 2안), `fontStack`·별칭·`font-synthesis: none`, 굵기 대응(MF-AC-U6~U8, G2), 폰트 로드 뒤 rects·편집 캔버스 3초 폴백·늦은 로드 재전송(B7).
- **P3 정적 HTML**: 프로필 계열 1개·쓰는 굵기만 `data:` 인라인, `font-display: swap`, `local(` 0, 저작권·OFL 1.1 전문 주석(U7, G4), 네트워크 폰트 요청 0.
- **P4 PNG·실패 정책**: 캡처 CSS에 같은 `data:` 폰트, 로드 완료 뒤 측정, 실패/5초 초과 = 내보내기 실패(파일 0·사용자 문구), 4.9초 성공(B9).
- **P5 가드·마감**: G3·G5·G6, check-bundle-size(B8). 브라우저 [B] B6·B7·B9·3폭·200% 글자 캡처, 정적 HTML 계산 스타일 동등성(CSS 원문). 전체 vitest 기본 1회 exit0·Errors0, Codex branch review base 254e322 1회 실제 완료.

## 제약
- 새 테스트 수는 각 단계 RED **전에** PROGRESS에 예측 커밋. 단언 약화·skip 금지, 기존 단언 이관은 전후·근거표.
- 렌더 JS 멈춤선 89.70·CSS ≤30, `/studio` 진입 증가 ≤30B(원칙 0), 다른 화면 ±30B(`/compare` 여유 4B — 넘으면 멈춤). 예산 상향·ADR·check-bundle-size·가드 완화 금지(G2는 SPEC이 정한 개정만).
- 고정 메뉴 script 바이트 불변, KEPT_DATA 변경은 SPEC 명시분만, `allow-same-origin` 금지, 외부 URL·CDN 0(다운로드는 원본 취득 단계만).
- package*.json/lock·CLAUDE.md·docs/design·docs/decisions 수정 0. 저장소에 venv·서브셋 스크립트 커밋 0(재현 명령은 SOURCE.md).
- 서브에이전트 0, 포트 4337/4339 loopback·자기 PID cwd 확인 종료·lsof 0, main 5480 무접촉. push/merge/삭제 0. 승인 실패·차단 시 우회 금지.
- 70턴부터 새 범위 확장 금지·검증/REPORT 마감 우선. REPORT(한국어): 실제 meta·E0 결과/분기·커밋표·MF-AC별 근거·폰트 실측 크기·번들 baseline/최종 바이트·test delta 예측 대비·Codex·한계·책임/환경.
