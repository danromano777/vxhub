import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const CAN_WRITE = requireRole('admin', 'editor');

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const PDF_MIME_TYPE = 'application/pdf';
const ACCEPTED_MIME_TYPES = [...IMAGE_MIME_TYPES, PDF_MIME_TYPE];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const ExtractionSchema = z.object({
  title: z.string().optional().describe('Título curto do job/projeto'),
  campaign_name: z.string().optional().describe('Nome da campanha, se houver'),
  requester_name: z.string().optional().describe('Quem está pedindo, se identificável'),
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
  start_date: z.string().optional().describe('Data de início no formato AAAA-MM-DD, só se explícita'),
  deadline: z.string().optional().describe('Prazo/data de entrega no formato AAAA-MM-DD, só se explícita'),
});

const EXTRACTION_SYSTEM_PROMPT =
  'Você extrai informações de briefings de job recebidos por um cliente (texto de WhatsApp/e-mail, print de ' +
  'conversa, PDF do pedido, etc.) para uma agência de publicidade. Extraia SOMENTE o que está explicitamente ' +
  'presente no material. Nunca invente e nunca deduza uma informação que não esteja lá. Se um campo não tiver ' +
  'informação clara, omita esse campo da resposta em vez de adivinhar.';

async function runExtraction(content) {
  const response = await client.messages.parse({
    model: 'claude-opus-5',
    max_tokens: 4096,
    output_config: { format: zodOutputFormat(ExtractionSchema), effort: 'low' },
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  if (!response.parsed_output) return null;

  const fields = {};
  for (const [key, value] of Object.entries(response.parsed_output)) {
    if (value === undefined || value === null || value === '') continue;
    if ((key === 'start_date' || key === 'deadline') && !DATE_RE.test(value)) continue;
    fields[key] = value;
  }
  return fields;
}

function handleAnthropicError(err, res) {
  if (err instanceof Anthropic.AuthenticationError) {
    res.status(503).json({ error: 'Chave da API da Anthropic inválida ou sem permissão.' });
    return true;
  }
  if (err instanceof Anthropic.RateLimitError) {
    res.status(429).json({ error: 'Limite de uso da IA atingido, tente novamente em instantes.' });
    return true;
  }
  if (err instanceof Anthropic.APIError) {
    res.status(502).json({ error: `Erro ao consultar a IA: ${err.message}` });
    return true;
  }
  return false;
}

router.post('/extract-briefing', CAN_WRITE, async (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Cole o texto do cliente antes de extrair' });
  if (!client) {
    return res.status(503).json({ error: 'Extração por IA não configurada: defina ANTHROPIC_API_KEY no servidor' });
  }

  try {
    const fields = await runExtraction(text);
    if (!fields) {
      return res.status(502).json({ error: 'Não consegui extrair campos desse texto. Tente reformular ou preencher manualmente.' });
    }
    res.json({ fields });
  } catch (err) {
    if (!handleAnthropicError(err, res)) throw err;
  }
});

router.post('/extract-briefing-file', CAN_WRITE, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Envie um arquivo antes de extrair' });
  if (!client) {
    return res.status(503).json({ error: 'Extração por IA não configurada: defina ANTHROPIC_API_KEY no servidor' });
  }

  const mime = req.file.mimetype;
  if (mime.startsWith('audio/') || mime.startsWith('video/')) {
    return res.status(415).json({
      error: 'Áudio e vídeo ainda não são suportados: a API da Anthropic não transcreve fala. ' +
        'Transcreva o áudio em outra ferramenta e cole o texto na caixa acima.',
    });
  }
  if (!ACCEPTED_MIME_TYPES.includes(mime)) {
    return res.status(415).json({ error: `Tipo de arquivo não suportado (${mime}). Envie uma imagem (PNG/JPG/WEBP/GIF) ou um PDF.` });
  }

  try {
    const base64 = req.file.buffer.toString('base64');
    const fileBlock = mime === PDF_MIME_TYPE
      ? { type: 'document', source: { type: 'base64', media_type: mime, data: base64 } }
      : { type: 'image', source: { type: 'base64', media_type: mime, data: base64 } };

    const fields = await runExtraction([
      fileBlock,
      { type: 'text', text: 'Extraia os campos do briefing a partir deste arquivo (print de conversa, pedido em PDF, etc.).' },
    ]);
    if (!fields) {
      return res.status(502).json({ error: 'Não consegui extrair campos desse arquivo. Tente outro arquivo ou preencha manualmente.' });
    }
    res.json({ fields });
  } catch (err) {
    if (!handleAnthropicError(err, res)) throw err;
  }
});

export default router;
