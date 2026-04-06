/**
 * PORTARIA 02 — JIT (Rota Paraná)
 * Tabela: portaria-02-jit
 * Depende: /conexao/config.js, /conexao/db.js, /js/ui.js
 */

const TABELA_JIT = 'portaria-02-jit';
let dadosJitGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('jit-cpf').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') jitPesquisar();
    });
    document.getElementById('jit-placa').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') jitPesquisar();
    });
});

// ── 1. REGISTRAR ENTRADA / SAÍDA ─────────────────────────────────────────────
async function jitRegistrar(acesso) {
    const dados = {
        nome:           document.getElementById('jit-nome').value.trim().toUpperCase(),
        cpf:            document.getElementById('jit-cpf').value.trim(),
        empresa:        document.getElementById('jit-empresa').value.trim().toUpperCase(),
        placa:          document.getElementById('jit-placa').value.trim().toUpperCase(),
        carreta:        document.getElementById('jit-carreta').value.trim().toUpperCase(),
        transportadora: document.getElementById('jit-transportadora').value.trim().toUpperCase(),
        acesso:         acesso
    };
    if (!dados.nome || !dados.cpf || !dados.empresa || !dados.placa || !dados.carreta || !dados.transportadora) {
        return notify('Preencha todos os campos antes de salvar.', 'aviso');
    }
    const result = await dbSalvar(TABELA_JIT, dados);
    if (result && result.ok) {
        notify(`${acesso} registrada com sucesso!`, 'sucesso');
        limparCampos('tela-jit');
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 2. PESQUISAR por Placa ou CPF ─────────────────────────────────────────────
async function jitPesquisar() {
    const placa = document.getElementById('jit-placa').value.trim().toUpperCase();
    const cpf   = document.getElementById('jit-cpf').value.trim();

    if (!placa && !cpf) return notify('Digite a Placa ou CPF para pesquisar.', 'aviso');

    const filtros = placa ? { placa } : { cpf };
    const data = await dbBuscar(TABELA_JIT, filtros, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const u = data[0];
        document.getElementById('jit-nome').value           = u.nome           || '';
        document.getElementById('jit-cpf').value            = u.cpf            || '';
        document.getElementById('jit-empresa').value        = u.empresa        || '';
        document.getElementById('jit-placa').value          = u.placa          || '';
        document.getElementById('jit-carreta').value        = u.carreta        || '';
        document.getElementById('jit-transportadora').value = u.transportadora || '';
        notify('Registro localizado!', 'sucesso');
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
    }
}

// ── 3. FILTRO / RELATÓRIO ─────────────────────────────────────────────────────
function jitAbrirFiltro() {
    document.getElementById('modal-jit').style.display = 'block';
}

function jitFecharFiltro() {
    jitLimparFiltro();
    document.getElementById('modal-jit').style.display = 'none';
}

function jitLimparFiltro() {
    document.getElementById('jit-f-inicio').value = '';
    document.getElementById('jit-f-fim').value    = '';
    document.getElementById('jit-f-busca').value  = '';
    document.querySelector('#jit-tabela tbody').innerHTML = '';
    dadosJitGlobal = [];
}

async function jitBuscarRelatorio() {
    const inicio = document.getElementById('jit-f-inicio').value;
    const fim    = document.getElementById('jit-f-fim').value;
    const busca  = document.getElementById('jit-f-busca').value.trim().toUpperCase();

    if (!inicio || !fim) return notify('Selecione o período.', 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };
    if (busca) filtros.placa_like = busca;

    const data = await dbBuscar(TABELA_JIT, filtros);
    if (data === null) return;

    if (data.length > 0) {
        dadosJitGlobal = data;
        _jitRenderizarTabela(data);
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
        document.querySelector('#jit-tabela tbody').innerHTML = '';
    }
}

function _formatarData(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function _jitRenderizarTabela(lista) {
    const tbody = document.querySelector('#jit-tabela tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';
        tr.innerHTML = `
            <td style="padding:7px 10px;">${_formatarData(item.data)}</td>
            <td style="padding:7px 10px;">${item.hora           || ''}</td>
            <td style="padding:7px 10px;">${item.nome           || ''}</td>
            <td style="padding:7px 10px;">${item.cpf            || ''}</td>
            <td style="padding:7px 10px;">${item.empresa        || ''}</td>
            <td style="padding:7px 10px;">${item.placa          || ''}</td>
            <td style="padding:7px 10px;">${item.carreta        || '-'}</td>
            <td style="padding:7px 10px;">${item.transportadora || ''}</td>
            <td style="padding:7px 10px; font-weight:700;">${item.acesso || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ── 4. EXPORTAR XLSX ─────────────────────────────────────────────────────────
function jitExportarXLSX() {
    if (dadosJitGlobal.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    const cabecalho = ['Data','Hora','Nome','CPF','Empresa','Placa','Carreta','Transportadora','Acesso'];
    const linhas = dadosJitGlobal.map(r => [
        _formatarData(r.data),
        r.hora           || '',
        r.nome           || '',
        String(r.cpf     || ''),
        r.empresa        || '',
        r.placa          || '',
        r.carreta        || '',
        r.transportadora || '',
        r.acesso         || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'JIT');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob  = new Blob([wbout], { type: 'application/octet-stream' });
    const link  = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'relatorio_p02_jit.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
}
