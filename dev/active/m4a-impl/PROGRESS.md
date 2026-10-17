# M4-a-2 PROGRESS — 정적 zip 내보내기 구현

브리프: `dev/active/m4a-impl/BRIEF.md` · 정본: `docs/design/m4a/EXPORT-SPEC.md` 8a · base `d8e548e5`

## 체크리스트
- [ ] 0. BRIEF·PROGRESS 커밋
- [ ] CP1 storeZip 작성기 + 단위(CRC 벡터·파서·unzip -t/zipinfo·경로 거절·ZIP64 throw·결정적 시각)
- [ ] CP2 렌더 문서 참조 직렬화(Q17 B·Q5) · HTML_MAX 유지 · 기존 정적 HTML 테스트 통과 · 20MB 이미지 단위(EXP-AC-17)
- [ ] CP2 완료 → REPORT 초안 커밋
- [ ] CP3 zip 조립(index.html·assets/images·assets/fonts·OFL.txt·LICENSES.md) · 파일명 규칙 · ZIP_MAX 64MB
- [ ] CP4 금지 패턴 검사 확장(허용표·외부 href·브랜드 0) · F-11·F-12
- [ ] CP5 UI ExportButtons 2버튼 · 상태 문구 청크 · 성공 Callout 보조 문장(Q14)
- [ ] 예산: /studio 진입 증분 0 확인
- [ ] fresh typecheck·lint·test·build
- [ ] Ego Lite 1회(zip·file://·단일 HTML·1280/390) + preview 종료·리슨 0 기록
- [ ] Codex review 1회(--scope branch --base d8e548e5)
- [ ] REPORT 최종 · untracked 0

## 로그
