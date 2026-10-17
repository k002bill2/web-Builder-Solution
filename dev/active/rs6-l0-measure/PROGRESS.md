# RS6-L0 PROGRESS

- [x] CP0 BRIEF·PROGRESS 커밋 (b4d438b2)
- [x] CP1 base 빌드 측정 (정규화·raw·복원·다른 라우트) 커밋
- [ ] CP2 S6a 측정·패치 보존 커밋
- [ ] CP3 S6b·S6c 측정·패치 보존·S6c 제거 목록 커밋
- [ ] CP4 S6d 측정·원복(base 재빌드 수치·dist sha 동일) 커밋
- [ ] 최종 게이트 fresh: build · typecheck · lint · test(317/2856)
- [ ] REPORT 결론 줄·표·청크 구성·UNMEASURED·사실/추정/미확인
- [ ] `git diff -- app/` 빈 출력

## 로그
- CP1: `npm ci` exit 0 · `git status --porcelain app` 0줄(lock diff 0) · `npm run build` exit 0 → /studio 정규화 128.09 · raw 129.40 · 복원 131.07/132.43 · catalog 100.05 · profile 99.56 · projects 99.15 (기대값과 일치). dist 149 파일 sha = `raw/cp1-base-dist-sha.txt`. chunks TOTAL raw 129.40 / norm 128.09 / 21 청크. rawbytes 사본에 preloadGuard 치환 1줄 추가(base 원본 import 증가).
