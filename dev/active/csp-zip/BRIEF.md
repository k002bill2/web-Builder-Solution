# CSP-2 BRIEF — 정적 zip·React zip CSP (실측 → 구현) (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-20 (자동 진행 — CSP-SPEC r1 5a 2단계, B-SEC-04 마감)
base origin/main `4e2cf602`(PR #57 static-html CSP 포함). 정본 `docs/design/csp/CSP-SPEC.md` r1 + 5a(1.2 · 1.3 · 3.2 · 4.1 · 5절 CQ-03·04·05·06·08).

## E0 실측 먼저 (구현 전, 결과를 REPORT에 표로)
1. **CSP-AC-R3**: 정적 zip을 임시로 CSP meta를 넣어 생성(patches/만) → Chromium(ego-browser)에서 `file://`로 `index.html` 열기 → 이미지·글꼴·메뉴 적용·콘솔 CSP 위반 기록. Chromium에서 막히면 **CQ-03 C(zip은 CSP 제외)** 로 판정하고 zip 구현은 하지 않는다.
2. **CSP-AC-C1**: React zip 산출물에 CQ-04 A(`vite.config.ts` 인라인 plugin, `apply:"build"`)로 CSP를 넣은 템플릿을 임시 적용 → docker `node:22`에서 `npm ci && npm run build` → `dist/index.html` CSP meta 1개·head 첫 자식·인라인 script 0 → `vite preview`로 위반 수 기록(CQ-05: 위반 1건이라도 있으면 `style-src` B).
- **모든 실화면·preview stdout은 `dev/active/csp-zip/logs/`에 tee로 저장**(CSP-1 QA 교훈 B-SEC-08). 같은 실측에서 static-html R1 위반 0·R5 시트 닫힘도 다시 확인해 로그로 남긴다.
## E1 구현 (E0 결과대로, TDD)
- 정적 zip: CQ-03 A면 `STATIC_CSP_ZIP`(CSP-AC-02·06(zip)·07(zip)·11) · C면 미구현 + REPORT 판정.
- React zip: CSP-AC-09·C1·C2(dev 영향 0)·R4(390 메뉴·위반 0) · lock·허용표 갱신 시 대조 테스트 유지.
- 예산 `/studio` 128.76 · 복원 131.75 증분 0(생성기 청크 안). 생기면 감량 1회 뒤 멈춤.
- Codex adversarial 1회(`--help` 금지)·반영 1회. 새 의존성 0.
## 규칙
- **git push·pull·fetch 금지.** preview는 `--port 4399 --strictPort`, 종료 후 리슨 0 기록. 임시 빌드는 `$TMPDIR`. 전체 테스트 `--maxWorkers=4`. 첫 2턴 BRIEF·PROGRESS 커밋, E0 뒤 REPORT 초안. 항목마다 커밋. 마감 전 `git status --short` 빈 값. 최대 70턴, 58턴부터 마감.
