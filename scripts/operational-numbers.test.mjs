import test from "node:test";
import assert from "node:assert/strict";
import { decimalUnits } from "../src/lib/operational-numbers.ts";
test("currency parsing does not round or guess thousands", () => {
  assert.equal(decimalUnits("15,50", 2), 1550);
  assert.equal(decimalUnits("0.01", 2), 1);
  for (const value of ["1.234", "1,000.00", "1e2", "-1", "", "Infinity"]) assert.equal(decimalUnits(value, 2), null);
});
test("volume preview preserves three decimals", () => {
  assert.equal(decimalUnits("36.500", 3), 36500);
  assert.equal(decimalUnits("36,5", 3), 36500);
  assert.equal(decimalUnits("0.001", 3), 1);
});
