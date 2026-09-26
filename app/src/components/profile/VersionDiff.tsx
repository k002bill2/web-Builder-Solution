import type { Ref } from "react";
import type { DiffRow } from "../../features/profile/profileDiff";
import { versionWith } from "../../features/profile/versionText";
import { Button } from "../ds/Button";

/** 3.5 버전 비교 표 (P-S08). 바뀐 줄 = "바뀜" 글자 + 굵게. 차이가 없으면 빈 문장 */
export function VersionDiff({
  from,
  to,
  rows,
  focusRef,
  onClose,
}: {
  readonly from: number;
  readonly to: number;
  readonly rows: readonly DiffRow[];
  readonly focusRef: Ref<HTMLElement>;
  readonly onClose: () => void;
}) {
  const title = `${versionWith(from, ["과", "와"])} v${to} 비교`;
  const same = rows.every((r) => !r.changed);
  return (
    <div className="flex flex-col gap-2 rounded-md border border-line-neutral p-3">
      {same ? (
        <section aria-label={title}>
          <p ref={focusRef as Ref<HTMLParagraphElement>} tabIndex={-1} className="ds-body3 focus:outline-none">
            두 버전의 값이 같습니다
          </p>
        </section>
      ) : (
        <div className="overflow-x-auto">
          <table className="ds-body3 w-full border-collapse text-left">
            <caption ref={focusRef as Ref<HTMLTableCaptionElement>} tabIndex={-1} className="ds-label mb-2 text-left focus:outline-none">
              {title}
            </caption>
            <thead>
              <tr className="border-b border-line-normal">
                <th scope="col" className="py-1.5 pr-3">항목</th>
                <th scope="col" className="py-1.5 pr-3">v{from}</th>
                <th scope="col" className="py-1.5 pr-3">v{to}</th>
                <th scope="col" className="py-1.5">차이</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className={r.changed ? "border-b border-line-neutral font-semibold" : "border-b border-line-neutral"}>
                  <th scope="row" className="py-1.5 pr-3 font-normal text-label-alternative">{r.label}</th>
                  <td className="py-1.5 pr-3">{r.a}</td>
                  <td className="py-1.5 pr-3">{r.b}</td>
                  <td className="py-1.5">{r.changed ? "바뀜" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Button variant="outline" size="sm" className="self-start" onClick={onClose}>
        비교 닫기
      </Button>
    </div>
  );
}
