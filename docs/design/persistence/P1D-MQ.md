# P1D-MQ — P1d 결정 항목 (결정이 필요한 것만)

- 정본: `P1D-SPEC.md`. ADR-007 P3 A·P8 A는 확정 — 여기서 다시 묻지 않는다. ★ = 추천(예산·엔진 계약·새 의존성·백엔드 경계 안).
- 근거 표기: [L1] 코드 확인 · [추정] 측정 없음.

## MQ-D1 — 프로젝트 삭제 뒤 화면 갱신 방식 (`/studio` 진입 예산 · 비교 보드·보관함)

- [L1] 메모리 store(`studioStore`)에는 레코드를 빼는 tx 메서드가 없고(insert·remember·rememberAdjust·putJob·putProject뿐), `studioStore`·`memoryProjectRepository`는 `/studio` 진입 closure다(여유 0.03KB · `/profile` 99.87/100).
- [L1] 비교 보드·보관함은 영속 범위 밖(탭 메모리) — 새로고침하면 비워진다(P1c D5 지우기 문구와 같은 사실).

| 선택 | 내용 | 얻는 것 | 잃는 것 |
|---|---|---|---|
| **A ★** | IDB를 `/projects` 조작 뒤 청크에서 **직접** 한 트랜잭션으로 고친 뒤 `/projects` **새로고침 이동**(P1c "이 브라우저 데이터 지우기"와 같은 흐름) | 진입 바이트 0 · 저장소 인터페이스·store 변경 0 · 남은 메모리가 지운 것을 다시 쓰는 경로 0(구조적으로) | 지운 뒤 그 탭의 비교 보드·보관함이 비워짐(대화상자 캡션 PJ-5로 고지) · 새로고침 1회 |
| B | `ProjectRepository.deleteProject` + `studioStore` 삭제 tx 메서드로 메모리·IDB 함께 지움(새로고침 없음) | 보드·보관함 유지 · 매끄러움 | `studioStore`(모든 라우트)·`memoryProjectRepository`(`/studio` 진입)에 런타임 코드 추가 → **예산 재상신 필요 가능성 높음**[추정] · 쓰기 큐 경유 삭제(이미지 접두 delete) 설계 추가 |

- 추천 근거: P8 A의 목적(공용 PC 개인정보·용량)은 A로 그대로 달성되고, 보드·보관함은 원래 새로고침에 사라지는 데이터다. B는 예산 재상신이 전제라 P1d를 멈춘다.

## MQ-D2 — 진입 배선 실측 관문을 넘을 때 (조건부 — L1 실측 뒤에만 회신 필요)

- [L1] 진입 파일을 피할 수 없는 변경 3건: `memoryProjectRepository`의 `deleteSnapshot` 위임 1줄(`/studio`·`/projects` 진입) · `studioStore` `seq()` reader(모든 라우트, `nextProfileId` 제거로 상쇄) · `memoryGenerationRepository` job id 인자 이동(`/profile` 진입).
- KB는 추정하지 않는다(최근 레인 추정 대비 실측 2~10배). L1이 관문(`/studio` ≤129.65 · 복원 ≤132.68 · `/profile` ≤100)을 넘을 때만 아래 중 하나.

| 선택 | 내용 | 트레이드오프 |
|---|---|---|
| **A ★** | 관문 안이면 그대로 진행(회신 불필요). 넘으면 L1이 멈추고 **실측 수치와 상쇄 후보(진입 파일에서 뺄 수 있는 식) 조사 결과를 붙여 B로 재상신** | 근거 있는 결정 · 1레인 지연 가능 |
| B | ADR-004 예산 개정(실측 수치로 판정선 상향) | 경계 유지 · 영환님 결정 필요 |

- 기각한 우회: 스냅샷 삭제를 저장소 인터페이스 밖(대화상자 청크 → DocBook 직접)으로 잇는 안 — DocBook 인스턴스는 `memoryProjectRepository` 클로저가 쥐고 있어 그 손잡이를 넘기는 배선 자체가 진입 코드이고, 서버 전환 때 같은 인터페이스 원칙(ADR-007 4절 2)을 깬다.

## 결정 기록
- (회신 대기) — 회신 형식 예: "D1 A · D2 A".
