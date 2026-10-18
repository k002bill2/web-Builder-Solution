# M4-b-0 PROGRESS — React zip 실현성 스파이크

- [x] 0. BRIEF·PROGRESS 커밋 (f5d2a47b)
- [ ] 1. 코드 생성 방식 (a)/(b)/(c) 비교 — 생성기 크기·충실도
- [ ] 2. 산출 zip 구성안 (package.json 허용 목록·vite.config·src·글꼴·LICENSES), 앱 새 의존성 0 확인
- [ ] 3. 최소 시제품(patches/) → $TMPDIR 풀기 → npm install && npm run build 실측 → iframe 대비 DOM/스크린샷 1회
- [ ] 4. /studio 진입 증분 실측 (현 128.80, M4-a 몫 남은 0.01)
- [ ] 5. 결정 질문 목록(번호·★) + 사용자 질의 표
- [x] 6. REPORT 초안(잠정 결론 줄) — 10턴 안 (d62c3c9f)
- [ ] 7. 마감: git status 빈 값(node_modules 외) · git diff -- app/ 빈 값 · 커밋 SHA 보고

## 로그
- 기준 빌드(41fcfd25 그대로): /studio 정규화 128.80(멈춤 128.82) · 복원 131.78 · 렌더 JS 84.29/90 — raw/baseline-bundle.txt. 빌드 뒤 git status 빈 값.
- 서브에이전트(읽기 전용, Explore 1개) 완료: 킷 = src/kit 29 tsx + 7 ts(1,486 LOC) + kit.css 1,370 · motion.css 97 · fonts.css 38. 런타임 import = react + 킷 내부만(kitGuard.test 강제), 킷 밖은 type-only(engine/contracts/pageDoc · render/protocol KitTokenInput). 스타일 = kit-* 클래스 + --site-* 변수(kitVars), Tailwind 유틸은 PageDocument main의 flex flex-col뿐. 모션 = CSS keyframes만(motion 라이브러리 0). thumbs/entry.tsx가 Node에서 renderToStaticMarkup(PageDocument) 선례.
