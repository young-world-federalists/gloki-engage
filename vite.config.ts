import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Settings every build must have; defaults live in .env, overridden by
// .env.local or environment variables (src/services/applicationServer.ts).
// Checked here so a misconfigured app fails to build instead of shipping.
const REQUIRED_ENV = ['VITE_APPLICATION_SERVER_URL', 'VITE_APPLICATION_AGENT'];

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const missing = REQUIRED_ENV.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(', ')}: set ${missing.length > 1 ? 'them' : 'it'} in .env (or .env.local / the environment).`);
  }

  return {
    plugins: [react()],
    base: mode === 'production' ? '/gloki-engage/' : '/',
    server: {
      port: 7173,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
})
