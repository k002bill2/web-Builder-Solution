# M2B-3 REPORT — 모션 L0~L2 · reduced-motion · 폰트 서브셋 명세 (Designer)

- 책임 역할: Designer · 실행 환경: Orca managed Claude Code(Opus 5.5) · worktree `m2b-3` · 브랜치 `k002bill2/m2b-3` · base `0bede09`
- 서브에이전트 0 · 서버 기동 0 · main 5480 무접촉 · push/merge/삭제 0 · 네트워크 다운로드·서브셋 실행 0

## 1. 산출 경로
| 파일 | 내용 |
|---|---|
| `docs/design/m2b/SPEC-MOTION-FONT.md` | 0 코드 전제(C-1~C-11) · 1 모션(레벨·토큰·선택자·30변형표·최종상태 보장·선택 위치·예산) · 2 폰트(대응표·굵기·서브셋·로드 방식·RFN·출처/체크섬/재현 명령) · 3 예산 · 4 MF-AC 23건 + QB 8건 · 5 위험 7건 |
| `docs/design/m2b/MQ-M2B3.md` | 영환님 결정 5건(★안) |
| `dev/active/m2b-3/{BRIEF,PROGRESS,REPORT}.md` · `logs/` | 브리프(P0 커밋) · 체크포인트 · 이 보고 · Codex 원문 |

## 2. 결정 요약
1. **모션 = CSS만, 기본 상태 = 최종 상태.** `@keyframes`는 `from`만, `fill-mode: backwards`, 1회. 속성은 `transform`·`opacity`만, 이동은 세로·rem만, 섹션 루트는 안 움직임.
2. **재생 스위치 `data-motion-play`는 정적 HTML 생성기만 붙인다** → 캔버스·숨은 iframe·PNG는 항상 최종 상태. PNG 캡처 CSS에 모션 정지 방어 규칙 추가.
3. **reduced-motion = L0**: 모든 규칙을 `@media screen and (prefers-reduced-motion: no-preference)` 안에만(인쇄도 자동 L0).
4. **등장은 첫 화면만**(hero + 뒤 본문 2개 = `withMotion`의 L2 자리). L1 = 투명도만, L2 = + 이동·순차(≤3단)·hero 이미지 확대. 최대 0.96초. header = 시트 열림(`@starting-style`)만, footer·faq·contact = 0.
5. **새 필드 0**: 레벨 = 기존 `profile.motion_preset` → `withMotion` → `min(section.motion, maxMotion)`을 렌더가 `data-motion`으로 씀.
6. **폰트 = 프로필 계열 1개 × 굵기 ≤2(400·700)**, 고르지 않은 계열 0. 서브셋 KS X 1001 2,350 + 고정 기호 224자, woff2, `font-display: swap`, `local()` 0, `font-synthesis: none`.
7. **RFN**: Noto 2종 = 직접 서브셋 + 새 이름 `Kit Sans KR`·`Kit Serif KR`(name ID 1·2·3·4·5·6·16·17 교체, 0·13·14 보존, 사후 검사 0건). Pretendard = 업스트림 공식 서브셋 무수정(이미 저장소에 있는 2파일 재사용, sha256 대조 선행).
8. **로드**: 렌더 문서 = `kit/fonts.css` `url()`(CORS 막히면 ArrayBuffer `FontFace` 2안) · 정적 HTML·PNG = 쓰는 굵기만 `data:` 인라인 + 정적 HTML `<head>`에 저작권 + OFL 1.1 전문 주석.
9. **예산**: 렌더 JS 82.28 → 약 82.3~82.7(멈춤선 89.70) · CSS 7.82 → 약 9.4~10.2(30) [추정] · `/studio` 진입 +0 · 내보낸 사이트 폰트 ≤ 2파일 · woff2 합계 ≤ 900KB(실측 후 재확정).

## 3. MQ 목록 (MQ-M2B3.md)
| # | 질문 | ★추천 |
|---|---|---|
| 1 | 등장 모션 정책 | A 첫 화면 3섹션만 1회(정적 HTML에서만) |
| 2 | 서브셋 범위 | A KS X 1001 2,350 + 기호 |
| 3 | 정적 HTML 폰트 탑재 | A `data:` base64 인라인 |
| 4 | Pretendard 원본 방식 | A 업스트림 공식 서브셋 무수정(이름 유지) |
| 5 | 캔버스 모션 미리보기 | A 없음(캔버스 = 최종 상태) |

## 4. 사실 / 추정 / 확인 필요
- **사실 [L1]**: 정적 HTML `data:`만 허용(`assertNoExternalCss`) · `KEPT_DATA` 밖 `data-*` 제거 · 고정 메뉴 스크립트 1개 · PNG = SVG foreignObject `data:` 이미지 · 렌더 iframe `sandbox="allow-scripts"` · 가드 3개(`renderFonts.test.ts` B8 · `kitGuard.test.ts:29` · `kitTokens`) · `withMotion`·`maxMotion` 존재 · 프로필 계열 1개 · 픽스처 굵기 700/400 · Pretendard 서브셋 267,096~270,784B · KS X 1001 한글 2,350자(로컬 Python) · 렌더 JS 82.28/CSS 7.82(m2b-2c REPORT).
- **추정 [L3]**: Noto Sans KR 250~300KB·Serif 330~450KB/굵기 · 11,172자 0.8~1.2MB · 모션 CSS +1.2~2.0KB · 정적 HTML 크기 · OFL 전문 4.4KB.
- **확인 필요(M2B-4 E0)**: 불투명 출처 iframe 폰트 CORS(R-1) · SVG 이미지 안 `data:` 폰트 반영(R-3) · `@starting-style` 지원판(R-4) · 저장소 Pretendard = 공식 ZIP 바이트(R-5) · google/fonts 파일명·커밋 · `pyftsubset` `--name-IDs` 기본값.

## 5. 남은 위험
R-1~R-7(SPEC 5절). 가장 큰 것: R-1(캔버스 웹폰트 CORS) · R-2(Noto Serif 크기) · R-3(PNG 폰트).

## 6. 검증
- 금지 범위: `git diff --stat 0bede09..HEAD` = `docs/design/m2b/` 2파일 + `dev/active/m2b-3/` 파일만(코드·바이너리·lock·`docs/decisions/`·CLAUDE.md 0).
- Codex: (7절)
- 코드 변경 0이라 typecheck·lint·test·build는 실행하지 않음(문서 전용 레인).

## 7. Codex 검증
(작성 중)
