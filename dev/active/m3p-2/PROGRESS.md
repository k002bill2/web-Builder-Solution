# M3P-2 PROGRESS — 실렌더 썸네일 파이프라인

base db9f25e · 브랜치 k002bill2/m3p-2 · Ego Lite preview 4339

## 체크리스트
- [x] P0 BRIEF 커밋
- [ ] S0 ① SSR 정적 마크업 vs 렌더 문서 DOM 비교
- [ ] S0 ② @media 1280 해소
- [ ] S0 ③ 중첩 svg 네임스페이스 직렬화(XML 파싱)
- [ ] S0 ④ 실제 <img src=svg> Ego Lite 시각 확인
- [ ] referenceDoc (레퍼런스→렌더 입력)
- [ ] SSR 빌드 모드 + SVG writer (thumbs/{id}.{hash}.svg, 1280×960)
- [ ] THUMBNAIL_KEYS 지연 청크 맵
- [ ] 빌드 가드 U8·G2·G3·G6
- [ ] package.json scripts.build 단계 1개 (의존성 0)
- [ ] check-bundle-size 썸네일 크기 출력·가드
- [ ] Ego Lite 6장 확인·finish·서버 종료
- [ ] typecheck·lint·build·vitest exit0
- [ ] Codex review ≤2
- [ ] REPORT

## TDD 예측 로그
