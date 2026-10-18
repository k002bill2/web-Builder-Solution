# M4-b-0 BRIEF — React zip(FR-PUB-02) 실현성 스파이크 (Developer, 측정 전용)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (자동 진행 — M4-b 착수 전 측정)
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/m4b-spike` (base `41fcfd25`). 정본: PRD FR-PUB-02(`docs/02-prd/PRD.md:141` — React + Tailwind + motion/react 프로젝트 zip, 의존성 허용 목록만, zip에서 `npm install && npm run build` 성공) · TRD:314(zip 빌드 성공률 100%) · M4-a store zip(`features/studio/zip/**`) · EXPORT-SPEC Q18(React zip 버튼 M4-b).

## 질문 (REPORT 결론 줄 형식: `실현 가능 여부 · 생성기 위치/크기 · 진입 증분 · 산출 zip 의존성 목록 · 빌드 검증 방법`)
1. **코드 생성 방식**: 현 PageDoc → React 컴포넌트 소스(TSX) 생성 경로 후보 — (a) 킷 컴포넌트 소스를 템플릿으로 동봉 + 문서 JSON 주입 (b) 섹션별 TSX 코드 생성 (c) 기타. 각 안의 생성기 크기 추정·충실도(렌더 iframe과 같은 결과) 비교.
2. **산출 zip 구성안**: `package.json`(의존성 허용 목록 — react·react-dom·tailwindcss·motion·vite 등 버전 고정 후보) · `vite.config` · `src/**` · 글꼴·이미지 · LICENSES. **앱 자체의 새 의존성은 0이어야 한다** — 산출물 package.json은 문자열일 뿐인지 확인.
3. **최소 시제품(patches/로만)**: 섹션 2~3종 문서 1개로 생성 → 임시 디렉터리에 zip 풀기 → **`npm install && npm run build` 실측**(로컬 네트워크로 npm 레지스트리 접근 필요 — 실패하면 오프라인 대안(로컬 캐시) 기록하고 BLOCKED). 빌드 결과를 렌더 iframe 결과와 스크린샷/DOM 비교 1회.
4. **예산**: 생성기를 조작 뒤 청크에 둘 때 `/studio` 진입 증분 실측(현 128.80, 개정 18 M4-a 몫 남은 0.01 — M4-b는 별도 개정 필요 여부 판단 근거).
5. **결정 질문 목록**(번호·★): 예산 개정·산출물 의존성 허용 목록·생성 방식 — 사용자 질의 대상은 별도 표.

## 규칙
- 산출 `dev/active/m4b-spike/{REPORT.md,patches/*,raw/*}`. 임시 빌드 디렉터리는 저장소 밖(`$TMPDIR`). 앱 커밋 0 · 앱 package.json 변경 0. 서브에이전트: 읽기 전용 1개(킷 컴포넌트 구조 조사) 허용. 최대 70턴, 58턴부터 복원·REPORT.

## 공통
- 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. 첫 2턴 BRIEF·PROGRESS 커밋, **REPORT 초안(잠정 결론 줄) 10턴 안**, 항목마다 갱신 커밋. 사실/추정/미확인 구분.
- **앱 코드 커밋 0**(임시 테스트·패치는 `patches/`로 보존 후 복원). Codex는 `--help` 없이 1회까지.
- 마감 전 `git status --short` node_modules 외 빈 값 · `git diff -- app/` 빈 값.
