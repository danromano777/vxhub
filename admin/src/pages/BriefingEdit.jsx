import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { buildNomenclature, slugify, suggestBrandCode } from '../lib/nomenclature.js';
import { buildBriefingText } from '../lib/briefingText.js';
import { JOB_TYPES, getJobTypeTier } from '../lib/jobTypes.js';
import { STATUS_LABELS, STATUS_ORDER, StatusBadge } from './Briefings.jsx';

const NEW_CLIENT_OPTION = '__new_client__';

const emptyBriefing = {
  brand_id: '', title: '', campaign_name: '', job_type: '', job_size: '', requester_name: '',
  context: '', objective: '', target_audience: '', product_service: '', key_message: '', concept: '',
  scope: '', channels: '', kpis: '', start_date: '', deadline: '', budget: '', dos_donts: '',
  references_text: '', history_notes: '', notes: '', open_points: '',
  piece_format: 'EST', piece_count: 1, video_channel: '',
};

const VIDEO_CHANNEL_SUGGESTIONS = ['Feed', 'Reels', 'Stories', 'TikTok', 'YouTube'];

const EXTRACT_MERGE_FIELDS = [
  'title', 'campaign_name', 'requester_name', 'context', 'objective', 'target_audience',
  'product_service', 'key_message', 'concept', 'scope', 'channels', 'references_text',
  'dos_donts', 'budget', 'kpis', 'history_notes', 'open_points', 'notes', 'start_date', 'deadline',
];

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('pt-BR');
}

