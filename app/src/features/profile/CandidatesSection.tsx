/**
 * 3안 영역 (DS-2A-04 4 · 5.1 · P-S17~S24 · P-AC-21~31). 엔진 청크 전용 — 보는 버전마다 새로 마운트한다(key = 버전, useGeneration).
 * 생성은 저장된 버전에만: 저장 안 된 조정이 있으면 "3안 만들기" aria-disabled + 이유. "다시 생성" 없음(결정성, M-02) — 재시도는 실패 안만.
 * 폭: ≥768 카드 3열 + 비교 표(접힘), <768 한 열·표 없음(카드가 같은 정보를 모두 가진다). 편집 시작은 2a-05 경계(Q7) — 편집 미구현 안내 상시.
 * 순서(PROFILE-V2-COMPACT 5): 카드 → 편집 시작(바로 아래 오른쪽) → "3안 비교 표 보기".
 * 편집 시작(DS-2A-05 12.3 · 8.3.1): 누를 때 프로젝트 저장소를 받아 `startDoc(create)` — 성공·DOC_EXISTS = 이동(state: 바뀐 쌍 · 편집 알림) ·
 * UNKNOWN_VARIANT = 알림(다시 시도 없음) · 그 밖 = 실패 문형 + 다시 시도(같은 인자 → 멱등). 문장은 조작 뒤 청크(memoryDocBook)가 만든다.
 */
import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ds/Button";
import { Callout } from "../../components/ds/Callout";
import { useProjectLoader } from "../../data/ProfileRepositoryContext";
import type { StudioEntryState } from "../../data/projectRepository";
import { effectiveProfile } from "../../domain/effectiveProfile";
import { isTerminal, type CandidateFailure, type GenerationJob } from "../../domain/generation";
import type { ProfileVersion } from "../../domain/profile";
import type { WirePalette } from "./CandidateCard";
import { loadCandidateResults as loadResults } from "./candidateResultsLoader";
import { loadCompare } from "./compareLoader";
import { CANDIDATE_TEXT, determinismText, failureText } from "./generationText";
import { PALETTE_ROLES } from "./profileFields";
import { useGeneration } from "./useGeneration";

const DISABLED = "aria-disabled:cursor-not-allowed aria-disabled:bg-fill-strong aria-disabled:text-label-disable aria-disabled:hover:bg-fill-strong";
const PLACEHOLDER = "ds-caption1 flex aspect-4/5 items-center justify-center rounded-md border border-dashed border-line-normal bg-fill-normal p-3 text-center text-label-alternative";
const failuresOf = (job: GenerationJob) => job.candidates.filter((c): c is CandidateFailure => c.status === "failed");

