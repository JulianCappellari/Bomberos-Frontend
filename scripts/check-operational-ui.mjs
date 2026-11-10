import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BOMBEROS_PLAYWRIGHT_PATH || "playwright");
const base = "http://localhost:3217", password = process.env.BOMBEROS_TEST_PASSWORD;
if (!password) throw new Error("Use solo la vista temporal --preview y sus cuentas ficticias");
const output = fileURLToPath(new URL("../../tmp/ui/", import.meta.url)); await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true }), errors = [];
async function login(username) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: "America/Argentina/Buenos_Aires" });
  const page = await context.newPage(); page.on("pageerror", error => errors.push(error.message));
  await page.goto(base + "/login"); await page.getByPlaceholder("Tu nombre de usuario").fill(username);
  await page.locator('input[type="password"]').fill(password); await page.getByRole("button", { name: "Ingresar al Cuartel" }).click();
  await page.waitForURL(/\/(dashboard|admin)$/); return { context, page };
}
async function capture(page, name) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Desborde horizontal: ${name}`);
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
}
try {
  const staff = await login("member_test_2");
  await staff.page.getByRole("heading", { name: "Mi disponibilidad" }).waitFor();
  await staff.page.getByText("Esta semana te toca control de moviles", { exact: true }).waitFor();
  await staff.page.getByRole("button", { name: "Disponible", exact: true }).click();
  await staff.page.getByRole("status").filter({ hasText: "Disponible fuera de base" }).waitFor();
  await capture(staff.page, "operativo-inicio-pc");
  await staff.page.setViewportSize({ width: 360, height: 800 }); await capture(staff.page, "operativo-inicio-movil");
  await staff.page.goto(base + "/station"); await staff.page.getByRole("heading", { name: "Disponibilidad de la dotación" }).waitFor();
  await staff.page.getByRole("button", { name: /Disponible fuera de base/ }).click();
  await staff.page.getByRole("heading", { name: "Disponibilidad de la dotación" }).locator("..").getByText("Prueba personal 2", { exact: true }).waitFor(); await capture(staff.page, "operativo-disponibilidad-movil");
  await staff.page.goto(base + "/notifications"); await staff.page.getByText("El servidor aun no tiene configuradas las claves de notificaciones externas.", { exact: true }).waitFor();
  assert.equal(await staff.page.getByRole("button", { name: "Activar avisos" }).count(), 0);
  await capture(staff.page, "operativo-notificaciones-movil");
  const command = await login("member_test_0");
  await command.page.goto(base + "/reports"); await command.page.getByRole("heading", { name: /Indicadores de intervención/ }).waitFor();
  await command.page.getByText("Sin movimientos registrados para el mes.", { exact: true }).waitFor(); await capture(command.page, "operativo-indicadores-pc");
  await command.page.setViewportSize({ width: 360, height: 800 }); await capture(command.page, "operativo-indicadores-movil");
  await command.page.goto(base + "/tasks"); await command.page.getByRole("button", { name: "Planificar", exact: true }).first().click();
  await command.page.getByRole("dialog").waitFor(); await capture(command.page, "operativo-planificacion-movil");
  assert.deepEqual(errors, []); console.log("UI operativa: inicio, grupo semanal, disponibilidad, campanita, informes y planificacion sin desbordes ni errores JS (PC y 360px).");
} finally { await browser.close(); }
