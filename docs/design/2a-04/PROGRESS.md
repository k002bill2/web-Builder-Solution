# DS-2A-04 PROGRESS — 디자인 프로필 · 3안 생성 화면 설계

- 역할: Designer (Hermes) · 브리프 `docs/06-handoff/DS-2A-04_DESIGNER_BRIEF.md` · 근거 ADR-003·004·005·006, `docs/design/v2/SPEC.md` 6.5
- 범위: 설계 문서만. `app/`·`design/` 수정 없음. `docs/design/2a-04/`만 로컬 커밋, push·원격 없음
- 턴 예산 80 · 65턴 넘으면 새 작업 중단하고 SPEC 먼저 커밋

## 단계

| # | 단계 | 상태 | 비고 |
|---|---|---|---|
| 1 | 읽기: CLAUDE.md · ADR-002~006 · PRD 4·7.3~7.6·8·10 · TRD 4.3~4.5·5·6.2·7·11 · 개발계획서 M1·M2 · v2 원본 2a-04(·2a-05 경계) · v2 SPEC · 1a-03 SPEC · 현재 `app/src`(domain·data·routes·fixtures·Icon) · QA-V2-FINAL · BUNDLE-01 | 완료 | 원본 문장은 데이터로만 읽음 |
| 2 | 대비 계산 스크립트 `contrast_calc_2a04.py` — 앱 `nearestCompliantColor` 알고리즘 이식(0.1%p, 어두운 쪽 우선) | 완료 | v2 `darken_to`(0.5%·4.6)와 다름 — Developer 테스트 기대값과 맞추려고 앱 알고리즘을 옮김 |
| 3 | SPEC 뼈대 커밋 | 완료 | `bdc6de4` |
| 4 | SPEC 본문(범위·흐름·상태·화면·3안·반응형·데이터 계약·번들·단계·AC·질문·목업 차이) | 완료 | 1~5절 `19f6c2d`, 6~11절 `df783bb`. 상태 24 · AC 37 · 질문 9 · 목업 차이 17 |
| 5 | 최종 커밋·요약 | 완료 | 해시는 최종 응답과 `git log -1 -- docs/design/2a-04/SPEC.md`로 확인 |

## 목업과 다르게 한 부분 (ADR-003 한 줄 사유) — SPEC 11절에 표로 상세
- h1을 프로필로, 3안은 h2 — 제목 구조(M-01)
- "다시 생성" 없음 — 결정성(FR-GEN-03), 재시도는 실패 때만(M-02)
- 슬라이더 → 라디오 그룹 + 보이는 값 + 범위 밖 이유(M-03, Q2)
- 현재 버전 점 색 → "현재" 글자, 선택 안 → "선택됨" 글자(M-04·M-08, C-12)
- 시각 방향 FilterChip → 비대화형 Tag(M-05, v2 C-11)
- 대비 안내 hex 한 줄 → 역할·수치·전후 견본·적용·충돌(M-07)
- 썸네일 hex 하드코딩 → 프로필 토큰, "구조 미리보기" 캡션(M-09)
- A안 미리 선택 없음, 편집 시작 버튼이 선택을 따름(M-10)
- 생성 로그 버튼 → 안마다 3줄 + 펼침, `file`·`refresh` 아이콘 안 씀(M-11, P-B3)
- "프로필로 돌아가기" 삭제 — 한 화면(M-12)
- 결정성 캡션에 버전·생성기·해시 추가(M-13), 상태 24개 추가(M-14), 굵기 700(M-15), 5폭(M-16), 사이트 목적(M-17)

