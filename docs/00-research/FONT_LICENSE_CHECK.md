# FONT-01 — 폰트 허용 목록 라이선스 원장

기준 시점: 2026-09-25 (공식 원문 기준)
대상: Pretendard, Noto Sans KR, Noto Serif KR
결정 목적: ADR-005 Q4 — Design Studio의 폰트 허용 목록 확정
법적 성격: 법률 자문이 아니라, 공개된 라이선스 원문과 공식 배포 메타데이터를 확인한 결과입니다. 실제 배포 방식·변경 정도·상표 또는 별도 계약의 존재에 따라 법률 검토가 필요할 수 있습니다.

## 1. 결론 / 핵심 발견

1. 세 폰트 모두 원본 파일의 S1 자체 호스팅과 S2 고객 홈페이지 배포를 허용하는 것으로 판정합니다. 단, 폰트 파일을 번들·배포할 때 저작권 고지와 OFL 1.1 라이선스 전문(또는 라이선스 정보를 사용자가 볼 수 있는 형태)을 함께 제공해야 합니다. 상업 사이트·유료 소프트웨어에 포함하는 것도 OFL 원문상 허용됩니다.
2. S3는 일괄 허용이 아닙니다. 단순한 WOFF/WOFF2 압축 변환이 원본 폰트 데이터와 메타데이터를 보존하는 경우에만 원래 이름을 유지할 여지가 있습니다. 글리프 서브셋은 Modified Version으로 취급하고, Reserved Font Name(RFN)이 걸린 이름은 변경해야 합니다. 따라서 제품 기본 정책은 “S3 조건부 허용 + 변환 검증 + 필요 시 새 이름 + OFL/고지 동봉”입니다.
3. ADR-005 허용 목록에는 세 폰트를 모두 포함할 수 있습니다. 다만 Pretendard와 Noto Sans KR은 RFN이 확인되므로 변환 산출물을 원래 패밀리명으로 재배포하지 않도록 제품 파이프라인을 제한해야 합니다. Noto Serif KR은 공식 Google Fonts OFL 파일에서 RFN 문구가 확인되지 않았지만, 무변경 원본 라이선스와 변환 메타데이터를 계속 보존해야 합니다.

## 2. 공통 라이선스 판독

라이선스: SIL Open Font License, Version 1.1 — 26 February 2007.

핵심 원문:
- “The OFL allows the licensed fonts to be used, studied, modified and redistributed freely as long as they are not sold by themselves.”
- “The fonts, including any derivative works, can be bundled, embedded, redistributed and/or sold with any software provided that any reserved names are not used by derivative works.”
- 조건 1: “Neither the Font Software nor any of its individual components, in Original or Modified Versions, may be sold by itself.”
- 조건 2: “Original or Modified Versions ... may be bundled, redistributed and/or sold with any software, provided that each copy contains the above copyright notice and this license.”
- 조건 3: “No Modified Version ... may use the Reserved Font Name(s) unless explicit written permission is granted...”
- 조건 5: “The Font Software, modified or unmodified, in part or in whole, must be distributed entirely under this license...”

공식 원문: https://openfontlicense.org/open-font-license-official-text/
공식 FAQ: https://openfontlicense.org/ofl-faq
웹폰트 관련 FAQ 원문:
- “loading the fonts dynamically as webfonts through CSS @font-face declarations ... is ... explicitly allowed”
- WOFF/WOFF2는 “a change in font format normally ... modification”이나, “original font data remains unchanged except for WOFF compression”이고 원본 메타데이터를 변경 없이 포함하면 이름 변경이 필요 없는 경우가 있음.
- 글리프 서브셋·변환 등 일반적인 배포는 embedding이 아니라 distribution으로 취급되므로 저작권·라이선스 정보를 동봉해야 함.

## 3. 폰트별 원문 및 배포 정보

### 3.1 Pretendard

