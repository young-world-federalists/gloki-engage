// The one place the application server settings are read. Defaults live in
// the repo's .env; override them in .env.local or with environment variables
// at build time. APPLICATION_AGENT on APPLICATION_SERVER_URL is the central
// application account; it holds the application settings contract
// (applicationSettings.ts), which says where application-wide contracts such
// as the verification contract live.

export const APPLICATION_SERVER_URL: string =
  import.meta.env.VITE_APPLICATION_SERVER_URL || 'https://gdi.gloki.contact';

export const APPLICATION_AGENT: string =
  import.meta.env.VITE_APPLICATION_AGENT || 'gloki-application';
