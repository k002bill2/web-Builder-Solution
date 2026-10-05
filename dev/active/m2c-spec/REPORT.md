# M2C-0 REPORT — M2c 이미지 명세·계획 (Designer)

- worktree `m2c-spec` · 브랜치 `k002bill2/m2c-spec` · base `92f8e2f` · 코드 변경 0 · push/merge/삭제 0 · 서브에이전트 0
- 상태: **초안 — Codex 결과 반영 전**

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

## 3. Codex
- (반영 후 기록)

## 4. 남은 일·영환님 결정
- MQ-C1·C2·C4·C6 답이 M2C-1 착수 조건.
