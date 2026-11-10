import assert from "node:assert/strict";
import { test } from "node:test";
import { getErrorMessage } from "../src/lib/get-error-message.ts";
test("Muestra errores concretos del formulario en vez del mensaje generico", () => {
  assert.equal(getErrorMessage({ isAxiosError: true, response: { data: { message: "Errores de validacion", errors: [{ message: "El vencimiento debe ser posterior" }, { message: "No repita clases" }] } } }, "Error"), "El vencimiento debe ser posterior. No repita clases");
});
test("Ignora detalles corruptos, limita mensajes y conserva el fallback", () => {
  assert.equal(getErrorMessage({ isAxiosError: true, response: { data: { errors: [null, 1, { message: 2 }] } } }, "Error esperado"), "Error esperado");
  assert.equal(getErrorMessage(new Error("Problema concreto"), "Error"), "Problema concreto");
  assert.equal(getErrorMessage(null, "Error esperado"), "Error esperado");
});
