# P2-SPEC REPORT (Designer · 2026-10-08)

## 산출물
- `docs/design/persistence/P2-SPEC.md` — 커밋 `9b41bd3`(초안) · `d405268`([확인 필요] → [L1] 반영).
- `P2-MQ.md` 만들지 않음 — **MQ 0**: 선택이 모두 예산(진입 몫 0)·엔진 계약(변경 0)·새 의존성(0)·백엔드(0) 안. ★는 Designer 판단으로 SPEC에 근거와 함께 둠.

## 핵심 결정(★, SPEC 절)
1. 단위 = 프로젝트 1개 = 파일 1개(1.1) · 내보내기 = `/projects` 줄 "파일로 내보내기"(삭제 앞) · 가져오기 = 저장소 영역 "프로젝트 파일 가져오기" · 편집기·`/profile` 진입 0(1.2). 렌더 내보내기(HTML·zip·PNG)와 이름·위치 분리(F1).
2. 파일명 `${exportFileStem(이름)}_project_YYYYMMDD.json`(1.3) · 봉투 `format`·`formatVersion` 1·`schemaVersion` 1·`exportedAt`(2.1) · 미래 버전 = 거절(2.2) · 잡·멱등 기록·seq·gen·meta·heads·보드·보관함 제외(2.3, 잡·멱등 제외 근거 [L1]).
3. 가져오기: 96MB 상한 → 파싱 → 봉투 → 레코드(`checkSaveDoc`·`checkState` 규칙) → 이미지(24개·60MB · `readImageRecord` 규칙 + `createImageBitmap` 디코드, **재인코딩 0** — 왕복 바이트 동일 위해, THREATS T4와 다른 사유 기록)(3.3).
4. id = **항상 새 id**(덮어쓰기 없음) · projectId가 해시 대상이라 doc·스냅샷 hash 재계산(`startDocWrite`에 `rekeyDoc` — engine 허용 목록)(3.4) · 대상 `seq` 불변.
5. 쓰기 = deleteProject 흐름 복제(tabLockHold · 한 트랜잭션 · gen+1 · saved · sessionStorage 키 · 새로고침), 단 **DB_VERSION 2 + upgradeDatabase로 열기**(새 브라우저 주 용도 — 빈 v1 DB)(3.5).

## 검증
- 문서 레인이라 앱 4게이트 대상 변경 0. `git diff --stat 6009271..HEAD` = docs/design/persistence/P2-SPEC.md · dev/active/p2-spec/* 만(아래 명령으로 확인).
- 마감 보완(advisor 점검): 가져온 줄 포커스 = projectId 키(이름 중복 대비) · 내보내기에 가져오기와 같은 한도 적용(EX-12 — 자기 거절 파일 0) · ⑥ L1 택1 표기.
- 코드 사실은 grep·읽기로 [L1] 파일:줄 표기. 남은 [확인 필요] = 390 폭 줄바꿈(E) 1건.

## 하지 않은 것
- **턴 기한 초과**: SPEC 초안 커밋이 브리프의 "22턴 전" 기한을 넘김(실제 약 25턴째 `9b41bd3`) — 코드 사실 수집에 턴을 더 씀. REPORT·PROGRESS는 32턴 전 마감.
- **Ego Lite 실측 생략**(브리프상 선택): 진입 위치(`/projects` 줄 행동·저장소 영역)는 코드로 [L1] 확인(`ProjectRow.tsx:49-62` · `BrowserStorageSection.tsx:159-205`). 서버 기동·DB 정리 없음 → 정리 대상 0.
- 앱 코드·테스트·lock·CLAUDE.md·`docs/decisions/` 수정 0 · Codex 0 · 서브에이전트 0 · push/merge/삭제 0 · main 5480 무접촉 · entry-slim 무접촉.

## Jarvis에게
- **확인 필요(막는 작업 없음): 이미지 재인코딩 0**(SPEC 3.3) — THREATS T4·ADR-007 (b)의 완화책 "디코드·재인코딩 재통과"를 "규칙 재검사 + 디코드 확인"으로 바꾸는 선택. 이유 = 왕복 바이트 동일 관문. 뒤집으면 AC-P01을 "치수·형식·픽셀 동일"로 바꾸면 됨.
- SPEC 9절 "바뀌는 문서" 5행(ADR-007 5절 P2 · THREATS T4 · P1C 1.6 예비 문장 · P1D 8절 · 2a-05 J-S04) 반영 판단.
- 레인: L1(순수 형식·검증·재매김) → L2 ‖ L3(ProjectsPage 겹침 1건 — L2 먼저 병합, L3 rebase).
- 10절 한계: 강등(memory) 상태 내보내기 불가 · 80MB 메모리 피크 미실측.
