# Jarvis 최종 회수 — M2B-1b hardening

- 책임 Developer(수정) → QA(독립 재검증) → Jarvis(통합·자동검증·로컬 병합).
- 실행 Orca Claude Code·Codex·Hermes·Git. 구현 HEAD `7ff176c`, QA HEAD `266f33e`, 코드 baseline `c79bb65`.
- Developer 71턴 success, QA 30턴 success. QA가 앱 코드를 변경하지 않았고 정확한 구현 tree에서 검증했다.

## 최종 자동검증 (Jarvis 새 실행)
- app cwd, typecheck·lint·build 모두 exit 0.
- 기본 `npx vitest run` 3회: 매회 191파일·1744/1744 PASS·exit0, Errors/Unhandled 오류 보고 없음. 레인의 maxWorkers=4 결과와 구별한다.
- 증거 `logs/jarvis-final/{results.json,typecheck.txt,lint.txt,build.txt,vitest-1.txt,vitest-2.txt,vitest-3.txt}`. 원시 로그 바이트 보존(EOF 공백 경고 가능).
- 렌더JS81.13KB/CSS7.13KB, studio첫화면91.78KB/진입127.40KB. 렌더CSS만 baseline대비+0.01KB, 한도상향0.
- 새테스트6개, 기존1738→1744. 앱diff는kit.css와popoverFallback.test.ts뿐. script상수·KEPT_DATA·engine계약·잠금파일변경0.

## 독립 QA 회수
- 지원4×3폭 12/12, 모의미지원4×3폭12/12. header링332건 최소4.61·부정표본5종검출.
- 390 nav빈값utility보조줄 위 배치·읽기순서·넘침PASS. QA 캡처를 Jarvis가 직접 확인했다.
- QA 상세로그·독립 판정은 REPORT.md에 있다. Esc후 :popover-open false와focus복귀는 확인했지만 **Esc직후 checkVisibility는 따로 측정하지 않음**. 앵커닫기·다시열기·hidePopover의visibility검증과 구별한다.

## 브리프 전제 교정·남은 한계
- footer실제링요구는 적용불가(N/A)로 교정한다. m2aSPEC122·463과FooterLinks가 비조작li글자를 규정하며 QA실제DOM에서도포커스대상0이다. header의제목일치링크규칙을footer에확장한 Jarvis브리프전제가잘못됐다.
- 따라서 실제footer링PASS라고 주장하지 않고, 기능추가·대상슬롯·링크화는하지않는다. 운영마크업이아닌탐침링48건은조건부CSS참고증거뿐. 링크기능을도입할때MQ-2별건에서검증한다.
- 실제구형UA·WebKit·Gecko는미검증, 미지원은Chromium모의분기검증. 호환성전면보증이아니다.
- 승인범위내보완수정·적용가능한회수게이트종결. 위한계를보존하고2a기동가능으로판정하되,2a는자동기동하지않는다.
- main5480서버무접촉. QA종료후4337·4339LISTEN없음직접확인. 외부push/배포없음.
