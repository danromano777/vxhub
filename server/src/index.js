import 'dotenv/config';
import express from 'express';
import 'express-async-errors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import brandRoutes from './routes/brands.js';
import userRoutes from './routes/users.js';
import { seedAdmin } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const adminDist = path.join(__dirname, '..', 'admin-dist');
app.use('/admin', express.static(adminDist));
app.get(/^\/admin(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(adminDist, 'index.html'));
});
app.get('/', (req, res) => res.redirect('/admin'));

const port = process.env.PORT || 3000;

seedAdmin()
  .catch((err) => console.error('[seed] falhou:', err.message))
  .finally(() => {
    app.listen(port, () => console.log(`[server] rodando na porta ${port}`));
  });
