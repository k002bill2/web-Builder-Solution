# GEN-MARK-2-SPEC REPORT — 출처 표식 후속 3건 (B-GM-01·02·03)

- 브랜치 `k002bill2/gen-mark-2-spec` · base main `d68006e` · 역할 Designer · **코드 0**
- 산출물: `docs/design/gen-mark/SPEC-2.md` r1 · `docs/design/gen-mark/MQ-2.md` · 이 REPORT · PROGRESS. 기존 `SPEC.md`·`MQ.md`는 수정하지 않았습니다.

## 1. 결론 (★ 추천안)

| MQ | 대상 | ★ | 요지 |
|---|---|---|---|
| MQ-GM2-1 | B-GM-01 비교 열 머리 | A | `ColumnHeader` 라이선스 Tag 자리를 `SourceTags`로 교체한다. 축약 없이 줄바꿈한다. 뷰 모델에 `sourceKind`를 추가한다. `/compare` 첫 화면 ≈99.25~99.30/100 [추정] |
| MQ-GM2-2 | B-GM-02 buildNote | A | 생성 조합 상세에서만 메타 줄의 buildNote를 표시층에서 뺀다(r1 T3가 대신 설명). 데이터·G1·G5·썸네일 영향 0 |
| MQ-GM2-3 | B-GM-03 한국어 표기 | A | `자체 제작` / `이용 허락` / `외부 관찰`, 낭독 접두 `라이선스: `. 바꾸는 것은 표시뿐이고 id·URL·데이터는 영문 그대로 둔다 |
| MQ-GM2-4 | `/profile` 포함 여부 | A | 범위에서 제외한다(closure 무접촉). BACKLOG 후보 B-GM-03b |

- 엔진 계약·저장 스키마 변경 0, 예산 증액 0. ⚠ 표시 선택지: MQ-GM2-1 B는 예산 초과, 2 B·C는 데이터 재생성, 4 B·C는 예산 초과.
- 기동 차단: MQ-GM2-1·3은 Developer 레인을 시작하기 전에 정해야 합니다.

## 2. 핵심 발견 (L1)

- **`/studio` 저장 데이터 복원 진입은 132.67이고 멈춤선은 132.68 초과입니다(여유 0.01).** 브리프에 적힌 `/studio` 129.63/129.65보다 빡빡합니다.
  - 새 공유 청크가 생기면 엔트리 preload 맵에 이름이 들어가 모든 라우트가 +0.02 늘어납니다(gen-mark-impl REPORT 3절). 이 경우 멈춤선을 넘습니다.
  - 그래서 ★안은 새 청크를 만들지 않고 기존 `SourceTags` 청크에 합류하도록 설계했습니다.
- manifest 정적 closure 확인 결과:
  - `ProfilePage`는 `catalogFilters`·`referenceDisplay`를 포함합니다.
  - `CompareBoardPage`는 `referenceDisplay`를 포함합니다.
  - `StudioPage`는 셋 중 어느 것도 포함하지 않습니다.
  - 따라서 표시 맵은 `catalogFilters.ts`·`referenceDisplay.ts`에 둘 수 없습니다.
- 생성기 `version`은 seed에 들어갑니다(`internalCompose.ts:155`). 버전 상수를 바꾸면 생성물 15개가 모두 다시 추첨됩니다.
- G5는 큐레이션 픽스처 3벌만 해시합니다. buildNote는 엔진(0건)과 썸네일 어디에서도 읽지 않습니다.
- 라이선스 원값을 그리는 곳은 5곳입니다: SourceTags, ColumnHeader, ProfileValues, FilterRail label, CatalogPage 부제.
- 브리프 예시 "라이선스 확보"는 sr-only 접두와 겹쳐 "라이선스 라이선스 확보"로 읽힙니다. 그래서 기각했습니다.

## 3. 예산 실측 (`npm run build` exit 0 · base `d68006e` · gzip KB)

| 라우트 | 첫 화면 | 진입 직후 |
|---|---|---|
| /catalog | 100.32 / 101 (멈춤 100.90) | 102.66 / 125 |
| /references/:id | 97.76 / 100 | 100.10 / 125 |
| /compare | 98.92 / 100 | 122.74 / 125 |
| /profile | 99.90 / 100 | 120.01 / 125 |
| /projects | 98.43 / 100 | 105.67 / 125 |
| /studio/:projectId | 91.86 / 100 | 129.63 / 130 (멈춤 > 129.65) |
| /studio 복원 진입 | 91.86 / 100 | 132.67 / 134 (멈춤 > 132.68) |

- 썸네일은 21장, 버전 `86342b48`이며 가드를 통과했습니다.
- `dist/`는 빌드 산출물이고 커밋 대상이 아닙니다(.gitignore).

## 4. 검증

- Codex `adversarial-review --scope branch --base d68006e` 1회: P1 0 · P2 2 → 반영(5절).
- Ego Lite 캡처는 생략했습니다(선택 항목, 60분 상한). 구조는 코드(L1)와 gen-mark-impl 캡처로 갈음하고, 대신 빌드와 manifest를 실측했습니다.

## 5. Codex 로그

- r1 `adversarial-review --scope branch --base d68006e`(`60f2007`): verdict **needs-attention**, P1 0건, P2 2건. 둘 다 이번 diff가 만든 내용이라 반영했습니다.
  - **P2-1 예산 "0" 보장 과장** (SPEC-2:222-224): Codex 시제품(write:false 빌드)에서 SourceTags가 `compareTray` 청크로 합쳐지면서 `/profile` +3B, `/studio` +8B, 복원 진입 +7B가 나왔습니다.
    - 반영: "영향 0"을 "목표 0, 보장 아님"으로 고쳤습니다.
    - 반영: "+0.02 고정"을 "관측값"으로 고쳤습니다.
    - 반영: G2에 복원 진입 ≤132.68과 같은 머신에서의 base/head 비교 의무를 추가했습니다(SPEC-2 F14 · 7절 G2 · 8절, MQ-2 공통 사실).
  - **P2-2 SourceTags 래퍼 배치** (SPEC-2:100-102): 래퍼가 flex div라서 두 Tag가 한 덩어리로 같이 줄바꿈됩니다.
    - 반영: 3.1에 배치 계약을 추가했습니다(래퍼를 부모 행에 녹이는 변형, 카드·상세 배치 불변).
    - 반영: "전부 선택"이 Tag 1줄 높이만큼 내려가는 것을 허용 범위로 정했습니다.
    - 반영: E1에 좁은 열, 긴 업종명, withdrawn 열 조건을 추가했습니다.
- 2라운드는 하지 않았습니다. 브리프 기준 "P1이면 1회 더"에 해당하지 않습니다(P1 0건).
- 참고: Codex 프로세스가 결과를 출력한 뒤에도 종료되지 않아 `pkill`로 정리했습니다.

## 6. 남은 것

- 사용자 결정이 필요합니다: MQ-GM2-1~4(★A 일괄 가능).
- 구현 레인 주의: `/studio` 복원 진입 여유는 ≈10B입니다. 시제품에서도 +7B가 나왔으므로 G2 base/head 실측으로 판정해야 합니다.
- BACKLOG 후보: B-GM-03b `/profile` 라이선스 한국어화(`/profile` 예산 재편 때).
- push·merge 0.
