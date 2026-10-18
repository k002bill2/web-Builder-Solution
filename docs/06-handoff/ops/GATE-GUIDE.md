# M4 4.6 게이트 해석 가이드 — 운영 문서 초안

> 차단부터 해소하고, 경고는 내용을 확인한 뒤 내보내세요. ‘통과’여도 성능 검증 완료를 뜻하지 않습니다. 성능 예산은 항상 ‘측정 전’입니다. [출처: docs/design/2a-05/SPEC.md:356-370]

## 적용 범위와 읽는 순서

- 운영자용 초안입니다. 기준 저장소는 web-builder-solution main `df8694a6`이며, 아래 출처는 저장소 루트 기준 상대 경로입니다. 이번 작업은 문서·코드 읽기만 수행했으며 브라우저 재검증은 하지 않았습니다.
- 현재 이름은 ‘대비 AA → 대체텍스트 → 헤딩 순서 → 필수 섹션 → 모션 예산 → SEO 메타 → 글자 수 → 성능 예산’ 8줄입니다. `gateCheck.ts`는 실제 계산 함수 `runGate`를 재수출합니다. [출처: app/src/features/studio/gateView.ts:10-19] [출처: app/src/features/studio/gateCheck.ts:1-2]
- 링크 9번째 줄은 설계에 있으나 M4-a-2b로 이월됐습니다. 현재 8줄에 링크 검사가 보인다고 안내하지 마세요. 링크 방어는 생성기 검사와 구분합니다. [출처: docs/design/m4a/EXPORT-SPEC.md:209-216] [출처: dev/active/m4a-qa/QA-REPORT.md:57]

## 상태 해석

| 표시 | 의미 | 운영자가 할 일 |
|---|---|---|
| 차단 N | 차단 이슈가 있어 사이트 내보내기 버튼이 막힙니다. N은 문제 줄 수가 아니라 이슈 수입니다. [출처: app/src/features/studio/gateView.ts:21-27,46-51] | ‘첫 차단으로 이동’으로 원인부터 고칩니다. [출처: docs/design/2a-05/SPEC.md:366] |
| 경고 N | 경고만 있으면 확인 대화상자를 거쳐 내보낼 수 있습니다. [출처: docs/design/2a-05/SPEC.md:369] | 내용을 검토한 뒤 ‘경고를 확인했습니다 · 내보내기’ 또는 ‘취소’를 선택합니다. [출처: docs/design/2a-05/SPEC.md:369] |
| 통과 | 집계된 차단·경고가 0입니다. 성능 측정 완료라는 뜻은 아닙니다. [출처: app/src/features/studio/gateView.ts:29-40] [출처: app/src/engine/gate/runGate.ts:27] | 다음으로 구조 미리보기 차단과 저장 상태를 봅니다. [출처: docs/design/2a-05/SPEC.md:367,370] |
| 측정 전 | 성능 예산 줄은 판정하지 않으며 차단·경고가 없습니다. [출처: docs/design/2a-05/SPEC.md:356] | 실측 수치나 성능 보장으로 바꿔 설명하지 않습니다. |
| 편집 전 기준 | 결과 해시가 현재 문서와 다른 상태입니다. 내보내기 때 오래된 결과는 먼저 재계산합니다. [출처: docs/design/2a-05/SPEC.md:362,370] | 편집 직후 예전 결과로 확정 안내하지 말고 재계산 결과를 확인합니다. |

## 8줄별 해석·문구·조치

표의 따옴표는 코드에 있는 사용자 문구 또는 문구 틀입니다. 중괄호는 실제 값으로 채워지는 자리입니다. [출처: app/src/engine/gate/gateText.ts:16-55,65-70]