export function CandidatesSection({
  viewed,
  projectId,
  pending,
  announce,
}: {
  readonly viewed: ProfileVersion;
  /** 편집 시작 → `/studio/:projectId`(DS-2A-05 12.3). 문서 만들기(startDoc)는 a2 몫 — 여기서는 이동만 */
  readonly projectId?: string;
  readonly pending: number;
  readonly announce: (text: string) => void;
}) {
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
  const loadProjects = useProjectLoader();
  const [starting, setStarting] = useState(false);
  const [startAlert, setStartAlert] = useState<{ readonly text: string; readonly retry: boolean }>();
  /** 카드·표 청크(PROFILE-HEADROOM-2) — 잡이 생긴 뒤에만 쓰여 따로 받는다. 다시 시도 = attempt 증가 → 새 URL로 다시 받기 */
  const [results, setResults] = useState<Awaited<ReturnType<typeof loadResults>> | "error">();
  const [attempt, setAttempt] = useState(0);
  /** 비교 청크(M2B-5 SPEC 1.1) — 누를 때만 받는다. "loading" = 받는 중(aria-busy) · "error" = 실패 Callout */
  const [compare, setCompare] = useState<Awaited<ReturnType<typeof loadCompare>> | "loading" | "error">();
  const hasJob = Boolean(job);
  useEffect(() => {
    if (!hasJob) return;
    loadResults().then(setResults, (error: unknown) => {
      console.error("[profile] 3안 결과 청크 불러오기 실패", error);
      setResults("error");
    });
  }, [hasJob, attempt]);

  const onEdit = async () => {
    if (!selected || starting) return;
    if (!projectId) return void navigate("/projects");
    setStarting(true);
    setStartAlert(undefined);
    let state: StudioEntryState | undefined;
    try {
      const started = await (await loadProjects()).startDoc(projectId, viewed.version, selected, "create");
      state = { changes: started.changes, editNotice: started.changeNotice };
    } catch (error: unknown) {
      // 오류 모양만 읽는다 — 오류 클래스(프로젝트 저장소 청크)를 프로필 청크로 끌어오지 않는다
      const { code, alert } = (error ?? {}) as { code?: string; alert?: string };
      if (code === "DOC_EXISTS") state = { editNotice: alert };
      else setStartAlert({ text: (code === "UNKNOWN_VARIANT" && alert) || CANDIDATE_TEXT.startFailed, retry: code !== "UNKNOWN_VARIANT" });
    }
    setStarting(false);
    if (state) void navigate(`/studio/${projectId}`, { state });
  };
  const onCompare = () => {
    if (compare === "loading") return;
    setCompare("loading");
    loadCompare().then(setCompare, (error: unknown) => {
      console.error("[profile] 3안 비교 청크 불러오기 실패", error);
      setCompare("error");
    });
  };
  const onRequest = () => {
    if (blocked || running) return;
    loadResults().then(setResults, () => undefined); // 미리 받기 — 잡이 오기 전에 카드 청크를 받아 둔다(실패하면 잡이 온 뒤 다시 받는다)
    void gen.request();
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
      {/* 청크 도착 전 — 카드와 같은 자리(4:5 · 3열)를 잡아 레이아웃이 튀지 않게 한다. 목록("3안")은 청크가 그린다 */}
      {job && results === undefined && (
        <div className="grid gap-4 md:grid-cols-3">
          {job.candidates.map((c, i) => (
            <div key={c.id} aria-hidden={i > 0 || undefined} className={PLACEHOLDER}>
              {i === 0 && <p role="status">{CANDIDATE_TEXT.resultsLoading}</p>}
            </div>
          ))}
        </div>
      )}
      {job && results === "error" && (
        <div role="alert">
          <Callout
            tone="negative"
            title={CANDIDATE_TEXT.resultsFailed}
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setResults(undefined);
                  setAttempt((n) => n + 1);
                }}
              >
                다시 시도
              </Button>
            }
          />
        </div>
      )}
      {job && typeof results === "object" && (
        <results.CandidateList
          job={job}
          palette={palette}
          profileScale={profile.typography_tokens.scale}
          busy={gen.busy === "select"}
          onSelect={(id) => void gen.select(job.jobId, id)}
        />
      )}
      {job && isTerminal(job.state) && !allFailed && typeof results === "object" && (
        <div className="flex flex-col items-start gap-2">
          <Button variant="outline" aria-busy={compare === "loading" || undefined} onClick={onCompare}>
            {compare === "loading" ? CANDIDATE_TEXT.compareLoading : CANDIDATE_TEXT.compare}
          </Button>
          {compare === "error" && (
            <div role="alert">
              <Callout tone="negative" title={CANDIDATE_TEXT.compareFailed} action={<Button size="sm" variant="outline" onClick={onCompare}>다시 시도</Button>} />
            </div>
          )}
          {typeof compare === "object" && <compare.default job={job} viewed={viewed} />}
        </div>
      )}
      <div className="flex flex-col items-start gap-2 md:items-end">
        <Button
          trailingIcon="arrow-right"
          aria-disabled={!selected || undefined}
          aria-describedby={editId}
          aria-busy={starting || undefined}
          className={DISABLED}
          onClick={() => void onEdit()}
        >
          {selected ? `${selected}안으로 편집 시작` : "편집 시작"}
        </Button>
        <p id={editId} className="ds-caption1 text-label-alternative md:text-right">
          {selected ? CANDIDATE_TEXT.editNotice : `${CANDIDATE_TEXT.editReason} · ${CANDIDATE_TEXT.editNotice}`}
        </p>
        {startAlert && (
          <div role="alert">
            <Callout
              tone="negative"
              title={startAlert.text}
              action={startAlert.retry && <Button size="sm" variant="outline" onClick={() => void onEdit()}>다시 시도</Button>}
            />
          </div>
        )}
      </div>
      {job && isTerminal(job.state) && !allFailed && typeof results === "object" && (
        <results.CandidateTable job={job} profileScale={profile.typography_tokens.scale} />
      )}
    </section>
  );
}
