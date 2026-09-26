# L4b 엔진 — `runGate` + `createDocFromCandidate` REPORT

브리프 `docs/06-handoff/L4B-ENGINE_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/l4-engine-b` · 기준 `9c1891a` · 수정 범위 `app/src/engine/` · `dev/active/l4-engine-b/`만

## 1. 커밋

| 커밋 | 내용 |
|---|---|
| `1ed3e5c` | test: 게이트 테스트 도우미(`testing/sampleTheme.ts`·`testing/gateKit.ts`) · 번들 기준(`bundle-before.txt`) · RED 기록 |
| `46b20ed` | feat: `gate/`(runGate 8줄) · `doc/`(createDocFromCandidate) · `GateIssue.severity` · `pending.ts` 자리 정리 · `minMotion` export · sampleTheme 타입 오류 수정 |
| `9363839` | REPORT 초안 |
| `2b5bcdd` | REPORT 7·8절 · 검증 로그 |

- 주의(이분 탐색): `1ed3e5c` 단독 체크아웃은 typecheck 실패(sampleTheme `ColorTokens` 단언 오류) — 수정은 `46b20ed`에 있다. 로컬 전용이라 히스토리는 고치지 않았다.

## 2. RED / GREEN (원문 `tdd-log.txt`)

| 단계 | 결과 |
|---|---|
| RED | 새 테스트 4파일(`gate/gateText.test.ts`·`gate/runGate.test.ts`·`gate/docRows.test.ts`·`doc/createDocFromCandidate.test.ts`) — 구현 모듈 없음으로 4파일 실패 |
| GREEN | 4파일 69 통과 · typecheck 0 · eslint 0 |
| 변이 1 | 후반 1/3 경계 `ceil → floor` → "본문 7 … index 3 block" 1건 실패(테스트가 잡음) → 복원 |
| 변이 2 | 게이트가 `proposeCorrections`(보정 제안)를 부르게 바꿈 → 7:1 불가 조합 테스트가 `대비 7:1을 만들 수 없습니다: #2C2C2C / #8B5E3C` throw로 실패 → 복원 |

## 3. 파일 (engine 밖 제품 코드 변경 0)

- 새 파일: `gate/runGate.ts` · `gate/contrastRow.ts` · `gate/requiredSections.ts` · `gate/slotRows.ts` · `gate/docRows.ts` · `gate/issue.ts` · `gate/gateText.ts` · `doc/createDocFromCandidate.ts` · 테스트 4 · `testing/sampleTheme.ts` · `testing/gateKit.ts`
- 바꾼 파일: `contracts/records.ts`(`GateIssue.severity` 추가 — Q-19) · `contracts/pending.ts`(구현된 두 타입 자리 삭제, `GateTheme`만) · `ops/sectionOps.ts`(`minMotion` export만 — 동작 무변경)
- L4a 동작 변경 0: 기존 engine 테스트 184건 그대로 통과(7절).

## 4. 테스트 이름

