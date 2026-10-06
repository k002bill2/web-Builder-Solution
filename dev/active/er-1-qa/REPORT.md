# ER-1 QA REPORT — B-M2C-09 재검 (경로 A · QB-R1 · QB-R2)

## meta
- 역할 QA · worktree er-1-qa · base `9d817bd` · BRIEF P0 `a9b88ce` · 서브에이전트 0
- `app/`·docs·lock·scripts 변경 0(`git status --short app` 0줄) · 새 의존성 0 · push/merge/삭제 0
- 환경: `npm run build` EXIT 0(`logs/build.txt`) → `npx vite preview --host 127.0.0.1 --port 4337 --strictPort` PID 45236(cwd = 이 worktree `app`) · **dev 서버 미사용**
- 브라우저: Ego Lite(Chromium) space 82(이 레인 생성, 시작 전 `listTaskSpaces()` = `[]`) · 1280×900(CDP) · 첫 `goto` 1회 뒤 앱 안 클릭만, 새로고침 0
- Safari·Firefox **미검증**
- **턴 상한(35) 도달로 QB-R1 정적 HTML 렌더 뒤 새 측정을 멈춤** → QB-R2·B-M2B-09는 미측정

## 0. 결론
| 항목 | 판정 | 근거 |
|---|---|---|
| 경로 A(ref-e · 밝은 카드) | **PASS** — 실제로 게이트 통과 문서가 만들어짐 | 아래 1절 |
| QB-R1 ⑩ 정적 HTML 내보내기 성공 | **PASS** | `export_succeeded static-html` · 해시 `5db2d93dec84` |
| QB-R1 ⑩ PNG ↔ 정적 HTML 동일성(1280) | **PASS**(측정한 1변형 조합 안에서) | 다른 픽셀 47 / 4,222,720(0.001%) |
| QB-R1 ⑩ 캔버스 ↔ 내보내기 동일성 | **PASS(육안·구조)**, 픽셀 대조는 환경 한계 | 아래 2.3 |
| QB-R1 m2a 7변형 전체 | **부분** — 이 문서에 있는 변형만 | 아래 2.4 |
| QB-R2 정적 HTML·PNG 개수 문구 | **미검증**(턴 상한) | 결함 아님 · 시작 전 중단 |
| B-M2B-09 닿는 항목 | **미검증**(턴 상한) | — |
| 회귀 vitest | **PASS** 227 files · 2048 tests · EXIT 0 | `logs/vitest.txt` |

결함 0건.

## 1. 경로 A 실측 (ER SPEC r1 2.2-1)
1. 카탈로그 → ref-e(부티크 법률사무소)·ref-a "비교 추가" → 비교 보드 → "이 레퍼런스로 전부 선택: A 부티크 법률사무소"(카드 = 플랫·구분선, `surfaceTone: light` — `fixtures/referenceComparisons.ts:98`) → 프로필 확정 v1
   - 프로필 화면: **대비 검사 통과 4 · 미달 0** (`shots/a1-after-confirm.png`)
2. 3안 만들기(v1) → A안 선택 → "A안으로 편집 시작" → `/studio/project-1`
   - 편집기 첫 게이트: **차단 2 = SEO 메타(제목·설명)만**, 대비 AA·대체텍스트·헤딩·필수 섹션·모션·글자 수 통과 (`shots/a2-studio-open.png`)
3. 페이지 정보: 제목 "부티크 법률사무소 상담 예약", 설명 44자 입력 → 게이트 **"통과"**(성능 예산 "측정 전" — 차단 아님), 정적 HTML·PNG 버튼 활성 (`shots/a3-gate-pass.png`, 화면 육안 확인)
- 경로 B는 불필요해 시도하지 않음.
- 관찰(결함 아님): 프로필 화면 문구 "편집기는 다음 단계(2a-05)에서 연결됩니다 … 편집기 자리표시 화면으로 이동합니다"가 실제 동작(편집기 열림)과 맞지 않음 — 범위 밖, 기록만.

