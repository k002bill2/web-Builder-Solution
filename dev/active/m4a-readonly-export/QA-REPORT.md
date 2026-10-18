# M4-a-7 QA-REPORT — B-M4A-12 읽기 전용 탭 내보내기 독립 검증

> 상태: **초안**. 대상 tip `ef73f7e3`(base `36e825a6`). 정적·회귀만 — 브라우저·Codex 0. 사실/추정 구분.

## 판정
(미확정)

## 1. fresh 게이트·예산 — **PASS** [사실]
- `cd app && npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm test -- --run` **356 files / 3148 tests passed**, exit 0 · `npm run build` exit 0. 원문 `logs/qa/{typecheck,lint,test,build}.txt`.
- 예산(build 출력 `check-bundle-size`): `/studio` 해시 정규화 **128.79KB**(기준선 128.79) · 복원 **131.77KB**(기준선 131.77) — `main` = base `36e825a6`(`git rev-parse main` = merge-base) 기준선과 같음, 증분 0. raw 130.10/133.13은 해시 이름 흔들림(참고값).
- `app/dist/assets/StudioLayout-Ca8hy5Xw.js`의 `assets/infra-` 참조 **0** · `dist/assets`에 `infra-*` 공유 청크 자체가 없음.

## 2. 판별 정확성·변이
(진행 중)

## 3. 거짓 성공 0 · 거짓 사유 0
(진행 중)

## 4. restartFlow 불일치 검토
(진행 중)

## 5. 바뀐 기존 단언 이전/이후
(진행 중)
