/**
 * 3안 영역 (DS-2A-04 4 · 5.1 · P-S17~S24 · P-AC-21~31). 엔진 청크 전용 — 보는 버전마다 새로 마운트한다(key = 버전, useGeneration).
 * 생성은 저장된 버전에만: 저장 안 된 조정이 있으면 "3안 만들기" aria-disabled + 이유. "다시 생성" 없음(결정성, M-02) — 재시도는 실패 안만.
 * 폭: ≥768 카드 3열 + 비교 표(접힘), <768 한 열·표 없음(카드가 같은 정보를 모두 가진다). 편집 시작은 2a-05 경계(Q7) — 편집 미구현 안내 상시.
 * 순서(PROFILE-V2-COMPACT 5): 카드 → 편집 시작(바로 아래 오른쪽) → "3안 비교 표 보기".
 */
import { useId } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ds/Button";
import { Callout } from "../../components/ds/Callout";
import { effectiveProfile } from "../../domain/effectiveProfile";
import { isTerminal, type CandidateFailure, type GenerationJob } from "../../domain/generation";
import type { ProfileVersion } from "../../domain/profile";
import { CandidateCard, type WirePalette } from "./CandidateCard";
import { CandidateTable } from "./CandidateTable";
import { CANDIDATE_TEXT, determinismText, doneCount, failureText } from "./generationText";
import { PALETTE_ROLES } from "./profileFields";
import { useGeneration } from "./useGeneration";

const DISABLED = "aria-disabled:cursor-not-allowed aria-disabled:bg-fill-strong aria-disabled:text-label-disable aria-disabled:hover:bg-fill-strong";
const failuresOf = (job: GenerationJob) => job.candidates.filter((c): c is CandidateFailure => c.status === "failed");

export function CandidatesSection({ viewed, pending, announce }: { readonly viewed: ProfileVersion; readonly pending: number; readonly announce: (text: string) => void }) {
  const gen = useGeneration(viewed.profileId, viewed.version, announce);
  const { job } = gen;
  const navigate = useNavigate();
  const blockId = useId();
  const editId = useId();
  const profile = effectiveProfile(viewed.base, viewed.adjustments);
  const palette = Object.fromEntries(PALETTE_ROLES.map((r) => [r, profile.color_tokens[r].$value])) as WirePalette;
  const running = job ? !isTerminal(job.state) : false;
  const blocked = pending > 0;
  const failures = job && isTerminal(job.state) ? failuresOf(job) : [];
  const retryable = failures.some((f) => f.retryable);
  const allFailed = job?.state === "failed";
  const selected = job?.selected;

  const onRequest = () => {
    if (!blocked && !running) void gen.request();
  };
  return (
    <section aria-labelledby="profile-candidates" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="profile-candidates" className="ds-heading1">생성된 3안</h2>
        <p className="ds-body3 text-label-alternative">{determinismText(viewed)}</p>
        <p className="ds-caption1 text-label-alternative">{CANDIDATE_TEXT.preview}</p>
      </div>
      {/* 잡을 찾는 중(null)에도 자리를 둔다 — 누르면 요청은 멱등이라 기존 잡을 돌려받는다 */}
      {(!job || running) && (
        <div className="flex flex-col items-start gap-2">
          <Button
            aria-disabled={blocked || undefined}
            aria-describedby={blocked ? blockId : undefined}
            aria-busy={running || gen.busy === "request" || undefined}
            className={DISABLED}
            onClick={onRequest}
          >
            {running || gen.busy === "request" ? "만드는 중…" : `3안 만들기 (v${viewed.version})`}
          </Button>
          <p id={blockId} className="ds-caption1 text-label-alternative">
            {blocked ? CANDIDATE_TEXT.blocked : CANDIDATE_TEXT.hint}
          </p>
        </div>
      )}
      {gen.failure && (
        <p role="alert" className="ds-body3 rounded-md bg-status-negative-bg p-3 text-status-negative-text">
          {gen.failure}
        </p>
      )}
      {failures.length > 0 && (
        <div role={gen.fresh ? "alert" : undefined}>
          <Callout
            tone={allFailed ? "negative" : "warning"}
            title={allFailed ? CANDIDATE_TEXT.allFailed : failures.map(failureText).join(" · ")}
            action={
              retryable && (
                <Button size="sm" variant="outline" aria-busy={gen.busy === "retry" || undefined} onClick={() => void gen.retry(job!.jobId)}>
                  {failures.filter((f) => f.retryable).map((f) => f.id).join("·")}안 다시 시도
                </Button>
              )
            }
          >
            {allFailed ? failures.map(failureText).join(" · ") : undefined}
          </Callout>
        </div>
      )}
      {job && (
        <ul aria-label="3안" className="grid gap-4 md:grid-cols-3">
          {job.candidates.map((c) =>
            c.status === "succeeded" ? (
              <CandidateCard
                key={c.id}
                plan={c.plan}
                palette={palette}
                profileScale={profile.typography_tokens.scale}
                selected={selected === c.id}
                busy={gen.busy === "select"}
                onSelect={() => void gen.select(job.jobId, c.id)}
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
      )}
      <div className="flex flex-col items-start gap-2 md:items-end">
        <Button
          trailingIcon="arrow-right"
          aria-disabled={!selected || undefined}
          aria-describedby={editId}
          className={DISABLED}
          onClick={() => selected && void navigate("/studio")}
        >
          {selected ? `${selected}안으로 편집 시작` : "편집 시작"}
        </Button>
        <p id={editId} className="ds-caption1 text-label-alternative md:text-right">
          {selected ? CANDIDATE_TEXT.editNotice : `${CANDIDATE_TEXT.editReason} · ${CANDIDATE_TEXT.editNotice}`}
        </p>
      </div>
      {job && isTerminal(job.state) && !allFailed && <CandidateTable job={job} profileScale={profile.typography_tokens.scale} />}
    </section>
  );
}
