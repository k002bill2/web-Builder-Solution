# M3P-3 PROGRESS

- [x] P0 BRIEF 커밋
- [x] S0 실측 (번들·썸네일 21장) — 아래 S0 절
- [ ] 카드 썸네일 — BLOCKED: 상쇄 3단계 뒤에도 /catalog 첫 화면 100.02 > 멈춤선 99.90(남은 0.12). 브리프대로 구현 멈춤·보고. 작업분은 `thumbnail-over-budget.patch`로 보존, app은 base로 복원
- [x] "생성 조합" Tag(AC-U5 일부) — 썸네일과 분리해 단독 측정 후 유지(+0.04, 99.88)
- [x] Codex P2-1 트레이 생성 카드 (RED→GREEN) — /catalog 99.84(−0.02)
- [x] Codex P2-2 빈 팔레트 방어 (RED→GREEN, --check exit 0·번들 변화 0)
- [x] 예산 멈춤선 확인 — /catalog 99.88 · /studio 128.65 · /compare 121.96 · 렌더 84.19/8.85 (아래 표)
- [x] typecheck·lint·build·전체 vitest exit0 (246 파일 / 2176건)
- [x] Ego Lite 검증 (preview 4337, 캡처 2장, finish·listTaskSpaces=[], 서버 종료·리슨 0)
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

## TDD 기록
### 카드 썸네일 (ReferenceCard.test 새 describe 4건)
- 예측 RED: `thumbnailLoader.ts`는 빈 맵을 돌려주는 스텁(임포트 해소용) → 키 있음·실패 복귀 2건은 img를 못 찾아 FAIL, 생성 조합 1건은 글자 없음 FAIL, 키 없음/로더 실패 1건은 load 미호출로 FAIL. 총 4 FAIL 예상.
- RED 4 FAIL 확인(예측 일치) → GREEN 4 PASS(카드·catalog 74건 통과)까지 갔으나 아래 예산 초과로 커밋하지 않음(빌드 깨진 채 커밋 금지).

### 카드 썸네일 예산 상쇄 기록 (`npx vite build` + `check-bundle-size`, /catalog 첫 화면 KB)
| 단계 | 내용 | /catalog 첫 | CatalogPage 청크 gzip |
|---|---|---|---|
| S0 | base | 99.86 | 6.87 |
| 1 | 카드 img·hook·로더(키 맵만 `import()` 별도 청크 0.18KB) · 생성 조합 Tag | 100.18 | 7.20 |
| 2 | img 요소·alt·경로를 지연 청크로(JSX 반환) | 100.13 | 7.16 |
| 2' | 지연 청크가 JSX 런타임을 import → 카드 청크에 `__vite__mapDeps` 헤더(파일명 4개)가 붙음 → img **속성 객체**만 반환하게 변경 | 100.05 | 7.07 |
| 3 | 로더 객체 파일 제거(카드가 직접 `import()`, 테스트는 `vi.mock`) · 언마운트 가드 제거 | 100.03 | 7.05 |
| 4 | 래퍼 div 제거(생성 조합 Tag는 article 기준) · `z-10` 제거 · role/label 토글 합치기 | **100.02** | 7.03 |

- 결론: 마지막 단계 감소 −0.01 → 다듬기 여지 소진. 남은 수단(트레이 필 펼침 목록 지연·카드 자체 지연 청크)은 첫 화면·포커스 동작을 바꾸는 범위 밖 변경이라 시도하지 않음. **썸네일 연결은 멈춤(남은 0.12KB)** — Jarvis 결정 대기. 썸네일 6장 사실(S0)과 함께 보고.
- 보존: `dev/active/m3p-3/thumbnail-over-budget.patch`(카드·지연 청크 `thumbnailImage.ts`·테스트 4건, 4단계 상태). 빌드 대상 아님.
- 멈춤선 규칙은 항목별 적용: 썸네일 멈춤, P2-1·P2-2는 각자 판정.

### P2-1 트레이 생성 카드 (CatalogGenerated.test 새 1건)
- 확인: `createMemoryReferenceRepository`의 `getById`·`list` 모두 `exposed` 기준 — 카탈로그 저장소로 바꿔도 큐레이션 트레이 동작 동일.
- 예측 RED: `useTrayReferences`가 기본 저장소(큐레이션만)로 `getById` → 생성 id는 undefined → 트레이 제목 없음으로 FAIL(waitFor 시간 초과).

