# PERSIST-P1a-1 PROGRESS

- [x] P0: BRIEF 커밋
- [x] 1. StudioPersistence 어댑터 + 메모리 가짜 + IDB 구현 + 진입 읽기 함수 + 계약 테스트
- [ ] 2. 직렬 쓰기 큐 + StoredJob 직렬화 테스트
- [ ] Ego Lite (선택)
- [ ] 게이트: typecheck · lint · build(번들 /studio ≈0) · 전체 vitest
- [ ] REPORT

## TDD 예측
### 커밋 A (어댑터·가짜·IDB·진입 읽기) — 구현 전
- 설계: `app/src/data/persistence/` — envelope.ts(봉투·수제 확인·DB 이름·저장소 이름, 의존성 0) · entryRead.ts(진입 몫: 열기·단건 읽기·수제 확인) · infra.ts(toInfra) · studioPersistence.ts(인터페이스+메모리 가짜) · idbPersistence.ts(IDB 구현·업그레이드 단계) · 계약 테스트 `src/test/persistenceContract.ts`(가짜만 등록).
- IDB 버전: 진입 읽기는 버전 없이 열어 처음이면 저장소 없는 v1이 생길 수 있음 → 쓰기 쪽 DB_VERSION=2, 단계에 contains 가드, 진입은 저장소 없으면 close 후 missing, 양쪽 onversionchange=close.
- 예측 RED: envelope.test(모듈 없음 → import 실패), memoryPersistence.test(모듈 없음), idbPersistence.test(모듈 없음) — 3파일 모두 실패, 기존 테스트 영향 0.
- 예측 GREEN: 새 테스트 전부 통과, typecheck 통과.
- 실측 RED: 3파일 `Failed to resolve import "./envelope"` — 예측 일치(커밋 안 함).
- 실측 GREEN: 3파일 16 테스트 통과 · typecheck · eslint(새 파일) 통과.

