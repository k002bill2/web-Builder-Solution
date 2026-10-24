판정: **PASS with notes**

# SAMPLE-COPY QA REPORT — 문구 교체 실화면 확인

- 일시: 2026-10-25 02:34–02:38 · 브랜치 `k002bill2/sample-copy` · 기준 HEAD `49881428`(QA 브리프 커밋, 앱 코드는 `914cf523`과 동일)
- 환경: `npm run build`(exit 0) → `npx vite preview --port 4399 --strictPort` · ego-browser 새 TaskSpace(`sample-copy qa-1`, 재촬영 `sample-copy qa-2`) · 1280×900 · 앱 안 클릭으로만 이동
- 경로: IDB 초기화 → 카탈로그 비교 추가 2건 → 비교 보드 A 전부 선택 → 프로필 확정 → 3안 → A안 편집 → 뒤로 → 보정값 v2 저장 → 3안(v2) → B안 새로 시작 → SEO 제목·설명 입력 → 품질 게이트 "통과"

## 결과표

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 1 | 내보내기 버튼 글자·순서 | PASS | DOM·화면 위치 순서 = PNG 내려받기 → 디자인 샘플 내려받기 → HTML 파일 1개 내보내기 → HTML 샘플 묶음(zip) 내보내기 → React 코드 샘플(zip) 내보내기 (`logs/qa-copy.json` "export order", `logs/qa-copy-3.out` "visible export buttons") · `screens/01b-export-buttons-all-1280.png` |
| 2 | 대표 주소 도움말 | PASS | "대표 주소(canonical)" 아래 "샘플에는 대표 주소가 필요하지 않습니다" · `screens/02-canonical-help-1280.png` |
| 3 | HTML 샘플 묶음(zip) 1회 실행 | PASS | 결과 줄 "HTML 샘플 묶음(zip)을 만들었습니다 · 내보내기 전 상태는 스냅샷 '내보내기 전 · 02:35'에 있습니다" · 폴백 링크(blob)로 zip 확보 · `LICENSES.md`: "샘플 파일(index.html)" 1건 · "사이트 파일" 0건 (`logs/zip-check.txt`, sha256 `81fb6aa5…45aca6`, 5 엔트리) · `screens/03-zip-result-1280.png` |
| 4 | 금지어 0건 (`document.body.innerText`) | PASS | 내보내기 열린 상태: 발행 0 · 정적 사이트 0 · 게시 0 / zip 실행 뒤: 0·0·0 / 스냅샷 대화상자 열린 상태(`dialog[open]` 확인): 0·0·0 · `screens/04-snapshot-dialog-1280.png` |
| 5 | /compare 푸터 사업자정보 경고 | 단위 테스트 `boardWarnings.test.ts`로 대체 | 선례 경로(모던 카페 A 전부 선택)에서는 경고 상태가 나오지 않음(보드 텍스트의 "사업자정보"는 변형 이름 "확장형 사업자정보"뿐). `npx vitest run src/domain/boardWarnings.test.ts` = 1 file · 8 passed · exit 0 (`logs/boardWarnings-test.txt`), 문구는 `boardWarnings.ts:75`·테스트 `:60`에서 일치 |
| - | 콘솔 error | 0 | 3회 실행 모두 `console errors []` (Runtime.consoleAPICalled error · exceptionThrown · Log error) |

## 결함
없음.

## 메모 (결함 아님)
- `download` 이벤트가 90초 안에 오지 않아(선례 sample-bundle과 같은 현상) 결과 줄의 폴백 "내려받기" blob 링크를 페이지에서 읽어 저장함 — 브리프의 "폴백 링크로 zip 확보" 절차 그대로.
- 1차 스크립트는 `ZIPDIR` 환경변수가 ego-browser 런타임에 전달되지 않아 zip 저장 단계에서 멈춤 → 같은 TaskSpace를 이어받는 `qa-copy-2.mjs`로 저장·스냅샷 단계를 마침(앱 상태는 그대로 이어짐).
- 1차 스크린샷 `01-export-buttons-1280.png`는 패널 스크롤이 덜 되어 PNG 버튼만 보임 → 저장된 project-1을 앱 안 클릭(프로젝트 → 편집기 열기)으로 다시 열어 `01b`로 재촬영.
- zip은 저장소 밖 `$TMPDIR/sc-zip.WJi5/`에만 있음(커밋 안 함).

## 로그·스크린샷
- 스크립트: `qa/scripts/qa-copy.mjs`, `qa-copy-2.mjs`, `qa-copy-3.mjs`
- 로그: `qa/logs/qa-copy.{out,json}`, `qa-copy-2.{out,json}`, `qa-copy-3.out`, `zip-check.txt`, `boardWarnings-test.txt`, `listen.txt`(시작 전 free · 종료 후 LISTEN 0줄, 재촬영 포함 2회)
- 스크린샷: `qa/screens/01-export-buttons-1280.png`, `01b-export-buttons-all-1280.png`, `02-canonical-help-1280.png`, `03-zip-result-1280.png`, `04-snapshot-dialog-1280.png`, `zz-fatal.png`(1차 스크립트 zip 저장 실패 시점 화면)
- TaskSpace: `qa-1`·`qa-2` 모두 `task.finish({ keep: [] })`로 정리
