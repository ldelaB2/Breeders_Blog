// The tests create, change and wipe rows freely, so they must never reach a
// real database. Everything in test/ calls this before touching Prisma.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function assertLocalDatabase() {
  for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
    const value = process.env[name];
    let host;
    try {
      host = new URL(value).hostname;
    } catch {
      host = null;
    }
    if (!LOCAL_HOSTS.has(host)) {
      throw new Error(
        `Refusing to run tests: ${name} must point at a local database (got host "${host}"). ` +
          "Run them with `npm test`, which loads .env.test.",
      );
    }
  }
}
