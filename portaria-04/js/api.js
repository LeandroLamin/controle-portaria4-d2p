/**
 * ================================================================================
 * PROJETO: SISTEMA DE CONTROLE DE ACESSO - D2P-BRAZIL (PORTARIA 04)
 * ARQUIVO: portaria-04/js/api.js
 * DEPENDE: /conexao/config.js e /conexao/db.js
 * ================================================================================
 */

let dadosFiltradosGlobal = [];

// --- INTERFACE ---
function abrirBusca() { document.getElementById('modal-busca').style.display = 'flex'; }
function fecharBusca() { document.getElementById('modal-busca').style.display = 'none'; }

// --- 1. LOCALIZAR (usa dbBuscar global) ---
async function localizar() {
    let cpfVal = document.getElementById('cpf').value.replace(/\D/g, '');
    if (!cpfVal) return alert("Digite um CPF");

    const data = await dbBuscar('acessos', { cpf: cpfVal });

    if (data && data.length > 0) {
        const ultimo = data[data.length - 1]; // pega o registro mais recente
        document.getElementById('nome').value = ultimo.nome;
        document.getElementById('empresa').value = ultimo.empresa;
        document.getElementById('responsavel').value = ultimo.responsavel;
    } else {
        alert("CPF não localizado na base.");
    }
}

// --- 2. SALVAR (usa dbSalvar global) ---
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

// --- 3. BUSCAR RELATÓRIO (filtro por período — fetch direto pois usa data range) ---
async function buscarRelatorio() {
    const filtro = {
        inicio: document.getElementById('filtro-inicio').value,
        fim: document.getElementById('filtro-fim').value,
        nome: document.getElementById('filtro-nome').value.trim()
    };

    if (!filtro.inicio || !filtro.fim) return alert("Selecione o período.");

    try {
        const res = await fetch(`${N8N_URL}/db-buscar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tabela: 'acessos', filtros: filtro })
        });

        const data = await res.json();

        if (data && data.length > 0) {
            dadosFiltradosGlobal = data;
            renderizarTabela(data);
        } else {
            alert("Nada encontrado.");
            document.querySelector('#tabela-resultados tbody').innerHTML = '';
        }
    } catch (err) {
        alert("Erro ao buscar dados.");
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

// ... manter funções limpar() e exportarExcel() que já funcionam
