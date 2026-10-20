# M5 범위 초안 — 발행(서브도메인·롤백·미리보기 공유)

- 상태: **초안 — 결정 전** (Designer, 2026-10-21). 이 문서는 명세만 담는다. 호스팅·CI·백엔드·인증·비용·법무는 결정하지 않고 5절 MQ-M5로 올린다.
- 브랜치 `k002bill2/m5-scope` · base `cedbf587` · 입력 BRIEF `dev/active/m5-scope/BRIEF.md`
- 근거 표기(ADR-007과 같음): **[L1]** 저장소 코드·문서 직접 확인(파일:줄) · **[N]** 호스팅·CI 비교 원장 `dev/active/m5-scope/HOSTING-LEDGER.md`(조회일 2026-10-20, 출처 69·인용 178)의 인용 번호 — 이 레인은 원장을 새로 조사하지 않았다 · **[L3]** 외부 일반 지식, 원장에 근거 없음(확인 필요) · **[추정]** 측정 없음.

---

## 1. 현재 출발점 (사실)

### 1.1 앱은 브라우저 전용이다

| 항목 | 현재 | 근거 [L1] |
|---|---|---|
| 저장 | IndexedDB DB `design-studio`(봉투 `SCHEMA_VERSION = 1`, DB_VERSION 2), store 7개 `meta·studio·docs·snapshots·images·board·saved` + 프로젝트 파일(.json) 내보내기·가져오기. 서버 영속은 "공유 기능 착수 시 별도 ADR" | `app/src/data/persistence/envelope.ts:5-8` · `idbPersistence.ts:13` · `features/projectFile/format.ts:12` · ADR-007 P7 `docs/decisions/ADR-007-local-persistence.md:16` |
| 네트워크 | 서버 API 호출 0. 테스트 외 `fetch` 3곳은 모두 같은 출처·`blob:` 자원 읽기(렌더 스타일시트·글꼴·이미지 data URL). XMLHttpRequest·axios·WebSocket 0 | `features/studio/staticHtml/kitCss.ts:22` · `siteFontEmbed.ts:22` · `render/serializeSite.ts:8` |
| 저장소 인터페이스 | 주석은 REST 모양("GET /projects", "POST /projects/{id}/export"), 구현은 메모리+IDB | `data/projectRepository.ts:146,166` · `data/memoryProjectRepository.ts:143-144` |
| 계정·인증·권한 | login·auth·oauth·jwt·password·account·credential 등 **0건**. `token`은 저장 lease, `session`은 sessionStorage 1회 알림 플래그. 역할(viewer·editor·publisher·curator)은 문서에만 | `features/studio/save/saveCore.ts:89-135` · `TRD.md:183` |
| 비밀·환경변수 | `.env.example` 없음(`.gitignore:7-9`만), `import.meta.env`는 `DEV` 확인 3곳, `process.env` 0 | `kitCss.ts:13` · `components/studio/PngSave.tsx:18` · `ExportRetryAlert.tsx:13` |
| 내보내기 3형식 | `ExportFormat = "react-zip" \| "static-html" \| "static-zip"` — 산출물은 `blob:` URL로 내려받기만, 서버 전송 0 | `data/projectRepository.ts:95` · `features/studio/staticHtml/staticHtml.ts:141,168,177` · `features/studio/reactZip/reactZip.ts:101,128` · `features/studio/exportFlow.ts:111` |
| 품질 게이트 | 8줄(contrast·alt-text·heading-order·required-sections·motion-budget·seo-meta·text-length·performance), 대비 AA 4.5 미만 = 차단 R-08. block ≥1이면 내보내기 중단, warn ≥1이면 확인. 내보내기 때 "내보내기 전" 자동 스냅샷 | `engine/contracts/records.ts:27-36` · `domain/contrast.ts:7` · `engine/gate/contrastRow.ts:28` · `features/studio/useExportFlow.ts:73-79` · `projectRepository.ts:165` |
| CSP | 산출물 HTML 안 **meta 1개**: 정적 HTML `default-src 'none'; script-src '<메뉴 해시>'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'`, 정적 zip은 img·font `'self'`, React zip은 build plugin이 `dist/index.html`에 주입. meta가 무시하는 `frame-ancestors`·`report-uri`·`report-to`·`sandbox`는 넣지 않기로 함. **앱 자체(`index.html`·`render.html`)에는 CSP 없음** | `features/studio/staticHtml/staticMarkup.ts:20,22,147-152,187` · `features/studio/reactZip/templates.ts:29,36-41` · `docs/design/csp/CSP-SPEC.md:53` · `app/index.html:3-7` |
| 서버 헤더·배포 설정 | `vercel.json`·`netlify.toml`·`_headers`·`wrangler.toml`·Dockerfile **없음**. 유일한 헤더 설정은 vite dev·preview CORS(렌더 iframe용 `Access-Control-Allow-Origin: null`, 주석 "정적 호스팅 요구사항: 앱 JS·CSS 응답에 같은 헤더") | `app/vite.config.ts:14,26,35-36` |
| CI | `.github/` **없음** — CI 0. React zip RZQ-10은 B(로컬 Linux 컨테이너)로 시작 | `docs/design/m4b/REACTZIP-SPEC.md:332,401` |
| Vercel 프리뷰 | 저장소 안 설정·코드로는 **확인 불가**(BRIEF `:10`만 언급) — 저장소 밖 Git 연동으로 추정 [추정] | `dev/active/m5-scope/BRIEF.md` |
| 발행 흔적 | `SnapshotKind`에 `"published"`가 타입으로만 존재(라벨 "게시", 파일 가져오기 검증). **만드는 코드 0**. publish(이미지 setter 이름 오탐 제외)·rollback·share·subdomain·tenant·deploy 관련 코드 0 | `data/projectRepository.ts:91` · `engine/contracts/records.ts:24` · `components/studio/SnapshotDialog.tsx:9` · `features/projectFile/checkFile.ts:35` |
| 발행 단위 후보 | release 개념 없음. 쓸 수 있는 식별자: `projectId` · `PageDoc.revision`(저장마다 +1)·`hash`(내용 해시) · 스냅샷 `snapshotId` · `ExportJob.resultHash` | `engine/contracts/pageDoc.ts:82-98` · `projectRepository.ts:31-43,63,98-122` |

