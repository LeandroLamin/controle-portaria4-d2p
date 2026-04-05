/**
 * ================================================================================
 * PROJETO: SISTEMA DE CONTROLE DE ACESSO - D2P-BRAZIL (PORTARIA 02)
 * ARQUIVO: portaria-02/js/api.js
 * TABELA : portaria-02-conteiner
 * DEPENDE: /conexao/config.js, /conexao/db.js, /js/ui.js
 * ================================================================================
 */

const TABELA_CNT = 'portaria-02-conteiner';
let dadosCntGlobal = [];

// ── Lê os campos do formulário ───────────────────────────────────────────────
function _cntLerFormulario() {
    return {
        nome:       document.getElementById('cnt-nome').value.trim().toUpperCase(),
        cpf:         document.getElementById('cnt-cpf').value.trim(),
        transportadora: document.getElementById('cnt-transp').value,
        placa:      document.getElementById('cnt-placa').value.trim().toUpperCase(),
        carreta1:   document.getElementById('cnt-carreta1').value.trim().toUpperCase(),
        carreta2:   document.getElementById('cnt-carreta2').value.trim().toUpperCase(),
        conteiner1: document.getElementById('cnt-conteiner1').value.trim().toUpperCase(),
        lacre1:     document.getElementById('cnt-lacre1').value.trim().toUpperCase(),
        conteiner2: document.getElementById('cnt-conteiner2').value.trim().toUpperCase(),
        lacre2:     document.getElementById('cnt-lacre2').value.trim().toUpperCase(),
    };
}

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
    if (!dados.cpf || !dados.nome) {
        return notify('Preencha Nome e CPF.', 'aviso');
    }
    const result = await dbSalvar('portaria-02-conteiner', dados);
    if (result && result.ok) {
        notify(`${acesso} registrada com sucesso!`, 'sucesso');
        limparCampos('tela-conteiner');
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 2. PESQUISAR (preenche formulário com último registro da placa/RG) ────────
async function cntPesquisar() {
    const placa = document.getElementById('cnt-placa').value.trim().toUpperCase();
    const cpf   = document.getElementById('cnt-cpf').value.trim();

    if (!placa && !cpf) return notify('Digite a Placa ou CPF para pesquisar.', 'aviso');

    const filtros = placa ? { placa } : { cpf };
    const data = await dbBuscar(TABELA_CNT, filtros, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const u = data[0];
        document.getElementById('cnt-nome').value       = u.nome       || '';
        document.getElementById('cnt-cpf').value         = u.cpf       || '';
        document.getElementById('cnt-placa').value      = u.placa      || '';
        document.getElementById('cnt-transp').value = u.transportadora || '';
        document.getElementById('cnt-carreta1').value   = u.carreta1   || '';
        document.getElementById('cnt-carreta2').value   = u.carreta2   || '';
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

function _cntRenderizarTabela(lista) {
    const tbody = document.querySelector('#cnt-tabela tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';
        tr.innerHTML = `
            <td style="padding:7px 10px;">${item.data || ''}</td>
            <td style="padding:7px 10px;">${item.hora || ''}</td>
            <td style="padding:7px 10px;">${item.nome || ''}</td>
            <td style="padding:7px 10px;">${item.cpf || ''}</td>
            <td style="padding:7px 10px;">${item.transp || ''}</td>
            <td style="padding:7px 10px;">${item.placa || ''}</td>
            <td style="padding:7px 10px;">${item.carreta1 || '-'}</td>
            <td style="padding:7px 10px;">${item.carreta2 || '-'}</td>
            <td style="padding:7px 10px;">${item.conteiner1 || ''}</td>
            <td style="padding:7px 10px;">${item.lacre1 || ''}</td>
            <td style="padding:7px 10px;">${item.conteiner2 || '-'}</td>
            <td style="padding:7px 10px;">${item.lacre2 || '-'}</td>
            <td style="padding:7px 10px; font-weight:700;">${item.acesso || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ================================================================================
// ACESSOS
// ================================================================================

const TABELA_ACS = 'portaria-02-acessos';
let dadosAcsGlobal = [];

// ── 1. REGISTRAR ENTRADA / SAÍDA ─────────────────────────────────────────────
async function acsRegistrar(acesso) {
    const dados = {
        nome:    document.getElementById('acs-nome').value.trim().toUpperCase(),
        rg:      document.getElementById('acs-rg').value.trim(),
        empresa: document.getElementById('acs-empresa').value.trim().toUpperCase(),
        veiculo: document.getElementById('acs-veiculo').value.trim().toUpperCase(),
        placa:   document.getElementById('acs-placa').value.trim().toUpperCase(),
        motivo:  document.getElementById('acs-motivo').value,
        acesso:  acesso
    };
    if (!dados.rg || !dados.nome) {
        return notify('Preencha Nome e RG.', 'aviso');
    }
    const result = await dbSalvar(TABELA_ACS, dados);
    if (result && result.ok) {
        notify(`${acesso} registrada com sucesso!`, 'sucesso');
        limparCampos('tela-acessos');
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 2. PESQUISAR por RG ou Placa ─────────────────────────────────────────────
async function acsPesquisar() {
    const rg    = document.getElementById('acs-rg').value.trim();
    const placa = document.getElementById('acs-placa').value.trim().toUpperCase();

    if (!rg && !placa) return notify('Digite o RG ou a Placa para pesquisar.', 'aviso');

    const filtros = rg ? { rg } : { placa };
    const data = await dbBuscar(TABELA_ACS, filtros, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const u = data[0];
        document.getElementById('acs-nome').value    = u.nome    || '';
        document.getElementById('acs-rg').value      = u.rg      || '';
        document.getElementById('acs-empresa').value = u.empresa  || '';
        document.getElementById('acs-veiculo').value = u.veiculo  || '';
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

function _acsRenderizarTabela(lista) {
    const tbody = document.querySelector('#acs-tabela tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';
        tr.innerHTML = `
            <td style="padding:7px 10px;">${item.data    || ''}</td>
            <td style="padding:7px 10px;">${item.hora    || ''}</td>
            <td style="padding:7px 10px;">${item.nome    || ''}</td>
            <td style="padding:7px 10px;">${item.rg      || ''}</td>
            <td style="padding:7px 10px;">${item.empresa || ''}</td>
            <td style="padding:7px 10px;">${item.veiculo || ''}</td>
            <td style="padding:7px 10px;">${item.placa   || ''}</td>
            <td style="padding:7px 10px;">${item.motivo  || ''}</td>
            <td style="padding:7px 10px; font-weight:700;">${item.acesso || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ── 4. EXPORTAR CSV ───────────────────────────────────────────────────────────
function acsExportarCSV() {
    if (dadosAcsGlobal.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    let csv = '\uFEFFData;Hora;Nome;RG;Empresa;Veiculo;Placa;Motivo;Acesso\n';
    dadosAcsGlobal.forEach(r => {
        csv += `${r.data};${r.hora};${r.nome};${r.rg};${r.empresa};${r.veiculo};${r.placa};${r.motivo};${r.acesso}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'relatorio_p02_acessos.csv');
    link.click();
}

// ── 4. EXPORTAR CSV (CONTÊINER) ───────────────────────────────────────────────
function cntExportarCSV() {
    if (dadosCntGlobal.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    let csv = '\uFEFFData;Hora;Nome;CPF;Transp;Placa;Carreta1;Carreta2;Conteiner1;Lacre1;Conteiner2;Lacre2;Acesso\n';
    dadosCntGlobal.forEach(r => {
        csv += `${r.data};${r.hora};${r.nome};${r.cpf};${r.transp};${r.placa};${r.carreta1};${r.carreta2};${r.conteiner1};${r.lacre1};${r.conteiner2};${r.lacre2};${r.acesso}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'relatorio_p02_conteiner.csv');
    link.click();
}
