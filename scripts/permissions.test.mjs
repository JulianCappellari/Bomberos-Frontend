import assert from "node:assert/strict";
import test from "node:test";
import { canOpenPage, isCommand, isDutyManager, showNavigationItem } from "../src/lib/permissions.ts";
test("Ranking oculto y bloqueado para todo rol salvo administrador/oficial",()=>{assert(canOpenPage("/ranking","ADMIN"));for(const role of ["OPERATOR","GUARD","FIREFIGHTER",undefined]){assert(!canOpenPage("/ranking",role));assert(!canOpenPage("/ranking/detail",role));assert(!showNavigationItem("/ranking",role));}});
test("Guardia administra operaciones pero no cuentas, prendas o perfiles ajenos", () => {
  assert(isDutyManager("GUARD")); assert(!isCommand("GUARD"));
  for (const path of ["/maintenance", "/fuel", "/water-trips", "/air-equipment", "/compliance", "/guard-qr", "/guard-log"]) { assert(canOpenPage(path, "GUARD")); assert(!canOpenPage(path, "FIREFIGHTER")); }
  for (const path of ["/admin", "/personal-equipment", "/command", "/control-groups"]) assert(!canOpenPage(path, "GUARD"));
});
test("La navegacion no ofrece recursos secundarios ni gestion a quien no corresponde", () => {
  for (const role of ["ADMIN", "OPERATOR", "GUARD", "FIREFIGHTER"]) for (const path of ["/hazmat", "/app", "/availability", "/control-groups"]) assert(!showNavigationItem(path, role));
  assert(!showNavigationItem("/driver-licenses", "FIREFIGHTER")); assert(canOpenPage("/driver-licenses", "FIREFIGHTER"));
  assert(!showNavigationItem("/participations", "FIREFIGHTER")); assert(canOpenPage("/participations", "FIREFIGHTER"));
  assert(showNavigationItem("/driver-licenses", "OPERATOR")); assert(showNavigationItem("/guard-log", "GUARD")); assert(!showNavigationItem("/guard-log", "ADMIN"));
});
