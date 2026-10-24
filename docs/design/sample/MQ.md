# MQ-SMP 결정 기록 (SAMPLE-SPEC r0)

- 결정: 영환님 2026-10-25 Slack "★, push 승인" — 아래 ★ 전부 채택 · 문안 Jarvis
- 입력: `SAMPLE-SPEC.md` 6절(Designer r0) · `docs/security/extract/THREAT-MODEL.md` r0(Security) · `dev/active/sample-spec/EXTRACT-LEGAL-LEDGER.md`(Newton, 리스크 중간)
- SAMPLE-SPEC 6절과 다른 ★: **05·06** (Security·Newton 결과 반영 — 아래 근거)

| ID | 결정 | 비고 |
|---|---|---|
| MQ-SMP-01 | **B** 디자인 샘플 묶음 zip 1개(PNG·HTML·`design-tokens.json`·`sections.json`·README) + 기존 개별 버튼 유지 | SAMPLE-SPEC 2.3 |
| MQ-SMP-02 | **A** 자체 평평한 JSON(`design-sample/tokens@0`) | DTCG 호환은 [L3 확인 필요] — 확인 뒤 확장 |
| MQ-SMP-03 | **A** 내보내기 순서 PNG → 샘플 묶음 → HTML 1개 → HTML 샘플 zip → React 코드 샘플 zip | M4-a Q18 A 결정을 이 결정으로 대체 |
| MQ-SMP-04 | **A** 승인 고정 문안(LICENSES `zip/licenses.ts:35,37`·React README) "사이트"→"샘플" 최소 치환 | 권리 문장 의미 불변 |
| MQ-SMP-05 | **B 로컬 CLI(사용자 PC, 정적 fetch 우선·JS 끔)** | SAMPLE-SPEC ★C(보류) → THREAT-MODEL 5절 ★B로 변경. 서버 fetch(SSRF·공격 프록시)·브라우저 확장(사용자 세션 유출) 기각 |
| MQ-SMP-06 | **C 허용 목록 도메인만** | SAMPLE-SPEC ★B(robots + 사용자 체크) → 변경. Newton 원장 ★1: 사용자 체크는 원사이트 권리자 허락을 대신하지 않음. robots 존중은 추가로 유지 |
| MQ-SMP-07 | **A** ADR-004 새 개정으로 `/studio` 진입 몫 **최대 +0.05** 배정 | 실측 후 개정 23 기록(구현 레인). 상한 129.13·132.11 불변 |
| MQ-SMP-08 | **A** 정적 HTML 시안 Safari·Firefox 열람 확인 → 백로그(B-SMP-01, 수동 1회) | |
| MQ-SMP-09 | **★ 경로 B AI 입력 = 추상 속성 4종만**(팔레트 값·글꼴 계열명·정규화 간격 범주·통상 섹션 태그, 허용 스키마 검증 뒤). 원문 HTML/CSS·본문·이미지·로고·스크린샷·정밀 DOM·좌표·폰트 파일·자산 URL의 모델 입력과 모델의 URL 재취득은 **별도 법무 승인 전 금지**. 사진·폰트·색은 별도 사용권 자산으로 **독립 재구성**(원본을 닮게 하는 치환 아님) + 사람 검토 | 영환님 2026-10-25 전제(참조·AI 재가공·유사 자산 대체) → Newton R2 원장 6절 권고 채택. 리스크 중간 유지. 모델·공급자 미선정. BL-1 해제 아님 |

## 경로 B 착수 조건 (변경 없음)

ADR-009 2절 게이트 + THREAT-MODEL Blocker **BL-1~7 전부 해제 전 코드 착수 금지.** BL-1 = 실제 법무 확인 — 영환님 측 진행. **질문서 정본 = `dev/active/sample-spec/LEGAL-QUESTIONS-R2.md`(Q1~Q7, 2026-10-25)**: R1 질문 5개(`LEGAL-QUESTIONS.md`·원장 1절)를 계승·수정하고 Q6 대체 자산·글자체·색채, Q7 모델 계약·입력/출력 책임을 추가. 근거 원장 `EXTRACT-LEGAL-LEDGER-R2.md`(인용 연결 `citations OK` · 문장 커버리지 39/134 = 29%, 기준 50% 미달 — 법률 의견 아님).
단, **BL-4(앱 `isCssValue` 함수 표기 거부 강화, `app/src/render/protocol.ts:70`)는 경로 A 구현 레인에 선반영**한다(경로 B와 무관한 방어 심층화).
