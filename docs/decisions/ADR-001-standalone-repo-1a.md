# ADR-001 — 독립 저장소로 구현, 첫 목표는 시안 1a 프런트엔드

- 상태: **승인** (영환님, 2026-09-25 Slack: "3 진행해, 작업 폴더는 AOS 저장소가 아닌 web-builder-solution")
- 작성: Jarvis

## 결정
1. 구현 저장소는 `~/Work/web-builder-solution`(독립 Git 저장소)이다. AOS(`~/Work/Agent-System`)는 변경하지 않는다.
2. 화면 디자인은 Claude Design 핸드오프 번들의 **시안 1a "카탈로그 허브"** 를 기준으로 한다.
   - 원본: `design/claude-design-handoff/` (zip 원본과 동일, 수정 금지)
   - 1a 범위: `Design Studio Mockups.dc.html` 51~381행, 화면 7개(데스크톱 1280 × 5, 모바일 390 × 2)
   - 1b(가이드 워크스페이스, 383행 이후)는 구현하지 않는다.
3. 1단계(M1-UI)는 **프런트엔드 단독 앱**이다. 데이터는 목업의 픽스처를 타입이 있는 저장소 인터페이스(`ReferenceRepository` 등) 뒤에 둔다. 백엔드는 이 인터페이스를 유지한 채 이후 단계에서 붙인다.

## PRD·TRD v0.2와 달라지는 점
| 항목 | v0.2 문서 | 이 결정 |
|---|---|---|
| 배치 | AOS 신규 도메인, `/api/design-studio`, AOS 조직·권한 재사용 | 독립 앱. 인증·조직·사용량 원장은 자체 구현 필요(후속 단계) |
| 대시보드 스택 | AOS React 19·Tailwind 4·Zustand | 같은 스택을 새 앱에 구성 |
| 백엔드 | AOS FastAPI | 미정 — M1-UI 이후 ADR-002로 결정 |
| 디자인 시스템 | AOS 대시보드 테마 | 핸드오프 번들의 APFS 디자인 시스템 토큰(Wanted 계열) |

PRD의 제품 원칙(권리 경계·결정적 생성·품질 게이트·FR ID)은 그대로 유지한다. TRD의 AOS 의존 부분은 ADR-002에서 개정한다.

## 확인 필요
- APFS 디자인 시스템은 농업정책보험금융원용 브랜드 시스템이다. 제품 브랜드로 계속 쓸지, 토큰 구조만 쓰고 브랜드(로고·색)를 교체할지 결정이 필요하다. M1-UI에서는 목업 그대로 구현한다.
- 폰트는 jsDelivr CDN의 Pretendard를 원격 로드한다. 운영 전 자체 호스팅 여부를 결정한다(Pretendard는 OFL).
