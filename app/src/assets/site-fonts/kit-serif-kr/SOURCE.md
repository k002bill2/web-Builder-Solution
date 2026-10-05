# Kit Serif KR — 출처·수정 기록 (M2B-4a · SPEC-MOTION-FONT 2.5·2.6)

Kit Serif KR is a Modified Version of Noto Serif KR (Copyright 2017-2024 Adobe), subset and renamed. Licensed under the SIL Open Font License 1.1.

| 항목 | 값 |
|---|---|
| 원본 URL | https://raw.githubusercontent.com/google/fonts/9710da1eacb3be272583c3224dcb70f9da6eadbb/ofl/notoserifkr/NotoSerifKR%5Bwght%5D.ttf |
| 원본 sha256 | 11f8d5de6f1b79195efba3828aaa2ec95c1178f5ae976fb23c8d53250a9938f3 |
| OFL.txt URL | https://raw.githubusercontent.com/google/fonts/9710da1eacb3be272583c3224dcb70f9da6eadbb/ofl/notoserifkr/OFL.txt |
| OFL.txt sha256 | 5e0da210fb04058a8c0087985d2d456b931c2579811a49655721d3cf0c36b6d6 (원문 그대로 · 바이트 동일) |
| upstream 버전 | Noto Serif CJK Version 2.003-H1 (METADATA.pb에 version 필드 없음 — 원본 TTF nameID 5에서 읽음 · METADATA source = notofonts/noto-cjk) |
| 도구 | Python 3.9.6 · fonttools==4.60.1 · brotli==1.1.0 (저장소 밖 임시 venv `/tmp/m2b4-fonts/venv`) |
| 결과 파일 sha256 | KitSerifKR-400.woff2 7c3e3399eceb26769fa47813dddae7a204a160facb84166fdcfd4a3581b9fafb · KitSerifKR-700.woff2 3a810728d23dda07e88d476a15b2eaf720b215f4fb6c1306e5ef4a219d1ab537 |
| 결과 파일 크기 | KitSerifKR-400.woff2 352812 B · KitSerifKR-700.woff2 362684 B |
| 글자 수 | cmap 항목 수 2572 (한글 2,350 + 기호 222) |
| RFN 사후 검사 | 0건 (명령 출력 아래) |

## 이름 교체 (SPEC 2.5-1)
- nameID 1·16 = `Kit Serif KR` · 2·17 = `Regular`/`Bold` · 4 = `Kit Serif KR Regular`/`Bold` · 6 = `KitSerifKR-Regular`/`-Bold` · 3 = `KitSerifKR-<style>;subset-ksx1001;11f8d5de6f1b` · 5 = 원본 값 + `; subset KS X 1001 (Design Studio M2B-4)`
- 보존: nameID 0 · 13 · 14 원문 그대로
- 삭제: 원본 이름을 담은 레코드 — nameID 7(상표 문구) · 25(변형 PS 접두어) · 11(URL에 noto가 있을 때). 1차 검사에서 이 레코드가 걸려, 검사 제외를 넓히지 않고 레코드를 지웠다

## RFN 사후 검사 출력 (SPEC 2.5-3 — nameID 0·13·14 제외 · 금지어 source·pretendard·inter·m plus 1·noto 대소문자 무시)
```
KitSerifKR-400.woff2: 금지어 0건 · nameID 0/13/14 존재 [0, 13, 14] · cmap 2572 (한글 음절 2350 + 그 밖 222)
KitSerifKR-700.woff2: 금지어 0건 · nameID 0/13/14 존재 [0, 13, 14] · cmap 2572 (한글 음절 2350 + 그 밖 222)
RFN 사후 검사 합계 0건
```

