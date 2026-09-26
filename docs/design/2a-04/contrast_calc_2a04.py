"""DS-2A-04 역할 팔레트 대비·보정 계산 (SPEC 3.3).

앱 `app/src/domain/contrast.ts`(`nearestCompliantColor`)·`colorFamily.ts`(`hexToHsl`)를 그대로 옮겼다:
HSL 명도만 0.1%p씩 양쪽으로 탐색, 같은 거리면 어두운 쪽, 목표 이상이 되는 첫 값.
v2 SPEC의 `darken_to`(0.5% 단계, 배경 집합 최저 4.6)와 다르다 — 이 수치가 Developer 테스트 기대값이 된다.
화면 자체 UI 토큰 대비는 v2 SPEC 3절 값을 그대로 쓴다(재계산 안 함).
실행: python3 -B docs/design/2a-04/contrast_calc_2a04.py
"""
import math

PALETTES = {  # app/src/fixtures/referenceDetails.ts 역할 팔레트 (primary, surface, ink, muted, bg)
    "ref-a": ("#8B5E3C", "#F3E9DD", "#2C2C2C", "#9A7B63", "#FFFFFF"),
    "ref-b": ("#1F1F1F", "#E8E4DF", "#C9A96E", "#8A847C", "#FFFFFF"),
    "ref-c": ("#1F5FBF", "#EAF2FE", "#2C2C2C", "#6B8CC7", "#FFFFFF"),
    "ref-d": ("#00A884", "#E6FFF6", "#111111", "#5FCFB4", "#FFFFFF"),
    "ref-e": ("#1B1C1E", "#F7F7F8", "#6541F2", "#70737C", "#FFFFFF"),
    "ref-f": ("#D47800", "#FFF3E0", "#2E2F33", "#B98A5A", "#FFFFFF"),
}
WHITE = "#FFFFFF"


def channel(v):
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def lum(h):
    r, g, b = (channel(int(h[i:i + 2], 16) / 255) for i in (1, 3, 5))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    hi, lo = sorted((lum(a), lum(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def fmt(x):  # formatRatio: 버림 1자리
    return f"{math.floor(x * 10) / 10:.1f}"


def hex_to_hsl(h):
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))
    mx, mn = max(r, g, b), min(r, g, b)
    l = (mx + mn) / 2
    d = mx - mn
    if d == 0:
        return 0.0, 0.0, l * 100
    s = d / (1 - abs(2 * l - 1))
    if mx == r:
        sector = math.fmod((g - b) / d, 6)
    elif mx == g:
        sector = (b - r) / d + 2
    else:
        sector = (r - g) / d + 4
    return math.fmod(sector * 60 + 360, 360), s * 100, l * 100


def hsl_to_hex(h, s, l):
    sat, light = s / 100, l / 100
    a = sat * min(light, 1 - light)

    def f(n):
        k = math.fmod(n + h / 30, 12)
        return light - a * max(-1, min(k - 3, 9 - k, 1))
    # JS Math.round(x) = floor(x + 0.5)
    return "#" + "".join(f"{math.floor(f(n) * 255 + 0.5):02x}" for n in (0, 8, 4)).upper()


def shift(h, delta):
    hh, s, l = hex_to_hsl(h)
    return hsl_to_hex(hh, s, min(100, max(0, l + delta)))


def nearest(h, against, target=4.5):
    h = h.upper()
    k = 0
    while k * 0.1 <= 100:
        for delta in ([0] if k == 0 else [-k * 0.1, k * 0.1]):
            cand = h if delta == 0 else shift(h, delta)
            r = ratio(cand, against)
            if r >= target:
                return cand, r, delta
        k += 1
    raise ValueError


CHECKS = [  # (id, 설명, 전경 역할, 배경 역할) — primary 글자는 흰색(ON_PRIMARY)
    ("C-1", "흰 글자 / primary (버튼·CTA)", None, 0),
    ("C-2", "ink / bg (본문)", 2, 4),
    ("C-4", "ink / surface (교차 배경 본문)", 2, 1),
    ("C-5", "muted / bg (보조 글자)", 3, 4),
]

if __name__ == "__main__":
    for target in (4.5, 7.0):
        print(f"\n## 목표 {target}:1")
        for name, pal in PALETTES.items():
            for cid, desc, fg, bg in CHECKS:
                fg_hex = WHITE if fg is None else pal[fg]
                bg_hex = pal[bg]
                r = ratio(fg_hex, bg_hex)
                if r >= target:
                    print(f"{name} {cid} {desc}: {fg_hex} on {bg_hex} = {fmt(r)} 통과")
                    continue
                # 보정 대상 = 사용자가 고른 쪽이 아닌 '글자 역할'. C-1은 primary(면)를 옮긴다(보드 C-1과 같음)
                if fg is None:
                    fix, fr, d = nearest(bg_hex, WHITE, target)
                    print(f"{name} {cid} {desc}: {fmt(r)} 미달 → primary {bg_hex}→{fix} ({fmt(fr)}, 명도 {d:+.1f}%p)")
                else:
                    fix, fr, d = nearest(fg_hex, bg_hex, target)
                    print(f"{name} {cid} {desc}: {fmt(r)} 미달 → {fg_hex}→{fix} ({fmt(fr)}, 명도 {d:+.1f}%p)")
