/**
 * PORTARIA 07 — SOLICITAÇÃO DE CORTE
 * Tabela: portaria-07-corte
 * Depende: /conexao/config.js, /conexao/db.js, /js/ui.js
 */

const TABELA_CORTE = 'portaria-07-corte';
let _cortePdfArquivo  = null;
let _corteHistAtivo   = null; // row element selecionado no histórico
let dadosCorteGlobal  = [];

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    ['corte-bpu', 'corte-armario'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', e => {
            if (e.key === 'Enter') corteLocalizar();
        });
    });

    const fileInput = document.getElementById('corte-pdf-input');
    if (fileInput) fileInput.addEventListener('change', e => {
        if (e.target.files[0]) _corteSelecionarPdf(e.target.files[0]);
    });

    const area = document.getElementById('corte-pdf-area');
    if (area) {
        area.addEventListener('dragover', e => {
            e.preventDefault();
            area.style.borderColor = 'var(--teal)';
            area.style.background  = 'var(--teal-lt)';
        });
        area.addEventListener('dragleave', () => {
            if (!_cortePdfArquivo) {
                area.style.borderColor = '';
                area.style.background  = '#fafbfc';
            }
        });
        area.addEventListener('drop', e => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) _corteSelecionarPdf(f);
        });
    }
});

// ── 1. LOCALIZAR ──────────────────────────────────────────────────────────────
async function corteLocalizar() {
    const bpu     = document.getElementById('corte-bpu').value.trim();
    const armario = document.getElementById('corte-armario').value.trim().toUpperCase();

    if (!bpu && !armario) return notify('Digite o BPU ou Nº Armário para localizar.', 'aviso');

    const filtros = armario ? { armario } : { bpu };

    // Busca em paralelo: cadastro de armários + histórico de cortes
    const [dadosArm, dadosHist] = await Promise.all([
        dbBuscar('portaria-07-armarios', filtros, { order: 'id.desc', limit: 1 }),
        dbBuscar(TABELA_CORTE, filtros, { order: 'id.desc' })
    ]);

    if (!dadosArm || dadosArm.length === 0)
        return notify('Titular não localizado no cadastro de armários.', 'aviso');

    const u = dadosArm[0];
    document.getElementById('corte-bpu').value         = u.bpu         || bpu;
    document.getElementById('corte-armario').value     = u.armario     || armario;
    document.getElementById('corte-nome').value        = u.nome        || '';
    document.getElementById('corte-empresa').value     = u.empresa     || '';
    document.getElementById('corte-setor').value       = u.setor       || '';
    document.getElementById('corte-vestiario').value   = u.vestiario   || '';
    document.getElementById('corte-genero').value      = u.genero      || '';
    document.getElementById('corte-turno').value       = u.turno       || '';
    document.getElementById('corte-responsavel').value = u.responsavel || '';

    document.getElementById('corte-titular-box').style.display = 'block';

    _corteCarregarHistorico(dadosHist || []);
    notify('Titular localizado!', 'sucesso');
}

// ── 2. HISTÓRICO ──────────────────────────────────────────────────────────────
const _CORES_SIT = {
    PENDENTE: { bg: '#fff8e1', color: '#7a5a00', border: '#f5c518' },
    APROVADO: { bg: '#e8f5e9', color: '#1a6e3a', border: '#27ae60' },
    NEGADO:   { bg: '#fdecea', color: '#8b1a1a', border: '#e03030' }
};

