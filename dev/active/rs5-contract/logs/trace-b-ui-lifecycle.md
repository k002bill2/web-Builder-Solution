# 서브에이전트 B (code-explorer, 읽기 전용) — UI 저장 세대·수명 추적 요약 (467a691)

- 스케줄러: useAutosaveScheduler.ts Scheduler(:73-83) version/savedVersion, saving boolean(진행 promise 미보관), pending()=version>savedVersion(:140). startSave가 version 캡처(:182) → onSaved max(:195) — 옛 resolve가 새 편집을 saved로 못 만든다(마운트 안에서는 견고).
- revision은 useDocSave revisionRef(:61) 소유, resolve 때만 갱신(:70). UI doc.revision은 갱신 안 됨 — savedRevision()이 진실.
- 결함 후보: settle()(:125-132)은 savedVersion=version. adopt(:129-140)는 await write 중 편집을 docRef로 덮고 settle → 편집 손실 가능. resolve('mine')만 구제(:109).
- dispose(:134-137)=타이머 clear만 — 디바운스 편집 소실, 진행 저장 완료 콜백 무시(:193). POP/useBlocker 0(grep). 앱 안 링크만 leave() 대기(StudioLayout.tsx:127-148).
- 소유: StudioLayout 마운트당 스케줄러 1개, StudioPage key={projectId}(:33) 재마운트. StrictMode 사용(main.tsx:49).
- flushed() waiter는 언마운트 시 영구 pending 가능.
- 이미지: ImageSlotField.tsx:84-132 pick — ingest 비동기(스케줄러 모름, 변환 중 이탈=소실) → onEdit → publish(nextImages). 맵 등록 StudioLayout.tsx:310 → repository.images, cleanup=maps.delete. object URL은 Preview·render/objectUrls.ts 소유. prune StudioLayout.tsx:316-322(doc∪undo∪held).
- restart: 프로필 RestartDialog.run(:102-116) startDoc(restart, doc.revision) — 자체가 커밋(auto 스냅샷 + 새 문서 revision+1). 편집기 인계 경로 없음(새 마운트가 getDoc).
- getDoc = 메모리. useStudioDoc Promise.all(getProject,getDoc)(:22) — 늦은 save와 순서 보장 없음.
- 읽기 전용 판정이 문구 매칭(useDocSave.ts:74).