### 1.2 정본 문서가 전제하는 M5

- FR-PUB-04 서브도메인 발행·상태 표시·롤백(P1, 발행 p95 ≤2분 · 롤백 ≤1분) · FR-PUB-05 커스텀 도메인·TLS(P2) · FR-PUB-06 미리보기 공유 링크(추측 어려운 URL·noindex·만료, "만료 후 거부") — `docs/02-prd/PRD.md:143-145` [L1].
- DEVELOPMENT_PLAN M5(P1, 1~2주): "서브도메인 발행·상태기계·롤백·미리보기 공유·발행 사이트 보안 헤더. 호스팅 결정(ADR-004) 후 착수" — `docs/04-plan/DEVELOPMENT_PLAN.md:22,141-143` [L1].
  - **주의**: ADR-004는 성능 예산 ADR이며 호스팅 결정을 담지 않는다(`docs/decisions/ADR-004-performance-budgets.md` 전체에 "호스팅" 0건) [L1]. 호스팅 결정은 **새 ADR**(다음 빈 번호, ADR-008 후보)로 받는 것을 전제로 쓴다 → MQ-M5-01.
  - ADR-004가 M5에 주는 제약은 **렌더 문서(생성 홈페이지) 예산 JS ≤90KB · CSS ≤30KB**(`ADR-004…:15`)다. 발행본은 같은 산출물이므로 같은 예산을 그대로 진다.
- TRD 데이터 모델: `page_snapshot.kind[auto|manual|published]` · `deployment(id, project_id, artifact_hash, state, promoted_at, rolled_back_at) -- P1` · `generated_project.preview_url(서명된 만료 URL)` — `docs/03-trd/TRD.md:167-175` [L1].
- TRD API: `POST /api/design-studio/projects/{id}/publish` · `…/rollback`(권한 publisher) · `GET …/preview`(서명된 미리보기 URL) — `TRD.md:203,205` [L1]. 역할 viewer·editor·**publisher**·curator, AOS `project_access` 검사 전제 — `TRD.md:183` [L1].
- TRD 보안: TR-SEC-08 미리보기 URL 서명·만료(24h)·noindex, 발행 사이트 보안 헤더(CSP·HSTS·nosniff·Referrer-Policy) · TR-SEC-10 비밀(호스팅·DNS 토큰)은 **AOS 비밀 저장 방식 재사용**, 로그 출력 금지 · TR-SEC-11 감사 로그(발행·롤백 포함) — `TRD.md:290,292,293` [L1].
- TRD 12절 결정 필요 2(객체 저장소·호스팅 사업자) · 3(생성 워커 실행 환경) · 5(AOS 내 노출 방식) — `TRD.md:319-327` [L1]. M5는 2를 반드시, 5를 간접으로(계정·권한 위치) 건드린다.
- 관측: "발행 실패(P1)" 지표·경보 — `TRD.md:312` [L1].

### 1.3 M5가 처음 요구하는 것 — 백엔드·계정·권한·비밀 저장

지금까지 모든 단계는 "브라우저 단독(백엔드 0)"이었다(M2a 정의 `DEVELOPMENT_PLAN.md:17`) [L1]. M5는 **ADR-007 P7("서버 영속은 공유 기능 착수 시 별도 ADR")을 처음 발동**시키는 단계다. 이유는 하나다: **호스팅 API 토큰은 브라우저에 둘 수 없다**(TR-SEC-10). 토큰을 쥔 서버가 없으면 1 tenant PoC조차 성립하지 않는다.

**최소 집합(M5-b PoC 기준)** — 이보다 줄이면 발행 자체가 안 된다:

| # | 최소 요소 | 이유 | 정본 |
|---|---|---|---|
| S1 | 발행 서버 1개(발행·롤백·미리보기 서명 API) | 호스팅 토큰 보관·호출 | TRD 5 `:205`, TR-SEC-10 |
| S2 | 발행자 계정 1개(수동 발급) + publisher 권한 검사 | 발행·롤백은 publisher만 | TRD 4.6 `:183`, TR-SEC-02 |
| S3 | 비밀 저장(호스팅 API 토큰 · 미리보기 서명 키) | 브라우저 노출 금지, 로그 금지 | TR-SEC-10 |
| S4 | 산출물 업로드 경로(브라우저 IndexedDB의 정적 산출물 → 서버) | 지금 산출물은 브라우저 안에만 있음 | ADR-007 P0 |
| S5 | release 기록(`deployment` 행: artifact_hash·state·promoted_at·rolled_back_at) + 활성 포인터 | 원자적 전환·롤백의 기준 | TRD `:175` |
| S6 | 감사 로그(발행·롤백·미리보기 링크 발급) | 추적 | TR-SEC-11 |

