# M4 4.6 장애 대응 — 운영 문서 초안

> 저장 상태부터 확인하세요. 청크 로드 실패는 같은 탭의 재시도만으로 복구되지 않을 수 있어 새로고침을 안내하되, 미저장 내용이 없다는 확인을 먼저 받아야 합니다. 용량 초과·금지 패턴 실패는 성공이 아닙니다. [출처: dev/active/m4a-qa/QA-REPORT.md:172,250-253] [출처: app/src/components/studio/SaveActions.tsx:8-10,49-54]

## 적용 범위·형식 선택

- 운영자용 초안입니다. 기준 저장소는 web-builder-solution main `df8694a6`, 출처 경로는 저장소 루트 기준입니다. 이번 작업은 저장소 읽기만 수행했으며 아래 실행 결과는 기존 QA·AppSec 기록의 인용입니다.
- 정적 zip은 호스팅·개발자 전달용, 단일 HTML은 이미지·글꼴을 포함한 파일 1개, PNG는 시안 이미지입니다. React zip은 M4-b 범위입니다. [출처: docs/design/m4a/EXPORT-SPEC.md:4,43-47]
- zip은 루트 `index.html`·`LICENSES.md`와 `assets/`로 구성됩니다. 실제 QA 산출물에는 `assets/fonts/OFL.txt`도 포함됐으므로 초기 SPEC의 파일 트리만 보고 불필요한 파일로 삭제하지 마세요. [출처: docs/design/m4a/EXPORT-SPEC.md:68-79] [출처: dev/active/m4a-qa/QA-REPORT.md:228]

## 증상 → 원인 → 조치

‘조치’는 운영 권고입니다. 제품 자동 복구 기능이나 새로 검증한 해결책으로 해석하지 마세요.

