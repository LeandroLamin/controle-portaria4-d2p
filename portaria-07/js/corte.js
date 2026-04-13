/**
 * PORTARIA 07 — SOLICITAÇÃO DE CORTE
 * Tabela: portaria-07-corte
 * Depende: /conexao/config.js, /conexao/db.js, /js/ui.js
 */

const TABELA_CORTE = 'portaria-07-corte';
let _cortePdfArquivo = null;
let dadosCorteGlobal = [];

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

    // Drag & drop na área de PDF
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

// ── 1. LOCALIZAR — puxa dados do cadastro de armários ────────────────────────
async function corteLocalizar() {
    const bpu     = document.getElementById('corte-bpu').value.trim();
    const armario = document.getElementById('corte-armario').value.trim().toUpperCase();

    if (!bpu && !armario) return notify('Digite o BPU ou Nº Armário para localizar.', 'aviso');

    const filtros = armario ? { armario } : { bpu };
    const data = await dbBuscar('portaria-07-armarios', filtros, { order: 'id.desc', limit: 1 });

    if (!data || data.length === 0) return notify('Titular não localizado no cadastro de armários.', 'aviso');

    const u = data[0];
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
    notify('Titular localizado!', 'sucesso');
}

// ── 2. ESTILO SITUAÇÃO ────────────────────────────────────────────────────────
function corteSituacaoStyle(sel) {
    const cores = {
        PENDENTE: { bg: '#fff8e1', border: '#f5c518', color: '#7a5a00' },
        APROVADO: { bg: '#e8f5e9', border: '#27ae60', color: '#1a6e3a' },
        NEGADO:   { bg: '#fdecea', border: '#e03030', color: '#8b1a1a' }
    };
    const c = cores[sel.value];
    if (c) {
        sel.style.background   = c.bg;
        sel.style.borderColor  = c.border;
        sel.style.color        = c.color;
    } else {
        sel.style.background  = '';
        sel.style.borderColor = '';
        sel.style.color       = '';
    }
}

// ── 3. SELECIONAR PDF ─────────────────────────────────────────────────────────
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
}

// ── 4. SALVAR ─────────────────────────────────────────────────────────────────
async function corteSalvar() {
    const agora  = new Date();
    const bpu     = document.getElementById('corte-bpu').value.trim();
    const armario = document.getElementById('corte-armario').value.trim().toUpperCase();
    const nome    = document.getElementById('corte-nome').value.trim();
    const motivo  = document.getElementById('corte-motivo').value;
    const situacao_corte = document.getElementById('corte-situacao').value;

    if (!bpu && !armario)  return notify('BPU ou Nº Armário é obrigatório.', 'aviso');
    if (!nome)              return notify('Localize o titular antes de salvar.', 'aviso');
    if (!motivo)            return notify('Selecione o Motivo do Corte.', 'aviso');
    if (!situacao_corte)    return notify('Selecione a Situação.', 'aviso');

    // Upload PDF (opcional)
    let pdf_url  = '';
    let pdf_nome = '';
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
        corteLimparTela();
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 5. UPLOAD PDF ─────────────────────────────────────────────────────────────
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
                _api_key:     N8N_API_KEY,
                bucket:       SUPABASE_BUCKET,
                nome,
                content_type: 'application/pdf',
                upsert:       true,
                dados:        base64
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

// ── 6. LIMPAR TELA ────────────────────────────────────────────────────────────
function corteLimparTela() {
    ['corte-bpu','corte-armario','corte-nome','corte-empresa','corte-setor',
     'corte-vestiario','corte-genero','corte-turno','corte-responsavel','corte-obs']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    ['corte-motivo','corte-situacao','corte-vigilante']
        .forEach(id => { const el = document.getElementById(id); if (el) el.selectedIndex = 0; });

    const sel = document.getElementById('corte-situacao');
    if (sel) { sel.style.background = ''; sel.style.borderColor = ''; sel.style.color = ''; }

    document.getElementById('corte-titular-box').style.display = 'none';

    // Reset PDF
    _cortePdfArquivo = null;
    document.getElementById('corte-pdf-input').value = '';
    const label = document.getElementById('corte-pdf-label');
    const area  = document.getElementById('corte-pdf-area');
    label.textContent = 'Clique para selecionar arquivo PDF';
    label.style.color = '';
    area.style.borderColor = '';
    area.style.background  = '#fafbfc';
}

// ── 7. RELATÓRIO ──────────────────────────────────────────────────────────────
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

// ── 8. BUSCAR RELATÓRIO ───────────────────────────────────────────────────────
async function corteBuscarRelatorio() {
    const inicio   = document.getElementById('corte-f-inicio').value;
    const fim      = document.getElementById('corte-f-fim').value;
    const busca    = document.getElementById('corte-f-busca').value.trim().toUpperCase();
    const situacao = document.getElementById('corte-f-situacao').value;

    if (!inicio || !fim) return notify('Selecione o período.', 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };
    if (situacao) filtros.situacao_corte = situacao;
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

// ── 9. RENDERIZAR TABELA ──────────────────────────────────────────────────────
function _corteFormatarData(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function _corteRenderizarTabela(lista) {
    const tbody = document.querySelector('#corte-tabela-resultados tbody');
    tbody.innerHTML = '';

    const coresSit = {
        PENDENTE: { color: '#7a5a00', bg: '#fff8e1' },
        APROVADO: { color: '#1a6e3a', bg: '#e8f5e9' },
        NEGADO:   { color: '#8b1a1a', bg: '#fdecea' }
    };

    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';

        const campos = [
            [_corteFormatarData(item.data), false, null],
            [item.hora          || '', false, null],
            [item.bpu           || '', false, null],
            [item.armario       || '', false, null],
            [item.nome          || '', false, null],
            [item.empresa       || '', false, null],
            [item.vestiario     || '', false, null],
            [item.motivo        || '', false, null],
            [item.situacao_corte|| '', true,  coresSit[item.situacao_corte] || null],
            [item.vigilante     || '', false, null],
            [item.obs           || '', false, null]
        ];

        campos.forEach(([val, bold, cor]) => {
            const td = document.createElement('td');
            td.style.padding = '7px 10px';
            if (bold) td.style.fontWeight = '700';
            if (cor)  { td.style.color = cor.color; td.style.background = cor.bg; }
            td.textContent = val;
            tr.appendChild(td);
        });

        // Coluna PDF
        const tdPdf = document.createElement('td');
        tdPdf.style.padding = '7px 10px';
        if (item.pdf_url) {
            const a = document.createElement('a');
            a.href   = item.pdf_url;
            a.target = '_blank';
            a.rel    = 'noopener';
            a.style.cssText = 'color:var(--teal-dk); font-weight:700; text-decoration:none; font-size:13px;';
            a.textContent = '📄 Ver';
            tdPdf.appendChild(a);
        }
        tr.appendChild(tdPdf);
        tbody.appendChild(tr);
    });
}

// ── 10. EXPORTAR XLSX ─────────────────────────────────────────────────────────
function corteExportarXLSX() {
    if (dadosCorteGlobal.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    const cab = ['Data','Hora','BPU','Nº Armário','Nome','Empresa','Vestiário','Motivo','Situação','Vigilante','OBS','PDF'];
    const linhas = dadosCorteGlobal.map(r => [
        _corteFormatarData(r.data),
        r.hora           || '',
        r.bpu            || '',
        r.armario        || '',
        r.nome           || '',
        r.empresa        || '',
        r.vestiario      || '',
        r.motivo         || '',
        r.situacao_corte || '',
        r.vigilante      || '',
        r.obs            || '',
        r.pdf_url        || ''
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