M5-b에서 **하지 않는 것**: 다중 조직·셀프 가입·결제·팀 초대·서버 측 문서 영속(편집 문서는 계속 IndexedDB). 서버에 올라가는 것은 **발행할 산출물과 그 메타데이터뿐**이다.

**위험(1줄)**: 발행 전 품질 게이트(FR-PUB-01)는 지금 브라우저에서 돈다 — 서버는 클라이언트 게이트 결과를 신뢰할 수 없다. 단일 수동 계정 PoC(M5-b)에서는 차단 요인이 아니지만, 계정이 2개 이상이 되는 순간(M5-c 종료 전) 서버 측 재검증(최소: 산출물 해시·금지 패턴·크기) 여부를 정해야 한다 → MQ-M5-04 부속.

---

## 2. M5 범위 분할 제안

```
M5-0 릴리스 체크 ─┐
M5-a 제품 CI ─────┼─→ M5-b 발행 PoC ─→ M5-c 발행·롤백·상태 UI ─→ M5-d 미리보기 공유 ─→ (P2) 커스텀 도메인
MQ-M5-01~06 결정 ─┘        (1 tenant, 수동 계정)
```

M5-0·M5-a는 서로 독립이고 호스팅 결정 전에 시작할 수 있다. M5-b부터는 MQ-M5-01(호스팅)·03(백엔드 위치)·04(계정)·05(비용)·06(법무) 결정이 선행한다.

### M5-0 릴리스 체크 (브라우저·OS·법무 게이트)

- 목적: M4 내보내기가 남긴 [미확인]을 발행 전에 닫는다. 발행은 내보내기 산출물을 그대로 공개하므로 여기서 남은 결함은 공개 사이트 결함이 된다.
- 묶음(BACKLOG `docs/06-handoff/BACKLOG.md`) [L1]:
  - B-M4A-09(`:82`) Safari·Firefox 실화면 · Archive Utility · Windows 탐색기 해제, Q19 재판정 트리거
  - B-SEC-09(`:101`) React zip Node 20.19 재빌드 · 정적 zip `file://` 실제 생성기 출력 재측정 · Safari·Firefox `file://`·웹서버 열람 · R4 lazy 이미지
  - B-M4B-01(`:102`) React zip 실화면 렌더 대비
  - B-M4B-02(`:103`) React zip windows·macOS `npm ci && npm run build` — **CI 결정(RZQ-10)과 묶임** → M5-a 참조
  - B-M4B-03(`:104`) LICENSES NOTICE·소스 공개 의무 법무 확인 → MQ-M5-06
- 의존: 없음(즉시 가능). B-M4B-02는 M5-a 결정에, B-M4B-03은 법무에 걸림.
- 종료 기준: 5건 각각 "닫힘(근거 커밋·로그)" 또는 "BLOCKED: 사유 + 사용자 수용"으로 BACKLOG에 기록. [미확인] 0 또는 사용자가 명시적으로 수용한 잔여만.
- 측정: 브라우저별 실화면 기록(ego-browser) · OS별 빌드 로그 · 법무 회신 문서.

### M5-a 제품 CI

- 목적: 제품 저장소의 typecheck·lint·test·build를 사람 손이 아닌 필수 check로 만든다. **고객 발행 게이트와 별개**다(원장: "제품 PR CI와 고객 publish gate를 분리") [53][58].
- 원장 사실: PRIVATE Actions 포함분 Free 2,000 · Pro/Team 3,000 · Enterprise Cloud 50,000분/월, Linux 2-core 초과 단가 $0.006/분 — "PRIVATE라 곧 유료"는 틀린 전제 [53]. 현재 GitHub 플랜·잔여분은 미확인 [53](L135, L350). **PRIVATE 저장소의 protected branch(필수 check 강제)는 GitHub Pro/Team/Enterprise에서만** — Free private에서 필수 check 강제를 보장하면 안 된다 [58](L144, L313). 분 단위 job별 올림·사용량은 repo owner pool 차감 [54](L130–131).
- 범위: Linux 러너 1종, 필수 check = `npm run typecheck` · `npm run lint` · `npm test -- --run` · `npm run build`(CLAUDE.md 완료 기준과 같음).
- **한계**: 원장 ★은 Linux 전용이다. B-M4B-02(windows·macOS `npm ci`)는 M5-a만으로 닫히지 않는다 — windows·macOS 러너 추가(초과 단가 Windows $0.010·macOS $0.062/분 vs Linux 2-core $0.006/분 [53][54](L121–125), OS별 포함분 차감 배수 [미확인](L127)) 또는 수동 확인 유지 중 선택 → MQ-M5-02.
- 의존: MQ-M5-02(CI 신설·플랜·필수 check) 결정. 원격 저장소 연결·push는 사용자 승인 사항(CLAUDE.md 규칙 7).
- 종료 기준: 기본 브랜치 보호에 4개 check가 필수로 걸리고, 의도적으로 실패시킨 PR 1건이 병합 차단됨을 확인.
- 측정: PR 1건의 check 실행 로그 · 차단 화면 · 월 사용 분(첫 2주 실측).

### M5-b 발행 PoC (1 tenant, 수동 계정)

