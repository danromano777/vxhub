// Gera a nomenclatura padrão de card/arquivo da esteira ON+OFF+PRIO:
// ESTÁTICO -> [SIGLA]mês-dia_NomeCampanha_Título_EST_nPeças
// VÍDEO    -> [SIGLA]mês-dia_NomeCampanha_Título_VID_nPeças_formato

function removeAccents(str) {
  return String(str || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function camelToken(str) {
  return removeAccents(str)
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

export function buildNomenclature({ brandCode, date, campaignName, title, pieceFormat, pieceCount, videoChannel }) {
  const code = (brandCode || '').trim().toUpperCase();
  const d = date ? new Date(`${date}T00:00:00`) : null;
  const mmdd = d && !isNaN(d) ? `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : 'MM-DD';
  const campaign = camelToken(campaignName) || 'NomeCampanha';
  const titleToken = camelToken(title) || 'Titulo';
  const format = pieceFormat === 'VID' ? 'VID' : 'EST';
  const count = pieceCount || 1;
  let name = `[${code || 'SIGLA'}]${mmdd}_${campaign}_${titleToken}_${format}_${count}P`;
  if (format === 'VID' && videoChannel) name += `_${camelToken(videoChannel)}`;
  return name;
}
