import { useEffect, useMemo, useRef, useState } from "react";
import { Gauge, Moon, Power } from "lucide-react";
import {
  ExplorerIcon,
  QuodexAppIcon,
  SettingsGlyph,
  WindowsLogo,
} from "@/components/icons";
import { useDesktopStore, type WindowId } from "@/lib/desktop/store";
import { snapRect, WINDOW_META } from "@/lib/desktop/geometry";
import { formatTaskbarTime } from "@/lib/quodex/format";
import { cn } from "@/lib/utils";

function AppGlyph({ id, size = 28 }: { id: WindowId; size?: number }) {
  if (id === "quodex") return <QuodexAppIcon size={size} />;
  if (id === "explorer") return <ExplorerIcon size={size} />;
  if (id === "settings") return <SettingsGlyph size={size} />;
  return (
    <span className="grid place-items-center rounded-md bg-win-surface" style={{ width: size, height: size }}>
      <Gauge size={Math.round(size * 0.55)} />
    </span>
  );
}

export function SnapPreview() {
  const layout = useDesktopStore((s) => s.snapPreview);
  const viewport = useDesktopStore((s) => s.viewport);
  const rect = layout ? snapRect(layout, viewport.w, viewport.h) : null;
  if (!rect) return null;
  return (
    <div
      className="snap-ghost"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    />
  );
}

