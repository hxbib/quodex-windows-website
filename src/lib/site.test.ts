import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { SITE } from "./site.ts";

test("Windows landing never points Download at the macOS DMG repo", () => {
  assert.equal(SITE.source, "https://github.com/hxbib/quodex-windows");
  assert.match(SITE.download, /hxbib\/quodex-windows/);
  assert.doesNotMatch(SITE.download, /hxbib\/Quodex\/releases/);
  assert.equal(SITE.macos, "https://quodex.app");
  assert.equal(SITE.windows, "https://quodex.app/windows/");
  assert.equal(SITE.macosSource, "https://github.com/hxbib/Quodex");
  assert.equal(SITE.asset, "/Quodex-windows-x64.zip");
});

test("platform switch is same-tab and present on lock, desktop, and mobile", () => {
  const switcher = readFileSync(new URL("../components/desktop/PlatformSwitch.tsx", import.meta.url), "utf8");
  const lock = readFileSync(new URL("../components/desktop/LockScreen.tsx", import.meta.url), "utf8");
  const desktop = readFileSync(new URL("../components/desktop/WindowsDesktop.tsx", import.meta.url), "utf8");
  assert.match(switcher, /href: SITE\.macos/);
  assert.match(switcher, /href: SITE\.windows/);
  assert.doesNotMatch(switcher, /target=/);
  assert.match(lock, /<PlatformSwitch current="windows"/);
  assert.match(lock, /mobile-site-bar[\s\S]*<PlatformSwitch current="windows"/);
  assert.doesNotMatch(lock, /macOS original/);
  assert.match(desktop, /platform-switch-dock/);
});
