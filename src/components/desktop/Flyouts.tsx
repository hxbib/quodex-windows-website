import { useMemo, useState, type ReactNode } from "react";
import {
  Bluetooth,
  ChevronLeft,
  ChevronRight,
  Download,
  Gauge,
  Leaf,
  Monitor,
  Moon,
  Power,
  RotateCcw,
  Search,
  Sun,
  User,
  Wifi,
} from "lucide-react";
import {
  ExplorerIcon,
  GithubIcon,
  QuodexAppIcon,
  SettingsGlyph,
} from "@/components/icons";
import { useDesktopStore, type WindowId } from "@/lib/desktop/store";
import { displayPlan } from "@/lib/quodex/types";
import { useQuodexStore } from "@/lib/quodex/store";
import { downloadWindowsApp, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const PINNED: Array<{ id: WindowId | "github"; label: string }> = [
  { id: "quodex", label: "Quodex" },
  { id: "explorer", label: "Explorer" },
  { id: "settings", label: "Settings" },
  { id: "taskmgr", label: "Task Manager" },
  { id: "github", label: "GitHub" },
];

function AppIcon({ id, size = 28 }: { id: WindowId | "github"; size?: number }) {
  if (id === "quodex") return <QuodexAppIcon size={size} />;
  if (id === "explorer") return <ExplorerIcon size={size} />;
  if (id === "settings") return <SettingsGlyph size={size} />;
  if (id === "github") return <GithubIcon size={size} />;
  return (
    <span className="grid place-items-center rounded-md bg-win-surface" style={{ width: size, height: size }}>
      <Gauge size={Math.round(size * 0.55)} />
    </span>
  );
}

export function StartMenu() {
  const openWindow = useDesktopStore((s) => s.openWindow);
  const setFlyout = useDesktopStore((s) => s.setFlyout);
  const allApps = useDesktopStore((s) => s.startAllApps);
  const setAllApps = useDesktopStore((s) => s.setStartAllApps);
  const setPower = useDesktopStore((s) => s.setPower);
  const lockDesktop = useDesktopStore((s) => s.lockDesktop);
  const restartDesktop = useDesktopStore((s) => s.restartDesktop);
  const shutDown = useDesktopStore((s) => s.shutDown);
  const flyout = useDesktopStore((s) => s.flyout);

  const launch = (id: WindowId | "github") => {
    if (id === "github") {
      window.open(SITE.source, "_blank", "noopener,noreferrer");
      setFlyout(null);
      return;
    }
    openWindow(id);
    setFlyout(null);
  };

  const apps = [...PINNED].sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div
      className="flyout acrylic"
      style={{ left: "max(12px, calc(50% - 320px))", bottom: 56, width: 640, maxWidth: "calc(100vw - 24px)" }}
    >
      <div className="px-7 pt-6">
        <label className="flex items-center gap-2 rounded-win bg-win-surface/70 px-3 py-2">
          <Search size={16} className="text-win-subtle" />
          <input
            className="w-full bg-transparent text-[14px] text-win-text outline-none placeholder:text-win-subtle"
            placeholder="Search for apps, settings, and documents"
            aria-label="Search for apps, settings, and documents"
            onFocus={() => useDesktopStore.getState().setFlyout("search")}
          />
        </label>
        {allApps ? (
          <>
            <div className="mt-5 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold">All apps</h2>
              <button type="button" className="fluent-btn h-7 px-2 text-[11px]" onClick={() => setAllApps(false)}>
                Back
              </button>
            </div>
            <ul className="mt-3 max-h-72 overflow-y-auto">
              {apps.map((app) => (
                <li key={app.label}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-win px-2 py-2 text-left hover:bg-white/8"
                    onClick={() => launch(app.id)}
                  >
                    <AppIcon id={app.id} size={24} />
                    <span className="text-[13px]">{app.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <div className="mt-5 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold">Pinned</h2>
              <button type="button" className="text-[12px] text-win-subtle hover:text-win-text" onClick={() => setAllApps(true)}>
                All apps
              </button>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {PINNED.map((app) => (
                <button
                  key={app.label}
                  type="button"
                  className="flex flex-col items-center gap-1 rounded-win px-2 py-3 hover:bg-white/8"
                  onClick={() => launch(app.id)}
                  onDoubleClick={() => launch(app.id)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    if (app.id === "github") {
                      window.open(SITE.source, "_blank", "noopener,noreferrer");
                      setFlyout(null);
                      return;
                    }
                    openWindow(app.id);
                    setFlyout(null);
                  }}
                >
                  <AppIcon id={app.id} />
                  <span className="text-[11px]">{app.label}</span>
                </button>
              ))}
            </div>
            <h2 className="mt-5 text-[14px] font-semibold">Recommended</h2>
            <button
              type="button"
              className="mt-2 flex w-full items-center gap-3 rounded-win px-2 py-2 text-left hover:bg-white/8"
              onClick={() => launch("quodex")}
            >
              <QuodexAppIcon size={24} />
              <span>
                <span className="block text-[13px] font-medium">Quodex</span>
                <span className="text-[11px] text-win-subtle">Sample usage tracker</span>
              </span>
            </button>
            <button
              type="button"
              className="mt-1 flex w-full items-center gap-3 rounded-win px-2 py-2 text-left hover:bg-white/8"
              onClick={() => {
                downloadWindowsApp();
                setFlyout(null);
              }}
            >
              <span className="grid size-6 place-items-center rounded-md bg-quodex text-white">
                <Download size={14} />
              </span>
              <span>
                <span className="block text-[13px] font-medium">{SITE.downloadLabel}</span>
                <span className="text-[11px] text-win-subtle">Portable Windows build</span>
              </span>
            </button>
            <p className="mt-2 px-2 text-[11px] text-win-subtle">Tip: Close hides to the tray · Lock returns to the landing page</p>
          </>
        )}
      </div>
      <footer className="mt-4 flex items-center justify-between border-t border-win-stroke px-6 py-3">
        <a
          href={SITE.authorUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-[13px] text-win-text hover:bg-white/8 rounded-win px-1 py-1"
        >
          <span className="grid size-8 place-items-center rounded-full bg-quodex/80">
            <User size={16} />
          </span>
          {SITE.author}
        </a>
        <div className="relative flex items-center gap-1">
          <button
            type="button"
            className="tray-btn"
            aria-label="Power"
            onClick={() => useDesktopStore.getState().setFlyout(flyout === "power" ? "start" : "power")}
          >
            <Power size={16} />
          </button>
          {flyout === "power" ? (
            <div className="power-menu acrylic">
              <button type="button" className="jump-item" onClick={() => lockDesktop()}>
                <Monitor size={14} /> Lock
              </button>
              <button type="button" className="jump-item" onClick={() => setPower("sleep")}>
                <Moon size={14} /> Sleep
              </button>
              <button type="button" className="jump-item" onClick={restartDesktop}>
                <RotateCcw size={14} /> Restart
              </button>
              <button type="button" className="jump-item" onClick={shutDown}>
                <Power size={14} /> Shut down
              </button>
            </div>
          ) : null}
        </div>
      </footer>
    </div>
  );
}

export function SearchFlyout() {
  const [query, setQuery] = useState("");
  const openWindow = useDesktopStore((s) => s.openWindow);
  const setFlyout = useDesktopStore((s) => s.setFlyout);
  const setSettingsSection = useDesktopStore((s) => s.setSettingsSection);
  const setEfficiency = useDesktopStore((s) => s.setEfficiency);
  const efficiency = useDesktopStore((s) => s.efficiency);
  const showDesktop = useDesktopStore((s) => s.showDesktop);
  const accounts = useQuodexStore((s) => s.accounts);
  const refreshAll = useQuodexStore((s) => s.refreshAll);

  const catalog = useMemo(
    () => [
      { type: "App", label: "Quodex", hint: "Usage tracker", action: () => openWindow("quodex") },
      {
        type: "Command",
        label: SITE.downloadLabel,
        hint: "GitHub Releases",
        action: () => downloadWindowsApp(),
      },
      { type: "App", label: "Settings", hint: "Personalization", action: () => openWindow("settings") },
      { type: "App", label: "File Explorer", hint: "This PC", action: () => openWindow("explorer") },
      { type: "App", label: "Task Manager", hint: "Efficiency", action: () => openWindow("taskmgr") },
      {
        type: "Setting",
        label: "Transparency effects",
        hint: "Personalization",
        action: () => {
          setSettingsSection("personalization");
          openWindow("settings");
        },
      },
      {
        type: "Setting",
        label: "Efficiency mode",
        hint: efficiency ? "On" : "Off",
        action: () => setEfficiency(!efficiency),
      },
      {
        type: "Setting",
        label: "Accent color",
        hint: "Personalization",
        action: () => {
          setSettingsSection("personalization");
          openWindow("settings");
        },
      },
      { type: "Command", label: "Refresh all accounts", hint: "Quodex", action: () => void refreshAll("manual") },
      { type: "Command", label: "Show desktop", hint: "Win+D", action: () => showDesktop() },
      ...accounts.map((account) => ({
        type: "Account" as const,
        label: account.email,
        hint: displayPlan(account.plan),
        action: () => openWindow("quodex"),
      })),
    ],
    [accounts, efficiency, openWindow, refreshAll, setEfficiency, setSettingsSection, showDesktop],
  );

  const needle = query.trim().toLowerCase();
  const matches = needle
    ? catalog.filter((item) => item.label.toLowerCase().includes(needle) || item.hint.toLowerCase().includes(needle))
    : catalog.slice(0, 6);

  return (
    <div className="flyout acrylic" style={{ left: "max(12px, calc(50% - 280px))", bottom: 56, width: 560, maxWidth: "calc(100vw - 24px)" }}>
      <div className="flex items-center gap-2 border-b border-win-stroke px-4 py-3">
        <Search size={16} className="text-win-subtle" />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-win-subtle"
          placeholder="Type here to search"
        />
      </div>
      <div className="max-h-96 overflow-y-auto p-3">
        <p className="px-2 pb-2 text-[12px] font-semibold text-win-subtle">{needle ? "Results" : "Best match"}</p>
        {matches.length === 0 ? (
          <p className="px-2 py-6 text-[13px] text-win-subtle">No matches in apps, settings, or accounts.</p>
        ) : (
          <ul>
            {matches.map((item) => (
              <li key={`${item.type}-${item.label}`}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-win px-2 py-2 text-left hover:bg-white/8"
                  onClick={() => {
                    item.action();
                    setFlyout(null);
                  }}
                >
                  <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-win-subtle">
                    {item.type}
                  </span>
                  <span>
                    <span className="block text-[14px] font-medium">{item.label}</span>
                    <span className="text-[12px] text-win-subtle">{item.hint}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function CalendarFlyout() {
  const now = useQuodexStore((s) => s.now);
  const accounts = useQuodexStore((s) => s.accounts);
  const notifications = useDesktopStore((s) => s.notifications);
  const clearNotifications = useDesktopStore((s) => s.clearNotifications);
  const openWindow = useDesktopStore((s) => s.openWindow);
  const setFlyout = useDesktopStore((s) => s.setFlyout);
  const today = new Date(now);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [mode, setMode] = useState<"month" | "year">("month");
  const [selected, setSelected] = useState(() => today.getDate());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const start = new Date(year, month, 1).getDay();
  const cells = useMemo(() => {
    const result: Array<number | null> = Array.from({ length: start }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) result.push(day);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [daysInMonth, start]);
  const alerts = notifications.slice(0, 8);
  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const isTodayMonth = year === today.getFullYear() && month === today.getMonth();
  const headingDate = new Date(year, month, isTodayMonth ? today.getDate() : selected);

  const shiftMonth = (delta: number) => {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
    setMode("month");
  };

  return (
    <div
      className="flyout acrylic flex"
      style={{ right: 12, bottom: 56, width: 720, maxWidth: "calc(100vw - 24px)", height: 520, maxHeight: "calc(100dvh - 72px)" }}
    >
      <div className="w-[46%] overflow-y-auto border-r border-win-stroke p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold">Notifications</h2>
          {alerts.length > 0 ? (
            <button type="button" className="text-[11px] text-win-subtle" onClick={clearNotifications}>
              Clear all
            </button>
          ) : null}
        </div>
        {alerts.length === 0 ? (
          <p className="mt-6 text-[13px] text-win-subtle">No new notifications</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {alerts.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  className="quodex-card w-full text-left"
                  onClick={() => {
                    openWindow(note.source === "quodex" ? "quodex" : "settings");
                    setFlyout(null);
                  }}
                >
                  <p className="text-[12px] font-semibold">{note.title}</p>
                  <p className="text-[12px] text-win-muted">{note.body}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
        {accounts.some((account) => account.resetNotificationsEnabled) ? (
          <p className="mt-3 text-[11px] text-win-subtle">Reset alerts stay armed for signed-in accounts.</p>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <p className="text-[13px] text-win-subtle">
          {headingDate.toLocaleDateString("en-US", { weekday: "long" })}
        </p>
        <p className="text-[28px] font-light leading-tight">
          {headingDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            className="text-[13px] font-medium hover:bg-white/8 rounded-win px-2 py-1"
            onClick={() => setMode((value) => (value === "month" ? "year" : "month"))}
          >
            {monthLabel}
          </button>
          <div className="flex gap-1">
            <button type="button" className="tray-btn" aria-label="Previous" onClick={() => {
              if (mode === "year") setCursor(new Date(year - 1, month, 1));
              else shiftMonth(-1);
            }}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" className="tray-btn" aria-label="Next" onClick={() => {
              if (mode === "year") setCursor(new Date(year + 1, month, 1));
              else shiftMonth(1);
            }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        {mode === "year" ? (
          <div className="mt-3 grid grid-cols-4 gap-1">
            {Array.from({ length: 12 }, (_, index) => (
              <button
                key={index}
                type="button"
                className="rounded-win py-3 text-[12px] hover:bg-white/8"
                style={
                  index === month
                    ? { background: "var(--color-win-accent)", color: "var(--color-win-accent-ink)" }
                    : undefined
                }
                onClick={() => {
                  setCursor(new Date(year, index, 1));
                  setMode("month");
                }}
              >
                {new Date(year, index, 1).toLocaleDateString("en-US", { month: "short" })}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-win-subtle">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
            {cells.map((day, index) => {
              const isToday = isTodayMonth && day === today.getDate();
              const isSelected = day === selected;
              return (
                <button
                  key={index}
                  type="button"
                  disabled={!day}
                  className="grid h-9 place-items-center rounded-full text-[12px] text-win-text disabled:opacity-0 hover:bg-white/10"
                  style={
                    isToday
                      ? { background: "var(--color-win-accent)", color: "var(--color-win-accent-ink)" }
                      : isSelected
                        ? { outline: "1px solid var(--color-win-accent)" }
                        : undefined
                  }
                  onClick={() => day && setSelected(day)}
                >
                  {day ?? ""}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function QuickSettings() {
  const theme = useDesktopStore((s) => s.theme);
  const toggleTheme = useDesktopStore((s) => s.toggleTheme);
  const efficiency = useDesktopStore((s) => s.efficiency);
  const setEfficiency = useDesktopStore((s) => s.setEfficiency);
  const transparency = useDesktopStore((s) => s.transparency);
  const setTransparency = useDesktopStore((s) => s.setTransparency);
  const reduceMotion = useDesktopStore((s) => s.reduceMotion);
  const setReduceMotion = useDesktopStore((s) => s.setReduceMotion);
  const brightness = useDesktopStore((s) => s.brightness);
  const setBrightness = useDesktopStore((s) => s.setBrightness);
  const openWindow = useDesktopStore((s) => s.openWindow);
  const setFlyout = useDesktopStore((s) => s.setFlyout);
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);
  const [volume, setVolume] = useState(62);

  return (
    <div className="flyout acrylic" style={{ right: 12, bottom: 56, width: 360, maxWidth: "calc(100vw - 24px)" }}>
      <div className="grid grid-cols-3 gap-2 p-3">
        <Tile label="Wi-Fi" active={wifi} onClick={() => setWifi((value) => !value)} icon={<Wifi size={14} />} />
        <Tile label="Bluetooth" active={bluetooth} onClick={() => setBluetooth((value) => !value)} icon={<Bluetooth size={14} />} />
        <Tile
          label="Efficiency"
          active={efficiency}
          onClick={() => setEfficiency(!efficiency)}
          icon={<Leaf size={14} />}
        />
        <Tile
          label="Transparency"
          active={transparency}
          onClick={() => setTransparency(!transparency)}
          icon={<Monitor size={14} />}
        />
        <Tile
          label={theme === "dark" ? "Dark" : "Light"}
          active
          onClick={toggleTheme}
          icon={theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
        />
        <Tile label="Motion" active={!reduceMotion} onClick={() => setReduceMotion(!reduceMotion)} />
      </div>
      <div className="space-y-3 px-4 pb-4">
        <label className="block text-[12px] text-win-subtle">
          Volume
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="mt-1 w-full accent-[var(--color-win-accent)]"
          />
        </label>
        <label className="block text-[12px] text-win-subtle">
          Brightness
          <input
            type="range"
            min={20}
            max={100}
            value={brightness}
            onChange={(event) => setBrightness(Number(event.target.value))}
            className="mt-1 w-full accent-[var(--color-win-accent)]"
          />
        </label>
        <button
          type="button"
          className="fluent-btn w-full"
          onClick={() => {
            openWindow("settings");
            setFlyout(null);
          }}
        >
          All settings
        </button>
      </div>
    </div>
  );
}

function Tile({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn("rounded-win px-2 py-3 text-[12px] font-medium", active && "is-tile-on")}
      style={{
        background: active ? "var(--color-win-accent)" : "rgb(255 255 255 / 8%)",
        color: active ? "var(--color-win-accent-ink)" : "var(--color-win-text)",
      }}
    >
      <span className="flex flex-col items-center gap-1">
        {icon}
        {label}
      </span>
    </button>
  );
}