| 증상·사용자 문구 | 원인·확인 근거 | 운영자가 할 일 |
|---|---|---|
| 두 사이트 내보내기 버튼이 막힘 | 게이트 차단 또는 구조 미리보기 섹션이 남아 있습니다. [출처: docs/design/2a-05/SPEC.md:366-367] | GATE-GUIDE.md에 따라 첫 차단부터 고치고, 렌더 가능한 변형으로 바꾸거나 구조 미리보기 섹션을 지웁니다. [출처: app/src/features/studio/gateView.ts:46-62] |
| ‘묶음이 {n}MB로 상한 64MB를 넘어 만들지 않았습니다 — 큰 이미지를 줄여 주세요’ | zip 상한은 64 × 1024 × 1024 B입니다. 설계는 재시도 불가지만 현재 구현은 재시도 가능 실패로 처리합니다(B-M4A-07). [출처: docs/design/m4a/EXPORT-SPEC.md:126-130] [출처: dev/active/m4a-qa/QA-REPORT.md:53,158] [출처: docs/06-handoff/BACKLOG.md:80] | 같은 입력으로 재시도만 반복하지 말고 큰 이미지를 줄인 뒤 저장·재생성하도록 안내합니다. ‘다시 시도’ 노출을 용량 문제가 해소됐다는 뜻으로 설명하지 마세요. |
| 금지 패턴 검사 실패·일반 실패 alert | 외부 링크, 없는 앵커 대상, 외부 URL 속성, 금지 고정 브랜드 문자열 등은 생성기 실패 대상입니다. 전용 문구 `export.fail.pattern`은 미구현(B-M4A-06)입니다. 일반 재시도 문구로 보인다는 설명은 QA의 코드 읽기 추정이며, 브라우저 패턴 실패 문구는 미관측입니다. [출처: docs/design/m4a/EXPORT-SPEC.md:169-189] [출처: dev/active/m4a-qa/QA-REPORT.md:160-163,252] [출처: docs/06-handoff/BACKLOG.md:79] | 검사 우회·보안 규칙 해제를 안내하지 마세요. 형식·문서 revision·실패 문구·재현 직전 변경을 기록해 Jarvis에게 전달합니다. 일반 실패 문구만으로 패턴 실패라고 단정하지 않습니다. |
| ‘내보내지 못했습니다’ + ‘다시 시도’; 네트워크 복구 후에도 같은 탭 실패 | B-M4A-08: QA에서 실패한 동적 import가 Chromium 모듈 맵에 남아 같은 URL 재시도가 실패했습니다. 동일 청크 fetch 200이어도 import는 실패했고 포커스 BODY 유실도 관측됐습니다. [출처: docs/06-handoff/BACKLOG.md:81] [출처: dev/active/m4a-qa/QA-REPORT.md:250-253] | 먼저 저장 완료·미저장 여부를 확인하고, 저장된 문서임을 확인한 경우 새로고침 후 내보내기를 안내합니다. 같은 탭 ‘다시 시도’만 반복시키지 마세요. 미저장·저장 실패 상태면 손실 가능성을 먼저 설명하고 일괄 새로고침하지 않습니다. |
| 성공 표시인데 파일이 내려오지 않음 | 페이지는 `a download` 결과를 감지할 수 없습니다. 무인 Chromium에서는 자동 내려받기를 관측하지 못했지만 화면 링크로 저장했습니다. [출처: docs/design/m4a/EXPORT-SPEC.md:235] [출처: dev/active/m4a-qa/QA-REPORT.md:224] | 성공 영역의 ‘내려받기’를 누르고 브라우저 다운로드 권한을 확인하도록 안내합니다. 실제 파일 저장 여부를 사용자에게 확인합니다. 제품 문구: ‘내려받기가 시작되지 않으면 브라우저의 다운로드 권한을 확인하세요’. [출처: dev/active/m4a-qa/QA-REPORT.md:159,224] |
| ‘다른 탭에서 편집 중이라 이 탭은 저장하지 않습니다’ | 쓰기 잠금은 첫 쓰기 때 획득하며 다른 탭 보유 시 readonly입니다. ‘다시 저장’ 시 잠금 재요청 경로는 있으나 readonly UI는 조건에 따라 ‘저장 확인’ 또는 버튼 없음입니다. [출처: app/src/features/studio/save/reasonText.ts:8] [출처: app/src/data/persistence/writerLock.ts:2-5] [출처: app/src/components/studio/SaveActions.tsx:59-63] | 작성 기준 탭을 정하고 중복 편집을 멈춥니다. 잠금 보유 탭을 닫기 전 그 탭의 저장을 확인합니다. 현재 탭의 미저장 변경을 보존할 방법부터 협의하고, 노출되는 확인 동작을 사용합니다. readonly·dirty 또는 메모리 저장이면 ‘저장 확인’ 버튼이 없을 수 있습니다. [출처: app/src/components/studio/SaveActions.tsx:59-63] |
| ‘다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요’ | stale은 최신성 확인 실패이며 새로고침 전까지 쓰지 못합니다. [출처: app/src/features/studio/save/reasonText.ts:6] [출처: app/src/data/persistence/writerLock.ts:3-5,50-51] | 다른 탭의 저장 내용을 기준으로 삼을지 확인합니다. ‘버리고 새로고침’은 폐기 확인을 거치며 이 탭 초안을 버리는 동작임을 설명하고 선택하게 하세요. 자동 병합을 약속하지 않습니다. [출처: app/src/components/studio/SaveActions.tsx:8-10,49-54,65-71] |
| `/projects` 행이 일반 ‘저장하지 못했습니다’·‘다시 저장’으로만 보임 | B-RS-09: stale 행의 첫 문구가 일반 실패이며 한 번 누르면 stale 문구가 나오는 알려진 편차입니다. 조회로 잠금을 잡는 구현은 되돌렸고 승인된 인터페이스 변경이 재개 조건입니다. [출처: docs/06-handoff/BACKLOG.md:64] | 일반 실패를 단순 통신 장애로 단정하지 마세요. 편집기 저장 상태·다른 탭 존재를 함께 확인하고 stale 대응으로 분기합니다. |
| 브라우저 저장소 미지원·‘이 탭에만 저장합니다’ | `navigator.locks`가 없으면 unsupported이며 쓰기 0 폴백입니다. 상태 문구도 이 탭에만 저장함을 알립니다. [출처: app/src/data/persistence/writerLock.ts:5] [출처: app/src/features/studio/save/reasonText.ts:10] | 영속 저장 완료로 안내하지 마세요. 탭을 닫거나 새로고침하기 전에 저장 한계를 설명하고 Jarvis에게 환경을 전달합니다. |

