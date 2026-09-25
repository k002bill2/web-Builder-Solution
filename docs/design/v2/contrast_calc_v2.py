"""DS-V2-01 대비 계산 (재현용). DS-A11Y-01 방법 그대로: WCAG 2.x 상대 휘도, 알파는 sRGB 8비트로 배경 위에 합성.
계산 함수는 A11Y-01 스크립트(docs/design/a11y-01/contrast_calc.py)를 import해 재사용한다.
실행: python3 docs/design/v2/contrast_calc_v2.py
입력 값 출처: design/claude-design-handoff-v2/project/_ds/<dashboard-ds>/_ds_bundle.css 의 :root · .dark 블록 (2026-09-26 사본).
"""
import colorsys
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "a11y-01"))
from contrast_calc import floor2, hx, over, parse, ratio, solid  # noqa: E402

# ---------------------------------------------------------------- 배경 집합 (A11Y-01 1절을 v2 표면으로 갱신)
NEUTRAL_BASE_L = "31,54,40"  # v2 --border 계열 중성 베이스 rgb(31,54,40)
LIGHT_FILL = {"fill-normal": f"rgba({NEUTRAL_BASE_L},0.06)", "fill-strong": f"rgba({NEUTRAL_BASE_L},0.12)"}
DARK_FILL = {"fill-normal": "rgba(255,255,255,0.06)", "fill-strong": "rgba(255,255,255,0.10)"}


def with_fills(bases, fills):
    out = {}
    for name, c in bases.items():
        out[name] = solid(c)
        for fname, f in fills.items():
            out[f"{fname}/{name}"] = over(f, solid(c))
    return out


PRIMARY_L = "#5a5fe8"
PRIMARY_CONTAINER_L = hx(over("rgba(90,95,232,0.08)", (255, 255, 255)))  # v2 선택 셀 color-mix 7%에 가까운 8% 고정값

LIGHT = with_fills({"white(bg·card)": "#ffffff", "muted #f0f3ee": "#f0f3ee"}, LIGHT_FILL)
LIGHT.update({
    "success-soft #def7f0": solid("#def7f0"),
    "warning-soft #fef3da": solid("#fef3da"),
    "danger-soft #ffe7df": solid("#ffe7df"),
    "info-soft #f0f7ff": solid("#f0f7ff"),
    f"primary-container {PRIMARY_CONTAINER_L}": solid(PRIMARY_CONTAINER_L),
})

DARK_BASES = {"bg #0f1310": "#0f1310", "card #181d17": "#181d17", "raised #1d231c": "#1d231c", "muted #1f261d": "#1f261d"}
DARK = with_fills(DARK_BASES, DARK_FILL)
DARK.update({
    f"{n}/card": over(c, solid("#181d17"))
    for n, c in {
        "success-soft": "rgba(51,221,184,0.16)",
        "warning-soft": "rgba(251,180,36,0.16)",
        "danger-soft": "rgba(255,107,66,0.18)",
        "info-soft": "rgba(96,165,250,0.16)",
        "primary-container": "rgba(129,140,248,0.16)",
    }.items()
})

INV_L = {"inverse #1a2620": solid("#1a2620"), "inverse-hover #111a15": solid("#111a15")}
for a in (0.12, 0.16):
    INV_L[f"white {a}/inverse"] = over(f"rgba(255,255,255,{a})", solid("#1a2620"))
INV_D = {"inverse #e6ebe2": solid("#e6ebe2"), "inverse-hover #f4f7f2": solid("#f4f7f2")}
for a in (0.12, 0.16):
    INV_D[f"bg {a}/inverse"] = over(f"rgba(15,19,16,{a})", solid("#e6ebe2"))


def worst(fg, bgs):
    return min(ratio(over(fg, bg), bg) for bg in bgs.values())


def header(title, bgs):
    print(f"\n### {title}")
    print("| 전경 | " + " | ".join(bgs.keys()) + " | 최저 |")
    print("|---" * (len(bgs) + 2) + "|")


def row(label, fg, bgs, need):
    rs = [ratio(over(fg, bg), bg) for bg in bgs.values()]
    mark = "" if min(rs) >= need else " ✗"
    print(f"| {label} | " + " | ".join(f"{floor2(r):.2f}" for r in rs) + f" | **{floor2(min(rs)):.2f}**{mark} |")


