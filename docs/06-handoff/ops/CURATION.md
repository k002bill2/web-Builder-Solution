# M4 4.6 레퍼런스 큐레이션 원칙 — 운영 문서 초안

> GDWEB·dbcut 등 레퍼런스 사이트를 크롤링하지 마세요. 사람의 허용된 관찰을 추상 태그로 정리하되, 원본 화면·문구·이미지·URL은 생성 입력에 넣지 않습니다. GDWEB의 금지 근거는 저장소 기록이며, dbcut의 개별 약관·robots 상태는 이번에 검증하지 않았습니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:92-94] [출처: docs/design/m3p/SPEC.md:58-72]

## 목적·적용 범위

- 운영자용 초안입니다. 기준 저장소는 web-builder-solution main `df8694a6`, 출처는 저장소 루트 기준 상대 경로입니다. 외부 요청·리서치·크롤링은 하지 않았습니다.
- dbcut 등에도 크롤링 금지를 적용하는 것은 이번 운영 요청의 범위입니다. GDWEB과 같은 약관·robots 조항이 있다고 확대 인용하지 않습니다.
- 제품 방향은 제3자 선정작 갤러리가 아니라 자체 섹션·테마를 결정적으로 조립하는 빌더입니다. GDWEB은 분류 어휘·심사 관점 참고에만 사용하고 데이터·이미지를 가져오지 않습니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:24]
- 수동 큐레이션 정책과 M3′ 조합 생성기는 구분합니다. 전자는 사람 관찰→추상화→백지 디자인이고, 후자는 저장소 내부 추상 데이터만 쓰며 외부 관찰 데이터 사용·관리자 큐레이션 화면은 비목표입니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:93] [출처: docs/design/m3p/SPEC.md:48-52]

## 허용·금지 표

| 구분 | 허용 | 금지·경계 |
|---|---|---|
| 접근 | 외부 요청 전 약관·robots를 확인하는 운영 정책을 따릅니다. 사람 관찰도 접근 제한을 우회하는 수단이 아닙니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:141] | 자동 수집·UA 위장으로 우회하지 않습니다. GDWEB 자동 수집 금지는 robots `Disallow: /`·약관 제13조 3항에 근거한다는 저장소 기록입니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:92,141] |
| 관찰·추상화 | 사람이 브라우저로 관찰한 공통 구조를 사내 어휘로 기록하고 백지에서 디자인합니다. 한 섹션 채택은 서로 다른 3개 이상 출처의 공통 패턴을 기준으로 합니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:93] | 한 사이트를 본떠 구현하거나 원본 태그 할당 데이터를 수집하지 않습니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:92-93] |
| 보관 | 제작 provenance와 접근 통제 조사 원장을 분리합니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:94] | 외부 이미지·HTML·캡처는 어느 저장소에도 보관하지 않습니다. 자동 캡처 저장도 금지입니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:92,94] |
| 생성 입력 | 내부 태그·섹션 변형·팔레트 표·프로필 축만 사용합니다. [출처: docs/design/m3p/SPEC.md:48,58-70] | 원본 화면·문구·이미지·URL·실존 상호를 입력·출력에 넣지 않습니다. 외부 사이트 색 추출도 하지 않습니다. [출처: docs/design/m3p/SPEC.md:68,72] |
| 사용자 기능 | 자체 프리셋 간 대체안 추천은 차용 가능한 구조입니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:70] | ‘레퍼런스 URL 입력 → 비슷하게 만들기’는 영구 제외입니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:69] |
| 카탈로그 | MVP는 자체 제작 `internal`·권리자 허락 `licensed`만이라는 정책입니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:170] | 권리 허락분 노출 정책을 외부 화면의 생성 입력 허가로 바꾸지 않습니다. 외부 URL 스크린샷 수집도 MVP 제외입니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:170] |
| 품질·점수 | 신규 섹션은 구조·색상·카피의 내부 유사도 검사를 거칩니다. 측정값이 없으면 ‘미측정’입니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:95] [출처: docs/design/m3p/SPEC.md:83] | 관찰 인상으로 접근성·성능 점수를 만들지 않습니다. [출처: docs/design/m3p/SPEC.md:83] |

## 입력 형식 — 세 묶음을 섞지 마세요

아래는 운영 인계용 작성 틀입니다. 실제 앱 업로드 API·JSON 스키마를 새로 정의하는 것이 아닙니다. 값은 기존 저장소 어휘에 맞추고, 관찰 원문을 생성기에 직접 전달하지 않습니다. [출처: docs/design/m3p/SPEC.md:48,58-72]

### 1. 생성 입력: 추상 태그·내부 라이브러리 참조만