- 목적: **원장 ★의 "조건"을 실측으로 판정**한다. 원장은 ★을 "채택 확정이 아니라 tenant별 원자적 release 전환·24시간 preview 만료·발행/rollback 성능을 검증한다는 조건의 판단"으로 둔다 [17][28][30]. M5-b가 그 검증이다.
- 범위: 1.3의 최소 집합 S1~S6, tenant 1개(서브도메인 1개), 계정 1개 수동 발급, UI는 개발자용 최소(버튼 1개 + 결과 텍스트). 미리보기 공유·커스텀 도메인 제외.
- 의존: M5-0 진행 중(병렬 가능하나 공개 전 종료) · MQ-M5-01·03·04·05·06·07·08 결정 · 계정 생성 승인(이 레인은 계정 생성 0).
- 종료 기준(전부 실측):
  1. 발행 p95 ≤2분 · 롤백 ≤1분 — 아래 2.1 정의로, 표본·사이트 크기·동시성은 측정 전에 고정.
  2. 원자성: 전환 중 방문자가 구·신 release의 **섞인 asset**을 받지 않음(HTML 신 + CSS 구 등 0건).
  3. 롤백 = 활성 포인터만 되돌림(재빌드·재업로드 없음), 구 release 보존 확인.
  4. 비밀: 브라우저 번들·네트워크 응답·로그에 호스팅 토큰 0건.
  5. 발행 사이트 응답 헤더에 TR-SEC-08 4종(CSP·HSTS·nosniff·Referrer-Policy) 존재.
- 측정: 2.1 · 원자성은 전환 중 연속 요청 스크립트(HTML·asset 해시 대조) · 헤더는 응답 헤더 덤프.

### M5-c 발행·롤백·상태 UI

- 목적: 사용자에게 보이는 발행 흐름(4절)을 편집기에 넣는다.
- 범위: 발행 전 게이트 재사용(FR-PUB-01) → 발행 확인 → 진행 상태(업로드·검증·전환) → 성공/실패 → release 목록·롤백 · "현재 공개 중" 표시 · 감사 로그 표시(최소).
- 원장 판단: "발행 중·검증 중·전환 완료·실패·rollback 완료 상태를 구분하는 UI가 필요" · "작업 API 성공과 방문자가 보는 버전 검증을 동일시하지 않는다"(원장 L366–367, 인용 번호 없는 원장 판단 문장).
- 카피 금지(원장 5절): "발행 2분/rollback 1분 보장" · "preview 주소만 알면 24h 뒤 자동 비공개" · "고객 사이트 무제한 무료"를 확정 카피로 쓰지 않는다.
- 의존: M5-b 종료. ADR-004 `/studio` 진입 예산(현 129KB 한도) — 발행 UI는 조작 뒤 dynamic import로 둬야 함 [추정: 진입 증가분 미측정].
- 종료 기준: PUB-AC-01~10(4.2) 통과 · typecheck·lint·test·build · `/studio` 진입 예산 초과 0.
- 측정: 컴포넌트·흐름 테스트 · Ego Lite 실화면 · 번들 측정 스크립트.

### M5-d 미리보기 공유 (서명·24h·noindex)

- 목적: FR-PUB-06 · TR-SEC-08 미리보기 부분.
- 원장 사실: WfP user Worker에는 일반 Worker Version URL이 없다 → 고객 preview는 제품의 난수/서명 24h 주소와 **모든 asset 만료 검사**를 설계해야 한다 [27]. Vercel의 일반 multi-tenant preview URL은 Enterprise 전용 [1][11].
- 범위: 서명 링크 발급(만료 24h) · 만료 후 HTML과 **모든 asset** 거부 · 원본 저장소 직접 URL 우회 차단 · `X-Robots-Tag: noindex` + meta robots · 링크 폐기(수동).
- 의존: M5-b(서명 키 저장 S3 · 엣지 실행 위치). M5-c와 병렬 가능.
- 종료 기준: PUB-AC-11~14 · 만료 +1초 뒤 HTML·CSS·JS·이미지 각각 거부 · 원본 직접 URL 거부.
- 측정: 시계 조작 대신 만료 시각을 짧게(예: 60초) 발급한 테스트 링크로 실측 + 서명 변조 1비트 거부.

### P2 커스텀 도메인 (FR-PUB-05)

- 이번 M5 범위 밖. 이유: 원장 2.5(커스텀 도메인 TLS)·후보별 차이가 크고, 1단계 wildcard TLS 깊이를 먼저 고정해야 한다 [13][17][31]. M5-b 스케치는 커스텀 도메인을 "Host→tenant 매핑 표에 행 추가"로 확장할 수 있게만 둔다.

### 2.1 시간 수용 기준 정의 (원장 2.3 "시간 수용 기준 제안" 출발)

원장 2.3 제안(원장 표기 "추정", L59): "이미 wildcard DNS/TLS가 준비된 상태에서 사용자 발행 클릭→validation→업로드→전환→외부 관측까지를 발행 시간으로 측정하고, 신규 도메인 DNS/TLS provisioning은 분리 계측". 롤백의 시작·종료 정의는 원장에 따로 없다 — 아래는 같은 원칙을 롤백에 옮긴 초안이다.

초안 정의:
- **전제**: tenant의 서브도메인 DNS·TLS는 이미 준비됨. 첫 발행의 DNS/TLS provisioning 시간은 **별도 지표**로 기록하고 p95 ≤2분에 넣지 않는다(원장 L59).
- **발행 시간** = 사용자가 "발행" 확인을 누른 시각(클라이언트 기록) → 게이트 확인 → 업로드 → 전환 → **외부 관측: 공개 URL에서 새 release의 HTML과 그 HTML이 참조하는 모든 asset이 새 해시로 응답한 첫 시각**. 작업 API의 "성공" 응답 시각이 아니다(원장 L367).
- 원자성은 "불변 release 참조 전환"으로 판정하며 "전 세계 동시 전환"과 구별한다(원장 L33). 외부 관측 지점(지역 수)은 측정 전에 고정.
- **롤백 시간** = "롤백" 확인 시각 → 공개 URL이 지정한 이전 release의 HTML·asset 해시로 응답한 첫 시각.
- p95 표본·지역·사이트 크기(작은/큰)·동시성은 **측정 전에** 정의(원장 L378). 원장은 어느 후보도 이 SLA를 계약상 보장한다고 판정하지 않았고 "instant"를 숫자 SLA로 바꾸지 않았다 [15][23][63](L12, L349).
- 초안 표본(제안, 확정은 M5-b 착수 시): 사이트 2종(작은 = 시드 문서 1페이지·이미지 0 / 큰 = 이미지 24개 상한) × 발행 20회 이상 × 동시 1·3 [추정].

