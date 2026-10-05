# M2C-P3 PROGRESS

base `7125138` · 기준선: vitest 227파일 2034 · /studio 진입 127.04 · 첫 91.77 · 렌더 JS 84.19 / CSS 8.80 (P0 build 실측 일치)

- [x] P0 BRIEF·PROGRESS 커밋
- [ ] B-M2C-06 지운 뒤 포커스 → "이미지 고르기"
- [ ] B-M2C-07 지움 status 문구
- [ ] B-M2C-04 폭 변경 시 "이미지 편집" 펼침 유지
- [ ] B-M2C-05 스위치 도움말 문구(SPEC r2 4절)
- [ ] B-M2C-02 check-bundle-size afterAction 키(보고용)
- [ ] 게이트: typecheck·lint·build·전체 vitest
- [ ] Ego Lite 실화면 확인·캡처 shots/ · finish({keep:[]}) · listTaskSpaces()=[] · 서버 종료 리슨 0
- [ ] Codex review --scope branch --base 7125138 (≤2)
- [ ] REPORT.md

## 메모
- 04 원인: StudioLayout `mode`(tabs/split/…)마다 트리가 달라 EditFields가 재마운트 → 지역 `open` 상태 소실.
- 02: manifest 키로 존재하는 것은 `ImageSlotPanel.tsx`·`images/ingest/index.ts`. imageStore·exportImages는 해시 이름 공유 청크(`_imageStore-*.js`)라 소스 키 없음 — ImageSlotPanel·exportFlow 닫힘에 포함되어 집계됨.

## 테스트 수 예측 (RED 전)
- 06: ImageSlotPanel.test +2 (Enter로 지우기 → 포커스 '이미지 고르기' · 잃은 이미지 마우스 지우기 → 같음) → 2034→2036