def darken_to(hexv, bgs, target, lighter=False):
    """같은 색상·채도(HLS)에서 명도만 0.5%씩 움직여 모든 배경 최저 ≥ target이 되는 첫 값."""
    r, g, b, _ = parse(hexv)
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    step = 0.005 if lighter else -0.005
    while 0 <= l <= 1:
        c = tuple(round(v * 255) for v in colorsys.hls_to_rgb(h, l, s))
        if worst(hx(c), bgs) >= target:
            return hx(c)
        l += step
    return None


def hierarchy(title, bgs, ladder):
    """같은 배경에서 normal > neutral > alternative 이고 alternative ≥ 4.5 인지 (A11Y-AC-03 방법)."""
    ok = all(
        ratio(over(ladder[0], bg), bg) > ratio(over(ladder[1], bg), bg) > ratio(over(ladder[2], bg), bg) >= 4.5
        for bg in bgs.values()
    )
    white = next(iter(bgs.values()))
    steps = " → ".join(f"{floor2(ratio(over(c, white), white)):.2f}" for c in ladder)
    print(f"\n위계 {title}: {'모든 배경에서 성립' if ok else '**깨짐**'} · 첫 배경 사다리 {steps}")


# v2 원값 (_ds_bundle.css) 과 제안값. 제안값은 darken_to(…, 4.6) 탐색 결과(아래 '보정 탐색' 출력)를 옮긴 것
LIGHT_TEXT_V2 = [
    ("v2 foreground #1a2620", "#1a2620"),
    ("v2 muted-foreground #5e6b60", "#5e6b60"),
    ("v2 caption #66726a", "#66726a"),
    ("v2 success-text #067562", "#067562"),
    ("v2 warning-text #8a5a00", "#8a5a00"),
    ("v2 danger-text #c7340f", "#c7340f"),
    ("v2 info-text #1d5fd8", "#1d5fd8"),
    ("v2 primary #5a5fe8 (글자로 쓸 때)", PRIMARY_L),
]
LIGHT_TEXT_FINAL = [
    ("**제안** label-normal #1a2620 (그대로)", "#1a2620"),
    ("**제안** label-neutral #4c574e", "#4c574e"),
    ("**제안** label-alternative #56615a", "#56615a"),
    ("**제안** status-positive-text #066b5a", "#066b5a"),
    ("**제안** status-cautionary-text #825500", "#825500"),
    ("**제안** status-negative-text #af2e0d", "#af2e0d"),
    ("**제안** status-informative-text #1b58c8", "#1b58c8"),
    ("**제안(Q)** primary-text #4147e5", "#4147e5"),
]
DARK_TEXT_V2 = [
    ("v2 foreground #e6ebe2", "#e6ebe2"),
    ("v2 muted-foreground #9aa694", "#9aa694"),
    ("v2 caption #828e7d", "#828e7d"),
    ("v2 success-text #33ddb8", "#33ddb8"),
    ("v2 warning-text #fbc04a", "#fbc04a"),
    ("v2 danger-text #ff7e59", "#ff7e59"),
    ("v2 info-text #60a5fa", "#60a5fa"),
    ("v2 primary #818cf8 (글자로 쓸 때)", "#818cf8"),
]
DARK_TEXT_FINAL = [
    ("**제안** label-normal #e6ebe2 (그대로)", "#e6ebe2"),
    ("**제안** label-neutral #acb6a7", "#acb6a7"),
    ("**제안** label-alternative #9fa89b", "#9fa89b"),
    ("**제안** status-positive-text #33ddb8 (그대로)", "#33ddb8"),
    ("**제안** status-cautionary-text #fbc04a (그대로)", "#fbc04a"),
    ("**제안** status-negative-text #ff825e", "#ff825e"),
    ("**제안** status-informative-text #65a8fa", "#65a8fa"),
    ("**제안(Q)** primary-text #949ef9", "#949ef9"),
]
LIGHT_LADDER = ("#1a2620", "#4c574e", "#56615a")
DARK_LADDER = ("#e6ebe2", "#acb6a7", "#9fa89b")


def alpha_to(base_rgb, bgs, target):
    for i in range(1, 101):
        c = f"rgba({base_rgb},{i / 100:.2f})"
        if worst(c, bgs) >= target:
            return c
    return None


