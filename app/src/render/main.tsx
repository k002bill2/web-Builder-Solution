import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RenderApp } from "./RenderApp";
import "./render.css";

/** 렌더 문서 엔트리(render.html — 편집기 캔버스 iframe, `sandbox="allow-scripts"`). 탑재 제한은 renderImportGuard.test.ts */
const root = document.getElementById("root");
if (!root) throw new Error("#root 요소를 찾을 수 없습니다");
createRoot(root).render(
  <StrictMode>
    <RenderApp host={window} />
  </StrictMode>,
);
