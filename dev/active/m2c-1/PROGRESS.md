# M2C-1 PROGRESS — 이미지 변환기(imageIngest)

- base `c870439` · 브랜치 `k002bill2/m2c-1` · 서브에이전트 0 · 쓰기 = `app/src/features/studio/images/ingest/**` + `dev/active/m2c-1/`

## 체크리스트
- [x] P0 BRIEF 명시 커밋
- [ ] 의존성 설치(npm ci — lock 불변) · 기준 build(번들 기준값) 기록
- [ ] 단계 1 형식 검사 V1~V4 (IMG-AC-01·02) — 예측 커밋 → RED → GREEN
- [ ] 단계 2 헤더 파서 V5 + 알파 (IMG-AC-03·05 알파) — 예측 커밋 → RED → GREEN
- [ ] 단계 3 폭 사다리·포맷 결정 (IMG-AC-04·05) — 예측 커밋 → RED → GREEN
- [ ] 단계 4 ingestImage 조립 V6·인코딩·EXIF·방향·원본 미보관 (IMG-AC-03 스파이·06·07[U]·10) — 예측 커밋 → RED → GREEN
- [ ] 번들 변화 0 확인(build 전후 비교)
- [ ] typecheck · lint · build · 전체 vitest exit 0
- [ ] Codex review --scope branch --base c870439 (≤2라운드)
- [ ] REPORT.md (IMG-AC↔테스트 매핑 · meta · 한계)

## 로그