| 줄 | 무엇을 보는지·판정 | 사용자 문구 | 운영자가 할 일 |
|---|---|---|---|
| 1. 대비 AA | 문서 테마 C-1~C-5 색 조합을 검사합니다. 목표 미달·색 해석 불가는 차단입니다. 목표는 일반/강화 설정에 따릅니다. [출처: app/src/engine/gate/contrastRow.ts:19-39] | ‘{검사} {조합} 대비 {비율} — 목표 {목표} 미달’, ‘색 값을 읽을 수 없습니다’, ‘프로필에서 보정’. [출처: app/src/engine/gate/gateText.ts:20,30,54] | 테마 영역에서 통과 버전으로 바꾸거나 프로필에서 보정합니다. [출처: docs/design/2a-05/SPEC.md:349] |
| 2. 대체텍스트 | 켜져 있고 실제 이미지 ID가 있으며 장식이 아닌 슬롯의 alt 빈 값을 차단합니다. 이미지 없는 자체 색 그래픽은 대상 밖입니다. [출처: app/src/engine/gate/slotRows.ts:34-43] | ‘대체텍스트가 없습니다’, ‘대체텍스트를 적거나 장식 이미지로 표시하세요’. [출처: app/src/engine/gate/gateText.ts:31-32] | 해당 이미지 필드로 이동해 설명을 입력합니다. 장식 표시는 실제 장식 이미지에만 적용하도록 검토합니다. [출처: docs/design/2a-05/SPEC.md:350] |
| 3. 헤딩 순서 | 섹션 정의의 제목 수준을 문서 순서로 봅니다. h1 부재·중복, 첫 제목이 h1 아님, 2단계 이상 깊어지는 건너뛰기는 차단입니다. [출처: app/src/engine/gate/docRows.ts:14-30] | ‘h1이 없습니다 — Hero가 페이지의 h1입니다’, ‘h1이 둘 이상입니다 — h1은 하나만 둡니다’, ‘헤딩 수준을 건너뜁니다 (h{앞}→h{뒤})’. [출처: app/src/engine/gate/gateText.ts:33-35,52] | 문제 섹션으로 이동해 Hero를 첫 본문에 두고 중복·순서를 바로잡습니다. h4→h2처럼 숫자가 작아지는 이동 자체를 차단으로 오해하지 마세요. [출처: app/src/engine/gate/docRows.ts:25-28] [출처: app/src/engine/gate/gateText.ts:34] |
| 4. 필수 섹션 | Header 1개·본문 5~9개·Footer 1개, Hero 첫 본문, 목적 필수 섹션과 뒤쪽 위치, Footer 사업자정보 위반을 차단합니다. [출처: docs/design/2a-05/SPEC.md:352] | ‘사업자정보가 있는 Footer가 필요합니다 (R-12)’, ‘본문 섹션이 {n}개입니다 — 5개 이상이어야 합니다 (R-01)’. [출처: app/src/engine/gate/gateText.ts:24,50] | 문제 섹션을 이동·교체하거나 ‘섹션 추가’로 빠진 섹션을 넣습니다. [출처: docs/design/2a-05/SPEC.md:352] |
| 5. 모션 예산 | 섹션 인스턴스의 모션 값 기준입니다. L2는 문서 순서 4번째부터 차단, L3 등 허용 범위 밖 값은 1개도 차단합니다. [출처: app/src/engine/gate/docRows.ts:10-12,33-40] | ‘모션 L3은 쓸 수 없습니다 (R-07)’, ‘L2 모션 섹션이 {n}번째입니다 — 3개까지입니다 (R-07)’. [출처: app/src/engine/gate/gateText.ts:47,53] | 문제 섹션의 모션을 낮추는 경로를 사용합니다. 테마만 바꿔도 기존 섹션 모션이 바뀐다고 안내하지 마세요. [출처: app/src/engine/gate/gateText.ts:48] [출처: docs/design/editor-rest/SPEC.md:88] |
| 6. SEO 메타 | 제목·설명 빈 값은 차단, 권장 길이(제목 60자·설명 160자) 초과는 경고입니다. 코드 주석은 이 길이를 관행 값으로 구분합니다. [출처: app/src/engine/gate/docRows.ts:44-57] | ‘제목 없음’, ‘설명 없음’, ‘“페이지 정보”에서 제목과 설명을 입력하세요’. [출처: app/src/engine/gate/gateText.ts:26-29] | 페이지 정보에서 빈 값을 채우고 긴 문장은 줄입니다. 검색 순위 보장 수치로 설명하지 않습니다. [출처: app/src/engine/gate/docRows.ts:50-57] |
| 7. 글자 수 | 필수 글자 슬롯 빈 값·슬롯별 최대 길이 초과는 차단, 권장 길이 초과는 경고입니다. 실제 이미지 alt의 최대 길이 초과도 이 줄에 들어갑니다. [출처: app/src/engine/gate/slotRows.ts:38-55] | ‘필수 입력입니다’, ‘상한 {max}자를 {초과}자 넘었습니다 — 내보내기를 막습니다 (R-13)’, ‘{대상}이/가 권장 {권장}자를 넘었습니다 ({현재}/{권장}자)’. [출처: app/src/engine/gate/gateText.ts:22,65-70] | 문제 필드로 이동해 필수 값을 채우거나 표시된 상한 이하로 줄입니다. 모든 슬롯에 같은 상한을 적용하지 않습니다. [출처: app/src/engine/gate/slotRows.ts:30-31,46-54] |
| 8. 성능 예산 | 현재는 항상 unmeasured이며 이슈가 없습니다. [출처: app/src/engine/gate/runGate.ts:27] | ‘측정 전’, ‘생성기 연결 후 측정합니다’. [출처: app/src/features/studio/gateView.ts:35-40] [출처: app/src/engine/gate/gateText.ts:17-18] | 이동 버튼이 아니며 고칠 차단도 없습니다. 생성기가 구현됐더라도 이 줄은 아직 측정하지 않는다는 점을 안내합니다. [출처: docs/design/2a-05/SPEC.md:356] [출처: app/src/engine/gate/runGate.ts:27] |

