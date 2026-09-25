"""DS-A11Y-01 대비 계산 (재현용). WCAG 2.x 상대 휘도, 알파는 sRGB 공간에서 배경 위에 합성(브라우저 합성과 같음).
실행: python3 docs/design/a11y-01/contrast_calc.py
"""
import re

def parse(c):
    c = c.strip()
    if c.startswith("#"):
        h = c[1:]
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 1.0)
    m = re.match(r"rgba?\(([^)]*)\)", c)
    p = [x.strip() for x in m.group(1).split(",")]
    return (int(p[0]), int(p[1]), int(p[2]), float(p[3]) if len(p) > 3 else 1.0)

def over(fg, bg):
    """fg(알파 가능)를 불투명 bg 위에 합성 → 불투명 (r,g,b). 반올림은 브라우저처럼 8비트."""
    r, g, b, a = parse(fg) if isinstance(fg, str) else fg
    R, G, B = bg
    return tuple(round(a * x + (1 - a) * y) for x, y in ((r, R), (g, G), (b, B)))

def solid(c):
    r, g, b, a = parse(c)
    assert a == 1.0, c
    return (r, g, b)

def lum(rgb):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(v) for v in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)

def hx(rgb):
    return "#%02x%02x%02x" % rgb

def floor2(x):
    return int(x * 100) / 100

LIGHT_BG = {
    "white (background-normal·surface-elevated)": "#ffffff",
    "#f7f7f8 (background-alternative·surface-sunken)": "#f7f7f8",
}
DARK_BG = {
    "#1b1c1e (background-normal)": "#1b1c1e",
    "#0f0f10 (background-alternative)": "#0f0f10",
    "#26282b (surface-elevated)": "#26282b",
    "#141416 (surface-sunken)": "#141416",
}

def backgrounds(bases, fills):
    """기본 면 + 각 면 위 fill 합성 면."""
    out = {}
    for name, c in bases.items():
        base = solid(c)
        out[name] = base
        for fname, f in fills.items():
            out[f"{fname} on {name.split(' ')[0]}"] = over(f, base)
    return out

LIGHT_FILLS = {"fill-normal": "rgba(112,115,124,0.08)", "fill-strong": "rgba(112,115,124,0.16)"}
DARK_FILLS = {"fill-normal": "rgba(112,115,124,0.22)", "fill-strong": "rgba(112,115,124,0.28)"}
LIGHT = backgrounds(LIGHT_BG, LIGHT_FILLS)
LIGHT.update({
    "status-informative-bg #eaf2fe": solid("#eaf2fe"),
    "status-negative-bg #ffecec": solid("#ffecec"),
    "status-cautionary-bg #fff3e0": solid("#fff3e0"),
    "status-positive-bg #ebffee": solid("#ebffee"),
})
DARK = backgrounds(DARK_BG, DARK_FILLS)
DARK.update({
    f"{n} on #26282b": over(c, solid("#26282b"))
    for n, c in {
        "status-informative-bg": "rgba(51,102,255,0.18)",
        "status-negative-bg": "rgba(255,66,66,0.16)",
        "status-cautionary-bg": "rgba(255,146,0,0.16)",
        "status-positive-bg": "rgba(0,191,64,0.16)",
    }.items()
})

def table(title, fgs, bgs):
    print(f"\n## {title}")
    for fname, fg in fgs.items():
        worst = None
        for bname, bg in bgs.items():
            comp = over(fg, bg)
            r = ratio(comp, bg)
            worst = r if worst is None or r < worst else worst
            print(f"  {fname:34s} on {bname:52s} {hx(comp)} / {hx(bg)} = {floor2(r):5.2f}")
        print(f"  -> {fname} 최저 {floor2(worst):.2f}")

def row(label, fg, bgs):
    rs = [ratio(over(fg, bg), bg) for bg in bgs.values()]
    print(f"| {label} | " + " | ".join(f"{floor2(r):.2f}" for r in rs) + f" | **{floor2(min(rs)):.2f}** |")

def header(title, bgs):
    print(f"\n### {title}")
    print("| 전경 | " + " | ".join(bgs.keys()) + " | 최저 |")
    print("|---" * (len(bgs) + 2) + "|")

