# SAMPLE-SPEC r0 REPORT

**결론: `docs/design/sample/SAMPLE-SPEC.md` r0 완료 — 현재 앱은 PNG·HTML·zip·React zip을 `/studio`에서만 주고, 토큰·섹션 구성 단독 파일은 없다. ★안은 "디자인 샘플 묶음 zip(PNG+HTML+design-tokens.json+sections.json)" 버튼 1개 추가.**

## MQ 요약 (★)
1. MQ-SMP-01 묶음 방식 — ★B 묶음 zip 1개 + 기존 개별 버튼 유지
2. MQ-SMP-02 토큰 형식 — ★A 자체 평평한 JSON(DTCG는 확인 뒤 확장)
3. MQ-SMP-03 내보내기 버튼 순서 — ★A PNG·샘플 묶음 먼저(M4-a Q18 A 변경)
4. MQ-SMP-04 승인 고정 문안(LICENSES·README) — ★A "사이트"→"샘플" 최소 치환
5. MQ-SMP-05 경로 B 실행 위치 — ★C 보류(Security 위협 모델 뒤)
6. MQ-SMP-06 경로 B 약관 확인 — ★B robots 자동 + 사용자 체크
7. MQ-SMP-07 신규 버튼 `/studio` 진입 몫 — ★A ADR-004 개정 +0.05 배정
8. MQ-SMP-08 정적 HTML Safari·Firefox 열람 확인 — ★A 백로그로 남김

## 확인 필요
- [L3] W3C Design Tokens(DTCG) 형식 호환 여부(2.1절).
- [추정] 신규 버튼 진입 증가 +0.02~0.05KB — `/studio` 판정선 여유 ≈ 0.03KB라 실측 필요(3.2절).
- [추정] 브라우저 단독 앱의 교차 출처 제약(4절, ADR-009 2절 4).
- `[Newton 결과 대기]` 약관 판정·법무(4.2 `terms_denied`, MQ-SMP-06, SMP-AC-B09).
- `SnapshotDelete.test.tsx`·`zip/licenses` 테스트가 문구를 검사하는지(3.1 C3·C9) 미확인.
- 2.1·2.2 예시의 값·variant id는 Example data — 실제 variant id는 `engine/sections/registry.ts`에서 가져와야 한다.

## 미완
- BRIEF 3절 "항목별 커밋" 대신 통합 커밋 1개(시간 상한).
