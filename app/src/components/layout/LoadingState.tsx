/** 라우트 청크·화면 데이터를 불러오는 동안 보이는 상태. 빈 화면 대신 스크린 리더와 눈 모두에 알린다. */
export function LoadingState({ label = "불러오는 중…" }: { readonly label?: string }) {
  return (
    <div className="mx-auto flex max-w-(--layout-max-width) px-4 py-16 md:px-7">
      <p role="status" className="ds-body2 text-label-alternative">
        {label}
      </p>
    </div>
  );
}