## 재현 명령 (저장소 밖 /tmp — 아래 스크립트 2개는 파일로 커밋하지 않는다)
```bash
python3 -m venv /tmp/m2b4-fonts/venv
/tmp/m2b4-fonts/venv/bin/pip install 'fonttools==4.60.1' 'brotli==1.1.0'
curl -sS -o '/tmp/m2b4-fonts/src/notoserifkr/NotoSerifKR[wght].ttf' 'https://raw.githubusercontent.com/google/fonts/9710da1eacb3be272583c3224dcb70f9da6eadbb/ofl/notoserifkr/NotoSerifKR%5Bwght%5D.ttf'
# 1) 문자 목록 — KS X 1001 한글 2,350 (EUC-KR 0xB0A1~0xC8FE)
/tmp/m2b4-fonts/venv/bin/python3 -c "print(''.join(bytes([h, l]).decode('euc-kr') for h in range(0xB0, 0xC9) for l in range(0xA1, 0xFF)), end='')" > /tmp/m2b4-fonts/chars.txt
for W in 400 700; do
  # 2) 굵기 고정 (변수 → 정적)
  /tmp/m2b4-fonts/venv/bin/fonttools varLib.instancer '/tmp/m2b4-fonts/src/notoserifkr/NotoSerifKR[wght].ttf' wght=$W -o /tmp/m2b4-fonts/out/KitSerifKR-$W.static.ttf
  # 3) 서브셋 + woff2 (name 전부 보존 — 4에서 교체)
  /tmp/m2b4-fonts/venv/bin/pyftsubset /tmp/m2b4-fonts/out/KitSerifKR-$W.static.ttf --text-file=/tmp/m2b4-fonts/chars.txt \
    --unicodes='U+0020-007E,U+00A0,U+00A9,U+00AE,U+00B0,U+00B7,U+00D7,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+203B,U+20A9,U+2122,U+2192,U+3001-3003,U+3008-3011,U+301C,U+3131-318E,U+FF5E' \
    --name-IDs='*' --name-languages='*' --layout-features='*' --flavor=woff2 --output-file=/tmp/m2b4-fonts/out/KitSerifKR-$W.tmp.woff2
  # 4) 이름 교체 (rename.py)
  /tmp/m2b4-fonts/venv/bin/python3 /tmp/m2b4-fonts/rename.py /tmp/m2b4-fonts/out/KitSerifKR-$W.tmp.woff2 /tmp/m2b4-fonts/out/KitSerifKR-$W.woff2 'Kit Serif KR' $W 11f8d5de6f1b
done
# 5) RFN 사후 검사 (check.py) · 체크섬
/tmp/m2b4-fonts/venv/bin/python3 /tmp/m2b4-fonts/check.py /tmp/m2b4-fonts/out/KitSerifKR-400.woff2 /tmp/m2b4-fonts/out/KitSerifKR-700.woff2
shasum -a 256 '/tmp/m2b4-fonts/src/notoserifkr/NotoSerifKR[wght].ttf' /tmp/m2b4-fonts/out/KitSerifKR-400.woff2 /tmp/m2b4-fonts/out/KitSerifKR-700.woff2
```

rename.py:
```python
import sys
from fontTools.ttLib import TTFont
src, dst, fam, w, sha12 = sys.argv[1:]
style = 'Regular' if w == '400' else 'Bold'
ps = fam.replace(' ', '') + '-' + style
f = TTFont(src)
name = f['name']
orig_version = name.getDebugName(5)
for rec in list(name.names):
    nid = rec.nameID
    if nid in (1, 16): rec.string = fam
    elif nid in (2, 17): rec.string = style
    elif nid == 4: rec.string = f'{fam} {style}'
    elif nid == 6: rec.string = ps
    elif nid == 3: rec.string = f'{ps};subset-ksx1001;{sha12}'
    elif nid == 5: rec.string = f'{orig_version}; subset KS X 1001 (Design Studio M2B-4)'
# 원본 이름을 담은 그 밖 레코드는 지운다(RFN 2.5): 7 상표 문구 · 25 변형 PS 접두어 · 11 URL(…/noto)일 때
name.names = [r for r in name.names if not (r.nameID in (7, 25) or (r.nameID == 11 and 'noto' in r.toUnicode().lower()))]
f.flavor = 'woff2'
f.save(dst)
```

check.py:
```python
import sys
from fontTools.ttLib import TTFont
BAD = ['source', 'pretendard', 'inter', 'm plus 1', 'noto']
total = 0
for path in sys.argv[1:]:
    f = TTFont(path)
    name = f['name']
    hits = []
    for rec in name.names:
        if rec.nameID in (0, 13, 14): continue
        s = rec.toUnicode()
        if rec.nameID == 5:
            s = s.split('; subset KS X 1001')[0] if False else s
        low = s.lower()
        for b in BAD:
            if b in low: hits.append((rec.nameID, rec.platformID, b, s))
    present = sorted({r.nameID for r in name.names if r.nameID in (0, 13, 14)})
    cmap = f.getBestCmap()
    hangul = sum(1 for c in cmap if 0xAC00 <= c <= 0xD7A3)
    print(f'{path.split("/")[-1]}: 금지어 {len(hits)}건 · nameID 0/13/14 존재 {present} · cmap {len(cmap)} (한글 음절 {hangul} + 그 밖 {len(cmap)-hangul})')
    for h in hits: print('  HIT', h)
    total += len(hits)
print(f'RFN 사후 검사 합계 {total}건')
```
