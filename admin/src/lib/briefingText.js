// Monta o texto do briefing pronto para colar na descrição do card (Trello, etc.),
// no mesmo padrão de blocos em negrito usado nos templates de briefing da VX.

function formatDatePt(value) {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

function line(label, value) {
  if (!value) return '';
  return `**${label}:** ${value}`;
}

function block(label, value) {
  if (!value) return '';
  return `**${label}**\n${value}`;
}

function screensBlock(screens) {
  if (!screens || !screens.length) return '';
  return screens
    .map((s, i) => {
      const label = s.title ? `Tela ${i + 1} — ${s.title}` : `Tela ${i + 1}`;
      const lines = [`**${label}**`];
      if (s.image_url) lines.push(`Imagem: ${s.image_url}`);
      if (s.text_content) lines.push(`Texto: ${s.text_content}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

export function buildBriefingText({ briefing, brandName, brandCode, screens }) {
  const parts = [];

  const clienteValue = brandName ? `${brandName}${brandCode ? ` [${brandCode}]` : ''}` : '';
  const tipoValue = briefing.job_type || briefing.job_size
    ? `${briefing.job_type || '—'}${briefing.job_size ? ` (porte ${briefing.job_size})` : ''}`
    : '';
  const prazoValue = briefing.start_date || briefing.deadline
    ? `${briefing.start_date ? formatDatePt(briefing.start_date) : '—'} → ${briefing.deadline ? formatDatePt(briefing.deadline) : '—'}`
    : '';

  const headerLines = [
    line('Cliente', clienteValue),
    line('Tipo de job', tipoValue),
    line('Solicitante', briefing.requester_name),
    line('Prazo', prazoValue),
  ].filter(Boolean);
  if (headerLines.length) parts.push(headerLines.join('\n'));

  parts.push(block('Contexto', briefing.context));
  parts.push(block('Objetivo', briefing.objective));
  parts.push(block('Público-alvo', briefing.target_audience));
  parts.push(block('Produto/Serviço', briefing.product_service));
  parts.push(block('Mensagem-chave', briefing.key_message));
  parts.push(block('Conceito', briefing.concept));

  const pieceInfo = `${briefing.piece_format === 'VID' ? 'Vídeo' : 'Estático'} · ${briefing.piece_count || 1} peça(s)${briefing.video_channel ? ` · ${briefing.video_channel}` : ''}`;
  parts.push(block('Escopo', [briefing.scope, pieceInfo].filter(Boolean).join('\n')));

  parts.push(screensBlock(screens));

  parts.push(block('Canais', briefing.channels));
  parts.push(block('Referências', briefing.references_text));
  parts.push(block('Histórico', briefing.history_notes));
  parts.push(block("Do's & Don'ts", briefing.dos_donts));
  parts.push(line('Orçamento', briefing.budget));
  parts.push(block('KPIs', briefing.kpis));
  parts.push(block('Pontos a apurar', briefing.open_points));
  parts.push(block('Observações', briefing.notes));

  return parts.filter(Boolean).join('\n\n');
}
