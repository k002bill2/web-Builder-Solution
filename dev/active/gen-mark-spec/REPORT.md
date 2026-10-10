# GEN-MARK-SPEC REPORT — B-M3P-03 (Designer · 2026-10-10)

## 1. 요약
- 산출물: `docs/design/gen-mark/SPEC.md`(r1) · `docs/design/gen-mark/MQ.md`(4건) · 캡처 `dev/active/gen-mark-spec/shots/` 3장.
- 설계 결론(★추천 기준):
  1. 카드: 라이선스·"생성 조합" Tag를 썸네일 **밖, 제목 위 "출처 줄"**로 이동 → 썸네일 header 내비·CTA 겹침 0(MQ-GM-1 A).
  2. 상세: h1 옆에 카드와 같은 부품으로 "생성 조합" Tag + 설명 한 줄 "섹션 라이브러리를 조합 규칙으로 자동 생성한 레퍼런스입니다."(MQ-GM-2 A).
  3. 스크린리더: 카드 라이선스 Tag `aria-hidden` 해제 + sr-only 접두 "라이선스"(Tag 밖 형제)(MQ-GM-3 A).
  4. 비교 보드 열 머리 표식은 범위 밖 → BACKLOG 후보(MQ-GM-4 A).
- 예산: `/studio`·`/profile`·`/projects`·`/compare` 영향 0(진입 closure 무접촉, `referenceDisplay.ts`·`Tag.tsx` 수정 금지 명시). `/catalog` 100.25 · `/references/:id` 97.68(Codex 시제품 실측) — 멈춤선 100.90·예산 100 안. 예산 상향 0.

## 2. 커밋 (로컬만, push·merge 0)
| 해시 | 내용 |
|---|---|
| `721a20b` | PROGRESS 체크리스트 |
| `f1a845e` | SPEC r1 초안 + 캡처 3장 |
| `e2e6375` | MQ 4건 |
| `b38ee87` | SPEC `/catalog` 멈춤선 100.90 정정(ADR-004 개정 7) |
| (이 커밋) | REPORT · PROGRESS 완료 · SPEC 8절 Codex 실측 반영 |

## 3. 검증 (실행 결과)
- `npm ci` · `npm run build` (app/) → **exit 0**. 라우트 실측: `/catalog` 100.07/101 · `/references/:id` 97.32/100 · `/profile` 99.87/100 · `/studio` 진입 129.28/130(멈춤 > 129.65).
- `npx vite preview --host 127.0.0.1 --port 4351 --strictPort` → Ego Lite space 5, 뷰포트 1280·1024·390 (CDP override). 캡처: `01-catalog-1280.png` 181438 B · `02-catalog-390.png` 58025 B · `03-detail-gen-1280.png` 88855 B. 카드 폭 실측 305.7 / 338.5 / 343px. `finish({keep:[]})` 완료, `lsof tcp:4351` 비어 있음 확인. 영환님 창·main 5480 무접촉.
- 코드 0 증거: `git status --short` 깨끗 · `git diff --stat 18e5e12..HEAD` = `docs/design/gen-mark/`·`dev/active/gen-mark-spec/`만(빌드가 추적 파일을 바꾸지 않음).

## 4. Codex 검증
- `codex-companion adversarial-review --scope branch --base 18e5e12` (SPEC·MQ 대상). 결과·반영은 아래에 기록.

- 1라운드 결과: **Verdict approve · No material findings** (thread `01a1263b-370b-7741-abee-b3b8edc13cba`).
- Codex가 추천안 시제품을 메모리 빌드(파일 쓰기 0)로 재서 `/catalog` **100.25** · `/references/:id` **97.68** — 내 추정(+0.03~0.10 / +0.08~0.15)보다 크지만 멈춤선 100.90·예산 100 안. SPEC 8절에 실측값 추가.
- Codex 한계 고지: 테스트 실행·실제 스크린리더 검증은 하지 않음 → 구현 레인 GM-AC-U*·E*로 확인.
- 라운드 상한 규칙상 지적 0이라 추가 라운드 없음.

## 5. 목업과 다른 점 (ADR-003)
- 목업은 라이선스 Tag를 썸네일 우상단에 얹는다 → 실렌더 썸네일에서 그 자리가 header CTA라 정보를 가리므로 썸네일 밖 출처 줄로 이동.

## 6. BACKLOG 후보 (이번 레인은 BACKLOG 수정 0 — 기록만)
- 비교 보드 `ColumnHeader`에 "생성 조합" 표식 없음(`components/compare/ColumnHeader.tsx:63-66`) — MQ-GM-4.
- 상세 메타 줄 `buildNote`에 내부 버전 문자열 "internal-compose-1" 노출(`domain/internalCompose.ts:189`).
- 라이선스 Tag가 영문 원값(`internal`/`licensed`) 그대로 노출 — 한국어 표기 검토.

## 7. 남은 것 · 필요한 결정
- **기동 차단: MQ-GM-1**(카드 구조) — Developer 레인 기동 전 영환님 결정 필요. MQ-GM-2~4는 레인 중 결정 가능.
- 서브에이전트: 분할 안 함(조사 규모가 작아 메인 직접).