## 로그
- 2026-09-26 읽기 완료. 발견: (1) 보드 `confirmLabel`은 `confirmed.version + 1`, 메모리 저장소 `nextVersion`은 `max + 1` — 프로필 화면이 새 버전을 만들면 두 값이 어긋남 (2) 저장소가 메모리뿐이라 `/profile/:id` 새로고침·직접 진입은 항상 "없음" (3) ref-b 금색 ink는 흰 면 2.2 미달인데 어둡게 보정하면 다크 카드 C-3이 7.3 → 2.8로 깨짐 — 역할 하나로 풀 수 없는 경우
- 2026-09-26 SPEC 본문 완료. 픽스처 spacing grid가 "8pt"라 3.1 예시 문구 정정. 라우트 포커스 규칙이 앱에 없음을 확인(`useRouteScroll` 스크롤만) — 5.2에 반영
- 2026-09-26 advisor 점검 반영: (1) 저장소 공유 = 팩토리 store + 컨텍스트(싱글턴이면 `profile-1` 단언 4곳이 깨짐), 공통 청크 비용을 0이 아닌 실측 대상으로 정정(P-B2) (2) Q4에 "초안 = 저장값" 대가와 보드 캡션 보완 추가, 9절에 AC-24는 `base` 비교 행 추가 (3) 대비 스크립트를 앱 TS 원본과 대조 — 12건 동일(L1) (4) 강화 목표 문구·비활성 라디오 이유 위치·범위 주입·라이브러리 버전 고정 보완
- **Codex 검토는 실행하지 않았다.** 개발계획서 운영 규칙상 Codex 실행은 Jarvis 몫 — 다음 단계: `codex-companion review --scope branch --base 562c3a3`(설계 도전이면 adversarial-review)

## r1 — DS-2A-04r 개정 (브리프 `docs/06-handoff/DS-2A-04r_DESIGNER_BRIEF.md`, 턴 예산 40 · 32턴 넘으면 SPEC 먼저 커밋)

| # | 단계 | 상태 | 비고 |
|---|---|---|---|
| 1 | 브리프·Codex adversarial r0(`review/codex-adversarial-r0.txt`)·SPEC·스크립트 읽기, 코드 사실 확인(`compareBoard.ts:188·204`, `memoryCompareBoardRepository.ts:100~141`, `deferredCompareBoardRepository.ts:28~29`, `referenceComparisons.ts:43`) | 완료 | 원본 문장은 데이터로만 읽음 |
| 2 | 대비 스크립트에 C-3(어두운 카드 ink / primary) + 역할별 보정·충돌 절 추가 | 완료 | ref-b C-3 7.3 · 후보 `#7E622F` → 2.8(AA) · `#5B4722` → 1.8(강화) 재현 |
| 3 | TS 이식 대조 확장 | 완료 | 임시 디렉터리 + Node 22 타입 제거 실행. 기존 12건 + ref-b 강화 ink 1건 = **13건 일치**, 앱 `checkPaletteContrast(…, "dark")` **C-3 3건 일치**(원본 7.3 통과 · `#7E622F` 2.8 미달 · `#5B4722` 1.8 미달). `app/` 무변경 |
| 4 | SPEC r1 반영 | 완료 | Q1~Q9 → 10절 "결정", Q4=A 필드 단위 우선순위(6.1 겹침 판정 표 · P-S25 · `carryOverAdjustments`), 6.1 현재 사실/도입 위험 분리, `expectedLatest` 원자적 생성·`STALE_PROFILE`(P-S12 확장 · 6.2 · 6.3 · P-B2 · P-B9), 3.3 표 스크립트 값으로 재작성(강화 열 역할별 전부), AC P-AC-38~41 추가(총 41), 9절 확정 인자·패널 행 추가, M-18 |
| 5 | 커밋 | 완료 | 해시는 `git log -1 -- docs/design/2a-04/SPEC.md` |

- 수치 변경: r0 3.3 표의 기존 수치는 스크립트와 모두 같았다. 강화 열에 빠져 있던 값(ref-b ink 충돌 `#5B4722`·muted `#5D5853`, ref-c muted `#385893`, ref-d `#006550`·`#1E6353`, ref-e muted `#565960`, ref-f `#844B00`·`#735231`)을 스크립트 출력으로 채웠다.
- 되돌리기 뒤 재확정의 비교 기준: 최신 버전 base 기준을 검토했으나, 되돌리기 뒤 Hero만 바꿔도 모션 조정이 지워지고 "보드에서 모션을 바꿨습니다"라는 거짓 문장이 떠서 기각 — 브리프 문구대로 확정 버전 base(`ConfirmedRef.confirmedBase`). SPEC 6.1-3 · P-AC-39 ⑥. 남은 쟁점 없음.
- 정합성: 8.1 2a-04a에 P-S12(보드 확정·되돌리기) 명시, `STALE_PROFILE` 동봉 = 프로필 화면 쓰기 `ProfileSeries` / 보드 쓰기 `ProfileHead`로 통일.
- 목업 차이 추가: M-18 보드 초안 패널 이어받기 표시(1 기능, Q4=A).
- **r1 Codex 재검토는 실행하지 않았다**(Jarvis 몫). 다음: `codex-companion adversarial-review --scope branch --base d3dfdcd`.
