import 'dotenv/config';
import express from 'express';
import 'express-async-errors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import brandRoutes from './routes/brands.js';
import userRoutes from './routes/users.js';
import publicRoutes from './routes/public.js';
import siteContentRoutes from './routes/siteContent.js';
import { seedAdmin } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/users', userRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/site-content', siteContentRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

const adminDist = path.join(__dirname, '..', 'admin-dist');
app.use('/admin', express.static(adminDist));
app.get(/^\/admin(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(adminDist, 'index.html'));
});

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

const port = process.env.PORT || 3000;

seedAdmin()
  .catch((err) => console.error('[seed] falhou:', err.message))
  .finally(() => {
    app.listen(port, () => console.log(`[server] rodando na porta ${port}`));
  });
