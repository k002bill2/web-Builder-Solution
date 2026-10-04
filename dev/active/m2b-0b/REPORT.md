# M2B-0B REPORT — 본문 12변형 킷 명세 (Designer)

- 시작 커밋 `a3bd614` · 브랜치 `k002bill2/m2b-0b` · 로컬 커밋만(push·병합·삭제 0) · 서브에이전트 0
- 영환님 결정 ★A(React zip M4 · internal 조합 생성기 M2b 뒤) — 이 레인은 명세만이라 범위 영향 없음

## 1. 산출물
| 파일 | 내용 |
|---|---|
| `docs/design/m2b/SPEC-BODY.md` | 0절 상속(m2a 0절·K2·r4.12) + 본문 공통 규칙 5 · B1-1~12(C1 1~7 · 루브릭 표 8항) · 2 KD-AC-01~21 · 3 시각 QA QB-1~15(1280·768·390) · 4 예산 추정 · 5 MQ-B1~7 · 부록 A 대비 L2 · 부록 B 시안 3폭 실측 L2 |
| `docs/design/m2b/body/mock-body.html` | 12변형 시안(외부 자원 0 · 스크립트 0 · hex·px 0 — `rgb()`·`rem`) |
| `docs/design/m2b/body/contrast_mock.py` · `logs/contrast_mock.out.txt` | 시안 팔레트 C-1~C-5 (L2) |
| `docs/design/m2b/body/logs/mock-measure.out.json` | 3폭 실측(넘침·열 수·12자 수치·벽돌형 박스·booking 색) |
| `docs/design/m2b/body/logs/codex-adversarial-review.raw.txt` | Codex 적대적 검토 원문 |

## 2. 루브릭 요약 (TR-POL-04 · 12표 × 8항)
| 변형 | PASS | 주의 | 주의 내용 |
|---|---|---|---|
| about/text · services/list · cards-2 · testimonials · pricing | 8 | 0 | — |
| services/cards-masonry | 7 | 1 | ③ 단 배정이 브라우저마다 다를 수 있음(순서는 같음) |
| portfolio/grid-3 · grid-2 | 7 | 1 | ⑦ 이미지 없는 기본 = 같은 그라디언트 칸(자체 그래픽 본편 M2c) |
| portfolio/masonry | 6 | 2 | ③ 단 배정 · ⑦ 그라디언트 |
| statistics/stats-3 · cta-band/banner | 7 | 1 | ⑧ 픽스처에 해당 섹션 태그 없음(MQ-B7) |
| contact/booking | 7 | 1 | ① 보낼 수 없음(K2 A안 상속 — 안내로 알림) |
- 외부 이미지·문구·수치 0 · GDWEB·dbcut 접속 0 · APFS·`--apfs-*` 0(SPEC·시안 grep).

## 3. MQ (Jarvis 기록 요청 — 모두 비차단)
- **MQ-B1** services/list 줄바꿈 구분자 여부 → 권장 `·`만 + 편집기 도움말
- **MQ-B2** 본문 공통 규칙(0.2) 중 3폭 표를 m2a 0.6에 올릴지(0A와 공유)
- **MQ-B3** 로컬 이미지 원본 크기 메타데이터(벽돌형 원본 비율) → M2c
- **MQ-B4** 예약 섹션 사이트 주인용 편집 패널 문구(앱 화면 쪽)
- **MQ-B5** testimonials `cite` 미사용(WHATWG — 사람 이름은 `cite` 아님) → `figure > blockquote + figcaption`
- **MQ-B6** booking 날짜·시간 `type=text` → 연결(MQ-6) 때 `date`/`time` 결정에 합침
- **MQ-B7** statistics·cta-band 내부 레퍼런스 태그 근거 없음 → 카탈로그 보강 때

## 4. 예산 추정 (L3, 렌더 문서 gzip KB)
- 기준(L1): JS 80.12 / 멈춤선 89.70(여유 9.58) · CSS 6.32 / 30. M2a 본문 4변형 실측 JS +1.03 · CSS +0.72.
- 본문 12 합계(공유 반영): **JS ≈ +1.54 · CSS ≈ +0.75** → JS ≈ 81.7. 공유 없을 때 단순 곱 JS +3.12 · CSS +2.16.
- 공유: about/text = `AboutStory` · cards-2/masonry = `ServicesCards3` 매개변수 · portfolio 3변형 = 갤러리 1개 · booking = `ContactForm` 필드 설정.
- 같은 여유를 0A(바깥 11, 단순 곱 ≈ +2.9)·모션이 함께 씀 → 합 ≈ 86.1(L3). M2B-2 시제품 실측으로 고친다.

## 5. 다르게 한 곳 · 남은 위험
**다르게 한 곳(ADR-003 · 브리프 대비)**
- testimonials: 브리프 "`blockquote`·`cite`" → `cite` 요소를 쓰지 않음(WHATWG 정의: 작품 제목. 작성자는 `figcaption`).
- booking: 날짜·시간을 `type=text`로(선택기 안쪽 글자의 결정성·비활성 흐림을 킷이 보장할 수 없음). K2 방문자 문구를 예약용으로 바꾼 고정 문구 1개 추가.
- 갤러리: 목록(`ul`) 대신 `figure` 나열 — 기본 상태(그라디언트 3칸)가 빈 목록 항목으로 읽히지 않게.
- 벽돌형 단 수 = 2(1280도) — 3칸을 3단에 두면 grid-3과 구분되지 않음.
- 시각 근거: 목업에 본문 12변형 화면이 없어 구조·위계는 m2a 형제 변형과 일반 패턴 기준.

**남은 위험**
- **PNG 캡처 BLOCKED**: ego-browser `Page.captureScreenshot`이 CDP 타임아웃(4회 — 전체 페이지·뷰포트·raw CDP clip·bringToFront 뒤). 3폭 근거는 DOM 실측 로그(부록 B)로 대체. 시각 판정은 M2B-2 QA(QB-1~15)에서 실제 캡처로 해야 한다.
- 벽돌형 단 배정은 브라우저 균형 계산 — Firefox·Safari에서 Chromium과 다를 수 있음(순서·넘침은 같음). KD-AC는 배정을 단언하지 않는다.
- 예산은 L3 — 공유 구조가 구현에서 안 되면 단순 곱 쪽(+3.12)에 가까워진다.
- stats 12자 수치 한 줄은 픽스처 scale(1.25 시안 실측) 기준 — scale 1.5 이상이면 줄바꿈(넘침은 아님).
- 1280 grid-2 + `media_ratio 4:5`면 칸이 세로로 큼(QB-6에서 판정).

## 6. 서버
(마감 때 기록)

## 7. Codex 적대적 검토
(결과 반영 후 기록)
