# RESTART-SPEC-R2 REPORT — SPEC r1 → r2 (Codex 재검증 P1 1 · P2 8 반영)

- 결론: **SPEC r2 · MQ-S6·S7 작성 완료(코드 0).** 회신 필요 = MQ-S6(★A) · MQ-S7(★A). Codex adversarial 결과는 3절.
- 브랜치 `k002bill2/restart-spec-r2`(base main `9d5076e`) · push·merge 0 · amend·rebase 0.
- 산출물: `docs/design/restart/SPEC.md`(r2) · `docs/design/restart/MQ.md`(MQ-S6·S7 · 결정 기록) · 이 파일 · `PROGRESS.md` · `logs/codex-r*.txt`.

## 1. Codex 지적별 반영 (SPEC 위치)

| # | 지적 | r2 반영 |
|---|---|---|
| P1 | R-E3/R-E4를 오류 모양으로 못 가름 | **3.3.1 실패 판정 순서**: `UNKNOWN_VARIANT`·`STALE_DOC` 말고는 실패 뒤 `getDoc`으로 이 탭 저장소 문서 확인 → 양성(revision+1·안·버전 일치) R-E4 / 음성 → 메시지 사유 R-E2·R-E2b·R-E3 / 확인 실패 → **R-E5(신설, 단정 안 함)**. 커밋 확인이 메시지보다 먼저(RS-AC-07c). 저장소 인터페이스·오류 타입·스키마 변경 0 — MQ-S6 ★A(B = 오류에 `committed` 필드 · C = 가르지 않음). RS-AC-07 정정 + 07b(주입 단계별 표)·07c · 08b 정정 |
| P2-2 | R-E4 뒤 편집기 열기 미인계 · 3.3 닫기 문장 충돌 | R-E4·R-E5 버튼 = [취소][다시 시도] · "편집기 열기" 숨김 · 취소 = 이동 0(RS-AC-09와 일치) · r1 87행 "닫거나 열면 새 문서" 삭제 · R-E4 문장에 "닫으면 새로고침 때 이전 문서로 돌아갈 수 있음" · 남는 경로 RS-R7(BACKLOG 후보: 편집기 진입 때 미확인 쓰기 인계) |
| P2-3 | STALE_DOC 갱신 뒤 F2~F4 재판정 없음 | 3.3 STALE 행: 최신 doc으로 재판정 — 다른 안이면 R-E1 + 다시 채움, 같은 안이면 주 버튼 숨김 + **R-E1b(신설)** + "편집기 열기" · RS-AC-06b |
| P2-4 | create 멱등 재생이 F3 우회 | 3.1: create 성공 뒤 `getDoc` → revision 다르면 재판정(F2·F3·F4) · 알림은 화면이 **R-C3(신설)** · `getDoc` 실패면 F1 · RS-AC-17 |
| P2-5 | R-D2 "마지막 저장" ≠ 브라우저 저장 | R-D2 = "마지막 변경 … 이 탭에 있는 이 상태 그대로 스냅샷에 남습니다"(저장소 문서 기준) · RS-AC-08c 3행(flush 성공·진행 중·실패) |
| P2-6 | R-N1이 `<details>`에 접혀 낭독 누락 | 성공 이동 state = `{editNotice}`만(`changes` 제외 → `StudioPage.tsx:20-21` N=0 → 전체 문장) · `/studio` 변경 0 · RS-D9 · RS-AC-18(알림 영역 텍스트·`details` 0 단언) |
| P2-7 | RS-AC-01 vs F4 모순 | RS-AC-01: 기존 `ProfileCandidates.test.tsx:297-303`(다른 안 → 이동)은 F4 단언으로 교체 · F2는 같은 쌍 셋업(A create → B restart 등) 허용 · 그 밖 기존 단언 변경 0 |
| P2-8 | 스냅샷 "+1" vs 멱등·20개 보존 | RS-AC-04·08b·10·11 = 전후 id 집합 차이로 "최초 성공 신규 1 · 재생 0 · 20→20" |
| P2-9 | RS-AC-13 예산 문장 개정 15 불일치 | `/studio` 일반·복원 각각 restart 몫 ≤ +0.05(129.56·132.59 → 상한 129.61·132.64) · 판정선 129.95·132.98 · 넘으면 같은 커밋 기준선 갱신(자기 몫 안) · 감량 1회 → 재상신 · "MQ-S2 B로 내려감" 삭제 |

## 2. 예산 · RS-D 판정

- **MQ-S7(신설)** — `/profile` 진입 직후 실측 +0.36(두 시나리오). ★A = ±0.03 유지 + 배치 변경(클릭 때 `loadProjects`·restart 청크 `Promise.all` · create 결과 판정 전체 = 조작 뒤 청크 · 진입 청크엔 호출 1곳 + 슬롯 + R-C1). 근거: 증분이 "누른 뒤에만 실행되는 처리 코드"이고 r2가 더하는 P2-4 코드까지 흡수 · `/profile (3안 있음)` 여유 2.52 유지. ±0.03 달성은 L3 → 넘으면 감량 1회 → 재상신. B = 각 ≤ +0.40 · C = ≤ +0.15 + 일부 이동. 한도 상향 선택지 없음.
- `/profile` 진입 직후는 `m2cBaseline.json`에 키가 없어 스크립트 판정 밖 → RS-AC-13에 "빌드 출력 수동 판정" 명시.
- RS-D4 수용(DOM [취소][편집기 열기][새로 시작] — `SnapshotDialog.tsx:75-78`) · RS-D5 수용(월·일+시:분 새 형식 1개 — 기존 함수 없음) · RS-D6 조건부(판정 불가면 R-D5 생략 + 게이트 판정 일치 단언) · RS-D7 수용 · RS-D8 수용(r2 P2-2로 확장) · RS-D9 신설 · RS-D1 근거 정정(진입 직후 여유 "작다(L3)" → 5.00·2.52 사실).

## 3. Codex adversarial-review

(결과 대기 — `logs/codex-r1.txt`)

## 4. 목업과 다르게 한 곳

- 목업에 이 대화상자 없음(SPEC 6절) — r2에서 새로 목업과 다르게 한 곳 0. 2a-05와 다르게 한 곳은 SPEC 10절 RS-D9(성공 state `changes` 제외).

## 5. 남은 것 / 필요한 것

1. **영환님 회신**: MQ-S6(★A) · MQ-S7(★A).
2. BACKLOG 후보(Jarvis 등록): RS-R7 편집기 진입 때 미확인 쓰기 인계(create 갈라짐 MQ-S2 C와 묶음).
3. 회신 뒤 RESTART-IMPL 재개: 3.3.1·P2 반영 → 배치 변경(MQ-S7) → 감량 1회 → 게이트 4종 → Codex branch review → Ego RS-AC-14·15.