라이선스·RFN 원문:
- “Copyright (c) 2021, Kil Hyung-jin ..., with Reserved Font Name 'Pretendard'.”
- “Copyright 2014-2021 Adobe ..., with Reserved Font Name 'Source'.”
- “Copyright ... The Inter Project Authors ..., with Reserved Font Name 'Inter'.”
- “Copyright 2021 The M+ FONTS Project Authors ..., with Reserved Font Name 'M PLUS 1'.”
- “This Font Software is licensed under the SIL Open Font License, Version 1.1.”

판독: Pretendard 배포 LICENSE는 원본 Pretendard뿐 아니라 기반 구성요소의 RFN도 명시합니다. 변환·서브셋 결과가 Modified Version이면 사용자에게 표시되는 주된 폰트명에 Pretendard, Source, Inter, M PLUS 1을 사용하지 않는 보수적 정책이 필요합니다. 단, OFL FAQ의 원본 데이터·메타데이터 보존형 순수 WOFF/WOFF2 압축 예외는 별도 검증 대상입니다.

최신 공식 태그(확인 시점): v1.3.9. 공식 릴리스 페이지의 최신 릴리스와 태그 API가 모두 v1.3.9를 가리킵니다.
공식 저장소: https://github.com/orioncactus/pretendard
LICENSE 원문: https://raw.githubusercontent.com/orioncactus/pretendard/main/LICENSE
공식 릴리스: https://github.com/orioncactus/pretendard/releases/tag/v1.3.9
공식 배포 ZIP URL(다운로드 링크만 기록; 본 조사에서는 다운로드하지 않음): https://github.com/orioncactus/pretendard/releases/download/v1.3.9/Pretendard-1.3.9.zip

### 3.2 Noto Sans KR

공식 Google Fonts 배포 LICENSE 원문:
- “Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'”
- “This Font Software is licensed under the SIL Open Font License, Version 1.1.”

공식 메타데이터는 family를 “Noto Sans KR”, license를 “OFL”, source repository를 notofonts/noto-cjk로 기록하고, upstream version을 2.004로 기록합니다. 이는 Noto CJK의 Korean regional subset을 Google Fonts용으로 제공하는 경로입니다.

최신 upstream 공식 버전(확인 시점): Noto Sans CJK 2.004 (Release Date: 2021-04-28). Google Fonts 저장소에는 별도 semantic release tag 대신 현재 파일과 upstream commit이 관리됩니다. 따라서 “Noto Sans KR”의 Google Fonts 파일 자체에 독립적인 최신 버전 번호가 노출된다고 단정하지 않고, upstream 2.004와 Google Fonts source commit을 함께 고정하는 것이 재현 가능한 기준입니다.
공식 Google Fonts 디렉터리: https://github.com/google/fonts/tree/main/ofl/notosanskr
OFL 원문: https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/OFL.txt
메타데이터: https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/METADATA.pb
upstream 공식 저장소: https://github.com/notofonts/noto-cjk
upstream release/readme: https://github.com/googlefonts/noto-cjk/blob/main/Sans/NEWS.md
공식 Korean 배포 안내: https://github.com/googlefonts/noto-cjk/blob/main/Sans/README.md

### 3.3 Noto Serif KR

공식 Google Fonts 배포 LICENSE 원문:
- “Copyright 2012 Google Inc. All Rights Reserved.”
- “This Font Software is licensed under the SIL Open Font License, Version 1.1.”
- 동일 LICENSE의 조건 1–5에 따라 단독 판매 금지, 번들·재배포·판매 허용, 고지·라이선스 동봉, Modified Version의 RFN 사용 제한이 적용됩니다.

확인된 RFN: 공식 Noto Serif KR OFL.txt의 저작권 문구 뒤에는 “with Reserved Font Name ...” 구절이 없습니다. 따라서 이 공식 파일 기준으로 특정 RFN은 확인되지 않았습니다. 이는 이름·상표에 대한 별도 권리까지 없다는 뜻은 아닙니다.

