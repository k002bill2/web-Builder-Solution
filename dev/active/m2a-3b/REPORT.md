# M2A-3b 정적 HTML 생성기 + 내려받기 — REPORT

- 브리프 `docs/06-handoff/M2A-3B_STATIC-HTML_BRIEF.md` · 시작 커밋 `a51de92` · 브랜치 `k002bill2/m2a-3b`

## 1. 커밋 표
| 단계 | 커밋 | 내용 |
|---|---|---|
| 수신 | 08640e5 | 수신 기록 · REPORT 골격 · `gate.sh`(실패 시 exit 1) |
| G0 | (이 커밋) | 3a Codex(P1 0 · P2 3 → 3c) · F6 브라우저 GENERATOR_UNAVAILABLE·대화상자 캡처 — 코드 변경 0 |

## 2. G0 이관 확인 (3a Codex · F6 브라우저)
### 2.1 Codex `review --scope branch --base bec1b38` (원문 `logs/g0-codex-3a.txt`)
**P1 이상 0 → 이 레인 코드 변경 0.** P2 3건 판정:
| # | 지적 | 판정 |
|---|---|---|
| P2-1 | `useExportFlow.ts:30-32` `loadFlow()`(조작 뒤 청크 import) 실패 시 `running`이 남아 두 버튼 영구 비활성 | **사실(재현 경로: 청크 교체·오프라인).** 3b 범위 밖(정적 HTML 생성기와 무관) — M2A-3c로 넘김(9절). 고칠 때 `retryableImport` + `finally` 해제 |
| P2-2 | 저장 대기 중 편집이 새 경고를 만들면 확인 대화상자 없이 요청 | **사실(드묾 — 저장 대기 수백 ms 사이 편집).** 서버 게이트는 경고를 막지 않으므로(8.3.2 5단계 = 차단만) 결과 피해는 "확인 안 한 경고"뿐. M2A-3c로 넘김(9절) |
| P2-3 | 2단 배치에서 필수 섹션 이동 대상이 닫힌 `<details>` 안이라 포커스 실패 | **사실 가능성 높음(2단 배치 한정).** 게이트 이동(3a E2) 영역 — 3b 범위 밖, M2A-3c로 넘김(9절) |

### 2.2 F6 브라우저 (`logs/g0-flow.txt` · vite dev 127.0.0.1:4337 · 앱 안 클릭만)
- **게이트 통과 가능 확인**: A안 진입 = SEO 메타 차단 2 + 구조 미리보기 2(Portfolio·Testimonials). r4.11로 대체텍스트 차단 **0**. 폴백 2개 삭제 → "페이지 정보"에서 제목·설명 입력 → 게이트 7줄 통과(성능 예산 측정 전) · 이유 0 · 두 버튼 열림. 우회 픽스처 0.
- **G0 시점(생성기 없음) "정적 HTML 내보내기"** → info Callout "정적 HTML은 생성기 연결 후(다음 단계) 내보낼 수 있습니다. 지금 문서는 이 탭에 저장돼 있습니다 — …" · `role=alert` 아님 · 콘솔 오류 0 → `shots/g0-1440-unavailable.png`
- **경고만 상태**(제목 63자 = R-11 warn) → 확인 대화상자 `open` · `:modal` true · 첫 포커스 "경고를 확인했습니다 · 내보내기" · 배경 지점 최상위 = dialog(배경 조작 불가) · Esc → 닫힘 → `shots/g0-1440-dialog.png`
- **캡처 폭 1440(브리프 1280과 다름)**: ego-browser는 흐름·DOM 조회는 됐으나 `Page.captureScreenshot`이 매번 CDP 시간 초과(창 viewport 160×113 상태, 새 page·bringToFront·raw 모두 실패) → aside repl로 캡처. aside는 뷰포트 조절 수단이 없어 창 기본 1440×900. 파일 이름에 실제 폭을 적었다.
- 관찰 1건: Esc 뒤 포커스가 body(연 버튼 아님). aside `click()`이 버튼에 포커스를 주지 않아 opener가 body였던 것으로 추정 — G6에서 키보드(포커스 → Enter → Esc)로 재확인(6절).

## 3. 생성 방식 PoC · 결정 (G1)
(작성 예정)

## 4. 직렬화 프로토콜 (G2)
(작성 예정)

## 5. 생성기 · 내려받기 (G3 · G4)
(작성 예정)

## 6. K-AC · E-AC 판정 (G5 · G6)
(작성 예정)

## 7. 번들 표 (체크포인트별)
(작성 예정)

## 8. SPEC 차이
(작성 예정)

## 9. 남은 위험 · M2A-3c에 넘길 것
(작성 예정)
