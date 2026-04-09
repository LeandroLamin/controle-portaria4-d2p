/**
 * PORTARIA 02 — ACESSOS
 * Tabela: portaria-02-acessos
 * Depende: /conexao/config.js, /conexao/db.js, /js/ui.js
 */

const TABELA_ACS = 'portaria-02-acessos';
let dadosAcsGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('acs-cpf').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') acsPesquisar();
    });
    document.getElementById('acs-placa').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') acsPesquisar();
    });
});

// ── 1. REGISTRAR ENTRADA / SAÍDA ─────────────────────────────────────────────
async function acsRegistrar(acesso) {
    const agora  = new Date();
    const dados = {
        nome:    document.getElementById('acs-nome').value.trim().toUpperCase(),
        cpf:     document.getElementById('acs-cpf').value.trim(),
        empresa: document.getElementById('acs-empresa').value.trim().toUpperCase(),
        veiculo: document.getElementById('acs-veiculo').value.trim().toUpperCase(),
        placa:   document.getElementById('acs-placa').value.trim().toUpperCase(),
        motivo:  document.getElementById('acs-motivo').value,
        acesso:  acesso,
        data:    agora.toLocaleDateString('en-CA'),
        hora:    agora.toTimeString().slice(0, 8)
    };
    if (!dados.nome || !dados.cpf || !dados.empresa || !dados.veiculo || !dados.placa || !dados.motivo) {
        return notify('Preencha todos os campos antes de salvar.', 'aviso');
    }
    const result = await dbSalvar(TABELA_ACS, dados);
    if (result && result.ok) {
        notify(`${acesso} registrada com sucesso!`, 'sucesso');
        limparCampos('tela-acessos');
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 2. PESQUISAR por Placa ou CPF ────────────────────────────────────────────
async function acsPesquisar() {
    const placa = document.getElementById('acs-placa').value.trim().toUpperCase();
    const cpf   = document.getElementById('acs-cpf').value.trim();

    if (!placa && !cpf) return notify('Digite a Placa ou CPF para pesquisar.', 'aviso');

    const filtros = placa ? { placa } : { cpf };
    const data = await dbBuscar(TABELA_ACS, filtros, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const u = data[0];
        document.getElementById('acs-nome').value    = u.nome    || '';
        document.getElementById('acs-cpf').value     = u.cpf     || '';
        document.getElementById('acs-empresa').value = u.empresa || '';
        document.getElementById('acs-veiculo').value = u.veiculo || '';
        document.getElementById('acs-placa').value   = u.placa   || '';
        document.getElementById('acs-motivo').value  = u.motivo  || '';
        notify('Registro localizado!', 'sucesso');
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
    }
}

// ── 3. FILTRO / RELATÓRIO ─────────────────────────────────────────────────────
function acsAbrirFiltro() {
    document.getElementById('modal-acs').style.display = 'block';
}

function acsFecharFiltro() {
    acsLimparFiltro();
    document.getElementById('modal-acs').style.display = 'none';
}

function acsLimparFiltro() {
    document.getElementById('acs-f-inicio').value = '';
    document.getElementById('acs-f-fim').value    = '';
    document.getElementById('acs-f-busca').value  = '';
    document.querySelector('#acs-tabela tbody').innerHTML = '';
    dadosAcsGlobal = [];
}

async function acsBuscarRelatorio() {
    const inicio = document.getElementById('acs-f-inicio').value;
    const fim    = document.getElementById('acs-f-fim').value;
    const busca  = document.getElementById('acs-f-busca').value.trim().toUpperCase();

    if (!inicio || !fim) return notify('Selecione o período.', 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };
    if (busca) filtros.placa_like = busca;

    const data = await dbBuscar(TABELA_ACS, filtros);
    if (data === null) return;

    if (data.length > 0) {
        dadosAcsGlobal = data;
        _acsRenderizarTabela(data);
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
        document.querySelector('#acs-tabela tbody').innerHTML = '';
    }
}

function _formatarData(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function _acsRenderizarTabela(lista) {
    const tbody = document.querySelector('#acs-tabela tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';
        tr.innerHTML = `
            <td style="padding:7px 10px;">${_formatarData(item.data)}</td>
            <td style="padding:7px 10px;">${item.hora    || ''}</td>
            <td style="padding:7px 10px;">${item.nome    || ''}</td>
            <td style="padding:7px 10px;">${item.cpf     || ''}</td>
            <td style="padding:7px 10px;">${item.empresa || ''}</td>
            <td style="padding:7px 10px;">${item.veiculo || ''}</td>
            <td style="padding:7px 10px;">${item.placa   || ''}</td>
            <td style="padding:7px 10px;">${item.motivo  || ''}</td>
            <td style="padding:7px 10px; font-weight:700;">${item.acesso || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ── 4. EXPORTAR XLSX ─────────────────────────────────────────────────────────
function acsExportarXLSX() {
    if (dadosAcsGlobal.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    const cabecalho = ['Data','Hora','Nome','CPF','Empresa','Veículo','Placa','Motivo','Acesso'];
    const linhas = dadosAcsGlobal.map(r => [
        _formatarData(r.data),
        r.hora    || '',
        r.nome    || '',
        String(r.cpf     || ''),
        r.empresa || '',
        r.veiculo || '',
        r.placa   || '',
        r.motivo  || '',
        r.acesso  || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Acessos');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob  = new Blob([wbout], { type: 'application/octet-stream' });
    const link  = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'relatorio_p02_acessos.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
}
