import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_PATH = join(__dirname, 'public', 'config.json');

// --- Admin auth -------------------------------------------------------
// The admin password lives OUTSIDE public/config.json (that file is served
// as a static asset, so anything in it is readable by anyone). Set
// ADMIN_PASSWORD_HASH in the environment as "salt:hash" (both hex), e.g.:
//   node -e "const c=require('crypto');const s=c.randomBytes(16).toString('hex');console.log(s+':'+c.scryptSync('SEU_NOVO_PASSWORD',s,64).toString('hex'))"
// Falling back to a default dev password ("admin123") only when the env var
// is not set — this MUST be overridden before deploying anywhere shared.
const DEFAULT_DEV_SALT = 'dev-only-salt';
const DEFAULT_DEV_HASH = scryptSync('admin123', DEFAULT_DEV_SALT, 64).toString('hex');
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || `${DEFAULT_DEV_SALT}:${DEFAULT_DEV_HASH}`;

if (!process.env.ADMIN_PASSWORD_HASH) {
  console.warn('⚠️  ADMIN_PASSWORD_HASH not set — using default dev password "admin123". Set it before deploying.');
}

function verifyPassword(password) {
  const [salt, storedHash] = ADMIN_PASSWORD_HASH.split(':');
  if (!salt || !storedHash) return false;
  const candidateHash = scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHash, 'hex');
  if (candidateHash.length !== stored.length) return false;
  return timingSafeEqual(candidateHash, stored);
}

// In-memory session tokens (cleared on server restart — fine for an internal
// admin panel; no persistent credential store needed).
const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
const sessions = new Map(); // token -> expiresAt

function createSession() {
  const token = randomBytes(24).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const expiresAt = sessions.get(token);
  if (!expiresAt || expiresAt < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Sessão admin inválida ou expirada. Faça login novamente.' });
  }
  next();
}

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// Admin login: exchange password for a short-lived session token
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (typeof password !== 'string' || !verifyPassword(password)) {
    return res.status(401).json({ error: 'Senha inválida' });
  }
  res.json({ token: createSession() });
});

app.post('/api/admin/logout', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  sessions.delete(token);
  res.json({ success: true });
});

// API endpoint to save configuration — requires a valid admin session
app.post('/api/config/save', requireAdmin, (req, res) => {
  try {
    const config = req.body;

    // Validate basic structure
    if (!config.fields || !Array.isArray(config.fields)) {
      return res.status(400).json({ error: 'Invalid config: missing fields array' });
    }
    if (!config.dependencies || !Array.isArray(config.dependencies)) {
      return res.status(400).json({ error: 'Invalid config: missing dependencies array' });
    }

    // Write to config.json
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');

    res.json({ success: true, message: 'Configuration saved successfully' });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ UTM Generator server running on port ${PORT}`);
  console.log(`   Local: http://localhost:${PORT}`);
});