export function SnapAssist() {
  const assist = useDesktopStore((s) => s.snapAssist);
  const windows = useDesktopStore((s) => s.windows);
  const viewport = useDesktopStore((s) => s.viewport);
  const snapWindow = useDesktopStore((s) => s.snapWindow);
  const dismiss = useDesktopStore((s) => s.dismissSnapAssist);
  if (!assist) return null;
  const region = snapRect(assist.filler, viewport.w, viewport.h);
  if (!region) return null;
  const candidates = (Object.keys(windows) as WindowId[]).filter(
    (id) => id !== assist.forId && windows[id].open && !windows[id].minimized,
  );
  if (candidates.length === 0) return null;
  return (
    <div
      className="snap-assist"
      style={{ left: region.x, top: region.y, width: region.w, height: region.h }}
    >
      <div className="flex h-full flex-col gap-3 p-6">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-win-muted">Snap a window here</p>
          <button type="button" className="fluent-btn h-7 px-2 text-[11px]" onClick={dismiss}>
            Skip
          </button>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
          {candidates.map((id) => (
            <button
              key={id}
              type="button"
              className="snap-assist-card mica"
              onClick={() => {
                snapWindow(id, assist.filler);
                dismiss();
              }}
            >
              <AppGlyph id={id} size={36} />
              <span className="mt-2 text-[13px] font-medium">{WINDOW_META[id].title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TaskView() {
  const overlay = useDesktopStore((s) => s.overlay);
  const windows = useDesktopStore((s) => s.windows);
  const focusWindow = useDesktopStore((s) => s.focusWindow);
  const closeWindow = useDesktopStore((s) => s.closeWindow);
  const setOverlay = useDesktopStore((s) => s.setOverlay);
  if (overlay !== "taskview") return null;
  const open = (Object.keys(windows) as WindowId[]).filter((id) => windows[id].open);
  return (
    <div className="desktop-overlay" onClick={() => setOverlay(null)}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 pt-[12vh]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[22px] font-semibold">Task view</h2>
        {open.length === 0 ? (
          <p className="text-[14px] text-win-muted">No open windows. Use Start to launch Quodex, Explorer, or Settings.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {open.map((id) => (
              <div key={id} className="relative">
                <button
                  type="button"
                  className="task-thumb mica w-full"
                  onClick={() => {
                    focusWindow(id);
                    setOverlay(null);
                  }}
                >
                  <span className="flex items-center gap-2 px-3 pt-3 text-[12px] font-medium">
                    <AppGlyph id={id} size={18} />
                    {WINDOW_META[id].title}
                  </span>
                  <span className="m-3 mt-2 flex flex-1 items-center justify-center rounded-win bg-black/20">
                    <AppGlyph id={id} size={48} />
                  </span>
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-2 grid size-7 place-items-center rounded-control text-[16px] hover:bg-white/10"
                  aria-label={`Close ${WINDOW_META[id].title}`}
                  onClick={() => closeWindow(id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AppSwitcher() {
  const overlay = useDesktopStore((s) => s.overlay);
  const windows = useDesktopStore((s) => s.windows);
  const focus = useDesktopStore((s) => s.focus);
  const focusWindow = useDesktopStore((s) => s.focusWindow);
  const setOverlay = useDesktopStore((s) => s.setOverlay);
  const open = (Object.keys(windows) as WindowId[]).filter((id) => windows[id].open);
  const [index, setIndex] = useState(Math.max(0, open.length - 1));
  const indexRef = useRef(index);
  indexRef.current = index;

  useEffect(() => {
    if (overlay !== "switcher") return;
    const ordered = [...open].sort((a, b) => focus.indexOf(b) - focus.indexOf(a));
    setIndex(ordered.length > 1 ? 1 : 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        setIndex((value) => {
          const next = event.shiftKey ? value - 1 : value + 1;
          return (next + ordered.length) % Math.max(1, ordered.length);
        });
      }
      if (event.key === "Escape") setOverlay(null);
    };
    const onUp = (event: KeyboardEvent) => {
      if (event.key === "Alt" || event.key === "Meta") {
        const pick = ordered[indexRef.current] ?? ordered[0];
        if (pick) focusWindow(pick);
        setOverlay(null);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onUp);
    };
  }, [overlay, open.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (overlay !== "switcher") return null;
  const ordered = [...open].sort((a, b) => focus.indexOf(b) - focus.indexOf(a));
  if (ordered.length === 0) return null;

  return (
    <div className="desktop-overlay center">
      <div className="switcher acrylic">
        {ordered.map((id, i) => (
          <button
            key={id}
            type="button"
            className={cn("switcher-item", i === index && "is-active")}
            onClick={() => {
              focusWindow(id);
              setOverlay(null);
            }}
          >
            <AppGlyph id={id} size={36} />
            <span className="mt-2 text-[11px]">{WINDOW_META[id].title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const TOAST_LIFE_MS = 5_000;
const TOAST_FADE_MS = 720;

export function DesktopToasts() {
  const notifications = useDesktopStore((s) => s.notifications);
  const dismissNotification = useDesktopStore((s) => s.dismissNotification);
  const flyout = useDesktopStore((s) => s.flyout);
  const [now, setNow] = useState(Date.now());
  const [gone, setGone] = useState<Record<string, true>>({});
  const drag = useRef<{ id: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  if (flyout === "calendar" || flyout === "quick" || flyout === "quodex-tray" || flyout === "start" || flyout === "search") return null;
  const recent = notifications
    .filter((item) => now - item.at < TOAST_LIFE_MS + TOAST_FADE_MS && !gone[item.id])
    .slice(0, 3);
  if (recent.length === 0) return null;

  const hide = (id: string) => {
    setGone((value) => ({ ...value, [id]: true }));
    dismissNotification(id);
  };

  return (
    <div className="toast-stack">
      {recent.map((note) => {
        const age = now - note.at;
        const fading = age >= TOAST_LIFE_MS;
        return (
          <div
            key={note.id}
            className={fading ? "win-toast acrylic is-leaving" : "win-toast acrylic"}
            onPointerDown={(event) => {
              drag.current = { id: note.id, x: event.clientX, y: event.clientY };
            }}
            onPointerUp={(event) => {
              const start = drag.current;
              drag.current = null;
              if (!start || start.id !== note.id) return;
              const dx = event.clientX - start.x;
              const dy = event.clientY - start.y;
              if (dx > 64 || dy < -48) hide(note.id);
            }}
          >
            <div className="win-toast-head">
              <span className="win-toast-app">
                {note.source === "quodex" ? <QuodexAppIcon size={18} /> : <WindowsLogo size={16} />}
                {note.title}
              </span>
              <button
                type="button"
                className="win-toast-close"
                aria-label="Dismiss"
                onClick={() => hide(note.id)}
              >
                ×
              </button>
            </div>
            <p className="win-toast-body">{note.body}</p>
          </div>
        );
      })}
    </div>
  );
}

export function TitleMenu() {
  const menu = useDesktopStore((s) => s.titleMenu);
  const windows = useDesktopStore((s) => s.windows);
  const setTitleMenu = useDesktopStore((s) => s.setTitleMenu);
  const toggleMaximize = useDesktopStore((s) => s.toggleMaximize);
  const minimizeWindow = useDesktopStore((s) => s.minimizeWindow);
  const closeWindow = useDesktopStore((s) => s.closeWindow);
  const quitQuodex = useDesktopStore((s) => s.quitQuodex);
  const snapWindow = useDesktopStore((s) => s.snapWindow);
  if (!menu) return null;
  const win = windows[menu.id];
  const quodex = menu.id === "quodex";
  const items = [
    { label: "Restore", disabled: !win.maximized && !win.snap, action: () => snapWindow(menu.id, null) },
    { label: "Minimize", disabled: false, action: () => minimizeWindow(menu.id) },
    { label: win.maximized ? "Restore down" : "Maximize", disabled: false, action: () => toggleMaximize(menu.id) },
    { label: "Snap left", disabled: false, action: () => snapWindow(menu.id, "left") },
    { label: "Snap right", disabled: false, action: () => snapWindow(menu.id, "right") },
    {
      label: quodex ? "Hide to tray" : "Close",
      disabled: false,
      action: () => closeWindow(menu.id),
      danger: !quodex,
    },
    ...(quodex
      ? [{ label: "Quit Quodex", disabled: false, action: () => quitQuodex(), danger: true }]
      : []),
  ];
  return (
    <div
      className="desktop-context acrylic absolute z-50 min-w-44 rounded-win border border-win-stroke-strong py-1 text-[13px] shadow-[var(--shadow-flyout)]"
      style={{ left: menu.x, top: menu.y }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          disabled={item.disabled}
          className={cn(
            "block w-full px-3 py-1.5 text-left hover:bg-white/8 disabled:opacity-40",
            item.danger && "text-win-danger",
          )}
          onClick={() => {
            item.action();
            setTitleMenu(null);
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function SleepScreen() {
  const power = useDesktopStore((s) => s.power);
  const wake = useDesktopStore((s) => s.wake);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (power !== "sleep") return;
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, [power]);
  if (power !== "sleep") return null;
  const clock = formatTaskbarTime(now);
  return (
    <button type="button" className="power-screen" onClick={wake}>
      <WindowsLogo size={28} />
      <p className="mt-8 text-[64px] font-light tabular-nums leading-none">{clock.time}</p>
      <p className="mt-2 text-[16px] text-win-muted">{clock.date}</p>
      <p className="mt-10 flex items-center gap-2 text-[13px] text-win-subtle">
        <Moon size={14} /> Click or press any key to wake
      </p>
    </button>
  );
}

export function ShutdownScreen() {
  const power = useDesktopStore((s) => s.power);
  const wake = useDesktopStore((s) => s.wake);
  const openWindow = useDesktopStore((s) => s.openWindow);
  if (power !== "off") return null;
  return (
    <button
      type="button"
      className="power-screen"
      onClick={() => {
        wake();
        openWindow("quodex");
      }}
    >
      <WindowsLogo size={36} />
      <p className="mt-6 text-[22px] font-semibold">Windows is ready</p>
      <p className="mt-2 max-w-sm text-[13px] text-win-muted">
        Session ended. Click anywhere — or press the Windows logo — to start Quodex again.
      </p>
      <span className="mt-8 inline-flex items-center gap-2 rounded-win bg-white/8 px-4 py-2 text-[13px]">
        <Power size={14} /> Start
      </span>
    </button>
  );
}
