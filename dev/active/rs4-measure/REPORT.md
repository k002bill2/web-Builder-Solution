# RS4 측정 관문 — REPORT

- 성격: **미승인 초안(SPEC-4 r0.1b, Codex 미재검토)의 측정**. S1/S1r/S2/S3는 prototype 최소 스파이크일 뿐 제품 구현이 아니다. 구현 완료 주장 없음.
- base `1a48ce8`(앱 `93f8111`) · 브랜치 `k002bill2/rs4-measure` · 머신 Apple M1 Max / Node v24.12.0 / npm 11.6.2 (`rawlogs/01-machine.txt`)
- 마감 경위: 이전 실행(55턴)이 max_turns_reached로 종료 → `RESUME-CLOSE.md` 범위(집계·복원 검증·REPORT·증거 커밋)만 수행. 새 측정·새 스파이크·테스트 반복 0.
- QA 병렬 검토(`../rs4-review`, 다른 worktree)는 무접촉. 그쪽 지적의 참고 보고는 Jarvis 처리.

## 1. Route raw bytes (gzip bytes, 정수) — 판정선 대비

측정 도구: `tools/rawbytes.mjs`(앱 `scripts/check-bundle-size.mjs` 사본에서 sizeOf만 bytes 정수로 바꿈). 로그의 "KB" 표기는 이 사본에서 bytes다.
판정선(bytes): /studio 진입 129900 · 복원 진입 132940 · profile 첫 100000/진입 125000 · projects 첫 100000/진입 125000.

| 시나리오 | base (03) | S1 (11) | S1r (13) | S2 (21) | S3 (31) | 판정선 |
|---|---|---|---|---|---|---|
| /profile 첫 화면 | 99877 | 99897 (+20) | 99885 (+8) | 99876 (−1) | 99871 (−6) | ≤100000 |
| /profile 진입 | 120085 | 120133 (+48) | 120126 (+41) | 120117 (+32) | 120109 (+24) | ≤125000 |
| /profile (3안) 진입 | 122562 | 122613 (+51) | 122603 (+41) | 122597 (+35) | 122587 (+25) | ≤125000 |
| /projects 첫 화면 | 98412 | 99235 (+823) | 98861 (+449) | 98851 (+439) | 98850 (+438) | ≤100000 |
| /projects 진입 | 105681 | 106509 (+828) | 106139 (+458) | 106125 (+444) | 106126 (+445) | ≤125000 |
| **/studio 진입** | 129896 | **129919 (+23) 초과** | **129911 (+15) 초과** | **130818 (+922) 초과** | **130368 (+472) 초과** | ≤129900 |
| **/studio 복원 진입** | 132929 | **132952 (+23) 초과** | **132944 (+15) 초과** | **133850 (+921) 초과** | **133401 (+472) 초과** | ≤132940 |
| UNAPPROVED /studio 미확인 인계 — 기억 있음 | — | UNMEASURED | UNMEASURED | UNMEASURED | **131163 초과** | 한도 미승인 |
| UNAPPROVED /studio 미확인 인계 + 복원 진입 | — | UNMEASURED | UNMEASURED | UNMEASURED | **134196 초과** | 한도 미승인 |

판정
- profile·projects: 4개 스파이크 모두 판정선 안.
- **/studio·복원: 4개 스파이크 모두 판정선 초과 → 전부 FAIL.** 앱 빌드 자체도 S1/S1r/S2/S3 모두 `exit=1`(번들 검사 실패, `10/12/20/30-*-build.txt` 말미 원문).
- S1은 /studio를 바꾸지 않았는데도 +23B: 공유 index 청크 변화(로그 14 `14-S1r-studio-closure-files.txt`가 S1r의 /studio closure 파일 목록). 감량 1회(S1r = pendingWrites 정적 import 제거·전역 키 동기 조회) 후에도 +15B로 초과 — 규칙대로 감량 1회 후 raw 수치로 중단.
- S2(static studio 인계)·S3(동기 조회 + lazy 본문 `pendingStudio`)는 감량 미실행(감량 1회는 S1에서 사용). S3의 incomplete/예산 초과 원문은 `31-S3-rawbytes.txt:101-106`과 `30-S3-build.txt` 말미에 그대로 보존.
- UNAPPROVED 시나리오(자동 import가 참인 pending studio)는 S3에서만 `EXTRA_SCENARIOS`로 실측. S1·S1r·S2에서는 측정하지 않았다 → **UNMEASURED**, 통과로 간주하지 않음. 두 시나리오 모두 한도 승인 전이므로 **UNAPPROVED**.
- 참고: rawbytes 도구의 렌더 문서 "JS 84222.00KB > 90KB" 실패 문구는 단위가 섞인 사본의 산물(bytes vs KB)이라 판정 아님. base rawbytes 로그도 `exit=1`.

