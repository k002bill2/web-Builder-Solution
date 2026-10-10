# COPY-HELP PROGRESS

- [x] P0: npm ci (exit 0, lock 변경 0) · PROGRESS 커밋
- [x] B-M2B-02: services/list `items` 도움말 "가운뎃점(·)으로 나눕니다" + aria-describedby 연결 (RED→GREEN, 별도 커밋)
- [x] B-M2B-03: contact/booking 편집 패널 Callout "예약" 문구 분기 (RED→GREEN, 별도 커밋)
- [ ] BACKLOG.md 두 행 닫힘 표기 커밋
- [ ] 게이트: typecheck · lint · build(번들 예산) · vitest 전체 1회
- [ ] REPORT.md

## RED 예측·결과
- B-M2B-02 RED 예측: `getByText("가운뎃점(·)으로 나눕니다")` 실패(도움말 없음). 결과: 예측대로 1 failed(문구 없음) · 다른 변형 무표시 테스트는 pass.
- B-M2B-02 GREEN: FieldEditor `hint` prop(`${id}-hint`, aria-describedby에 describedBy 다음) + EditFields가 services/list items에만 전달. studio 테스트 전부 pass.
- B-M2B-03 RED 예측: booking 선택 시 Callout 미표시 → `findByText(예약 문구)` 시간 초과. 결과: 예측대로 booking 1 failed · form 회귀 테스트 pass.
- B-M2B-03 GREEN: ContactOwnerNote `booking` prop으로 제목·문구 분기(lazy 청크 + Callout 주입 구조 유지) · EditFields 조건에 booking 추가. studio 223 pass.
