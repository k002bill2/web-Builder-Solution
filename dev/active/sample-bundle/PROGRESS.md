# SAMPLE-BUNDLE PROGRESS

## 0. 준비
- [x] 정본 읽기 (SAMPLE-SPEC 1·2·3·5 · THREAT-MODEL BL-4) — MQ.md는 SPEC 6절로 갈음
- [x] npm ci (EXIT=0)
- [x] BRIEF·PROGRESS 커밋

## 1. 항목 1
- [x] BL-4 isCssValue 강화 + 악성 픽스처 테스트 (RED→GREEN)
- [x] design-tokens.json 직렬화기 (A02·A03)
- [x] sections.json 직렬화기 (A04)
- [x] 항목 1 커밋 fd39d9d4

## 2. 항목 2
- [x] 샘플 묶음 zip 조립부 + 파일명 함수
- [ ] 버튼 연결 — BLOCKED: 시간 상한(15분). ExportFormat 확장 범위 REPORT "남은 일" 1
- [x] 순서: PNG → (샘플 자리) → HTML → 정적 zip → React zip
- [ ] A01 컴포넌트 테스트 · 순서 단언 — BLOCKED: 버튼 미연결
- [x] 번들 실측 logs/bundle.txt (+0.00)
- [x] 항목 2 커밋

## 3. 마감
- [x] 게이트 logs/gates.txt
- [x] REPORT.md
- [x] git status 빈 값
