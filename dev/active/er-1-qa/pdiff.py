# PNG 내보내기 vs 정적 HTML 렌더(1280) 픽셀 비교 + 나란히 축소본. 사용: python3 pdiff.py <a.png> <b.png> <out.png>
import sys
from PIL import Image, ImageChops
a, b = Image.open(sys.argv[1]).convert("RGB"), Image.open(sys.argv[2]).convert("RGB")
print("A", a.size, "B", b.size)
h = min(a.height, b.height); w = min(a.width, b.width)
d = ImageChops.difference(a.crop((0, 0, w, h)), b.crop((0, 0, w, h)))
px = d.load(); diff = 0; mx = 0; rows = {}
for y in range(h):
    for x in range(w):
        m = max(px[x, y])
        if m > 8: diff += 1; rows[y // 200] = rows.get(y // 200, 0) + 1
        mx = max(mx, m)
print(f"overlap {w}x{h} diffpx(>8) {diff} ({diff/(w*h)*100:.3f}%) maxch {mx} bbox {d.getbbox()}")
print("diff by 200px band:", {k*200: v for k, v in sorted(rows.items())})
s = Image.new("RGB", (w * 2 + 20, h), "white"); s.paste(a.crop((0, 0, w, h)), (0, 0)); s.paste(b.crop((0, 0, w, h)), (w + 20, 0))
s.resize((s.width // 3, s.height // 3)).save(sys.argv[3])