### P2-2 빈 팔레트 (internalCompose.test 새 1건)
- 예측 RED: 팔레트가 AA 미달 1개뿐 → 필터 후 0개 → `build`에서 `palette.primary` 접근 TypeError로 FAIL.
- GREEN: 조기 반환 + 리포트 1줄. `node scripts/generate-internal-refs.mjs --check` exit 0(생성 15개, 픽스처 변화 0). internalCompose는 앱 청크 밖(번들 변화 0).

### P2-1 결과
- RED: 트레이 제목 대기(waitFor 5s)가 테스트 제한 5s에 걸려 시간 초과로 FAIL(원인 = 생성 id `getById` undefined, 예측 일치). GREEN: `useTrayReferences` 저장소 → `useCatalogReferenceRepository()`. catalog·compare 71건 통과.

### "생성 조합" Tag (AC-U5)
- 썸네일 멈춤 뒤 Tag만 단독 측정: article `relative` + Tag `absolute top-9 right-2.5`(와이어 role=img 밖 → 스크린 리더가 읽음). /catalog 99.84 → **99.88**(≤99.90) → 유지.
- Red-Green: 앞선 4건 RED 때 이 테스트는 헬퍼(article 이름) 문제로 실패했으므로 무효 → 카드 구현만 HEAD로 되돌려 "생성 조합 글자 없음" FAIL 재확인 → 복원 PASS.
- "미측정"·`<time>` 0은 M3P-1에서 이미 구현돼 있음(이번 테스트로 단언 추가).

## 최종 번들 (`npm run build` exit 0, fresh)
| 행 | S0 | 최종 | 멈춤선 |
|---|---|---|---|
| /catalog 첫 · 진입 | 99.86 · 102.25 | **99.89** · 102.27 | 99.90 · 124.70 |
| /references/:id 첫 · 진입 | 97.31 · 99.70 | 97.30 · 99.68 | 124.70 |
| /compare 첫 · 진입 | 98.87 · 121.97 | 98.86 · 121.96 | 124.70 |
| /profile 첫 · 진입 | 99.74 · 119.19 | 99.72 · 119.18 | — |
| /projects 첫 · 진입 | 94.05 · 100.35 | 94.04 · 100.34 | 124.70 |
| /studio 진입 | 128.66 | 128.65 | 128.70 |
| 렌더 JS · CSS | 84.19 · 8.85 | 84.19 · 8.85 | 변화 0 |
| 썸네일 | 6장 | 6장 | (21장 아님 — S0) |

## 검증 (fresh)
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0 · `npx vitest run` exit 0 — 246 파일 / 2176건.

## Ego Lite (build + preview 4337, 1280)
- 창 normal(minimized 아님) 확인. goto 1회(/catalog) 뒤 앱 안 클릭만, 새로고침 0. 캡처 `captureBeyondViewport:false` + 뷰포트 clip.
- 카드 21 · "생성 조합" 15(큐레이션 0) · 생성 카드 15 모두 "접근성·성능 미측정"·`<time>` 0.
- 생성 카드("뷰티 · 세련된 센터형") 비교 담기 → 트레이 "비교 보드 1 / 6"·제목·"비교에서 제거" 버튼 표시 → 제거 후 0 (P2-1 실브라우저 확인, `shots/1280-tray-generated.png`).
- **발견·수정**: 첫 확인에서 "생성 조합" Tag(중립 = 반투명 `fill-strong` 바탕)가 와이어 색 블록 위에서 거의 안 보임 → 불투명 `bg-surface-elevated` 래퍼에 얹음(/catalog 99.89, ≤99.90). 재확인 `shots/1280-generated-tag-fixed.png`. 결함 상태 캡처는 남기지 않음(설명으로 대체).
- 리소스 호스트 = `127.0.0.1:4337`만(외부 요청 0). B1(실렌더 썸네일)은 예산 멈춤으로 미연결.
- `finish({keep:[]})` 2회(space 8·9) → `listTaskSpaces()` = [] · preview 종료 → `lsof -iTCP:4337 -sTCP:LISTEN` 결과 없음. main 5480·영환님 창 무접촉.

## Codex
- R1 (`review --scope branch --base cdad1e8`, thread 01a11136…): **수정 필요한 결함 0**. Codex 샌드박스 EPERM으로 vitest 미실행(로컬 fresh 실행으로 대체).
