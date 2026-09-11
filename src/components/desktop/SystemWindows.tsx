import { type ReactNode, useEffect, useState } from "react";
import {
  ChevronRight,
  Download,
  FileJson,
  Gauge,
  Keyboard,
  Leaf,
  Monitor,
  Palette,
  Trash2,
} from "lucide-react";
import { ExplorerIcon, InstallIcon, QuodexAppIcon, RecycleIcon, SettingsGlyph } from "@/components/icons";
import { WindowFrame } from "@/components/windows/WindowFrame";
import { SettingsPage } from "@/components/quodex/SettingsPage";
import { ACCENTS, useDesktopStore, type AccentId } from "@/lib/desktop/store";
import { useQuodexStore } from "@/lib/quodex/store";
import { displayPlan } from "@/lib/quodex/types";
import { downloadWindowsApp, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SettingsWindow() {
  const section = useDesktopStore((s) => s.settingsSection);
  const setSection = useDesktopStore((s) => s.setSettingsSection);
  return (
    <WindowFrame id="settings" title="Settings" icon={<SettingsGlyph size={16} />}>
      <div className="win-shell">
        <aside className="win-nav">
          <p className="win-nav-label">Quodex</p>
          <SideItem icon={<Gauge size={15} />} label="Quodex" active={section === "apps"} onClick={() => setSection("apps")} />
          <p className="win-nav-label">System</p>
          <SideItem icon={<Monitor size={15} />} label="System" active={section === "system"} onClick={() => setSection("system")} />
          <SideItem icon={<Palette size={15} />} label="Personalization" active={section === "personalization"} onClick={() => setSection("personalization")} />
        </aside>
        <div className="win-shell-body">
          {section === "system" ? <SystemSettings /> : null}
          {section === "personalization" ? <PersonalizationSettings /> : null}
          {section === "apps" ? <SettingsPage /> : null}
        </div>
      </div>
    </WindowFrame>
  );
}

function SideItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="win-nav-item"
      style={active ? { background: "rgb(255 255 255 / 8%)" } : undefined}
      onClick={onClick}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {active ? <ChevronRight size={14} className="text-win-subtle" /> : null}
    </button>
  );
}

