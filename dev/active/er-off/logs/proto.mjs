// usage: node proto.mjs <appdir> <id> <patchIds...>
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
const [appDir, id, ...ids] = process.argv.slice(2);
const SL = "src/components/studio/StudioLayout.tsx";
const P = {
  A1: [
    [SL, "      const moved = outcome.result.doc.sections[outcome.result.index]!;\n      setNotice(notices.movedNotice(moved.type, sectionName(moved), outcome.result.index));\n      requestFocus({ element: button });", "      notices.afterMove(outcome, setNotice, requestFocus, button);"],
    [SL, "      const { before, result } = outcome;\n      const removed = before.sections[result.index]!;\n      // 포커스·선택 = 다음 섹션 줄(없으면 이전) — resolveSelection(첫 본문)에 맡기지 않는다\n      const next = result.doc.sections[result.index] ?? result.doc.sections[result.index - 1];\n      if (next) setSelected(next.instanceId);\n      setUndoTarget({ instanceId: removed.instanceId, text: notices.restoredNotice(removed.type, sectionName(removed)), before });\n      setNotice(notices.removedNotice(removed.type, sectionName(removed)));\n      if (next) focusRow(next.instanceId);", "      notices.afterRemove(outcome, setSelected, setUndoTarget, setNotice, focusRow);"],
    [SL, "      const original = outcome.before.sections.find((s) => s.instanceId === instanceId)!;\n      setUndoTarget({ instanceId, text: notices.swapRevertedNotice(variantName(original)), before: outcome.before });\n      setNotice(notices.swappedNotice(choice.label, choice.lostLabels));\n      requestFocus({ element: radio });", "      notices.afterSwap(outcome, instanceId, choice, radio, setUndoTarget, setNotice, requestFocus);"],
    [SL, "      const added = outcome.result.doc.sections[outcome.result.index]!;\n      setSelected(added.instanceId);\n      setNotice(notices.addedNotice(added.type, sectionName(added), outcome.result.index));\n      focusRow(added.instanceId);", "      notices.afterAdd(outcome, setSelected, setNotice, focusRow);"],
  ],
  A2: [["src/features/studio/useSectionOps.ts", "          docRef.current = result.doc;\n          stack.push({ label, before, after: result.doc });\n          setLast(undoable ? { before, after: result.doc } : undefined);\n          edit(result.doc);\n          return { ok: true, result, before };", "          return result.tail(docRef, stack, setLast, edit, label, before, undoable);"]],
  B1: [["src/features/studio/useAutosaveScheduler.ts", "  return new Scheduler<T>(options);", "  return options as never;"]],
  B2: [["src/features/studio/useExportFlow.ts", "      const fresh = stale || !report ? await recheck() : report;\n      if (!fresh) return;\n      const counts = gateCounts(fresh);\n      if (counts.block > 0) return;\n      if (counts.warn > 0) return setConfirming({ format, report: fresh });\n      proceed(format);", "      (await import(\"./exportFlow\" as string)).start(format, stale, report, recheck, setConfirming, proceed);"]],
  B3: [[SL, "const conflict = save.conflict && <ConflictCallout latestRevision={save.conflict.latest?.revision} busy={resolving} onChoose={choose} />;", "const conflict = save.conflict && choose && resolving && null;"],
       ["src/features/studio/useDocSave.ts", "      const mine = docRef.current;\n      const resolved = await repository.resolveConflict(projectId, choice, { ...mine, hash: hashDoc(mine) });\n      revisionRef.current = resolved.revision;\n      setLatest(undefined);\n      if (choice === \"theirs\") {\n        docRef.current = resolved;\n        setDoc(resolved);\n      }\n      settle();\n      // 해결 요청 중에 생긴 내 편집은 다시 미저장으로 둔다(\"내 편집으로 저장\"만 — 불러오기는 최신으로 바꿨다)\n      if (choice === \"mine\" && docRef.current !== mine) change(docRef.current);", "      void [choice, repository, settle, change];"]],
  B4: [["src/components/studio/EditFields.tsx", "  if (!section) return <PageInfoFields meta={doc.meta} onChange={(meta) => onEdit({ ...doc, meta })} />;", "  if (!section) return null;"]],
};
const originals = new Map();
for (const pid of ids) for (const [f, a, b] of P[pid]) {
  const s = readFileSync(`${appDir}/${f}`, "utf8");
  if (!s.includes(a)) throw new Error(`${pid}: no match in ${f}`);
  if (!originals.has(f)) originals.set(f, s);
  writeFileSync(`${appDir}/${f}`, s.replace(a, b));
}
try {
  execSync(`node /tmp/eroff/reach.mjs ${appDir} /tmp/eroff/p-${id}`, { stdio: "ignore" });
  const out = execSync(`node /tmp/eroff/analyze.mjs /tmp/eroff/p-${id}`).toString().trim().split("\n");
  const sl = out.find((l) => l.includes("StudioLayout.tsx")).split("\t")[1];
  const iss = out.find((l) => l.includes("_issue")).split("\t")[1];
  console.log(`${id}\t[${ids.join("+")}]\t${out.at(-1)}\tStudioLayout ${sl}\tissue ${iss}`);
} finally {
  // 실행 전 내용 그대로 복원(미커밋 수정 보존 — Codex r1 P2)
  for (const [f, s] of originals) writeFileSync(`${appDir}/${f}`, s);
}
