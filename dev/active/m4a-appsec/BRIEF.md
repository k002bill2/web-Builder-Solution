# M4-a-3 AppSec BRIEF — 정적 zip 내보내기 보안 검토 (Security, 읽기 전용 + 로컬 능동 검증)

책임 역할: Security / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18
대상: 이 워크트리 `k002bill2/m4a-appsec` = `k002bill2/m4a-impl` tip `a834eb88`(base main `d8e548e5`+`b75483ee`). 정본 `docs/design/m4a/EXPORT-SPEC.md` 4·5절 · Developer 보고 `dev/active/m4a-impl/REPORT.md`.
범위: 로컬 코드·로컬 단위/빌드·로컬 생성 산출물 분석만. 외부 송신·스캔 0, 네트워크 서비스 대상 능동 스캔 0.

## 검토 (위협 모델 = 사용자 문서 → 내보낸 zip/HTML을 제3자 브라우저에서 엶)
1. **zip 작성기**(`features/studio/zip/**`): 경로 정규화·zip-slip(`..`·절대·`\\`·드라이브·유니코드 정규화·대소문자 충돌) · CRC·크기 필드 정합 · 결정적 시각 · 상한(`ZIP_MAX`, 항목 수) 우회.
2. **금지 패턴 검사**(`staticHtml/staticMarkup.ts` F-09~F-15): 사용자 글자·속성·CSS를 통한 스크립트 실행·외부 요청 우회 — 이벤트 핸들러, `javascript:`·`data:text/html`, SVG(`<foreignObject>`·`xlink:href`·`<animate>`), CSS(`url()` 이스케이프·`@import`·`image-set`·`expression`), `<meta http-equiv>`, `srcdoc`, 엔티티·널 바이트 인코딩 우회. 퍼즈 표(입력 → 결과)를 임시 테스트로 돌리고 되돌려라.
3. **`09c4309d` 집중 검토**(Codex 미검토 — F-14 브랜드 검사에서 CSS `url(data:…)` 본문 제외): 이 제외가 F-13·F-11 등 **다른 검사의 범위도 좁혔는지**, `url(data:` 안에 숨긴 외부 참조·스크립트(`data:image/svg+xml` 안 스크립트·외부 href)가 통과하는지. Codex 1회 허용: `adversarial-review --scope commit 09c4309d` 또는 동등 — 결과 원문 요약.
4. **참조 직렬화**(렌더 `serialize{refs}` → 부모 Blob): 렌더 iframe ↔ 부모 메시지 신뢰 경계(출처 검사, id 위조로 다른 Blob 끼워넣기), 누락 이미지 시 거짓 성공.
5. **LICENSES.md·OFL.txt**: 사용자 입력이 Markdown/경로에 섞여 주입되는 경로.
6. **CSP/sandbox**: 내보낸 HTML에 CSP meta 유무와 SPEC 정합(없으면 권고만, 새 설계 금지).

## 판정
- Critical/High = FAIL(머지 차단). Medium = 수정 권고 + 머지 전 Jarvis 판단. Low/Info = 기록.
- 산출 `dev/active/m4a-appsec/{BRIEF,PROGRESS,REPORT}.md`(+ `logs/`). 서브에이전트: 읽기 전용 2개까지(1·2 병렬 조사) 허용. 최대 60턴, 48턴부터 마감.

## 공통
- 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. **첫 2턴 BRIEF·PROGRESS 커밋, REPORT 초안(잠정 판정 줄 포함) 10턴 안에 커밋**, 이후 항목마다 갱신 커밋(중단 대비). 사실/추정/미확인 구분.
- 변이·임시 테스트는 매번 되돌림. **앱·테스트 수정 커밋 금지**(수정 제안은 REPORT에 패치 형태로).
- preview를 띄우면 마지막 커밋 직전 종료 → `lsof -nP -iTCP:<포트> -sTCP:LISTEN` 0 기록. 마감 전 `git status --short` node_modules 외 빈 값.
