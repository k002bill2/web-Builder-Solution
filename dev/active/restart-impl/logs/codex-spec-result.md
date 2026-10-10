**SPEC r1은 보완이 필요합니다. P1 1건·P2 8건이며, P0·P3 지적은 없습니다.** 파일은 수정하지 않았습니다.

리뷰 중 MQ-S2 구현 커밋이 추가되어, 코드 검증은 **`5aeb045`로 고정**했습니다. SPEC r1과 MQ의 S1~S5 A 결정을 기준으로 검토했습니다.

**흐름·오류 계약에서 발견한 5건입니다.**

1. **[P1] 쓰기 전 실패와 커밋 뒤 실패를 구분할 계약이 없습니다.**

   근거: [SPEC:86–87](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/docs/design/restart/SPEC.md:86), [memoryProjectRepository:72–81](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/app/src/data/memoryProjectRepository.ts:72), [오류 타입:168–190](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/app/src/data/projectRepository.ts:168).

   **실패 시나리오:** 요청 단계와 응답 단계에 동일한 `Error`를 주입하면, 화면이 받는 오류 모양은 같습니다. 그러나 요청 실패는 B안·스냅샷 0개이고, 응답 실패는 C안·스냅샷 1개입니다. 두 경우 모두 flush 호출은 0회였습니다. 일반 INFRA도 오류 타입에 커밋 여부가 없습니다.

   따라서 코드·메시지만으로 R-E3/R-E4를 분기하면 한쪽이 반드시 잘못됩니다. **실패 후 문서를 확인하는 절차 또는 단계 정보를 전달하는 계약을 SPEC에 명시해야 합니다.** RS-AC-07의 “그 밖 실패 → R-E3”도 RS-AC-08b를 제외하도록 고쳐야 합니다.

2. **[P2] R-E4에서 편집기를 열면 미확인 쓰기를 이어받지 못합니다. 닫기 규칙도 충돌합니다.**

   근거: [SPEC:87](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/docs/design/restart/SPEC.md:87), [SPEC:72](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/docs/design/restart/SPEC.md:72), [useDocSave:53–73](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/app/src/features/studio/useDocSave.ts:53), [스케줄러:65–68](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/app/src/features/studio/useAutosaveScheduler.ts:65).

   **실패 시나리오:** restart의 flush가 실패한 뒤 “편집기 열기”를 누르면 메모리의 C안이 열립니다. 새 저장 훅은 `idle`로 시작하므로 미확인 쓰기 재제출·실패 표시·이탈 경고를 이어받지 않습니다. 추가 편집 없이 새로고침하면 IDB의 B안으로 돌아갑니다.

   또한 87행은 대화상자를 닫아도 새 문서가 열린다고 읽히지만, 72행과 RS-AC-09는 취소 시 이동 0을 요구합니다. **미확인 상태의 취소·열기·재시도 동작과 편집기로 넘길 저장 상태를 별도로 정의해야 합니다.**

3. **[P2] `STALE_DOC` 갱신 뒤 F2~F4를 다시 판정하지 않습니다.**

   근거: [SPEC:26](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/docs/design/restart/SPEC.md:26), [SPEC:82](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/docs/design/restart/SPEC.md:82), [memoryDocBook:386–403](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/app/src/data/memoryDocBook.ts:386).

   **실패 시나리오:** B안에서 C안으로 restart하려는 동안 지연된 복원이 최신 문서를 C안으로 바꿉니다. `STALE_DOC`의 최신 revision으로 대화상자만 갱신하면 “C안으로 새로 시작”이 계속 가능합니다. 실제 저장소 재현에서도 같은 C안을 다시 생성하고 스냅샷을 추가했습니다.

   이는 “같은 안은 화면에서 restart를 열지 않는다”는 제외 범위와 충돌합니다. **최신 doc을 받으면 분기를 다시 계산하고, 같은 안이면 편집기 열기·테마 변경 안내로 전환해야 합니다.**

4. **[P2] `DOC_EXISTS`만으로 분기하면 create 멱등 재생이 F3를 우회합니다.**

   근거: [SPEC:59–64](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/docs/design/restart/SPEC.md:59), [memoryDocBook:373–385](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/app/src/data/memoryDocBook.ts:373), [save의 상태 갱신:366](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/app/src/data/memoryDocBook.ts:366).

   **실패 시나리오:** B안 v1을 create한 뒤 테마를 v2로 저장하고, 프로필 v1에서 B안 편집 시작을 다시 누릅니다. `starts` 기록이 유지되어 `create(B,v1)`은 `DOC_EXISTS` 대신 옛 성공 결과를 재생합니다. 재현 결과 반환 버전은 v1, 현재 문서는 v2였습니다. F3의 버전 차이 안내가 나오지 않습니다.

   **create 성공·재생 경로에서도 현재 문서를 기준으로 분기하는 규칙이 필요합니다.** 반환된 성공 문서가 최신이라는 전제를 두면 안 됩니다.

