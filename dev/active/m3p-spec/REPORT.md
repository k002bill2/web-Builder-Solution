# M3P-0 REPORT — M3′ internal 조합 생성기 + 카탈로그 실렌더 썸네일 명세·계획

- 역할 Designer · 브랜치 `k002bill2/m3p-spec` · base `f21ce19` · 코드 변경 0 · 서브에이전트 0 · push/merge 0

## 1. 산출물
| 파일 | 내용 | 커밋 |
|---|---|---|
| `dev/active/m3p-spec/BRIEF.md`·`PROGRESS.md` | P0 | `9091fea` |
| `docs/design/m3p/SPEC.md` r1→r2 | 사실 14건(L1)·번들 실측·조합 규칙(축·상한·결정성·중복 제거·게이트)·썸네일 4안 트레이드오프(★빌드 시 SVG foreignObject 실렌더)·카드 UI·상태·접근성·M3P-AC U8/G5/B5·QB 6·깨질 테스트·예산 배치·위험 | `3531777` |
| `docs/04-plan/M3P_PLAN.md` v1 | 레인 4개(1·2 병렬, 쓰기 경로 겹침 0)·시간 추정·QA 게이트(Ego Lite 캡처 방식)·멈춤 조건 | `3531777` |
| `docs/design/m3p/MQ.md` | 결정 7건(★추천, 기동 차단 = 1·2·3·7) | `3531777` · r2 `011c8f3` |

## 2. 핵심 사실 (L1)
1. 레퍼런스 6개 — FR-CAT-02 카드 필드 누락 0, 썸네일만 팔레트 와이어. 진짜 공백은 FR-CAT-06(6/20).
2. 번들(`npm run build` exit 0): `/catalog` 첫 화면 **99.65/100**(여유 0.35) · 진입 102.04/125 · `/references/:id` 97.00/99.38 · `/compare` 진입 **121.70/125** · 렌더 JS 84.19/90 — 브리프 수치와 일치.
3. 카드·상세 픽스처는 `main.tsx`가 **모든 라우트에서** 자동 로드(gzip 0.97·1.41KB) — `/studio` 진입 128.62(판정선 128.70, 여유 0.08). 생성 데이터를 기존 파일에 붙이면 전 라우트가 늘어 즉시 초과 → 별도 조건부 청크 + 라우트 쪽 로더(MQ-7, 기동 차단). (r1에서 놓쳤고 Codex가 찾음)
4. 카드 iframe 실렌더는 M2B-5 SPEC이 이미 기각(축소율 19%·예산). pngCapture 청크 +10.05KB.
5. 킷·PageDocument에 effect·window·document 사용 0 → 서버 렌더 기반 정적 SVG 썸네일이 새 의존성 없이 가능할 가능성(실동작은 M3P-2 S0 스파이크로 확인).
6. TRD 4.1에 `source_kind`·`thumbnail_key` 이미 정의. 베타 5업종 제안과 코드 `IndustryId` 불일치(제조·IT 없음).

## 3. 검증
- 화면 확인(Ego Lite): **생략** — 사유 PROGRESS 참조. preview 서버·Ego Lite 미기동.
- `npm run build` (app/) exit 0 — 번들 수치 2절(L1).
- `lsof -iTCP:4337 -sTCP:LISTEN` 결과 없음(exit 1) — 리슨 0. `git status` 깨끗(`app/dist`는 무시 대상).

## 4. Codex (실제 완료만)
- **r1 adversarial-review** `--scope branch --base f21ce19` — 완료, Verdict **needs-attention**:
  1. [P1] 픽스처가 전 라우트 자동 로드인데 예산 표가 /compare 비교분만 계산 → **반영**(SPEC 6절 전면 수정, MQ-7 재작성·기동 차단, F5 정정). L1 재확인: `main.tsx:20~21`, `check-bundle-size.mjs:29·93~131`.
  2. [P2] SSR 문자열을 XHTML로 감싸면 `Media.tsx` 중첩 svg 네임스페이스 손실 → **반영**(네임스페이스 보존 직렬화 계약 + AC-G6 + S0 통과 조건).
  3. [P2] AA 게이트가 실제 버튼 글자색(흰색 고정 ON_PRIMARY) 미검사 → **반영**(2.6-3 = 기존 runGate 대비 행 그대로). L1: `contrast.ts:9`·`kit/tokens.ts:11`.
  - 자체 추가: kit.css `@media` 42개 → SVG-in-img 평가 함정(SPEC 3절 A, S0 필수 확인).
- **r2: 미실행** — 사유: 90분 시간 상한(r1이 약 25분 소요). r2 수정분(011c8f3)은 Codex 미검증 상태다.

## 5. 남은 일 · 영환님 필요
- MQ-M3P-1·2·3·7 결정(레인 기동 차단). 4~6은 추천안으로 진행 가능.
- r2 수정분 Codex 재검토(다음 레인 기동 전 1회 권장).
- 경계 준수: GDWEB·dbcut 접속·크롤링 0 · 외부 이미지 0 · APFS 0 · 코드·lock·CLAUDE.md·decisions·BACKLOG 수정 0 · 서브에이전트 0 · push/merge/삭제 0.