function SystemSettings() {
  const efficiency = useDesktopStore((s) => s.efficiency);
  const setEfficiency = useDesktopStore((s) => s.setEfficiency);
  const reduceMotion = useDesktopStore((s) => s.reduceMotion);
  const setReduceMotion = useDesktopStore((s) => s.setReduceMotion);
  const transparency = useDesktopStore((s) => s.transparency);
  const setTransparency = useDesktopStore((s) => s.setTransparency);
  const theme = useDesktopStore((s) => s.theme);
  const toggleTheme = useDesktopStore((s) => s.toggleTheme);
  const brightness = useDesktopStore((s) => s.brightness);
  const setBrightness = useDesktopStore((s) => s.setBrightness);
  const openWindow = useDesktopStore((s) => s.openWindow);
  const minimizeToTray = useDesktopStore((s) => s.minimizeToTray);
  const setMinimizeToTray = useDesktopStore((s) => s.setMinimizeToTray);
  const quodexPinned = useDesktopStore((s) => s.quodexPinned);
  const setQuodexPinned = useDesktopStore((s) => s.setQuodexPinned);
  const hideQuodexToTray = useDesktopStore((s) => s.hideQuodexToTray);
  const quitQuodex = useDesktopStore((s) => s.quitQuodex);

  return (
    <div className="px-5 py-4">
      <h1 className="text-[22px] font-semibold">System</h1>
      <p className="mt-1 text-[13px] text-win-subtle">QUODEX-PC · Live Windows 11 landing for Quodex</p>

      <section className="quodex-card mt-5">
        <h2 className="text-[14px] font-semibold">Quick settings</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-win-subtle">
          Same toggles as the taskbar tray — theme, motion, glass, and brightness.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={cn("fluent-btn", theme === "dark" && "fluent-btn-accent")} onClick={toggleTheme}>
            {theme === "dark" ? "Dark" : "Light"}
          </button>
          <button type="button" className={cn("fluent-btn", transparency && "fluent-btn-accent")} onClick={() => setTransparency(!transparency)}>
            {transparency ? "Transparency on" : "Transparency off"}
          </button>
          <button type="button" className={cn("fluent-btn", !reduceMotion && "fluent-btn-accent")} onClick={() => setReduceMotion(!reduceMotion)}>
            {reduceMotion ? "Motion reduced" : "Motion on"}
          </button>
        </div>
        <label className="mt-4 block text-[12px] text-win-subtle">
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
      </section>

      <section className="quodex-card mt-3">
        <h2 className="text-[14px] font-semibold">Quodex tray</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-win-subtle">
          Pin keeps the usage flyout open. Close still hides beside the clock — Quit is the only way out.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={cn("fluent-btn", minimizeToTray && "fluent-btn-accent")}
            onClick={() => setMinimizeToTray(!minimizeToTray)}
          >
            {minimizeToTray ? "Minimize to tray on" : "Minimize to tray off"}
          </button>
          <button
            type="button"
            className={cn("fluent-btn", quodexPinned && "fluent-btn-accent")}
            onClick={() => {
              const next = !quodexPinned;
              setQuodexPinned(next);
              if (next) useDesktopStore.getState().setFlyout("quodex-tray");
              if (window.quodexNative) void window.quodexNative.setFlyoutPinned(next);
            }}
          >
            {quodexPinned ? "Flyout pinned" : "Pin flyout"}
          </button>
          <button type="button" className="fluent-btn" onClick={hideQuodexToTray}>
            Hide to tray
          </button>
          <button type="button" className="fluent-btn text-win-danger" onClick={quitQuodex}>
            Quit Quodex
          </button>
        </div>
      </section>

      <section className="quodex-card mt-5">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold">
          <Leaf size={15} /> Efficiency mode
        </h2>
        <p className="mt-1 text-[12px] leading-relaxed text-win-subtle">
          Cuts mica blur, slows the clock, and stretches auto-refresh so this desktop stays light on GPU and battery.
        </p>
        <button type="button" className={cn("fluent-btn mt-3", efficiency && "fluent-btn-accent")} onClick={() => setEfficiency(!efficiency)}>
          {efficiency ? "Efficiency on" : "Turn on Efficiency"}
        </button>
      </section>

      <section className="quodex-card mt-3">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold">
          <Keyboard size={15} /> Keyboard
        </h2>
        <ul className="mt-2 space-y-1 text-[12px] text-win-muted">
          <li><kbd className="kbd">Ctrl</kbd> + <kbd className="kbd">Esc</kbd> Start</li>
          <li><kbd className="kbd">Ctrl</kbd> + <kbd className="kbd">E</kbd> File Explorer</li>
          <li><kbd className="kbd">Ctrl</kbd> + <kbd className="kbd">,</kbd> Settings</li>
          <li><kbd className="kbd">Ctrl</kbd> + <kbd className="kbd">K</kbd> Search</li>
          <li><kbd className="kbd">Alt</kbd> + <kbd className="kbd">Tab</kbd> Switch windows</li>
          <li><kbd className="kbd">Alt</kbd> + <kbd className="kbd">F4</kbd> Hide Quodex to tray / close other windows</li>
          <li><kbd className="kbd">Ctrl</kbd> + <kbd className="kbd">Shift</kbd> + <kbd className="kbd">Esc</kbd> Task Manager</li>
          <li><kbd className="kbd">Ctrl</kbd> + arrows snap the focused window</li>
        </ul>
      </section>

      <section className="quodex-card mt-3">
        <h2 className="text-[14px] font-semibold">About</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-win-subtle">
          Lightweight Windows companion to the macOS original — about 5 MB, system WebView2, Chromium not bundled. This live page is a demo. ChatGPT sessions live in the downloaded app, sealed with DPAPI. Composition uses
          {transparency ? " mica and acrylic" : " solid fills"}
          {reduceMotion ? " with motion reduced." : "."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="fluent-btn" onClick={() => openWindow("taskmgr")}>
            Open Task Manager
          </button>
          <button type="button" className="fluent-btn" onClick={() => setReduceMotion(!reduceMotion)}>
            {reduceMotion ? "Allow motion" : "Reduce motion"}
          </button>
        </div>
      </section>
    </div>
  );
}

function PersonalizationSettings() {
  const theme = useDesktopStore((s) => s.theme);
  const setTheme = useDesktopStore((s) => s.setTheme);
  const accent = useDesktopStore((s) => s.accent);
  const setAccent = useDesktopStore((s) => s.setAccent);
  const transparency = useDesktopStore((s) => s.transparency);
  const setTransparency = useDesktopStore((s) => s.setTransparency);
  const iconSize = useDesktopStore((s) => s.iconSize);
  const setIconSize = useDesktopStore((s) => s.setIconSize);
  const brightness = useDesktopStore((s) => s.brightness);
  const setBrightness = useDesktopStore((s) => s.setBrightness);

  return (
    <div className="px-5 py-4">
      <h1 className="text-[22px] font-semibold">Personalization</h1>
      <p className="mt-1 text-[13px] text-win-subtle">Theme, accent, and how heavy the glass should be.</p>

      <section className="quodex-card mt-5">
        <h2 className="text-[14px] font-semibold">Color mode</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-win border border-win-stroke px-3 py-3 text-left"
            style={theme === "dark" ? { outline: "2px solid var(--color-win-accent)" } : undefined}
            onClick={() => setTheme("dark")}
          >
            <span className="block text-[13px] font-semibold">Dark</span>
            <span className="text-[11px] text-win-subtle">Mica on Glow wallpaper</span>
          </button>
          <button
            type="button"
            className="rounded-win border border-win-stroke px-3 py-3 text-left"
            style={theme === "light" ? { outline: "2px solid var(--color-win-accent)" } : undefined}
            onClick={() => setTheme("light")}
          >
            <span className="block text-[13px] font-semibold">Light</span>
            <span className="text-[11px] text-win-subtle">Fluent light surfaces</span>
          </button>
        </div>
      </section>

      <section className="quodex-card mt-3">
        <h2 className="text-[14px] font-semibold">Accent color</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(ACCENTS) as AccentId[]).map((key) => (
            <button
              key={key}
              type="button"
              className="size-8 rounded-full border border-win-stroke-strong"
              style={{
                background: theme === "dark" ? ACCENTS[key].dark : ACCENTS[key].light,
                outline: accent === key ? "2px solid var(--color-win-text)" : undefined,
                outlineOffset: 2,
              }}
              aria-label={ACCENTS[key].label}
              onClick={() => setAccent(key)}
            />
          ))}
        </div>
      </section>

      <section className="quodex-card mt-3">
        <h2 className="text-[14px] font-semibold">Transparency effects</h2>
        <p className="mt-1 text-[12px] text-win-subtle">
          Acrylic and mica are GPU-heavy. Turn them off for a solid, cheaper desktop.
        </p>
        <button
          type="button"
          className={cn("fluent-btn mt-3", transparency && "fluent-btn-accent")}
          onClick={() => setTransparency(!transparency)}
        >
          {transparency ? "Effects on" : "Effects off"}
        </button>
      </section>

      <section className="quodex-card mt-3">
        <h2 className="text-[14px] font-semibold">Desktop icons</h2>
        <div className="mt-3 flex gap-2">
          {(["small", "medium", "large"] as const).map((size) => (
            <button
              key={size}
              type="button"
              className={cn("fluent-btn capitalize", iconSize === size && "fluent-btn-accent")}
              onClick={() => setIconSize(size)}
            >
              {size}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-[12px] text-win-subtle">
          Wallpaper brightness
          <input
            type="range"
            min={20}
            max={100}
            value={brightness}
            onChange={(event) => setBrightness(Number(event.target.value))}
            className="mt-1 w-full accent-[var(--color-win-accent)]"
          />
        </label>
      </section>
    </div>
  );
}

export function ExplorerWindow() {
  const section = useDesktopStore((s) => s.explorerSection);
  const setSection = useDesktopStore((s) => s.setExplorerSection);
  const recycle = useDesktopStore((s) => s.recycle);
  return (
    <WindowFrame id="explorer" title="File Explorer" icon={<ExplorerIcon size={16} />}>
      <div className="win-shell">
        <aside className="win-nav">
          <p className="win-nav-label">Quick access</p>
          <NavRow label="Desktop" active={section === "this-pc"} onClick={() => setSection("this-pc")} />
          <NavRow label="Quodex" active={section === "quodex"} onClick={() => setSection("quodex")} />
          <NavRow
            label={`Recycle Bin${recycle.length ? ` (${recycle.length})` : ""}`}
            active={section === "recycle"}
            onClick={() => setSection("recycle")}
          />
          <p className="win-nav-label">This PC</p>
          <NavRow label="Windows (C:)" active={section === "this-pc"} onClick={() => setSection("this-pc")} />
        </aside>
        <div className="win-shell-body p-5">
          {section === "this-pc" ? <ThisPc /> : null}
          {section === "quodex" ? <QuodexFolder /> : null}
          {section === "recycle" ? <RecycleFolder /> : null}
        </div>
      </div>
    </WindowFrame>
  );
}

function NavRow({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="win-nav-item"
      style={active ? { background: "rgb(255 255 255 / 8%)" } : undefined}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function ThisPc() {
  return (
    <>
      <h2 className="text-[20px] font-semibold">This PC</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Drive name="Windows (C:)" used={18} total={64} hint="Lightweight profile" />
        <Drive name="Data (D:)" used={4} total={128} hint="Local Quodex cache" />
      </div>
    </>
  );
}

function Drive({ name, used, total, hint }: { name: string; used: number; total: number; hint?: string }) {
  const pct = Math.round((used / total) * 100);
  return (
    <div className="quodex-card">
      <p className="text-[14px] font-medium">{name}</p>
      <div className="usage-track mt-3">
        <div className="usage-fill bg-win-accent" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[12px] text-win-subtle">
        {used} GB used of {total} GB{hint ? ` · ${hint}` : ""}
      </p>
    </div>
  );
}

function QuodexFolder() {
  const accounts = useQuodexStore((s) => s.accounts);
  const openWindow = useDesktopStore((s) => s.openWindow);

  const exportUsage = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      accounts: accounts.map((account) => ({
        email: account.email,
        plan: account.plan,
        isDemo: Boolean(account.isDemo),
        snapshot: account.lastSnapshot,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "quodex-usage.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[20px] font-semibold">Documents · Quodex</h2>
        <button type="button" className="fluent-btn inline-flex items-center gap-1" onClick={exportUsage}>
          <FileJson size={14} /> Export JSON
        </button>
      </div>
      <p className="mt-1 text-[12px] text-win-subtle">Sample snapshots only. Tokens are never written to this folder.</p>
      <button type="button" className="quodex-card mt-4 flex w-full items-center justify-between text-left" onClick={downloadWindowsApp}>
        <span>
          <span className="block text-[13px] font-medium">Get {SITE.product}</span>
          <span className="text-[11px] text-win-subtle">Portable ~2 MB zip · GitHub Releases</span>
        </span>
        <Download size={16} className="text-win-accent" />
      </button>
      <div className="mt-4 grid gap-2">
        {accounts.map((account) => (
          <button
            key={account.id}
            type="button"
            className="quodex-card flex w-full items-center justify-between text-left"
            onClick={() => openWindow("quodex")}
          >
            <span>
              <span className="block text-[13px] font-medium">{account.email}</span>
              <span className="text-[11px] text-win-subtle">{displayPlan(account.plan)} · usage snapshot</span>
            </span>
            <span className="text-[11px] text-win-subtle">Open</span>
          </button>
        ))}
      </div>
    </>
  );
}

function RecycleFolder() {
  const recycle = useDesktopStore((s) => s.recycle);
  const restoreRecycled = useDesktopStore((s) => s.restoreRecycled);
  const emptyRecycle = useDesktopStore((s) => s.emptyRecycle);
  const restoreDemo = useQuodexStore((s) => s.restoreDemo);
  const presentLogin = useQuodexStore((s) => s.presentLogin);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[20px] font-semibold">Recycle Bin</h2>
        <button type="button" className="fluent-btn inline-flex items-center gap-1" onClick={emptyRecycle} disabled={recycle.length === 0}>
          <Trash2 size={13} /> Empty
        </button>
      </div>
      {recycle.length === 0 ? (
        <p className="mt-6 text-[13px] text-win-subtle">Recycle Bin is empty.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {recycle.map((item) => (
            <li key={`${item.id}-${item.removedAt}`} className="quodex-card flex items-center justify-between gap-3">
              <span>
                <span className="block text-[13px] font-medium">{item.email}</span>
                <span className="text-[11px] text-win-subtle">{displayPlan(item.plan)} · removed account</span>
              </span>
              <button
                type="button"
                className="fluent-btn h-7 px-2 text-[11px]"
                onClick={() => {
                  restoreRecycled(item.id);
                  if (item.id.startsWith("demo-")) restoreDemo();
                  else presentLogin();
                }}
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function TaskManagerWindow() {
  const windows = useDesktopStore((s) => s.windows);
  const efficiency = useDesktopStore((s) => s.efficiency);
  const setEfficiency = useDesktopStore((s) => s.setEfficiency);
  const transparency = useDesktopStore((s) => s.transparency);
  const accounts = useQuodexStore((s) => s.accounts);
  const closeWindow = useDesktopStore((s) => s.closeWindow);
  const openWindow = useDesktopStore((s) => s.openWindow);
  const quitQuodex = useDesktopStore((s) => s.quitQuodex);
  const quodexAlive = useDesktopStore((s) => s.quodexAlive);

  const processes: Array<{ id: "quodex" | "settings" | "explorer" | "taskmgr" | "dwm"; name: string; cpu: string; mem: string }> = [
    {
      id: "dwm",
      name: "Desktop Window Manager",
      cpu: efficiency || !transparency ? "1%" : "7%",
      mem: efficiency || !transparency ? "18 MB" : "42 MB",
    },
    {
      id: "quodex",
      name: "Quodex",
      cpu: quodexAlive ? (windows.quodex.open ? "2%" : "1%") : "0%",
      mem: quodexAlive ? `${Math.round(18 + accounts.length * 1.4)} MB` : "0 MB",
    },
    { id: "explorer", name: "Windows Explorer", cpu: windows.explorer.open ? "1%" : "0%", mem: "11 MB" },
    { id: "settings", name: "Settings", cpu: windows.settings.open ? "1%" : "0%", mem: "9 MB" },
    { id: "taskmgr", name: "Task Manager", cpu: "1%", mem: "6 MB" },
  ];

  return (
    <WindowFrame id="taskmgr" title="Task Manager" icon={<Gauge size={14} />}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-win-stroke px-4 py-2">
          <p className="text-[12px] text-win-subtle">Processes · lightweight profile</p>
          <button
            type="button"
            className={cn("fluent-btn h-7 px-2 text-[11px]", efficiency && "fluent-btn-accent")}
            onClick={() => setEfficiency(!efficiency)}
          >
            {efficiency ? "Efficiency on" : "Efficiency mode"}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="sticky top-0 bg-win-fill/80 text-[11px] uppercase tracking-wide text-win-subtle">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">CPU</th>
                <th className="px-2 py-2 font-medium">Memory</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {processes.map((proc) => {
                const running = proc.id === "quodex" ? quodexAlive : proc.id !== "dwm" && windows[proc.id].open;
                const endTask = () => {
                  if (proc.id === "quodex") quitQuodex();
                  else if (proc.id === "settings" || proc.id === "explorer" || proc.id === "taskmgr") closeWindow(proc.id);
                };
                const runApp = () => {
                  if (proc.id === "quodex" || proc.id === "settings" || proc.id === "explorer" || proc.id === "taskmgr") {
                    openWindow(proc.id);
                  }
                };
                return (
                <tr key={proc.id} className="border-t border-win-stroke">
                  <td className="px-4 py-2">{proc.name}</td>
                  <td className="px-2 py-2 tabular-nums">{proc.cpu}</td>
                  <td className="px-2 py-2 tabular-nums">{proc.mem}</td>
                  <td className="px-3 py-2 text-right">
                    {proc.id === "dwm" ? null : running ? (
                      <button
                        type="button"
                        className="text-[11px] text-win-subtle hover:text-win-text"
                        onClick={endTask}
                      >
                        End task
                      </button>
                    ) : proc.id !== "taskmgr" ? (
                      <button
                        type="button"
                        className="text-[11px] text-win-subtle hover:text-win-text"
                        onClick={runApp}
                      >
                        Run
                      </button>
                    ) : null}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </WindowFrame>
  );
}

export function DesktopIcons() {
  const openWindow = useDesktopStore((s) => s.openWindow);
  const setExplorerSection = useDesktopStore((s) => s.setExplorerSection);
  const iconSize = useDesktopStore((s) => s.iconSize);
  const [selected, setSelected] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const size = iconSize === "small" ? 28 : iconSize === "large" ? 44 : 36;

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".icon-tile, .desktop-context")) return;
      setSelected(null);
      setMenu(null);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const open = (id: string) => {
    setMenu(null);
    if (id === "recycle") {
      setExplorerSection("recycle");
      openWindow("explorer");
      return;
    }
    if (id === "quodex") {
      openWindow("quodex");
      return;
    }
    if (id === "github") {
      window.open(SITE.source, "_blank", "noopener,noreferrer");
      return;
    }
    if (id === "install") {
      downloadWindowsApp();
      return;
    }
    openWindow("settings");
  };

  const icons = [
    { id: "recycle", label: "Recycle Bin", node: <RecycleIcon size={size} /> },
    { id: "quodex", label: "Quodex", node: <span className="drop-shadow-md"><QuodexAppIcon size={size} /></span> },
    { id: "install", label: "Install Quodex", node: <InstallIcon size={size} /> },
    { id: "github", label: "GitHub", node: <span className="grid place-items-center rounded-lg" style={{ width: size, height: size }}><svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#0D1117" /><path fill="#F0F6FC" d="M16 7.4c-4.7 0-8.5 3.8-8.5 8.5 0 3.76 2.44 6.95 5.82 8.08.42.08.58-.18.58-.41 0-.2-.01-.74-.01-1.45-2.37.52-2.87-1.14-2.87-1.14-.38-.98-.94-1.25-.94-1.25-.78-.53.06-.52.06-.52.86.06 1.31.88 1.31.88.76 1.3 2 .93 2.48.71.08-.55.3-.93.54-1.14-1.89-.21-3.87-.94-3.87-4.2 0-.93.33-1.69.88-2.29-.09-.21-.38-1.08.08-2.25 0 0 .71-.23 2.34.87a8.1 8.1 0 0 1 4.26 0c1.62-1.1 2.33-.87 2.33-.87.47 1.17.18 2.04.09 2.25.55.6.88 1.36.88 2.29 0 3.27-1.99 3.99-3.89 4.2.31.26.58.78.58 1.58 0 1.14-.01 2.06-.01 2.34 0 .23.15.5.58.41A8.52 8.52 0 0 0 24.5 15.9c0-4.7-3.8-8.5-8.5-8.5Z" /></svg></span> },
    { id: "settings", label: "Settings", node: <SettingsGlyph size={size} /> },
  ];

  return (
    <div className={cn("desktop-icons absolute top-4 left-4 z-10 flex flex-col gap-2", `icons-${iconSize}`)}>
      {icons.map((icon) => (
        <button
          key={icon.id}
          type="button"
          className={cn("icon-tile", selected === icon.id && "is-selected")}
          onClick={() => setSelected(icon.id)}
          onDoubleClick={() => open(icon.id)}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setSelected(icon.id);
            setMenu({ id: icon.id, x: event.clientX, y: event.clientY });
          }}
        >
          {icon.node}
          {icon.label}
        </button>
      ))}
      {menu ? (
        <div
          className="desktop-context acrylic absolute z-50 min-w-44 rounded-win border border-win-stroke-strong py-1 text-[13px] shadow-[var(--shadow-flyout)]"
          style={{ left: menu.x - 16, top: menu.y - 16 }}
        >
          <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-white/8" onClick={() => open(menu.id)}>
            Open
          </button>
          {menu.id === "github" ? (
            <button
              type="button"
              className="block w-full px-3 py-1.5 text-left hover:bg-white/8"
              onClick={() => {
                downloadWindowsApp();
                setMenu(null);
              }}
            >
              Releases
            </button>
          ) : null}
          {menu.id === "install" ? (
            <button
              type="button"
              className="block w-full px-3 py-1.5 text-left hover:bg-white/8"
              onClick={() => {
                downloadWindowsApp();
                setMenu(null);
              }}
            >
              Download for Windows
            </button>
          ) : null}
          <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-white/8" onClick={() => setMenu(null)}>
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ContextMenu({ x, y }: { x: number; y: number }) {
  const openWindow = useDesktopStore((s) => s.openWindow);
  const setContextMenu = useDesktopStore((s) => s.setContextMenu);
  const toggleTheme = useDesktopStore((s) => s.toggleTheme);
  const setSettingsSection = useDesktopStore((s) => s.setSettingsSection);
  const setIconSize = useDesktopStore((s) => s.setIconSize);
  const showDesktop = useDesktopStore((s) => s.showDesktop);
  const close = () => setContextMenu(null);
  const items = [
    { label: "View · Small icons", action: () => { setIconSize("small"); close(); } },
    { label: "View · Medium icons", action: () => { setIconSize("medium"); close(); } },
    { label: "View · Large icons", action: () => { setIconSize("large"); close(); } },
    { label: "Refresh", action: close },
    { label: "Show desktop", action: () => { showDesktop(); close(); } },
    {
      label: "Personalize",
      action: () => {
        setSettingsSection("personalization");
        openWindow("settings");
        close();
      },
    },
    { label: "Switch theme", action: () => { toggleTheme(); close(); } },
    {
      label: "Display settings",
      action: () => {
        setSettingsSection("system");
        openWindow("settings");
        close();
      },
    },
  ];
  return (
    <div
      className="desktop-context acrylic absolute z-50 min-w-52 rounded-win border border-win-stroke-strong py-1 text-[13px] shadow-[var(--shadow-flyout)]"
      style={{ left: x, top: y }}
    >
      {items.map((item) => (
        <button key={item.label} type="button" className="block w-full px-3 py-1.5 text-left hover:bg-white/8" onClick={item.action}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
