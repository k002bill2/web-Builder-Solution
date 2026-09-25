import { Component, type ReactNode } from "react";
import { Button } from "../ds/Button";

interface State {
  readonly error: Error | null;
}

/**
 * 라우트 영역의 렌더 오류(대표적으로 lazy 청크 로드 실패)를 잡아 헤더는 남기고 복구 방법을 보인다.
 * 선언형 라우터라 data router의 기본 오류 경계가 없다. 경로가 바뀌면 `key`로 새로 마운트해 오류 상태를 벗어난다.
 */
export class RouteErrorBoundary extends Component<{ readonly children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[route] 화면 렌더 실패", error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="mx-auto flex max-w-(--layout-max-width) flex-col items-start gap-3 px-4 py-16 md:px-7">
        <h1 className="ds-title1">화면을 불러오지 못했습니다</h1>
        <p className="ds-body2 text-label-alternative">네트워크 연결을 확인하거나 새 버전이 배포되었을 수 있으니 새로고침해 주세요.</p>
        <Button onClick={() => window.location.reload()}>새로고침</Button>
      </div>
    );
  }
}
