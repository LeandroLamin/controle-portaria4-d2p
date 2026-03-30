/**
 * ================================================================================
 * PROJETO: SISTEMA DE CONTROLE DE ACESSO - D2P-BRAZIL (PORTARIA 04)
 * ARQUIVO: portaria-04/js/api.js
 * DEPENDE: /conexao/config.js e /conexao/db.js
 * ================================================================================
 */

let dadosFiltradosGlobal = [];

// --- 1. LOCALIZAR ---
async function localizar() {
    let cpfVal = document.getElementById('cpf').value.replace(/\D/g, '');
    if (!cpfVal) return alert("Digite um CPF");

    const data = await dbBuscar('acessos', { cpf: cpfVal }, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const ultimo = data[0];
        document.getElementById('nome').value = ultimo.nome;
        document.getElementById('empresa').value = ultimo.empresa;
        document.getElementById('responsavel').value = ultimo.responsavel;
    } else {
        alert("CPF não localizado na base.");
    }
}

// --- 2. SALVAR ---
async function salvar() {
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
        obs: document.getElementById('obs').value.trim().toUpperCase()
    };

    if (!dados.cpf || !dados.nome || dados.obs.length < 2) {
        return alert("⚠️ Preencha todos os campos obrigatórios.");
    }

    const result = await dbSalvar('acessos', dados);

    if (result && result.ok) {
        alert("✅ Registrado com sucesso!");
        limpar();
    } else {
        alert("Erro ao salvar no servidor.");
    }
}

// --- 3. BUSCAR RELATÓRIO ---
async function buscarRelatorio() {
    const inicio = document.getElementById('filtro-inicio').value;
    const fim = document.getElementById('filtro-fim').value;
    const nome = document.getElementById('filtro-nome').value.trim();

    if (!inicio || !fim) return alert("Selecione o período.");

    const filtros = { data_gte: inicio, data_lte: fim };

    if (nome) {
        if (/^\d+$/.test(nome)) {
            filtros.cpf = nome;
        } else {
            filtros.nome_like = nome;
        }
    }

    const data = await dbBuscar('acessos', filtros);

    if (data && data.length > 0) {
        dadosFiltradosGlobal = data;
        renderizarTabela(data);
    } else {
        alert("Nada encontrado.");
        document.querySelector('#tabela-resultados tbody').innerHTML = '';
    }
}

// --- RENDERIZAR TABELA ---
function renderizarTabela(lista) {
    const tbody = document.querySelector('#tabela-resultados tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        tbody.innerHTML += `<tr>
            <td>${item.data}</td><td>${item.hora}</td><td>${item.cpf}</td>
            <td>${item.nome}</td><td>${item.empresa}</td><td>${item.responsavel}</td>
            <td>${item.liberado}</td><td>${item.motivo}</td><td>${item.vigilante}</td>
            <td>${item.cracha || '-'}</td><td>${item.acesso}</td><td>${item.obs || ''}</td>
        </tr>`;
    });
}

// --- EXPORTAR EXCEL ---
function exportarExcel() {
    if (dadosFiltradosGlobal.length === 0) return alert("Busque os dados primeiro.");
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