- `gate/runGate.test.ts` — 8줄 · GATE_ROWS 순서 · docHash = hashDoc(doc) · docRevision / 통과 문서 — 성능 외 7줄 pass · 이슈 0 / 성능 예산 줄은 어떤 문서든 unmeasured · 이슈 0 (Q13 '측정 전') / 결정성 — 키 순서를 뒤집은 같은 문서·테마 → 같은 report / 입력 불변 — 동결 입력으로 throw 0 · 입력 내용 그대로 · 결과는 동결 / 시각·난수를 읽지 않는다 (Date.now · Math.random 호출 0) / 대비: pass — 모든 검사 통과 팔레트 · block — 카페 팔레트 AA: C-5 muted/bg 3.8:1 미달 1건, 대체안 '프로필에서 보정' · **7:1 불가 조합(QA D-2A4B2-01: #8B5E3C primary + 어두운 카드 + 강화) — 보정 함수는 throw, 게이트는 throw 0 · 대비 줄 block** · 적용 값 = effectiveProfile(base + 보정) — muted 보정이 들어간 버전은 pass · 어두운 카드일 때만 C-3을 본다 · 색 값이 #RRGGBB가 아니면 throw 없이 block
- `gate/docRows.test.ts` — 대체텍스트(block 빈 alt마다 1건 · 공백도 빈 값 · pass 장식/꺼짐/있음) / 헤딩(pass · Hero 없음 = h1 없음 · 본문이 Hero보다 먼저 · h1 둘) / 필수 섹션(pass · R-01 Header 없음·Footer 없음·본문 4·5·9·10·Footer 둘 · R-01 Header/Footer 위치 · R-02 Hero 없음·첫 본문 아님·둘 · R-03 본문 6 경계(index 4 pass · 3 block) · 본문 7 경계 · 문의 섹션 없음/cta-band로 충족 · 목적이 문의 아님 · R-04 · R-12 · 모르는 변형) / 모션(L2 3 pass · L2 4 block · L3 block) / SEO(pass 60·160자 · 빈 값 block · 권장 초과 warn · block이 warn보다 앞섬) / 글자 수(상한 초과 block · 필수 빈 값·공백·키 없음 · 권장 초과 warn · 코드 포인트 · block+warn 섞임 · 대체텍스트 상한)
- `gate/gateText.test.ts` — SPEC 따옴표 문장 5건 원문 대조 · '설명 없음' 내보내기 이유 문장 속 원인 · 숫자 틀 3개를 SPEC 예시 숫자로 대조 · 유추 문장은 SPEC에 없다 · 조사 이/가
- `doc/createDocFromCandidate.test.ts` — 정상 구조안 → validatePageDoc 통과 · revision 1 · hash · 메타 빈 값 · 순서 / instanceId·기본 슬롯·모션·톤 / 두 번 → 같은 문서·해시·입력 불변·동결 / 해시는 updatedAt과 무관 / R-01 위반 8종 BAD_VALUE / R-02 위반 3종 BAD_VALUE / 모르는 변형·유형 UNKNOWN_VARIANT(구조 판정보다 먼저) / 프로필 버전·id·시각 모양 BAD_VALUE / 새 문서의 게이트

- 줄마다 pass/warn/block 충족 범위: SPEC 5.12 표에서 경고 칸이 "—"인 5줄(대비·대체텍스트·헤딩·필수 섹션·모션)은 경고 조건이 없어 **pass·block만** 테스트했다. **warn은 SEO 메타·글자 수 두 줄**에서 테스트했다. 성능 줄은 늘 unmeasured.

## 5. 규칙별 판정 방식 (줄 순서 = `GATE_ROWS`)

| 줄 | 규칙 | 판정 | 차단 | 경고 | 이슈 위치 |
|---|---|---|---|---|---|
| 대비 AA | R-08 | 테마 `profile`의 적용 값 `effectiveProfile(base, adjustments)` 팔레트 5역할 · 카드 톤 `component_choices.card_style.surfaceTone` · 목표 `adjustments.contrast`(없으면 aa)로 `checkProfileContrast`(C-1~C-5, C-3은 어두운 카드만) **판정만**. `proposeCorrections`/`nearestCompliantColor` 미호출 → 7:1 불가 조합 throw 0. 색이 `#RRGGBB`가 아니면 계산 전에 그 역할을 차단(throw 0) | 미달 1건 이상 | — | 없음(테마) |
| 대체텍스트 | R-09 | 켜진(`enabled`) · 장식 아님 이미지 슬롯의 `alt` 공백 제거 뒤 빈 값 | 1건 이상 | — | instanceId · slotKey |
| 헤딩 순서 | R-10 | 섹션 정의 `a11y.headingLevel`(null 제외)을 문서 순서로: h1 정확히 1개 · 앞 헤딩 +1 초과 = 건너뛰기(첫 헤딩 앞 = 0 → 첫 헤딩은 h1) | 위반 | — | 문제 섹션(h1 없음은 위치 없음) |
| 필수 섹션 | R-01·02·03·04·12 | R-01 header 1·맨 위 / footer 1·맨 아래 / 본문(Hero 포함) 5~9(`rules.ts` BODY_MIN·MAX) · R-02 Hero 1 · 첫 본문 · R-03(목적 inquiry) 본문 중 contact·cta-band가 1개 이상이고 **마지막 문의 섹션 index ≥ n − ⌈n/3⌉** · R-04(목적 booking) 예약 변형 1개 이상 · R-12 Footer 정의 `hasBusinessInfo` · 모르는 type/variant = R-01 차단 | 위반 | — | 문제 섹션(없는 섹션은 위치 없음) |
| 모션 예산 | R-07 | 인스턴스 `motion` 값: L2는 문서 순서 4번째부터 · L0~L2 밖(L3) 1개라도 | 위반 | — | 해당 섹션 |
| SEO 메타 | R-11 | `meta.title`·`meta.description` 공백 제거 뒤 빈 값 · 권장 60/160자(5.6) 초과. canonical 제외 | 빈 값 | 권장 초과 | slotKey = `title`/`description` |
| 글자 수 | R-13 · FR-EDT-05 | 섹션 정의 슬롯 스키마 순서로: 필수 + 빈 값(없는 키 포함) → 차단, 코드 포인트 길이 > `maxLength` → 차단, > `recommendedLength` → 경고(슬롯당 1건, 차단 우선). 이미지 슬롯은 켜짐·장식 아님일 때 대체텍스트 상한 | 상한 초과 · 필수 빈 값 | 권장 초과 | instanceId · slotKey |
| 성능 예산 | TRD 8 | 판정 안 함(Q13) — 늘 `unmeasured`, 이슈 0. 캡션 `GATE_TEXT.performanceNote` | — | — | — |

- 줄 상태 = 이슈 `severity`에서만: block 1건 이상 → block, 아니면 warn 1건 이상 → warn, 아니면 pass.
- 결정성: 섹션 순서 → 스키마 슬롯 순서로만 순회(값 객체 키 순서 무관), `Date.now`·`Math.random` 0, 결과 `deepFreeze`.
- 모르는 변형 섹션은 대체텍스트·헤딩·글자 수 줄에서 건너뛴다(필수 섹션 줄 차단 1건으로만).

## 6. 문장 — SPEC 원문 / 유추

### SPEC 원문 그대로 (`gateText.test.ts` 따옴표 포함 대조)
| 키 | 문장 | 출처 |
|---|---|---|
| performanceNote | "생성기 연결 후 측정합니다" | 5.12 |
| contrastAlternative | "프로필에서 보정" | 5.12 대체안 · 2a-04 4.4 |
| requiredEmpty | "필수 입력입니다" | 5.6 |
| footerBusinessInfo | "사업자정보가 있는 Footer가 필요합니다 (R-12)" | E-S14 (L4a Q-3의 미사용 문장 → 게이트 R-12 자리) |
| seoDescriptionEmpty | 설명 없음 | E-S23·5.13 "차단 1건(SEO 메타: 설명 없음) — 고치면 열립니다" 속 원인 |
| `overMax(40, 46)` | "상한 40자를 6자 넘었습니다 — 내보내기를 막습니다 (R-13)" | 5.6 (틀) |
| `overRecommended("3번 카드 제목", 34, 28)` | "3번 카드 제목이 권장 28자를 넘었습니다 (34/28자)" | 5.7 (틀, 조사 이/가 자동) |
| `recommendedNote(28)` | "권장 28자 — 넘으면 2줄이 될 수 있습니다" | 5.6 (틀) — 권장 초과 경고의 대체안 |
| 구조 원인 | `REASONS.removeHeader`·`removeFooter`·`removeHero`·`removeBooking`·`removeInquiry`·`moveHeader`·`moveFooter`·`moveHero`·`addHeaderOnce`·`addFooterOnce`·`addHeroOnce` | 5.2·5.4·5.3 (L4a `reasons.test.ts`가 대조 · 유추 4개는 L4a Q-3 그대로) |

### 유추 문장 (SPEC에 없음 — `INFERRED_GATE_TEXT`, 테스트가 "SPEC에 없다"를 단언)
| 키 | 문장 |
|---|---|
| seoTitleEmpty | 제목 없음 (설명 없음과 같은 꼴) |
| seoAlternative | “페이지 정보”에서 제목과 설명을 입력하세요 |
| contrastUnreadable | 색 값을 읽을 수 없습니다 (원인 앞에 역할 이름: "muted: …") |
| altMissing · altAlternative | 대체텍스트가 없습니다 (원인 앞 "Hero 대표 이미지: ") · 대체텍스트를 적거나 장식 이미지로 표시하세요 |
| headingNoH1 · headingExtraH1 · headingAlternative | h1이 없습니다 — Hero가 페이지의 h1입니다 · h1이 둘 이상입니다 — h1은 하나만 둡니다 · Hero를 첫 본문에 두고 다른 섹션은 그 뒤에 두세요 |
| inquiryNotLate · inquiryAlternative | 문의 섹션이 페이지 뒤쪽 1/3에 없습니다 (R-03) · Contact나 CTA Band를 페이지 뒤쪽으로 옮기세요 |
| addSectionAlternative · removeExtraAlternative | “섹션 추가”로 넣으세요 · 남는 섹션을 지우세요 |
| footerAlternative · fixedPositionAlternative · moveHeroAlternative | 사업자정보가 있는 Footer 변형으로 바꾸세요 · Header는 맨 위, Footer는 맨 아래에 두세요 · Hero 위에 있는 본문 섹션을 Hero 아래로 옮기세요 |
| bodyAddAlternative · bodyRemoveAlternative | “섹션 추가”로 본문을 5개 이상 만드세요 · 본문 섹션을 9개 이하로 지우세요 |
| unknownVariant · unknownVariantAlternative | 라이브러리에 없는 섹션 변형입니다 · 이 섹션을 지우고 라이브러리의 변형으로 다시 추가하세요 |
| motionL3 · motionAlternative | 모션 L3은 쓸 수 없습니다 (R-07) · 모션이 L1 이하인 변형으로 바꾸세요 |
| requiredAlternative | 내용을 입력하세요 |
| 틀 `bodyTooFew(n)` · `bodyTooMany(n)` | 본문 섹션이 4개입니다 — 5개 이상이어야 합니다 (R-01) · 본문 섹션이 10개입니다 — 9개까지입니다 (R-01) |
| 틀 `headingSkip(from, to)` | 첫 헤딩이 h2입니다 — h1이 먼저 와야 합니다 · 헤딩 수준을 건너뜁니다 (h1→h3) |
| 틀 `motionL2Over(n)` | L2 모션 섹션이 4번째입니다 — 3개까지입니다 (R-07) |
| 틀 `contrastFail` | C-5 보조 글자(muted / bg) 대비 3.8:1 — 목표 4.5:1 미달 (검사 이름은 2a-04 3.3 표) |
| 틀 `shortenTo(n)` | 40자 이하로 줄이세요 |
| 원인 앞머리 | 슬롯 이슈 원인 = "섹션 이름 슬롯 이름표: 문장"(예 "Hero 제목: 필수 입력입니다") · 권장 초과 = "Hero 제목이 권장 28자를 넘었습니다 (30/28자)" |

## 7. 검증 (fresh — 마지막 코드 `46b20ed`에서, `verify-*.txt`)

| 항목 | 명령 | 결과 |
|---|---|---|
| typecheck | `npm run typecheck` | exit 0 (`verify-typecheck.txt`) |
| lint | `npm run lint` | exit 0 (`verify-lint.txt`) |
| build + 번들 | `npm run build` → `bundle-before.txt`와 `dist/`·`[bundle]` 줄 diff | exit 0 · diff 0 (`bundle-after.txt`) |
| 전체 테스트 1회 | `npm test -- --run` | 80 파일 · 962 통과 · exit 0 (`verify-test-full.txt`) — `engineImportGuard.test.ts` 포함 |
| engine 3회 | `npx vitest run src/engine` × 3 | 매회 15 파일 · 253 통과 · exit 0 (`verify-engine-3x.txt`) — 기존 L4a 184 + 새 69 |

- 실행 횟수(사실대로): 전체 테스트는 정확히 1회. `npx vitest run src/engine`은 최종 3회 외에 개발 중 2회 더 돌았다(코드 커밋 직전 게이트 1회 · 테스트 이름 목록용 1회). gate·doc 파일 단위 실행은 TDD 중 여러 번.

## 8. Codex 리뷰 (`review --wait --scope branch --base 9c1891a`, 1회 — `codex-review.txt`)

- 대상: `46b20ed`까지 브랜치 diff(REPORT 초안 커밋 전 시작).
- 결과 원문: "변경된 게이트 규칙과 문서 생성 로직에서 확인된 결함은 없습니다. 테스트 실행은 읽기 전용 환경의 권한 오류로 중단되어 테스트 결과는 확인하지 못했습니다."
- 반영: 지적 0 → 코드 변경 없음. Codex 쪽 테스트 미실행은 7절 로컬 fresh 실행으로 보완했다(Codex가 테스트를 돌려 확인한 것은 아니다).

## 9. 번들 (`bundle-before.txt` · `bundle-after.txt`)

- 결과: `dist/` 모든 줄(자산 파일명 = 내용 해시, CSS `index-Bz-DRn5S.css` 포함)과 `[bundle]` 시나리오 줄 전부 **변화 0** (`diff` 출력 없음).
- 기준선 확인: 이전 실행이 만든 `bundle-before.txt`가 미커밋 `sampleTheme.ts` 뒤였을 수 있어, 그 파일을 치우고 다시 빌드 → CSS 해시 동일.
- **재발 1건(L4a Q-6)**: 첫 GREEN 빌드에서 CSS가 44.16 → 44.34KB로 바뀌고 모든 JS 해시가 따라 바뀌었다. 새 파일을 치운 빌드와 CSS를 규칙 단위로 비교 → `.ordinal{…font-variant-numeric…}` 한 줄 — `createDocFromCandidate.ts`의 매개변수 이름 `ordinal`을 Tailwind가 유틸리티로 잡았다. `nth`로 바꾼 뒤 변화 0. engine import 0이어도 **engine 소스 문자열이 CSS를 바꾸는 경로**가 여전히 열려 있다 → Q-24.
- 화면 engine import 0: `engineImportGuard.test.ts` 통과(7절 전체 테스트에 포함).

## 10. 새 문서의 게이트 결과 (브리프 1-3 — Q-8 현재 구현 유지, 기록만)

`createDocFromCandidate`(header·hero fullbleed-left·about story·services cards-3·services list·faq·contact form·footer biz-extended) + 목적 없음 · 좋은 팔레트:
- 대비 pass · **대체텍스트 block 2건**(hero-1 · about-1 — 기본 이미지 alt 빈 값, 장식 아님: L4a Q-8) · 헤딩 pass · 필수 섹션 pass(R-01·R-02 이슈 0) · 모션 pass · **SEO 메타 block 2건**(제목 없음 · 설명 없음 — 메타 빈 값) · 글자 수 pass(기본 글자는 모두 상한·권장 이내) · 성능 unmeasured.
- 즉 "편집 시작" 직후 문서는 늘 차단 상태로 열린다(대체텍스트 + 메타). 의도라면 그대로, 아니면 Q-8·Q-17에서 기본값을 정한다.

## 11. 남은 위험

1. 문의 목적 판정의 "후반 1/3" 기준(본문 = Hero 포함, 마지막 문의 섹션 기준)은 SPEC에 계산식이 없다 — Q-20.
2. 픽스처 구조안 변형 대부분(about/split · services/grid-3 · portfolio/masonry …)이 엔진 레지스트리에 없다 → 지금 픽스처로 `createDocFromCandidate`를 부르면 `UNKNOWN_VARIANT`. composer(2a-04c)가 엔진 변형으로 옮겨야 한다 — Q-21.
3. Tailwind 스캔 재발 경로(9절) — 가드가 없어 다음 engine 작업에서도 빌드 diff로만 잡힌다 — Q-24.
4. 목적 출처가 둘(`GateTheme.purpose` · `profile.adjustments.purpose`) — 부르는 쪽이 어긋나게 넘기면 게이트가 프로필과 다른 목적으로 판정한다 — Q-19.
5. R-12의 TRD 범위(개인정보처리방침 링크·폼 동의)는 SPEC 5.12대로 사업자정보만 본다. 폼 동의 문구는 contact `consent` 필수 슬롯이라 글자 수 줄(R-13 필수 빈 값)이 잡는다.

## 12. 설계 질문 (추측하지 않은 결정 · 현재 구현)

| # | 질문 | 현재 구현(추천) |
|---|---|---|
| Q-17 | **SPEC 개정 요청** — SPEC 8.3.1 끝 "8.2 `createDocFromCandidate` 이름·인자는 그대로다"와 현재 구현(세 번째 필수 인자)이 어긋난다. `(plan, profileVersion)` 두 인자로는 `validatePageDoc`가 요구하는 `projectId`·`libraryVersion`·`generatorVersion`·`updatedAt`을 만들 수 없다(`Date.now` 금지). 인자 모양을 어떻게 할지 | plan에 `libraryVersion`·`generatorVersion`(8.1 "만든 구조안의 것") 추가 · 세 번째 필수 인자 `DocStart { projectId, updatedAt }`(저장소 값). 해시는 updatedAt과 무관 |
| Q-18 | 새 문서 섹션 모션 — 인자에 모션 프리셋이 없다. composer 배정값을 plan에 실을지 | `min(L1, 정의 상한)`(addSection 규칙에서 프리셋 ≥ L1로 본 값) |
| Q-19 | ① `GateIssue`에 `severity`(block·warn)를 더하는 개정 — SEO 줄은 같은 R-11이 차단·경고 둘 다라 없으면 줄 상태·"차단 1 · 경고 1"을 셀 수 없다. ② 목적 출처 — `GateTheme.purpose`(L4a 계약)와 `profile.adjustments.purpose`가 겹친다. 하나로 줄일지 | ① 추가 ② `theme.purpose`만 읽음(부르는 쪽이 `adjustments.purpose ?? "none"`을 넘긴다) |
| Q-20 | R-03 "후반 1/3" 계산 — 기준(본문 = Hero 포함, header·footer 제외)·경계(index ≥ n − ⌈n/3⌉)·"문의 섹션 중 하나라도 후반이면 충족" 해석 | 그대로 |
| Q-21 | 픽스처 `sectionPlan` 변형이 엔진 레지스트리에 없다(about/split 등). composer가 엔진 변형으로 옮길지, 레지스트리에 변형을 더할지 | 엔진은 모르는 변형 거부(UNKNOWN_VARIANT) |
| Q-22 | 게이트가 모르는 type/variant 섹션을 만나면(저장 경계를 거치지 않은 문서) 어느 줄에서 알릴지 | 필수 섹션 줄 R-01 차단 1건 · 다른 줄은 건너뜀 |
| Q-23 | R-07 "섹션 정의 모션 값" — 인스턴스 `motion`인지, 정의 상한으로 깎은 값인지 | 인스턴스 `motion` 값(연산이 이미 정의 상한 이하로 둔다) |
| Q-24 | Tailwind가 engine 소스를 스캔해 식별자(`ordinal`)가 CSS를 바꾼 재발(L4a Q-6). `index.css` `@source not "./engine"`(engine 밖 수정) 또는 가드 테스트 중 무엇으로 막을지 | 이름만 바꿈(engine 밖 수정 금지) |