function TypePicker({ onPick, onCancel }) {
  return (
    <div>
      {onCancel ? (
        <button type="button" className="backlink" onClick={onCancel}>
          ← Cancelar
        </button>
      ) : (
        <Link to="/" className="backlink">
          ← Voltar
        </Link>
      )}
      <div className="page__head">
        <h1>{onCancel ? 'Trocar tipo de briefing' : 'Novo briefing'}</h1>
      </div>
      <p className="hint" style={{ marginBottom: 18 }}>
        Escolha o tipo de job. Isso define quais campos o formulário vai pedir — jobs avulsos (post, vídeo, trinca,
        vaga) pedem só o essencial; KV e campanha pedem o briefing completo.
      </p>
      <div className="type-picker-grid">
        {JOB_TYPES.map((t) => (
          <button key={t.key} type="button" className="type-picker-card" onClick={() => onPick(t)}>
            <span className={`type-picker-card__tier type-picker-card__tier--${t.tier}`}>
              {t.tier === 'avulso' ? 'Job avulso' : 'Campanha'}
            </span>
            <span className="type-picker-card__label">{t.label}</span>
            <span className="type-picker-card__desc">{t.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BriefingEdit() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = user.role === 'admin' || user.role === 'editor';

  const [briefing, setBriefing] = useState(emptyBriefing);
  const [pickerOpen, setPickerOpen] = useState(isNew);
  const [history, setHistory] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedNom, setCopiedNom] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [statusDraft, setStatusDraft] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  const [addingBrand, setAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCode, setNewBrandCode] = useState('');
  const [newBrandCodeTouched, setNewBrandCodeTouched] = useState(false);
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractMessage, setExtractMessage] = useState('');
  const [extractError, setExtractError] = useState('');

  function load() {
    setPickerOpen(isNew);
    if (isNew) {
      setBriefing(emptyBriefing);
      return;
    }
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

  const tier = getJobTypeTier(briefing.job_type);
  const isCampanha = tier === 'campanha';
  const currentType = JOB_TYPES.find((t) => t.label === briefing.job_type);

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

  const briefingText = useMemo(
    () => buildBriefingText({ briefing, brandName: selectedBrand?.name, brandCode: selectedBrand?.code }),
    [briefing, selectedBrand]
  );

  useEffect(() => {
    if (!addingBrand || newBrandCodeTouched) return;
    setNewBrandCode(newBrandName.trim() ? suggestBrandCode(newBrandName, brands.map((b) => b.code)) : '');
  }, [newBrandName, addingBrand, newBrandCodeTouched, brands]);

  const newBrandCodeConflict =
    !!newBrandCode.trim() &&
    brands.some((b) => (b.code || '').toUpperCase() === newBrandCode.trim().toUpperCase());

  function set(field, value) {
    setBriefing((b) => ({ ...b, [field]: value }));
  }

  function handlePickType(type) {
    setBriefing((b) => ({
      ...b,
      job_type: type.label,
      piece_format: type.defaultFormat,
      piece_count: type.defaultCount,
    }));
    setPickerOpen(false);
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
      setCopiedNom(true);
      setTimeout(() => setCopiedNom(false), 1500);
    } catch {
      /* clipboard indisponível — ignora */
    }
  }

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(briefingText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 1500);
    } catch {
      /* clipboard indisponível — ignora */
    }
  }

  function closeAddBrand() {
    setAddingBrand(false);
    setNewBrandName('');
    setNewBrandCode('');
    setNewBrandCodeTouched(false);
  }

  async function handleCreateBrand() {
    const name = newBrandName.trim();
    const code = newBrandCode.trim().toUpperCase();
    if (!name || !code || newBrandCodeConflict) return;
    setCreatingBrand(true);
    setError('');
    try {
      const payload = {
        slug: slugify(name) || `cliente-${Date.now()}`,
        name,
        display_html: name,
        brand_group: 'Clientes VX',
        filter_key: 'briefing',
        description: '',
        code,
        briefing_only: true,
        sort_order: 0,
      };
      const r = await api.createBrand(payload);
      const updated = await api.listBrands();
      setBrands(updated);
      set('brand_id', String(r.id));
      closeAddBrand();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingBrand(false);
    }
  }

  function mergeExtractedFields(fields) {
    let filled = 0;
    setBriefing((b) => {
      const next = { ...b };
      EXTRACT_MERGE_FIELDS.forEach((key) => {
        const value = fields?.[key];
        if (!value || next[key]) return;
        next[key] = value;
        filled += 1;
      });
      return next;
    });
    setExtractMessage(
      filled > 0
        ? `${filled} campo${filled > 1 ? 's' : ''} preenchido${filled > 1 ? 's' : ''} automaticamente — revise antes de salvar.`
        : 'Não encontrei nenhuma informação nova pra preencher a partir desse material.'
    );
  }

  async function handleExtract() {
    if (!pasteText.trim()) return;
    setExtracting(true);
    setExtractError('');
    setExtractMessage('');
    try {
      const { fields } = await api.extractBriefingText(pasteText);
      mergeExtractedFields(fields);
    } catch (err) {
      setExtractError(err.message);
    } finally {
      setExtracting(false);
    }
  }

  async function handleExtractFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type.startsWith('video/')) {
      setExtractError('Vídeo ainda não é suportado — envie um áudio, imagem ou PDF.');
      setExtractMessage('');
      return;
    }
    setExtracting(true);
    setExtractError('');
    setExtractMessage('');
    try {
      if (file.type.startsWith('audio/')) {
        setExtractMessage('Transcrevendo áudio…');
        const { text } = await api.transcribeAudio(file);
        setPasteText(text);
        setExtractMessage('Áudio transcrito — extraindo campos…');
        const { fields } = await api.extractBriefingText(text);
        mergeExtractedFields(fields);
      } else {
        const { fields } = await api.extractBriefingFile(file);
        mergeExtractedFields(fields);
      }
    } catch (err) {
      setExtractError(err.message);
    } finally {
      setExtracting(false);
    }
  }

  if (loading) return <p className="loading">Carregando…</p>;
  if (pickerOpen) return <TypePicker onPick={handlePickType} onCancel={isNew ? undefined : () => setPickerOpen(false)} />;

  return (
    <div>
      <Link to="/" className="backlink">
        ← Voltar
      </Link>
      <div className="page__head">
        <h1>{isNew ? 'Novo briefing' : briefing.title}</h1>
        {!isNew && <StatusBadge status={statusDraft} />}
      </div>

      <div className="briefing-layout">
      <div className="briefing-main">
      <form onSubmit={handleSave} className="form">
        <fieldset disabled={!canWrite}>
          <div className="ai-extract-box">
            <span className="ai-extract-box__label">✨ Colar texto do cliente (WhatsApp, e-mail...)</span>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Cole aqui o pedido que o cliente mandou — a IA preenche os campos vazios do formulário abaixo."
              rows={4}
            />
            <div className="ai-extract-box__actions">
              <button type="button" className="btn" onClick={handleExtract} disabled={!pasteText.trim() || extracting}>
                {extracting ? 'Lendo…' : 'Extrair texto colado'}
              </button>
              <span className="ai-extract-box__or">ou</span>
              <label className="ghost-btn ai-extract-box__upload">
                {extracting ? 'Lendo…' : '📎 Enviar arquivo'}
                <input
                  type="file"
                  hidden
                  accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,audio/*"
                  onChange={handleExtractFile}
                  disabled={extracting}
                />
              </label>
              {extractMessage && <span className="ai-extract-box__msg">{extractMessage}</span>}
            </div>
            <p className="hint">
              Aceita print de conversa, PDF do pedido, imagem ou áudio (transcrito automaticamente antes de extrair).
            </p>
            {extractError && <p className="error">{extractError}</p>}
          </div>

          <h3>Identificação</h3>
          <div className="type-chip-row">
            <span className={`type-chip type-chip--${tier}`}>
              {currentType ? currentType.label : briefing.job_type || 'Sem tipo'}
            </span>
            {canWrite && (
              <button type="button" className="link-btn" onClick={() => setPickerOpen(true)}>
                Trocar tipo
              </button>
            )}
          </div>
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
              <select
                value={briefing.brand_id || ''}
                onChange={(e) => {
                  if (e.target.value === NEW_CLIENT_OPTION) {
                    setAddingBrand(true);
                    return;
                  }
                  set('brand_id', e.target.value);
                }}
              >
                <option value="">Sem cliente vinculado</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.code ? ` [${b.code}]` : ''}
                  </option>
                ))}
                <option value={NEW_CLIENT_OPTION}>+ Adicionar cliente…</option>
              </select>
            </label>
            {addingBrand && (
              <div className="quick-add-brand">
                <input
                  autoFocus
                  placeholder="Nome do novo cliente"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateBrand();
                    }
                  }}
                />
                <input
                  className="quick-add-brand__code-input"
                  value={newBrandCode}
                  onChange={(e) => {
                    setNewBrandCodeTouched(true);
                    setNewBrandCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateBrand();
                    }
                  }}
                  placeholder="SIGLA"
                  title="Sigla usada na nomenclatura do card/arquivo"
                />
                <button
                  type="button"
                  onClick={handleCreateBrand}
                  disabled={!newBrandName.trim() || !newBrandCode.trim() || newBrandCodeConflict || creatingBrand}
                >
                  {creatingBrand ? 'Criando…' : 'Criar'}
                </button>
                <button type="button" onClick={closeAddBrand}>
                  Cancelar
                </button>
                {newBrandCodeConflict && <p className="hint quick-add-brand__error">Essa sigla já está em uso por outro cliente.</p>}
              </div>
            )}
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

          {isCampanha && (
            <>
              <h3>Contexto</h3>
              <label>
                O que motivou esse job? Oportunidade, urgência, sazonalidade, histórico relevante…
                <textarea value={briefing.context} onChange={(e) => set('context', e.target.value)} />
              </label>
            </>
          )}

          <h3>Objetivo</h3>
          <label>
            Objetivo principal e objetivos específicos
            <textarea value={briefing.objective} onChange={(e) => set('objective', e.target.value)} />
          </label>

          <h3>Público-alvo</h3>
          <label>
            {isCampanha
              ? 'Demográfico, comportamental, psicográfico e geográfico'
              : 'Pra quem é essa peça'}
            <textarea value={briefing.target_audience} onChange={(e) => set('target_audience', e.target.value)} />
          </label>

          {isCampanha && (
            <>
              <h3>Produto / Serviço</h3>
              <label>
                O que será divulgado, diferenciais, benefícios, oferta/condições
                <textarea value={briefing.product_service} onChange={(e) => set('product_service', e.target.value)} />
              </label>
            </>
          )}

          <h3>Mensagem{isCampanha ? ' e conceito' : ''}</h3>
          <label>
            Mensagem principal
            <textarea value={briefing.key_message} onChange={(e) => set('key_message', e.target.value)} />
          </label>
          {isCampanha && (
            <label>
              Conceito criativo / tom de voz
              <textarea value={briefing.concept} onChange={(e) => set('concept', e.target.value)} placeholder="Se ainda não houver conceito definido, escreva: CONCEITO A DEFINIR" />
            </label>
          )}

          <h3>Escopo e entregáveis</h3>
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

          {isCampanha && (
            <>
              <h3>Canais</h3>
              <label>
                Onde a comunicação será veiculada (Instagram, site, e-mail, mídia paga, OOH…)
                <textarea value={briefing.channels} onChange={(e) => set('channels', e.target.value)} />
              </label>
            </>
          )}

          <h3>Referências</h3>
          <label>
            Links, materiais de inspiração, briefings anteriores — e o que exatamente chamou atenção em cada uma
            <textarea value={briefing.references_text} onChange={(e) => set('references_text', e.target.value)} />
          </label>

          {isCampanha && (
            <>
              <h3>Histórico</h3>
              <label>
                Campanhas/jobs anteriores, o que funcionou, aprendizados, restrições já conhecidas
                <textarea value={briefing.history_notes} onChange={(e) => set('history_notes', e.target.value)} />
              </label>
            </>
          )}

          <h3>Prazo{isCampanha ? 's' : ''}</h3>
          <div className="grid2">
            {isCampanha && (
              <label>
                Início
                <input type="date" value={briefing.start_date} onChange={(e) => set('start_date', e.target.value)} />
              </label>
            )}
            <label>
              Entrega final
              <input type="date" value={briefing.deadline} onChange={(e) => set('deadline', e.target.value)} />
            </label>
          </div>

          {isCampanha && (
            <>
              <h3>Orçamento</h3>
              <label>
                Verba disponível (deixe em branco e anote "A APURAR" se ainda não houver definição)
                <input value={briefing.budget} onChange={(e) => set('budget', e.target.value)} placeholder="ex: R$ 5.000 ou A APURAR" />
              </label>
            </>
          )}

          <h3>Do's &amp; Don'ts</h3>
          <label>
            Obrigatoriedades e restrições (palavras/imagens proibidas, cores, concorrentes que não podem ser citados…)
            <textarea value={briefing.dos_donts} onChange={(e) => set('dos_donts', e.target.value)} />
          </label>

          {isCampanha && (
            <>
              <h3>KPIs</h3>
              <label>
                Metas, KPIs e como o sucesso será medido
                <textarea value={briefing.kpis} onChange={(e) => set('kpis', e.target.value)} />
              </label>
            </>
          )}

          <h3>Pontos a apurar</h3>
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
          <h2>Aprovações — status do briefing</h2>
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

      <aside className="briefing-side">
        <div className="copy-panel">
          <span className="copy-panel__label">Nome do card/arquivo</span>
          <code className="copy-panel__code">{nomenclature}</code>
          <button type="button" className="ghost-btn" onClick={handleCopyNomenclature}>
            {copiedNom ? 'Copiado!' : 'Copiar nome'}
          </button>
          {!selectedBrand?.code && (
            <p className="hint">
              Selecione um cliente com sigla cadastrada (ou adicione a sigla em Clientes → Editar) para gerar a
              nomenclatura completa.
            </p>
          )}
        </div>

        <div className="copy-panel">
          <span className="copy-panel__label">Briefing para colar no Trello</span>
          <textarea className="copy-panel__text" value={briefingText} readOnly rows={18} />
          <button type="button" className="btn" onClick={handleCopyText}>
            {copiedText ? 'Copiado!' : 'Copiar briefing'}
          </button>
          <p className="hint">
            Atualiza sozinho conforme você preenche o formulário — social ou atendimento só cola direto na descrição
            do card.
          </p>
        </div>
      </aside>
      </div>
    </div>
  );
}
