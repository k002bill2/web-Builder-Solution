# M4-b-2 QA 2차 실화면 계획 (계획만 — 1차에서 미실행)

> 도구: **ego-browser(Ego Lite)** 만(Playwright·Puppeteer 금지). 서버: `cd app && npm run build && npm run preview` (dev 서버 금지 — kitCss 설계상 INFRA, 메모리 `png-export-needs-preview`). 뷰포트 = `page.cdp('Emulation.setDeviceMetricsOverride', {width, height:900, deviceScaleFactor:1, mobile:false})` — **1280 · 390**. 이동은 앱 안 클릭만(메모리 store는 새로고침 시 리셋).
> 문서: ① 시드 없이 **모던 카페 + 보정값 v2 + 새로 시작**(내보내기 게이트 대비 AA 통과 경로 — 메모리 `export-gate-seed-block`) ② 같은 문서에 이미지 슬롯 3장(webp·jpg·png) 올린 **이미지 문서**(잃은 이미지 1 포함되면 기록).

## R1 앱 실제 경로 zip (RZ-AC-R1)
1. `/studio/:id` → 내보내기 → 형식 버튼 3번째 "React 프로젝트(zip)" 클릭 → 경고 확인 → 저장 → 내려받기 링크 `<stem>_r<rev>_react.zip` 확보(파일 이름 RZ-AC-19 대조).
2. 받은 zip을 `$TMPDIR/qa-live/<doc>/`(저장소 밖)에 풀고 `docker run --rm -v …:/src:ro node:22` 안에서 `npm ci && npm run build` → exit 0 · JS·CSS gzip 기록(C3 ≤90/30).
3. 1차 vitest 경로 zip(`$TMPDIR/qa-rz/m2.zip`, 1차 4절)과 **`src/kit/*.css`·`package-lock.json` 바이트 비교** — 다르면 차이 파일 목록 기록(앱 경로 `kitCss` fetch 값 = fs 원문인지가 R1 핵심).
4. 이미지 문서도 1~2 반복(src/assets/images 개수 = 고른 이미지 수 · site.json UUID 0 grep).
- 합격: 두 문서 모두 exit 0 · kit/lock 바이트 동일(또는 차이 사유가 SPEC 허용 범위).

## R2 렌더 대비 (RZ-AC-R2 · SPEC 4.1)
1. zip 산출을 `npx vite preview`(컨테이너 또는 로컬 임시 폴더)로 띄움.
2. 같은 문서를 앱 렌더 iframe(내보내기 미리보기)과 zip 사이트에서 각각 1280·390 스크린샷 + 사이트 루트 DOM `outerHTML` 수집 → 4.1 정규화(①data-motion-play ②img src→키) 뒤 비교.
3. 390에서 햄버거 메뉴 열기 → 항목 클릭 → popover 닫힘 + 앵커 이동(RZ-AC-15 실화면판). 정적 HTML 내보내기와 같은 시나리오로 대조.
4. 이미지 문서: masonry `aspect` 유지 · 이미지 표시 · 잃은 이미지 placeholder 확인(1차 2절 AC-13 공백 보완).
- 합격: 정규화 DOM 동일 · 시각 차이 0(차이는 스크린샷 쌍으로 기록).

## R4 status/alert · 포커스 (RZ-AC-R4)
1. 1280·390 각각: React zip 성공 → `role=status` 정확히 1개 · 결과 줄 = reactZipNote + REACT_ZIP_NEXT(3MB 초과 문서면 "메일 첨부" 안내 **0** 확인 — 1차 5절 공백의 실화면판).
2. 실패 유도(가능한 경로만: 오프라인 전환으로 청크 로드 실패 → retryable, 재시도 성공) → `role=alert` 1개 · "다시 시도" 표시 · 재시도 뒤 성공.
3. 누른 버튼에 포커스가 남는지 `document.activeElement` 확인(성공·실패 둘 다).
4. 390에서 3버튼 각각 터치 영역 ≥ 토큰 기준(boundingBox 높이·간격 기록) · 줄바꿈/잘림 0.
5. 단언·용량 실패(refused, "다시 시도" 0)는 실화면 유도 경로가 없으면 [미확인]으로 두고 1차 M6 공백을 근거로 단위 보강을 요구.

## 산출·기록
- 증거: 스크린샷·DOM·docker 로그는 `dev/active/m4b-impl/raw/qa-live-*`. 판정은 QA-REPORT 2차 절에 추가. preview 서버는 종료 후 리슨 0 확인.
- 예상 소요 [추정]: 60~90분(문서 준비 20 · R1 20 · R2 30 · R4 20).
