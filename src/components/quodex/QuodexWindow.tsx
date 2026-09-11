import { type ReactNode } from "react";
import { House, Settings } from "lucide-react";
import { Dashboard } from "./Dashboard";
import { SettingsPage } from "./SettingsPage";
import { QuodexAppIcon } from "@/components/icons";
import { WindowFrame } from "@/components/windows/WindowFrame";
import { useDesktopStore } from "@/lib/desktop/store";
import { cn } from "@/lib/utils";

export function QuodexWindow() {
  const page = useDesktopStore((s) => s.quodexPage);
  const setPage = useDesktopStore((s) => s.setQuodexPage);

  return (
    <WindowFrame id="quodex" title="Quodex" icon={<QuodexAppIcon size={16} />}>
      <div className="flex h-full min-h-0">
        <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-win-stroke py-2">
          <NavButton label="Home" active={page === "home"} onClick={() => setPage("home")}>
            <House size={16} />
          </NavButton>
          <NavButton label="Settings" active={page === "settings"} onClick={() => setPage("settings")}>
            <Settings size={16} />
          </NavButton>
        </nav>
        <div className="min-w-0 flex-1">
          {page === "home" ? <Dashboard variant="window" /> : <SettingsPage />}
        </div>
      </div>
    </WindowFrame>
  );
}

function NavButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "grid size-10 place-items-center rounded-win text-win-muted",
        active && "bg-white/8 text-win-text",
      )}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
