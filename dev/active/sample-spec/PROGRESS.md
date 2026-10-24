# SAMPLE-SPEC PROGRESS

- [x] 1. 현행 조사 (L1 파일:줄) — SAMPLE-SPEC 1절
- [x] 2. 샘플 산출물 포맷 (토큰 스키마·섹션 표기·묶음 ★B) — 2절
- [x] 3. 경로 A 화면 정리 (문구 C1~C10 + 최소 변경 M1~M4 + 번들 영향) — 3절
- [x] 4. 경로 B 흐름·상태 (설계만) — 4절
- [x] 5. 수용 기준 SMP-AC-A01~A08 · B01~B09 — 5절
- [x] 6. MQ-SMP-01~08 — 6절
- [x] REPORT.md
- [x] git status 빈 값

메모: 시간 상한(15분) 때문에 1~6을 항목별 커밋 대신 1개 커밋으로 통합했다(BRIEF 3절 "각 항목 끝에 커밋"과 다름).

## 서브에이전트 (읽기 전용 2개, 병렬)
- A 현행 조사(Explore): 완료 — PNG·정적 HTML·zip·React zip·토큰·PageDoc·라우트 파일:줄. 핵심 2곳(ExportButtons.tsx:11-15, StudioLayout.tsx:377/387) 메인이 직접 재확인.
- B 문구 전수(Explore): 완료 — 구축 약속 문구 10건(C1~C10), "홈페이지/배포/호스팅" 0건. boardWarnings.ts:75·PageInfoFields.tsx:46-47 메인이 직접 재확인.
