import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WindowsDesktop } from "@/components/desktop/WindowsDesktop";
import "./styles.css";

const root = document.getElementById("app");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <WindowsDesktop />
    </StrictMode>,
  );
}