---

## 3. 호스팅 후보 아키텍처 스케치

원장은 ★ 외에 2·3위를 매기지 않았다. B·C는 원장 서술(wildcard·빠른 rollback / signed URL·헤더 정책)을 보고 이 문서가 고른 비교 대상이다. 원장 인용은 `[N]`(원장 줄 `L`)로 단다.

공통 모델(TRD에 맞춤, 새 모델을 만들지 않음):

```
요청 Host: {slug}.{우리 발행 도메인}
  → tenant 조회 (slug → project_id)                    # Host→tenant
  → 활성 포인터 조회 (project_id → deployment.id)      # tenant→release
  → release 경로 releases/{project_id}/{artifact_hash}/  # 불변 객체, 덮어쓰기 금지
  → 정적 파일 응답 + 서버 보안 헤더 주입
발행 = 새 artifact_hash 경로 업로드 완료 → 검증 → 활성 포인터 1회 교체 (원자적 전환 지점)
롤백 = 활성 포인터를 이전 deployment.id로 1회 교체 (재업로드 없음)
미리보기 = releases/… 직접 노출 없이, 서명 토큰(project_id·artifact_hash·exp) 검사 후 응답
```

- release = `deployment(artifact_hash, state, promoted_at, rolled_back_at)` 1행 + `page_snapshot.kind=published` 1행(TRD `:173,175`) [L1]. 앱 쪽에서는 발행 시 `"published"` 스냅샷을 처음으로 **만들고**(지금은 타입만 있음, 1.1), `artifact_hash` = 업로드한 정적 산출물의 내용 해시(`ExportJob.resultHash`와 같은 계산)로 둔다. 같은 `PageDoc.hash`를 다시 발행하면 같은 release로 본다(멱등).
- 발행 산출물 = **정적 zip과 같은 생성기 출력**(`buildStaticHtml` target `"zip"`) — 정적 사이트이므로 원장 전제 "고객 사이트는 정적"(원장 L31)과 맞는다. React zip은 발행 대상이 아니다(빌드가 필요해 발행 2분 예산에 Git 빌드를 넣지 말라는 원장 L148과 충돌).
- **CSP meta와 서버 헤더의 관계**: 지금 산출물은 HTML 안 CSP meta 1개를 갖는다(1.1). meta CSP가 무시하는 `frame-ancestors`·`report-uri`·`report-to`·`sandbox`는 이미 넣지 않기로 했다(`CSP-SPEC.md:53`) [L1]. HSTS·nosniff·Referrer-Policy·`X-Robots-Tag`는 응답 헤더 전용이라 meta로 대신할 수 없다 [L3 확인 필요]. 따라서 발행본은 **서버 헤더가 정본**이고 meta는 내보내기(zip·`file://`)용으로 유지한다. 둘이 같이 있으면 브라우저는 두 정책을 모두 적용(교집합)하므로 서버 헤더가 meta보다 넓으면 meta가 사실상 상한이 된다 [L3 확인 필요] → M5-b 종료 기준 5에서 두 정책을 같은 생성기에서 만들어 불일치 0을 확인.

### 후보 A ★ Cloudflare Workers for Platforms + R2 (원장 조건부 추천, 원장 L9)