| 필드 묶음 | 입력 형식·허용 범위 | 근거 |
|---|---|---|
| 업종·목적·타깃 | 업종은 기존 `IndustryId` 대상 5종(cafe-fnb·medical·education·professional·beauty), 목적은 booking·inquiry·sales 중 업종별 허용값, 타깃은 기존 `AudienceId` | [출처: docs/design/m3p/SPEC.md:62-64] |
| 콘셉트·레이아웃 | 기존 `VisualTagId` 중 2개, `LayoutTypeId`의 hero 6종 중 허용값 | [출처: docs/design/m3p/SPEC.md:65-66] |
| 섹션 계획 | 목적별 내부 뼈대 템플릿·기존 섹션 라이브러리 변형 식별자 | [출처: docs/design/m3p/SPEC.md:67] |
| 팔레트·글꼴 | internal 팔레트의 primary·surface·ink·muted·bg 역할, 허용 글꼴 목록 안의 값 | [출처: docs/design/m3p/SPEC.md:68,70] |
| 카드·간격·비율·모션 | 기존 `KitCardStyle`, comfortable/compact, 기존 mediaRatio, low/mid 범위 | [출처: docs/design/m3p/SPEC.md:69] |

운영 인계 예시(스키마 아님):

    업종: cafe-fnb
    목적: booking
    타깃: <저장소 AudienceId 허용값>
    콘셉트: <저장소 VisualTagId 허용값 2개>
    hero 레이아웃: split
    섹션 계획: <내부 템플릿·섹션 변형 ID>
    팔레트: <internal 팔레트 표 항목>
    글꼴·카드·간격·비율·모션: <기존 허용값>

예시의 cafe-fnb·booking·split은 SPEC에 있는 값이며, 유효한 전체 조합은 업종별 허용 표 확인 후 확정합니다. 빈 자리를 외부 사이트 원문·URL로 채우지 마세요. [출처: docs/design/m3p/SPEC.md:62-72]

### 2. 생산 객체 provenance: 최소 제작 정보

| 필드 | 기록 내용 |
|---|---|
| 제작자 | 내부 제작자 식별 정보 |
| 일시 | 내부 제작 일시 |
| 추상 패턴 ID | 사내에서 정한 추상 패턴 식별자 |

위 3개가 생산 객체 provenance의 기록 범위입니다. 관찰 URL·외부 자료는 여기 넣지 않습니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:94]

### 3. 접근 통제 조사 원장: 관찰·승인 이력

| 필드 | 기록 내용 |
|---|---|
| 관찰 URL·관찰일 | 허용된 사람 관찰의 출처와 날짜. 생성 입력과 분리합니다. |
| 약관·robots 확인 | 접근 허용 여부를 확인한 기록. 제한을 우회하지 않습니다. |
| 추상화 메모 | 원문 복사 대신 사내 어휘로 적은 공통 구조 |
| 승인자 | 채택 승인 이력 |

이 원장의 필드는 정책상 요구이며, 외부 이미지·HTML·캡처 첨부는 허용되지 않습니다. 운영자는 채택 시 서로 다른 3개 이상 출처 근거를 확인합니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:93-94]

## 접수·검토 순서 — 운영 권고

1. 요청에 외부 URL·캡처·원문이 생성 입력으로 섞였으면 생성 인계를 멈추고 추상 태그로 다시 작성하게 합니다. [출처: docs/design/m3p/SPEC.md:72]
2. 수동 큐레이션의 관찰·승인 이력은 조사 원장에만 분리하고 생산 객체에는 최소 provenance만 남깁니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:94]
3. 신규 섹션이면 3개 이상 출처의 공통 패턴과 유사도 검사를 확인한 뒤 내부 라이브러리 채택을 검토합니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:93-95]
4. 생성기에는 내부 허용값만 전달하고 미측정 점수는 만들지 않습니다. [출처: docs/design/m3p/SPEC.md:58-72,83]

## 검증 상태·확인 필요·Jarvis 조치

- TDD는 FR-CAT-05 큐레이션·회수에 `T-API-CAT-05`(curator 회수 시 참조 프로필 수 반환)·`T-SEC-ROLE-01`을 매핑합니다. 이 계획만으로 관리자 기능 구현·테스트 실행 완료를 주장하지 않습니다. M3′ SPEC도 관리자 큐레이션 화면을 비목표로 둡니다. [출처: docs/05-tdd/TDD.md:71] [출처: docs/design/m3p/SPEC.md:52]
- [확인 필요] dbcut의 개별 약관·robots 조항과 현재 GDWEB 정책 상태는 이번 읽기 전용 작업에서 재검증하지 않았습니다. 크롤링 금지는 유지하고, 새 관찰 접근이 필요할 때 허용 여부를 별도 확인하세요. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:92,141]
- [확인 필요] 조사 원장의 실제 운영 위치·접근 권한·승인 담당자는 인용한 정책 문장만으로 확인되지 않습니다. 원장이 이미 구축돼 있다고 안내하지 말고 Jarvis가 운영 책임을 지정하도록 합니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:94]
- Jarvis 검토 권고: 추상 태그 입력·생산 provenance·조사 원장의 경계를 유지해 승인하고, 이 초안을 외부 수집 허가나 법률 의견으로 사용하지 마세요. 원문도 법리의 사안 적용은 추정·법무 검토 필요로 구분합니다. [출처: docs/01-synthesis/DISCUSSION_SYNTHESIS.md:97]
