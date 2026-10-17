# 하네스 37건 → 3분류 대응표 (RS6-AC-U1)

출처: 읽기 전용 서브에이전트(analyzer) 1회 · 테스트 실행 0 · 근거 = 하네스 `dev/active/save-core-harness/test/h1~h6` 파일:행 [L1] + 분류 판단 [L1-추적]. 메인이 CP 진행 중 "제품 테스트" 열을 채웠다.

합계 37 = ① 이식 30 · ② 잠금 기반 대체 6 · ③ 폐기 1 (h1 3 · h2 5 · h3 4 · h4 4 · h5 7 · h6 14).

| # | 하네스 | 의미 | 분류 | 제품 대응 |
|---|---|---|---|---|
| 1 | h1:11 | 커밋 전 편집 B → A 완료 newer · dirty · confirmed=A · B 보존 → 재저장 B 영속 | ① CP1 | detach 호출 제거(제품에 attach/detach 없음 — I6 1.1 삭제), 바인딩 보존 의미만 |
| 2 | h1:37 | 커밋 뒤 편집 B → newer=false · B dirty | ① CP1 | |
| 3 | h1:51 | 늦은 완료가 새 커밋을 덮지 않음(직렬) | ① CP1 | |
| 4 | h2:21 | A 진행 중 B 편집 → confirm receipt = B · IDB 재읽기 일치 | ① CP1 | |
| 5 | h2:40 | confirm 중 편집 C → newer · C dirty | ① CP1 | |
| 6 | h2:53 | wrote:false 확인 중 편집 → newer | ① CP1 | |
| 7 | h2:61 | 메모리 폴백 save·confirm failed{not-persistent} · confirmed 영속 증명 없음 | ① CP4 | memory 모드 = DocBook 커밋 뒤 not-persistent (savedMark 전진 — 차이, REPORT) |
| 8 | h2:69 | unsupported(locks 없음) → confirm failed · 쓰기 0 | ① CP3 | |
| 9 | h3:14 | readonly 거절 → 잠금 해제 → 재시도: 바인딩 동결 보존 · delete 0 | ① CP2 | 두 탭 실제 fakeLocks |
| 10 | h3:38 | quota 실패: 문서·이미지 0 → 재시도 둘 다 | ① CP2 | |
| 11 | h3:52 | confirm 경로 abort → 재시도 confirmed · 함께 | ① CP2 | |
| 12 | h3:65 | 부족 이미지 → 제출 0 · image-missing / IDB에 있으면 바인딩 없이 통과 | ① CP2 | |
| 13 | h4:35 | 탭 B 저장·닫힘 → A wrote:false confirm stale | ② | writerLock.test.ts:120·:152 · RS6-AC-B3 (제품 세대 검사 = 잠금 획득 때 fresh, D6-3) |
| 14 | h4:46 | 아무도 안 쓴 writer 탭 wrote:false = IDB 재읽기 proof fresh | ① CP1 | 단일 탭 재현 가능 |
| 15 | h4:53 | 읽기 전용 탭 confirm → failed readonly | ② | writerLock.test.ts:81 · createLock.test.ts:79 · RS6-AC-B3 (+ 제품 2탭 포트 테스트 CP3) |
| 16 | h4:60 | 탭 B 저장 뒤 A dirty 저장 → stale · 덮어쓰기 0 | ② | writerLock.test.ts:120 · createLock.test.ts:98 · RS6-AC-B3 (+ 제품 2탭 포트 테스트 CP3) |
| 17 | h5:21 | 저장 진행 중 discard → rejected{inflight} | ① CP3 | |
| 18 | h5:34 | 커밋 안 된 초안 discard → 저장 상태 복귀 · 부활 0 | ① CP3 | |
| 19 | h5:46 | discard 중 편집 → blocked{newer} · 보존 | ① CP3 | |
| 20 | h5:58 | 다른 탭 기록 → discard blocked{stale} | ② (부분) | writerLock.test.ts:315·:120 · discard stale 자체는 verify 불일치로 ① 재현(CP3) |
| 21 | h5:68 | replace 거절(dirty·intent·epoch·inflight) · 옛 완료 비덮어쓰기 | ① CP3 | |
| 22 | h5:86 | confirm은 starter 호출 0 · retryStart만 | ① CP3 | |
| 23 | h5:96 | lease 같은 mountId = 같은 토큰 · release 뒤 새 토큰 | ① CP3 | |
| 24 | h6:37 | discard 중 save failed{discarding} · write 0 | ① CP3 | |
| 25 | h6:50 | discard 중 dirty confirm · 두 번째 discard 거절 | ① CP3 | |
| 26 | h6:63 | discard 읽기 throw → finally 가드 해제 | ① CP3 | |
| 27 | h6:74 | discard 읽기 지연 중 edit 수용 → blocked{newer} | ① CP3 | |
| 28 | h6:92 | discard 중 edit·replace 수용 → blocked{newer} | ① CP3 | |
| 29 | h6:103 | writer 확인 대기 중 같은 id 다른 Blob 편집 → 커밋 = 편집 시점 Blob(동결) | ① CP2 | |
| 30 | h6:125 | edit·replace 뒤 호출자 객체 변경 → 코어 초안 불변 | ① CP2 | |
| 31 | h6:139 | 순차 discard → 바인딩 = 커밋된 X · 폐기 Blob 미포함 | ① CP3 | discard 필요라 CP3로 |
| 32 | h6:150 | 재열기 코어 discard → 폐기 Blob 제거 · IDB X로 저장 | ① CP3 | 재열기 = 새 레지스트리 동기 seed(D6-10) |
| 33 | h6:161 | 키에 코어 이미지가 아닌 레코드 → image-missing | ③ | 코어 고유 레코드 형식(`kind:"core-image"`) 판정 — 제품 이미지 확인은 키 존재(`imageRecordId`) |
| 34 | h6:172 | 한 탭 코어 2개 gate 공유 동시 save → 하나 stale | ② | writeQueue.test.ts:44 · writerLock.test.ts:120 · 구조: 레지스트리 = 프로젝트당 코어 1개 + 탭당 LocalSync 1개(RS6-AC-G2 가드 CP4) |
| 35 | h6:189 | 연속 save 세대 1·2·3 · 재열기 · 실패 뒤 진입 | ② | writerLock.test.ts:204 · createLock.test.ts:150 · writeQueue.test.ts:57 · RS6-AC-B3 |
| 36 | h6:206 | 거짓 성공(반영 없이 resolve) → confirm not-committed | ① CP1 | |
| 37 | h6:213 | 이미지 op만 빠진 거짓 성공 → not-committed | ① CP2 | verify 이미지 검사 |

- 주의: 하네스 REPORT.md:49 — h1-2·h2-1·h2-4·h3-1~3·h5-5는 하네스에서도 RED 없이 PASS였다. 제품 RED는 "모듈 없음/스텁" RED다.
