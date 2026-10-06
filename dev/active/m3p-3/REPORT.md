# M3P-3 REPORT (초안 — Ego Lite·Codex 진행 중)

## 1. 결론
- **카드 실렌더 썸네일 img: 멈춤(BLOCKED)** — 상쇄 4단계 뒤에도 `/catalog` 첫 화면 **100.02KB > 멈춤선 99.90**(남은 0.12KB). 브리프대로 구현을 멈추고 작업분을 `thumbnail-over-budget.patch`로 보존, 앱 코드는 base로 복원. 예산 상향 요청 없음.
- **S0 사실: 썸네일은 6장(21장 아님)** — `src/thumbs/entry.tsx` `thumbnailIds()`가 큐레이션 `referenceComparisons`·`referenceDetails`만 읽어 생성 15개는 키가 없다. `src/thumbs/**` 수정 금지라 그대로 둠 → 생성 카드는 SPEC 5절 "썸네일 키 없음"(와이어).
- **완료**: Codex P2-1(트레이 생성 카드 누락) RED→GREEN · P2-2(빈 팔레트 예외) RED→GREEN · "생성 조합" Tag(AC-U5) Red-Green. `/catalog` 99.88 · `/studio` 128.65 · `/compare` 121.96 · 렌더 84.19/8.85(변화 0).
- 해석: 멈춤선 규칙을 항목별로 적용했다(썸네일 멈춤, Tag·P2-1·P2-2는 각자 판정).

## 2. 변경 파일
- `app/src/features/compare/useTrayReferences.ts` — 저장소 `useReferenceRepository` → `useCatalogReferenceRepository`(큐레이션+생성, 노출 규칙 동일 확인)
- `app/src/domain/internalCompose.ts` — 팔레트 0개 조기 반환 + 리포트 1줄
- `app/src/components/catalog/ReferenceCard.tsx` — article `relative` + 생성 레퍼런스 "생성 조합" Tag(와이어 `role="img"` 밖이라 스크린 리더가 읽음)
- 테스트: `CatalogGenerated.test.tsx`(+1) · `internalCompose.test.ts`(+1) · `ReferenceCard.test.tsx`(+1)
- 문서: `dev/active/m3p-3/{BRIEF,PROGRESS,REPORT}.md`, `thumbnail-over-budget.patch`

## 3. 썸네일 상쇄 기록 → PROGRESS "카드 썸네일 예산 상쇄 기록" 표
99.86 → 100.18 → 100.13 → 100.05 → 100.03 → 100.02. 실측 교훈: 지연 청크가 JSX 런타임을 import하면 카드 청크에 `__vite__mapDeps`(파일명 목록) 헤더가 붙는다 → 지연 청크는 속성 객체만 돌려주게 해야 한다. 남은 수단(트레이 필 펼침 목록 지연·카드 지연 청크)은 첫 화면·포커스 동작을 바꾸는 범위 밖이라 시도하지 않음.

## 4. 번들 · 검증 → PROGRESS "최종 번들"·"검증" 절
`npm run typecheck`·`lint`·`build` exit 0 · `npx vitest run` 246 파일 / 2176건 exit 0.

## 5. 목업·명세와 다르게 한 부분
- 카드 썸네일 img·`THUMBNAIL_KEYS` 지연 연결·실패 복귀(AC-U6) 미연결 — 예산 멈춤.
- "생성 조합" Tag 위치: 라이선스 Tag 아래(article 기준 absolute). 사유: 와이어 `role="img"` 안에 두면 읽히지 않음(SPEC 7절).

## 6. Jarvis 결정 필요
1. 썸네일 연결 0.12KB 초과 처리(패치 4단계 상태가 기준).
2. 생성 15개 썸네일 포함 — `src/thumbs/entry.tsx` 대상 목록 변경 허가 여부.
