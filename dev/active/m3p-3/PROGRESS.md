# M3P-3 PROGRESS

- [x] P0 BRIEF 커밋
- [x] S0 실측 (번들·썸네일 21장) — 아래 S0 절
- [ ] 카드 썸네일 (RED→GREEN): lazy img · THUMBNAIL_KEYS import() 지연 · 와이어 폴백 · 레이아웃 이동 0 · 실패 복귀(AC-U6) · 생성 조합/미측정(AC-U5)
- [ ] Codex P2-1 트레이 생성 카드 (RED→GREEN)
- [ ] Codex P2-2 빈 팔레트 방어 (RED→GREEN, --check 변화 0)
- [ ] 예산 멈춤선 확인 (/catalog 99.90 · /studio 128.70 · /compare 124.70 · 렌더 변화 0)
- [ ] typecheck·lint·build·전체 vitest exit0
- [ ] Ego Lite 검증 (preview 4337, 캡처 ≤4, finish·listTaskSpaces=[], 서버 종료)
- [ ] Codex review --scope branch --base cdad1e8 (≤2)
- [ ] REPORT

## S0 (코드 변경 전, base cdad1e8+P0, `npm run build` exit 0 — /tmp 로그)
| 행 | 실측 KB | 멈춤선 |
|---|---|---|
| /catalog 첫 화면 | 99.86 | 99.90 (여유 0.04) |
| /catalog 진입 직후 | 102.25 | 124.70 |
| /references/:id 첫·진입 | 97.31 · 99.70 | 124.70 |
| /compare 진입 | 121.97 | 124.70 |
| /profile 첫·진입 | 99.74 · 119.19 | — |
| /projects 진입 | 100.35 | 124.70 |
| /studio 진입 | 128.66 | 128.70 |
| 렌더 JS · CSS | 84.19 · 8.85 | 변화 0 |

- **썸네일 6장(21장 아님)**: 원인 `src/thumbs/entry.tsx` `thumbnailIds()`가 큐레이션 `referenceComparisons`·`referenceDetails`만 읽음 — 생성 `generatedReferenceDetails.ts` 미포함. M3P-2 "자동 포함" 예상과 다름. `src/thumbs/**` 수정 금지라 이 레인에서 고치지 않음 → 생성 카드 = SPEC 5절 "썸네일 키 없음"(와이어). **Jarvis 결정 항목.**
