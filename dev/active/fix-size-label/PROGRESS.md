# FIX-SIZE-LABEL PROGRESS

- [x] P0 BRIEF·PROGRESS 커밋
- [x] RED 예측 기록 → 경계값 테스트 RED 확인 (tip 커밋 금지)
- [x] 구현 (순수 함수 formatFileSize) → GREEN, 테스트+구현 함께 커밋
- [ ] 번들 확인 (/studio ≤129.65 · 복원 ≤132.68 · /profile ≤100)
- [ ] Ego Lite: preview 4337 · 내보내기 파일 → 가져오기 요약 "파일 NKB" · clip 1장 · deleteDatabase · finish({keep:[]}) · listTaskSpaces · 서버 종료
- [ ] 게이트: typecheck · lint · build · 전체 vitest exit 0
- [ ] REPORT.md

## 로그
- 설계: 표기 함수 `fileSizeLabel(bytes)`는 ImportProjectFileDialog.tsx 안 비공개 순수 함수(정수 산술: KB=ceil(b/1024)·최소1, MB=ceil(b*10/MB)/10 toFixed(1)). export 하면 react-refresh/only-export-components 경고 → 컴포넌트 렌더로 경계값 검증(수정 파일 2개 유지).
- RED 예측: 새 경계값 테스트 8건 중 1B·1,024B·1,025B·13,115B·1,048,575B(현행 "파일 1MB") · 1,048,576B(현행 "파일 1MB" ≠ "1.0MB") · 1,048,577B(현행 "파일 2MB" ≠ "1.1MB") · 52,428,800B(현행 "파일 50MB" ≠ "50.0MB") → 8건 전부 FAIL. 기존 I-S03의 "파일 3MB"(3MB-5B)는 결정 2에 따라 "파일 3.0MB"로 기대값 갱신(동일 강도 — 약화 아님) → 갱신 후 이것도 RED.
- RED 실측: 예측대로 9 failed | 8 passed (I-S03 + 경계값 8). GREEN: 17 passed.
