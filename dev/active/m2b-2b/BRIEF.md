# M2B-2b 실행 브리프

- 역할 Developer / 환경 Orca managed Claude Code / worktree m2b-2b.
- 시작425dfff, 실렌더22쌍, suite195파일1763테스트. 렌더JS81.31KB/CSS7.25KB; studio첫91.77/진입127.41KB. 실제 baseline gate 기록 후 시작.
- 정본 docs/06-handoff/M2B-2_BODY-VARIANTS_BRIEF.md 전체 읽고 공통3절·5절2b·7~8절 실행. SPEC-BODY B1-5~8·KD-AC01~08/13~16·QB5~8/13/15 준수. 목표 portfolio/grid-3·masonry·grid-2 + statistics/stats-3 = 26쌍. 2a/2R/1b 재실행0, 2c미착수.
- 예상쓰기 PortfolioGallery.tsx/테스트, StatisticsStats3.tsx/테스트, kit.css·registry.ts·renderedVariants.ts·PageDocument.test.tsx 및 dev/active/m2b-2b/. Media.tsx 최소변경 필요시 회귀보존. 엔진계약/새슬롯0, docs/·design/·CLAUDE.md·package*.json/lock 수정0.
- P0 PROGRESS/REPORT골격·gate·baseline 기록 명시커밋. npm ci 필요시 worktree app에서 실행·lock불변. 원시로그 저장. 새테스트수 RED전에 예측, 실측불일치 원인 확인. 단계별 RED→GREEN→typecheck/lint/build·guards→명시커밋. 첫 typecheck 실패 커밋 금지.
- P1 공유 gallery시제품 실측먼저. 렌더끝예상89.70초과, studio진입레인증가0.03KB초과/127.70초과면 멈추고 보고. 부모킷import/엔진registry신규import/예산상향0. Gallery3변형 공유→통계→마감. 70턴까지구현/REPORT부분완료, 나머지는검증에사용. 불필요한문서탐색/기존리뷰재실행 줄이기.
- figure수=켜진슬롯, gradient figure aria-hidden=true, 실제로컬img alt/width/height. ul/figcaption0. 모두끔 gallery0. grid3/grid2 media_ratio기본4:5, 하나끔트랙유지. masonry고정1:1/16:9/4:5·CSS다단만·DOM순서유지·단배정고정금지. 실원본비율메타 M2c.
- 통계 li수치→설명, dl/h3/count-up0, 문자열무변환. 정규프로필 시험문자열 `1,234,567,89` 3폭한줄. 상한200%문서에서만줄바꿈허용·넘침0. 이를위해정규단언약화금지.
- KEPT_DATA·고정메뉴script바이트불변, CSS변형class선택자. 새스크립트/의존성/아이콘/state/effect/event/motion/외부요청0. allow-same-origin0. 전체registry정확목록26·부모집합동기화가드, no-such-variant전제유지. 낡은기존테스트는단언의도유지하고전후이관표기록.
- 1280/768/390 실브라우저·grid3이미지하나끔캡처·톤/상한200%·대비·정적HTML계산스타일동등성. 2a 판정도구 재사용시 CSS cssText직렬화금지: 제품과같은 CSS원문 사용. sandbox iframe fullPage금지, viewport/390wrapper/headless대체·실측폭증거. 실패증거보존.
- REPORT를브라우저전에부분작성. 끝 전체vitest기본1회exit0·Errors0필수(표적만통과완료아님), Codex branch review base425dfff1회실제최종본문/실행완료확인. Orca CODEX_HOME유지·부모HOME대체0, 권한/승인실패우회0. Codex쪽테스트EPERM을PASS로표현금지.
- 기존429이력과프로젝트제약상 서브에이전트0, 하나의공유gallery레인. main5480무접촉. 포트4337/보조4339는127.0.0.1만, 종료전cwd/PID확인·자기서버만종료·lsof0증거.
- 로컬명시경로커밋만. push/merge/삭제0. 80턴부터검증·REPORT마감우선. 종료실제meta·커밋표·수용조건별근거·testdelta·번들baseline/최종·남은한계·책임/환경한국어보고. 구현완료와독립QA/M2B6를혼동하지않음.
