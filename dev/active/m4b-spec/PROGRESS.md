# M4-b-1 PROGRESS — REACTZIP-SPEC (Designer)

산출: `docs/design/m4b/REACTZIP-SPEC.md` · 브리프: `BRIEF.md`

- [x] 0. BRIEF·PROGRESS 커밋
- [x] 1. 정본 읽기 (스파이크 REPORT·PRD FR-PUB-02·TRD·EXPORT-SPEC r1·ADR-004 개정 20)
- [x] 2. SPEC 초안 커밋 (15턴 안)
- [x] 3. §1 진입·버튼·진행·성공·실패·재시도·READ_ONLY
- [x] 4. §2 zip 트리·허용표·site.json 스키마·이미지·글꼴
- [x] 5. §3 의존성 9개·lock 절차·engines·build
- [x] 6. §4 충실도 계약·검증 매트릭스
- [x] 7. §5 RZ-AC·테스트 계획·예산 가드
- [x] 8. §6 LICENSES.md 항목
- [x] 9. §7 설계 질문 RZQ (사용자 질의 분리)
- [x] 10. Codex adversarial 1회 반영
- [ ] 11. 마감 — git status 빈 값, push 0

## 로그
- 2026-10-18 시작. 서브에이전트 분할: 문서 1개 단일 작성이라 불필요.
- 정본 읽기 완료. SPEC r0 초안 작성(1~8절 전부 채움) → 커밋. 다음: 근거 보강(이미지 data-* grep·폰트 크기·base.css) → Codex adversarial 1회.
- 미확인 2건 해소(e930363f) · 조언자 지적 반영(faf7dd43): 킷 정규식 숫자 허용 · site.json.images 크기 · body 상속값 전부(line-height) · SSR 대조=실제 산출 파일 · CI 부재 [사실] → RZQ-10~12.
- Codex adversarial-review 1회 완료(--scope branch --base a1c404a0): needs-attention · P1 2 · P2 2 → 전부 반영(0494cec6, SPEC 8.1 기록). 추가 라운드 없음(BRIEF 1회 규칙).
- 서브에이전트: 0개(문서 1개 단일 작성 — 분할 불필요).