## 내보내기 직전 운영 점검

1. 게이트 차단을 먼저 해소합니다. 구조 미리보기 섹션이 남으면 게이트가 통과해도 사이트 내보내기는 막힙니다. 실제 렌더가 있는 변형으로 바꾸거나 지우라는 이유 문구를 확인하세요. [출처: app/src/features/studio/gateView.ts:54-62]
2. 형식은 ‘정적 사이트(zip) 내보내기’가 위, ‘HTML 파일 1개 내보내기’가 아래입니다. React zip 버튼은 제외됐고 PNG는 별도입니다. [출처: docs/design/m4a/EXPORT-SPEC.md:314] [출처: dev/active/m4a-qa/QA-REPORT.md:217-218]
3. PNG는 사이트가 아니라 시안 이미지이며 사이트 게이트를 적용하지 않습니다. PNG 성공을 사이트 내보내기 통과로 기록하지 마세요. [출처: docs/design/m4a/EXPORT-SPEC.md:43-47]
4. 저장 실패·다른 탭 문제는 INCIDENT.md의 저장 대응을 먼저 적용합니다. 내보내기는 미저장 변경을 먼저 저장하는 흐름입니다. [출처: docs/design/2a-05/SPEC.md:370]

## 검증 상태·편집 판단

- 위 문구는 코드와 명세에서 확인한 내용이며, 이번 작업에서 UI를 직접 관측한 결과는 아닙니다. SPEC의 과거 버튼명 대신 M4-a 결정·QA 기록의 현재 버튼명을 사용했습니다. [출처: docs/design/2a-05/SPEC.md:365] [출처: dev/active/m4a-qa/QA-REPORT.md:154-155]
- Jarvis 검토 권고: 성능 ‘측정 전’과 링크 줄 이월을 유지하고, 초안을 최종 발행본과 구분해 승인하세요.
