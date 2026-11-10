/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS CLI supports externally installed Playwright. */
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");

async function main() {
  const { chromium } = require(process.argv[2] || "playwright");
  const probe = net.createServer();
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "-p", String(port), "-H", "127.0.0.1"], { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  let output = "", browser;
  server.stdout.on("data", (data) => { output += data; });
  server.stderr.on("data", (data) => { output += data; });
  try {
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      try { ready = (await fetch(base + "/login")).ok; } catch { /* Wait for the owned test server. */ }
      if (ready) break;
      if (server.exitCode !== null) throw new Error(output);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    assert(ready, output);
    browser = await chromium.launch({ headless: true, ...(process.argv[4] ? { channel: process.argv[4] } : {}) });
    for (const viewport of [{ width: 360, height: 800 }, { width: 412, height: 915 }, { width: 1440, height: 1000 }]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await context.addInitScript(() => { localStorage.setItem("bomberos_access_token", "layout-access"); localStorage.setItem("bomberos_refresh_token", "layout-refresh"); });
      let closed = false;
      await page.route("**/api/**", async (route) => {
        const request = route.request(), url = new URL(request.url());
        const headers = { "Access-Control-Allow-Origin": base, "Access-Control-Allow-Headers": "authorization,content-type", "Access-Control-Allow-Methods": "GET,DELETE,POST,PATCH,OPTIONS" };
        if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
        let body = [];
        if (url.pathname.endsWith("/auth/me")) body = { id: "layout-user", username: "layout", role: "FIREFIGHTER", isActive: true, isPendingApproval: false, mustChangePassword: false, email: null, profile: { fullName: "Prueba visual", rank: "Bombero", badge: "LAYOUT" } };
        if (url.pathname.endsWith("/auth/sessions")) body = [
          { id: "current", userAgent: "Navegador de prueba", isCurrent: true, lastUsedAt: new Date().toISOString() },
          ...(!closed ? [{ id: "other", userAgent: "Android-" + "Dispositivo".repeat(20), isCurrent: false, lastUsedAt: new Date().toISOString() }] : []),
        ];
        if (request.method() === "DELETE") { closed = true; body = { message: "Sesion cerrada" }; }
        return route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify(body) });
      });
      const response = await page.goto(base + "/security");
      assert.equal(response.headers()["x-frame-options"], "DENY");
      await page.getByRole("heading", { name: "Seguridad de la cuenta" }).waitFor();
      await page.getByText("Navegador de prueba", { exact: true }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Desborde horizontal en ${viewport.width}`);
      if (viewport.width < 1024) {
        await page.getByRole("button", { name: "Mas", exact: true }).click();
        await page.getByRole("dialog").getByRole("link", { name: "Seguridad", exact: true }).click();
        await page.getByRole("dialog").waitFor({ state: "hidden" });
      }
      page.once("dialog", (dialog) => dialog.accept());
      await page.getByRole("button", { name: "Cerrar", exact: true }).click();
      await page.getByRole("button", { name: "Cerrar", exact: true }).waitFor({ state: "hidden" });
      assert.equal(await page.getByRole("button", { name: "Cerrar otras sesiones" }).isDisabled(), true);
      if (process.argv[3]) await page.screenshot({ path: path.join(process.argv[3], `security-${viewport.width}.png`), fullPage: true });
      assert.deepEqual(errors, []);
      console.log(`Seguridad UI OK: ${viewport.width}x${viewport.height}, sin desbordes ni errores JS, cierre de sesion y navegacion.`);
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    if (server.exitCode === null) {
      server.kill();
      await new Promise((resolve) => server.once("exit", resolve));
    }
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
