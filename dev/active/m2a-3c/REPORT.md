# M2A-3c PNG 내려받기 + 3b 이관 — REPORT

- 브리프 `docs/06-handoff/M2A-3C_PNG_BRIEF.md` · 시작 커밋 `eaa3d5e` · 브랜치 `k002bill2/m2a-3c`

## 1. 커밋 표
| 단계 | 커밋 | 내용 |
|---|---|---|
| 수신 | 7fac872 | 수신 기록 · REPORT 골격 · `gate.sh` |
| C0(1)·C1 | (이 커밋) | 3b Codex(P1 0 · P2 3 → M2a 마감) · 전역 슬롯 판단(유지) · C1 공간 실측 → 진입 ≤126.70 경로 없음, 정지 — 코드 변경 0 |

## 2. C0 이관 (3b Codex · 전역 슬롯 · K-AC-12·30)
### 2.1 Codex `review --scope branch --base a51de92` (원문 `logs/c0-codex-3b.txt` · 진행 로그 `logs/c0-codex-3b.raw.txt`)
- 범위 주의: `--scope branch`는 HEAD 기준이라 3b(`a51de92..3fb670a`)에 p2fix(`0b8c9e5`)·브리프 문서까지 들어갔다. 지적 3건은 모두 3b 파일이다.
- **P1 이상 0 → 이 레인 코드 변경 0.** (Codex 메모: 읽기 전용 샌드박스라 vitest는 못 돌렸고 typecheck만 통과 확인)

| # | 지적 | 판정 |
|---|---|---|
| P2-1 | `ExportAfter.tsx:73-75` 편집기 이탈 때 내려받기 URL을 해제 → 돌아와 같은 revision을 다시 요청하면 멱등 잡이 해제된 `downloadRef`를 돌려줘 "내려받기"가 죽는다(문서를 고치기 전까지 복구 안 됨) | **사실.** 3b가 알고 둔 한계(`exportDownloads.ts` 주석 · 3b REPORT 9절). 고치는 길 = 잡이 살아 있는 동안 URL 유지(누수 vs 죽은 링크) 또는 해제된 결과 재생성 — 잡·멱등 규칙(8.3.2) 판단이 필요해 **M2a 마감으로**(9절) |
| P2-2 | `memoryDocBook.ts:96-99` 생성기 청크 첫 로드가 실패하면 rejected Promise가 `browser`에 남아 다시 시도해도 즉시 실패 | **사실.** 슬롯 로더(`exportFlow.ts`의 `import("./staticHtml/staticHtml")`)가 `retryableImport`가 아니고 `browser ??=`가 실패를 기억한다. 오프라인·청크 교체 때만. 고치기 = 실패 시 `browser = undefined` + 슬롯 로더를 `retryableImport`로(조작 뒤 청크 안이라 진입 증가 0 예상) — **M2a 마감으로**(9절) |
| P2-3 | `staticMarkup.ts:44` `blob:` 검사가 `outerHTML` 전체 정규식이라 본문·대체텍스트에 글자 "blob:"이 있으면 정상 문서도 영구 INFRA 실패 | **사실(드묾).** 검사 대상을 URL 속성(`src`·`href`·`srcset`·`style` url())으로 좁히면 된다 — **M2a 마감으로**(9절) |

