import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { addToTray, removeFromTray, type AddResult, type CompareTray } from "./compareTray";

interface CompareTrayValue {
  readonly tray: CompareTray;
  readonly add: (id: string) => AddResult;
  readonly remove: (id: string) => void;
}

const CompareTrayContext = createContext<CompareTrayValue | null>(null);

/** 비교 트레이 상태 (세션 메모리 — 영구 저장은 범위 밖). 라우트를 옮겨도 유지된다. */
export function CompareTrayProvider({ children }: { readonly children: ReactNode }) {
  const [tray, setTray] = useState<CompareTray>([]);
  const add = useCallback(
    (id: string) => {
      const result = addToTray(tray, id);
      if (result.ok) setTray(result.tray);
      return result;
    },
    [tray],
  );
  const remove = useCallback((id: string) => setTray((current) => removeFromTray(current, id)), []);
  const value = useMemo(() => ({ tray, add, remove }), [tray, add, remove]);
  return <CompareTrayContext.Provider value={value}>{children}</CompareTrayContext.Provider>;
}

export function useCompareTray(): CompareTrayValue {
  const value = useContext(CompareTrayContext);
  if (!value) throw new Error("CompareTrayProvider 밖에서 useCompareTray를 호출했습니다");
  return value;
}
