import type { LibraryItem, MediaAsset, UnplayableStatus } from "@singology/shared";

export type AssignableItem = Pick<LibraryItem, "id" | "title" | "category">;

export type TakeForReview =
  { playable: true; asset: MediaAsset } | { playable: false; status: UnplayableStatus };