if __name__ == "__main__":
    TEXT, UI = 4.5, 3.0
    MARGIN = 4.6  # A11Y-01 0절: 계산(L2)과 실측(L1) 차이 대비 0.1 이상 여유

    header("라이트 — 글자 (4.5:1) · v2 원값 → 제안", LIGHT)
    for label, fg in LIGHT_TEXT_V2 + LIGHT_TEXT_FINAL:
        row(label, fg, LIGHT, TEXT)
    hierarchy("라이트", LIGHT, LIGHT_LADDER)

    header("다크 — 글자 (4.5:1) · v2 원값 → 제안", DARK)
    for label, fg in DARK_TEXT_V2 + DARK_TEXT_FINAL:
        row(label, fg, DARK, TEXT)
    hierarchy("다크", DARK, DARK_LADDER)

    header("라이트 역상 면 (--surface-inverse = v2 --foreground #1a2620, 플로팅 필·요약 바)", INV_L)
    for label, fg in [
        ("on-surface-inverse #fff", "#ffffff"),
        ("inverse-label-alternative 흰 .72", "rgba(255,255,255,0.72)"),
        ("목업 opacity .5 (\"/ 6\")", "rgba(255,255,255,0.5)"),
    ]:
        row(label, fg, INV_L, TEXT)
    header("다크 역상 면 (--surface-inverse = 다크 --foreground #e6ebe2)", INV_D)
    for label, fg in [
        ("on-surface-inverse #0f1310", "#0f1310"),
        ("inverse-label-alternative #0f1310 .72", "rgba(15,19,16,0.72)"),
        ("목업 그대로 흰 글자 #fff", "#ffffff"),
    ]:
        row(label, fg, INV_D, TEXT)

    print("\n### 단일 쌍 (글자 4.5 · UI 3.0)")
    pairs = [
        ("on-primary #fff on primary #5a5fe8 (라이트 버튼)", "#ffffff", PRIMARY_L, TEXT),
        ("on-primary #fff on primary-hover #4f46e5", "#ffffff", "#4f46e5", TEXT),
        ("on-primary #fff on pressed #4338ca", "#ffffff", "#4338ca", TEXT),
        ("다크 primary-foreground #10142e on #818cf8", "#10142e", "#818cf8", TEXT),
        ("다크 #fff on #818cf8 (우리 현재 on-primary 유지 시)", "#ffffff", "#818cf8", TEXT),
        ("다크 #10142e on hover #a5b4fc", "#10142e", "#a5b4fc", TEXT),
        ("Tag primary(v2): primary #5a5fe8 on primary-container", PRIMARY_L, PRIMARY_CONTAINER_L, TEXT),
        ("Tag primary(제안): primary-text #4147e5 on primary-container", "#4147e5", PRIMARY_CONTAINER_L, TEXT),
        ("Tag success(제안): #066b5a on #def7f0", "#066b5a", "#def7f0", TEXT),
        ("Tag warning(제안): #825500 on #fef3da", "#825500", "#fef3da", TEXT),
        ("Tag danger(v2): #c7340f on #ffe7df", "#c7340f", "#ffe7df", TEXT),
        ("Tag danger(제안): #af2e0d on #ffe7df", "#af2e0d", "#ffe7df", TEXT),
        ("Tag info(제안): #1b58c8 on #f0f7ff", "#1b58c8", "#f0f7ff", TEXT),
        ("Tag neutral(v2): #5e6b60 on fill-strong/white", "#5e6b60", hx(LIGHT["fill-strong/white(bg·card)"]), TEXT),
        ("Tag neutral(제안): #4c574e on fill-strong/white", "#4c574e", hx(LIGHT["fill-strong/white(bg·card)"]), TEXT),
        ("열 문자 배지(목업): #fff on 레퍼런스 대표색 #d47800", "#ffffff", "#d47800", TEXT),
        ("열 문자 배지(목업): #fff on 레퍼런스 대표색 #00a884", "#ffffff", "#00a884", TEXT),
        ("UI primary #5a5fe8 vs white (체크박스·선택 표시)", PRIMARY_L, "#ffffff", UI),
        ("UI primary #5a5fe8 vs muted", PRIMARY_L, "#f0f3ee", UI),
        ("UI primary 버튼 면 vs 역상 필 #1a2620", PRIMARY_L, "#1a2620", UI),
        ("UI ring #2563eb vs white", "#2563eb", "#ffffff", UI),
        ("UI ring #2563eb vs muted", "#2563eb", "#f0f3ee", UI),
        ("UI ring #2563eb vs 역상 #1a2620", "#2563eb", "#1a2620", UI),
        ("UI ring #2563eb vs primary 버튼 #5a5fe8", "#2563eb", PRIMARY_L, UI),
        ("UI 다크 ring #60a5fa vs bg #0f1310", "#60a5fa", "#0f1310", UI),
        ("UI 다크 ring #60a5fa vs card #181d17", "#60a5fa", "#181d17", UI),
        ("UI 다크 ring #60a5fa vs 역상 #e6ebe2", "#60a5fa", "#e6ebe2", UI),
        ("UI 현재 focus-ring 합성(28% #5a5fe8) vs white", hx(over("rgba(90,95,232,0.28)", (255, 255, 255))), "#ffffff", UI),
        ("상태 아이콘 success #32d1af vs white", "#32d1af", "#ffffff", UI),
        ("상태 아이콘 warning #fbb424 vs white", "#fbb424", "#ffffff", UI),
        ("상태 아이콘 danger #ff6b42 vs white", "#ff6b42", "#ffffff", UI),
        ("상태 아이콘 info #3b82f6 vs white", "#3b82f6", "#ffffff", UI),
        ("상태 점 success #32d1af vs muted", "#32d1af", "#f0f3ee", UI),
    ]
    for label, a, b, need in pairs:
        r = ratio(solid(a), solid(b))
        print(f"| {label} | {floor2(r):.2f} | {need} | {'통과' if r >= need else '**미달**'} |")

    print("\n### 컨트롤 경계 (1.4.11, UI 3:1) — v2 --border(-strong)·--input을 white·muted 위에서")
    two = {"white": solid("#ffffff"), "muted": solid("#f0f3ee")}
    for label, c in [
        ("--border rgba(31,54,40,.12)", "rgba(31,54,40,0.12)"),
        ("--input rgba(31,54,40,.16)", "rgba(31,54,40,0.16)"),
        ("--border-strong rgba(31,54,40,.20)", "rgba(31,54,40,0.20)"),
    ]:
        rs = [ratio(over(c, bg), bg) for bg in two.values()]
        print(f"| {label} | " + " | ".join(f"{floor2(r):.2f}" for r in rs) + " |")
    print("  -> 컨트롤 경계 3.0+0.1 최소 알파:", alpha_to(NEUTRAL_BASE_L, two, 3.1),
          "/ 다크 흰 베이스:", alpha_to("255,255,255", {"card": solid("#181d17"), "muted": solid("#1f261d")}, 3.1))

    print("\n### 보정 탐색 (같은 색상·채도에서 명도만, 최저 ≥ 4.6)")
    print("  caption → label-alternative 라이트 :", darken_to("#66726a", LIGHT, MARGIN))
    print("  caption → label-alternative 다크   :", darken_to("#828e7d", DARK, MARGIN, lighter=True))
    print("  muted-foreground → label-neutral 라이트 (위계 여유 최저 5.4):", darken_to("#5e6b60", LIGHT, 5.4))
    print("  muted-foreground → label-neutral 다크   (위계 여유 최저 5.4):", darken_to("#9aa694", DARK, 5.4, lighter=True))
    print("  success-text 라이트:", darken_to("#067562", LIGHT, MARGIN))
    print("  warning-text 라이트:", darken_to("#8a5a00", LIGHT, MARGIN))
    print("  danger-text 라이트:", darken_to("#c7340f", LIGHT, MARGIN))
    print("  info-text 라이트:", darken_to("#1d5fd8", LIGHT, MARGIN))
    print("  danger-text 다크:", darken_to("#ff7e59", DARK, MARGIN, lighter=True))
    print("  info-text 다크:", darken_to("#60a5fa", DARK, MARGIN, lighter=True))
    print("  primary 글자 라이트:", darken_to(PRIMARY_L, LIGHT, MARGIN))
    print("  primary 글자 다크:", darken_to("#818cf8", DARK, MARGIN, lighter=True))

    print("\n합성 hex:", "primary-container 라이트 =", PRIMARY_CONTAINER_L,
          "/ fill-normal·strong on white =", hx(LIGHT["fill-normal/white(bg·card)"]), hx(LIGHT["fill-strong/white(bg·card)"]),
          "/ on muted =", hx(LIGHT["fill-normal/muted #f0f3ee"]), hx(LIGHT["fill-strong/muted #f0f3ee"]))
    print("배경 수: 라이트", len(LIGHT), "· 다크", len(DARK), "· 역상 라이트", len(INV_L), "· 역상 다크", len(INV_D))