### 새 인터페이스·예산 상향 필요 여부 — 근거 구분
- **측정 근거(L1)**: 초안 그대로의 최소 스파이크 4종 모두 /studio 129900·복원 132940을 넘는다(최소 +15B). 현 판정선 안에서 초안 범위를 담는 실행 후보는 이번 측정에서 0건.
- **측정 근거 없음(추정, 미측정)**: 다른 구조(예: /studio 공유 청크 무변화 설계)로 판정선 안에 들어갈 수 있는지는 측정하지 않았다. 따라서 "예산 상향이 필요하다"는 이 측정만으로 확정할 수 없고, 상향 요청을 하려면 해당 후보의 raw 수치가 먼저 필요하다. 수치 없는 상향 요청 없음.

## 2. P-3 이미지 안전 경로 하네스 (AC17) — `rawlogs/04-p3-harness.txt`, `harness/rs4P3.harness.test.ts`

6 tests 통과(측정 단언), 하네스는 앱에서 제거되어 이 폴더에만 보존.
- a. WebLock 거절 → 이탈 → 편집기 밖 확인: doc는 커밋되지만 **이미지 레코드 없음**(`a.IDB images 레코드 있음 false`), 리로드 복원 맵 0 → **이미지 누락 실재(RS4-R10 확정)**. 대조(맵 등록 유지)는 이미지 있음.
- b. quota 실패(제출됨): 재시도에 이미지 op 포함.
- c. offline(저장 호출 전 멈춤): 편집기 밖 확인이 **옛 레코드로 resolve** — 저장소 메모리에 없는 편집은 확인 대상이 아니다.
- d. 스냅샷 있는 문서에서 `deleteSnapshot(p, "")` = revision·hash·스냅샷·snapshotSeq·IDB 변화 0.
- d2. **빈 문자열 id 수동 스냅샷이 실재 가능**(파일 가져오기 `checkFile.ts:73` isString 허용) → 그 경우 `deleteSnapshot(p, "")`가 **그 스냅샷을 삭제**한다.

판정: `deleteSnapshot(projectId, "")`를 안전한 confirm으로 쓰는 것은 **승인 불가**(빈 id 부재가 보장되지 않음 + 이미지 누락 실재). 편집기 밖 confirm은 금지 판정, 별도 계약(전용 confirm 인터페이스) 승인 필요.

## 3. base 복원 검증

| 항목 | 명령 | 결과 |
|---|---|---|
| 앱 source diff | `git diff --quiet 1a48ce8 -- app` | 0 (APPDIFF0) · untracked 앱 파일 0 (`git ls-files -o --exclude-standard app` 빈 출력) |
| lock | `git diff --quiet 1a48ce8 -- app/package-lock.json` · `shasum` | 0 · sha1 `fdd7c98e…` = `00-lock-before.txt` |
| base 재빌드 1회 | `npm run build` (app/) | exit=0 (`40-restore-build.txt`) |
| dist 바이트 | `find . -type f \| sort \| xargs shasum` vs `01-base-dist-sha.txt` | 143/143 동일 (`41-restore-dist-sha.txt`) |
| rawbytes | `node dev/active/rs4-measure/tools/rawbytes.mjs` vs `03-base-rawbytes.txt` | `diff` 출력 0, 바이트 동일 (`42-restore-rawbytes.txt`) |

→ 복원 검증 **통과**. 테스트 재실행 0. full suite 확정(304 files / 2769 tests)은 실험 전 base 기준(`02-base-suite.txt`)만.
- 임시 서버: LISTEN 중인 node 2개(5173 cwd `Agent-System/src/dashboard`, 5480 cwd `Work/web-builder-solution/app`)는 이 worktree가 아님 → 무접촉.

## 4. 증거 파일 정리
- `patches/S1.patch`·`S1r.patch`·`S2.patch`·`S3.patch`: 실험 diff 원문 보존. 주의: S1r/S2/S3의 새 파일(`pending/*.ts`) 헌크는 경로가 `src/...`(app 기준), 기존 파일은 `app/src/...`(저장소 기준) — 재적용 시 두 부분의 root가 다르다. 원문 그대로 둠.
- `tools/.rawbytes.gen.mjs`: `rawbytes.mjs`가 매 실행 생성하는 사본(절대 경로 포함). 사본 안 `process.exit`로 `finally` 삭제가 건너뛰어 남는다. `rawbytes.mjs`로 재생성 가능하므로 측정 코드로서 불필요 → **삭제**(경로 기록만).
- 측정 실패 근거: 각 `*-build.txt` 말미 `exit=1` + 예산 검사 실패 원문.