## 알려진 제약 원장 — B-M4A-01~10

| ID | 현재 제약·운영 해석 |
|---|---|
| B-M4A-01 | 범용 zip 이름 검사는 허용표보다 약하지만 현재 호출자는 허용표를 먼저 통과합니다. 현재 사용자 경로로 도달 가능한 취약점이라고 확대하지 않습니다. [출처: docs/06-handoff/BACKLOG.md:74] |
| B-M4A-02 | DOS 시각이 로컬 시간대 의존이라 같은 revision도 기기 간 zip 해시가 다를 수 있습니다. QA의 동일 입력 해시 일치를 기기 간 보장으로 확대하지 않습니다. [출처: docs/06-handoff/BACKLOG.md:75] [출처: dev/active/m4a-appsec/REPORT.md:69-70] |
| B-M4A-03 | LICENSES.md F-14 검사는 미구현이며 내용은 상수입니다. 문안 레인에서 함께 검토할 항목입니다. [출처: docs/06-handoff/BACKLOG.md:76] |
| B-M4A-04 | 파일 이름의 bidi·제로폭 문자 및 예약 이름 부분 일치 처리가 남아 있습니다. 의심스러운 표시 이름은 원문과 함께 보고합니다. [출처: docs/06-handoff/BACKLOG.md:77] |
| B-M4A-05 | CSS 정규식 fail-closed 검사에 문자열 `url(`·Tailwind 임의값 클래스 오탐 가능성이 있습니다. 새 킷 CSS 추가 뒤 실패면 회귀 신호로 보고합니다. [출처: docs/06-handoff/BACKLOG.md:78] |
| B-M4A-06·07 | 패턴 전용 문구 미구현·용량 초과 retryable 편차입니다. 위 증상 표에 따라 대응합니다. [출처: docs/06-handoff/BACKLOG.md:79-80] |
| B-M4A-08 | 청크 실패 뒤 같은 탭 재시도 복구 불가입니다. 저장 확인 후 새로고침 안내가 필요합니다. [출처: docs/06-handoff/BACKLOG.md:81] |
| B-M4A-09 | Safari·Firefox, Archive Utility 더블클릭, Windows 탐색기 해제는 미확인입니다. [출처: docs/06-handoff/BACKLOG.md:82] |
| B-M4A-10 | 프로젝트 가져오기 신뢰 경계 심층 검토·산출 HTML CSP 설계는 별도 Security 레인입니다. 완료된 보안 검토로 설명하지 않습니다. [출처: docs/06-handoff/BACKLOG.md:83] |

## 열린 B-RS 항목 — 운영 영향만

| ID | 남은 범위·대응 |
|---|---|
| B-RS-08 | L1 U14-b Low 변이 검출 테스트가 남았습니다. 회귀 검증 완료로 확대하지 않습니다. [출처: docs/06-handoff/BACKLOG.md:63] |
| B-RS-09 | stale 목록 행 문구 편차입니다. 위 저장 대응 표를 적용합니다. [출처: docs/06-handoff/BACKLOG.md:64] |
| B-RS-11 | 편집기 status 2개 문제가 UX 수정 레인으로 배정돼 있습니다. 알림 중복 보고를 수집합니다. [출처: docs/06-handoff/BACKLOG.md:66] |
| B-RS-12 | 390 폭에서 저장 상태·‘버리고 새로고침’이 스크롤 밖일 수 있습니다. 안 보인다고 상태가 없다고 판단하지 말고 툴바 쪽을 확인합니다. [출처: docs/06-handoff/BACKLOG.md:67] |
| B-RS-19 | 미리보기 잠금 effect 전 Ctrl+Z 경합은 이론상·미재현이며 flaky 후보 2건도 미재현입니다. 실제 사고로 확정하지 않습니다. [출처: docs/06-handoff/BACKLOG.md:84] |

## 검증 완료와 미확인 구분

