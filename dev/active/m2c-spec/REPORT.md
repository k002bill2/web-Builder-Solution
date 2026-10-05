# M2C-0 REPORT — M2c 이미지 명세·계획 (Designer)

- worktree `m2c-spec` · 브랜치 `k002bill2/m2c-spec` · base `92f8e2f` · 코드 변경 0 · push/merge/삭제 0 · 서브에이전트 0
- 상태: **완료** — SPEC r1 · Codex adversarial 2라운드(r1 needs-attention 4건 → 반영 → r2 approve)

## 1. 산출물
| 파일 | 내용 |
|---|---|
| `docs/design/m2c/SPEC.md` | 0 지금 사실(L1) · 1 범위 · 2 업로드·변환(V1~V6 · 폭 640/1280/1920 · WebP→JPEG/PNG 대체 · EXIF/방향 · 원본 미보관) · 3 원본 비율 메타 · 4 결정적 SVG · 5 산출물 동봉(srcset 미사용 결정 · 잃은 이미지 · PNG decode · F2 캡션) · 6 보안·권리 · 7 예산 배치 · 8 IMG-AC 29개 · 9 QB 12개 · 10 깨질 테스트 · 11 브라우저 한계 |
| `docs/design/m2c/MQ-M2C.md` | MQ-C1~C8 (★ 추천 · 사실/추정) |
| `docs/04-plan/M2C_PLAN.md` | 레인 M2C-1~5 · 의존성 · 시간 5~6.5일 [추정] · QA 게이트 · 위험 |

## 2. L1 확인 요약
- 업로드 경로 0(`EditFields.tsx:44`) · 보관소 0 · 제품 images 맵 빈 값 · 정적 HTML/PNG는 render 메시지에 images 없음(`staticHtml.ts:90`) · `serializeSite` blob:→data: 이미 있음.
- 예산(`dev/active/m2b-d1/logs/jarvis-final/build.txt:139,150`): `/studio` 진입 127.36/128 · 첫 91.79 · `/profile` 첫 99.62. `EditFields`는 진입 청크(`StudioLayout.tsx:20` 정적 import).
- 2a-05 SPEC 5.9가 슬롯 UI·한도(5MB)를 이미 정의 → TR-SEC-04(10MB)와 충돌 → MQ-C1.
- 빌드 재실측은 하지 않음(이 worktree에 node_modules 없음 · 코드 0 레인).

## 3. Codex (실제 완료분만)
| 라운드 | 명령 | 결과 | 원문 |
|---|---|---|---|
| r1 | `codex-companion.mjs adversarial-review --scope branch --base 92f8e2f` | **needs-attention** — P1 2(내보내기 lazy 이미지 decode 교착 · 프로토콜 반쪽 이전으로 M2C-2 typecheck 실패) · P2 2(`readImage` 파생본 선택 계약 · 검사기가 +0.03/89.70을 강제 안 함) | `logs/codex-adv-r1.txt` |
| 반영 | SPEC r1 · PLAN | eager + decode 대기(5.3 · IMG-AC-26b) · `readImage` 파생본 전부 + `pickVariant` · 원본 폭 단계 추가(IMG-AC-04) · M2C-2에 `StructureCanvas` 송신부 타입·`app/scripts/` 가드 개정 편입(+0.5일) | 커밋 `2322dc4` |
| r2 | 같음 | **approve — No material findings** | `logs/codex-adv-r2.txt` |

## 4. 목업·브리프와 다르게 한 것 (ADR-003 한 줄 사유)
- 이미지 슬롯 UI를 패널 안에 바로 펼치지 않고 "[이미지 편집]" 버튼 뒤 lazy 청크로 — `/studio` 진입 여유 0.34KB·감지선 +0.03 때문(SPEC 2.1).
- 스위치 라벨 "배경 이미지 사용"(2a-05) → 슬롯 라벨 사용 — hero 밖 슬롯에서 틀린 이름(SPEC 2.2).
- TRD 8절 `srcset`을 단일 파일 HTML에 넣지 않음 — 크기만 늘고 절약 0, zip(M4)에서(SPEC 5.2).

## 5. 검증 명령·결과
- `git diff --stat 92f8e2f..HEAD` — docs·dev/active만 변경, `app/` 0 (아래 6절 마지막 커밋 뒤 재확인).
- Codex r1·r2 위 표. 빌드·테스트는 코드 0 레인이라 실행 안 함(node_modules 없음).

## 6. 남은 일·영환님 결정
- **MQ-C1·C2·C4·C6 답이 M2C-1 착수 조건**(전부 ★면 "전부 ★"). C3·C8은 M2C-3 전, C5·C7은 ★로 진행 가능.
- [확인 필요]로 남긴 것: Safari WebP 대체·모바일 캔버스 면적·HEIC 자동 변환·SVG-as-image 안 data: 이미지 로드·`check-bundle-size` lazy 분류 — 구현·QA 레인에서 실측.
