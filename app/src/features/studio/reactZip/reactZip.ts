/**
 * React 프로젝트(zip) 생성기 (REACTZIP-SPEC r1 · FR-PUB-02) — 조작 뒤 청크(exportFlow의 별도 retryableImport 슬롯, RZQ-02 A).
 * E0: 배선·예산 관문용 자리. 생성 본문은 E1에서 채운다.
 */
import type { ExportGenerator } from "../../../data/projectRepository";
import type { StudioReader } from "../../../data/studioStore";
import type { ExportSummary, ReadImage } from "../staticHtml/exportImages";

export interface ReactZipDeps {
  readonly readImage: ReadImage;
  readonly onBuilt: (downloadRef: string, summary: ExportSummary) => void;
}

export function createReactZipGenerator(...args: [store: StudioReader, deps?: Partial<ReactZipDeps>]): ExportGenerator {
  void args;
  return async () => {
    throw new Error("React zip 생성기 미구현(E1)");
  };
}