if __name__ == "__main__":
    header("라이트 — 글자 토큰 (현재 → 제안)", LIGHT)
    for label, fg in [
        ("label-normal #171719", "#171719"),
        ("label-neutral rgba(46,47,51,.88)", "rgba(46,47,51,0.88)"),
        ("label-alternative 현재 rgba(55,56,60,.61)", "rgba(55,56,60,0.61)"),
        ("label-alternative 제안 rgba(55,56,60,.76)", "rgba(55,56,60,0.76)"),
        ("label-assistive 현재 rgba(55,56,60,.28)", "rgba(55,56,60,0.28)"),
        ("status-negative 현재 #ff4242", "#ff4242"),
        ("status-negative-text 제안 #c90000", "#c90000"),
        ("status-positive 현재 #00bf40", "#00bf40"),
        ("status-positive-text 제안 #007326", "#007326"),
        ("status-cautionary 현재 #ff9200", "#ff9200"),
        ("status-cautionary-text 제안 #915300", "#915300"),
    ]:
        row(label, fg, LIGHT)
    header("다크 — 글자 토큰 (현재 → 제안)", DARK)
    for label, fg in [
        ("label-normal #f7f7f7", "#f7f7f7"),
        ("label-neutral rgba(194,196,200,.88)", "rgba(194,196,200,0.88)"),
        ("label-alternative 현재 rgba(174,176,182,.61)", "rgba(174,176,182,0.61)"),
        ("label-alternative 제안 rgba(194,196,200,.80)", "rgba(194,196,200,0.80)"),
        ("label-assistive 현재 rgba(174,176,182,.28)", "rgba(174,176,182,0.28)"),
        ("status-negative 현재 #ff4242", "#ff4242"),
        ("status-negative-text 제안 #ff8585", "#ff8585"),
        ("status-positive 현재 #00bf40", "#00bf40"),
        ("status-positive-text 제안 #00cc44", "#00cc44"),
        ("status-cautionary(-text) #ff9200", "#ff9200"),
    ]:
        row(label, fg, DARK)
    INV = {"#2c2c2c 바": solid("#2c2c2c"), "#1e1e1e hover": solid("#1e1e1e")}
    for a in (0.12, 0.16):
        INV[f"흰색 {a} 합성"] = over(f"rgba(255,255,255,{a})", solid("#2c2c2c"))
    INV["fill-normal 합성(현재 초안 보기 면)"] = over("rgba(112,115,124,0.08)", solid("#2c2c2c"))
    header("라이트 역상 면 (--surface-inverse #2c2c2c)", INV)
    for label, fg in [
        ("on-surface-inverse #fff", "#ffffff"),
        ("inverse-label-alternative 제안 흰색 .72", "rgba(255,255,255,0.72)"),
        ("opacity-70 흰색(트레이 현재)", "rgba(255,255,255,0.70)"),
        ("inverse-label-disable 제안 흰색 .40(비활성, 예외)", "rgba(255,255,255,0.40)"),
        ("label-normal #171719 (D-QA01 현재)", "#171719"),
        ("blue-70 #69a5ff (트레이 개수)", "#69a5ff"),
        ("focus-ring 합성색 rgba(51,102,255,.28)", "rgba(51,102,255,0.28)"),
    ]:
        row(label, fg, INV)
    DINV = {"#f7f7f8 바": solid("#f7f7f8"), "#ffffff hover": solid("#ffffff")}
    for a in (0.12, 0.16):
        DINV[f"#1b1c1e {a} 합성"] = over(f"rgba(27,28,30,{a})", solid("#f7f7f8"))
    header("다크 역상 면 (--surface-inverse #f7f7f8)", DINV)
    for label, fg in [
        ("on-surface-inverse #1b1c1e", "#1b1c1e"),
        ("inverse-label-alternative 제안 #1b1c1e .72", "rgba(27,28,30,0.72)"),
    ]:
        row(label, fg, DINV)
    print("\n### 단일 쌍")
    pairs = [
        ("primary #3366ff 버튼 면 vs 역상 바 #2c2c2c (UI 경계)", "#3366ff", "#2c2c2c"),
        ("on-primary #fff on primary #3366ff", "#ffffff", "#3366ff"),
        ("focus-ring 합성색 on white", hx(over("rgba(51,102,255,0.28)", (255, 255, 255))), "#ffffff"),
        ("Callout negative 아이콘 #ff4242 on #ffecec", "#ff4242", "#ffecec"),
        ("Callout warning 아이콘 #ff9200 on #fff3e0", "#ff9200", "#fff3e0"),
        ("Callout info 아이콘 #3366ff on #eaf2fe", "#3366ff", "#eaf2fe"),
        ("Tag red: accent-red #e52222 on #ffecec", "#e52222", "#ffecec"),
        ("Tag green: accent-green #009632 on #ebffee", "#009632", "#ebffee"),
        ("Tag orange: accent-orange #d47800 on #fff3e0", "#d47800", "#fff3e0"),
        ("Tag blue: accent-blue #005eeb on #eaf2fe", "#005eeb", "#eaf2fe"),
        ("Tag violet: accent-violet #5b37ed on #f0ecfe", "#5b37ed", "#f0ecfe"),
        ("Tag neutral: label-neutral on fill-strong/white", hx(over("rgba(46,47,51,0.88)", over("rgba(112,115,124,0.16)", (255,255,255)))), hx(over("rgba(112,115,124,0.16)", (255,255,255)))),
    ]
    for label, a, b in pairs:
        print(f"| {label} | {floor2(ratio(solid(a), solid(b))):.2f} |")
    print("\n합성 hex: fill-normal on white/#f7f7f8 =", hx(LIGHT["fill-normal on white"]), hx(LIGHT["fill-normal on #f7f7f8"]),
          "/ fill-strong on white/#f7f7f8 =", hx(LIGHT["fill-strong on white"]), hx(LIGHT["fill-strong on #f7f7f8"]),
          "/ label-neutral on white =", hx(over("rgba(46,47,51,0.88)", (255, 255, 255))),
          "/ label-alternative 현재 on white =", hx(over("rgba(55,56,60,0.61)", (255, 255, 255))))
    old = "rgba(174,176,182,0.92)"
    print("다크 기존 베이스 alpha .92: on #1b1c1e =", floor2(ratio(over(old, solid("#1b1c1e")), solid("#1b1c1e"))),
          "/ 최저 =", floor2(min(ratio(over(old, bg), bg) for bg in DARK.values())))
    print("\n합성 hex: alt 제안 on white =", hx(over("rgba(55,56,60,0.76)", (255,255,255))), "/ on #f7f7f8 =", hx(over("rgba(55,56,60,0.76)", solid("#f7f7f8"))))
