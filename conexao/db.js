// conexao/db.js
// ============================================================
// FUNÇÕES GLOBAIS DE BANCO DE DADOS
// Usa os workflows universais do n8n
// ============================================================

// --- BUSCAR ---
// Exemplo: dbBuscar('acessos', { cpf: '12345678900' }, { order: 'id.desc', limit: 1 })
async function dbBuscar(tabela, filtros = {}, opcoes = {}) {
    try {
        const res = await fetch(`${N8N_URL}/db-buscar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': N8N_API_KEY },
           body: JSON.stringify({ tabela, filtros, order: opcoes.order || '', limit: opcoes.limit || '' })
        });
        const data = await res.json();
        return data;
    } catch (err) {
        console.error(`[dbBuscar] Erro na tabela '${tabela}':`, err);
        alert("Erro de conexão ao buscar dados.");
        return null; // <- era []
    }
}

// --- SALVAR ---
// Exemplo: dbSalvar('acessos', { cpf: '123', nome: 'JOÃO' })
async function dbSalvar(tabela, dados) {
    try {
        const res = await fetch(`${N8N_URL}/db-salvar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': N8N_API_KEY },
            body: JSON.stringify({ tabela, dados })
        });

        // Se o n8n der erro, agora ele vai te avisar o que foi
        if (!res.ok) {
            const erroTexto = await res.text();
            throw new Error(`Erro no Servidor (${res.status}): ${erroTexto || 'Sem detalhes'}`);
        }

        const text = await res.text();
        return text ? JSON.parse(text) : { ok: true };

    } catch (err) {
        console.error(`[dbSalvar] Falha crítica na tabela '${tabela}':`, err);
        alert(`ERRO AO SALVAR: ${err.message}`);
        return { ok: false, error: err.message };
    }
}

// --- DELETAR ---
// Exemplo: dbDeletar('usuarios', { id: 5 })
async function dbDeletar(tabela, filtros) {
    try {
        const res = await fetch(`${N8N_URL}/db-deletar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': N8N_API_KEY },
            body: JSON.stringify({ tabela, filtros })
        });
        const result = await res.json();
        return result;
    } catch (err) {
        console.error(`[dbDeletar] Erro na tabela '${tabela}':`, err);
        alert("Erro de conexão ao deletar dados.");
        return { ok: false };
    }
}

// --- ATUALIZAR ---
// Exemplo: dbAtualizar('usuarios', { id: 5 }, { senha: 'nova123' })
async function dbAtualizar(tabela, filtros, dados) {
    try {
        const res = await fetch(`${N8N_URL}/db-atualizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': N8N_API_KEY },
            body: JSON.stringify({ tabela, filtros, dados })
        });
        const result = await res.json();
        return result;
    } catch (err) {
        console.error(`[dbAtualizar] Erro na tabela '${tabela}':`, err);
        alert("Erro de conexão ao atualizar dados.");
        return { ok: false };
    }
}
