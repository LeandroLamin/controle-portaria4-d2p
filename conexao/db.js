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
            headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ tabela, filtros, order: opcoes.order || '', limit: opcoes.limit || '' })
        });
        const data = await res.json();
        return data;
    } catch (err) {
        console.error(`[dbBuscar] Erro na tabela '${tabela}':`, err);
        alert("Erro de conexão ao buscar dados.");
        return [];
    }
}

// --- SALVAR ---
// Exemplo: dbSalvar('acessos', { cpf: '123', nome: 'JOÃO' })
async function dbSalvar(tabela, dados) {
    try {
        const res = await fetch(`${N8N_URL}/db-salvar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tabela, dados })
        });
        const result = await res.json();
        return result;
    } catch (err) {
        console.error(`[dbSalvar] Erro na tabela '${tabela}':`, err);
        alert("Erro de conexão ao salvar dados.");
        return { ok: false };
    }
}