- 기존 릴리스 게이트는 ‘PASS with notes’입니다. Chromium 로컬 서버·file://에서 이미지·글꼴 로드가 확인됐지만 모든 브라우저 통과라는 뜻은 아닙니다. [출처: dev/active/m4a-qa/QA-REPORT.md:3-4,233-242]
- AppSec 초회 기록은 Critical·High 0, Medium 2였고 EXPORT-SPEC 8b는 Medium 2의 FIX1 해소를 기록합니다. 이를 ‘보안 이슈 0’으로 바꾸지 마세요. Low·미검토 범위는 남아 있습니다. [출처: dev/active/m4a-appsec/REPORT.md:9,110-112] [출처: docs/design/m4a/EXPORT-SPEC.md:318-321] [출처: docs/06-handoff/BACKLOG.md:74-83]

| 미확인 항목 | 현재 근거·Jarvis 조치 |
|---|---|
| [확인 필요] Safari 로컬 서버·file://, Firefox 실화면 | Safari는 수동 행 미실행, Firefox는 미설치입니다. Q19 글꼴 파일 분리 결정을 브라우저 실측으로 재확인합니다. [출처: dev/active/m4a-qa/QA-REPORT.md:214-215,242] |
| [확인 필요] Archive Utility GUI 더블클릭·Windows 탐색기 해제 | `ditto -xk`·`unzip` 통과와 GUI 확인은 별개입니다. [출처: dev/active/m4a-qa/QA-REPORT.md:228-231] [출처: docs/06-handoff/BACKLOG.md:82] |
| [확인 필요] 20MB+ 문서 실화면 생성 성능 | UI로 목표 크기에 못 도달해 BLOCKED입니다. 약 1.1MB zip 성공을 20MB+ 실측으로 대체하지 마세요. 테스트 주입 등 측정 수단을 별도 결정합니다. [출처: dev/active/m4a-qa/QA-REPORT.md:255-258] |
| [확인 필요] 실제 Chrome 자동 내려받기 | Ego Lite 자동 이벤트 미관측은 도구 한계 추정이며 실제 Chrome 동작은 확인되지 않았습니다. [출처: dev/active/m4a-qa/QA-REPORT.md:224] |
| [확인 필요] 금지 패턴 실패의 실화면 문구 | 청크 실패 관측은 패턴 실패 검증이 아닙니다. 전용 문구는 미구현 상태로 유지합니다. [출처: dev/active/m4a-qa/QA-REPORT.md:160-163,252] |
| [확인 필요] 가져오기 신뢰 경계·CSP 설계 | Security 심층 검토·SPEC 개정 후보로 분리합니다. [출처: docs/06-handoff/BACKLOG.md:83] |

## 성능 예산 변경 시 운영 원칙 — ADR 개정 17·18 요약

- 개정 17: `/studio` 정규화 상한 129.13, 복원 132.11, raw 130.5로 RS6 전용 몫을 승인했습니다. 레인별 실측으로 기준선을 갱신하고 초과 시 감량 1회 후 재상신합니다. 이는 사용자 사이트 성능 게이트의 측정값이 아닙니다. [출처: docs/decisions/ADR-004-performance-budgets.md:285-290] [출처: app/src/engine/gate/runGate.ts:3]
- 개정 18: 상한은 그대로 두고 M4-a·링크 줄 합산 +0.10을 배정했습니다. 첫 실측 사용 +0.01, 남은 몫 0.09이며 누적 초과 시 감량 1회 후 재상신합니다. 이 문서 작업에서 예산 재측정은 하지 않았습니다. [출처: docs/decisions/ADR-004-performance-budgets.md:298-302]

## Jarvis 전달 양식 — 운영 권고

- 기록: 브라우저·OS, zip/HTML/PNG 구분, 저장 상태·문서 revision, 화면 실패 문구, 재현 순서, 실제 내려받은 파일 유무를 남깁니다. 관련 B-M4A/B-RS ID와 연결하세요.
- 위험: ‘버리고 새로고침’은 미저장 초안 손실을 수반할 수 있습니다. 사용자 선택 전에 폐기 의미를 설명하고, 저장 실패 상태의 새로고침을 무조건 안전하다고 안내하지 마세요. [출처: app/src/components/studio/SaveActions.tsx:8-10,49-54]
- 다음 검토: Jarvis가 위 미확인 항목을 QA·Security에 분리 배정하고, 이 초안의 발행 여부를 승인합니다.
