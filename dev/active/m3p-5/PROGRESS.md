# M3P-5 PROGRESS

base `45e4c1e` · 브랜치 `k002bill2/m3p-5` · 서브에이전트 0(브리프)

## 체크리스트
- [x] BRIEF P0 커밋 (e32986f)
- [x] 원인 조사 — B-M3P-01 · B-M3P-02
- [x] TDD 예측 기록 → RED 확인(5 실패, 예측 일치 · 커밋 안 함)
- [x] B-M3P-01 썸네일 문구 주입 (`src/thumbs/referenceDoc.ts` + thumbs 전용 문구 표)
- [x] B-M3P-02 생성기 상세 섹션 정합 + 생성 스크립트 재생성 · `--check`
- [x] typecheck · lint · build(21장·가드·버전 8d7310f2) · 번들 멈춤선 안(/catalog 100.06 · /studio 128.67)
- [x] 전체 vitest 1회 exit0 (249 files · 2190 tests)
- [x] Ego Lite 캡처 (catalog 1280 1~2장 · gen-beauty-1 상세 1장) + 정리(finish·listTaskSpaces=[]·서버 종료)
- [x] Codex review --scope branch --base 45e4c1e — 1라운드 지적 0
- [x] REPORT.md (Codex 결과 반영 완료)

## 원인 (조사 결과)
- B-M3P-01: `writeStartDoc` → `withSampleCopy`가 모든 텍스트 슬롯을 `SAMPLE_COPY`(업종 무관 고정)로 채움 → 21장 h1 동일.
- B-M3P-02(a): `internalCompose.ts` build()의 `detail.sections`가 **구조안 변형**(about/team-grid-3)을 그대로 씀. 렌더(썸네일·편집기)는 `mapVariant` 뒤 **엔진 변형**(about/story = "이야기 + 이미지")을 그림.
- B-M3P-02(b): 같은 곳에서 `plan.filter((s) => s.type !== "footer")` → 상세 7개, 계획·렌더 8개.
- 큐레이션 기존 규칙: ref-b~f 상세 `sections`에 Footer 포함(계획의 footer와 1:1), ref-a만 목업 1a-02대로 8개(Footer 없음, 계획 9개). → 생성기도 Footer 포함으로 맞춤.
- 큐레이션에도 같은 불일치(기록만, 픽스처 바이트 변경 0): 변형 이름이 렌더와 다름(ref-a About split→story, Testimonials carousel→quotes-2 등 6개 전부), ref-a Footer 없음, ref-c~f 섹션 이름이 자유 표기(Doctors·Classes 등).
- 상세 와이어(`ReferencePreview`)는 섹션 계획과 무관한 공통 와이어(카드 3칸, SPEC 4.3 MQ-M3P-6 A 유지) — 이번에 바꾸지 않음.

## TDD 예측
- T1 `src/thumbs/thumbCopy.test.ts`: 21장 hero h1 고유 수 = 21(≥ 업종 6) · 같은 업종 안 h1·부제 서로 다름 · 섹션 제목이 업종별로 다름 · 모든 문구 ≤ 엔진 권장 글자 수 · URL·마크업 0 · SVG에 h1 문구 포함 → **RED 예측**: 지금 h1 1종(21/21 동일)이라 실패.
- T2 `internalCompose.test.ts`: 생성 상세 `sections` ↔ 계획 1:1(길이 = 계획 길이 8, Footer 포함), 변형 = `mapVariant(type, variant)` → **RED 예측**: 길이 7 ≠ 8, gen-beauty-1 About team-grid-3 ≠ story.
- 기존 G1(픽스처 = 재실행)은 재생성 후 GREEN 유지 예측. G5(큐레이션 해시) GREEN 유지.
