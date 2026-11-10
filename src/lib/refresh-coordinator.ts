type Tokens = { accessToken: string; refreshToken: string };
type Options = {
  readAccess: () => string | null;
  readRefresh: () => string | null;
  write: (tokens: Tokens) => void;
  request: (token: string) => Promise<Tokens>;
  expire: () => void;
  lock?: (work: () => Promise<string>) => Promise<string>;
};

export function createRefreshCoordinator(options: Options) {
  let pending: Promise<string> | null = null;
  return (failedAccess: string | null) => {
    if (pending) return pending;
    const rotate = async () => {
      const access = options.readAccess();
      if (access && access !== failedAccess) return access;
      const previous = options.readRefresh();
      if (!previous) throw new Error("Sesion cerrada");
      try {
        const tokens = await options.request(previous);
        if (options.readRefresh() !== previous) throw new Error("La sesion cambio");
        if (typeof tokens.accessToken !== "string" || !tokens.accessToken || typeof tokens.refreshToken !== "string" || !tokens.refreshToken) throw new Error("Respuesta de sesion invalida");
        options.write(tokens);
        return tokens.accessToken;
      } catch (error) {
        if (options.readRefresh() === previous) options.expire();
        throw error;
      }
    };
    // A shared browser lock serializes refreshes between tabs using the same storage.
    pending = (options.lock ? options.lock(rotate) : rotate()).finally(() => { pending = null; });
    return pending;
  };
}
