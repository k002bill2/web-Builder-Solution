import type { PageDoc, SectionInstance } from "../engine/contracts/pageDoc";
import { KIT_REGISTRY, kitFor } from "../kit/registry";
import { kitLinks } from "../kit/text";
import { kitVars } from "../kit/tokens";
import type { KitSection } from "../kit/types";
import { canvasVars } from "./fallback/canvasLayouts";
import { FallbackSection } from "./fallback/FallbackCanvas";
import type { KitTokenInput } from "./protocol";

/**
 * 렌더 문서 본문 (M2A-2a K2·K3 · m2a 0.12) — 섹션 분기: 킷 레지스트리에 있으면 킷, 없으면 와이어프레임 폴백 + 표식(3.1).
 * 뼈대 = 사이트 루트 아래 `header`(킷 header) · `main`(hero·본문·폴백 전부) · `footer`(킷 footer) 형제 — 랜드마크가 main·section 안에 들어가지 않는다.
 * 킷 토큰이 없으면 킷 0 · 전부 폴백(중립 토큰). 사이트 루트에 `--site-*`, main에 폴백용 `--canvas-*`.
 */
export function PageDocument({
  doc,
  kitTokens,
  images = {},
  registry = KIT_REGISTRY,
}: {
  readonly doc: PageDoc;
  readonly kitTokens?: KitTokenInput;
  readonly images?: Readonly<Record<string, string>>;
  readonly registry?: Readonly<Record<string, KitSection>>;
}) {
  const links = kitLinks(doc);
  const kit = (section: SectionInstance) => (kitTokens ? kitFor(section, registry) : undefined);
  const draw = (section: SectionInstance) => {
    const Kit = kit(section);
    if (!Kit) return <FallbackSection key={section.instanceId} section={section} />;
    const root = { id: `s-${section.instanceId}`, "data-section": `${section.type}/${section.variant}`, "data-instance-id": section.instanceId, "data-kit": "" } as const;
    return <Kit key={section.instanceId} section={section} links={links} images={images} root={root} />;
  };
  const outside = (type: "header" | "footer") => doc.sections.filter((s) => s.type === type && kit(s));
  const head = outside("header");
  const foot = outside("footer");
  const body = doc.sections.filter((s) => !head.includes(s) && !foot.includes(s));
  return (
    <div data-site-root style={kitTokens && kitVars(kitTokens)}>
      {head.map(draw)}
      {body.length > 0 && (
        <main data-fallback-root style={canvasVars(kitTokens?.palette)} className="flex flex-col">
          {body.map(draw)}
        </main>
      )}
      {foot.map(draw)}
    </div>
  );
}