## 2. QB-R1 ⑩ 내보내기 동일성 (`logs/qbr1.txt`·`qbr1-html.txt`·`qbr1-pdiff.txt`)
### 2.1 내보내기 결과
- 정적 HTML: 상태 "정적 HTML을 만들었습니다 · 내보내기 전 상태는 스냅샷 '내보내기 전 · 02:33'에 있습니다 / 결과 해시 5db2d93dec84 / HTML 1개 · 1.0MB / 내려받기" → 결과 줄 "내려받기"로 `부티크-법률사무소-프로젝트_r2.html` 1,012,557B 저장. `<img>` 0 · 외부 URL은 라이선스 주석(OFL·tailwind)뿐.
- PNG: "PNG를 내려받았습니다 · 부티크-법률사무소-프로젝트_1280_r2.png" · `png_succeeded fallback_count 0` · 1280×3300
- 이벤트: `export_requested → snapshot_created(auto, export) → export_succeeded → png_requested → png_succeeded`
- 개수 문구: 이미지 0장 문서라 두 결과 줄 모두 개수 문구 없음(정상 — 잃은 이미지 없음)
### 2.2 PNG ↔ 정적 HTML(1280 렌더)
- 정적 HTML은 이 레인 빈 탭 p2에 `document.write`로 렌더(goto 없음) → 1280×3299, 글꼴 "Kit Serif KR" 로드, 섹션 8개 순서 Header·Hero·Services·About·Portfolio·Portfolio·Contact·Footer
- 픽셀 대조(`pdiff.py`, 채널차 >8): **47px(0.001%)** · 최대 채널차 51 · 띠 0~400px 38px, 1600px대 9px — 글자 가장자리 안티앨리어싱 수준. 높이 차 1px(3300 vs 3299). 나란히 축소본 `shots/r1-png-vs-static.png` 육안 동일.
### 2.3 캔버스 ↔ 내보내기
- 캔버스 iframe `/render.html` sandbox=`allow-scripts`(동일 출처 아님) → 문서 직접 읽기 불가. 크기 1280×3307(56% 축소 표시)로 내보내기 높이(3299·3300)와 8px 이내.
- `a3-gate-pass.png` 캔버스(Header·Hero·Services·About 그래픽)와 PNG·정적 HTML 상단을 육안 대조: 문구·색·배치 동일.
- 캔버스 전체 픽셀 대조는 **환경 한계(축소 표시·교차 출처 iframe)** — 미실측.
### 2.4 m2a 변형 포함 범위
- 포함: Header 고정 헤더·우측 CTA · Hero 텍스트 중심 카피 · Services 목록형 · About 이야기+이미지(자체 그래픽) · Portfolio 이미지 그리드 3칸 ×2 · Contact 문의 폼 · Footer 확장형 사업자정보 — 1280 데스크톱만
- 미검증: 그 밖의 변형, 태블릿·모바일 폭 PNG, 이미지가 실제로 들어간 문서

## 3. QB-R2 · B-M2B-09 — 미검증
- 턴 상한 도달로 측정 전 중단. 준비물만 있음: 자체 제작 픽스처 `fixtures/f1.jpg`·`f2.jpg`(1200×800 단색 그라데이션, python+sips, 커밋 제외).
- 다음 레인 절차(경로 A 그대로 재현 가능): 게이트 통과 문서 → Hero·About "이미지 편집"에 f1·f2 + 대체텍스트 → 게이트 "통과" 확인 → "프로젝트로 돌아가기" → `/projects` → 같은 프로젝트 → 정적 HTML·PNG 결과 줄의 "이미지 N장…" 문구 확인. 대체텍스트를 채웠는데 복귀 뒤 게이트가 막히면 그 자체가 결함 증거.

## 4. B-M2C-09 닫힘 의견
- **부분 닫힘 권고.**
  - 닫을 수 있는 몫: "시드 문서 게이트 차단으로 미실측"이라는 전제는 해소됨 — 경로 A로 게이트 통과 문서가 실제로 만들어지고, 그 문서에서 정적 HTML 성공과 PNG ↔ 정적 HTML 동일성(1변형 조합 · 1280)이 실측됨.
  - 남는 몫: ① QB-10 정적 HTML 개수 문구(잃은 이미지) — 미실측 ② ⑩ 나머지 변형·폭 ③ 캔버스 픽셀 대조(환경 한계).
- B-M2C-09는 ①이 실측될 때까지 열어 두고, 제목을 "QB-10 개수 문구 + ⑩ 나머지 변형"으로 좁히는 것을 권고. 차단 요인은 없음(경로 A로 바로 재개 가능).

## 5. 정리·책임
- Ego Lite: 열었던 탭 p1(agent)·p2(agent, 측정 중 close) → `finish({keep:[]})` 직후 82(ownership user) 잔존 → 3초 뒤 `listTaskSpaces()` = `[]` (`logs/ego-finish.txt`)
- 서버: PID 45236 cwd 확인 후 종료 → 4337 리슨 0 · 5480은 리슨 수만 확인(2줄), 무접촉
- 영환님 창 무접촉
- 회귀: `npx vitest run` 1회 EXIT 0 — 227 files · 2048 tests passed
- 커밋 제외(.gitignore): `exports/`(HTML·PNG), `fixtures/*.jpg|ppm`

## 6. 파일
- 스크립트: `s1-qbr1.mjs`(내보내기·PNG), `s2-html-dl.mjs`(HTML 받기·렌더), `pdiff.py`(픽셀 대조)
- 증거: `shots/a1-after-confirm.png`·`a2-studio-open.png`·`a3-gate-pass.png`·`r1-export-notice.png`·`r1-static-render.png`·`r1-png-vs-static.png` · `logs/*`
