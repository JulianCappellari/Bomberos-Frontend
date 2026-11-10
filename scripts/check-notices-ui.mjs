import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BOMBEROS_PLAYWRIGHT_PATH || "playwright");
if (!process.env.BOMBEROS_TEST_PASSWORD) throw Error("Use solo el preview temporal de test:members");
const output = fileURLToPath(new URL("../../tmp/ui/", import.meta.url));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("http://localhost:3217/login");
  await page.getByPlaceholder("Tu nombre de usuario").fill("member_test_0");
  await page.locator('input[type="password"]').fill(process.env.BOMBEROS_TEST_PASSWORD);
  await page.getByRole("button", { name: "Ingresar al Cuartel" }).click();
  await page.waitForURL(/\/(dashboard|admin)$/);
  await page.goto("http://localhost:3217/alerts/notices");
  await page.getByLabel("Origen del aviso").fill("Central de prueba visual");
  await page.getByLabel("Ubicación", { exact: true }).fill("Direccion inicial de prueba");
  await page.getByRole("button", { name: "Registrar sin convocar" }).click();
  const row = page.locator("article").filter({ hasText: "Central de prueba visual" });
  await row.getByRole("button", { name: "Corregir", exact: true }).click();
  await page.getByLabel("Ubicación", { exact: true }).fill("Direccion corregida de prueba");
  await page.getByLabel("Motivo de la corrección").fill("Se verifico la direccion con la persona que llamo");
  for (const width of [1440, 360]) {
    await page.setViewportSize({ width, height: 900 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: output + `aviso-correccion-${width}.png`, fullPage: true });
  }
  await page.getByRole("button", { name: "Guardar corrección" }).click();
  await row.getByRole("heading", { name: /Direccion corregida/ }).waitFor();
  await row.getByRole("button", { name: "Anular aviso", exact: true }).click();
  await row.getByLabel("Motivo de anulación").fill("Aviso duplicado corroborado con central de emergencias");
  await row.getByRole("button", { name: "Confirmar anulación" }).click();
  await row.getByText(/Anulado: Aviso duplicado/).waitFor();
  assert.equal(await row.getByRole("button", { name: "Convocar dotación" }).count(), 0);
  await page.screenshot({ path: output + "aviso-anulado-360.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log("Avisos UI: alta, corrección y anulación; PC/360px sin desbordes ni errores JS.");
} finally {
  await browser.close();
}
