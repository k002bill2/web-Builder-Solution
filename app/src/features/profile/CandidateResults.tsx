/**
 * 3안 결과 — 카드 목록 · 비교 표 (DS-2A-04 4.6). 잡이 생긴 뒤에만 쓰여 3안 영역이 따로 받는다(PROFILE-HEADROOM-2 — `/profile` 진입 직후 청크 밖).
 * "3안 만들기"를 누를 때 미리 받고, 이미 잡이 있는 채 들어오면 진입 뒤 받는다(CandidatesSection).
 */
import type { CandidateId, GenerationJob } from "../../domain/generation";
import { CandidateCard, type WirePalette } from "./CandidateCard";
import { doneCount, failureText } from "./generationText";

export { CandidateTable } from "./CandidateTable";

export function CandidateList(props: {
  readonly job: GenerationJob;
  readonly palette: WirePalette;
  readonly profileScale: number;
  readonly busy: boolean;
  readonly onSelect: (id: CandidateId) => void;
}) {
  const { job } = props;
  return (
    <ul aria-label="3안" className="grid gap-4 md:grid-cols-3">
      {job.candidates.map((c) =>
        c.status === "succeeded" ? (
          <CandidateCard
            key={c.id}
            plan={c.plan}
            palette={props.palette}
            profileScale={props.profileScale}
            selected={job.selected === c.id}
            busy={props.busy}
            onSelect={() => props.onSelect(c.id)}
          />
        ) : (
          <li key={c.id} className="flex min-w-0 flex-col gap-3">
            <div className="ds-caption1 flex aspect-4/5 items-center justify-center rounded-md border border-dashed border-line-normal bg-fill-normal p-3 text-center text-label-alternative">
              {c.status === "pending" ? `${c.id}안 만드는 중 · ${doneCount(job)}/3 완료` : failureText(c)}
            </div>
            <h3 className="ds-label">{c.id}안</h3>
          </li>
        ),
      )}
    </ul>
  );
}
