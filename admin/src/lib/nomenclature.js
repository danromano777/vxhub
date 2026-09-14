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

// Slug simples pra criar uma marca a partir só do nome (cadastro rápido pelo briefing).
export function slugify(str) {
  return removeAccents(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Sugere uma sigla de nomenclatura (idealmente 3 letras, no máximo 4) a partir do
// nome do cliente: iniciais de cada palavra, completando com as letras seguintes
// da última palavra até atingir o tamanho alvo. Se colidir com uma sigla já usada,
// tenta 4 letras e, por fim, cai para um sufixo numérico.
export function suggestBrandCode(name, existingCodes) {
  const words = removeAccents(name)
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return '';

  const used = new Set((existingCodes || []).filter(Boolean).map((c) => c.toUpperCase()));
  const initials = words.map((w) => w[0]).join('');
  const lastWord = words[words.length - 1];

  function candidateOfLength(targetLen) {
    let result = initials;
    let i = 1;
    while (result.length < targetLen && i < lastWord.length) {
      result += lastWord[i];
      i += 1;
    }
    return result.slice(0, targetLen);
  }

  const three = candidateOfLength(3);
  if (three && !used.has(three)) return three;
  const four = candidateOfLength(4);
  if (four && !used.has(four)) return four;

  const base = (three || four || 'X').slice(0, 3);
  let n = 2;
  while (used.has(`${base}${n}`) && n < 10) n += 1;
  return `${base}${n}`;
}