최신 upstream 공식 버전(확인 시점): Noto Serif CJK 2.003 (Release Date: 2024-07-30). Google Fonts 메타데이터의 source file은 upstream `google-fonts/NotoSerifKR[wght].ttf`이며 source commit이 기록되어 있습니다.
공식 Google Fonts 디렉터리: https://github.com/google/fonts/tree/main/ofl/notoserifkr
OFL 원문: https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifkr/OFL.txt
메타데이터: https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifkr/METADATA.pb
upstream 공식 저장소: https://github.com/notofonts/noto-cjk
upstream release: https://github.com/notofonts/noto-cjk/releases/tag/Serif2.003
공식 Korean 배포 안내: https://github.com/googlefonts/noto-cjk/blob/main/Serif/README.md

## 4. 폰트 × 시나리오 판정 원장

판정어: 허용 = 원문상 허용되며 명시 조건 준수 필요 / 조건부 = 변환·배포 조건을 충족할 때만 허용 / 불가 = 확인된 조건으로는 허용하지 않음.

| 폰트 | 시나리오 | 판정 | 조건 및 이유 | 원문 근거 | URL |
|---|---|---|---|---|---|
| Pretendard | S1 앱 자체가 woff2 자체 호스팅 | 허용 | 웹앱의 CSS @font-face 자체 호스팅은 허용. 폰트 파일을 사용자에게 배포하므로 저작권 고지와 OFL 1.1을 앱의 라이선스/third-party notices 또는 파일 메타데이터로 제공. 원본 WOFF2를 그대로 사용하고 단독 폰트 판매는 금지. | 사실: “webfonts through CSS @font-face ... explicitly allowed”; 조건 2의 copyright notice/license 동봉 | https://openfontlicense.org/ofl-faq ; https://raw.githubusercontent.com/orioncactus/pretendard/main/LICENSE |
| Pretendard | S2 export 고객 홈페이지에 포함·상업 배포 | 허용 | 고객 사이트의 상업적 이용·웹 임베딩·번들 배포 허용. 폰트 자체를 단독 상품으로 판매하지 말고, export 결과물 또는 소프트웨어 번들의 일부로 제공. export 산출물에 저작권 고지와 OFL 1.1을 접근 가능하게 포함. | 사실: “bundled, embedded, redistributed and/or sold with any software”; “may not be sold by itself” | https://raw.githubusercontent.com/orioncactus/pretendard/main/LICENSE ; https://openfontlicense.org/ofl-faq |
| Pretendard | S3 서브셋/포맷 변환 후 S1·S2 | 조건부 | 글리프 서브셋은 Modified Version으로 보고, 사용자 표시 이름을 Pretendard/Source/Inter/M PLUS 1로 유지하지 않는 새 이름 정책이 필요. WOFF2가 순수 압축이고 원본 데이터·메타데이터를 그대로 보존하는지 검증되면 이름 유지 가능성이 있으나, 도구가 이를 자동 보장하지 않음. 변환본에도 OFL·고지 동봉. | 사실: OFL 정의상 “changing formats”도 Modified Version; 조건 3 RFN; FAQ 2.2.1의 순수 압축 예외. 판단: 서브셋은 기본적으로 변환·수정으로 취급 | https://raw.githubusercontent.com/orioncactus/pretendard/main/LICENSE ; https://openfontlicense.org/ofl-faq |
| Noto Sans KR | S1 앱 자체가 woff2 자체 호스팅 | 허용 | 자체 호스팅·@font-face 허용. 배포되는 파일과 함께 Adobe 저작권 고지, OFL 1.1 전문/접근 경로를 제공. RFN Source를 원본 파일명·primary font name에 그대로 쓰는 것은 원본일 때만 처리. | 사실: OFL의 웹페이지·webfont 허용; Google Fonts OFL header에 RFN Source 및 OFL 1.1 | https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/OFL.txt ; https://openfontlicense.org/ofl-faq |
| Noto Sans KR | S2 export 고객 홈페이지에 포함·상업 배포 | 허용 | 상업 홈페이지에 번들·임베딩·재배포 허용. 폰트 단독 판매는 금지. export 패키지/사이트의 notices에 고지와 라이선스를 포함. | 사실: OFL 조건 1–2 및 FAQ 1.4, 2.1 | https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/OFL.txt ; https://openfontlicense.org/ofl-faq |
| Noto Sans KR | S3 서브셋/포맷 변환 후 S1·S2 | 조건부 | Modified Version이면 RFN Source 사용 금지(명시적 서면 허가 없을 때)이고 새 primary font name 필요. 순수 WOFF2 압축 + 원본 데이터·메타데이터 불변이면 FAQ의 예외 가능성은 있으나 도구 출력 검증이 필수. | 사실: “with Reserved Font Name 'Source'”; 조건 3; FAQ 2.2.1–2.2.2 | https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/OFL.txt ; https://openfontlicense.org/ofl-faq |
| Noto Serif KR | S1 앱 자체가 woff2 자체 호스팅 | 허용 | 자체 호스팅·@font-face 허용. 원본 파일을 배포하는 경우 Google 저작권 고지와 OFL 1.1을 포함. 공식 OFL 원문에서 RFN은 확인되지 않음. | 사실: OFL 웹폰트 허용; 공식 파일의 copyright/OFL header | https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifkr/OFL.txt ; https://openfontlicense.org/ofl-faq |
| Noto Serif KR | S2 export 고객 홈페이지에 포함·상업 배포 | 허용 | 상업 사이트·소프트웨어 번들에 포함 가능. 폰트 단독 판매 금지. export 결과물에 저작권 고지와 OFL 1.1을 동봉/접근 가능하게 제공. | 사실: OFL 조건 1–2; FAQ 1.4, 2.1, 2.2 | https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifkr/OFL.txt ; https://openfontlicense.org/ofl-faq |
| Noto Serif KR | S3 서브셋/포맷 변환 후 S1·S2 | 조건부 | 공식 OFL header상 특정 RFN은 확인되지 않았지만, 포맷 변경·서브셋은 Modified Version 취급 가능. OFL 1.1로 계속 배포하고 고지를 보존. 이름 변경 필요 여부는 변환 결과가 RFN을 실제로 포함하는지와 원본 metadata 보존 여부를 확인한 뒤 결정. | 사실: OFL의 Modified Version 정의·조건 2–5; 추정/확인 필요: 특정 변환 산출물의 실제 metadata와 RFN 존재 여부 | https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifkr/OFL.txt ; https://openfontlicense.org/ofl-faq |

