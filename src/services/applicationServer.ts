// The one place the application server settings are read. Their defaults
// live ONLY in the repo's .env; override them in .env.local or with
// environment variables at build time. vite.config.ts refuses to build
// without them, so the guard below is just a backstop. APPLICATION_AGENT on
// APPLICATION_SERVER_URL is the central application account; it holds the
// application settings contract (applicationSettings.ts), which says where
// application-wide contracts such as the verification contract live.

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} is not set — check .env`);
  return value;
}

export const APPLICATION_SERVER_URL = required('VITE_APPLICATION_SERVER_URL', import.meta.env.VITE_APPLICATION_SERVER_URL);

export const APPLICATION_AGENT = required('VITE_APPLICATION_AGENT', import.meta.env.VITE_APPLICATION_AGENT);
