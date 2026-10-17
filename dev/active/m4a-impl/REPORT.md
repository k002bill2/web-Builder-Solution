# M4-a-2 REPORT — 정적 zip 내보내기 구현 (초안 · CP2 시점)

**결론(초안): CP2 완료 — 참조 직렬화(Q17 B)로 정적 HTML·zip 공통 경로 확보, `HTML_MAX` 8M 유지, 20MB 이미지 문서 단일 HTML 성공(단위). `/studio` 정규화 진입 증분 0.**

근거 수준: 단위·빌드 = L1(실행 출력). 실화면(Ego Lite) = 마감 단계 예정.

## 1. 예산 (결정 1 — 진입 증분 0)
| 시점 | /studio 정규화 | 복원 정규화 | raw | 렌더 JS | 로그 |
|---|---|---|---|---|---|
| 기준선(base d8e548e5) | 128.66 | 131.64 | 129.96 | 84.22 | `logs/build-baseline.txt` |
| CP2(protocol serialize refs) | 128.66 (0) | 131.64 (0) | 129.97 (해시 이름 흔들림 ±0.01 — 판정은 정규화) | 84.29 (+0.07, 스파이크와 동일) | `logs/build-cp2b.txt` |

## 2. CP 진행
- CP1 storeZip — 서브에이전트(worktree) 진행 중
- CP2 참조 직렬화 — 완료. RED `logs/cp2-red.txt`(6 실패) → GREEN(render·staticHtml·png 16파일 152 통과)
  - 렌더 문서: `serialize{refs:true}` → `img src="image:<id>"`(objectUrls `idOf`). refs 없으면 기존 data URL(PNG 경로 무변경).
  - 부모: `buildStaticHtml({images})`가 `image:<id>`를 부모 Blob에서 만든 src로 교체, 모르는 id = 실패(F-09 규칙 그대로).
  - 단일 HTML(Q5 A): 부모 Blob → data URL. `HTML_MAX` 변경 0.

## 3. 편차·결정 (한 줄씩)
- (작성 중)

## 4. M4-a-2b 이월 (Q1 A — 게이트 링크 줄)
| AC | 내용 | 이유 |
|---|---|---|
| EXP-AC-18 | 링크 게이트 줄 9줄 · 판정 4종 · 경고 확인 대화상자 목록 | Q1 A — 진입·auto 증분 > 0이라 개정 18 대상으로 분리 |
