window.__m = () => {
  const a = document.activeElement; if (!a || a === document.body) return { active: "BODY" };
  const r = a.getBoundingClientRect(); const R = 4;
  const ring = { l: r.left - R, t: r.top - R, r: r.right + R, b: r.bottom + R };
  let clip = { l: 0, t: 0, r: innerWidth, b: innerHeight }, clipper = "viewport";
  for (let p = a.parentElement; p; p = p.parentElement) {
    const cs = getComputedStyle(p);
    if (cs.overflowX !== "visible" || cs.overflowY !== "visible") {
      const pr = p.getBoundingClientRect();
      clip = { l: Math.max(clip.l, pr.left), t: Math.max(clip.t, pr.top), r: Math.min(clip.r, pr.right), b: Math.min(clip.b, pr.bottom) };
      clipper = p.tagName + (p.getAttribute("aria-label") ? "[" + p.getAttribute("aria-label") + "]" : "");
    }
  }
  const f = (n) => Math.round(n * 100) / 100;
  return { text: (a.getAttribute("aria-label") || a.textContent).trim().slice(0, 24), tag: a.tagName, fv: a.matches(":focus-visible"),
    shadow: getComputedStyle(a).boxShadow.slice(0, 60), outline: getComputedStyle(a).outlineStyle,
    ringRoom: { top: f(ring.t - clip.t), right: f(clip.r - ring.r), bottom: f(clip.b - ring.b), left: f(ring.l - clip.l) }, clipper };
};
