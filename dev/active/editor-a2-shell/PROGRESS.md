# EDITOR-A2-SHELL — PROGRESS

- 수신: 2026-09-27 · 브리프 `docs/06-handoff/EDITOR-A2-SHELL_BRIEF.md`(+ 초안 4~10절) · 브랜치 `k002bill2/editor-a2-shell` · base `f22bbc8`(HEAD `932d423`) · 포트 4337 · 서브에이전트 금지.
- 소유: `pages/StudioPage.tsx` · 새 `components/studio/{StudioToolbar,StudioLayout,SectionList,StructureCanvas,PreviewWidth,StudioTabs}.tsx` · 새 `features/studio/{useStudioDoc,selection,layoutMode}.ts` + 테스트. F 레인 파일 쓰기 금지.

## RESUME-1 (2026-09-27 · 브리프 끝 절)
- base `d216990`(main `e13f2b6` + 브리프). S1 병합됨. /profile 여유 1.34 확보로 중지 사유 해소 → S2~S6 + S7 재개. 번들: `/studio` 첫 ≤ 99.40, 그 밖 ±0.03, 멈춤선 0.3. 포트 4337 · 서브에이전트 금지 · 로컬 커밋만.
- 범위 판단: 게이트 목록·내보내기·스냅샷·더보기(실행 취소)는 a4(SPEC 13.1) → 제목 구조(E-AC-04)용 h2 "품질 게이트"·h3 "내보내기" 자리만 둔다. 섹션 연산(추가·삭제·이동·변형·테마)·이미지 슬롯은 a3.

## 체크포인트
- [x] S0 base build 실측 → `logs/base-build.txt` (exit 0 · /studio 90.73/104.33 · /profile 99.60/124.69 · /catalog 99.65 · 공통 89.34)
- [x] S1 문서 분기 + D1~D3 (RED→GREEN, 3회 반복) — `270bf6c` · RED `logs/s1-red.txt`(6 fail/1 pass) · GREEN 7/7 × 3회 `logs/s1-repeat.txt`
- [x] S2 집중 모드 툴바 E-AC-03 — RED `logs/s2-red.txt`(title 1 fail) → GREEN 8/8 `logs/s2-green.txt` · build /studio 95.50/108.48 · 그 밖 ±0.01
- [x] S3 3단 배치·제목 구조 E-AC-04 · E-AC-13 — RED `logs/s3-red.txt`(5 fail) → GREEN 14/14 `logs/s3-green.txt` · build /studio 97.28/110.25(+1.78 = 배치 3벌·패널 코드) · 그 밖 ±0.01. 가로 넘침 0은 jsdom 불가 → [Q]
- [x] S4 섹션 선택 E-AC-05 — RED `logs/s4-red.txt`(2 fail) → GREEN 18/18 `logs/s4-green.txt` · build /studio 97.45/110.43 · 그 밖 ±0.01
- [x] S5 탭 E-AC-14 — RED `logs/s5-red.txt`(키 1 fail) → GREEN 21/21 `logs/s5-green.txt` · build /studio 97.76/110.73(rovingFocus 공유 +0.31) · 그 밖 ±0.01
- [x] S6 미리보기 폭·캔버스 E-AC-15 · E-AC-16 — `98a1303` · RED `logs/s6-red.txt`(5 fail + 모듈 없음) → GREEN 30/30 `logs/s6-green.txt` · build /studio 98.39/111.36 · 그 밖 base ±0.01. 1차(previewView 값 import): 공통 89.39(+0.04) · /references 97.18(+0.17) · /catalog 99.70(+0.04) → 타입만 import로 되돌림
- [x] S7 A2-F 연결 (FieldEditor·PageInfoFields·SaveStatus·ConflictCallout·useDocSave) + 저장소 어댑터 — RED `logs/s7-red.txt`(5 fail) → GREEN 31/31 `logs/s7-green.txt` · 표적(studio·guards) 176/176 `logs/s7-targeted.txt` · build /studio 첫 91.65 · 진입 118.83(편집 틀 lazy) · 그 밖 ±0.02
- [ ] 전체 vitest 3회 → `logs/final-full-x3.txt`
- [ ] REPORT 갱신 (RESUME-1 절)
- [ ] Codex 1회(`review --scope branch --base e13f2b6`) 또는 이관
- [x] 전체 vitest 1회 → `logs/full-vitest.txt` (112 files · 1279 passed · 실패 0)
- [x] Codex — 이관(중지 규칙 발동으로 S1에서 멈춤 · 병합 전 `review --scope branch --base f22bbc8` 1회 권장)
- [x] REPORT.md

