import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Gauge } from "lucide-react";
import {
  BatteryIcon,
  ExplorerIcon,
  GithubIcon,
  QuodexAppIcon,
  SearchIcon,
  SettingsGlyph,
  TaskViewIcon,
  VolumeIcon,
  WifiIcon,
  WindowsLogo,
} from "@/components/icons";
import { useDesktopStore, type JumpListId, type WindowId } from "@/lib/desktop/store";
import { WINDOW_META } from "@/lib/desktop/geometry";
import { formatTaskbarTime } from "@/lib/quodex/format";
import { useQuodexStore } from "@/lib/quodex/store";
import { downloadWindowsApp, openProductLink, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Taskbar() {
  const flyout = useDesktopStore((s) => s.flyout);
  const overlay = useDesktopStore((s) => s.overlay);
  const toggleFlyout = useDesktopStore((s) => s.toggleFlyout);
  const toggleOverlay = useDesktopStore((s) => s.toggleOverlay);
  const openWindow = useDesktopStore((s) => s.openWindow);
  const focusWindow = useDesktopStore((s) => s.focusWindow);
  const closeWindow = useDesktopStore((s) => s.closeWindow);
  const minimizeWindow = useDesktopStore((s) => s.minimizeWindow);
  const windows = useDesktopStore((s) => s.windows);
  const focus = useDesktopStore((s) => s.focus);
  const jumpList = useDesktopStore((s) => s.jumpList);
  const jumpListAt = useDesktopStore((s) => s.jumpListAt);
  const setJumpList = useDesktopStore((s) => s.setJumpList);
  const setPeeking = useDesktopStore((s) => s.setPeeking);
  const showDesktop = useDesktopStore((s) => s.showDesktop);
  const notifications = useDesktopStore((s) => s.notifications);
  const efficiency = useDesktopStore((s) => s.efficiency);
  const quodexAlive = useDesktopStore((s) => s.quodexAlive);
  const quodexPinned = useDesktopStore((s) => s.quodexPinned);
  const focused = focus[focus.length - 1];
  const unread = notifications.filter((item) => item.unread).length;

  const launch = (id: WindowId) => {
    if (windows[id].open && !windows[id].minimized && focused === id) {
      minimizeWindow(id);
      return;
    }
    openWindow(id);
    focusWindow(id);
  };

  const openJump = (id: JumpListId, event: { currentTarget: EventTarget & HTMLElement }) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const bar = event.currentTarget.closest(".taskbar")?.getBoundingClientRect();
    const width = bar?.width ?? (typeof window === "undefined" ? 1280 : window.innerWidth);
    const x = Math.min(Math.max(96, (bar ? rect.left + rect.width / 2 - bar.left : rect.left + rect.width / 2)), width - 96);
    setJumpList(id, { x, y: 0 });
  };

  return (
    <div className="taskbar acrylic">
      <button
        type="button"
        className={cn("taskbar-btn", flyout === "start" && "bg-white/10")}
        aria-label="Start"
        onClick={() => toggleFlyout("start")}
        onContextMenu={(event) => {
          event.preventDefault();
          openJump("start", event);
        }}
      >
        <WindowsLogo />
      </button>
      <button
        type="button"
        className={cn("taskbar-btn hide-mobile", flyout === "search" && "bg-white/10")}
        aria-label="Search"
        onClick={() => toggleFlyout("search")}
        onDoubleClick={() => toggleFlyout("search")}
        onContextMenu={(event) => {
          event.preventDefault();
          openJump("start", event);
        }}
      >
        <SearchIcon />
      </button>
      <button
        type="button"
        className={cn("taskbar-btn hide-mobile", overlay === "taskview" && "bg-white/10")}
        aria-label="Task view"
        onClick={() => toggleOverlay("taskview")}
      >
        <TaskViewIcon />
      </button>

      <TaskButton
        id="quodex"
        label="Quodex"
        active={focused === "quodex"}
        open={windows.quodex.open}
        minimized={windows.quodex.minimized}
        onClick={() => launch("quodex")}
        onMenu={(event) => openJump("quodex", event)}
        icon={<QuodexAppIcon size={22} />}
      />
      <TaskButton
        id="explorer"
        label="File Explorer"
        active={focused === "explorer"}
        open={windows.explorer.open}
        minimized={windows.explorer.minimized}
        onClick={() => launch("explorer")}
        onMenu={(event) => openJump("explorer", event)}
        icon={<ExplorerIcon size={22} />}
        hideMobile
      />
      <button
        type="button"
        className="taskbar-btn"
        aria-label="GitHub"
        title="GitHub"
        onClick={() => openProductLink(SITE.source)}
        onDoubleClick={() => openProductLink(SITE.source)}
        onContextMenu={(event) => {
          event.preventDefault();
          openJump("github", event);
        }}
      >
        <GithubIcon size={22} />
      </button>
      <TaskButton
        id="settings"
        label="Settings"
        active={focused === "settings"}
        open={windows.settings.open}
        minimized={windows.settings.minimized}
        onClick={() => launch("settings")}
        onMenu={(event) => openJump("settings", event)}
        icon={<SettingsGlyph size={22} />}
      />
      {windows.taskmgr.open ? (
        <TaskButton
          id="taskmgr"
          label="Task Manager"
          active={focused === "taskmgr"}
          open={windows.taskmgr.open}
          minimized={windows.taskmgr.minimized}
          onClick={() => launch("taskmgr")}
          onMenu={(event) => openJump("taskmgr", event)}
          icon={<Gauge size={18} />}
          hideMobile
        />
      ) : null}

      {jumpList ? (
        <JumpList
          id={jumpList}
          at={jumpListAt}
          onOpen={() => {
            if (jumpList === "tray-quodex") toggleFlyout("quodex-tray");
            else if (jumpList === "github") openProductLink(SITE.source);
            else if (jumpList === "start") toggleFlyout("start");
            else launch(jumpList);
            setJumpList(null);
          }}
          onCloseApp={() => {
            if (jumpList === "quodex") useDesktopStore.getState().hideQuodexToTray();
            else if (jumpList !== "tray-quodex" && jumpList !== "github" && jumpList !== "start") {
              closeWindow(jumpList);
            }
            setJumpList(null);
          }}
        />
      ) : null}

      <div className="tray">
        {quodexAlive ? (
          <button
            type="button"
            className={cn("tray-btn", flyout === "quodex-tray" && "bg-white/10", quodexPinned && "is-pinned")}
            aria-label="Quodex tray"
            title="Quodex — click for usage, right-click or double-click for more"
            onClick={() => toggleFlyout("quodex-tray")}
            onDoubleClick={(event) => {
              event.preventDefault();
              openJump("tray-quodex", event);
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              openJump("tray-quodex", event);
            }}
          >
            <QuodexAppIcon size={16} />
          </button>
        ) : null}
        <button
          type="button"
          className={cn("tray-btn", flyout === "quick" && "bg-white/10")}
          aria-label="Quick settings"
          onClick={() => toggleFlyout("quick")}
          onContextMenu={(event) => {
            event.preventDefault();
            openJump("start", event);
          }}
        >
          <WifiIcon />
          <VolumeIcon />
          <span className="hide-mobile">
            <BatteryIcon />
          </span>
          {efficiency ? <span className="leaf-dot" title="Efficiency mode" /> : null}
        </button>
        <button
          type="button"
          className={cn("tray-btn", flyout === "calendar" && "bg-white/10")}
          aria-label="Calendar and notifications"
          onClick={() => {
            useDesktopStore.getState().markNotificationsRead();
            toggleFlyout("calendar");
          }}
          onDoubleClick={() => {
            useDesktopStore.getState().markNotificationsRead();
            toggleFlyout("calendar");
          }}
        >
          <span className="clock-label flex flex-col items-end leading-tight">
            <TaskbarClock />
            {unread > 0 ? <span className="note-dot" /> : null}
          </span>
        </button>
        <button
          type="button"
          className="show-desktop hide-mobile"
          aria-label="Show desktop"
          title="Show desktop"
          onMouseEnter={() => setPeeking(true)}
          onMouseLeave={() => setPeeking(false)}
          onClick={() => {
            setPeeking(false);
            showDesktop();
          }}
        />
      </div>
    </div>
  );
}

