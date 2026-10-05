# M2C-4 REPORT — 산출물 동봉(정적 HTML · PNG 이미지) · 부모 디코드 실패 수신 · F2 캡션

- 레인: Developer / Orca managed Claude Code / worktree m2c-4 / base `2fc32ba` · 서브에이전트 0 · push/merge/삭제 0
- 결론: 구현 3단계와 Codex r1·r2 반영을 마쳤습니다. 전체 vitest 227파일 2034 통과(1차 실행은 부하 시간 초과 1건 → 단독 통과 → 전체 재실행 exit 0) · typecheck·lint·build exit 0 · 예산 통과. **정적 HTML 결과 화면 육안 확인은 BLOCKED**(아래 4절)

## 1. 커밋
| 단계 | 커밋 | 내용 |
|---|---|---|
| P0 | `74ba06f` | BRIEF·PROGRESS·시작 build 실측 |
| ② 예측 → 구현 | `4a73a3d` → `9ea3b48` | `readRenderMessage` 원본(`render/protocol.ts`)과 `compareFrame.ts` 사본을 **같은 커밋에서** 개정해 `IMAGE_DECODE_FAILED`를 읽음 · `renderAndSerialize`는 이 코드를 받으면 시간 초과 대신 바로 "이미지를 그리지 못했습니다"로 실패 · `compareFrameGuard.test.ts`는 단언·정규화를 고치지 않고 통과 |
| ① 예측 → 구현 | `37c1aba` → `d61c4a7` | `staticHtml/exportImages.ts`(`exportImages`·`imageReader`·`lostImageText`) — `pickVariant`·`slotTarget` 재사용 · 생성기 deps에 `readImage`·`onBuilt` 주입(**`ExportGenerator` 계약 무변경**) · 내보내기 render = images(쓰는 id만) + `loading:"eager"` · `buildStaticHtml`: `img src`는 `data:image/(webp\|jpeg\|png);base64,`만, `srcset`은 0 · PNG `images` 요청 · `PngError IMAGE_DECODE_FAILED` · `fallbackCount`에 잃은 이미지를 더하지 않음 |
| ③ 예측 → 구현 | `84f1aad` → `29fca65` | F2 캔버스 캡션(MQ-C8 ★A)과 잃은 이미지 문장 · 결과 줄(크기 · 3MB 초과 안내 · 잃은 이미지 — MQ-C3 ★A) · 재시도 alert·PNG alert의 decode 실패 문구 · 편집 틀 images를 exportFlow·PNG·캡션에 연결 |
| Codex r1 반영 | `f96ade5` → `e85367d` | 내보내기 이미지 맵을 요청(프로젝트)별로 두고, 요청이 끝나면 놓음 |
| Codex r2 반영 | 예측 커밋 → 반영 커밋(git log) | 맵을 놓는 때 = 잡이 끝났을 때(생성기 종료 · 조회한 잡의 종료 상태). 커밋 뒤 응답이 끊겨도 생성기가 이미지를 읽음 |

