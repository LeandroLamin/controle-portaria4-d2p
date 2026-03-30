/**
 * ================================================================================
 * PROJETO: SISTEMA DE CONTROLE DE ACESSO - D2P-BRAZIL (PORTARIA 04)
 * ARQUIVO: api.js (Versão Webhook Segura)
 * ================================================================================
 */

let dadosFiltradosGlobal = [];
const N8N_URL = 'https://n8n.laminlpp.com.br/webhook'; // Seu servidor n8n

// --- INTERFACE ---
function abrirBusca() { document.getElementById('modal-busca').style.display = 'flex'; }
function fecharBusca() { document.getElementById('modal-busca').style.display = 'none'; }

// --- 1. LOCALIZAR (Via n8n) ---
async function localizar() {
    let cpfVal = document.getElementById('cpf').value.replace(/\D/g, '');
    if(!cpfVal) return alert("Digite um CPF");

    try {
        const res = await fetch(`${N8N_URL}/localizar-cpf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf: cpfVal })
        });
        const data = await res.json();

        if (data && data.nome) {
            document.getElementById('nome').value = data.nome;
            document.getElementById('empresa').value = data.empresa;
            document.getElementById('responsavel').value = data.responsavel;
        } else { alert("CPF não localizado na base."); }
    } catch (err) { console.error("Erro ao localizar:", err); }
}

// --- 2. SALVAR (Via n8n) ---
async function salvar() {
    const payload = {
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

    if (!payload.cpf || !payload.nome || payload.obs.length < 2) {
        return alert("⚠️ Preencha todos os campos obrigatórios.");
    }

    try {
        const res = await fetch(`${N8N_URL}/salvar-acesso`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) { alert("✅ Registrado com sucesso!"); limpar(); }
        else { alert("Erro ao salvar no servidor."); }
    } catch (err) { alert("Erro de conexão com n8n."); }
}

// --- 3. BUSCAR RELATÓRIO (AQUI ESTÁ O SEGREDO DA VARIÁVEL) ---
async function buscarRelatorio() {
    const filtro = {
        inicio: document.getElementById('filtro-inicio').value,
        fim: document.getElementById('filtro-fim').value,
        nome: document.getElementById('filtro-nome').value.trim()
    };

    if (!filtro.inicio || !filtro.fim) return alert("Selecione o período.");

    try {
        const res = await fetch(`${N8N_URL}/buscar-relatorio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filtro)
        });

        // AQUI: Pegamos a variável JSON que o n8n devolve
        const data = await res.json(); 

        if (data && data.length > 0) {
            dadosFiltradosGlobal = data;
            renderizarTabela(data);
        } else {
            alert("Nada encontrado.");
            document.querySelector('#tabela-resultados tbody').innerHTML = '';
        }
    } catch (err) { alert("Erro ao buscar dados."); }
}

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
