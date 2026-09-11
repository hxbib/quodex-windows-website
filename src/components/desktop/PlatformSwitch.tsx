import type { MouseEvent, PointerEvent } from "react";
import { SITE } from "@/lib/site";

const STOPS = [
  { id: "mac" as const, label: "macOS", href: SITE.macos },
  { id: "windows" as const, label: "Windows", href: SITE.windows },
];

function hush(event: PointerEvent<HTMLElement> | MouseEvent<HTMLElement>) {
  event.stopPropagation();
}

export function PlatformSwitch({
  current,
  className = "",
}: {
  current: "mac" | "windows";
  className?: string;
}) {
  return (
    <nav
      className={`platform-switch ${className}`.trim()}
      aria-label="Quodex platform"
      onPointerDown={hush}
      onPointerUp={hush}
      onClick={hush}
    >
      {STOPS.map((stop) =>
        stop.id === current ? (
          <span key={stop.id} aria-current="page">
            {stop.label}
          </span>
        ) : (
          <a key={stop.id} href={stop.href}>
            {stop.label}
          </a>
        ),
      )}
    </nav>
  );
}
