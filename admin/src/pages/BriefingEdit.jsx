import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { buildNomenclature } from '../lib/nomenclature.js';
import { STATUS_LABELS, STATUS_ORDER, StatusBadge } from './Briefings.jsx';

const emptyBriefing = {
  brand_id: '', title: '', campaign_name: '', job_type: '', job_size: '', requester_name: '',
  context: '', objective: '', target_audience: '', product_service: '', key_message: '', concept: '',
  scope: '', channels: '', kpis: '', start_date: '', deadline: '', budget: '', dos_donts: '',
  references_text: '', history_notes: '', notes: '', open_points: '',
  piece_format: 'EST', piece_count: 1, video_channel: '',
};

const JOB_TYPE_SUGGESTIONS = ['Post social', 'Vídeo', 'Campanha', 'Evento', 'Key visual', 'Release', 'E-mail marketing', 'Website'];
const VIDEO_CHANNEL_SUGGESTIONS = ['Feed', 'Reels', 'Stories', 'TikTok', 'YouTube'];

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('pt-BR');
}

export default function BriefingEdit() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = user.role === 'admin' || user.role === 'editor';

  const [briefing, setBriefing] = useState(emptyBriefing);
  const [history, setHistory] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusDraft, setStatusDraft] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  function load() {
    if (isNew) return;
    setLoading(true);
    api
      .getBriefing(id)
      .then((b) => {
        const {
          history: h, brand_name, brand_code, created_by_name, status,
          created_at, updated_at, id: bid, created_by, ...rest
        } = b;
        setBriefing({
          ...rest,
          start_date: rest.start_date ? String(rest.start_date).slice(0, 10) : '',
          deadline: rest.deadline ? String(rest.deadline).slice(0, 10) : '',
        });
        setHistory(h || []);
        setStatusDraft(status);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, [id]);

  useEffect(() => {
    api.listBrands().then(setBrands).catch(() => {});
  }, []);

  const selectedBrand = useMemo(
    () => brands.find((b) => String(b.id) === String(briefing.brand_id)),
    [brands, briefing.brand_id]
  );

  const nomenclature = useMemo(
    () =>
      buildNomenclature({
        brandCode: selectedBrand?.code,
        date: briefing.start_date || briefing.deadline,
        campaignName: briefing.campaign_name,
        title: briefing.title,
        pieceFormat: briefing.piece_format,
        pieceCount: briefing.piece_count,
        videoChannel: briefing.video_channel,
      }),
    [selectedBrand, briefing]
  );

  function set(field, value) {
    setBriefing((b) => ({ ...b, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        const r = await api.createBriefing(briefing);
        navigate(`/briefings/${r.id}`, { replace: true });
      } else {
        await api.updateBriefing(id, briefing);
        load();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange() {
    setChangingStatus(true);
    setError('');
    try {
      await api.changeBriefingStatus(id, statusDraft, statusNote);
      setStatusNote('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleCopyNomenclature() {
    try {
      await navigator.clipboard.writeText(nomenclature);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard indisponível — ignora */
    }
  }

  if (loading) return <p className="loading">Carregando…</p>;

  return (
    <div>
      <Link to="/" className="backlink">
        ← Voltar
      </Link>
      <div className="page__head">
        <h1>{isNew ? 'Novo briefing' : briefing.title}</h1>
        {!isNew && <StatusBadge status={statusDraft} />}
      </div>

      <div className="nomenclature-box">
        <span className="nomenclature-box__label">Nomenclatura do card/arquivo</span>
        <code className="nomenclature-box__value">{nomenclature}</code>
        <button type="button" className="icon-btn" onClick={handleCopyNomenclature}>
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
        {!selectedBrand?.code && (
          <p className="hint">
            Selecione um cliente com sigla cadastrada (ou adicione a sigla em Clientes → Editar) para gerar a
            nomenclatura completa.
          </p>
        )}
      </div>

      <form onSubmit={handleSave} className="form">
        <fieldset disabled={!canWrite}>
          <h3>1. Identificação</h3>
          <div className="grid2">
            <label>
              Título/Projeto <input value={briefing.title} onChange={(e) => set('title', e.target.value)} required />
            </label>
            <label>
              Nome da campanha (nomenclatura)
              <input
                value={briefing.campaign_name}
                onChange={(e) => set('campaign_name', e.target.value)}
                placeholder="ex: Receita, NovosEpisodios…"
              />
            </label>
            <label>
              Cliente
              <select value={briefing.brand_id || ''} onChange={(e) => set('brand_id', e.target.value)}>
                <option value="">Sem cliente vinculado</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.code ? ` [${b.code}]` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo de job
              <input
                value={briefing.job_type}
                onChange={(e) => set('job_type', e.target.value)}
                list="job-type-suggestions"
                placeholder="ex: Post social, Vídeo, Campanha…"
              />
              <datalist id="job-type-suggestions">
                {JOB_TYPE_SUGGESTIONS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </label>
            <label>
              Tamanho estimado
              <select value={briefing.job_size || ''} onChange={(e) => set('job_size', e.target.value)}>
                <option value="">Não definido</option>
                <option value="P">P — Pequeno</option>
                <option value="M">M — Médio</option>
                <option value="G">G — Grande</option>
              </select>
            </label>
            <label>
              Solicitante
              <input value={briefing.requester_name} onChange={(e) => set('requester_name', e.target.value)} />
            </label>
          </div>

          <h3>2. Contexto</h3>
          <label>
            O que motivou esse job? Oportunidade, urgência, sazonalidade, histórico relevante…
            <textarea value={briefing.context} onChange={(e) => set('context', e.target.value)} />
          </label>

          <h3>3. Objetivo</h3>
          <label>
            Objetivo principal e objetivos específicos
            <textarea value={briefing.objective} onChange={(e) => set('objective', e.target.value)} />
          </label>

          <h3>4. Público-alvo</h3>
          <label>
            Demográfico, comportamental, psicográfico e geográfico
            <textarea value={briefing.target_audience} onChange={(e) => set('target_audience', e.target.value)} />
          </label>

          <h3>5. Produto / Serviço</h3>
          <label>
            O que será divulgado, diferenciais, benefícios, oferta/condições
            <textarea value={briefing.product_service} onChange={(e) => set('product_service', e.target.value)} />
          </label>

          <h3>6. Mensagem e conceito</h3>
          <label>
            Mensagem principal
            <textarea value={briefing.key_message} onChange={(e) => set('key_message', e.target.value)} />
          </label>
          <label>
            Conceito criativo / tom de voz
            <textarea value={briefing.concept} onChange={(e) => set('concept', e.target.value)} placeholder="Se ainda não houver conceito definido, escreva: CONCEITO A DEFINIR" />
          </label>

          <h3>7. Escopo e entregáveis</h3>
          <label>
            Peças, quantidade, formatos, versões, adaptações
            <textarea value={briefing.scope} onChange={(e) => set('scope', e.target.value)} />
          </label>
          <div className="grid2">
            <label>
              Formato da peça (nomenclatura)
              <select value={briefing.piece_format} onChange={(e) => set('piece_format', e.target.value)}>
                <option value="EST">Estático (EST)</option>
                <option value="VID">Vídeo (VID)</option>
              </select>
            </label>
            <label>
              Número de peças
              <input
                type="number"
                min={1}
                value={briefing.piece_count}
                onChange={(e) => set('piece_count', Number(e.target.value))}
              />
            </label>
            {briefing.piece_format === 'VID' && (
              <label>
                Formato do vídeo
                <input
                  value={briefing.video_channel}
                  onChange={(e) => set('video_channel', e.target.value)}
                  list="video-channel-suggestions"
                  placeholder="ex: Feed, Reels, Stories…"
                />
                <datalist id="video-channel-suggestions">
                  {VIDEO_CHANNEL_SUGGESTIONS.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </label>
            )}
          </div>

          <h3>8. Canais</h3>
          <label>
            Onde a comunicação será veiculada (Instagram, site, e-mail, mídia paga, OOH…)
            <textarea value={briefing.channels} onChange={(e) => set('channels', e.target.value)} />
          </label>

          <h3>9. Referências</h3>
          <label>
            Links, materiais de inspiração, briefings anteriores — e o que exatamente chamou atenção em cada uma
            <textarea value={briefing.references_text} onChange={(e) => set('references_text', e.target.value)} />
          </label>

          <h3>10. Histórico</h3>
          <label>
            Campanhas/jobs anteriores, o que funcionou, aprendizados, restrições já conhecidas
            <textarea value={briefing.history_notes} onChange={(e) => set('history_notes', e.target.value)} />
          </label>

          <h3>11. Prazos</h3>
          <div className="grid2">
            <label>
              Início
              <input type="date" value={briefing.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </label>
            <label>
              Entrega final
              <input type="date" value={briefing.deadline} onChange={(e) => set('deadline', e.target.value)} />
            </label>
          </div>

          <h3>12. Orçamento</h3>
          <label>
            Verba disponível (deixe em branco e anote "A APURAR" se ainda não houver definição)
            <input value={briefing.budget} onChange={(e) => set('budget', e.target.value)} placeholder="ex: R$ 5.000 ou A APURAR" />
          </label>

          <h3>13. Do's &amp; Don'ts</h3>
          <label>
            Obrigatoriedades e restrições (palavras/imagens proibidas, cores, concorrentes que não podem ser citados…)
            <textarea value={briefing.dos_donts} onChange={(e) => set('dos_donts', e.target.value)} />
          </label>

          <h3>15. KPIs</h3>
          <label>
            Metas, KPIs e como o sucesso será medido
            <textarea value={briefing.kpis} onChange={(e) => set('kpis', e.target.value)} />
          </label>

          <h3>16. Pontos a apurar</h3>
          <label>
            O que ainda falta confirmar com o cliente (separe por criticidade quando possível: crítico, importante, recomendado)
            <textarea value={briefing.open_points} onChange={(e) => set('open_points', e.target.value)} />
          </label>
          <label>
            Observações gerais
            <textarea value={briefing.notes} onChange={(e) => set('notes', e.target.value)} />
          </label>

          {canWrite && (
            <button type="submit" disabled={saving}>
              {saving ? 'Salvando…' : isNew ? 'Criar briefing' : 'Salvar alterações'}
            </button>
          )}
          {error && <p className="error">{error}</p>}
        </fieldset>
      </form>

      {!isNew && (
        <div className="section">
          <h2>14. Aprovações — status do briefing</h2>
          {canWrite && (
            <div className="status-changer">
              <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <input
                placeholder="Nota sobre a mudança de status (opcional)"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
              <button type="button" onClick={handleStatusChange} disabled={changingStatus}>
                {changingStatus ? 'Atualizando…' : 'Atualizar status'}
              </button>
            </div>
          )}

          <ul className="timeline">
            {history.map((h) => (
              <li key={h.id} className="timeline__item">
                <div className="timeline__dot" />
                <div>
                  <div className="timeline__title">
                    {h.from_status ? (
                      <>
                        {STATUS_LABELS[h.from_status] || h.from_status} → <strong>{STATUS_LABELS[h.to_status] || h.to_status}</strong>
                      </>
                    ) : (
                      <>Briefing criado como <strong>{STATUS_LABELS[h.to_status] || h.to_status}</strong></>
                    )}
                  </div>
                  <div className="timeline__meta">
                    {formatDateTime(h.created_at)} · {h.changed_by_name || 'Sistema'}
                  </div>
                  {h.note && <div className="timeline__note">{h.note}</div>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
