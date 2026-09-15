// Tipos de job oferecidos na tela de escolha antes de criar um briefing.
// "tier" decide quais seções do formulário aparecem:
// - avulso: só o essencial pro job avulso (objetivo, público, escopo, mensagem,
//   referências, prazo, restrições) — como o próprio Agente de Briefings VX
//   conduz um job avulso.
// - campanha: formulário completo (contexto, produto/serviço, conceito, canais,
//   histórico, orçamento, KPIs, pontos a apurar).
export const JOB_TYPES = [
  {
    key: 'post_social',
    label: 'Post social / Stories',
    tier: 'avulso',
    description: 'Peça única pra Instagram/redes sociais — direcionamento, texto e referência.',
    defaultFormat: 'EST',
    defaultCount: 1,
  },
  {
    key: 'video',
    label: 'Vídeo / Reels',
    tier: 'avulso',
    description: 'Vídeo curto com roteiro/mensagem-chave e canal de publicação.',
    defaultFormat: 'VID',
    defaultCount: 1,
  },
  {
    key: 'trinca',
    label: 'Trinca de posts',
    tier: 'avulso',
    description: 'Grid de 3 posts + capas individuais.',
    defaultFormat: 'EST',
    defaultCount: 4,
  },
  {
    key: 'vaga',
    label: 'Vaga (RH)',
    tier: 'avulso',
    description: 'Divulgação de vaga com rodapé por área e hashtag.',
    defaultFormat: 'EST',
    defaultCount: 2,
  },
  {
    key: 'kv',
    label: 'KV / Key Visual',
    tier: 'campanha',
    description: 'Peça-chave de campanha — briefing completo de conceito e estratégia.',
    defaultFormat: 'EST',
    defaultCount: 1,
  },
  {
    key: 'campanha',
    label: 'Campanha completa',
    tier: 'campanha',
    description: 'Campanha multi-peça — contexto, canais, mídia, orçamento e KPIs.',
    defaultFormat: 'EST',
    defaultCount: 1,
  },
];

// Briefings antigos ou com um job_type que não bate com nenhum tipo conhecido
// caem no formulário completo (nunca escondem campo que já tem dado).
export function getJobTypeTier(jobTypeLabel) {
  const match = JOB_TYPES.find((t) => t.label === jobTypeLabel);
  return match ? match.tier : 'campanha';
}
