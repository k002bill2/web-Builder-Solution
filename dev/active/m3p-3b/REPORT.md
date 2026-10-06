# M3P-3b REPORT — 카드 실렌더 썸네일 연결 (ADR-004 개정 7)

base `b5ca6df` · 브랜치 `k002bill2/m3p-3b` · 커밋: `762d447` BRIEF P0 · `ac3a244` 구현(ADR-004 개정 7) · `46442d0` Ego Lite · `e62656f` REPORT 초안 · 이 커밋 REPORT 완성

## 결론
- 카탈로그 카드 21장(큐레이션 6 + 생성 15)에 같은 출처 실렌더 썸네일이 연결됐다. 고정 경로 `thumbs/{id}.svg?v=76d49eca`, 키 맵·`import()`·`virtual:thumbnail-keys` 0.
- 고정 경로 상쇄 뒤 `/catalog` 첫 화면 **100.05KB > 99.90** → **ADR-004 개정 7 결정 3 적용**(`routeBudgetKb`, `/catalog`만 101, 멈춤선 100.90 이하). 다른 라우트·진입·렌더 한도 변경 0.
- Jarvis 기록용: **"적용 — 커밋 `ac3a244` · 실측 100.05"**.

## 실측 (KB gzip, `npm run build` → check-bundle-size)
| 시나리오 | base 첫 화면 | 이번 첫 화면 | 한도 | base 진입 | 이번 진입 | 진입 한도·멈춤선 |
|---|---|---|---|---|---|---|
| /catalog | 99.89 | **100.05** | **101**(개정 7) · 멈춤선 100.90 | 102.27 | 102.43 | 125 |
| /references/:id | 97.30 | 97.30 | 100 | 99.68 | 99.69 | 125 |
| /compare (·조정 있음) | 98.86 | 98.86 | 100 | 121.96 | 121.96 | 125 · 124.70 |
| /profile | 99.72 | 99.72 | 100 | 119.19 | 119.18 | 125 |
| /profile (3안 있음) | 99.72 | 99.72 | 100 | 121.66 | 121.65 | 125 |
| /projects | 94.04 | 94.03 | 100 | 100.34 | 100.33 | 125 |
| /studio/:projectId | 91.79 | 91.77 | 100 | 128.65 | 128.64 | 129 · 128.70 |
| 렌더 문서 JS · CSS | 84.19 · 8.85 | 84.19 · 8.85 | 90 · 30 | | | 89.70 |

- 썸네일 6장 → 21장, 가드 통과. base 값은 `git archive b5ca6df` 사본에서 같은 명령으로 실측.
- 상쇄 효과 메모: b5ca6df 대비 이번 방식 +0.16. M3P-3 패치(99.86 base·생성 조합 Tag 포함·img 문자열은 지연 청크)와 같은 base 직접 비교는 하지 않음 — 원인 비중(키 맵 청크·mapDeps vs 카드 안 img 코드)은 결정 4의 첫 화면 청크 구조 점검 때 확인. 다시 올리자는 요청은 그 점검과 함께만.