- **Host→tenant→release**: wildcard DNS(proxied) + `*.{도메인}/*` Workers Route → 단일 신뢰 라우터(dispatch) Worker가 Host로 tenant 결정 [17](원장 L41·L201–203). R2 객체를 Host→tenant→release→파일로 매핑하는 것은 원장도 "설계 추정"(L41). 정적 전용이면 tenant별 user Worker 없이 고정 사업자 코드만 쓰는 구성이 가능하다는 판단(L42). Workers Custom Domain 기능과 Route를 혼동하지 않는다(L41).
- **원자적 전환 지점**: 불변 release 전부 업로드·검증 → tenant별 active-release 참조 **1회 교체**. "설계안이지 기성 rollback 상품이 아니다" — 원자성·동시 쓰기 제어(CAS)·release 보존·소요 시간은 **제품 구현 책임 [미확인]** [22][66](L55, L361). cached custom domain 경로는 stale 객체가 TTL까지 남을 수 있고 Worker binding 접근은 캐시 영향 없음 [22](L223–224) → **R2는 Worker binding으로만 읽고 R2 공개 도메인을 열지 않는다.**
- **롤백 범위**: tenant 단위(참조가 tenant별). 일반 Workers version rollback(최근 100개, R2 데이터 복구 안 함 [23][24][25], L225–227)은 WfP user Worker에 그대로 적용된다고 보장되지 않는다(L55) → 플랫폼 rollback에 기대지 않는다.
- **미리보기 만료 집행 위치**: 라우터 Worker(엣지)에서 서명·`exp` 검사, **모든 asset 요청**에 적용. WfP user Worker에는 Version URL이 없다(일반 Worker Version URL은 켜면 public) [27](L67, L234–235) → 자체 설계 필수, [미구현].
- **보안 헤더 위치**: R2 응답에는 라우터 Worker가 헤더를 붙인다 — `_headers`(Static Assets 기능 [26])는 R2 응답에 자동 적용되지 않음 [66](L79).
- **와일드카드 TLS 깊이**: Universal SSL은 apex + **1단계** subdomain만 [31](L242–243). `{slug}.publish.{도메인}` 같은 2단계는 추가 인증서 전략 필요 → **발행 도메인 구조를 `{slug}.{발행 전용 apex}` 1단계로 고정**하는 것을 M5-b 전제로 둔다(원장 L360 "wildcard TLS 깊이부터 고정"). P2 Cloudflare for SaaS: 100 hostnames 포함·추가 $0.10/hostname, 고객 측 wildcard custom hostname은 Enterprise 전용 [32][69](L244–246).
- **약관**: Developer Platform 특약 §10 WfP "End Users on your Internet Properties" 예외 [30](L104, L241) — Cloudflare 계정/API 재판매 허가가 아님. self-serve §2.2.1(a)는 접근권 판매·제3자 대리 가입 금지 [29](L239), 일반 $5 Workers로 예외를 넓히지 않음(L340). §8 불법·유해 콘텐츠 통지 없는 차단 가능 [30](L240). R2 결합·우리 과금 모델 최종 적합성 [미확인].
- **비용**: WfP $25/월(20M req·60M CPU-ms·1,000 scripts 포함, 초과 $0.30/M req 등) · R2 Standard $0.015/GB-월, Class A $4.50/M · B $0.36/M, egress 무료(무료분 10GB·A 1M·B 10M) [21][28](L89–90, L215–221). 라우터 경유·R2 서빙은 과금 대상(static assets 직서빙만 무료) [20](L41). $5와 $25 결합 청구 [미확인](L90).
- **기타 위험**: R2 기반 논리 사이트 수·publish API throughput 한도 [미확인] · 일반 Workers 500개 한도를 WfP 한도로 보지 않음(L42).
- **원장 전제**: "고객 사이트는 정적, **플랫폼 소유 라우터는 허용**" — 라우터 자체가 금지되면 재검토(L31) → MQ-M5-07.

### 후보 B Vercel (wildcard 도메인 + 플랫폼 rollback)

- **Host→tenant→release**: 모든 플랜 wildcard 지원 [1](L156). 단일 wildcard 프로젝트 안에서 Host 기반 tenant 라우팅은 별도 구현("추정", L39). wildcard는 Vercel NS 또는 DNS challenge 위임 필요 [1](L39, L77).
- **원자적 전환 지점**: `POST /v13/deployments` → READY 확인 [10](L52, L184) → 승격. rollback `POST /v1/projects/{projectId}/rollback/{deploymentId}`, routing layer에서 "within seconds"·재빌드 없음 [62][63](L321–322) — end-to-end p95 SLA 아님 [15].
- **롤백 범위 위험**: 단일 프로젝트 rollback은 **모든 tenant를 함께 되돌린다**(L52). tenant별 rollback이 필요하면 tenant당 프로젝트(도메인 soft limit Pro 100,000/project, 배포 6,000/일 — L157, L161) 또는 자체 참조 전환이 필요. rollback 뒤 production auto-assignment 꺼짐(L175). Hobby는 직전 1개만·비상업 [5](L174, L87).
- **미리보기 만료 집행 위치**: 플랫폼 preview는 기본 public, branch URL 추측 가능 [6](L65, L176–177), retention이 정각 만료가 아님(보통 48h 이내, 최대 30일) [7](L178) → **24h 거부 수단으로 부적합**. multi-tenant preview URL은 Enterprise 전용 [1](L158). 자체 서명 계층(Edge Middleware 등 [L3 확인 필요])이 필요.
- **보안 헤더 위치**: `vercel.json` headers [9](L77).
- **TLS**: verified domain SSL 자동, custom cert 업로드는 Enterprise [1](L159, L77).
- **약관**: 일반 약관 §11 "sublicense, resell … or otherwise commercially exploit" [11](L102, L185) — Platforms 문서와 충돌, 별도 서면 확인 필요(L339).
- **비용**: Pro $20/월($20 credit·CDN 1TB·1M req, 추가 seat $20), 실제 합계 [미확인] [3][4](L87).
- **기존 제품 앱 Vercel 프리뷰와 별건**: 이 결과만으로 이전·삭제하지 않는다(원장 L370).

### 후보 C AWS S3 + CloudFront

- **Host→tenant→release**: standard distribution에 wildcard alias + SAN, edge 함수에서 Host→S3 prefix 라우팅을 직접 구현 [45][46](L44). 대안 multi-tenant distribution은 계정당 20개 [L60, L284, L317].
- **원자적 전환 지점**: S3는 **단일 key만 원자적**, 여러 key 동시 갱신 불가 [65](L327–328) · CloudFront 설정 전파는 edge마다 비동시 [48](L288) → versioned filename [47](L285–286) + 작은 참조 객체 1개 교체를 직접 설계. 1분 목표 판정 보류(L57).
- **미리보기 만료 집행 위치**: CloudFront signed URL이 요청마다 만료 검사 [50](L69, L291–292). **HTML만 서명하면 나머지 asset은 보호되지 않음** → signed cookie 또는 경로 전체 서명 [L3 확인 필요].
- **보안 헤더 위치**: response headers policy로 CSP·HSTS·noindex를 코드 없이 적용 [49](L81, L289–290) — 후보 중 헤더 관리가 가장 선언적.
- **TLS**: distribution당 인증서 1개 [45](L279), ACM DNS 검증 자동 갱신 [51](L293–294), 초기 발급 지연 [미확인](L81).
- **약관**: §6.1 End Users 대상 서비스 제공 · §2.4 자격증명 판매 금지 [52](L106, L295–296), 최종 법무 [미확인].
- **비용**: flat-rate Free $0(1M req·100GB) · Pro $15/distribution(10M·50TB·S3 50GB credit) · PAYG Asia $0.120/GB · S3 $0.023/GB [42][43][44](L92).
- **제품 위험**: 라우팅·서명·전환을 가장 많이 직접 짓는다(운영 부담). 1인 운영 PoC 기준 구현량이 가장 크다 [추정].

