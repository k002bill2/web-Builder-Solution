# SAMPLE-BUNDLE REPORT

결론: 항목 1(BL-4 + 직렬화기) 완료 · 항목 2는 묶음 조립부·파일명·버튼 순서까지 완료, **"디자인 샘플 내려받기" 버튼 연결(requestExport 경로·PNG 캡처 합류)은 시간 상한으로 미착수** · `/studio` 진입 증분 +0.00KB.

## 번들 (logs/bundle.txt, `npm run build` EXIT=0)
| 진입 | 정규화 실측 | 기준선 | 증분 | 판정(MQ-SMP-07 A ≤ +0.05) |
|---|---|---|---|---|
| `/studio/:projectId` | 128.79KB | 128.79KB | +0.00 | 통과 |
| `/studio/:projectId` 복원 진입 | 131.79KB | 131.79KB | +0.00 | 통과 |
- 신규 `features/studio/sample/*`는 아직 어떤 진입에서도 import되지 않음(버튼 미연결) → 증분 0은 버튼 연결 뒤 재측정 필요.

## AC
| ID | 결과 | 근거 |
|---|---|---|
| BL-4 | PASS | `src/render/protocolBl4.test.ts` — url(·image-set(·expression(·/* */·@·var(·env(·`red;}</style><script>` 거부, hex·rgb·rgba·hsl·hsla·이름 색 통과 (RED 9 fail 확인 → GREEN) |
| SMP-AC-A02 | PASS | `sampleJson.test.ts` — 2회 동일 문자열·cssVars = kitVars()·키 순서·끝 개행 |
| SMP-AC-A03 | PASS | 같은 파일 — `\d px` 0 |
| SMP-AC-A04 | PASS | 같은 파일 — order·type·variant·tone·motion만, instanceId·slots 0 |
| SMP-AC-A01 | 부분 | 조립부만: `sampleZip.test.ts` 엔트리 5개·README·파일명 `{이름}_r{rev}_sample.zip`. 버튼 클릭 → 다운로드 1회 테스트 미작성(버튼 미연결) |
| 순서(MQ-SMP-03 A) | 부분 | PNG 블록을 ExportButtons 위로 이동, FORMATS = HTML → 정적 zip → React zip. 샘플 묶음 버튼 자리는 연결 시 PNG 바로 아래 |
| SMP-AC-A06 | 게이트 참조 | 기존 버튼 숨김·삭제 0 — 회귀는 logs/gates.txt vitest 결과 |
| SMP-AC-A07 | PASS(현 상태) | 위 표 |
| SMP-AC-A08 | logs/gates.txt | |

## 설계 기록
- `design-tokens.json`의 `motion.preset` = 섹션 순서대로 `"L0"|"L1"|"L2"` 배열(SPEC 2.1 "섹션별"을 배열로 표기). `space.grid` = `--site-s2`(grid×1, rem) — 새 계산 없이 kitVars 값 재사용.
- zip 엔트리 이름: `design.png`·`design.html`·`design-tokens.json`·`sections.json`·`README.txt`(storeZip ASCII 이름 제약).
- 직렬화기 테스트는 구현 직후 작성(TDD RED 미확인 — BL-4만 RED 확인).

## 변경 파일
- `app/src/render/protocol.ts` · `app/src/render/protocolBl4.test.ts`
- `app/src/features/studio/sample/sampleJson.ts`(+test) · `sampleZip.ts`(+test)
- `app/src/components/studio/ExportButtons.tsx` · `app/src/components/studio/StudioLayout.tsx`

## 남은 일 (다음 레인)
1. "디자인 샘플 내려받기" 버튼: `ExportFormat`에 `sample-zip` 추가(projectRepository·memoryDocBook isFormat·슬롯·editorEvents·ExportAfter NAME·exportFlow FILE_NAME) — 정적 HTML 생성기 결과 + `capturePng` 결과 + sampleJson → `sampleZip`. 게이트·폴백 차단은 requestExport 경로 그대로.
2. SMP-AC-A01 컴포넌트 테스트(다운로드 1회·엔트리 5개) · 순서 단언 테스트 · ego-browser 수동 1회.
3. 버튼 연결 뒤 번들 재측정(진입 +0.02~0.05 예상[추정]).

## CONTINUE-2 (2026-10-25 · Developer)

제품 코드 변경 0 — 테스트·문서만. 커밋: 417e696c(브리프) · f612edb9(A01·순서·차단·읽기 전용) · 374761a3(변이 보강).

### AC 표 갱신
| AC | 테스트 | 상태 |
|----|--------|------|
| SMP-AC-A01 버튼 1회 → 내려받기 1회 · zip 엔트리 5개 | `components/studio/ExportSample.test.tsx` "1회 클릭 →…" — requestExport 1회(`sample-zip`, rev 3) · 링크 1개 `…_r3_sample.zip` · 실제 `sampleZip` 조립(가짜 캡처 PNG) 중앙 디렉터리 이름 5개 순서 | PASS |
| MQ-SMP-03 A 순서 + SMP-AC-A06 숨김 0 | 같은 파일 "순서 = PNG → 샘플 → HTML → 정적 zip → React zip" · toBeVisible·hidden/aria-hidden 0 | PASS |
| 게이트 차단 = 같은 방식 | 같은 파일 "게이트 차단 문서 →…" — 샘플 버튼 aria-disabled · aria-describedby = HTML 버튼과 동일(`export-reason-gate`) · 클릭 요청 0 | PASS |
| 읽기 전용 탭 refused | `features/studio/exportFlowReadonlySample.test.ts` — 실제 두 탭 리그 · sample-zip = refused READ_ONLY · 쓰기 탭 done | PASS |

가정: A01 컴포넌트 테스트의 zip은 저장소 가짜 안에서 실제 조립부 `sampleZip`로 만든다(생성기의 실제 PNG 캡처·iframe 렌더는 jsdom 밖 — 생성기 경로는 기존 생성기 테스트 범위).

### 변이 표 (`sample/sampleJson.ts` 임시 수정 → `git checkout`으로 원복, 매회 `git diff --stat` 확인)
| 변이 | 내용 | 보강 전 | 보강 후 |
|------|------|---------|---------|
| M1a | design-tokens 최상위 `color`↔`font` 순서 바꿈 | 잡힘(FAIL) | 잡힘 |
| M1b | sections 엔트리 `type`↔`variant` 순서 바꿈 | **생존**(toEqual이 키 순서 무시) | 잡힘 — `Object.keys(entry)` 순서 단언 추가 |
| M2 | sections 엔트리에 `instanceId` 포함 | 잡힘 | 잡힘 |
| M3 | `cssVars` 첫 키 1개 누락 | 잡힘 | 잡힘 (+ cssVars 키 순서 단언 추가) |

### 발견 결함
없음.

### 마감 게이트 (logs/gates-3.txt)
- typecheck EXIT=0 · lint EXIT=0 · vitest `--maxWorkers=2` **EXIT=1 — 1 failed | 3486 passed (3487)**.
- 실패 테스트 이름 미확인 — 로그가 `tail -8`만 남겨 이름이 잘렸고, 전체 재실행(약 171초)은 시간 상한으로 못 함. 이번에 추가한 파일(ExportSample·exportFlowReadonlySample·sample/*)만 다시 돌리면 10/10 PASS. 추정(확인 필요): 순서에 따라 결과가 바뀌는 기존 테스트(예: CONTINUE-1의 chunkRetryWiring 계수)이거나, 2 workers 부하에서 난 타임아웃.
- 다음: `npx vitest run --maxWorkers=2 2>&1 | grep -E "FAIL|×"`로 이름을 확인.
