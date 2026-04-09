/**
 * PORTARIA PEÃO 2 — ACESSOS (Coleta / Entrega)
 * Tabela: portaria-peao2-acessos
 * Depende: /conexao/config.js, /conexao/db.js, /js/ui.js
 */

const TABELA_PA = 'portaria-peao2-acessos';
let dadosPAGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('pa-placa').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') paPesquisar();
    });
    document.getElementById('pa-cpf').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') paPesquisar();
    });
});

// ── 1. SALVAR ────────────────────────────────────────────────────────────────
async function paSalvar() {
    const acesso = document.getElementById('pa-acesso').value;
    const agora  = new Date();
    const dados = {
        nome:    document.getElementById('pa-nome').value.trim().toUpperCase(),
        cpf:      document.getElementById('pa-cpf').value.trim(),
        empresa: document.getElementById('pa-empresa').value.trim().toUpperCase(),
        cavalo:  document.getElementById('pa-cavalo').value.trim().toUpperCase(),
        placa:   document.getElementById('pa-placa').value.trim().toUpperCase(),
        carreta: document.getElementById('pa-carreta').value.trim().toUpperCase(),
        motivo:  document.getElementById('pa-motivo').value,
        acesso:  acesso,
        data:    agora.toISOString().split('T')[0],
        hora:    agora.toTimeString().split(' ')[0]
    };
    if (!dados.nome || !dados.cpf || !dados.empresa || !dados.placa || !dados.motivo || !dados.acesso) {
        return notify('Preencha todos os campos obrigatórios antes de salvar.', 'aviso');
    }
    const result = await dbSalvar(TABELA_PA, dados);
    if (result && result.ok) {
        notify(`${acesso} registrada com sucesso!`, 'sucesso');
        limparCampos('tela-acessos');
        document.getElementById('pa-acesso').selectedIndex = 0;
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 2. PESQUISAR por Placa ou CPF ────────────────────────────────────────────
async function paPesquisar() {
    const placa = document.getElementById('pa-placa').value.trim().toUpperCase();
    const cpf    = document.getElementById('pa-cpf').value.trim();

    if (!placa && !cpf) return notify('Digite a Placa ou CPF para pesquisar.', 'aviso');

    const filtros = placa ? { placa } : { cpf };
    const data = await dbBuscar(TABELA_PA, filtros, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const u = data[0];
        document.getElementById('pa-nome').value    = u.nome    || '';
        document.getElementById('pa-cpf').value      = u.cpf      || '';
        document.getElementById('pa-empresa').value = u.empresa || '';
        document.getElementById('pa-cavalo').value  = u.cavalo  || '';
        document.getElementById('pa-placa').value   = u.placa   || '';
        document.getElementById('pa-carreta').value = u.carreta || '';
        document.getElementById('pa-motivo').value  = u.motivo  || '';
        notify('Registro localizado!', 'sucesso');
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
    }
}

// ── 3. FILTRO / RELATÓRIO ─────────────────────────────────────────────────────
function paAbrirFiltro() {
    document.getElementById('modal-pa').style.display = 'block';
}

function paFecharFiltro() {
    paLimparFiltro();
    document.getElementById('modal-pa').style.display = 'none';
}

function paLimparFiltro() {
    document.getElementById('pa-f-inicio').value = '';
    document.getElementById('pa-f-fim').value    = '';
    document.getElementById('pa-f-busca').value  = '';
    document.querySelector('#pa-tabela tbody').innerHTML = '';
    dadosPAGlobal = [];
}

async function paBuscarRelatorio() {
    const inicio = document.getElementById('pa-f-inicio').value;
    const fim    = document.getElementById('pa-f-fim').value;
    const busca  = document.getElementById('pa-f-busca').value.trim().toUpperCase();

    if (!inicio || !fim) return notify('Selecione o período.', 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };
    if (busca) filtros.placa_like = busca;

    const data = await dbBuscar(TABELA_PA, filtros);
    if (data === null) return;

    if (data.length > 0) {
        dadosPAGlobal = data;
        _paRenderizarTabela(data);
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
        document.querySelector('#pa-tabela tbody').innerHTML = '';
    }
}

function _formatarDataPA(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function _paRenderizarTabela(lista) {
    const tbody = document.querySelector('#pa-tabela tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';
        tr.innerHTML = `
            <td style="padding:7px 10px;">${_formatarDataPA(item.data)}</td>
            <td style="padding:7px 10px;">${item.hora    || ''}</td>
            <td style="padding:7px 10px;">${item.nome    || ''}</td>
            <td style="padding:7px 10px;">${item.cpf      || ''}</td>
            <td style="padding:7px 10px;">${item.empresa || ''}</td>
            <td style="padding:7px 10px;">${item.cavalo  || ''}</td>
            <td style="padding:7px 10px;">${item.placa   || ''}</td>
            <td style="padding:7px 10px;">${item.carreta || ''}</td>
            <td style="padding:7px 10px;">${item.motivo  || ''}</td>
            <td style="padding:7px 10px; font-weight:700;">${item.acesso || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ── 4. EXPORTAR XLSX ─────────────────────────────────────────────────────────
function paExportarXLSX() {
    if (dadosPAGlobal.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    const cabecalho = ['Data','Hora','Nome','CPF','Empresa','Cavalo','Placa','Carreta','Motivo','Acesso'];
    const linhas = dadosPAGlobal.map(r => [
        _formatarDataPA(r.data),
        r.hora    || '',
        r.nome    || '',
        String(r.cpf || ''),
        r.empresa || '',
        r.cavalo  || '',
        r.placa   || '',
        r.carreta || '',
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
    link.download = 'relatorio_peao2_acessos.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
}
