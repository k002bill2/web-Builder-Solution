# REPORT — release-check-build (M5-0 릴리스 체크 A 빌드 행렬 + B-M2B-05e)

## 결론
- **B-SEC-09 ① 닫힘 판정: 닫힘(조건부 — 테스트 경로 zip).** 현재 main 생성기(앱 소스 = `2f03e500`) React zip M1·M2를 docker `node:20.19-slim`(v20.19.6/npm 10.8.2)·`node:22`(v22.23.3/npm 10.9.9) × `npm ci && npm run build` · `npm install && npm run build` = **8/8 exit 0**, 8회 모두 `dist/index.html` CSP meta = head 첫 자식 · 인라인 script 0.
- **B-M2B-05e 완료:** `staticHtml.test.ts` TS-AC-10에 직렬화 결과 문자열 `--site-t1` 직접 단언 추가. RED(변이) 새 단언 FAIL → GREEN 3461 passed.
- 게이트: typecheck·lint·vitest(384 files/3461 tests)·build `GATES_EXIT=0` · `/studio` 정규화 128.79KB · 복원 131.79KB = 기준선 증분 0 (`logs/gates.txt:592·604`).
- **B-M4B-02(windows·macOS 빌드)는 이 레인으로 닫히지 않는다** — 행렬은 Linux aarch64 컨테이너뿐.

## 1. RZ-AC-C1 행렬 (B-SEC-09 ①)
| # | Node | 모드 | 문서 | install exit | build exit | node/npm | CSP meta head 첫 자식 | 인라인 script | 로그 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 20.19 | ci | M1 | 0 | 0 | v20.19.6 / 10.8.2 | 예 | 0 | `logs/rzc1-node20.19-ci-m1.txt` |
| 2 | 20.19 | ci | M2 | 0 | 0 | v20.19.6 / 10.8.2 | 예 | 0 | `logs/rzc1-node20.19-ci-m2.txt` |
| 3 | 20.19 | install | M1 | 0 | 0 | v20.19.6 / 10.8.2 | 예 | 0 | `logs/rzc1-node20.19-install-m1.txt` |
| 4 | 20.19 | install | M2 | 0 | 0 | v20.19.6 / 10.8.2 | 예 | 0 | `logs/rzc1-node20.19-install-m2.txt` |
| 5 | 22 | ci | M1 | 0 | 0 | v22.23.3 / 10.9.9 | 예 | 0 | `logs/rzc1-node22-ci-m1.txt` |
| 6 | 22 | ci | M2 | 0 | 0 | v22.23.3 / 10.9.9 | 예 | 0 | `logs/rzc1-node22-ci-m2.txt` |
| 7 | 22 | install | M1 | 0 | 0 | v22.23.3 / 10.9.9 | 예 | 0 | `logs/rzc1-node22-install-m1.txt` |
| 8 | 22 | install | M2 | 0 | 0 | v22.23.3 / 10.9.9 | 예 | 0 | `logs/rzc1-node22-install-m2.txt` |

- 회차마다 새 컨테이너(`--rm`)·읽기 전용 마운트에서 새로 복사해 실행(install 회차도 새로 풀린 원본에서 시작). 스크립트 `logs/rzc1-run.sh`.
- 산출 JS: M1 `index-XVGqLETP.js` 246.63KB(gzip 76.36) · M2 `index-BPHr-n2i.js` 250.12KB(gzip 77.70) — M2 해시·크기가 csp-zip `e1-c1-docker-build.txt`와 같다. CSS 5.98KB gzip.
- 판정 스크립트: head 첫 태그가 `<meta http-equiv="Content-Security-Policy"` 인지 · `src` 없거나 본문 있는 `<script>` 수.

### zip 해시 (`logs/rzc1-zip-gen.txt`)
| 문서 | sha256 | 바이트 |
|---|---|---|
| M1(이미지 없음) | `78f17508a8265b985571a5e4c0122a0595051ba32d4f63bcf8dc0a247f9dba71` | 739,269 |
| M2(이미지 포함) | `604013780197f80015839ab5c63415ac45056bf01a655c6fe6761652d993dd33` | 744,922 |

- **한계:** zip은 앱 버튼 경로가 아닌 **테스트 경로** 산출(임시 vitest 파일에서 `buildReactZip({...m1|m2(referenceRenderInput("ref-a")), css: KIT_CSS})`, 실행 직후 삭제·커밋 0). `KIT_CSS`는 fs 원문이라 앱 실제 경로(`kitCss` fetch)와 다를 수 있다 — m4b-impl·csp-zip 선례와 같은 한계.

## 2. B-M2B-05e
- 단언: `app/src/features/studio/staticHtml/staticHtml.test.ts` "B-M2B-05e 직렬화 결과 문자열의 --site-t1 …" — 가짜 렌더 문서가 받은 `render{doc, kitTokens}`로 `drawDoc`를 그려 직렬화하고, 결과 Blob 문자열의 `--site-t1`이 `typeScale: 1.333` → `1.333rem`, 없음 → 프로필 비율 `1.25rem`인지 비교(기대값 = `kit/tokens.ts`의 `rem(scale^1)` 규칙, 소수 4자리). 두 값이 달라야 판별되므로 프로필 비율 ≠ 1.333 전제도 단언.
- RED: `docPurpose.ts:55` `typeScale ?? scale` → `scale` 임시 변이 → 전체 스위트 5 failed(새 단언 `expected '1.25rem' to be '1.333rem'` 포함) — `logs/05e-red.txt`. `git checkout -- app/src`로 되돌림.
- GREEN: 384 files / 3461 tests passed — `logs/05e-green.txt`.
- 비테스트 앱 소스 변경 0 (변이는 임시·되돌림).

## 마감 상태
- `docker ps`(`logs/docker-ps.txt`): 이 레인이 띄운 컨테이너 0. 목록의 6개(youtube-maker-n8n·image-maker-backend·shared-postgres·open-webui·shared-redis·shared-qdrant)는 레인 시작 전부터 떠 있던 다른 프로젝트 것 — 건드리지 않음.
- `package-lock.json` 변경 0 · 원격 명령 0.