## 5. 확인 항목별 답

1. 라이선스 종류·버전
   - 세 폰트 모두 공식 배포 LICENSE에서 SIL Open Font License 1.1을 확인했습니다.
2. 상업적 사용·웹 임베딩·재배포·번들 판매
   - 허용: 상업적 소프트웨어/웹사이트의 번들·임베딩·재배포·판매.
   - 금지: 폰트 파일 자체 또는 구성요소를 단독으로 판매.
3. RFN 및 변환 시 이름
   - Pretendard: Pretendard, Source, Inter, M PLUS 1 확인.
   - Noto Sans KR: Source 확인.
   - Noto Serif KR: 공식 OFL.txt에서 RFN 문구 미확인.
   - Modified Version은 해당 RFN을 서면 허가 없이 사용하지 않아야 합니다. 순수 WOFF/WOFF2 압축 예외는 원본 데이터·metadata 보존을 검증한 경우에 한정됩니다.
4. 저작권 고지·라이선스 파일
   - 폰트 파일을 번들·재배포하는 각 복사본에 copyright notice와 license를 포함해야 합니다. stand-alone LICENSE/OFL.txt, human-readable header, 또는 쉽게 볼 수 있는 machine-readable metadata 방식이 가능합니다.
5. Google Fonts API 대신 자체 호스팅
   - OFL 원문/FAQ상 Google Fonts API 사용을 요구하는 조항은 확인되지 않았습니다. 자체 서버의 @font-face 호스팅도 명시적으로 허용됩니다. 다만 자체 호스팅은 파일 재배포이므로 고지·라이선스 조건이 적용됩니다.
