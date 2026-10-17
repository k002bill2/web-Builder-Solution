# M4-a-1 BRIEF — store zip 자체 작성 · 이미지 분리 실측 스파이크 (Developer, 측정 전용)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/m4a-zip-spike` (브랜치 `k002bill2/m4a-zip-spike`, base `a520e770`). 병렬: `m4a-export-spec`(Designer).

## 목적
영환님 결정(store zip 자체 작성·의존성 0 · `/studio` 진입 증분 0)이 실현 가능한지 숫자로 확인. **앱 커밋 0** — 측정 코드는 `patches/`로 보존 후 자기 변경만 복원.

## 실험
1. **S1 store zip 작성기**: 무압축 ZIP(로컬 헤더 · 중앙 디렉터리 · EOCD · CRC-32 · UTF-8 플래그 bit 11 · ZIP64 필요 여부 판단 — 30MB 이미지 상한 기준) 최소 구현 + 단위 테스트(생성물을 Node `unzip -l`/`zipinfo` 또는 순수 파서로 검증 · macOS Archive Utility 호환 주의점 기록). 코드 크기(gzip B) 실측.
2. **S2 이미지 분리**: 현 정적 HTML 직렬화(`staticHtml/**`·`exportImages.ts`)에서 data URI를 `assets/images/<hash>.<ext>` 참조로 바꾸는 경로 — 어느 함수에 끼우는지, 렌더 문서(iframe) 메시지 `HTML_MAX`(8M) 우회가 되는지(B-M2C-01), 렌더 문서 예산(JS 90·CSS 30) 영향.
3. **S3 폰트 동봉**: 현 `siteFontEmbed.ts`(인라인) → 파일 분리 시 경로·크기.
4. **S4 청크 배치**: zip 작성기·분리 로직을 `exportFlow` 조작 뒤 청크에 붙였을 때 build 판정 — `/studio` 정규화 128.66 · 복원 131.65 · raw 129.96 → **증분 0 확인**, 조작 뒤 청크 증분 기록. 다른 라우트 0.
5. **S5 큰 문서**: 30MB 근처 이미지 문서로 zip 생성 시간·메모리(브라우저 단독 — Node 테스트로 근사 가능, 실화면 1회 선택).

## 결론 형식 (REPORT 첫 줄)
`store zip 실현 가능 여부 · 작성기 gzip X B · /studio 진입 증분 Y · 조작 뒤 +Z · HTML_MAX 해소 여부 · ZIP64 필요 여부`

## 금지
- 앱 커밋 0(최종 `git diff -- app/` 빈 값 — 측정 테스트 파일도 patches로만). 새 의존성 0. 기준선·ADR 수정 0. 브라우저 실화면은 선택(1회).
- 산출 `dev/active/m4a-zip-spike/{REPORT.md, patches/*, raw/*}`. 서브에이전트: 읽기 전용 1개(S2 직렬화 경로 조사) 허용. 최대 60턴, 48턴부터 복원·REPORT.

## 공통
- 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. 첫 3턴 BRIEF·PROGRESS 커밋. **REPORT(또는 산출 문서) 초안은 15턴 안에 먼저 커밋**, 이후 보강(중단 대비). 사실/추정/미확인 구분.
- preview를 띄우면 마지막 커밋 직전 종료 → `lsof -nP -iTCP:<포트> -sTCP:LISTEN` 출력 0을 REPORT에 기록.
- 마감 전 `git status --short`가 node_modules 외 빈 값.
