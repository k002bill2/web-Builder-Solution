# M3P-6 REPORT — 편집기 새 문서 업종 문구 (B-M3P-06)

base `2b67601` · 구현 `f1a2391` · 예산 `388bca9` · 2026-10-07

## 결과
- 편집기 새 문서 hero/섹션 문구 = 기준 레퍼런스(프로필 버전 `baseReferenceId`) 업종·레이아웃 문구. 모르거나 표 밖이면 SAMPLE_COPY 폴백.
- 같은 레퍼런스에서 썸네일 h1 = 편집기 hero 제목 (`startDocIndustryCopy.test` + 브라우저 실측).

## 번들 증가량 (`npm run build`, gzip KB, exit 0)
| 라우트 | 첫 화면 base → 실측 | 진입 직후 자동 base → 실측 |
|---|---|---|
| /catalog | 100.05 → 100.06 (+0.01) | 102.44 → 102.44 (0) |
| /references/:id | 97.30 → 97.30 (0) | 99.69 → 99.69 (0) |
| /compare | 98.86 → 98.86 (0) | 121.96 → 121.97 (+0.01) |
| /profile | 99.72 → 99.72 (0) | 119.17 → 119.17 (0) |
| /profile(3안) | 99.72 → 99.72 (0) | 121.65 → 121.65 (0) |
| /projects | 94.04 → 94.04 (0) | 100.33 → 100.36 (+0.03) |
| /studio/:projectId | 91.83 → 91.84 (+0.01) | **128.19 → 128.23 (+0.04)** / 예산 129 |
- /studio 기준선은 ADR-004 개정 8 배분 ①로 128.19 → 128.23 (`388bca9`), 멈춤선 128.26. 예측(±0.01)보다 +0.03 큼 — 진입 청크의 해시·공유 청크 경계 이동분으로 판단(표·fixture는 진입 정적 닫힘에 없음). 근거 L2(빌드 출력), 원인 귀속은 L3 추정.
- 조작 뒤(판정 밖): /profile(3안) memoryProjectRepository +2.02 → +2.06, CompareDialog +20.51 → +20.54.
- 렌더 문서 84.19KB / 90KB, 앱과 공유 0.

## 썸네일
- 21장 · 버전 `8d7310f2` **유지** (빌드 출력 "버전 8d7310f2 · 가드 통과"). 문구 표 위치만 `src/data/industryCopy.ts`로 이동, thumbs/thumbCopy가 import.

## 브라우저 실측 (Ego Lite, `vite preview` 4337, 1280×900)
| 레퍼런스 | 경로 | 편집기 hero | 썸네일 h1 | 캡처 |
|---|---|---|---|---|
| ref-a (큐레이션) | 중단 전 세션 | 일치 | — | `shots/1-ref-a-editor-hero.png` |
| gen-beauty-1 (생성, beauty·center) | 카탈로그 뷰티 → 비교 추가 → "이 레퍼런스로 프로필 만들기" → 확정 v1 → 3안 → A안 선택 → "A안으로 편집 시작" | "피부 결을 살피는 맞춤 관리" | 같음(`dist/thumbs/gen-beauty-1.svg` grep) | `shots/2-gen-beauty-1-editor-hero.png` |
- 첫 goto 1회 뒤 앱 안 클릭만, 새로고침 0. space 15 `finish({keep:[]})` → `listTaskSpaces()=[]`. preview 종료, 4337 리슨 0.
- 편집기 iframe(`/render.html`)은 contentDocument 접근 불가 → 접근성 스냅샷으로 hero heading 확인.

## 알려진 차이 (의도)
- **3안 미리보기 문구 ≠ 편집기 문구**: `comparePreviews`(CompareDialog)는 변경 0이라 여전히 SAMPLE_COPY 예시 문구로 그린다. 편집 시작 뒤 편집기는 업종 문구. 미리보기 안내문(compareText.same "3안 모두 예시 문구로 그렸습니다")과 모순 없음. 맞추려면 별건(CompareDialog 조작 뒤 청크 +표 크기).

## 검증
| 명령 | 결과 |
|---|---|
| `npm run build` | exit 0, 번들 가드·썸네일 가드 통과 |
| `npx vitest run` | exit 0 · 251 files / 2199 tests passed |
| Codex `review --scope branch --base 2b67601` R1 (`logs/codex-r1.log`, HEAD `f1a2391`) | 지적 0건 → R2 불필요 |
| `npm run lint` | exit 0 |
- typecheck는 `npm run build`(tsc 포함) exit 0으로 확인.
