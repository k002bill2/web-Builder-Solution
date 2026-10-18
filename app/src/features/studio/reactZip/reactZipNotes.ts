/** React zip 결과 줄 문구(exportFlow 청크 전용) — 문구 모음은 reactZipText.ts가 다시 내보낸다. COPY.md 확정 문안 */
const MB = 1024 * 1024;
// export.note.reactZip — {size} = 정적 zip 결과 줄과 같은 소수점 한 자리 MB · 이미지 수 · 글꼴(woff2) 수
export const reactZipNote = (bytes: number, images: number, fonts: number) => `zip 1개 · ${(bytes / MB).toFixed(1)}MB (이미지 ${images}장 · 글꼴 ${fonts}개)`;
// export.note.reactZipNext — 다음 할 일
export const REACT_ZIP_NEXT = "압축을 푼 폴더에서 npm ci → npm run dev 순서로 실행하세요. Node.js 버전 조건은 ^20.19.0 || >=22.12.0입니다.";
