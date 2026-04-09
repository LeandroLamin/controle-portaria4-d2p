/**
 * ================================================================================
 * PROJETO: SISTEMA DE CONTROLE DE ACESSO - D2P-BRAZIL (PORTARIA 04)
 * ARQUIVO: portaria-04/js/api.js
 * DEPENDE: /conexao/config.js, /conexao/db.js e /js/ui.js
 * ================================================================================
 */

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

    const data = await dbBuscar('acessos', { cpf: cpfVal }, { order: 'id.desc', limit: 1 });

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

    const result = await dbSalvar('acessos', dados);

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

    const data = await dbBuscar('acessos', filtros);

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
        tbody.innerHTML += `<tr>
            <td>${_formatarData(item.data)}</td><td>${item.hora}</td><td>${item.cpf}</td>
            <td>${item.nome}</td><td>${item.empresa}</td><td>${item.responsavel}</td>
            <td>${item.liberado}</td><td>${item.motivo}</td><td>${item.vigilante}</td>
            <td>${item.cracha || '-'}</td><td>${item.acesso}</td><td>${item.obs || ''}</td>
        </tr>`;
    });
}

// --- EXPORTAR EXCEL ---
function exportarExcel() {
    if (dadosFiltradosGlobal.length === 0) return notify("Busque os dados primeiro.", 'aviso');
    let csv = '\uFEFFData;Hora;CPF;Nome;Empresa;Responsavel;Liberado;Motivo;Vigilante;Cracha;Acesso;Obs\n';
    dadosFiltradosGlobal.forEach(row => {
        csv += `${row.data};${row.hora};${row.cpf};${row.nome};${row.empresa};${row.responsavel};${row.liberado};${row.motivo};${row.vigilante};${row.cracha};${row.acesso};${row.obs}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "relatorio_p04.csv");
    link.click();
}
