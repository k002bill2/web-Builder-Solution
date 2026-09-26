"""DS-2A-05 편집기 새 조합 대비 계산 (SPEC 7절).

토큰 값은 손으로 옮기지 않고 `app/src/styles/tokens/colors.css`·`brand.css`의 **라이트(:root) 첫 선언**을 읽는다(읽기 전용).
`var(--x)` 참조는 따라가고, `rgba(r,g,b,a)`는 놓이는 면 위에 합성한다. v2 SPEC 3절에서 이미 계산한 조합은 다시 내지 않고,
편집기에서 처음 쓰는 조합만 계산한다. 다크는 앱에 켜는 코드가 없어(v2 SPEC 3.1) 토큰 단위 테스트 몫이다.
실행: python3 -B docs/design/2a-05/contrast_calc.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[3]
TOKEN_FILES = [ROOT / "app/src/styles/tokens/brand.css", ROOT / "app/src/styles/tokens/colors.css"]


def light_tokens():
    tokens = {}
    for f in TOKEN_FILES:
        text = f.read_text(encoding="utf-8")
        start = re.search(r"^:root\s*\{", text, re.M).end()  # 줄 머리의 :root 블록 = 라이트 (주석 속 ':root' 제외)
        block = text[start:text.index("\n}", start)]
        block = re.sub(r"/\*.*?\*/", "", block, flags=re.S)
        for name, value in re.findall(r"(--[\w-]+)\s*:\s*([^;]+);", block):
            tokens.setdefault(name, value.strip())
    return tokens


TOK = light_tokens()


def resolve(name):
    v = TOK[name]
    m = re.fullmatch(r"var\((--[\w-]+)\)", v)
    return resolve(m.group(1)) if m else v


def parse(value, over="#ffffff"):
    value = value.strip()
    if value.startswith("#"):
        return value.lower()
    m = re.fullmatch(r"rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)", value)
    if not m:
        raise ValueError(value)
    r, g, b, a = int(m[1]), int(m[2]), int(m[3]), float(m[4])
    base = [int(over[i:i + 2], 16) for i in (1, 3, 5)]
    mixed = [round(c * a + o * (1 - a)) for c, o in zip((r, g, b), base)]
    return "#" + "".join(f"{c:02x}" for c in mixed)


def color(token, over="#ffffff"):
    return parse(resolve(token), over)


def channel(v):
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def lum(h):
    r, g, b = (channel(int(h[i:i + 2], 16) / 255) for i in (1, 3, 5))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    hi, lo = sorted((lum(a), lum(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def fmt(x):  # formatRatio: 버림 2자리 (v2 SPEC 표기와 맞춤)
    return f"{int(x * 100) / 100:.2f}"


WHITE = color("--background-normal")
MUTED = color("--background-alternative")
PCONT = color("--primary-container")

ROWS = [
    # (ID, 전경 토큰, 면 이름, 면 hex, 기준, 용도)
    ("N-1", "--status-cautionary-text", "흰 간격", WHITE, 3.0, "캔버스 경고 2중 테두리 바깥 2px (B-03)"),
    ("N-2", "--status-negative-text", "흰 간격", WHITE, 3.0, "캔버스 차단 2중 테두리 · 상한 초과 입력 테두리"),
    ("N-3", "--status-cautionary-text", "muted 캔버스 바탕", MUTED, 3.0, "[참고] 간격 없이 캔버스 바탕과 맞닿을 때"),
    ("N-4", "--status-negative-text", "muted 캔버스 바탕", MUTED, 3.0, "[참고] 〃"),
    ("N-5", "--primary", "primary-container 선택 줄", PCONT, 3.0, "선택 섹션 왼쪽 막대 (B-01)"),
    ("N-6", "--primary", "흰 면", WHITE, 3.0, "선택 막대가 줄 밖 흰 면과 맞닿는 끝"),
    ("N-7", "--label-normal", "primary-container 선택 줄", PCONT, 4.5, "선택 줄 섹션 이름 (700)"),
    ("N-8", "--label-alternative", "primary-container 선택 줄", PCONT, 4.5, "선택 줄 변형 이름표 캡션"),
    ("N-9", "--status-cautionary-text", "흰 면", WHITE, 4.5, "캔버스 배지 글자 '경고 1' · 문제 문장"),
    ("N-10", "--status-negative-text", "흰 면", WHITE, 4.5, "캔버스 배지 글자 '차단 1' · 상한 초과 문장"),
    ("N-11", "--on-primary", "primary", color("--primary"), 4.5, "캔버스 선택 라벨 칩 12px·700 (B-12)"),
    ("N-12", "--label-alternative", "muted 캔버스 바탕", MUTED, 4.5, "'구조 미리보기' 캡션 · 축소 보기 캡션"),
]


def main():
    print("토큰(라이트, 파일에서 읽음):")
    for t in ("--background-normal", "--background-alternative", "--primary", "--primary-container",
              "--on-primary", "--label-normal", "--label-alternative",
              "--status-cautionary-text", "--status-negative-text", "--line-strong"):
        print(f"  {t} = {resolve(t)}" + (f" → {color(t)} (흰 면 합성)" if "rgba" in resolve(t) else ""))
    print()
    print("| ID | 전경 | 면 | 대비 | 기준 | 판정 | 용도 |")
    print("|---|---|---|---|---|---|---|")
    for rid, fg, bg_name, bg, need, use in ROWS:
        r = ratio(color(fg, bg), bg)
        verdict = "통과" if r >= need else "미달"
        print(f"| {rid} | `{fg}` {color(fg, bg)} | {bg_name} {bg} | {fmt(r)} | {need} | {verdict} | {use} |")
    # 스위치 꺼짐 트랙 = line-strong(rgba) 합성 — 흰 면 위
    track = color("--line-strong", WHITE)
    print(f"| N-13 | `--line-strong` {track} (흰 면 합성) | 흰 면 {WHITE} | {fmt(ratio(track, WHITE))} | 3.0 | "
          f"{'통과' if ratio(track, WHITE) >= 3 else '미달'} | 스위치 꺼짐 트랙 경계 (v2 Q4 값 재사용) |")


if __name__ == "__main__":
    main()
