# ADR-002 — 목업 디자인은 채용, 제품 브랜드는 새로 정의

- 상태: **승인** (영환님, 2026-09-25 Slack: "목업브랜드는 디자인만 채용하고 제품브랜드는 새로운 브랜드로 설정하자")
- 작성: Jarvis

## 결정
1. **채용(유지):** 핸드오프 번들 APFS 디자인 시스템의 *디자인 언어* — 중립 톤 캔버스, 레이어드 라벨 색, 타입 스케일(Pretendard), 4px 간격, 모서리·그림자·모션 규칙, 컴포넌트 형태·상태.
2. **제거(교체):** APFS 브랜드 자산 — 로고·워드마크(`Logo` 컴포넌트), `--apfs-blue/cyan/green/gradient` 토큰, "APFS"·"농업정책보험금융원" 명칭, 네임스페이스 `APFSDesignSystem_*`, 컴포넌트·클래스명의 `apfs` 접두어.
3. **브랜드 레이어 분리:** 코드는 브랜드 값에 직접 의존하지 않는다.
   - `app/src/brand/brand.config.ts` — `name`, `shortName`, `tagline`, 로고 컴포넌트 참조
   - `app/src/styles/tokens/brand.css` — `--brand-primary`, `--brand-primary-hover`, `--brand-primary-pressed`, `--brand-primary-container`, `--brand-accent`, `--brand-gradient`, `--focus-ring`
   - 의미 토큰(`--primary` 등)은 `--brand-*`를 참조한다. 브랜드 교체 = `brand.config.ts` + `brand.css` 두 파일만 수정.
4. **임시 브랜드(확정 전):** 제품명 `Design Studio`(목업 GNB 표기, 작업명), 로고는 중립 워드마크 플레이스홀더(텍스트 + 단색 사각 마크). 색 값은 목업의 `--primary: #3366ff` 계열을 임시 유지한다.

## 후속 (별건)
- 브랜드 정의: 제품명 후보, 로고, 브랜드 컬러, 톤앤매너 → Designer (명칭 상표 확인이 필요하면 Newton)
- 확정 시 `brand.config.ts`·`brand.css`·파비콘·메타 태그만 교체한다.

## 수용 기준
- `app/src`에서 `apfs`·`APFS`·`농업정책` 문자열 0건 (출처 주석의 번들 경로 표기 제외)
- 로고·브랜드 색을 `brand.*` 두 파일 밖에서 참조하지 않음
