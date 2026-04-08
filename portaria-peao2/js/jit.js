/**
 * PORTARIA PEÃO 2 — JIT ROTA PARANÁ
 * Tabela: portaria-peao2-jit
 * Depende: /conexao/config.js, /conexao/db.js, /js/ui.js
 */

const TABELA_PJ = 'portaria-peao2-jit';
let dadosPJGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('pj-placa').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') pjPesquisar();
    });
    document.getElementById('pj-rg').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') pjPesquisar();
    });
});

// ── 1. SALVAR ────────────────────────────────────────────────────────────────
async function pjSalvar() {
    const acesso = document.getElementById('pj-acesso').value;
    const dados = {
        nome:           document.getElementById('pj-nome').value.trim().toUpperCase(),
        rg:             document.getElementById('pj-rg').value.trim(),
        transportadora: document.getElementById('pj-transp').value.trim().toUpperCase(),
        placa:          document.getElementById('pj-placa').value.trim().toUpperCase(),
        carreta:        document.getElementById('pj-carreta').value.trim().toUpperCase(),
        acesso:         acesso
    };
    if (!dados.nome || !dados.rg || !dados.transportadora || !dados.placa || !dados.acesso) {
        return notify('Preencha todos os campos obrigatórios antes de salvar.', 'aviso');
    }
    const result = await dbSalvar(TABELA_PJ, dados);
    if (result && result.ok) {
        notify(`${acesso} registrada com sucesso!`, 'sucesso');
        limparCampos('tela-jit');
        document.getElementById('pj-acesso').selectedIndex = 0;
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 2. PESQUISAR por Placa ou RG ─────────────────────────────────────────────
async function pjPesquisar() {
    const placa = document.getElementById('pj-placa').value.trim().toUpperCase();
    const rg    = document.getElementById('pj-rg').value.trim();

    if (!placa && !rg) return notify('Digite a Placa ou RG para pesquisar.', 'aviso');

    const filtros = placa ? { placa } : { rg };
    const data = await dbBuscar(TABELA_PJ, filtros, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const u = data[0];
        document.getElementById('pj-nome').value  = u.nome           || '';
        document.getElementById('pj-rg').value    = u.rg             || '';
        document.getElementById('pj-transp').value = u.transportadora || '';
        document.getElementById('pj-placa').value  = u.placa          || '';
        document.getElementById('pj-carreta').value = u.carreta       || '';
        notify('Registro localizado!', 'sucesso');
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
    }
}

// ── 3. FILTRO / RELATÓRIO ─────────────────────────────────────────────────────
function pjAbrirFiltro() {
    document.getElementById('modal-pj').style.display = 'block';
}

function pjFecharFiltro() {
    pjLimparFiltro();
    document.getElementById('modal-pj').style.display = 'none';
}

function pjLimparFiltro() {
    document.getElementById('pj-f-inicio').value = '';
    document.getElementById('pj-f-fim').value    = '';
    document.getElementById('pj-f-busca').value  = '';
    document.querySelector('#pj-tabela tbody').innerHTML = '';
    dadosPJGlobal = [];
}

async function pjBuscarRelatorio() {
    const inicio = document.getElementById('pj-f-inicio').value;
    const fim    = document.getElementById('pj-f-fim').value;
    const busca  = document.getElementById('pj-f-busca').value.trim().toUpperCase();

    if (!inicio || !fim) return notify('Selecione o período.', 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };
    if (busca) filtros.placa_like = busca;

    const data = await dbBuscar(TABELA_PJ, filtros);
    if (data === null) return;

    if (data.length > 0) {
        dadosPJGlobal = data;
        _pjRenderizarTabela(data);
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
        document.querySelector('#pj-tabela tbody').innerHTML = '';
    }
}

function _formatarDataPJ(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function _pjRenderizarTabela(lista) {
    const tbody = document.querySelector('#pj-tabela tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';
        tr.innerHTML = `
            <td style="padding:7px 10px;">${_formatarDataPJ(item.data)}</td>
            <td style="padding:7px 10px;">${item.hora           || ''}</td>
            <td style="padding:7px 10px;">${item.nome           || ''}</td>
            <td style="padding:7px 10px;">${item.rg             || ''}</td>
            <td style="padding:7px 10px;">${item.transportadora || ''}</td>
            <td style="padding:7px 10px;">${item.placa          || ''}</td>
            <td style="padding:7px 10px;">${item.carreta        || ''}</td>
            <td style="padding:7px 10px; font-weight:700;">${item.acesso || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ── 4. EXPORTAR XLSX ─────────────────────────────────────────────────────────
function pjExportarXLSX() {
    if (dadosPJGlobal.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    const cabecalho = ['Data','Hora','Nome','RG','Transportadora','Placa','Carreta','Acesso'];
    const linhas = dadosPJGlobal.map(r => [
        _formatarDataPJ(r.data),
        r.hora           || '',
        r.nome           || '',
        String(r.rg      || ''),
        r.transportadora || '',
        r.placa          || '',
        r.carreta        || '',
        r.acesso         || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'JIT Paraná');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob  = new Blob([wbout], { type: 'application/octet-stream' });
    const link  = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'relatorio_peao2_jit.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
}