## 2. IMG-AC ↔ 테스트
| AC | 테스트 |
|---|---|
| IMG-AC-23 | `staticHtml/exportImages.test.ts` 6개: SPEC 5.1 세 사례(500 · 1500 · 같은 id 두 슬롯 → 큰 쪽), 쓰는 id만(= `docImageIds`), 잃은 이미지, imageReader 파생본 전부 · `staticMarkup.test.ts` "이미지 src = data:…만 · srcset 0" · `staticHtml.test.ts` "readImage 주입 → render{images, eager} · onBuilt" |
| IMG-AC-24 | `exportImages.test.ts` 잃은 이미지 · `exportFlow.test.ts` 잃은 문장 · notes · `pngCapture.test.ts` 성공 문장(이 경우에도 차단 0) |
| IMG-AC-25 | `exportFlow.test.ts` 크기 줄(이미지 0이면 괄호 생략) · 3MB 경계(3MB = 안내 0, 3MB+1B = 안내) · `ExportResultNotes.test.tsx` 결과 줄 표시 |
| IMG-AC-26b(부모 쪽) | `protocol.test.ts` · `compareFrame.test.ts` IMAGE_DECODE_FAILED 수신 · `staticHtml.test.ts` decode 실패 → 바로 실패 · `pngCapture.test.ts` decode 실패 PngError · `PngSave.test.tsx` · `ExportResultNotes.test.tsx` 실패 문구 · `staticHtml.test.ts` 이미지 없는 문서도 eager |
| IMG-AC-26(D-1) | `pngCapture.test.ts` "이미지 포함 문서 5회 같은 높이 · render{images, eager}"(단위). 실브라우저 5회 반복은 QA(M2C-5) 몫 — 이 레인에서는 1회 실측(4절) |
| IMG-AC-27 | 기존 sandbox 가드 그대로 통과 |
| IMG-AC-28 | `canvasCaption.test.ts` F2 문구(10절 목록 개정) · 잃은 이미지 문장 조건 |

RED 로그는 `logs/red-2.txt` · `red-1.txt` · `red-3.txt` · `red-codex-r1.txt`이고, 매번 예측과 실패 수가 같았습니다. `red-codex-r2.txt`도 같습니다. 테스트 수는 2009 → 2012 → 2023 → 2032 → 2033 → 2034입니다.

## 3. 번들 (시작 `logs/build-start.txt` → 마감 `logs/final-build.txt`)
| 라우트 | 시작 | 마감 | 변화 |
|---|---|---|---|
| `/studio` 진입 | 126.89 | 127.04 | +0.15 (멈춤 > 127.39 — 통과) |
| `/studio` 첫 화면 | 91.76 | 91.77 | +0.01 |
| `/profile` 첫 / 진입 | 99.61 / 119.11 | 99.62 / 119.12 | +0.01 |
| `/catalog` 첫 / 진입 | 99.65 / 102.03 | 99.66 / 102.04 | +0.01 / +0.01 |
| `/references/:id` · `/compare` · `/projects` | 97.00 · 98.83 · 94.02 | 97.00 · 98.84 · 94.02 | ≤ +0.01 |
| 렌더 JS / CSS | 84.19 / 8.80 | 84.19 / 8.80 | 0 |
| 조작 뒤 exportFlow · ExportAfter · pngCapture | 1.32 · 1.67 · 8.22 | 약 3.3 · 1.70 · 약 10.0 | 판정 밖(보고만 — `logs/final-build.txt`) |

## 4. Ego Lite (4337 loopback 자기 서버 · `vite preview` · 앱 안 클릭만)
- 경로: 카탈로그 → 비교 추가 2개 → 비교 보드 → 전부 선택 → 프로필 확정 → 3안 → A안 → 편집 시작(`/studio/project-1`) → About "이미지 편집" → 파일 선택(`shots/fixture-pattern.png`, 자체 제작 1600×900, m2c-3 fixture를 재사용) → 대체텍스트 입력
- 캔버스: 이미지가 반영됐고 캡션은 "시안 (F2) — …"입니다(`shots/1280-studio-image-picked.png`).
- **PNG**: "PNG 내려받기" → `동네-치과-클리닉-프로젝트_1280_r3.png`(1280×4274). 결과 파일을 열어 About 칸에 패턴 이미지가 들어간 것을 육안으로 확인했습니다(`shots/export-1280.png` · 확대 `shots/export-1280-about-crop.png`). 캔버스 오염 없이 toBlob이 성공했습니다(내려받기 성공).
- **정적 HTML: BLOCKED.** 이 시드 흐름의 문서에 기존 품질 게이트 차단 3건(대비 AA C-5, muted/bg 3.3:1)이 있어 "정적 HTML 내보내기" 버튼이 `aria-disabled`입니다(`shots/1280-html-export-gate-blocked.png`). 다른 레퍼런스(법률사무소 v2 · 카페 v3)로 확정해 다시 들어가도 같은 `project-1` 문서로 이어져 차단이 남았습니다. 이 차단은 이 레인의 변경과 무관합니다. 정적 HTML 이미지 동봉은 단위 테스트(2절 IMG-AC-23)로만 보증되므로, 게이트 통과 문서로 하는 육안 확인은 QA(M2C-5, QB-8)가 이어받아야 합니다.
- 정리: space 74 `finish({keep:[]})` → `{"closedSpace":true,"closedManagedLabels":["p1"]}` · `listTaskSpaces()` = `[]` · preview PID 26792 종료 → 4337 리슨 0 · main 5480은 건드리지 않음(PID 82062 리슨 유지 확인만)