5. **[P2] R-D2의 “마지막 저장”은 브라우저 저장 완료를 뜻하지 않습니다.**

   근거: [SPEC:130](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/docs/design/restart/SPEC.md:130), [RS-AC-08c:187](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/docs/design/restart/SPEC.md:187), [memoryProjectRepository:65–66](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/app/src/data/memoryProjectRepository.ts:65), [memoryDocBook:364–366](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/app/src/data/memoryDocBook.ts:364).

   **실패 시나리오:** B안 r1의 브라우저 저장 후 r2 저장이 quota로 실패하면, `DOC_EXISTS`는 메모리 r2와 그 `updatedAt`을 돌려줍니다. 이후 restart가 보존하는 스냅샷도 r2입니다. 실제 재현은 **브라우저 마지막 확인 r1·대화상자 r2·스냅샷 r2**였습니다.

   MQ-S5 A가 허용한 이탈 손실 유예와 별개로, 저장 완료 여부를 잘못 표시합니다. **보존 대상을 “저장소 메모리 문서”로 정의하거나, 브라우저 저장 확인 여부를 구분해야 합니다.** RS-AC-08c도 성공·진행 중·실패 상태를 나눠야 합니다.

**기존 화면·수용 기준에서 발견한 4건입니다.**

6. **[P2] R-N1 전체 문장이 기존 편집 알림에서 자동으로 읽히지 않습니다.**

   근거: [SPEC:81·167](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/docs/design/restart/SPEC.md:167), [StudioPage:20–21](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/app/src/pages/StudioPage.tsx:20), [StudioLayout:101–105](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/app/src/components/studio/StudioLayout.tsx:101), [StudioPanels:35–39](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/app/src/components/studio/StudioPanels.tsx:35).

   **실패 시나리오:** 성공 state에 `changes`가 있으면 기존 화면은 “바뀐 점 N개”를 표시하고, R-N1 전체는 접힌 `<details>` 안에 둡니다. 새로 시작 완료·이전 문서의 복원 경로가 자동 낭독에서 빠집니다.

   **`/studio` 변경 0과 R-N1 전체 1회 낭독을 동시에 보장할 전달 방식을 정해야 합니다.** `state.editNotice` 문자열 단언만으로는 검증되지 않습니다.

7. **[P2] RS-AC-01이 유지하라는 기존 테스트는 F4와 반대입니다.**

   근거: [SPEC:178–180](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/docs/design/restart/SPEC.md:178), [ProfileCandidates.test:297–302](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/app/src/pages/ProfileCandidates.test.tsx:297).

   **실패 시나리오:** 기존 테스트는 **A안 문서가 있는데 B안을 선택**하고 `/studio` 이동을 요구합니다. RS-AC-03의 F4는 같은 상황에서 이동 0·대화상자 열림을 요구합니다. 두 단언은 함께 통과할 수 없습니다.

   **기존 테스트를 같은 안의 F2 사례로 바꾸고, 다른 안 사례는 F4 단언으로 교체한다고 명시해야 합니다.**

8. **[P2] 스냅샷 “+1” 단언이 멱등 재생·20개 보존 규칙과 충돌합니다.**

   근거: [RS-AC-04·10·11](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/docs/design/restart/SPEC.md:181), [memoryDocBook:182–189](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/app/src/data/memoryDocBook.ts:182), [멱등 재생:375–376](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/app/src/data/memoryDocBook.ts:375).

   **실패 시나리오:** 같은 restart 인자를 재생하면 새 스냅샷은 추가되지 않습니다. 자동 스냅샷 20개에서 최초 restart하면 하나를 만들고 하나를 제거하여 총수는 20개입니다. 재현도 **20 → 20 → 재생 후 20**이었습니다. 복원도 같은 보존 제한을 적용합니다.

   **“최초 성공에서 신규 ID 1개 생성·재생에서는 0개·총수는 보존 정책 적용 후 판정”으로 단언을 분리해야 합니다.**

9. **[P2] RS-AC-13의 예산·실패 대응이 최신 MQ 결정과 맞지 않습니다.**

   근거: [SPEC:192·211](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/docs/design/restart/SPEC.md:192), [MQ:64](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/docs/design/restart/MQ.md:64), [ADR-004:244–250](/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/docs/decisions/ADR-004-performance-budgets.md:244).

   **실패 시나리오:** 최신 결정은 restart에 일반·복원 진입 각각 **+0.05KB**를 배정하고, 자기 몫 안에서 기준선과 테스트 기대값을 함께 갱신하도록 합니다. SPEC은 이전 129.65·132.68을 고정하고 초과하면 MQ-S2 B로 내려갈 수 있다고 합니다. 승인된 A 구현이 이전 기준으로 거부되거나, 채택되지 않은 B로 변경될 수 있습니다.

   **전체 상한과 restart 배분 상한을 구분하고, 기준선 갱신·감량·재상신 절차를 최신 결정에 맞춰야 합니다.**

MQ-S2 A 자체의 기본 잠금 경로에서는 **원자성·멱등·stale 판정을 깨는 결함을 확인하지 못했습니다.** 현재 구현은 guard를 동기 판정 앞에 두고, 판정·커밋 구간에는 await를 추가하지 않습니다. 실제 로컬 경로에서 잠금 거부 시 B안 유지·쓰기 0, 보유 탭이 쓰지 않고 해제한 뒤 재시도 성공을 확인했습니다. `stale` 유지와 잠금 해제도 확인했고, 현재 `guardWrite()`는 `cleared`를 먼저 거부합니다.

**검증 범위:** RS-AC-01~16과 08b·08c를 모두 검토했습니다. 위 재현은 `node -e`로 소스를 메모리에서 변환하고 가짜 잠금·영속 저장소를 사용했습니다. 전체 typecheck·lint·test·build와 실제 브라우저 QA는 실행하지 않았으므로, 번들 실측·낭독·반응형 검증의 통과를 의미하지 않습니다.

Codex session ID: 01a1267e-c115-7850-b65a-7552c91fe0d7
Resume in Codex: codex resume 01a1267e-c115-7850-b65a-7552c91fe0d7
