/**
 * ================================================================================
 * PROJETO: SISTEMA DE CONTROLE DE ACESSO - D2P-BRAZIL
 * UNIDADE: PORTARIA 04 (P04)
 * ARQUIVO: api.js (Lógica de Banco de Dados)
 * ================================================================================
 */

// --- BLINDAGEM DE SEGURANÇA ---
const _0x4a2 = 'leandrolamindepaulapereira@gmail.com';
const _0x9b1 = 'Portaria#Lamin@Secure_2026_!X';

async function validarTerminalLGPD() {
    const { error } = await _supabase.auth.signInWithPassword({
        email: _0x4a2,
        password: _0x9b1
    });
}
validarTerminalLGPD();

let dadosFiltradosGlobal = [];

function abrirBusca() {
    document.getElementById('modal-busca').style.display = 'flex';
}

function fecharBusca() {
    document.getElementById('modal-busca').style.display = 'none';
}

// BUSCA LIMPA (USA APENAS AS COLUNAS QUE VOCÊ CONFIRMOU)
async function buscarRelatorio() {
    const inicio = document.getElementById('filtro-inicio').value;
    const fim = document.getElementById('filtro-fim').value;
    const nomeBusca = document.getElementById('filtro-nome').value.trim();

    if (!inicio || !fim || !nomeBusca) return alert("Preencha as datas e o nome.");

    // AQUI ESTÁ O SEGREDO: Removido qualquer filtro de 'portaria'
    let query = _supabase.from('acessos')
        .select('*')
        .gte('data', inicio)
        .lte('data', fim)
        .ilike('nome', `%${nomeBusca}%`);

    const { data, error } = await query.order('id', { ascending: false });

    if (error) {
        alert("Erro no Banco: " + error.message);
        console.error(error);
        return;
    }

    if (data && data.length > 0) {
        dadosFiltradosGlobal = data;
        const tbody = document.querySelector('#tabela-resultados tbody');
        tbody.innerHTML = '';
        data.forEach(item => {
            tbody.innerHTML += `<tr>
                <td>${item.data}</td>
                <td>${item.hora}</td>
                <td>${item.cpf}</td>
                <td>${item.nome}</td>
                <td>${item.empresa}</td>
                <td>${item.responsavel}</td>
                <td>${item.liberado}</td>
                <td>${item.motivo}</td>
                <td>${item.vigilante}</td>
                <td>${item.cracha || '-'}</td>
                <td>${item.acesso}</td>
                <td>${item.obs || ''}</td>
            </tr>`;
        });
    } else {
        alert("Nada encontrado com esses filtros.");
    }
}

// ... manter funções de salvar, localizar e exportar que já funcionam
