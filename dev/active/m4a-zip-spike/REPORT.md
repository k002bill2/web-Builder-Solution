# M4-a-1 REPORT — store zip 자체 작성 · 이미지 분리 실측 스파이크 (초안)

결론(초안 — 측정 중): store zip 실현 가능(S1 통과) · 작성기 gzip 914 B(단독 minify) · /studio 진입 증분 (S4 측정 중) · 조작 뒤 +(측정 중) · HTML_MAX 해소 여부(분석 중) · ZIP64 불필요(30MB 상한 ≪ 4GiB)

## 기준선 (fresh build, base cee15e71 = a520e770 + 문서)
- `npm run build` exit 0 (17.7s). /studio 정규화 128.66 · 복원 진입 131.64 · raw 129.96 / 133.00. exportFlow 조작 뒤 +3.32KB(4개 파일). 렌더 문서 JS 84.22 / 90 · CSS 8.89 / 30. → `raw/build-baseline.txt`

## S1 store zip 작성기 (사실)
- `app/src/features/studio/zip/storeZip.ts` (patches 보존) — 로컬 헤더 · 중앙 디렉터리 · EOCD · CRC-32(표 방식) · UTF-8 bit 11 · 버전 2.0 · 데이터 기술자 0 · ZIP64 0(경계 넘으면 throw).
- 테스트 6건 통과(`npx vitest run src/features/studio/zip`): CRC 표준 벡터, 순수 파서, 빈 목록 22B, `unzip -t`/`zipinfo`/`unzip -p`/`ditto -x -k`, 경로 검사.
- 크기: rolldown minify 단독 storeZip 1679 B raw · **914 B gzip**. splitImages(+crc32 포함) 531 B gzip.

(S2~S5 보강 중)
