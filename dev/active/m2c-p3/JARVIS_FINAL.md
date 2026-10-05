# Jarvis 최종 회수 — M2C-P3 P3 결함 묶음

- base 7125138 / HEAD 0d754fd. worker 62/70 success. B-M2C-06 지운 뒤 포커스 → "이미지 고르기", 07 status "이미지를 지웠습니다", 04 폭 변경 시 펼침 유지(StudioLayout이 open 상태 보유), 05 도움말 SPEC r2 4절, 02 check-bundle-size 보고 키 2개 추가(판정 불변 가드). 2034→2041, RED 예측 전 항목 일치. Codex r1 지적 0.
- Ego Lite 캡처 6장, space 78 finish → listTaskSpaces()=[], 서버 리슨 0.
- Jarvis 새 실행: typecheck·lint·build exit0, vitest 3회 각 2041/2041 exit0. /studio 진입 127.07(기준선 파일 127.39 안), 렌더 JS/CSS 불변.
- 남은 것: imageStore·exportImages는 해시 공유 청크라 키 표시 불가(판정 로직 변경 범위 밖) · SPEC 2.2·engine/contracts/pageDoc.ts:53 주석 "색 면" 잔존(다음 Designer 정정). push·배포 없음.
