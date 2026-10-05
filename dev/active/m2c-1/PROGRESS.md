# M2C-1 PROGRESS — 이미지 변환기(imageIngest)

- base `c870439` · 브랜치 `k002bill2/m2c-1` · 서브에이전트 0 · 쓰기 = `app/src/features/studio/images/ingest/**` + `dev/active/m2c-1/`

## 체크리스트
- [x] P0 BRIEF 명시 커밋
- [x] 의존성 설치(npm ci — lock 불변) · 기준 build(번들 기준값) 기록
- [x] 단계 1 형식 검사 V1~V4 (IMG-AC-01·02) — 예측 커밋 → RED → GREEN
- [x] 단계 2 헤더 파서 V5 + 알파 (IMG-AC-03·05 알파) — 예측 커밋 → RED → GREEN
- [x] 단계 3 폭 사다리·포맷 결정 (IMG-AC-04·05) — 예측 커밋 → RED → GREEN
- [x] 단계 4 ingestImage 조립 V6·인코딩·EXIF·방향·원본 미보관 (IMG-AC-03 스파이·06·07[U]·10) — 예측 커밋 → RED → GREEN
- [x] 번들 변화 0 확인(build 전후 비교)
- [x] typecheck · lint · build · 전체 vitest exit 0
- [x] Codex review --scope branch --base c870439 (≤2라운드)
- [x] REPORT.md (IMG-AC↔테스트 매핑 · meta · 한계)

## 로그
- 설치: `npm ci` exit 0 · `git status` lock 변경 0. 기준 build exit 0 → `logs/build-baseline.txt`(/studio 진입 127.36 · 렌더 JS 83.03) · dist 해시 93개 `logs/dist-baseline.sha256`.
- **단계 1 예측(RED 전)**: `fileType.test.ts` 새 테스트 **24개**. 스텁(null·false·"" 반환)에서 **13 실패 · 11 통과**(거부 쪽 null 기대 11개는 스텁도 null — 구현 뒤에도 통과해야 하는 음성 사례). 10MB = 10 × 1024 × 1024 바이트(명세에 단위 없음 · 앱 안 기존 MB 관례 없음 → 너그러운 쪽).
- 단계 1 GREEN: 24/24 · tsc·eslint 통과 · 커밋 `c6a03a5`. RED 로그 `logs/stage1-red.log`(13 실패 · 11 통과 — 예측 일치).
- **단계 2 예측(RED 전)**: `header.test.ts` 새 테스트 **21개**. 스텁(null·false)에서 **14 실패 · 7 통과**(null 기대 4 · 한도 안쪽 false 기대 2 · 생성기 던짐 1).
- 단계 2 RED 실제 **16 실패 · 5 통과**(예측 14·7과 차이 2 — 한도 안쪽 테스트 안의 `MAX_PIXELS`·`MAX_SIDE` 상수 단언이 스텁 0에서 실패하는 것을 예측에서 빠뜨림. 테스트·단언 변경 없음). GREEN 45/45(누적) · tsc·eslint 통과.
- **단계 3 예측(RED 전)**: `ladderFormat.test.ts` 새 테스트 **16개**. 스텁에서 **15 실패 · 1 통과**("png로 떨어지면 미지원" — 스텁 false).
- 단계 3 RED 15 실패 · 1 통과(예측 일치). GREEN 61/61(누적) · tsc·eslint 통과.
- **단계 4 예측(RED 전)**: `ingestImage.test.ts` 새 테스트 **15개**(it 13 · each 2행 ×2). 스텁(reject)에서 **14 실패 · 1 통과**(기본 deps 모양 — 스텁도 함수).
- 단계 4 RED 14 실패 · 1 통과(예측 일치). GREEN 76/76(누적, ingest 폴더) · tsc·eslint 통과.
- 최종 게이트(1회): typecheck 0 · lint 0 · vitest 0(220 파일 · 1952 테스트) · build 0. dist 해시 93개 기준과 **완전 동일**(diff 0) → 번들 변화 0. /studio 진입 127.36 · 렌더 JS 83.03 그대로.
- Codex r1(`logs/codex-r1.txt`): P2 1건 — 파일 바이트 읽기 실패가 reject로 샘. **반영 예측**: 새 테스트 2개(읽기 단계 2곳) · RED 2 실패.
- r1 반영 RED 2 실패(예측 일치) → GREEN 78/78(ingest) · tsc·eslint 통과.
- Codex r2(`logs/codex-r2.txt`): P1 1건(resizeWidth 무시 환경 무한 축소 — SPEC 11절 캔버스 대체 경로 없음) · P2 1건(확장자·MIME 검사 전에 바이트 읽기). **반영 예측**: 새 테스트 3개 · RED 2 실패 · 1 통과(대체도 틀린 크기 → 지금은 가짜의 60회 상한 예외로 DECODE_FAILED). 기존 '기본 deps 모양' 테스트에 drawScaled 단언 1줄 추가(스텁도 함수 → 통과).
- r2 반영 RED 실제 **3 실패**(예측 2 — '대체도 틀린 크기' 테스트가 가짜 60회 상한까지 bitmap이 쌓여 `< 10` 단언에서 실패, 예측 오류 · 테스트 변경 없음) → GREEN 81/81(ingest) · tsc·eslint 통과.
- Codex 2라운드 완료(r1 P2 1 · r2 P1 1 + P2 1 → 전부 TDD 반영). r2 반영분 Codex 재검토 없음(BRIEF ≤2 상한).
- 최종: typecheck·lint·build exit 0 · dist 동일 · 전체 vitest 기본 1회 exit 0(1957) — 앞선 부하(load 94) 실행 실패 경과는 REPORT 6절. REPORT 작성 완료.
