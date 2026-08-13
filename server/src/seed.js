import bcrypt from 'bcryptjs';
import { pool } from './db.js';

export async function seedAdmin() {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM users');
  if (rows[0].count > 0) return;

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@vxcomunicacao.com.br';
  const password = process.env.SEED_ADMIN_PASSWORD || 'change_me_now';
  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Administrador', email, hash, 'admin']
  );
  console.log(`[seed] usuário admin criado: ${email}`);
}