## 변경 (app/)
1. 21장: `src/thumbs/referenceDoc.ts` 상세·비교 맵에 생성 픽스처 합치기, `src/thumbs/entry.tsx` 대상 = 카드 id 전체(`references` ∪ `generatedReferences`) — 렌더 입력 없는 카드 id는 throw(조용히 빠지지 않음). 가드(`guards.ts`) 변경 0, 21장 위반 0. 엔진·PageDoc 계약 변경 0.
2. 고정 경로: `scripts/thumbsVersion.mjs`(id 정렬 (id, SVG) sha256 앞 8자), `build-thumbs.mjs` → `out/{id}.svg` + `meta.json{ids, version, renderCssSha256}`, `src/thumbs/vitePlugin.ts` → 앱 빌드만 `__THUMBS_VERSION__` define + `dist/thumbs/{id}.svg` 방출(산출물 없으면 throw — 빈 버전으로 img 분기가 접힌 채 통과 금지), 그 밖 모드 = "". `features/catalog/thumbnailSrc.ts` 신규, `thumbnailKeys.ts`·테스트·`virtual.d.ts` 삭제.
3. 가드(`check-bundle-size.mjs`, 강도 유지): ① meta id 목록 ↔ dist/thumbs 파일 정확 일치(빠짐·목록 밖 0) ② 버전 = dist 파일 재해시 ③ `/catalog` 첫 화면 JS에 `.svg?v=버전` 존재 ④ 썸네일 CSS = 배포 렌더 CSS ⑤ manifest에 SSR 도구 0. ③은 첫 빌드에서 기본 매개변수 때문에 상수가 접히지 않은 것을 실제로 잡았다.
4. 카드(`ReferenceCard.tsx`): `<img loading="lazy" decoding="async">` absolute(와이어가 높이 결정), img가 이름을 갖고 와이어는 role·이름 해제, 실패 → img 제거·와이어 이름 복귀(AC-U6, 알림·콘솔 0), 라이선스 Tag 래퍼 `aria-hidden`, "생성 조합" Tag 공존. 버전 빈 값 → img 0.
5. 예산: `bundleBudget.mjs` 시나리오별 `routeBudgetKb`(기본 `ROUTE_BUDGET_KB` 100 — `eagerBudgetKb`와 같은 형태), `/catalog`만 101. 판정 로직 다른 부분 변경 0.

## 검증
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0(번들 표 위).
- `npx vitest run`(app, 단독) **exit 0 · 247 파일 · 2184건 통과**. (첫 시도는 base 빌드와 병렬 중 셸 cwd 리셋으로 저장소 루트에서 설정 없이 돌아 무효 — PROGRESS)
- TDD: RED 3회(thumbnail 3 FAIL · 카드 3 FAIL + 모듈 2 · bundleBudget 1 FAIL) 모두 예측 일치, RED는 커밋하지 않음. 단언 약화·skip 0. 패치 테스트 갱신 내역은 PROGRESS B.
- Ego Lite: PROGRESS "Ego Lite" 절 — 21장 decode 21/0 실패, 카드 높이 전후 동일, 외부 요청 0, 생성 조합 Tag 판독, 정리 완료.
- Codex: 아래 절.

## 목업·SPEC과 다르게 한 부분
- SPEC 4.1 표 "성공 — 페이드 인 motion-safe": 넣지 않음 — `/catalog` 첫 화면 바이트를 썸네일 연결 필수분에만 쓰기 위해(개정 7 결정 4). 로드 전 와이어가 같은 자리에 있어 급한 깜박임은 없다.
- SPEC 4.1 "썸네일 키 없음(THUMBNAIL_KEYS에 id 없음) → img 0": 키 맵이 없어졌으므로 빌드 보장으로 옮김(대상 = 카드 id 전체 · id ↔ 파일 정확 일치). 런타임은 버전 빈 값일 때 img 0. docs 수정 금지라 SPEC 문구는 그대로 — 다음 SPEC 개정 때 반영 필요.

## Codex
- R1: `node codex-companion.mjs review --scope branch --base b5ca6df`(1.0.6) 실제 완료 — **"수정이 필요한 구체적인 결함을 발견하지 못했습니다"**(지적 0). Codex 자체 확인: 타입 검사·기존 빌드 산출물의 번들·썸네일 검사·`git diff --check` 통과, 전체 테스트·새 빌드는 미실행(이 레인이 위 "검증"에서 실행). 지적 0이라 R2 없음(라운드 1/2).

## 남은 일 · 요청
- docs(SPEC m3p 4.1·ADR-004 개정 7 "적용" 줄)는 이 레인이 수정하지 않음 — Jarvis가 실측과 함께 덧붙여 주세요.
