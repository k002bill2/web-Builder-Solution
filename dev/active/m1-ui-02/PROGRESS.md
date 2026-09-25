# M1-UI-02 PROGRESS

브리프: `docs/06-handoff/M1-UI-02_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/m1-ui-02` (main에서 분기, 로컬 커밋만)

## 단계 현황
| # | 단계 | 상태 | 커밋 |
|---|---|---|---|
| 0 | 읽기(브리프 0절 순서) + `npm ci` | 완료 | — |
| 1 | 폰트 자체 호스팅 (`fonts.test.ts`) | 완료 | (작업 1 커밋) |
| 2 | 색상·디바이스 필터 | 대기 | |
| 3 | 1a-02 레퍼런스 상세 | 대기 | |
| 4 | 검증 4종 + Codex 리뷰 + REPORT.md | 대기 | |

## 작업 1 — 폰트 자체 호스팅

### 결정
1. **서브셋 static woff2 4개** (`pretendard@1.3.9` `dist/web/static/woff2-subset`, KS X 1001 한글 2,350자 + 라틴·기호).
   번들 크기 근거(4웨이트 합계):
   | 형식 | 합계 | 파일 수 | 비고 |
   |---|---|---|---|
   | **subset (채택)** | **1.07MB** | 4 | 브라우저는 실제 쓰는 웨이트만 받는다 |
   | variable | 2.06MB | 1 | 단일 face라 웨이트별 @font-face 불가 |
   | static 전체 | 3.12MB | 4 | |
   | dynamic-subset | 웨이트당 92조각 | 368 | unicode-range CSS만 약 230KB |
   | Pretendard JP static | 8.29MB | 4 | 서브셋 형식 없음 |
   - 커버리지 실측: `subset_glyphs.txt`(3,729자)가 `app/src`·`index.html`의 한글 음절 374자를 전부 포함(누락 0). 서브셋 밖 글자는 글자 단위로 다음 시스템 폴백 글꼴이 그린다.
2. **Pretendard JP 제외.** 같은 서브셋 형식이 없고, 전체 static은 웨이트당 약 2MB(합계 8.3MB)다. 한국어 제품이라 가나·한자 글리프가 필요 없다. `--font-sans`에서도 `"Pretendard JP"`를 뺐다 — 남기면 로컬 설치본이 잡혀 404가 가려졌던 문제가 되살아난다. "폴백 체인 유지"는 시스템 폴백(-apple-system … sans-serif) 유지로 해석했다.
3. **`local()` 미사용.** 이 PC에 Pretendard가 설치돼 있어 번들 파일이 깨져도 정상으로 보인다(원래 404가 가려진 방식). 테스트로 고정.
4. 파일 위치 `app/src/assets/fonts/`, fonts.css 기준 상대 url. Vite가 해시 파일명으로 `dist/assets`에 내보낸다.
5. 라이선스: 저장소 루트 `LICENSES.md`에 출처·저작권·OFL-1.1 원문. fonts.css에는 URL이 든 OFL 헤더를 넣지 않는다(원격 URL 0건 테스트).

### RED
```
 × 원격 URL(http·https)을 참조하지 않는다
AssertionError: expected [ 'https://', 'https://', …(6) ] to deeply equal []
 × @font-face가 참조하는 파일은 저장소에 실제로 존재하는 woff2다
AssertionError: https://cdn.jsdelivr.net/gh/orioncactus/pretendard-jp@v1.3.9/…/PretendardJP-Regular.woff2 없음
 × --font-sans의 첫 글꼴은 자체 호스팅한 Pretendard다
AssertionError: expected '"Pretendard JP"' to be '"Pretendard"'
      Tests  3 failed | 2 passed (5)
```
- 구현 직후 `local()` 검사가 fonts.css 주석 문구("local()은 쓰지 않는다")에 걸려 실패 → 테스트가 주석을 제거한 선언만 보도록 수정(원격 URL 검사는 주석 포함 원문 유지).

### GREEN
```
 ✓ 원격 URL(http·https)을 참조하지 않는다
 ✓ Pretendard 400·500·600·700 웨이트 @font-face가 모두 있다
 ✓ @font-face가 참조하는 파일은 저장소에 실제로 존재하는 woff2다
 ✓ 로컬 설치 폰트(local())로 번들 파일 누락을 가리지 않는다
 ✓ --font-sans의 첫 글꼴은 자체 호스팅한 Pretendard다
      Tests  11 passed (11)   (styles 전체)
```

### 수용 확인
- 빌드 산출물: `dist/assets/Pretendard-{Regular,Medium,SemiBold,Bold}.subset-<hash>.woff2` 4개(267~271kB), CSS의 `url(/assets/Pretendard-…woff2)` 4건이 이 파일을 가리킴.
- 브라우저(ego-browser, `vite preview` :4719, 캐시 비활성):
  - `document.fonts` → Pretendard 400·500·600·700 모두 `loaded`
  - 네트워크 응답: 문서·JS·CSS·woff2 4건 전부 200/304, **4xx 0건**
  - 콘솔 error·warning·예외 **0건**
  - `body` font-family 첫 항목 `Pretendard`
- 검증 4종: typecheck 0 · lint 0 · test 63 passed (9 files) · build 0
