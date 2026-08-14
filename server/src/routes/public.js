import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/site-content', async (req, res) => {
  const [[content]] = [(await pool.query('SELECT title,subtitle,description,logo_url FROM site_content WHERE id=1'))[0]];
  res.json(content || {});
});

router.get('/brands', async (req, res) => {
  const [brands] = await pool.query(
    `SELECT slug,name,display_html,brand_group,filter_key,description,
       grad_a,grad_b,grad_c,grad_d,grad_base,grad_glow,grad_pale,logo_url
     FROM brands ORDER BY sort_order, id`
  );
  res.json(brands);
});

router.get('/brands/:slug', async (req, res) => {
  const [[brand]] = [(await pool.query('SELECT * FROM brands WHERE slug = ?', [req.params.slug]))[0]];
  if (!brand) return res.status(404).json({ error: 'Marca não encontrada' });
  const [sections] = await pool.query('SELECT * FROM sections WHERE brand_id = ? ORDER BY sort_order, id', [brand.id]);
  const sectionIds = sections.map((s) => s.id);
  let blocks = [];
  if (sectionIds.length) {
    [blocks] = await pool.query(
      `SELECT * FROM blocks WHERE section_id IN (${sectionIds.map(() => '?').join(',')}) ORDER BY sort_order, id`,
      sectionIds
    );
  }
  const sections_full = sections.map((s) => ({ ...s, blocks: blocks.filter((b) => b.section_id === s.id) }));
  res.json({ ...brand, sections: sections_full });
});

export default router;
