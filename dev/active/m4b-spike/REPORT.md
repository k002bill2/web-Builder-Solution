# M4-b-0 REPORT — React zip(FR-PUB-02) 실현성 스파이크

> 상태: **초안(잠정)** — 실측 전. 항목마다 갱신 커밋. 표기: [사실]=실행·파일 근거 · [추정] · [미확인].

## 결론 줄 (잠정)
`실현 가능(추정) · 생성기 = 조작 뒤 청크(features/studio/reactZip/, 크기 미실측) · 진입 증분 미실측(버튼 1개 추가분만 예상) · 산출 zip 의존성 = react·react-dom·motion·tailwindcss·@tailwindcss/vite·vite·@vitejs/plugin-react(버전 고정 후보, 미검증) · 빌드 검증 = $TMPDIR에 풀어 npm install && npm run build 실측(미실행)`

## 1. 코드 생성 방식
(조사 중)

## 2. 산출 zip 구성안
- [사실] `ExportFormat`에 `"react-zip"`이 이미 있다(`app/src/data/projectRepository.ts:95`). 버튼은 M4-a Q18 A로 빠져 있다(`app/src/components/studio/ExportButtons.tsx:10-13`).
- [사실] 앱 `package.json`에 `motion` 없음 — 산출물 package.json은 생성기가 만드는 문자열이어야 앱 의존성 0을 지킨다.

## 3. 최소 시제품
(미실행)

## 4. 예산
- [사실] `/studio/:projectId` 진입 한도 130(개정 9) · 정규화 상한 129.13(개정 18). BRIEF 기준 현 128.80 · M4-a 몫 남은 0.01.

## 5. 결정 질문
(작성 중)
