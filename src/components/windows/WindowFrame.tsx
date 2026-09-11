import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { CaptionClose, CaptionMax, CaptionMin, CaptionRestore } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useDesktopStore, type WindowId } from "@/lib/desktop/store";
import { edgeSnap, MIN_H, MIN_W, windowFrameRect, type Rect } from "@/lib/desktop/geometry";

interface WindowFrameProps {
  id: WindowId;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export function WindowFrame({ id, title, icon, children, className }: WindowFrameProps) {
  const win = useDesktopStore((s) => s.windows[id]);
  const focus = useDesktopStore((s) => s.focus);
  const viewport = useDesktopStore((s) => s.viewport);
  const peeking = useDesktopStore((s) => s.peeking);
  const reduceMotion = useDesktopStore((s) => s.reduceMotion);
  const closeWindow = useDesktopStore((s) => s.closeWindow);
  const minimizeWindow = useDesktopStore((s) => s.minimizeWindow);
  const toggleMaximize = useDesktopStore((s) => s.toggleMaximize);
  const minimizeToTray = useDesktopStore((s) => s.minimizeToTray);
  const focusWindow = useDesktopStore((s) => s.focusWindow);
  const moveWindow = useDesktopStore((s) => s.moveWindow);
  const resizeWindow = useDesktopStore((s) => s.resizeWindow);
  const snapWindow = useDesktopStore((s) => s.snapWindow);
  const setSnapPreview = useDesktopStore((s) => s.setSnapPreview);
  const setTitleMenu = useDesktopStore((s) => s.setTitleMenu);

  const frameRef = useRef<HTMLElement>(null);
  const liveRef = useRef<Rect | null>(null);
  const drag = useRef<{ ox: number; oy: number; x: number; y: number } | null>(null);
  const resize = useRef<{ edge: ResizeEdge; ox: number; oy: number; rect: Rect } | null>(null);
  const pending = useRef<Rect | null>(null);
  const raf = useRef(0);
  const pickerTimer = useRef<number | null>(null);
  const pickerNode = useRef<HTMLDivElement>(null);
  const [opening, setOpening] = useState(() => !useDesktopStore.getState().reduceMotion);
  const [moving, setMoving] = useState(false);

  const paint = () => {
    raf.current = 0;
    const node = frameRef.current;
    const rect = pending.current;
    if (!node || !rect) return;
    node.style.left = `${rect.x}px`;
    node.style.top = `${rect.y}px`;
    node.style.width = `${rect.w}px`;
    node.style.height = `${rect.h}px`;
  };

  const queueRect = (rect: Rect) => {
    liveRef.current = rect;
    pending.current = rect;
    if (!raf.current) raf.current = requestAnimationFrame(paint);
  };

  const stopQueue = () => {
    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    }
    paint();
  };