function TaskButton({
  id,
  label,
  icon,
  open,
  active,
  minimized,
  hideMobile,
  onClick,
  onMenu,
}: {
  id: WindowId;
  label: string;
  icon: ReactNode;
  open: boolean;
  active: boolean;
  minimized: boolean;
  hideMobile?: boolean;
  onClick: () => void;
  onMenu: (event: { currentTarget: EventTarget & HTMLElement }) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "taskbar-btn",
        hideMobile && "hide-mobile",
        open && "open",
        active && open && !minimized && "active",
      )}
      aria-label={label}
      data-app={id}
      onClick={onClick}
      onDoubleClick={onClick}
      onContextMenu={(event) => {
        event.preventDefault();
        onMenu(event);
      }}
    >
      {icon}
    </button>
  );
}

function JumpList({
  id,
  at,
  onOpen,
  onCloseApp,
}: {
  id: Exclude<JumpListId, null>;
  at: { x: number; y: number } | null;
  onOpen: () => void;
  onCloseApp: () => void;
}) {
  const refreshAll = useQuodexStore((s) => s.refreshAll);
  const presentLogin = useQuodexStore((s) => s.presentLogin);
  const openWindow = useDesktopStore((s) => s.openWindow);
  const hideQuodexToTray = useDesktopStore((s) => s.hideQuodexToTray);
  const quitQuodex = useDesktopStore((s) => s.quitQuodex);
  const setJumpList = useDesktopStore((s) => s.setJumpList);
  const setFlyout = useDesktopStore((s) => s.setFlyout);
  const quodexOpen = useDesktopStore((s) => s.windows.quodex.open);
  const quodexPinned = useDesktopStore((s) => s.quodexPinned);
  const title =
    id === "tray-quodex" ? "Quodex" : id === "github" ? "GitHub" : id === "start" ? "Start" : WINDOW_META[id].title;
  const quodexish = id === "quodex" || id === "tray-quodex";
  const style = at
    ? ({
        "--jump-x": `${at.x}px`,
        "--jump-y": "0px",
      } as CSSProperties)
    : undefined;

  return (
    <div className={cn("jump-list acrylic", at && "is-anchored")} style={style}>
      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-win-subtle">{title}</p>
      {id === "github" ? (
        <>
          <button type="button" className="jump-item" onClick={onOpen}>
            Open GitHub
          </button>
          <button
            type="button"
            className="jump-item"
            onClick={() => {
              downloadWindowsApp();
              setJumpList(null);
            }}
          >
            Releases
          </button>
          <button
            type="button"
            className="jump-item"
            onClick={() => {
              openProductLink(SITE.authorUrl);
              setJumpList(null);
            }}
          >
            {SITE.author}
          </button>
        </>
      ) : id === "start" ? (
        <>
          <button type="button" className="jump-item" onClick={onOpen}>
            Start
          </button>
          <button
            type="button"
            className="jump-item"
            onClick={() => {
              openWindow("taskmgr");
              setJumpList(null);
            }}
          >
            Task Manager
          </button>
          <button
            type="button"
            className="jump-item"
            onClick={() => {
              openWindow("settings");
              setJumpList(null);
            }}
          >
            Settings
          </button>
          <button
            type="button"
            className="jump-item"
            onClick={() => {
              useDesktopStore.getState().lockDesktop();
              setJumpList(null);
            }}
          >
            Lock
          </button>
        </>
      ) : (
        <>
          <button type="button" className="jump-item" onClick={onOpen}>
            {id === "tray-quodex" ? "Peek usage" : "Open"}
          </button>
          {id === "tray-quodex" ? (
            <>
              <button
                type="button"
                className="jump-item"
                onClick={() => {
                  openWindow("quodex");
                  setJumpList(null);
                }}
              >
                Open window
              </button>
              <button
                type="button"
                className="jump-item"
                onClick={() => {
                  const next = !useDesktopStore.getState().quodexPinned;
                  useDesktopStore.getState().setQuodexPinned(next);
                  if (next) useDesktopStore.getState().setFlyout("quodex-tray");
                  if (window.quodexNative) void window.quodexNative.setFlyoutPinned(next);
                  setJumpList(null);
                }}
              >
                {quodexPinned ? "Unpin flyout" : "Pin flyout"}
              </button>
            </>
          ) : null}
          {quodexish ? (
            <>
              <button
                type="button"
                className="jump-item"
                onClick={() => {
                  openWindow("quodex");
                  void refreshAll("manual");
                  setJumpList(null);
                }}
              >
                Refresh usage
              </button>
              <button
                type="button"
                className="jump-item"
                onClick={() => {
                  openWindow("quodex");
                  presentLogin();
                  setFlyout(null);
                  setJumpList(null);
                }}
              >
                Add account
              </button>
              {quodexOpen ? (
                <button
                  type="button"
                  className="jump-item"
                  onClick={() => {
                    hideQuodexToTray();
                    setJumpList(null);
                  }}
                >
                  Hide to tray
                </button>
              ) : null}
              <button
                type="button"
                className="jump-item text-win-danger"
                onClick={() => {
                  quitQuodex();
                  setJumpList(null);
                }}
              >
                Quit Quodex
              </button>
            </>
          ) : null}
          {id === "taskmgr" || id === "settings" || id === "explorer" ? (
            <button type="button" className="jump-item" onClick={onCloseApp}>
              Close window
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

function TaskbarClock() {
  const [now, setNow] = useState(Date.now());
  const efficiency = useDesktopStore((s) => s.efficiency);
  useEffect(() => {
    const ms = efficiency ? 60_000 : 15_000;
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [efficiency]);
  const clock = formatTaskbarTime(now);
  return (
    <>
      <span className="text-[12px] tabular-nums">{clock.time}</span>
      <span className="hide-mobile text-[11px] tabular-nums text-win-muted">{clock.date}</span>
    </>
  );
}
