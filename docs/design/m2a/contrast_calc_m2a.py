#!/usr/bin/env python3
"""M2A-0 킷 대비 근거 (부록 A, L2).

재현: python3 -B docs/design/m2a/contrast_calc_m2a.py
- 픽스처 팔레트를 손으로 옮기지 않고 app/src/fixtures/referenceDetails.ts 에서 읽는다(읽기 전용).
- 계산식은 app/src/domain/contrast.ts 와 같다(WCAG 2.x 상대 휘도). 표기는 버림 2자리.
- A-1: 킷 허용 조합(C-1~C-5)  A-2: 금지 조합이 실제로 미달할 수 있다는 증거  M-1: 폴백 표식 고정색.
"""
import math
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[3]
FIXTURE = ROOT / "app/src/fixtures/referenceDetails.ts"
ON_PRIMARY = "#FFFFFF"
MARKER_FACE = "#1A1A1A"  # 폴백 표식 면 (K3 3.1 marker-face)
MARKER_TEXT = "#FFFFFF"  # 폴백 표식 글자 (K3 3.1 marker-text)


def channel(v: float) -> float:
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def lum(hex_: str) -> float:
    r, g, b = (channel(int(hex_[i:i + 2], 16) / 255) for i in (1, 3, 5))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a: str, b: str) -> float:
    hi, lo = sorted((lum(a), lum(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def floor2(x: float) -> str:
    return f"{math.floor(x * 100) / 100:.2f}"


def palettes():
    text = FIXTURE.read_text(encoding="utf-8")
    ids = [(m.start(), m.group(1)) for m in re.finditer(r'^\s*"(ref-[a-z0-9-]+)":\s*\{', text, re.M)]
    out = []
    for m in re.finditer(r"palette:\s*\[(.*?)\]", text, re.S):
        owner = [i for pos, i in ids if pos < m.start()]
        roles = dict(re.findall(r'role:\s*"(\w+)",\s*hex:\s*"(#[0-9A-Fa-f]{6})"', m.group(1)))
        if len(roles) == 5:
            out.append((owner[-1] if owner else "?", roles))
    return out


ALLOWED = [  # (검사, 글자, 면, 킷 쓰임)
    ("C-1", "on-primary", "primary", "CTA·hero 패널·보내기 버튼 / 뒤집기 hero CTA"),
    ("C-2", "ink", "bg", "base 본문 / 뒤집기 footer"),
    ("C-3", "ink", "primary", "어두운 카드(card tone dark)"),
    ("C-4", "ink", "surface", "alt 섹션·밝은 카드"),
    ("C-5", "muted", "bg", "base 보조 글자"),
]
FORBIDDEN = [  # 킷이 쓰지 않는 조합 (0.3)
    ("X-1", "bg", "primary", "와이어프레임 ON_PRIMARY(bg 글자/primary 면)"),
    ("X-2", "muted", "surface", "alt 섹션·카드의 muted 글자"),
    ("X-3", "primary", "bg", "primary 글자 링크"),
    ("X-4", "muted", "ink", "footer muted 글자"),
]


def hex_of(roles, role):
    return ON_PRIMARY if role == "on-primary" else roles[role]


def main():
    print("## A-1 허용 조합 (게이트 C-1~C-5와 같은 쌍) — 픽스처 팔레트별")
    print("| 팔레트 | " + " | ".join(c for c, *_ in ALLOWED) + " |")
    print("|---" * (len(ALLOWED) + 1) + "|")
    for name, roles in palettes():
        cells = [floor2(ratio(hex_of(roles, fg), hex_of(roles, bg))) for _, fg, bg, _ in ALLOWED]
        print(f"| {name} | " + " | ".join(cells) + " |")
    print("\n## A-2 금지 조합 — 게이트 밖이라 미달해도 막히지 않는다 (4.5 미만 = 미달)")
    print("| 팔레트 | " + " | ".join(c for c, *_ in FORBIDDEN) + " |")
    print("|---" * (len(FORBIDDEN) + 1) + "|")
    for name, roles in palettes():
        cells = []
        for _, fg, bg, _ in FORBIDDEN:
            r = ratio(hex_of(roles, fg), hex_of(roles, bg))
            cells.append(floor2(r) + (" 미달" if r < 4.5 else ""))
        print(f"| {name} | " + " | ".join(cells) + " |")
    print("\n## M-1 폴백 표식 고정색")
    r = ratio(MARKER_TEXT, MARKER_FACE)
    print(f"| M-1 | marker-text {MARKER_TEXT} | marker-face {MARKER_FACE} | {floor2(r)} | 기준 4.5 | {'통과' if r >= 4.5 else '미달'} |")


if __name__ == "__main__":
    main()
