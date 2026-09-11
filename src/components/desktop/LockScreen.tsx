import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowRight, Download } from "lucide-react";
import { QuodexAppIcon, WindowsLogo } from "@/components/icons";
import { useDesktopStore } from "@/lib/desktop/store";
import { formatTaskbarTime } from "@/lib/quodex/format";
import { downloadWindowsApp, SITE } from "@/lib/site";

const UNLOCK_MS = 400;

export function LockScreen() {
  const power = useDesktopStore((s) => s.power);
  const enterDesktop = useDesktopStore((s) => s.enterDesktop);
  const reduceMotion = useDesktopStore((s) => s.reduceMotion);
  const root = useRef<HTMLDivElement>(null);
  const motion = useRef({
    tx: 0,
    ty: 0,
    x: 0,
    y: 0,
    px: 50,
    py: 38,
    tpx: 50,
    tpy: 38,
    raf: 0,
  });
  const [now, setNow] = useState(() => Date.now());
  const [mounted, setMounted] = useState(power === "lock");
  const [leaving, setLeaving] = useState(false);

  const stopMotion = () => {
    if (motion.current.raf) {
      cancelAnimationFrame(motion.current.raf);
      motion.current.raf = 0;
    }
  };

  useEffect(() => {
    if (power === "lock") {
      setMounted(true);
      setLeaving(false);
      return;
    }
    if (!mounted) return;
    stopMotion();
    setLeaving(true);
    const id = window.setTimeout(() => {
      setMounted(false);
      setLeaving(false);
    }, UNLOCK_MS);
    return () => window.clearTimeout(id);
  }, [mounted, power]);

  useEffect(() => {
    if (power !== "lock") return;
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, [power]);

  useEffect(() => () => stopMotion(), []);

  if (!mounted) return null;
  const clock = formatTaskbarTime(now);

  const step = () => {
    const m = motion.current;
    const node = root.current;
    const k = 0.14;
    m.x += (m.tx - m.x) * k;
    m.y += (m.ty - m.y) * k;
    m.px += (m.tpx - m.px) * k;
    m.py += (m.tpy - m.py) * k;
    if (node) {
      node.style.setProperty("--lock-x", `${m.x.toFixed(2)}px`);
      node.style.setProperty("--lock-y", `${m.y.toFixed(2)}px`);
      node.style.setProperty("--lock-px", `${m.px.toFixed(2)}%`);
      node.style.setProperty("--lock-py", `${m.py.toFixed(2)}%`);
    }
    const settled =
      Math.abs(m.tx - m.x) < 0.04 &&
      Math.abs(m.ty - m.y) < 0.04 &&
      Math.abs(m.tpx - m.px) < 0.08 &&
      Math.abs(m.tpy - m.py) < 0.08;
    if (settled) {
      m.x = m.tx;
      m.y = m.ty;
      m.px = m.tpx;
      m.py = m.tpy;
      m.raf = 0;
      return;
    }
    m.raf = requestAnimationFrame(step);
  };

  const kick = () => {
    if (motion.current.raf) return;
    motion.current.raf = requestAnimationFrame(step);
  };

  const onMove = (event: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion || leaving) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const node = root.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    const nx = (event.clientX - box.left) / Math.max(1, box.width);
    const ny = (event.clientY - box.top) / Math.max(1, box.height);
    motion.current.tx = (nx - 0.5) * 26;
    motion.current.ty = (ny - 0.5) * 16;
    motion.current.tpx = nx * 100;
    motion.current.tpy = ny * 100;
    kick();
  };

  const onLeave = () => {
    motion.current.tx = 0;
    motion.current.ty = 0;
    motion.current.tpx = 50;
    motion.current.tpy = 38;
    kick();
  };

  return (
    <div
      ref={root}
      className={leaving ? "lock-screen is-leaving" : "lock-screen"}
      role="region"
      aria-label="Quodex for Windows"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={(event) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest("a, button")) return;
        enterDesktop();
      }}
    >
      <div className="lock-bloom" aria-hidden="true" />
      <div className="lock-glow" aria-hidden="true" />
      <div className="lock-copy">
        <div className="lock-timeblock">
          <div className="lock-rise">
            <p className="lock-clock tabular-nums">{clock.time}</p>
            <p className="lock-date">{clock.date}</p>
          </div>
        </div>

        <div className="lock-foot">
          <div className="lock-rise">
            <div className="lock-plate">
              <div className="lock-brand">
                <span className="lock-mark">
                  <QuodexAppIcon size={32} />
                </span>
                <div>
                  <p className="lock-kicker">
                    <WindowsLogo size={11} /> Windows 10 {"&"} 11
                  </p>
                  <h1 className="lock-title">Quodex</h1>
                </div>
              </div>

              <p className="lock-tagline">Know your limits.</p>
              <p className="lock-tagline-em">Own your resets.</p>
              <p className="lock-summary">
                A tray companion for every ChatGPT account. This page is a live Windows 11 desktop — sit down at it, then take the real app with you.
              </p>
              <p className="lock-facts">
                Close hides to the tray
                <span aria-hidden="true"> · </span>
                Every lane ChatGPT reports
              </p>

              <div className="lock-actions">
                <button type="button" className="lock-btn lock-btn-light" onClick={enterDesktop}>
                  Enter the desktop
                  <ArrowRight size={16} />
                </button>
                <button type="button" className="lock-btn lock-btn-ghost" onClick={downloadWindowsApp}>
                  <Download size={16} />
                  {SITE.downloadLabel}
                </button>
              </div>

              <p className="lock-meta">
                <span className="lock-meta-req">{SITE.requirements}.</span>
                <span className="lock-meta-indie">Independent — not affiliated with OpenAI.</span>
                <span className="lock-meta-links">
                  <a href={SITE.macos} target="_blank" rel="noreferrer">
                    macOS original
                  </a>
                  <span aria-hidden="true"> · </span>
                  <a href={SITE.source} target="_blank" rel="noreferrer">
                    Source
                  </a>
                </span>
              </p>
            </div>
            <p className="lock-hint">Click anywhere, press Enter, or use a button</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WelcomeTip() {
  const power = useDesktopStore((s) => s.power);
  const shown = useDesktopStore((s) => s.welcomeTipShown);
  const dismissWelcomeTip = useDesktopStore((s) => s.dismissWelcomeTip);
  const [hiding, setHiding] = useState(false);
  if (power !== "on" || shown) return null;

  const dismiss = () => {
    setHiding(true);
    window.setTimeout(() => dismissWelcomeTip(), 180);
  };

  return (
    <aside className={hiding ? "welcome-tip acrylic is-leaving" : "welcome-tip acrylic"} role="status">
      <p className="text-[13px] font-semibold">This is the live desktop</p>
      <p className="mt-1 text-[12px] leading-relaxed text-win-muted">
        Quodex is on the taskbar and next to the clock. Close (✕) hides to the tray — it does not quit. Accounts here are sample data.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="fluent-btn fluent-btn-accent h-8 px-3 text-[12px]" onClick={dismiss}>
          Got it
        </button>
        <button type="button" className="fluent-btn h-8 px-3 text-[12px]" onClick={downloadWindowsApp}>
          {SITE.downloadLabel}
        </button>
      </div>
    </aside>
  );
}

export function MobileDownloadBar() {
  const power = useDesktopStore((s) => s.power);
  const lockDesktop = useDesktopStore((s) => s.lockDesktop);
  if (power !== "on") return null;
  return (
    <div className="mobile-site-bar acrylic">
      <button type="button" className="fluent-btn fluent-btn-accent" onClick={downloadWindowsApp}>
        <Download size={15} />
        Download installer
      </button>
      <button type="button" className="fluent-btn" onClick={lockDesktop}>
        Lock
      </button>
    </div>
  );
}
