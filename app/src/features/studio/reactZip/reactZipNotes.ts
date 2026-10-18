/** React zip 결과 줄 문구(exportFlow 청크 전용) — 자리 상수 모음은 reactZipText.ts가 다시 내보낸다 */
const MB = 1024 * 1024;
// TODO(copy): export.note.reactZip — 크기·이미지 수·글꼴 수
export const reactZipNote = (bytes: number, images: number, fonts: number) => `React 프로젝트 zip 1개 · ${(bytes / MB).toFixed(1)}MB (이미지 ${images}장 · 글꼴 ${fonts}개)`;
// TODO(copy): export.note.reactZipNext — 압축 해제 → npm ci → npm run dev, Node 버전 조건
export const REACT_ZIP_NEXT = "압축을 풀고 npm ci → npm run dev 로 실행합니다 (Node 20.19 이상 또는 22.12 이상)";
