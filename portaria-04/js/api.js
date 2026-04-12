/**
 * ================================================================================
 * PROJETO: SISTEMA DE CONTROLE DE ACESSO - D2P-BRAZIL (PORTARIA 04)
 * ARQUIVO: portaria-04/js/api.js
 * DEPENDE: /conexao/config.js, /conexao/db.js e /js/ui.js
 * ================================================================================
 */

const TABELA_P04 = 'portaria-04-acessos';

let dadosFiltradosGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('cpf').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') localizar();
    });
});

// --- 1. LOCALIZAR ---
async function localizar() {
    let cpfVal = document.getElementById('cpf').value.replace(/\D/g, '');
    if (!cpfVal) return notify("Digite um CPF.", 'aviso');

    const data = await dbBuscar(TABELA_P04, { cpf: cpfVal }, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const ultimo = data[0];
        document.getElementById('nome').value = ultimo.nome;
        document.getElementById('empresa').value = ultimo.empresa;
        document.getElementById('responsavel').value = ultimo.responsavel;
        notify("CPF localizado!", 'sucesso');
    } else {
        notify("CPF não localizado na base.", 'aviso');
    }
}

// --- 2. SALVAR ---
async function salvar() {
    const agora = new Date();
    const dados = {
        cpf: document.getElementById('cpf').value.replace(/\D/g, ''),
        nome: document.getElementById('nome').value.trim().toUpperCase(),
        empresa: document.getElementById('empresa').value.trim().toUpperCase(),
        responsavel: document.getElementById('responsavel').value.trim().toUpperCase(),
        liberado: document.getElementById('liberado').value,
        motivo: document.getElementById('motivo').value,
        vigilante: document.getElementById('vigilante').value.trim().toUpperCase(),
        cracha: document.getElementById('cracha').value.trim(),
        acesso: document.getElementById('tipo').value,
        obs: document.getElementById('obs').value.trim().toUpperCase(),
        data: agora.toLocaleDateString('en-CA'),
        hora: agora.toTimeString().slice(0, 8)
    };

    if (!dados.cpf || !dados.nome || !dados.empresa || !dados.responsavel ||
        !dados.liberado || !dados.motivo || !dados.vigilante || !dados.cracha ||
        !dados.acesso || !dados.obs) {
        return notify("Preencha todos os campos antes de salvar.", 'aviso');
    }

    const result = await dbSalvar(TABELA_P04, dados);

    if (result && result.ok) {
        notify("Acesso registrado com sucesso!", 'sucesso');
        limpar();
    } else {
        notify("Erro ao salvar no servidor.", 'erro');
    }
}

// --- 3. BUSCAR RELATÓRIO ---
async function buscarRelatorio() {
    const inicio = document.getElementById('filtro-inicio').value;
    const fim = document.getElementById('filtro-fim').value;
    const nome = document.getElementById('filtro-nome').value.trim();

    if (!inicio || !fim) return notify("Selecione o período.", 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };

    if (nome) {
        if (/^\d+$/.test(nome)) {
            filtros.cpf = nome;
        } else {
            filtros.nome_like = nome;
        }
    }

    const data = await dbBuscar(TABELA_P04, filtros);

    if (data === null) return;
    if (data.length > 0) {
        dadosFiltradosGlobal = data;
        renderizarTabela(data);
    } else {
        notify("Nada encontrado.", 'aviso');
        document.querySelector('#tabela-resultados tbody').innerHTML = '';
    }
}

// --- FORMATAR DATA ---
function _formatarData(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

// --- RENDERIZAR TABELA ---
function renderizarTabela(lista) {
    const tbody = document.querySelector('#tabela-resultados tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        [
            _formatarData(item.data), item.hora || '', item.cpf || '',
            item.nome || '', item.empresa || '', item.responsavel || '',
            item.liberado || '', item.motivo || '', item.vigilante || '',
            item.cracha || '-', item.acesso || '', item.obs || ''
        ].forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

// --- ESCAPAR CAMPO CSV ---
function _escaparCsv(val) {
    const s = String(val == null ? '' : val);
    if (/[;\"\n\r]/.test(s) || /^[=+\-@\t\r]/.test(s)) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

// --- EXPORTAR EXCEL ---
function exportarExcel() {
    if (dadosFiltradosGlobal.length === 0) return notify("Busque os dados primeiro.", 'aviso');
    let csv = '\uFEFFData;Hora;CPF;Nome;Empresa;Responsavel;Liberado;Motivo;Vigilante;Cracha;Acesso;Obs\n';
    dadosFiltradosGlobal.forEach(row => {
        csv += [
            _escaparCsv(row.data), _escaparCsv(row.hora), _escaparCsv(row.cpf),
            _escaparCsv(row.nome), _escaparCsv(row.empresa), _escaparCsv(row.responsavel),
            _escaparCsv(row.liberado), _escaparCsv(row.motivo), _escaparCsv(row.vigilante),
            _escaparCsv(row.cracha), _escaparCsv(row.acesso), _escaparCsv(row.obs)
        ].join(';') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "relatorio_p04.csv");
    link.click();
}