## 5. 쓰기 범위 밖 연결 파일 (사유 한 줄씩)
- `StudioLayout.tsx`: images 맵(편집 틀 state가 유일한 보관 자리)을 useExportFlow·PNG capture에 전달하고, 재시도 alert에 사유를 넘김
- `useExportFlow.ts`: `requestExportOnce`에 images 전달
- `StructureCanvas.tsx`: 캡션에 images 전달(잃은 이미지 문장)
- `ExportAfter.tsx`: 결과 줄 표시
- `ExportRetryAlert.tsx` · `PngSave.tsx`: "이미지를 그리지 못했습니다" 문구(5.3-3)
- 기존 테스트 개정: `canvasCaption.test.ts` F2 문구(10절 목록) · `staticMarkup.test.ts` "on* 0" 테스트의 픽스처 `src="data:,"` → `data:image/png;base64,AA`(새 5.2 규칙 때문, 단언은 그대로)
- 키 이름: `CANVAS_CAPTIONS.f1`은 키를 유지하고 값만 F2로 바꿨습니다. 10절 밖인 `test/kitRegistryEngine.test.ts`가 이 키를 참조하기 때문입니다.

## 6. Codex
- r1 (`logs/codex-r1.txt`, `review --scope branch --base 2fc32ba`): P2 3건
  - 전역 이미지 맵 덮어쓰기와 해제 누락(2건) → `e85367d`에서 반영했고, 테스트 1개를 추가했습니다.
  - **미반영:** 직렬화 메시지 상한 `HTML_MAX` = 8,000,000자(`render/htmlMessage.ts`, 쓰기 범위 밖). 이미지 data:가 커지면 html 메시지가 버려져 시간 초과로 실패할 수 있습니다. SPEC 5.2의 추정 상한(4~5MB)은 이 값 안이지만, 보관 한도(30MB)는 넘을 수 있습니다. 렌더 메시지 상한이나 전송 방식 변경은 렌더 쪽 레인 또는 M4 zip에서 다뤄야 합니다.
- r2 (`logs/codex-r2.txt`, 같은 범위): P2 2건
  - 이미지 맵 수명을 HTTP 응답이 아니라 생성 작업에 맞출 것 → 반영했고 테스트 1개를 추가했습니다. 브리프에 따라 r2 반영분은 다시 검토받지 않았습니다.
  - HTML_MAX: r1과 같은 지적이라 미반영 사유도 같습니다.
- 남은 한계: 커밋 전에 실패해 생성기가 돌지 않았다면, 그 프로젝트 맵은 다음 내보내기 요청까지 남습니다(프로젝트당 1개, 다음 요청이 덮어씀).

## 7. meta · 한계
- 새 의존성·lock·명세·결정문서·scripts 수정 0 · 엔진/PageDoc 계약 변경 0 · 가드 약화·skip 0
- 미리보기 캔버스는 지금도 보관소가 고른 Blob 1장을 보냅니다(M2C-3 그대로). 내보내기는 `pickVariant`로 다시 고릅니다.
- 같은 revision의 멱등 재생은 생성기를 다시 돌리지 않습니다. 그래서 결과 줄은 그 내려받기 참조로 기억한 요약을 씁니다(같은 탭 안에서만 유지).
- MB 표기 = 1024² 기준(보관소 한도 문구와 같음).
