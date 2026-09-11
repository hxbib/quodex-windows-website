import { Dashboard } from "./Dashboard";
import { useDesktopStore } from "@/lib/desktop/store";
import { cn } from "@/lib/utils";

export function QuodexFlyout() {
  const pinned = useDesktopStore((s) => s.quodexPinned);
  return (
    <div
      className={cn("flyout mica is-app-flyout", pinned && "is-pinned")}
      data-flyout-pinned={pinned ? "true" : "false"}
      style={{ right: 12, bottom: 56, width: 420, height: 640, maxHeight: "calc(100dvh - 72px)" }}
    >
      <Dashboard variant="flyout" />
    </div>
  );
}
