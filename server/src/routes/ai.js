import { Router } from 'express';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const CAN_WRITE = requireRole('admin', 'editor');

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const ExtractionSchema = z.object({
  title: z.string().optional().describe('Título curto do job/projeto'),
  campaign_name: z.string().optional().describe('Nome da campanha, se houver'),
  requester_name: z.string().optional().describe('Quem está pedindo, se identificável no texto'),
  context: z.string().optional().describe('O que motivou o job'),
  objective: z.string().optional(),
  target_audience: z.string().optional(),
  product_service: z.string().optional(),
  key_message: z.string().optional(),
  concept: z.string().optional(),
  scope: z.string().optional().describe('Peças, quantidade, formatos pedidos'),
  channels: z.string().optional().describe('Onde vai ser publicado (Instagram, site, e-mail...)'),
  references_text: z.string().optional().describe('Links ou materiais de referência citados'),
  dos_donts: z.string().optional().describe('Restrições ou obrigatoriedades citadas'),
  budget: z.string().optional(),
  kpis: z.string().optional(),
  history_notes: z.string().optional(),
  open_points: z.string().optional(),
  notes: z.string().optional(),
  start_date: z.string().optional().describe('Data de início no formato AAAA-MM-DD, só se explícita no texto'),
  deadline: z.string().optional().describe('Prazo/data de entrega no formato AAAA-MM-DD, só se explícita no texto'),
});

router.post('/extract-briefing', CAN_WRITE, async (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Cole o texto do cliente antes de extrair' });
  if (!client) {
    return res.status(503).json({ error: 'Extração por IA não configurada: defina ANTHROPIC_API_KEY no servidor' });
  }

  try {
    const response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 4096,
      output_config: { format: zodOutputFormat(ExtractionSchema), effort: 'low' },
      system:
        'Você extrai informações de briefings de job recebidos por texto (WhatsApp, e-mail, etc.) para uma ' +
        'agência de publicidade. Extraia SOMENTE o que está explicitamente escrito no texto. Nunca invente e ' +
        'nunca deduza uma informação que não esteja no texto. Se um campo não tiver informação clara, omita ' +
        'esse campo da resposta em vez de adivinhar.',
      messages: [{ role: 'user', content: text }],
    });

    if (!response.parsed_output) {
      return res.status(502).json({ error: 'Não consegui extrair campos desse texto. Tente reformular ou preencher manualmente.' });
    }

    const fields = {};
    for (const [key, value] of Object.entries(response.parsed_output)) {
      if (value === undefined || value === null || value === '') continue;
      if ((key === 'start_date' || key === 'deadline') && !DATE_RE.test(value)) continue;
      fields[key] = value;
    }

    res.json({ fields });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(503).json({ error: 'Chave da API da Anthropic inválida ou sem permissão.' });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'Limite de uso da IA atingido, tente novamente em instantes.' });
    }
    if (err instanceof Anthropic.APIError) {
      return res.status(502).json({ error: `Erro ao consultar a IA: ${err.message}` });
    }
    throw err;
  }
});

export default router;