### 2.2 전역 심볼 슬롯 판단 (`Symbol.for("design-studio/static-html-generator")`)
**결정: M2a 동안 유지. 실서버 저장소(M4) 때 제거(서버 생성기로 대체).** 근거와 비용:
| 안 | 내용 | 진입 영향(근거) | 비용·위험 | 판정 |
|---|---|---|---|---|
| 유지(지금) | exportFlow(조작 뒤)가 슬롯을 채우고 memoryDocBook(조작 뒤)이 읽음 | 0(3b 7절 최종) | 숨은 전역 — 테스트 격리는 `memoryExport.test.ts` `afterEach delete`로 처리 중. 모듈 캐시 때문에 한 파일에서 슬롯을 지운 뒤 exportFlow를 다시 import해도 다시 안 채워짐(테스트는 이를 피해 가짜 공장을 직접 넣음). P2-2(실패 기억)가 이 경로 | **유지** |
| A. `deferredStudio`/저장소 생성 때 `generators` 주입 + 지연 import 래퍼 | 3b 브리프 원안 | **+0.07~0.08**(3b 시도 1·2 실측) — 지금 여유 0.06 초과 | 진입 초과 | 기각 |
| B. 작은 등록 모듈(정적 import) | 등록 함수만 진입에 | **+0.20**(3b 시도 4 — docBook preload에 붙음) | 진입 초과 | 기각 |
| C. `ProjectRepository`에 `registerGenerator(format, loader)` 메서드 | 전역 대신 저장소 인스턴스에 등록 | 추정 +0.02~0.05(L3, 빌드 안 함 — memoryProjectRepository가 진입 자동) | **저장소 인터페이스 변경**(브리프 금지 범위 경계 — `ExportGenerator`는 그대로지만 계약 표면 증가), 여유 0.06 소모 | M4 판단 대상 |
| D. M4 실서버 저장소 | 생성은 서버(또는 서버가 지정한 생성기) → 브라우저 슬롯 불필요 | 0 | M4 범위 | **대체 시점** |
- 번들 영향 요약: 슬롯을 없애는 모든 진입 쪽 대안은 3b 실측상 +0.07 이상이라 **지금 여유(0.06)로는 불가**. 대체는 M4(D) 또는 진입 여유가 생긴 뒤(C).

### 2.3 K-AC-12 · K-AC-30 브라우저 판정
(진행 중)

## 3. C1 공간 실측 — **결론: 진입 ≤ 126.70 경로가 실측으로 보이지 않음 → C2 전에 정지(브리프 C1)**
SPEC 3.3·K-AC-19는 PNG 이름표·버튼·캡션·"준비 전" 이유가 **진입 때부터** 보이길 요구한다 → 이 묶음은 `/studio` 진입 청크(StudioLayout)에 있어야 한다. 예산 상수·멈춤선은 바꾸지 않았다.

| 측정 (`/studio/:projectId` 진입 직후, gzip KB) | 진입 | 멈춤선 126.70 대비 | 근거 |
|---|---|---|---|
| 기준선 `eaa3d5e` | **126.64** | 여유 0.06 | `logs/c1-baseline.txt` |
| 시제품 전체(PngSave 4상태·캡션·계측 진입 · 캔버스 `onDrawn` · 캡처 청크는 자리만) | 127.16 | **+0.46 초과** | (빌드 출력, 이 표) |
| + `ConflictCallout` 지연(lazy) | 127.07 | +0.37 | **기각** — 충돌 회복 UI를 지연 청크에 두면 3a P2-1 r2 원칙("회복 안내는 지연 청크에 기대지 않는다")과 충돌 · 스크립트 `afterAction` 목록에 없는 동적 import라 진입 합계에서 조용히 빠진 숫자 |
| **최소 시제품**(진입 = 이름표·버튼·캡션 2문장·준비 전 이유·실패 alert 문장 · 성공 문장·계측·오류 코드·인자 조립은 캡처 청크로 · ConflictCallout 원복) | **127.10** | **+0.40 초과** | `logs/c1-proto-min.txt` · 패치 `logs/c1-proto.patch` |
| 원복 뒤 | 126.64 | 여유 0.06 | `logs/c1.txt` |

