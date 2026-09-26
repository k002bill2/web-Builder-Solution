/**
 * 로컬 이미지 id 형식 (SPEC r3 5.9 · Q-13 — UUID v4 소문자만). 브랜드 타입 `LocalImageId`를 만드는 곳은 이 함수와 validatePageDoc 결과뿐이다.
 * 발급은 화면 이미지 보관소의 `crypto.randomUUID()` → 이 함수로 변환. setSlot은 형식을 다시 보지 않는다(Q-12 A — 타입으로만).
 */
import type { LocalImageId } from "../contracts/pageDoc";

/** UUID v4 소문자(`crypto.randomUUID()` 모양) — blob:·data:·URL은 여기서 걸린다 */
export const LOCAL_IMAGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function parseLocalImageId(value: string): LocalImageId | null {
  return LOCAL_IMAGE_ID.test(value) ? (value as LocalImageId) : null;
}
