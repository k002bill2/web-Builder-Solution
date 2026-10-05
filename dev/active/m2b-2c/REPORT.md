# M2B-2c REPORT — 후기·가격·예약·CTA 4변형 (**P1 예산 멈춤 — 구현 전 정지**)

- 책임 역할: Developer · 실행 환경: Orca managed worktree `m2b-2c` + Claude Code (Opus 5.5) · 서브에이전트 0
- 시작 SHA `2369a3e` · 실렌더 **26 그대로**(목표 30 미착수) · 제품 코드(app/) 변경 0 — 커밋은 dev/active/m2b-2c/ 기록만

## 0. 결론
- 브리프 순서대로 P1(예약 공유 시제품 + 부모 최종 목록 30쌍) 예산을 먼저 실측했다. **/studio 진입 직후 +62 B**(127,435 → 127,497) — 레인 증가 한도 **30 B 초과**.
- 압축 표현 2종도 +78 · +81 B로 더 나빴다. 원인은 새 어휘(`testimonials`·`quotes`·`pricing`·`tiers`·`banner`)가 RENDERED_VARIANTS 청크(issue-*.js)에 처음 나오는 것(+38 B)과 그 청크 해시 변경 잡음(≈ +24 B) — 명시 목록으로는 30 B 안에 넣을 수 없다.
- 브리프 "초과 시 멈추고 보고 · 예산 상향 0 · 엔진 registry 신규 import 0(별도 승인)"에 따라 **P2~P5 구현·브라우저 판정·Codex를 시작하지 않았다.**

## 1. 커밋표
| 커밋 | 내용 | 변경 경로 |
|---|---|---|
| 4f8def7 | P0 BRIEF·PROGRESS·REPORT 골격·gate.sh·baseline 로그(1777 exit 0) | dev/active/m2b-2c/ |
| (이 커밋) | P1 예산 실측·멈춤 판정·시제품 diff 보존 | dev/active/m2b-2c/ |

## 2. KD-AC
- 미판정 전부(KD-AC-01~08 합본 · 17~21) — 구현 전 정지.

## 3. 번들 (원문 logs/p1-budget.txt · p1-baseline-bytes.txt · p1-prototype-bytes.txt · p1-chunks-*.txt)
| 항목 | baseline 2369a3e | P1 시제품(나열) | 증가 | 한도 |
|---|---|---|---|---|
| 렌더 문서 JS | 81,671 B | 81,957 B | +286 B | 끝 예상 ≈ 82.6 KB ≤ 89.70 |
| 렌더 문서 CSS | 7,589 B | 7,606 B | +17 B | ≤ 30 KB |
| /studio 첫 화면 | 91,774 | 91,777 | +3 | ≤ 99.40 |
| /studio 진입 직후 | 127,435 B | 127,497 B | **+62 B** | **레인 ≤ +30 B → 초과** |
| 다른 화면(catalog·references·compare·profile·projects) | — | — | +1 ~ +13 B | ±30 B 안 |
- 압축 재측정: 유형별 묶음 객체 +81 B · 공백 문자열 split +78 B.
- 참고(채택 안 함, 별도 승인 필요): 부모 목록을 엔진 `SECTION_DEFINITIONS`에서 파생 → 127,339 B(**−96 B**). issue 청크는 이미 엔진 registry 청크를 정적 import(엔진 ops)하므로 정의 데이터는 /studio 진입에 이미 로드돼 있다.
- baseline 측정값 표기: gate KB 출력 /studio 진입 127.43(127,435 B의 반올림 표기 — Jarvis 127.43 / Developer 2b 127.44와 같은 바이트).
- 되돌린 뒤 재빌드 = 기준 바이트(127,435 · 81,671 · 7,589).

## 4. 공유·명세 차이 (시제품 기준 — 채택 안 함)
- 시제품 ContactForm 공유: `ContactKit`(공유 마크업) + `FormSpec`(안내·legend·칸 배열, 배열 안 배열 = 날짜·시간 한 줄 묶음 `.kit-control-row`). contact/form = 같은 마크업(추출 전후 renderToStaticMarkup 문자열 일치, logs/contact-form-markup-before.txt). 다음 실행에서 재사용 가능(logs/p1-booking-prototype.diff).
- 이전 단언 이관(미착수, 다음 실행 메모): `data/memoryExport.test.ts` FALLBACKS(pricing/tiers-2·testimonials/quotes-2)는 P2(quotes)에서 바로 깨진다 · `components/studio/SectionVariant.test.tsx` "구조 미리보기"(contact/booking) · `render/PageDocument.test.tsx` sampleDoc s-cta(cta-band/banner) 폴백 목록 · `features/studio/canvasCaption.test.ts`. 30/30에서는 엔진 정의 안에 미구현 변형이 없어 폴백 경로는 `no-such-variant` 또는 목록 mock으로만 도달 — 도달성 실측 필요.

## 5. QB
- 미판정(구현 전 정지). 브라우저·서버 기동 0.

## 6. Codex
- 실행 안 함 — 검토할 구현 diff가 없음(기록 커밋만). Codex 미완료로 표기.

## 7. 남은 위험 · 필요한 결정
- **결정 필요(사용자/Jarvis)**: 부모 RENDERED_VARIANTS 30쌍 표현 — (A) 엔진 `SECTION_DEFINITIONS` 파생 import 승인(−96 B, 이미 로드된 청크 · engineImportGuard 허용 여부 확인 필요 · unknown 방어는 그대로 `includes`) 또는 (B) 이 레인 /studio 진입 증가 한도 예외(+62 B, 127,497 ≤ 127,700) 승인. (A) 권장: 바이트가 줄고 30/30 이후 엔진 정의와 자동 동기.
- 전체 vitest: baseline 1회만(198 files · 1777 passed · exit 0, logs/baseline-full-vitest.txt). 마감 전체 vitest는 제품 코드 변경 0이라 실행하지 않음.
- 30/30은 미달성 — M2b 킷 구현 미마감. 모션·폰트·비교·독립 QA(M2B-3~6) 별건.

## 8. 서버
- 기동 0(브라우저 단계 미착수). 4337·4339 LISTEN 확인은 logs/server-check.txt. main 5480 무접촉.