- **필요 절감량 = 127.10 − 126.70 = 0.40KB.** 시제품은 하한이다(실구현은 상태 정리·테스트 훅·폭 라벨 연결로 더 붙는다 — 3a 2절과 같은 성격).
- 모듈별 분해(StudioLayout 청크 16.40KB, `logs/c1-attr.txt` — 비례 추정): PngSave **0.59** · StudioLayout 2.34 · StructureCanvas 1.31 · useAutosaveScheduler 0.85 · GateList 0.64 · StudioPanels 0.60 · gateView 0.58 · FieldEditor 0.50 · useSectionOps 0.46 · **useExportFlow 0.42** · ConflictCallout 0.22 · ExportRetryAlert 0.14.
- 우선순위 1(S-B5 "조작 뒤" 진입 코드 이동): 진입에 남은 조작 뒤 코드는 사실상 `useExportFlow`뿐인데, 버튼 상태·저장 대기 effect·확인 대화상자 상태는 진입에 있어야 하므로 옮길 수 있는 것은 그 일부다. **모듈 전체(0.42)를 빼야 겨우 0.40을 덮는 상한 계산 → 실제 경로 없음**(리팩터 없이 증명). ConflictCallout·ExportRetryAlert·SaveStatus 실패 문장은 회복 UI라 지연 금지(P2-1 r2).
- 우선순위 2(중복·미사용 정리): 3a 2절 실측과 같다 — 진입 큰 항목은 모두 S-B4 첫 화면·자동 조건 코드. 이번 분해에서도 1KB 단위 미사용 코드 없음.
- 우선순위 3(문구 상수 공유): 캡션 "구조 미리보기 섹션 {N}개"는 같은 청크의 `fallbackReason`과 이미 gzip 창 안에서 겹친다 — 공유해도 0.0x.

**후보안 (영환님 결정 — 추천 순, 이 레인은 C2~C4를 진행하지 않음)**
1. **3a 옵션 B — `/studio`가 진입 때 받지만 부르지 않는 보드·생성 저장소 코드를 공유 store 로더 밖으로(별도 레인)**: 3a 추정 −4.5~5.5(L3, 3a 2절). 큰 여유를 만드는 유일한 안. 위험 = 2a-04 store 배선 변경 · `/compare`·`/profile` ±0.03 규칙. 이 레인 범위 밖(브리프 "중복·미사용 정리"를 넘는 구조 변경).
2. **SPEC 3.3 개정 — PNG 묶음을 내보내기 묶음과 같은 조작 뒤 청크로 늦게 그림**(예: "검사 · 내보내기"를 누르거나 "검사" 탭을 연 뒤 그림): 진입 증가 ≈ 0(lazy 래퍼 + 조건 몇 바이트 — 빌드 안 함, L3). 비용 = K-AC-19 "준비 전" 문장·3.3 "진입 때부터"·1280 오른쪽 열 상시 표시가 바뀐다. 3c 나머지(C2~C4)를 바로 진행할 수 있는 안.
3. **ADR-004 개정 — `/studio` 진입 멈춤선 +0.40 이상(실구현 여유 포함 +0.5 권장)**: ADR-004 개정 3이 "추가 상향 금지"라 영환님 결정 사안.

## 4. 캡처 방식 PoC
(진행 중)

## 5. PNG 흐름 (버튼 · 4상태 · 파일 이름 · 계측)
(진행 중)

## 6. K-AC · E-AC 판정
(진행 중)

## 7. 번들 표
| 시점 | 공통 | `/studio` 첫/진입 | `/compare` 진입 | `/profile` 진입 | `/projects` 진입 | `/catalog` 진입 | `/references/:id` 진입 | 렌더 JS/CSS | 근거 |
|---|---|---|---|---|---|---|---|---|---|
| 기준선 eaa3d5e | 89.35 | 91.78 / **126.64** | 121.71 | 118.67 | 100.30 | 102.03 | 99.38 | 80.12 / 6.32 | `logs/c1-baseline.txt` |
| C1 최소 시제품(원복됨) | 89.35 | 91.78 / **127.10 ✗** | 121.71 | 118.66 | 100.29 | — | — | — | `logs/c1-proto-min.txt` |
| C1 원복 뒤(이 커밋) | 89.35 | 91.78 / 126.64 | 121.71 | 118.67 | 100.30 | 102.03 | 99.38 | 80.12 / 6.32 | `logs/c1.txt` |

## 8. SPEC 차이
(진행 중)

## 9. 남은 위험 · M2a 마감에 넘길 것
(진행 중)
