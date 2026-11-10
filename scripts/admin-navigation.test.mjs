import test from "node:test";
import assert from "node:assert/strict";
import { parseAdminLocation, adminHref } from "../src/lib/admin-navigation.ts";
test("La administracion valida area y vista y conserva la ficha al recargar", () => {
  assert.deepEqual(parseAdminLocation("?area=staff&person=demo1&view=security"), { area: "staff", person: "demo1", view: "security" });
  assert.deepEqual(parseAdminLocation("?area=invalid&view=invalid"), { area: "overview", person: "", view: "profile" });
});
test("Los enlaces administrativos no arrastran una ficha a otras areas", () => {
  assert.equal(adminHref({ area: "finance", person: "demo1", view: "security" }), "/admin?area=finance");
  const location = { area: "staff", person: "id&special", view: "permissions" };
  assert.deepEqual(parseAdminLocation(adminHref(location).split("?")[1]), location);
});