### 후보 비교 요약

| 관점 | A ★ WfP+R2 | B Vercel | C S3+CloudFront |
|---|---|---|---|
| Host→tenant | 라우터 Worker(자체) [17] | wildcard 프로젝트 + 자체 라우팅 [1] | edge 함수(자체) [45][46] |
| 원자적 전환 | 참조 1회 교체(자체 CAS) [22][66] | 플랫폼 승격 [10] | 참조 객체 1개(단일 key 원자) [65] |
| rollback 범위 | tenant 단위(자체) | **프로젝트 전체**(L52) | tenant 단위(자체) |
| 미리보기 24h | 라우터에서 자체 서명 [27] | 플랫폼 preview 부적합 [6][7] | signed URL/cookie [50] |
| 서버 헤더 | 라우터가 주입 [66] | `vercel.json` [9] | headers policy [49] |
| 와일드카드 TLS | 1단계만 [31] | NS/DNS 위임 [1] | 인증서 1개/dist [45] |
| 약관 | WfP 예외 있음 [30], 일반 Workers 아님 [29] | 재판매 제한 [11] | End Users 조항 [52] |
| 첫 비용 | $25 + R2 종량 [28] | $20 + seat [3] | $0~$15/dist [42] |

### 제외 후보 (원장 근거)

- Cloudflare Pages 단독: wildcard custom domain 미지원 [13], preview hash URL 영구 접근 [14](L40, L66).
- Netlify: 서비스 구독계약 §2.4(a) 재판매 제한 [41] · API deploy 3회/분·100회/일 [36] · preview URL 예측 가능 [38] · 한 프로젝트 초과 시 전체 pause [33](L43, L56, L68, L91, L105).
- Firebase: 원장 범위 밖(L348).

---

## 4. 사용자 흐름·상태와 수용 기준

### 4.1 상태

```
[편집 중] ─발행 누름→ [게이트 검사] ─차단>0→ [게이트 차단] (내보내기 게이트와 같은 화면·문구)
                         └차단 0→ [발행 확인] ─취소→ [편집 중]
                                     └확인→ [업로드 중] → [검증 중] → [전환 중] → [공개됨 vN]
                                                 └───────실패────────┘→ [발행 실패] (공개 버전 그대로 vN-1)
[공개됨 vN] ─롤백(vK 선택·확인)→ [롤백 중] → [공개됨 vK] | [롤백 실패] (공개 버전 그대로 vN)
[공개됨 vN] ─미리보기 링크 만들기→ [링크 유효(만료 시각 표시)] ─24h/폐기→ [링크 만료]
```

- 실패는 **항상 "지금 공개 중인 버전"을 함께 표시**한다(실패해도 방문자는 이전 버전을 본다는 사실).
- "검증 중"은 공개 URL에서 새 해시가 보이는지 서버가 확인하는 단계다(2.1 종료 시점과 같음).

### 4.2 수용 기준 PUB-AC (초안)

| ID | 기준 | 단계 |
|---|---|---|
| PUB-AC-01 | 품질 게이트 차단 >0이면 "발행" 실행 불가, 내보내기와 같은 차단 목록·문구(FR-PUB-01) | M5-c |
| PUB-AC-02 | 발행 확인 화면에 대상 주소·버전·"이전 버전 vN-1은 롤백용으로 보존" 표시 | M5-c |
| PUB-AC-03 | 진행 상태 업로드·검증·전환 3단계 구분, 각 단계 실패 시 해당 단계 이름과 "공개 중: vN-1" 표시 | M5-c |
| PUB-AC-04 | 발행 p95 ≤2분(2.1 정의, 고정 표본) | M5-b |
| PUB-AC-05 | 전환 중 섞인 release asset 응답 0건 | M5-b |
| PUB-AC-06 | 롤백 ≤1분(2.1 정의), 재업로드 없이 포인터 교체만 | M5-b |
| PUB-AC-07 | release 목록: 버전·발행 시각·발행자·현재 공개 표시, 공개 중인 버전은 롤백 대상에서 비활성 | M5-c |
| PUB-AC-08 | 발행·롤백·링크 발급이 감사 로그에 1건씩(행위자·시각·release)(TR-SEC-11) | M5-b |
| PUB-AC-09 | publisher가 아닌 계정의 발행·롤백 API 호출 거부(TR-SEC-02) | M5-b |
| PUB-AC-10 | 발행 사이트 응답에 CSP·HSTS·nosniff·Referrer-Policy 헤더(TR-SEC-08), meta CSP와 불일치 0 | M5-b |
| PUB-AC-11 | 미리보기 링크는 추측 어려운 서명 토큰, 만료 시각 화면 표시(24h) | M5-d |
| PUB-AC-12 | 만료 후 HTML·CSS·JS·이미지 **모두** 거부, 원본 저장소 직접 URL 거부(FR-PUB-06 "만료 후 거부") | M5-d |
| PUB-AC-13 | 미리보기 응답에 `X-Robots-Tag: noindex` + meta robots noindex | M5-d |
| PUB-AC-14 | 링크 수동 폐기 즉시 거부(캐시 포함 상한 시간은 측정 후 확정) | M5-d |
| PUB-AC-15 | 호스팅 토큰·서명 키가 브라우저 번들·응답·로그에 0건(TR-SEC-10) | M5-b |
| PUB-AC-16 | 발행 실패가 지표·경보로 남음(TRD 11 "발행 실패(P1)") | M5-c |

