# 서브에이전트 A (code-explorer, 읽기 전용) — 저장큐·이미지 원자성 추적 요약 (467a691)

메인이 직접 대조한 행: localSync.ts:43-56,86-140,151-215 · writeQueue.ts 전문 · imageOps.ts 전문 · memoryProjectRepository.ts:40-152 · useDocSave.ts:20-152.

- 저장됨 확정 = kept() → LocalSync.flush() → writeQueue → idbPersistence txDone oncomplete(idbPersistence.ts:52-57,88-99). pending/idle/커밋 질의 API 없음(grep 0).
- 메모리 먼저 커밋(memoryDocBook.ts:365-367) → read-only·stale·cleared·quota reject여도 메모리 revision은 이미 +1(P3 로그 a.memory [1,2,true]).
- writeQueue: 탭 전역 직렬 1개(tail), 제출=트랜잭션 1, structuredClone 스냅샷, 실패=미확인 보존·같은 키 재제출 병합, status pending|unconfirmed|undefined(LocalSync 밖 미노출).
- stamp: 모든 제출에 studio/state + meta/generation +1(localSync.ts:125-131) — 탭 간 세대. 편집 세대 아님.
- 이미지: 문서 put과 같은 submit = 같은 IDB 트랜잭션. put = 참조 ∩ 맵 − settled. **맵에 없는 참조는 조용히 건너뜀(imageOps.ts:23-25)** = RS4-R10 근원. stored는 열 때 keys("images")로 시드(localSync.ts:113) — 하이드레이트 이미지도 settled.
- retry 경로(submitted 동일 레코드)는 새 imageOps를 만들지 않는다(localSync.ts:155).
- 하이드레이트 레코드는 submitted에 없음 → flush가 새 제출(Q4 근거).
- persistence 'local'|'memory' 생성 시 고정(memoryProjectRepository.ts:107). 진입 OK·openLocalSync 실패면 'local'인데 영속 불가 — 구별 필드 없음.
- deleteSnapshot(p,"") flush 대용은 SPEC-4·측정 패치에만, 앱 코드에 없음(실제 호출은 SnapshotDialog.tsx:260 진짜 삭제).
- 미조사: deleteProject의 이미지 prefix 정리, imageRestore 본문.
