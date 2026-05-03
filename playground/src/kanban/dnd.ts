export interface DragHandlers {
  onPickup?: (x: number, y: number) => void;
  onMove: (x: number, y: number) => void;
  onDrop: (x: number, y: number, cancelled: boolean) => void;
}

export function trackDrag(
  startX: number,
  startY: number,
  handlers: DragHandlers,
  threshold = 4,
): () => void {
  let picked = false;

  const onMove = (e: PointerEvent) => {
    if (!picked) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (dx * dx + dy * dy < threshold * threshold) return;
      picked = true;
      handlers.onPickup?.(e.clientX, e.clientY);
    }
    handlers.onMove(e.clientX, e.clientY);
  };

  const onUp = (e: PointerEvent) => {
    cleanup();
    if (picked) handlers.onDrop(e.clientX, e.clientY, false);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && picked) {
      cleanup();
      handlers.onDrop(0, 0, true);
    }
  };

  const cleanup = () => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
    document.removeEventListener('keydown', onKey);
  };

  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);
  document.addEventListener('keydown', onKey);

  return cleanup;
}