6. 최신 버전·공식 배포 URL
   - Pretendard v1.3.9: 공식 GitHub release.
   - Noto Sans KR: upstream Noto Sans CJK 2.004; Google Fonts directory는 upstream commit 기반 배포이며 별도 semantic version을 노출하지 않음.
   - Noto Serif KR: upstream Noto Serif CJK 2.003; Google Fonts directory는 source commit 기반 배포.

## 6. 출처 간 충돌

- Noto Sans KR/Serif KR의 표시명(Noto Sans KR, Noto Serif KR)과 upstream 릴리스명(Noto Sans CJK, Noto Serif CJK)은 다릅니다. 이는 충돌이라기보다 Google Fonts가 CJK upstream의 한국어 regional subset을 별도 family명으로 제공하는 배포 계층 차이입니다. 판단 기준은 Google Fonts 공식 디렉터리의 OFL/METADATA와 upstream notofonts/noto-cjk의 release/readme를 함께 사용했습니다.
- Noto Serif KR의 Google Fonts OFL.txt에는 RFN이 없지만, OFL의 일반 RFN 규칙은 여전히 적용됩니다. 따라서 “RFN 없음”을 “모든 상표·명칭 제한 없음”으로 확대 해석하지 않았습니다.
- Google Fonts API와 자체 호스팅 사이에 라이선스상 상충 조건은 확인되지 않았습니다. 자체 호스팅은 FAQ가 별도로 허용하는 웹폰트 배포 방식입니다.

## 7. 제외·한계

- 폰트 파일 자체는 다운로드하지 않았습니다. 파일 바이너리의 실제 내부 metadata, subsetter가 생성한 name table, WOFF2 변환 결과의 functional equivalence는 검증하지 못했습니다. 따라서 S3의 개별 도구·개별 산출물은 확인 필요입니다.
- 별도 상표권, 저작권 양도·계약, 관할 법률, CDN 약관, 고객의 최종 계약은 조사 범위에서 제외했습니다.
- Google Fonts의 동적 CSS/API 응답과 실제 최신 webfont 바이너리 버전은 공식 페이지 fetch 제약상 직접 비교하지 않았습니다. Google Fonts repository METADATA와 upstream release/readme를 기준으로 삼았습니다.
- “2026-09-25 현재”의 과거 시점 스냅샷을 보존한 아카이브가 아니라, 기준 시점에 맞춰 확인한 공식 원문·공식 API 결과를 기록한 것입니다. 이후 upstream이 갱신되면 버전·커밋 재확인이 필요합니다.

## 8. Jarvis 전달용 요약

- ADR-005 Q4 제안: Pretendard·Noto Sans KR·Noto Serif KR 모두 허용 목록에 포함.
- S1: 3종 모두 허용. 자체 호스팅 가능. 앱의 third-party notices/라이선스 화면 또는 파일 metadata에 저작권·OFL 1.1 제공.
- S2: 3종 모두 허용. 상업 고객 홈페이지 export·배포 가능. 단독 폰트 판매 금지, 번들에 고지·라이선스 포함.
- S3: 3종 모두 조건부. 서브셋/일반 포맷 변환은 Modified Version으로 보고 OFL 1.1 유지. Pretendard RFN(특히 Pretendard)과 Noto Sans KR RFN(Source)은 새 이름을 사용. 순수 WOFF2 압축 예외는 원본 데이터·metadata 보존을 자동 가정하지 말고 검증.
- 제품 가드: export 시 `OFL.txt`/저작권 notices를 함께 생성하고, 변환본의 family name·name table·license metadata를 검사하는 검증 단계를 둡니다.
- 상태: 라이선스 원문 판독 완료. S3 변환 도구/바이너리 내부 metadata는 확인 필요.

## 9. 추천 다음 조치

1. 영환님이 “S3 변환본을 원래 패밀리명으로 고객에게 제공할 것인지”를 결정해야 합니다. 보수적 기본값은 원래 이름 유지 금지(순수 압축 예외를 별도 검증한 경우만 예외)입니다.
2. 구현 시 폰트 파일을 다운로드하기 전에 사용할 정확한 공식 release/tag와 변환 도구를 고정하고, 별도 라이선스 검증 테스트를 추가합니다.
