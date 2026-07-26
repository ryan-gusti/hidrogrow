import jwt from 'jsonwebtoken';
import { db } from './db.js';

// Untuk penggunaan lokal; override via env JWT_SECRET jika perlu
export const JWT_SECRET = process.env.JWT_SECRET || 'hidrogrow-local-secret';

export function signToken(user) {
  return jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: '90d' });
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, username FROM users WHERE id = ?').get(payload.uid);
    if (!user) return res.status(401).json({ error: 'Pengguna tidak valid' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa' });
  }
}
