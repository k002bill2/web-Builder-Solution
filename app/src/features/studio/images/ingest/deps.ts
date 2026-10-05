/**
 * 브라우저 의존(디코드·축소·인코딩) 주입 경계 — jsdom은 디코드를 못 하므로 테스트는 이 모양의 가짜를 넣는다.
 * 기본 구현은 호출 시점에만 브라우저 전역(`createImageBitmap`·`OffscreenCanvas`·`document`)을 읽는다.
 */
export interface IngestBitmap {
  readonly width: number;
  readonly height: number;
  close(): void;
}

export interface IngestDeps {
  /** `createImageBitmap` 모양. 원본 디코드 = (file, {imageOrientation:"from-image"}) · 축소 = (bitmap, {resizeWidth, resizeHeight, resizeQuality:"high"}) */
  readonly createImageBitmap: (source: Blob | IngestBitmap, options: ImageBitmapOptions) => Promise<IngestBitmap>;
  /** bitmap을 같은 크기 캔버스에 그려 인코딩한다(캔버스 결과에는 메타데이터가 실리지 않는다 = EXIF 제거). */
  readonly encode: (bitmap: IngestBitmap, type: string, quality?: number) => Promise<Blob>;
  /** `resizeWidth` 미지원 대체(SPEC 11절): 캔버스에 축소해 그린 뒤 bitmap으로 돌려준다. */
  readonly drawScaled: (bitmap: IngestBitmap, width: number, height: number) => Promise<IngestBitmap>;
}

interface Surface {
  readonly canvas: OffscreenCanvas | HTMLCanvasElement;
  toBlob(type: string, quality?: number): Promise<Blob>;
  release(): void;
}

/** OffscreenCanvas, 없으면 HTMLCanvasElement. bitmap을 (width × height)로 그린다 — 높은 품질 보간. */
function drawSurface(bitmap: IngestBitmap, width: number, height: number): Surface {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    paint(canvas.getContext("2d"), bitmap, width, height);
    return { canvas, toBlob: (type, quality) => canvas.convertToBlob({ type, quality }), release: () => undefined };
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext("2d"), bitmap, width, height);
  const toBlob = (type: string, quality?: number): Promise<Blob> =>
    new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("인코딩 실패"))), type, quality);
    });
  const release = (): void => {
    canvas.width = 0;
    canvas.height = 0;
  };
  return { canvas, toBlob, release };
}

function paint(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null, bitmap: IngestBitmap, width: number, height: number): void {
  if (!context) throw new Error("캔버스 2D 컨텍스트를 만들 수 없습니다");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap as ImageBitmap, 0, 0, width, height);
}

async function encodeOnCanvas(bitmap: IngestBitmap, type: string, quality?: number): Promise<Blob> {
  const surface = drawSurface(bitmap, bitmap.width, bitmap.height);
  try {
    return await surface.toBlob(type, quality);
  } finally {
    surface.release();
  }
}

async function drawScaledOnCanvas(bitmap: IngestBitmap, width: number, height: number): Promise<IngestBitmap> {
  const surface = drawSurface(bitmap, width, height);
  try {
    return await createImageBitmap(surface.canvas);
  } finally {
    surface.release();
  }
}

export const browserIngestDeps: IngestDeps = {
  createImageBitmap: (source, options) => createImageBitmap(source as ImageBitmapSource, options),
  encode: encodeOnCanvas,
  drawScaled: drawScaledOnCanvas,
};
