"""DS-2A-04 역할 팔레트 대비·보정 계산 (SPEC 3.3).

앱 `app/src/domain/contrast.ts`(`nearestCompliantColor`)·`colorFamily.ts`(`hexToHsl`)를 그대로 옮겼다:
HSL 명도만 0.1%p씩 양쪽으로 탐색, 같은 거리면 어두운 쪽, 목표 이상이 되는 첫 값.
v2 SPEC의 `darken_to`(0.5% 단계, 배경 집합 최저 4.6)와 다르다 — 이 수치가 Developer 테스트 기대값이 된다.
화면 자체 UI 토큰 대비는 v2 SPEC 3절 값을 그대로 쓴다(재계산 안 함).
C-3(어두운 카드 ink / primary)는 카드 톤이 dark인 팔레트만 검사한다 — 앱 `checkPaletteContrast`와 같다(r1 추가).
"역할별 보정" 절은 SPEC 3.3 보정 방법(역할마다 최저 대비 배경 기준 한 번 → 모든 검사 재계산 → 새 미달이면 충돌)을 재현한다.
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
CARD_TONE = {"ref-b": "dark"}  # app/src/fixtures/referenceComparisons.ts 43행 — 나머지는 light
ROLES = ("primary", "surface", "ink", "muted", "bg")


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


CHECKS = [  # (id, 설명, 전경 역할, 배경 역할, 어두운 카드만) — 전경 None = 흰 글자(ON_PRIMARY)
    ("C-1", "흰 글자 / primary (버튼·CTA)", None, 0, False),
    ("C-2", "ink / bg (본문)", 2, 4, False),
    ("C-3", "ink / primary (어두운 카드 글자)", 2, 0, True),
    ("C-4", "ink / surface (교차 배경 본문)", 2, 1, False),
    ("C-5", "muted / bg (보조 글자)", 3, 4, False),
]


def checks_of(name):
    dark = CARD_TONE.get(name) == "dark"
    return [c for c in CHECKS if dark or not c[4]]


def evaluate(name, pal, target):
    """[(id, 전경 hex, 배경 hex, 대비, 통과)]"""
    out = []
    for cid, _, fg, bg, _ in checks_of(name):
        fg_hex = WHITE if fg is None else pal[fg]
        r = ratio(fg_hex, pal[bg])
        out.append((cid, fg_hex, pal[bg], r, r >= target))
    return out


def propose(name, pal, target):
    """역할별 보정 제안: 보정 대상 역할 = C-1은 primary(면), 나머지는 글자 역할.
    그 역할이 놓이는 검사 중 미달이 있으면 최저 대비 쌍 기준으로 한 번 보정 → 모든 검사 재계산 → 새 미달이면 충돌."""
    before = {c[0]: c for c in evaluate(name, pal, target)}
    target_role = {}
    for cid, _, fg, bg, _ in checks_of(name):
        target_role[cid] = bg if fg is None else fg
    lines = []
    for role in sorted(set(target_role.values())):
        ids = [cid for cid, r in target_role.items() if r == role]
        failing = [before[cid] for cid in ids if not before[cid][4]]
        if not failing:
            continue
        cid, fg_hex, bg_hex, r, _ = min(failing, key=lambda c: c[3])
        if role == 0:  # primary 면을 흰 글자 기준으로
            fix, fr, d = nearest(bg_hex, WHITE, target)
        else:
            fix, fr, d = nearest(fg_hex, bg_hex, target)
        pal2 = tuple(fix if i == role else v for i, v in enumerate(pal))
        after = evaluate(name, pal2, target)
        broken = [(c[0], before[c[0]][3], c[3]) for c in after if before[c[0]][4] and not c[4]]
        still = [c[0] for c in after if not c[4] and target_role[c[0]] == role]
        head = f"{name} {ROLES[role]} {pal[role]}→{fix} ({cid} 기준 {fmt(r)}→{fmt(fr)}, 명도 {d:+.1f}%p, 대상 {'·'.join(ids)})"
        if broken:
            desc = ", ".join(f"{b[0]} {fmt(b[1])}→{fmt(b[2])}" for b in broken)
            lines.append(f"{head} **충돌**: {desc} — 보정값 쓰기 없음")
        elif still:
            lines.append(f"{head} **충돌**: 같은 역할 {'·'.join(still)} 여전히 미달 — 보정값 쓰기 없음")
        else:
            lines.append(f"{head} 통과")
    return lines


if __name__ == "__main__":
    for target in (4.5, 7.0):
        print(f"\n## 목표 {target}:1 — 검사별")
        for name, pal in PALETTES.items():
            for cid, fg_hex, bg_hex, r, ok in evaluate(name, pal, target):
                print(f"{name} {cid}: {fg_hex} on {bg_hex} = {fmt(r)} {'통과' if ok else '미달'}")
        print(f"\n## 목표 {target}:1 — 역할별 보정 (SPEC 3.3 표)")
        for name, pal in PALETTES.items():
            lines = propose(name, pal, target)
            print("\n".join(lines) if lines else f"{name} 보정 없음")
