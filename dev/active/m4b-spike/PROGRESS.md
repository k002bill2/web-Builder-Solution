# M4-b-0 PROGRESS — React zip 실현성 스파이크

- [x] 0. BRIEF·PROGRESS 커밋 (f5d2a47b)
- [x] 1. 코드 생성 방식 (a)/(b)/(c) 비교 — (a) 권장, 청크 36.83KB gzip · 충실도 실측
- [x] 2. 산출 zip 구성안 — 53파일 트리 · 의존성 10개 고정 · 앱 새 의존성 0(문자열)
- [x] 3. 최소 시제품(patches/reactZip) → $TMPDIR 풀기 → npm install && npm run build exit 0 → ego-browser DOM·스타일·스크린샷 비교(일치)
- [x] 4. /studio 진입 증분 실측 — 버튼 +0.01 · 배선 +0.01(128.81 · 복원 131.79 · 렌더 84.29)
- [x] 5. 결정 질문 Q1~Q8(★4) + 사용자 질의 표 U1~U3
- [x] 6. REPORT 초안(잠정 결론 줄) — 10턴 안 (d62c3c9f) → 완료본 갱신
- [ ] 7. 마감: Codex 1회 · git status 빈 값(node_modules 외) · git diff -- app/ 빈 값 · 커밋 SHA 보고

## 로그
- 기준 빌드(41fcfd25 그대로): /studio 정규화 128.80(멈춤 128.82) · 복원 131.78 · 렌더 JS 84.29/90 — raw/baseline-bundle.txt. 빌드 뒤 git status 빈 값.
- 서브에이전트(읽기 전용, Explore 1개) 완료: 킷 = src/kit 29 tsx + 7 ts(1,486 LOC) + kit.css 1,370 · motion.css 97 · fonts.css 38. 런타임 import = react + 킷 내부만(kitGuard.test 강제), 킷 밖은 type-only(engine/contracts/pageDoc · render/protocol KitTokenInput). 스타일 = kit-* 클래스 + --site-* 변수(kitVars), Tailwind 유틸은 PageDocument main의 flex flex-col뿐. 모션 = CSS keyframes만(motion 라이브러리 0). thumbs/entry.tsx가 Node에서 renderToStaticMarkup(PageDocument) 선례.
- 시제품: 1차 zip은 vitest css:false로 kit.css 0바이트였는데도 빌드는 성공 → 충실도 비교에서 발견, CSS 주입 + 빈 원문 throw로 수정. 2차에서 카드 본문 16 vs 14px(앱 DS body3 누수) → index.css에 값 복사 → 3차 DOM 일치 · 스타일 차이 2(line-height, 배치 0) · 스크린샷 바이트 동일.
- 앱 추적 파일 직접 수정(예산 측정용)은 권한 분류기가 거절 → $TMPDIR/m4b/appcopy(git archive + node_modules 복제)에서 b0/b1/b2 빌드. 사본 b0 = 저장소 기준과 같은 값.
- 앱 안 임시 파일 app/src/features/studio/reactZip/ → patches/reactZip 보존 후 삭제.
