import test from "node:test";
import assert from "node:assert/strict";
import { createRefreshCoordinator } from "../src/lib/refresh-coordinator.ts";

function setup(request) {
  const state = { accessToken: "old-access", refreshToken: "old-refresh", expired: 0, writes: 0 };
  const options = {
    readAccess: () => state.accessToken, readRefresh: () => state.refreshToken,
    request, write: (tokens) => { Object.assign(state, tokens); state.writes++; },
    expire: () => { state.expired++; state.accessToken = null; state.refreshToken = null; },
  };
  return { state, options };
}
const next = { accessToken: "new-access", refreshToken: "new-refresh" };

test("Varias respuestas 401 comparten una renovacion y guardan ambos tokens", async () => {
  let calls = 0;
  const { state, options } = setup(async () => { calls++; await new Promise((r) => setTimeout(r, 5)); return next; });
  const refresh = createRefreshCoordinator(options);
  assert.deepEqual(await Promise.all([refresh("old-access"), refresh("old-access"), refresh("old-access")]), ["new-access", "new-access", "new-access"]);
  assert.equal(calls, 1); assert.equal(state.refreshToken, "new-refresh");
  assert.equal(await refresh("old-access"), "new-access"); assert.equal(calls, 1);
});

test("Un refresh rechazado cierra la sesion una sola vez y no se reintenta recursivamente", async () => {
  const { state, options } = setup(async () => { throw new Error("Unauthorized"); });
  const refresh = createRefreshCoordinator(options);
  await assert.rejects(refresh("old-access"), /Unauthorized/);
  await assert.rejects(refresh("old-access"), /Sesion cerrada/);
  assert.equal(state.expired, 1);
});

test("Una renovacion pendiente no vuelve a autenticar despues de logout", async () => {
  let finish;
  const { state, options } = setup(() => new Promise((resolve) => { finish = resolve; }));
  const pending = createRefreshCoordinator(options)("old-access");
  state.accessToken = null; state.refreshToken = null;
  finish(next);
  await assert.rejects(pending, /sesion cambio/);
  assert.equal(state.writes, 0); assert.equal(state.expired, 0);
});

test("Una renovacion anterior no elimina las credenciales de un nuevo login", async () => {
  let fail;
  const { state, options } = setup(() => new Promise((_resolve, reject) => { fail = reject; }));
  const pending = createRefreshCoordinator(options)("old-access");
  state.accessToken = "other-login"; state.refreshToken = "other-refresh";
  fail(new Error("Old session rejected"));
  await assert.rejects(pending);
  assert.equal(state.accessToken, "other-login"); assert.equal(state.expired, 0);
});

test("Dos pestanas coordinadas no reutilizan el token de renovacion", async () => {
  let tail = Promise.resolve(), calls = 0;
  const lock = (work) => { const result = tail.then(work); tail = result.catch(() => {}); return result; };
  const { options } = setup(async () => { calls++; return next; });
  options.lock = lock;
  const tab1 = createRefreshCoordinator(options), tab2 = createRefreshCoordinator(options);
  assert.deepEqual(await Promise.all([tab1("old-access"), tab2("old-access")]), ["new-access", "new-access"]);
  assert.equal(calls, 1);
});
