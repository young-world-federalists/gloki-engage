// The one place the application server settings are read. Defaults live in
// the repo's .env; override them in .env.local or with environment variables
// at build time. Application-wide contracts (today: the verification
// contract) are deployed under APPLICATION_AGENT on APPLICATION_SERVER_URL.

export const APPLICATION_SERVER_URL: string =
  import.meta.env.VITE_APPLICATION_SERVER_URL || 'https://gdi.gloki.contact';

export const APPLICATION_AGENT: string =
  import.meta.env.VITE_APPLICATION_AGENT || 'gloki-application';
