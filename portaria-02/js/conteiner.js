/**
 * PORTARIA 02 — CONTÊINER
 * Tabela: portaria-02-conteiner
 * Depende: /conexao/config.js, /conexao/db.js, /js/ui.js
 */

const TABELA_CNT = 'portaria-02-conteiner';
let dadosCntGlobal = [];

// ── 1. REGISTRAR ENTRADA / SAÍDA ─────────────────────────────────────────────
async function cntRegistrar(acesso) {
    const dados = {
        cpf: document.getElementById('cnt-cpf').value.replace(/\D/g, ''),
        nome: document.getElementById('cnt-nome').value.trim().toUpperCase(),
        transportadora: document.getElementById('cnt-transp').value.trim().toUpperCase(),
        placa: document.getElementById('cnt-placa').value.trim().toUpperCase(),
        carreta1: document.getElementById('cnt-carreta1').value.trim().toUpperCase(),
        carreta2: document.getElementById('cnt-carreta2').value.trim().toUpperCase(),
        conteiner1: document.getElementById('cnt-conteiner1').value.trim().toUpperCase(),
        lacre1: document.getElementById('cnt-lacre1').value.trim().toUpperCase(),
        conteiner2: document.getElementById('cnt-conteiner2').value.trim().toUpperCase(),
        lacre2: document.getElementById('cnt-lacre2').value.trim().toUpperCase(),
        acesso: acesso
    };
    if (!dados.cpf || !dados.nome || !dados.transportadora || !dados.placa ||
        !dados.carreta1 || !dados.carreta2 || !dados.conteiner1 || !dados.lacre1 ||
        !dados.conteiner2 || !dados.lacre2) {
        return notify('Preencha todos os campos antes de salvar.', 'aviso');
    }
    const result = await dbSalvar(TABELA_CNT, dados);
    if (result && result.ok) {
        notify(`${acesso} registrada com sucesso!`, 'sucesso');
        limparCampos('tela-conteiner');
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 2. PESQUISAR ──────────────────────────────────────────────────────────────
async function cntPesquisar() {
    const placa = document.getElementById('cnt-placa').value.trim().toUpperCase();
    const cpf   = document.getElementById('cnt-cpf').value.trim();

    if (!placa && !cpf) return notify('Digite a Placa ou CPF para pesquisar.', 'aviso');

    const filtros = placa ? { placa } : { cpf };
    const data = await dbBuscar(TABELA_CNT, filtros, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const u = data[0];
        document.getElementById('cnt-nome').value    = u.nome            || '';
        document.getElementById('cnt-cpf').value     = u.cpf             || '';
        document.getElementById('cnt-placa').value   = u.placa           || '';
        document.getElementById('cnt-transp').value  = u.transportadora  || '';
        document.getElementById('cnt-carreta1').value = u.carreta1       || '';
        document.getElementById('cnt-carreta2').value = u.carreta2       || '';
        notify('Registro localizado!', 'sucesso');
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
    }
}

// ── 3. FILTRO / RELATÓRIO ─────────────────────────────────────────────────────
function cntAbrirFiltro() {
    document.getElementById('modal-cnt').style.display = 'block';
}

function cntFecharFiltro() {
    cntLimparFiltro();
    document.getElementById('modal-cnt').style.display = 'none';
}

function cntLimparFiltro() {
    document.getElementById('cnt-f-inicio').value = '';
    document.getElementById('cnt-f-fim').value    = '';
    document.getElementById('cnt-f-busca').value  = '';
    document.querySelector('#cnt-tabela tbody').innerHTML = '';
    dadosCntGlobal = [];
}

async function cntBuscarRelatorio() {
    const inicio = document.getElementById('cnt-f-inicio').value;
    const fim    = document.getElementById('cnt-f-fim').value;
    const busca  = document.getElementById('cnt-f-busca').value.trim().toUpperCase();

    if (!inicio || !fim) return notify('Selecione o período.', 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };
    if (busca) filtros.placa_like = busca;

    const data = await dbBuscar(TABELA_CNT, filtros);
    if (data === null) return;

    if (data.length > 0) {
        dadosCntGlobal = data;
        _cntRenderizarTabela(data);
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
        document.querySelector('#cnt-tabela tbody').innerHTML = '';
    }
}

function _formatarData(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function _cntRenderizarTabela(lista) {
    const tbody = document.querySelector('#cnt-tabela tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';
        tr.innerHTML = `
            <td style="padding:7px 10px;">${_formatarData(item.data)}</td>
            <td style="padding:7px 10px;">${item.hora        || ''}</td>
            <td style="padding:7px 10px;">${item.nome        || ''}</td>
            <td style="padding:7px 10px;">${item.cpf         || ''}</td>
            <td style="padding:7px 10px;">${item.transp      || ''}</td>
            <td style="padding:7px 10px;">${item.placa       || ''}</td>
            <td style="padding:7px 10px;">${item.carreta1    || '-'}</td>
            <td style="padding:7px 10px;">${item.carreta2    || '-'}</td>
            <td style="padding:7px 10px;">${item.conteiner1  || ''}</td>
            <td style="padding:7px 10px;">${item.lacre1      || ''}</td>
            <td style="padding:7px 10px;">${item.conteiner2  || '-'}</td>
            <td style="padding:7px 10px;">${item.lacre2      || '-'}</td>
            <td style="padding:7px 10px; font-weight:700;">${item.acesso || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ── 4. EXPORTAR XLSX ─────────────────────────────────────────────────────────
function cntExportarXLSX() {
    if (dadosCntGlobal.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    const cabecalho = ['Data','Hora','Nome','CPF','Transportadora','Placa','Carreta1','Carreta2','Conteiner1','Lacre1','Conteiner2','Lacre2','Acesso'];
    const linhas = dadosCntGlobal.map(r => [
        _formatarData(r.data),
        r.hora           || '',
        r.nome           || '',
        String(r.cpf     || ''),
        r.transportadora || '',
        r.placa          || '',
        r.carreta1       || '',
        r.carreta2       || '',
        r.conteiner1     || '',
        r.lacre1         || '',
        r.conteiner2     || '',
        r.lacre2         || '',
        r.acesso         || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Conteiner');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob  = new Blob([wbout], { type: 'application/octet-stream' });
    const link  = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'relatorio_p02_conteiner.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
}
