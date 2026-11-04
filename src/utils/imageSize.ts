export const MIN_IMAGE_WIDTH = 100;

/**
 * Width of an image being dragged: the start width plus the drag distance, never below the minimum and never wider
 * than the text column (`maxWidth`, 0 when unknown), so an image can not be dragged out of the paper.
 */
export function resizedWidth(startWidth: number, diffX: number, maxWidth: number): number {
  const wanted = Math.max(MIN_IMAGE_WIDTH, startWidth + diffX);
  return maxWidth > 0 ? Math.min(wanted, Math.max(MIN_IMAGE_WIDTH, maxWidth)) : wanted;
}
