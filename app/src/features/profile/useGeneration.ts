/**
 * 3안 생성 상태 (DS-2A-04 2.2 P-S17~S22 · 5.3 · 6.3). 엔진 청크 전용 — 화면은 보는 버전마다 새로 마운트한다(key = 버전).
 * 진입 때 기존 잡을 찾고(findJob — store 조회, 계산 청크 없음) 종료 상태까지 1초 간격으로 조회한다. 버전이 바뀌거나 화면을 떠나면 조회를 멈추고
 * 늦게 온 응답은 버린다(마운트 토큰). 알림은 단계가 바뀔 때만(시작 · 1/3 · 2/3 · 완료) — 진입 때 이미 끝난 결과는 알리지 않는다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { GenerationRepository } from "../../data/generationRepository";
import { useGenerationLoader } from "../../data/ProfileRepositoryContext";
import { isTerminal, type CandidateId, type GenerationJob } from "../../domain/generation";
import { CANDIDATE_TEXT, stageText } from "./generationText";
import { emitProfileEvent } from "./profileEvents";

export const POLL_MS = 1000;
export type GenerationBusy = "request" | "retry" | "select";
const codeOf = (error: unknown) => (error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : "UNKNOWN");

export function useGeneration(profileId: string, version: number, announce: (text: string) => void) {
  const load = useGenerationLoader();
  /** null = 찾는 중 · undefined = 잡 없음(P-S17) */
  const [job, setJob] = useState<GenerationJob | undefined | null>(null);
  const [busy, setBusy] = useState<GenerationBusy | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  /** 이 화면에서 진행을 지켜본 실패만 role=alert(1회) — 진입 때 이미 끝난 실패는 글자만 */
  const [fresh, setFresh] = useState(false);
  const token = useRef<object | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const busyNow = useRef(false);
  const watching = useRef(false);
  /** 이 마운트에서 요청·재시도로 잡을 따라가기 시작함 — 늦게 온 진입 findJob 결과는 버린다(폴러 1개) */
  const started = useRef(false);
  const stage = useRef("");
  /** 이 화면에서 마지막으로 고른 안 — 선택 전에 떠난 조회 응답이 늦게 와도 선택을 지우지 않게 덮어 쓴다 */
  const chosen = useRef<CandidateId | undefined>(undefined);

  const settle = useCallback((next: GenerationJob) => {
    watching.current = false;
    const ok = next.candidates.filter((c) => c.status === "succeeded").length;
    const failed = next.candidates.find((c) => c.status === "failed");
    if (ok > 0) emitProfileEvent({ name: "generation_succeeded", version: next.version, count: ok });
    if (failed?.status === "failed") {
      emitProfileEvent({ name: "generation_failed", reason: failed.errorCode });
      setFresh(true);
    }
  }, []);

  const follow = useCallback(
    function follow(next: GenerationJob, owner: object) {
      if (token.current !== owner) return;
      setJob(chosen.current ? { ...next, selected: chosen.current } : next);
      const text = stageText(next);
      if ((watching.current || !isTerminal(next.state)) && text !== stage.current) {
        stage.current = text;
        if (text) announce(text);
      }
      if (isTerminal(next.state)) {
        if (watching.current) settle(next);
        return;
      }
      watching.current = true;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        load()
          .then((r) => r.getJob(next.jobId))
          .then((j) => follow(j, owner), () => token.current === owner && setFailure(CANDIDATE_TEXT.poll));
      }, POLL_MS);
    },
    [load, announce, settle],
  );

  useEffect(() => {
    const owner = {};
    token.current = owner;
    load()
      .then((r) => r.findJob(profileId, version))
      .then(
        (found) => {
          if (token.current !== owner || started.current) return;
          if (found) follow(found, owner);
          else setJob(undefined);
        },
        () => {
          if (token.current !== owner) return;
          setJob(undefined);
          setFailure(CANDIDATE_TEXT.load);
        },
      );
    return () => {
      token.current = null;
      clearTimeout(timer.current);
    };
  }, [load, profileId, version, follow]);

  /** 요청·재시도·선택 공통 — 진행 중 연타 무시, 늦은 응답(다른 버전·떠난 화면) 버림 */
  const act = async (kind: GenerationBusy, work: (r: GenerationRepository) => Promise<GenerationJob>) => {
    const owner = token.current;
    if (!owner || busyNow.current) return undefined;
    busyNow.current = true;
    setBusy(kind);
    setFailure(null);
    try {
      const next = await work(await load());
      return token.current === owner ? { next, owner } : undefined;
    } catch (error) {
      if (token.current === owner) setFailure(CANDIDATE_TEXT[kind]);
      if (kind !== "select") emitProfileEvent({ name: "generation_failed", reason: codeOf(error) });
      return undefined;
    } finally {
      busyNow.current = false;
      if (token.current === owner) setBusy(null);
    }
  };

  const start = async (kind: "request" | "retry", work: (r: GenerationRepository) => Promise<GenerationJob>) => {
    const done = await act(kind, work);
    if (!done) return;
    started.current = true;
    // 멱등 요청이 이미 끝난 잡을 돌려주면 새로 만든 것이 아니다 — 요청 이벤트·단계 알림·완료 계측을 다시 내지 않는다
    if (!isTerminal(done.next.state)) {
      if (kind === "request") emitProfileEvent({ name: "generation_requested", version });
      setFresh(false);
      watching.current = true;
      stage.current = "";
    }
    follow(done.next, done.owner);
  };

  const request = () => start("request", (r) => r.requestGeneration(profileId, version));
  const retry = (jobId: string) => start("retry", (r) => r.retryFailed(jobId));
  const select = async (jobId: string, id: CandidateId) => {
    const done = await act("select", (r) => r.selectCandidate(jobId, id));
    if (!done) return;
    // 선택 응답은 선택만 반영한다 — 그 사이 조회가 진행·종료한 안 상태를 오래된 응답으로 되돌리지 않는다(폴러가 멈춘 뒤 "만드는 중" 고착 방지)
    chosen.current = id;
    setJob((current) => (current && current.jobId === done.next.jobId ? { ...current, selected: id } : done.next));
    announce(`${id}안을 선택했습니다`);
    emitProfileEvent({ name: "candidate_selected", id });
  };

  return { job, busy, failure, fresh, request, retry, select };
}
