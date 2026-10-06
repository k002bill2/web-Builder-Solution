# ER-3b PROGRESS — 스냅샷 화면 (ER-AC-S3·S4·S6~S10)

- base `45a5721` · 브랜치 `k002bill2/er-3b` · 서브에이전트 0 · 기준 빌드 `logs/build-base.txt`: /studio 진입 **127.69** · 첫 91.76 (멈춤 > 128.43, ER-3b 목표 ≤ +0.35)

## 체크리스트
- [x] P0 BRIEF·PROGRESS 명시 커밋
- [x] A. useDocSave 저장 먼저(`flushed`)·쓰기 채택(`adopt`) + imageStore 참조 집합(스냅샷)·한도 문장 — RED → GREEN
- [ ] B. 툴바 "스냅샷" · SnapshotDialog(조작 뒤) · SnapshotPreview(조작 뒤) · 복원(저장 훅 경로) · 편집 잠금 — RED → GREEN · 번들 1회
- [ ] C. 포커스(사라지는 버튼) · 좁은 폭 대화상자 1개 · 390 탭 전환 잠금 · 최근 10 + 더 보기 · 복원 실패 alert — RED → GREEN
- [ ] 검증 4종(typecheck·lint·test·build) + 번들 표
- [ ] Ego Lite build+preview 4337 경로 A 1280·390 캡처 · finish({keep:[]}) · listTaskSpaces()=[] · 서버 종료·리슨 0
- [ ] 전체 vitest exit 0
- [ ] Codex review --scope branch --base 45a5721 (≤2)
- [ ] REPORT 커밋

## TDD 예측 (RED 전 기록 — RED 테스트는 tip에 커밋하지 않고 GREEN과 함께)
| 단계 | 새 테스트 수 예측 | 내용 |
|---|---|---|
| A | 5 | useDocSave 3(진행 중 저장 뒤 쓰기 직렬 · 실패/STALE이면 쓰기 0 · 채택 뒤 다음 저장 STALE 0·revision 연속) · imageStore 2(참조 집합 ∪ 스냅샷 · 탭 한도 스냅샷 거부 문장) |
| B | 8 | S3 미리보기(캔버스·aria-disabled+이유·포커스 Callout 제목·돌아가기 포커스) · 입력 직후 미리보기 → 저장 추가 0 · S4 복원 알림·h1·되돌리기 → 새 revision · S9 입력 직후 "지금 상태 저장" = 최신 포함 · S9 저장 실패 → 호출 0+문장 · S10 실메모리 저장소 복원→편집→저장→내보내기 revision · S7 내보내기 전 스냅샷 목록·미리보기 · S6 이미지 A 스냅샷→교체 → A 유지 |
| C | 5 | 좁은 폭 390·1024 대화상자 1개(2) · 390 탭 전환 뒤 잠금 · 더 보기 → 포커스 유지 · 복원 실패 role=alert 1회·포커스 유지 |

## 로그
- A: RED 5/5(`logs/red-a.txt`, 예측 5 일치) → GREEN 24/24(표적 3파일) · typecheck·lint exit 0(`logs/gate-a.txt`). 테스트 도우미: act 콜백 안에서 저장 약속을 기다리면 교착 → act 밖 시작 + 렌더 흘리기
