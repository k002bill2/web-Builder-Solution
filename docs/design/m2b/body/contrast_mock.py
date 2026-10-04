"""M2B-0B 시안 팔레트 대비 (L2) — 식은 app/src/domain/contrast.ts(WCAG 상대 휘도)와 같음, 버림 2자리.
시안 전용 자체 팔레트(어느 사이트 값도 아님). 검사 = 게이트 C-1~C-5 (C-3은 카드 톤 dark에서만 — 시안은 light)."""
import math
P = {"primary": (36, 84, 72), "surface": (236, 231, 222), "ink": (28, 32, 36), "muted": (92, 96, 102), "bg": (250, 248, 244), "on-primary": (255, 255, 255)}
def lum(c):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(v) for v in c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
def ratio(a, b):
    la, lb = sorted((lum(P[a]), lum(P[b])), reverse=True)
    return math.floor((la + 0.05) / (lb + 0.05) * 100) / 100
CHECKS = [("C-1", "on-primary", "primary"), ("C-2", "ink", "bg"), ("C-3", "ink", "primary"), ("C-4", "ink", "surface"), ("C-5", "muted", "bg")]
for cid, fg, bg in CHECKS:
    r = ratio(fg, bg)
    note = " (카드 dark 전용 — 시안 미사용)" if cid == "C-3" else ""
    print(f"{cid} {fg}/{bg} = {r:.2f} {'PASS' if r >= 4.5 else 'FAIL'}{note}")