function _corteCarregarHistorico(lista) {
    const container = document.getElementById('corte-hist-lista');
    const vazio     = document.getElementById('corte-hist-vazio');
    const count     = document.getElementById('corte-hist-count');
    _corteHistAtivo = null;
    container.innerHTML = '';

    if (!lista || lista.length === 0) {
        container.style.display = 'none';
        vazio.style.display     = 'block';
        count.textContent       = '';
        return;
    }

    vazio.style.display     = 'none';
    container.style.display = 'flex';
    count.textContent       = `(${lista.length})`;

    lista.forEach(item => {
        const sit  = item.situacao_corte || '';
        const cor  = _CORES_SIT[sit] || { bg: '#f0f2f5', color: '#4a6070', border: '#d0d8e0' };
        const data = _corteFormatarData(item.data);

        const card = document.createElement('div');
        card.style.cssText = `border:1.5px solid ${cor.border}; border-radius:8px; padding:10px 12px; cursor:pointer; background:#fff; transition:all .15s; flex-shrink:0;`;

        card.addEventListener('mouseover', () => {
            if (card !== _corteHistAtivo) card.style.background = '#f0f6f5';
        });
        card.addEventListener('mouseout', () => {
            if (card !== _corteHistAtivo) card.style.background = '#fff';
        });
        card.addEventListener('click', () => _corteSelecionarHistorico(card, item));

        // Linha 1: data + badge situação
        const linha1 = document.createElement('div');
        linha1.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;';

        const dataSpan = document.createElement('span');
        dataSpan.style.cssText = 'font-size:11px; color:var(--label);';
        dataSpan.textContent = `${data}${item.hora ? ' — ' + item.hora.slice(0,5) : ''}`;

        const badge = document.createElement('span');
        badge.style.cssText = `font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px; background:${cor.bg}; color:${cor.color};`;
        badge.textContent = sit || '—';

        linha1.appendChild(dataSpan);
        linha1.appendChild(badge);

        // Linha 2: motivo
        const motivo = document.createElement('div');
        motivo.style.cssText = 'font-size:12px; font-weight:700; color:var(--text);';
        motivo.textContent = item.motivo || '—';

        // Linha 3: vigilante + PDF indicator
        const linha3 = document.createElement('div');
        linha3.style.cssText = 'font-size:11px; color:#aaa; margin-top:3px; display:flex; justify-content:space-between;';

        const vigSpan = document.createElement('span');
        vigSpan.textContent = item.vigilante || '';

        const pdfSpan = document.createElement('span');
        if (item.pdf_url) {
            pdfSpan.textContent = '📄 PDF';
            pdfSpan.style.color = 'var(--teal-dk)';
            pdfSpan.style.fontWeight = '600';
        }

        linha3.appendChild(vigSpan);
        linha3.appendChild(pdfSpan);

        card.appendChild(linha1);
        card.appendChild(motivo);
        card.appendChild(linha3);
        container.appendChild(card);
    });
}

function _corteSelecionarHistorico(card, item) {
    // Deseleciona anterior
    if (_corteHistAtivo) {
        _corteHistAtivo.style.background = '#fff';
        _corteHistAtivo.style.boxShadow  = '';
    }
    _corteHistAtivo = card;
    card.style.background = '#e8f5f3';
    card.style.boxShadow  = '0 2px 8px rgba(26,138,122,.2)';

    // Preenche campos da solicitação
    document.getElementById('corte-motivo').value   = item.motivo         || '';
    document.getElementById('corte-vigilante').value = item.vigilante     || '';
    document.getElementById('corte-obs').value       = item.obs           || '';
    const sel = document.getElementById('corte-situacao');
    sel.value = item.situacao_corte || '';
    corteSituacaoStyle(sel);

    // Carrega PDF no viewer
    if (item.pdf_url) {
        _corteAtualizarViewer(item.pdf_url);
    } else {
        corteViewerFechar();
    }
}

// ── 3. PDF VIEWER ─────────────────────────────────────────────────────────────
function _corteAtualizarViewer(url) {
    document.getElementById('corte-viewer-placeholder').style.display = 'none';
    document.getElementById('corte-pdf-viewer').style.display         = 'block';
    document.getElementById('corte-viewer-acoes').style.display       = 'flex';
    document.getElementById('corte-pdf-viewer').src                   = url;
    document.getElementById('corte-viewer-link').href                 = url;
}

function corteViewerFechar() {
    document.getElementById('corte-viewer-placeholder').style.display = 'block';
    document.getElementById('corte-pdf-viewer').style.display         = 'none';
    document.getElementById('corte-viewer-acoes').style.display       = 'none';
    document.getElementById('corte-pdf-viewer').src                   = '';
    document.getElementById('corte-viewer-link').href                 = '#';
}

// ── 4. ESTILO SITUAÇÃO ────────────────────────────────────────────────────────
function corteSituacaoStyle(sel) {
    const c = _CORES_SIT[sel.value];
    if (c) {
        sel.style.background  = c.bg;
        sel.style.borderColor = c.border;
        sel.style.color       = c.color;
    } else {
        sel.style.background  = '';
        sel.style.borderColor = '';
        sel.style.color       = '';
    }
}

// ── 5. SELECIONAR PDF (upload) ────────────────────────────────────────────────
function _corteSelecionarPdf(file) {
    if (!file.name.toLowerCase().endsWith('.pdf')) return notify('Selecione apenas arquivos .PDF.', 'aviso');
    if (file.size > 10 * 1024 * 1024) return notify('Arquivo muito grande. Máximo 10 MB.', 'aviso');

    _cortePdfArquivo = file;
    const label = document.getElementById('corte-pdf-label');
    const area  = document.getElementById('corte-pdf-area');
    label.textContent  = '✓ ' + file.name;
    label.style.color  = '#27ae60';
    area.style.borderColor = '#27ae60';
    area.style.background  = '#e8f5e9';

    // Preview imediato no viewer
    _corteAtualizarViewer(URL.createObjectURL(file));
}

