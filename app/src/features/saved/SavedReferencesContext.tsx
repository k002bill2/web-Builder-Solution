import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface SavedReferencesValue {
  readonly saved: ReadonlySet<string>;
  readonly toggle: (id: string) => void;
}

const SavedReferencesContext = createContext<SavedReferencesValue | null>(null);

/** 저장한 레퍼런스 (세션 메모리 — 프로젝트 보관함 영구 저장은 범위 밖). */
export function SavedReferencesProvider({ children }: { readonly children: ReactNode }) {
  const [saved, setSaved] = useState<ReadonlySet<string>>(() => new Set());
  const toggle = useCallback((id: string) => {
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const value = useMemo(() => ({ saved, toggle }), [saved, toggle]);
  return <SavedReferencesContext.Provider value={value}>{children}</SavedReferencesContext.Provider>;
}

export function useSavedReferences(): SavedReferencesValue {
  const value = useContext(SavedReferencesContext);
  if (!value) throw new Error("SavedReferencesProvider 밖에서 useSavedReferences를 호출했습니다");
  return value;
}
