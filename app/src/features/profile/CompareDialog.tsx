/**
 * 3안 실제 화면 비교 대화상자 (M2B-5 SPEC-COMPARE3) — 조작 뒤 청크("3안 실제 화면으로 비교" onClick). S1 시제품: 변환만(iframe 0).
 */
import { useMemo } from "react";
import type { GenerationJob } from "../../domain/generation";
import type { ProfileVersion } from "../../domain/profile";
import { frameMessage } from "./compareFrame";
import { compareKitTokens, comparePreviews } from "./comparePreviews";

export { frameMessage };

export default function CompareDialog({ job, viewed }: { readonly job: GenerationJob; readonly viewed: ProfileVersion }) {
  const previews = useMemo(() => comparePreviews(job, viewed), [job, viewed]);
  const kitTokens = useMemo(() => compareKitTokens(viewed), [viewed]);
  return <span hidden data-compare-previews={previews.length} data-compare-kit={kitTokens ? "yes" : "no"} />;
}
