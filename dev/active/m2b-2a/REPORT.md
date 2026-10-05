# M2B-2a REPORT — 소개·서비스 4변형

- 책임 역할: Developer · 실행 환경: Orca managed worktree `m2b-2a` + Claude Code (Opus 5.5) · 서브에이전트 0
- 시작 SHA `c22f169` · 최종 SHA: (마감 시 기록)

## 1. 커밋표
| 커밋 | 내용 | 변경 경로 |
|---|---|---|
| 7f3da38 | P0 PROGRESS·REPORT 골격·gate.sh·baseline 게이트 로그 | dev/active/m2b-2a/ |
| 143b88f | P1 cards-masonry 시제품 예산 실측(멈춤 아님) — 시제품 diff 보존 후 되돌림 | dev/active/m2b-2a/ |
| 9504dda | about/text — AboutStory 재사용(레지스트리 1줄) | kit/AboutText.test.tsx · kit/registry.ts · features/studio/renderedVariants.ts · render/PageDocument.test.tsx |
| 5c396f0 | services/list — 새 ServicesList + 공유 머리(servicesHead) · SectionVariant.test 미구현 예시 이관 | kit/ServicesList.tsx·.test.tsx · kit/servicesHead.tsx · kit/kit.css · registry · renderedVariants · PageDocument.test · components/studio/SectionVariant.test.tsx |
| 286c8d3 | services/cards-2 — 공유 ServicesCards(카드 번호 목록) · ServicesCards3 wrapper(출력 cmp 동일) | kit/ServicesCards.tsx·.test.tsx · kit/ServicesCards3.tsx · kit.css · registry · renderedVariants · PageDocument.test |
| a1a14c3 | services/cards-masonry — CSS 다단 · 4변형 공통 KD-AC-06·07·08 테스트 · 실렌더 22 | kit/ServicesCards.tsx·.test.tsx · kit/bodyVariants2a.test.tsx · kit.css · registry · renderedVariants · PageDocument.test · SectionVariant.test |
(경로 앞 `app/src/` 생략. 마감 커밋은 6절 뒤에 추가)

## 2. KD-AC 판정
(작성 중)

## 3. 번들
측정: `npm run build`(gate.sh) KB 표기 + 바이트 정밀 = `/tmp/m2b2a-bytes.mjs`(check-bundle-size.mjs 사본, sizeOf만 바이트 — 저장소 밖). 원문: logs/p1-baseline-bytes.txt · logs/p1-prototype-bytes.txt · logs/final-bytes.txt

| 항목 | baseline c22f169 | P1 시제품 | 최종(a1a14c3 트리) | 증가 | 한도 |
|---|---|---|---|---|---|
| 렌더 문서 JS | 81,125 B (81.13) | 81,218 | 81,310 B (81.31) | +185 B | 멈춤선 89.70 |
| 렌더 문서 CSS | 7,135 B (7.13) | 7,182 | 7,247 B (7.25) | +112 B | ≤ 30 |
| /studio 첫 화면 | 91,776 (91.78) | 91,766 | 91,766 (91.77) | −10 B | ≤ 99.40 |
| /studio 진입 직후 | 127,404 (127.40) | 127,409 | 127,409 (127.41) | **+5 B** | 증가 ≤ 0.03 · ≤ 127.70 |
| 공통 JS | 89,345 | 89,340 | 89,340 | −5 | ±0.03 |
| /catalog 첫/진입 | 99,652 / 102,036 | 99,643 / 102,027 | 같음 | −9 / −9 | ±0.03 |
| /references 첫/진입 | 97,000 / 99,384 | 96,993 / 99,377 | 같음 | −7 / −7 | ±0.03 |
| /compare 첫/진입 | 98,837 / 121,715 | 98,824 / 121,704 | 같음 | −13 / −11 | ±0.03 |
| /profile 첫/진입 | 99,618 / 118,673 | 99,603 / 118,662 | 같음 | −15 / −11 | ±0.03 |
| /projects 첫/진입 | 94,020 / 100,301 | 94,011 / 100,292 | 같음 | −9 / −9 | ±0.03 |
- 부모 쪽 증가 = RENDERED_VARIANTS 문자열 4개(알파벳순 나열)뿐 → 진입 +5 B. 엔진 registry import 0 · 예산·가드 변경 0. 다른 화면 −5~−15 B는 공통 청크 압축 위치 변화(코드 변경은 renderedVariants.ts 4줄).
- 끝 예상(2b·2c 남은 8변형): SPEC 4절 공유 추정 +1.27 ~ 단순 곱 +2.08 → 렌더 JS ≈ 82.6 ~ 83.4 (멈춤선 89.70 아래).
- 단계별 KB(gate 로그): about-text 81.13/7.13 · list 81.23/7.20 · cards-2 81.28/7.21 · masonry 81.31/7.25 (/studio 진입 127.41 · 127.41 · 127.42 · 127.41)