  const setDragging = (on: boolean) => {
    const node = frameRef.current;
    if (node) node.classList.toggle("is-dragging", on);
    setMoving(on);
    if (on && opening) {
      node?.classList.remove("is-opening");
      setOpening(false);
    }
  };

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    if (reduceMotion) {
      setOpening(false);
      return;
    }
    const done = (event: AnimationEvent) => {
      if (event.animationName !== "window-in") return;
      setOpening(false);
    };
    node.addEventListener("animationend", done);
    return () => node.removeEventListener("animationend", done);
  }, [id, reduceMotion, win?.open, win?.minimized]);

  useEffect(() => {
    return () => {
      if (pickerTimer.current) window.clearTimeout(pickerTimer.current);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  if (!win?.open || win.minimized) return null;

  const z = 20 + Math.max(0, focus.indexOf(id));
  const focused = focus[focus.length - 1] === id;
  const placed = windowFrameRect(win, viewport.w, viewport.h);
  const floating = !win.maximized && !win.snap;
  const frame = liveRef.current ?? placed;

  const onDragDown = (event: PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    focusWindow(id);
    if (!floating && event.detail === 1) {
      const next = { x: Math.max(0, event.clientX - Math.round(win.w / 2)), y: 8, w: win.w, h: win.h };
      drag.current = { ox: event.clientX, oy: event.clientY, x: next.x, y: next.y };
      liveRef.current = next;
      setDragging(true);
      queueRect(next);
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      return;
    }
    if (!floating) return;
    drag.current = { ox: event.clientX, oy: event.clientY, x: win.x, y: win.y };
    liveRef.current = { x: win.x, y: win.y, w: win.w, h: win.h };
    setDragging(true);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onTitleMove = (event: PointerEvent<HTMLElement>) => {
    if (resize.current || !drag.current) return;
    const nx = drag.current.x + (event.clientX - drag.current.ox);
    const ny = Math.max(0, drag.current.y + (event.clientY - drag.current.oy));
    const size = liveRef.current ?? placed;
    queueRect({ x: nx, y: ny, w: size.w, h: size.h });
    setSnapPreview(edgeSnap(event.clientX, event.clientY, viewport.w, viewport.h));
  };

  const finishDrag = (event: PointerEvent<HTMLElement>) => {
    if (!drag.current) return;
    const nx = drag.current.x + (event.clientX - drag.current.ox);
    const ny = Math.max(0, drag.current.y + (event.clientY - drag.current.oy));
    const size = liveRef.current ?? placed;
    const snap = edgeSnap(event.clientX, event.clientY, viewport.w, viewport.h);
    drag.current = null;
    liveRef.current = { x: nx, y: ny, w: size.w, h: size.h };
    stopQueue();
    setDragging(false);
    setSnapPreview(null);
    liveRef.current = null;
    if (snap) {
      snapWindow(id, snap);
      return;
    }
    moveWindow(id, nx, ny);
  };

  const onResizeDown = (edge: ResizeEdge) => (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (!floating) return;
    focusWindow(id);
    resize.current = { edge, ox: event.clientX, oy: event.clientY, rect: { ...placed } };
    liveRef.current = { ...placed };
    setDragging(true);
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
  };

  const onResizeMove = (event: PointerEvent<HTMLDivElement>) => {
    const session = resize.current;
    if (!session) return;
    const dx = event.clientX - session.ox;
    const dy = event.clientY - session.oy;
    let { x, y, w, h } = session.rect;
    if (session.edge.includes("e")) w = session.rect.w + dx;
    if (session.edge.includes("s")) h = session.rect.h + dy;
    if (session.edge.includes("w")) {
      w = session.rect.w - dx;
      x = session.rect.x + dx;
    }
    if (session.edge.includes("n")) {
      h = session.rect.h - dy;
      y = session.rect.y + dy;
    }
    if (w < MIN_W) {
      if (session.edge.includes("w")) x = session.rect.x + session.rect.w - MIN_W;
      w = MIN_W;
    }
    if (h < MIN_H) {
      if (session.edge.includes("n")) y = session.rect.y + session.rect.h - MIN_H;
      h = MIN_H;
    }
    queueRect({ x, y, w, h });
  };

  const onResizeUp = () => {
    if (!resize.current) return;
    const rect = liveRef.current ?? placed;
    resize.current = null;
    stopQueue();
    setDragging(false);
    liveRef.current = null;
    resizeWindow(id, rect);
  };

  const openPicker = () => {
    if (pickerTimer.current) window.clearTimeout(pickerTimer.current);
    pickerTimer.current = window.setTimeout(() => {
      if (pickerNode.current) pickerNode.current.hidden = false;
    }, 520);
  };
  const closePicker = () => {
    if (pickerTimer.current) window.clearTimeout(pickerTimer.current);
    pickerTimer.current = window.setTimeout(() => {
      if (pickerNode.current) pickerNode.current.hidden = true;
    }, 160);
  };

  return (
    <section
      ref={frameRef}
      className={cn(
        "win-window mica",
        opening && "is-opening",
        moving && "is-dragging",
        win.maximized && "is-maximized",
        peeking && "is-peeking",
        focused && "is-focused",
        className,
      )}
      style={
        win.maximized && !moving
          ? { zIndex: z, borderRadius: 0 }
          : {
              left: frame.x,
              top: frame.y,
              width: frame.w,
              height: frame.h,
              zIndex: z,
              borderRadius: win.maximized ? 0 : undefined,
            }
      }
      onMouseDown={() => focusWindow(id)}
      data-focused={focused}
      data-window={id}
    >
      {floating
        ? (["n", "s", "e", "w", "ne", "nw", "se", "sw"] as ResizeEdge[]).map((edge) => (
            <div
              key={edge}
              className={cn("win-resize", edge)}
              onPointerDown={onResizeDown(edge)}
              onPointerMove={onResizeMove}
              onPointerUp={onResizeUp}
              onPointerCancel={onResizeUp}
            />
          ))
        : null}

      <header
        className="win-titlebar"
        onPointerDown={onDragDown}
        onPointerMove={onTitleMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onDoubleClick={() => toggleMaximize(id)}
        onContextMenu={(event) => {
          event.preventDefault();
          setTitleMenu({ id, x: event.clientX, y: event.clientY });
        }}
      >
        <span className="flex min-w-0 items-center gap-2 text-[12px] font-medium">
          {icon}
          <span className="truncate">{title}</span>
        </span>
        <div className="win-caption">
          <button
            type="button"
            className="hide-mobile"
            title={id === "quodex" && minimizeToTray ? "Hide to tray" : "Minimize"}
            aria-label={id === "quodex" && minimizeToTray ? "Hide to tray" : "Minimize"}
            onClick={() => minimizeWindow(id)}
          >
            <CaptionMin />
          </button>
          <div className="snap-host hide-mobile" onMouseEnter={openPicker} onMouseLeave={closePicker}>
            <button
              type="button"
              title={win.maximized ? "Restore" : "Maximize"}
              aria-label={win.maximized ? "Restore" : "Maximize"}
              onClick={() => toggleMaximize(id)}
            >
              {win.maximized ? <CaptionRestore /> : <CaptionMax />}
            </button>
            <div ref={pickerNode} hidden>
              <SnapPicker id={id} onPick={() => {
                if (pickerNode.current) pickerNode.current.hidden = true;
              }} />
            </div>
          </div>
          <button
            type="button"
            title={id === "quodex" ? "Hide to tray" : "Close"}
            aria-label={id === "quodex" ? "Hide to tray" : "Close"}
            className="caption-close"
            onClick={() => closeWindow(id)}
          >
            <CaptionClose />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}

function SnapPicker({ id, onPick }: { id: WindowId; onPick: () => void }) {
  const snapWindow = useDesktopStore((s) => s.snapWindow);
  const toggleMaximize = useDesktopStore((s) => s.toggleMaximize);

  return (
    <div className="snap-picker acrylic" role="menu" aria-label="Snap layouts">
      <button
        type="button"
        className="snap-preset"
        aria-label="Snap left"
        onClick={() => {
          snapWindow(id, "left");
          onPick();
        }}
      >
        <span className="snap-cell is-wide" />
        <span className="snap-cell is-ghost" />
        <span className="snap-caption">Left</span>
      </button>
      <button
        type="button"
        className="snap-preset"
        aria-label="Maximize"
        onClick={() => {
          toggleMaximize(id);
          onPick();
        }}
      >
        <span className="snap-cell is-full" />
        <span className="snap-caption">Max</span>
      </button>
      <button
        type="button"
        className="snap-preset"
        aria-label="Snap right"
        onClick={() => {
          snapWindow(id, "right");
          onPick();
        }}
      >
        <span className="snap-cell is-ghost" />
        <span className="snap-cell is-wide" />
        <span className="snap-caption">Right</span>
      </button>
    </div>
  );
}