// ── 6. SALVAR ─────────────────────────────────────────────────────────────────
async function corteSalvar() {
    const agora  = new Date();
    const bpu          = document.getElementById('corte-bpu').value.trim();
    const armario      = document.getElementById('corte-armario').value.trim().toUpperCase();
    const nome         = document.getElementById('corte-nome').value.trim();
    const motivo       = document.getElementById('corte-motivo').value;
    const situacao_corte = document.getElementById('corte-situacao').value;

    if (!bpu && !armario)  return notify('BPU ou Nº Armário é obrigatório.', 'aviso');
    if (!nome)              return notify('Localize o titular antes de salvar.', 'aviso');
    if (!motivo)            return notify('Selecione o Motivo do Corte.', 'aviso');
    if (!situacao_corte)    return notify('Selecione a Situação.', 'aviso');

    let pdf_url = '', pdf_nome = '';
    if (_cortePdfArquivo) {
        const res = await _corteUploadPdf(_cortePdfArquivo, bpu || armario, agora);
        if (!res) return;
        pdf_url  = res.url;
        pdf_nome = res.nome;
    }

    const dados = {
        data:         agora.toLocaleDateString('en-CA'),
        hora:         agora.toTimeString().slice(0, 8),
        bpu,
        armario,
        nome,
        empresa:      document.getElementById('corte-empresa').value.trim().toUpperCase(),
        setor:        document.getElementById('corte-setor').value.trim().toUpperCase(),
        vestiario:    document.getElementById('corte-vestiario').value,
        genero:       document.getElementById('corte-genero').value,
        turno:        document.getElementById('corte-turno').value.trim().toUpperCase(),
        responsavel:  document.getElementById('corte-responsavel').value.trim().toUpperCase(),
        motivo,
        situacao_corte,
        vigilante:    document.getElementById('corte-vigilante').value,
        obs:          document.getElementById('corte-obs').value.trim().toUpperCase(),
        pdf_nome,
        pdf_url
    };

    const result = await dbSalvar(TABELA_CORTE, dados);
    if (result && result.ok) {
        notify('Solicitação de corte registrada com sucesso!', 'sucesso');
        // Recarrega histórico após salvar
        const filtros = dados.armario ? { armario: dados.armario } : { bpu: dados.bpu };
        const hist = await dbBuscar(TABELA_CORTE, filtros, { order: 'id.desc' });
        _corteCarregarHistorico(hist || []);
        // Mantém PDF no viewer se foi enviado
        if (pdf_url) _corteAtualizarViewer(pdf_url);
        // Limpa apenas os campos da solicitação e o upload
        document.getElementById('corte-motivo').value    = '';
        document.getElementById('corte-situacao').value  = '';
        corteSituacaoStyle(document.getElementById('corte-situacao'));
        document.getElementById('corte-vigilante').value = '';
        document.getElementById('corte-obs').value       = '';
        _corteLimparUpload();
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 7. UPLOAD PDF ─────────────────────────────────────────────────────────────
async function _corteUploadPdf(file, identificador, agora) {
    const nome = `corte-${identificador}-${agora.getTime()}.pdf`;
    const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = e => resolve(e.target.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
    try {
        const resp = await fetch(`${N8N_URL}/storage-upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                _api_key: N8N_API_KEY, bucket: SUPABASE_BUCKET,
                nome, content_type: 'application/pdf', upsert: true, dados: base64
            })
        });
        const json = await resp.json();
        if (json.ok) {
            return {
                url:  SUPABASE_URL + '/storage/v1/object/public/' + SUPABASE_BUCKET + '/' + nome,
                nome: file.name
            };
        }
        notify('Erro ao enviar PDF: ' + (json.error || 'falha'), 'erro');
        return null;
    } catch (e) {
        notify('Erro de conexão ao enviar PDF.', 'erro');
        return null;
    }
}

// ── 8. LIMPAR ─────────────────────────────────────────────────────────────────
function _corteLimparUpload() {
    _cortePdfArquivo = null;
    document.getElementById('corte-pdf-input').value = '';
    const label = document.getElementById('corte-pdf-label');
    const area  = document.getElementById('corte-pdf-area');
    label.textContent  = 'Clique para selecionar arquivo PDF';
    label.style.color  = '';
    area.style.borderColor = '';
    area.style.background  = '#fafbfc';
}

function corteLimparTela() {
    ['corte-bpu','corte-armario','corte-nome','corte-empresa','corte-setor',
     'corte-vestiario','corte-genero','corte-turno','corte-responsavel','corte-obs']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    ['corte-motivo','corte-situacao','corte-vigilante']
        .forEach(id => { const el = document.getElementById(id); if (el) el.selectedIndex = 0; });

    corteSituacaoStyle(document.getElementById('corte-situacao'));
    document.getElementById('corte-titular-box').style.display = 'none';
    _corteLimparUpload();
    corteViewerFechar();

    // Reseta histórico
    document.getElementById('corte-hist-lista').innerHTML = '';
    document.getElementById('corte-hist-lista').style.display = 'none';
    document.getElementById('corte-hist-vazio').style.display = 'block';
    document.getElementById('corte-hist-count').textContent   = '';
    _corteHistAtivo = null;
}

// ── 9. RELATÓRIO ──────────────────────────────────────────────────────────────
function corteAbrirRelatorio() {
    document.getElementById('modal-corte').style.display = 'block';
    const hoje = new Date().toLocaleDateString('en-CA');
    if (!document.getElementById('corte-f-inicio').value) document.getElementById('corte-f-inicio').value = hoje;
    if (!document.getElementById('corte-f-fim').value)    document.getElementById('corte-f-fim').value    = hoje;
}

function corteFecharRelatorio() {
    corteLimparFiltro();
    document.getElementById('modal-corte').style.display = 'none';
}

function corteLimparFiltro() {
    document.getElementById('corte-f-inicio').value = '';
    document.getElementById('corte-f-fim').value    = '';
    document.getElementById('corte-f-busca').value  = '';
    document.getElementById('corte-f-situacao').selectedIndex = 0;
    document.querySelector('#corte-tabela-resultados tbody').innerHTML = '';
    dadosCorteGlobal = [];
}

async function corteBuscarRelatorio() {
    const inicio   = document.getElementById('corte-f-inicio').value;
    const fim      = document.getElementById('corte-f-fim').value;
    const busca    = document.getElementById('corte-f-busca').value.trim().toUpperCase();
    const vestiario = document.getElementById('corte-f-situacao').value;

    if (!inicio || !fim) return notify('Selecione o período.', 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };
    if (vestiario) filtros.vestiario = vestiario;
    if (busca) {
        if (/^\d+$/.test(busca)) filtros.bpu = busca;
        else filtros.nome_like = busca;
    }

    const data = await dbBuscar(TABELA_CORTE, filtros, { order: 'id.desc' });
    if (data === null) return;

    if (data.length > 0) {
        dadosCorteGlobal = data;
        _corteRenderizarTabela(data);
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
        document.querySelector('#corte-tabela-resultados tbody').innerHTML = '';
    }
}

// ── 10. TABELA RELATÓRIO ──────────────────────────────────────────────────────
function _corteFormatarData(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function _corteRenderizarTabela(lista) {
    const tbody = document.querySelector('#corte-tabela-resultados tbody');
    tbody.innerHTML = '';

    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';

        const sit = item.situacao_corte || '';
        const cor = _CORES_SIT[sit] || null;

        [
            [_corteFormatarData(item.data), false, null],
            [item.hora          || '', false, null],
            [item.bpu           || '', false, null],
            [item.armario       || '', false, null],
            [item.nome          || '', false, null],
            [item.empresa       || '', false, null],
            [item.vestiario     || '', false, null],
            [item.motivo        || '', false, null],
            [sit,                  true,  cor],
            [item.vigilante     || '', false, null],
            [item.obs           || '', false, null]
        ].forEach(([val, bold, c]) => {
            const td = document.createElement('td');
            td.style.padding = '7px 10px';
            if (bold) td.style.fontWeight = '700';
            if (c)    { td.style.color = c.color; td.style.background = c.bg; }
            td.textContent = val;
            tr.appendChild(td);
        });

        const tdPdf = document.createElement('td');
        tdPdf.style.padding = '7px 10px';
        if (item.pdf_url) {
            const a = document.createElement('a');
            a.href        = item.pdf_url;
            a.target      = '_blank';
            a.rel         = 'noopener';
            a.style.cssText = 'color:var(--teal-dk); font-weight:700; text-decoration:none;';
            a.textContent = '📄 Ver';
            tdPdf.appendChild(a);
        }
        tr.appendChild(tdPdf);
        tbody.appendChild(tr);
    });
}

// ── 11. EXPORTAR XLSX ─────────────────────────────────────────────────────────
function corteExportarXLSX() {
    if (dadosCorteGlobal.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    const cab = ['Data','Hora','BPU','Nº Armário','Nome','Empresa','Vestiário','Motivo','Situação','Vigilante','OBS','PDF'];
    const linhas = dadosCorteGlobal.map(r => [
        _corteFormatarData(r.data), r.hora||'', r.bpu||'', r.armario||'',
        r.nome||'', r.empresa||'', r.vestiario||'', r.motivo||'',
        r.situacao_corte||'', r.vigilante||'', r.obs||'', r.pdf_url||''
    ]);

    const ws  = XLSX.utils.aoa_to_sheet([cab, ...linhas]);
    const wb  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Corte');
    const out  = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([out], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'relatorio_p07_corte.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
}