## 4. 공유·명세 차이
### 4.1 공유 구조
- about/text = `AboutStory` 그대로(레지스트리 1줄). 엔진 about/text 슬롯 = heading·body(이미지 슬롯 없음, `bodySections.ts:55`) → `slotImage` undefined → 이미지 꺼짐 about/story와 같은 1단(`data-layout="single"`). [U] KD-AC-09가 outerHTML(data-section 제외) 일치로 증명.
- services 머리 = `kit/servicesHead.tsx`의 `ServicesHead`(list·cards 공유). 카드 = `kit/ServicesCards.tsx`의 `ServicesCards`(카드 번호 목록 `cards` · 변형 class `mod` · 판정 표시 `layout`) — cards-3(`ServicesCards3.tsx` wrapper) · cards-2 · cards-masonry 공유. cards-3 마크업은 리팩터 전/후 바이트 동일(logs/cards3-markup-same.txt, 기본 + 빈 값 문서).
- 스타일 선택자 = class만(`.kit-cards--2` · `.kit-cards--masonry` · `.kit-list` · `.kit-list-item` · `.kit-list-grid`). masonry `data-layout="masonry"`는 SPEC 판정 표시로만 붙이고 CSS에서 쓰지 않음([U] 단언).

### 4.2 명세·목업과 다르게 한 것 / 판단
| 항목 | 내용 | 사유 |
|---|---|---|
| about/text 1단 선택자 | 기존 `.kit-about[data-layout="single"]`(K1-3) 선택자를 그대로 씀 — 새 변형 class로 옮기지 않음 | 기존 about/story 출력·CSS 회귀 보존(브리프 "기존출력회귀보존"). `data-layout`은 KEPT_DATA라 정적 HTML에도 남아 계산 스타일 동등(P-B에서 확인). 7절 "class로 이관"은 이번 새 선택자에 적용 |
| list 768 다단 | `@media (48rem <= width < 64rem)`에서만 `columns: 2` | SPEC 2절: 1280은 목록 칸(7/12)이 좁아 1열, 768만 2열 |
| masonry 카드 간격 | `margin-block-end: s5`(마지막 카드 0) — 다단에서 `gap`은 세로 간격이 아님 | 단 경계의 margin은 조각화에서 잘림(카드 잘림 0은 `break-inside: avoid`) |
| list 항목 글자 | md 이상 `t1`(lead) · md 미만 `t0`(body) | SPEC 3 토큰 표 "lead(넓은 폭) · body(390)" |

### 4.3 이전 단언 이관 (전/후/근거)
| 파일 · 테스트 | 전 | 후 | 근거 |
|---|---|---|---|
| render/PageDocument.test.tsx "레지스트리 = …" | 정확 목록 18쌍 | 정확 목록 22쌍(+about/text · services/cards-2 · cards-masonry · list) · `no-such-variant` 미구현 예시 그대로 | 단계 목표 22 |
| components/studio/SectionVariant.test.tsx 1 "머리 '변형: …'" | `목록형 · 구조 미리보기` 라디오의 설명 = diffSlots 캡션 | `목록형`(접미어 없음) 라디오의 설명 = 같은 캡션 | services/list 실렌더 → 접미어 사라짐. 캡션 단언 그대로 |
| 같은 파일 2 "렌더러 없는 변형 … 구조 미리보기" | services: 목록형·카드 2열·카드 벽돌형 3개 접미어, 접미어 수 3 | services 4변형(카드 3개·목록형·카드 2열·카드 벽돌형) 접미어 없음 + contact: `예약 폼 · 구조 미리보기`(2c 대상), `문의 폼` 접미어 없음, 접미어 수 1 · 머리 `변형: 문의 폼` | services에 미구현 변형이 남지 않음 → 미구현 예시를 contact/booking으로. 규칙(접미어·접근 이름·머리 불변) 단언 수 유지 |
| 같은 파일 3 "고르면 바로 적용 …" | 라디오 이름 `목록형 · 구조 미리보기` | `목록형` | 같음. 알림 문구·포커스·되돌리기 단언 그대로 |
| test/renderedVariants.test.ts | 집합 일치·중복 0·freeze | 변경 0 | — |

## 5. QB
(작성 중)

## 6. Codex
(작성 중)

## 7. 남은 위험
(작성 중)

## 8. 서버
(작성 중)
