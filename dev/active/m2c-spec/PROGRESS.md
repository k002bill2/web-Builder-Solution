# M2C-0 PROGRESS — 이미지 명세·계획 (Designer · worktree m2c-spec · base `92f8e2f`)

- 서브에이전트 분할: 0 (브리프 금지) · 코드 변경 0 · push/merge/삭제 0

## 체크리스트
- [x] P0 BRIEF 명시 커밋 — `5b8f6a2`
- [x] P1 L1 확인 — Media.tsx · slotImage · images 맵 경로 · 업로드 유무 · TR-SEC-04 · TR-POL-01 · R-09 · ADR-004 예산 · 이월 결정(MQ-B3×2 · m2a 114·569행 · B-M2B-01·09) · 2a-05 SPEC 5.9
- [x] P2 `docs/design/m2c/SPEC.md`
- [x] P3 `docs/design/m2c/MQ-M2C.md`
- [x] P4 `docs/04-plan/M2C_PLAN.md`
- [x] P5 Codex adversarial r1 needs-attention 4건 → SPEC r1 반영(`2322dc4`) → r2 approve 지적 0
- [x] P6 REPORT 마감 · 커밋

## L1 메모 (P1)
- 업로드 경로 없음: `EditFields.tsx:44` "이미지 슬롯 N개는 다음 단계에서 편집" · 이미지 보관소 코드 0 · `StudioLayout`·`StructureCanvas` 호출부에 images 미전달 → 제품에서 images 맵은 항상 빈 값.
- 렌더 경로는 이미 있음: protocol `images: Record<id, Blob>`(protocol.ts:38) → RenderApp `createObjectUrlCache`(objectUrls.ts) → Media `img`/그라디언트.
- 정적 HTML·PNG: `renderAndSerialize`가 render 메시지에 images를 안 실음(staticHtml.ts:90) → 지금 내보내기는 항상 그라디언트. `serializeSite`는 이미 `blob:`→data URL 변환(serializeSite.ts:21). staticMarkup: blob: 잔존 = 실패(69행).
- 플레이스홀더 `{kind:"placeholder", patternId:"diagonal"}`(defaults.ts:8) — Media는 무시하고 `.kit-gradient`(kit.css:289).
- 이미지 슬롯 L1: hero fullbleed-left·split·grid·image `image` · about story `image` · portfolio grid-3·masonry `image1~3`, grid-2 `image1~2` · footer biz-extended-map `map`.
- 예산 L1(`dev/active/m2b-d1/logs/jarvis-final/build.txt:139·150`): `/studio` 첫 91.79/100 · 진입 127.36/128(멈춤선 127.70, 감지선 기준선+0.03) · `/profile` 첫 99.62/100. 렌더 JS 83.03/89.70 · CSS 8.75/30(BRIEF·m2b-5-spec 기록). 이 레인은 node_modules 없음 → 빌드 재실측 안 함(코드 0).
- 2a-05 SPEC 5.9(305~323행): 슬롯 UI·보관소·한도(파일 5MB·JPEG/PNG/WebP·문서 12개·30MB·탭 24개·60MB) 이미 설계 — TR-SEC-04(10MB·40MP)와 불일치 → MQ.
