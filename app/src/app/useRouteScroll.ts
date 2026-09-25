import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router";

/** 복원할 위치까지 콘텐츠(lazy 청크·데이터)가 늘어나기를 기다리는 최대 프레임 수 (60fps 기준 약 1초). */
const RESTORE_MAX_FRAMES = 60;

/**
 * 라우트 이동 시 스크롤을 명시적으로 제어한다 (M1-UI-01-FIX 그룹 D).
 * - 경로가 바뀌는 이동(상세 진입·유사 레퍼런스 이동): 맨 위
 * - 쿼리만 바뀌는 이동(카탈로그 필터·탭): 현재 위치 유지
 * - 뒤로·앞으로 가기(POP): 그 history 항목에서 마지막으로 본 위치 복원
 * 선언형 라우터라 `ScrollRestoration`(data router 전용)을 쓰지 않는다.
 */
export function useRouteScroll() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const currentKey = useRef(location.key);
  const previous = useRef({ key: location.key, pathname: location.pathname });

  // 브라우저 자동 복원은 비동기로 그려지는 화면에서 어긋나므로 끈다
  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return;
    const original = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = original;
    };
  }, []);

  // 위치는 스크롤할 때마다 현재 history 항목에 기록한다 — 이동 순간에는 화면이 바뀌어 값이 줄어 있을 수 있다
  useEffect(() => {
    const record = () => positions.current.set(currentKey.current, window.scrollY);
    window.addEventListener("scroll", record, { passive: true });
    return () => window.removeEventListener("scroll", record);
  }, []);

  useLayoutEffect(() => {
    // 같은 history 항목(첫 화면, StrictMode 재실행)이면 브라우저 위치를 그대로 둔다
    if (previous.current.key === location.key) return;
    const pathChanged = previous.current.pathname !== location.pathname;
    previous.current = { key: location.key, pathname: location.pathname };
    currentKey.current = location.key;

    if (navigationType !== "POP") {
      if (pathChanged) window.scrollTo(0, 0);
      return;
    }
    const target = positions.current.get(location.key) ?? 0;
    let frame = 0;
    let handle = 0;
    const restore = () => {
      window.scrollTo(0, target);
      if (Math.abs(window.scrollY - target) >= 1 && ++frame < RESTORE_MAX_FRAMES) {
        handle = window.requestAnimationFrame(restore);
      }
    };
    restore();
    return () => window.cancelAnimationFrame(handle);
  }, [location.key, location.pathname, navigationType]);
}