---

## 5. 사용자 질의 MQ-M5 (이 레인에서 결정하지 않음)

| ID | 질의 | ★ 제안 | 근거 |
|---|---|---|---|
| MQ-M5-01 | 고객 사이트 호스팅 사업자 · 결정 ADR 번호 | ★ **Cloudflare WfP + R2를 "검증 대상"으로 선택**, ADR(ADR-008 후보) 상태는 "계약 적합성 확인·preview 24h 우회 차단·발행 p95/rollback 실측 통과 전 보류" | 원장 1절 [17][28][30] · 5절 PM 묶음 · DEV_PLAN `:143` "ADR-004"는 성능 ADR이라 호스팅 ADR이 따로 필요 [L1] |
| MQ-M5-02 | 제품 CI 신설 — 플랜·필수 check·OS 범위 | ★ GitHub Actions Linux 1종 · 필수 check 4개(typecheck·lint·test·build) · windows·macOS는 B-M4B-02 닫을 때 1회 수동 또는 별도 러너(추가 결정). **필수 check 강제가 목적이면 PRIVATE 저장소는 Pro/Team 플랜 필요** — 현재 플랜 확인 | 원장 [53][54][58](L135, L144) · B-M4B-02 `BACKLOG.md:103` · 원격·push 사용자 승인(CLAUDE.md 7) |
| MQ-M5-03 | 백엔드 위치 — AOS 이관 vs 독립 | ★ **독립(최소 발행 서버)** — M5-b 최소 집합 S1~S6만. AOS 이관은 TRD v0.2 전제와 맞지만 ADR-001(AOS 미변경)과 충돌 | TRD TR-SEC-10 "AOS 비밀 저장 재사용"·`:183` AOS `project_access` 전제 vs ADR-001 `:7,18` 독립·자체 구현 · ADR-007 P7 "자체 인프라 vs ADR-001 개정" |
| MQ-M5-04 | 계정·인증 | ★ M5-b는 **수동 발급 계정 1개**(셀프 가입·조직 없음), 인증 방식은 MQ-M5-03 결정에 따름. 계정 2개 이상 전 서버 측 게이트 재검증 범위 결정 | TRD 4.6 `:183` · TR-SEC-02 · 1.3 위험 |
| MQ-M5-05 | 비용 상한 | ★ PoC 월 상한을 숫자로 정해 ADR에 기록(원장 단가: WfP $25+R2 종량 [21][28], 일반 Workers $5와 별도, Vercel Pro $20 [3][4], Netlify Personal $9/Pro $20(원장 L91), CloudFront flat-rate Pro $15/distribution [42]) + CI(Free 2,000분 안이면 $0 [53]) · 초기 tenant 수·월 발행 수 입력 필요 | 원장 L364–365 · L380 "빈 입력값" · 월 총액·손익분기 [미확인](L96) |
| MQ-M5-06 | 법무 — 약관 서면 확인 | ★ 사업자에 "정적 고객 사이트를 우리 도메인에 유료 제공, 고객에게 사업자 계정/API 접근권은 판매하지 않음"을 명시해 **서면 계약 적합성 확인** 후 M5-b 공개 · B-M4B-03(NOTICE·소스 공개 의무) 같이 확인 | 원장 6절 3 · 1절 2 [1][11][13][41] · `BACKLOG.md:104` |

| MQ-M5-07 | 정본 해석 — (a) 플랫폼 소유 라우터(엣지 코드) 허용 여부 (b) TR-SEC-08(서명·24h·보안 헤더)을 M5 필수로 유지 | ★ (a) 허용 — 고객 산출물은 정적, 라우터·만료 검사 코드는 사업자 소유 (b) 필수 유지(가점으로 낮추지 않음) | 원장 L31 "라우터도 금지라면 Workers+R2 추천은 재검토" · L343 "정본 수정 없이 가점으로 낮추면 안 됨" · 6절 2 · `TRD.md:290` [L1] |
| MQ-M5-08 | 발행 도메인 구조 | ★ `{slug}.{발행 전용 apex}` **1단계** 고정(제품 앱 도메인과 분리) — 2단계(`{slug}.publish.…`)는 추가 인증서 전략 필요 | 원장 [31](L242–243, L360) · 제품 앱과 고객 사이트를 다른 apex로 두면 쿠키·출처가 섞이지 않음 [L3 확인 필요] |

이 레인이 하지 않은 것: 계정 생성 · 사업자 문의 · 외부 발송 · 원격 쓰기 · 앱 코드 변경 · 외부 리서치.

---

## 부록 A. 목업·정본과 다르게 한 부분
- DEV_PLAN `:143` "호스팅 결정(ADR-004) 후 착수" → ADR-004는 성능 예산이라 **새 호스팅 ADR**로 읽음(MQ-M5-01).
- TRD 5 publish/rollback API는 AOS `/api/design-studio` 전제 → 경로·권한 모델만 따르고 위치는 MQ-M5-03으로 미룸.
