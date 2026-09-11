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

  const drag = useRef<{ ox: number; oy: number; x: number; y: number } | null>(null);
  const resize = useRef<{ edge: ResizeEdge; ox: number; oy: number; rect: Rect } | null>(null);
  const [live, setLive] = useState<{ x: number; y: number; w?: number; h?: number } | null>(null);
  const [picker, setPicker] = useState(false);
  const pickerTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pickerTimer.current) window.clearTimeout(pickerTimer.current);
    };
  }, []);

  if (!win?.open || win.minimized) return null;

  const z = 20 + Math.max(0, focus.indexOf(id));
  const focused = focus[focus.length - 1] === id;
  const placed = windowFrameRect(win, viewport.w, viewport.h);
  const floating = !win.maximized && !win.snap;
  const frame = live
    ? { x: live.x, y: live.y, w: live.w ?? placed.w, h: live.h ?? placed.h }
    : placed;

  const onDragDown = (event: PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    focusWindow(id);
    if (!floating && event.detail === 1) {

      const next = { x: Math.max(0, event.clientX - 180), y: 12, w: win.w, h: win.h };
      drag.current = { ox: event.clientX, oy: event.clientY, x: next.x, y: next.y };
      setLive(next);
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      return;
    }
    if (!floating) return;
    drag.current = { ox: event.clientX, oy: event.clientY, x: win.x, y: win.y };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onTitleMove = (event: PointerEvent<HTMLElement>) => {
    if (resize.current) return;
    if (!drag.current) return;
    const nx = drag.current.x + (event.clientX - drag.current.ox);
    const ny = Math.max(0, drag.current.y + (event.clientY - drag.current.oy));
    setLive({ x: nx, y: ny });
    setSnapPreview(edgeSnap(event.clientX, event.clientY, viewport.w, viewport.h));
  };

  const onTitleUp = (event: PointerEvent<HTMLElement>) => {
    if (!drag.current) return;
    const nx = drag.current.x + (event.clientX - drag.current.ox);
    const ny = Math.max(0, drag.current.y + (event.clientY - drag.current.oy));
    const snap = edgeSnap(event.clientX, event.clientY, viewport.w, viewport.h);
    drag.current = null;
    setLive(null);
    setSnapPreview(null);
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
    setLive({ x, y, w, h });
  };

  const onResizeUp = () => {
    if (!resize.current || !live) {
      resize.current = null;
      return;
    }
    resizeWindow(id, { x: live.x, y: live.y, w: live.w ?? placed.w, h: live.h ?? placed.h });
    resize.current = null;
    setLive(null);
  };

  const openPicker = () => {
    if (pickerTimer.current) window.clearTimeout(pickerTimer.current);
    pickerTimer.current = window.setTimeout(() => setPicker(true), 520);
  };
  const closePicker = () => {
    if (pickerTimer.current) window.clearTimeout(pickerTimer.current);
    pickerTimer.current = window.setTimeout(() => setPicker(false), 160);
  };

  return (
    <section
      className={cn("win-window mica", peeking && "is-peeking", focused && "is-focused", className)}
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.w,
        height: frame.h,
        zIndex: z,
        borderRadius: win.maximized ? 0 : undefined,
        animation: live ? "none" : undefined,
      }}
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
            />
          ))
        : null}

      <header
        className="win-titlebar"
        onPointerDown={onDragDown}
        onPointerMove={onTitleMove}
        onPointerUp={onTitleUp}
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
            title={id === "quodex" && minimizeToTray ? "Hide to tray" : "Minimize"}
            aria-label={id === "quodex" && minimizeToTray ? "Hide to tray" : "Minimize"}
            onClick={() => minimizeWindow(id)}
          >
            <CaptionMin />
          </button>
          <div className="snap-host" onMouseEnter={openPicker} onMouseLeave={closePicker}>
            <button
              type="button"
              title={win.maximized ? "Restore" : "Maximize"}
              aria-label={win.maximized ? "Restore" : "Maximize"}
              onClick={() => toggleMaximize(id)}
            >
              {win.maximized ? <CaptionRestore /> : <CaptionMax />}
            </button>
            {picker ? <SnapPicker id={id} onPick={() => setPicker(false)} /> : null}
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
