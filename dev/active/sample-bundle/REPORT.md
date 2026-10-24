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
