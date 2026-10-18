# SEC-M4A-10 REPORT — 프로젝트 파일 가져오기 신뢰 경계 · 내보낸 HTML CSP

대상 base `41fcfd25`. 검토자 Security(Claude Code, Opus 5.5). 2026-10-18. 범위: 로컬 코드·로컬 vitest(jsdom)만, 외부 송신 0.
표기: [사실]=코드·실행 확인 · [추정] · [미확인].

## 잠정 결론 (초안 — 퍼즈 전)

**잠정 PASS(머지 차단 없음) 예상, Critical/High 0 [추정].** 근거: 문서(`doc`)는 `validatePageDoc`(모르는 키·오염 키 거부, 문자열 패턴·길이, 이미지 source = UUID v4)로 막히고,
프로필 계열은 `profileShape`로 색(hex 엄격)·열거를 본다. 단 **문서 밖 레코드(project·series·snapshot 머리·DocRecord 봉투)는 "아는 필드만 검사, 모르는 필드는 그대로 저장"** 이고
`typography_tokens.family`는 임의 문자열이다 → 퍼즈로 렌더·내보내기 도달 여부 확인 중.

- 주의: BRIEF가 부르는 `readProject.ts`는 **내보내기 읽기**(IDB→파일)다. 가져오기 신뢰 경계는 `checkFile.ts`(①~④) · `checkImages.ts`(⑤) · `rekey.ts` · `writeImport.ts` [사실].

(항목별 결과는 아래에 채운다)