## 결정 · 목업 차이
- (R1·S7) `/studio` 첫 화면 98.39 + 연결분이 99.40을 넘을 것이라 **편집 틀 전체(StudioLayout)를 문서가 있을 때 자동 lazy**로 옮김 → 첫 화면 = 조회·빈 상태만(91.65), 진입 직후 118.83(≤125). `scripts/check-bundle-size.mjs` studio auto에 `StudioLayout.tsx` 추가(분류만, 예산 불변).
- (R1·S7) 타입 정리: `features/studio/studioRepository.ts` — `isPageDoc` 모양 확인 + `toDocSaveRepository` 어댑터(충돌 해결 결과 모양 확인). `useStudioDoc`의 `as PageDoc` 제거. 데이터 계층 파일 수정 0.
- (R1·S7) 가드 `src/test/tabsRemoved.test.ts`(V2-3 "제품 코드 role=tab* 0건")가 SPEC 6.2·S-B6 편집기 탭과 충돌 → `components/studio/StudioTabs.tsx` 1개만 명시 허용(카탈로그·상세 0건 단언 유지, 파일 존재 확인 추가). **S3~S6 커밋 시점에는 이 가드가 빨간색이었다**(체크포인트 게이트가 표적 테스트만 돌림) — S7에서 발견·정리. 확인 필요: 가드 범위 조정 승인.
- (R1·S7) 유추 문장: 충돌 해결 거부 알림 "충돌을 해결하지 못했습니다 — 다시 골라 주세요" · 캔버스 차단 문장 "<라벨> — 상한 N자를 M자 넘었습니다 …(R-13)" · 이미지 슬롯 안내 "이미지 슬롯 N개는 다음 단계에서 편집할 수 있습니다."(a3).
- (R1) E-AC-15 "같은 상수 import" → **같은 값 + 대조 테스트**로 대체: `PREVIEW_VIEWS` 값 import 시 previewView가 공유 청크(0.26KB)로 떨어져 /references +0.17 · 공통 +0.03(±0.03 규칙 위반). `PREVIEW_WIDTH_OPTIONS`(studio) + `previewFrame.test.ts`가 `toEqual(PREVIEW_VIEWS)`. 공유 방식 결정은 사용자/Jarvis 몫(공통 규칙 완화 or 상수 공통 이동).
- (R1) 축소 보기 = CSS `zoom`(SPEC 4.1 `transform: scale` 대신) — scale은 원래 폭을 레이아웃에 남겨 가로 넘침·빈 높이가 생긴다. 데스크톱 프레임 = 열 폭(축소 없음), 태블릿 48rem · 모바일 24.375rem.
- (R1) 미리보기 폭 = 네이티브 라디오 `fieldset`(DS SegmentedControl 대신 — 카탈로그·상세 청크 경계 회피). ←/→는 브라우저 기본.
- (R1) 캔버스 = 자체 블록(와이어프레임 막대 + 실제 슬롯 글자). `CandidateCard` `Wireframe`은 import하지 않음 — 글자 슬롯 없음(aria-hidden) · /profile 청크 공유 위험. 색은 앱 토큰(fill·background) — 프로필 팔레트 CSS 변수 연결은 테마 작업(a3)과 함께.
- (R1) 품질 게이트·내보내기 = a4 → h2·h3 제목과 안내 캡션 자리만(E-AC-04 제목 구조). 툴바 "스냅샷"·"더보기"·"검사 · 내보내기"도 a4라 그리지 않는다.
- (R1) 1024 "섹션" 선택 = 네이티브 `select`(DS Select import 시 공유 청크 위험 — 측정 없이 회피). 선택만, 순서·추가는 목록(4.1).
- (R1) 테마 영역: "테마 바꾸기"는 a3 → "프로필 보기" 링크만.
- (R1) `document.title` = "<이름> 편집"(E-AC-03 문자 그대로 — 다른 화면의 " · 브랜드" 접미사 없음).
- 돌아가기 버튼: `chevron-left` Icon 대신 CSS 테두리 chevron(EM 추가 후보) — `ds/Icon` import 시 공통 +0.39KB, SVG `?url` 직접 import 시 공통 +0.08KB(실측). 접근 이름 "프로젝트로 돌아가기" 그대로.
- 문서 Tag: `ds/Tag` 대신 토큰 span — Tag(+cx) import가 공통 청크를 흔듦(실측, 작은 증가).
- `Wireframe` 재사용: S6 미착수라 판단 보류(`CandidatePlan`·`aria-hidden`·글자 없음 → PageDoc 슬롯 글자와 모양 불일치 가능성, import 시 profile 청크 공유 위험).
