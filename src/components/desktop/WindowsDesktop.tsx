import { useEffect, useRef, type CSSProperties } from "react";
import { CalendarFlyout, QuickSettings, SearchFlyout, StartMenu } from "./Flyouts";
import {
  ContextMenu,
  DesktopIcons,
  ExplorerWindow,
  SettingsWindow,
  TaskManagerWindow,
} from "./SystemWindows";
import {
  AppSwitcher,
  DesktopToasts,
  ShutdownScreen,
  SleepScreen,
  SnapAssist,
  SnapPreview,
  TaskView,
  TitleMenu,
} from "./Overlays";
import { Taskbar } from "./Taskbar";
import { LockScreen, MobileDownloadBar, WelcomeTip } from "./LockScreen";
import { QuodexFlyout } from "@/components/quodex/QuodexFlyout";
import { QuodexWindow } from "@/components/quodex/QuodexWindow";
import { RemoveDialog } from "@/components/quodex/RemoveDialog";
import { useDesktopStore, ACCENTS, type WindowId } from "@/lib/desktop/store";
import { AUTO_REFRESH_MS, nextResetForAccount } from "@/lib/quodex/types";
import { useQuodexStore } from "@/lib/quodex/store";

export function WindowsDesktop() {
  const theme = useDesktopStore((s) => s.theme);
  const accent = useDesktopStore((s) => s.accent);
  const transparency = useDesktopStore((s) => s.transparency);
  const efficiency = useDesktopStore((s) => s.efficiency);
  const reduceMotion = useDesktopStore((s) => s.reduceMotion);
  const brightness = useDesktopStore((s) => s.brightness);
  const flyout = useDesktopStore((s) => s.flyout);
  const contextMenu = useDesktopStore((s) => s.contextMenu);
  const setFlyout = useDesktopStore((s) => s.setFlyout);
  const setContextMenu = useDesktopStore((s) => s.setContextMenu);
  const quodexPinned = useDesktopStore((s) => s.quodexPinned);
  const removeTarget = useDesktopStore((s) => s.removeTarget);
  const power = useDesktopStore((s) => s.power);
  const notified = useRef<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    useDesktopStore.getState().setViewport(window.innerWidth, window.innerHeight);
    void Promise.all([useQuodexStore.persist.rehydrate(), useDesktopStore.persist.rehydrate()]).then(() => {
      if (cancelled) return;
      useQuodexStore.getState().hydrate();
      useDesktopStore.getState().hydrate();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncViewport = () => useDesktopStore.getState().setViewport(window.innerWidth, window.innerHeight);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(".flyout, .taskbar, .jump-list, .desktop-context, .win-window, .snap-picker, .welcome-tip, .win-toast, .toast-card")) {
        return;
      }
      const desktop = useDesktopStore.getState();
      desktop.setFlyout(null);
      desktop.setJumpList(null);
      desktop.setContextMenu(null);
      desktop.setTitleMenu(null);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    const tick = () => {
      const desktop = useDesktopStore.getState();
      if (desktop.power !== "on") return;
      const quodexOpen = desktop.windows.quodex.open && !desktop.windows.quodex.minimized;
      const needsTick =
        desktop.quodexAlive ||
        quodexOpen ||
        desktop.flyout === "quodex-tray" ||
        desktop.flyout === "calendar" ||
        !desktop.efficiency;
      if (!needsTick) return;
      useQuodexStore.getState().tick();

      const now = Date.now();
      for (const account of useQuodexStore.getState().accounts) {
        if (!account.resetNotificationsEnabled || account.isDemo) continue;
        const reset = nextResetForAccount(account, now);
        if (!reset || reset <= now || reset - now > 2 * 60 * 1000) continue;
        if (notified.current[account.id] === reset) continue;
        notified.current[account.id] = reset;
        desktop.pushNotification({
          title: "Quodex",
          body: `${account.email} is about to reset a usage window.`,
          source: "quodex",
        });
      }
    };
    tick();
    const interval = window.setInterval(tick, efficiency ? 60_000 : 15_000);
    const refreshMs = efficiency ? AUTO_REFRESH_MS * 2 : AUTO_REFRESH_MS;
    const refresh = window.setInterval(() => {
      const desktop = useDesktopStore.getState();
      if (desktop.power !== "on" || !desktop.quodexAlive) return;
      void useQuodexStore.getState().refreshAll("automatic");
    }, refreshMs);

    const onKey = (event: KeyboardEvent) => {
      const desktop = useDesktopStore.getState();
      const chord = event.ctrlKey || event.metaKey || event.altKey;
      if (event.isComposing || event.key === "Tab" || event.key === "Shift" || event.key === "Control" || event.key === "Alt" || event.key === "Meta") {
        return;
      }
      if (desktop.power === "lock") {
        if (chord || event.key.startsWith("F")) return;
        if (event.key.length === 1 || event.key === "Enter" || event.key === " ") {
          desktop.enterDesktop();
        }
        return;
      }
      if (desktop.power === "sleep" || desktop.power === "off") {
        if (chord || event.key.startsWith("F")) return;
        if (event.key.length === 1 || event.key === "Enter" || event.key === " ") {
          desktop.wake();
          if (desktop.power === "off") desktop.openWindow("quodex");
        }
        return;
      }
      if (event.key === "Escape") {
        desktop.setFlyout(null);
        desktop.setContextMenu(null);
        desktop.setJumpList(null);
        desktop.setTitleMenu(null);
        desktop.setOverlay(null);
        desktop.dismissSnapAssist();
        return;
      }

      const meta = event.metaKey || event.ctrlKey;
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if (event.altKey && event.key === "Tab") {
        event.preventDefault();
        desktop.setOverlay("switcher");
        return;
      }
      if (event.altKey && event.key === "F4") {
        event.preventDefault();
        const focused = desktop.focus[desktop.focus.length - 1];
        if (focused) desktop.closeWindow(focused);
        return;
      }
      if (event.ctrlKey && event.shiftKey && event.key === "Escape") {
        event.preventDefault();
        desktop.openWindow("taskmgr");
        return;
      }
      if (!meta || typing) return;

      const key = event.key.toLowerCase();
      if (key === "e") {
        event.preventDefault();
        desktop.openWindow("explorer");
      } else if (key === ",") {
        event.preventDefault();
        desktop.openWindow("settings");
      } else if (key === "k" || key === "s") {
        event.preventDefault();
        desktop.toggleFlyout("search");
      } else if (key === "d") {
        event.preventDefault();
        desktop.showDesktop();
      } else if (key === "a") {
        event.preventDefault();
        desktop.toggleFlyout("quick");
      } else if (key === "n") {
        event.preventDefault();
        desktop.toggleFlyout("calendar");
      } else if (key === "escape" || event.key === "Meta") {
        desktop.toggleFlyout("start");
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        snapFocused("left");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        snapFocused("right");
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        snapFocused("maximize");
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        const focused = desktop.focus[desktop.focus.length - 1];
        if (!focused) return;
        const win = desktop.windows[focused];
        if (win.maximized || win.snap) desktop.snapWindow(focused, null);
        else desktop.minimizeWindow(focused);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.clearInterval(interval);
      window.clearInterval(refresh);
      window.removeEventListener("keydown", onKey);
    };
  }, [efficiency, setContextMenu, setFlyout]);

  const palette = ACCENTS[accent];
  const accentColor = theme === "dark" ? palette.dark : palette.light;
  const accentInk = theme === "dark" ? palette.inkDark : palette.inkLight;

  return (
    <div
      className="desktop-root"
      data-theme={theme}
      data-accent={accent}
      data-effects={transparency ? "on" : "off"}
      data-efficiency={efficiency ? "on" : "off"}
      data-motion={reduceMotion ? "reduce" : "full"}
      data-power={power}
      suppressHydrationWarning
      style={
        {
          "--color-win-accent": accentColor,
          "--color-win-accent-hover": accentColor,
          "--color-win-accent-ink": accentInk,
          "--wallpaper-brightness": String(brightness / 100),
        } as CSSProperties
      }
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          if (!quodexPinned) setFlyout(null);
          setContextMenu(null);
          useDesktopStore.getState().setJumpList(null);
          useDesktopStore.getState().setTitleMenu(null);
        }
      }}
    >
      <div
        className="desktop-wallpaper"
        onMouseDown={() => {
          if (!quodexPinned) setFlyout(null);
          setContextMenu(null);
          useDesktopStore.getState().setJumpList(null);
          useDesktopStore.getState().setTitleMenu(null);
          useDesktopStore.getState().dismissSnapAssist();
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          setContextMenu({ x: event.clientX, y: event.clientY });
        }}
      />
      {power === "on" ? (
        <>
          <DesktopIcons />
          <QuodexWindow />
          <SettingsWindow />
          <ExplorerWindow />
          <TaskManagerWindow />
          <SnapPreview />
          <SnapAssist />
          {flyout === "start" || flyout === "power" ? <StartMenu /> : null}
          {flyout === "search" ? <SearchFlyout /> : null}
          {flyout === "calendar" ? <CalendarFlyout /> : null}
          {flyout === "quick" ? <QuickSettings /> : null}
          {flyout === "quodex-tray" ? <QuodexFlyout /> : null}
          {contextMenu ? <ContextMenu x={contextMenu.x} y={contextMenu.y} /> : null}
          <TitleMenu />
          {removeTarget ? <RemoveDialog /> : null}
          <DesktopToasts />
          <WelcomeTip />
          <MobileDownloadBar />
          <TaskView />
          <AppSwitcher />
          <Taskbar />
        </>
      ) : null}
      <LockScreen />
      <SleepScreen />
      <ShutdownScreen />
    </div>
  );
}

function snapFocused(layout: "left" | "right" | "maximize") {
  const desktop = useDesktopStore.getState();
  const focused = desktop.focus[desktop.focus.length - 1] as WindowId | undefined;
  if (!focused) return;
  desktop.snapWindow(focused, layout);
}
