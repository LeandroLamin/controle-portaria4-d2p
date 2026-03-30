/**
 * ================================================================================
 * PROJETO: SISTEMA DE CONTROLE DE ACESSO - D2P-BRAZIL
 * UNIDADE: PORTARIA 04 (P04)
 * ARQUIVO: api.js (Lógica de Banco de Dados)
 * DESCRIÇÃO: Responsável por localizar, salvar e buscar registros no Supabase.
 * ================================================================================
 */

// --- BLINDAGEM DE SEGURANÇA (LGPD) ---
const _0x4a2 = 'leandrolamindepaulapereira@gmail.com';
const _0x9b1 = 'Portaria#Lamin@Secure_2026_!X';

async function validarTerminalLGPD() {
    const { error } = await _supabase.auth.signInWithPassword({
        email: _0x4a2,
        password: _0x9b1
    });
    if (error) console.error("Erro Segurança P04.");
}
validarTerminalLGPD();

let dadosFiltradosGlobal = [];

// --- FUNÇÕES DE INTERFACE (MODAL) ---
function abrirBusca() {
    const modal = document.getElementById('modal-busca');
    if (modal) modal.style.display = 'flex';
}

function fecharBusca() {
    const modal = document.getElementById('modal-busca');
    if (modal) modal.style.display = 'none';
}

// --- LÓGICA DO SISTEMA ---

// Localizar registro (ID decrescente - Regra do Banco)
async function localizar() {
    let cpfVal = document.getElementById('cpf').value.replace(/\D/g, '');
    if(!cpfVal) return alert("Digite um CPF");
    
    const { data } = await _supabase
        .from('acessos')
        .select('nome, empresa, responsavel')
        .eq('cpf', cpfVal)
        .order('id', { ascending: false }) 
        .limit(1);
    
    if (data && data.length > 0) {
        document.getElementById('nome').value = data[0].nome || '';
        document.getElementById('empresa').value = data[0].empresa || '';
        document.getElementById('responsavel').value = data[0].responsavel || '';
    } else { alert("CPF não localizado."); }
}

// Salvar Acesso (Colunas: data, hora, cpf, nome, empresa, responsavel, motivo, liberado, vigilante, cracha, obs, acesso)
async function salvar() {
    const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
    const nome = document.getElementById('nome').value.trim();
    const empresa = document.getElementById('empresa').value.trim();
    const responsavel = document.getElementById('responsavel').value.trim();
    const liberado = document.getElementById('liberado').value;
    const motivo = document.getElementById('motivo').value;
    const vigilante = document.getElementById('vigilante').value.trim();
    const cracha = document.getElementById('cracha').value.trim();
    const acesso = document.getElementById('tipo').value;
    const obs = document.getElementById('obs').value.trim();

    // Trava de obrigatoriedade reforçada
    if (!cpf || !nome || !empresa || !responsavel || !liberado || !motivo || !vigilante || !cracha || acesso === "" || obs.length < 2) {
        alert("⚠️ ATENÇÃO: Preencha todos os campos, incluindo a OBSERVAÇÃO.");
        return; 
    }

    const agora = new Date();
    const payload = {
        cpf, 
        nome: nome.toUpperCase(), 
        empresa: empresa.toUpperCase(), 
        responsavel: responsavel.toUpperCase(),
        liberado, 
        motivo, 
        vigilante: vigilante.toUpperCase(), 
        cracha, 
        acesso, 
        obs: obs.toUpperCase(),
        data: agora.toISOString().split('T')[0], // YYYY-MM-DD
        hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const { error } = await _supabase.from('acessos').insert([payload]);
    
    if(error) { alert("Erro ao salvar: " + error.message); } 
    else { alert("✅ Acesso registrado com sucesso!"); limpar(); }
}

function limpar() {
    document.getElementById('cpf').value = '';
    document.getElementById('nome').value = '';
    document.getElementById('empresa').value = '';
    document.getElementById('responsavel').value = '';
    document.getElementById('vigilante').value = '';
    document.getElementById('cracha').value = '';
    document.getElementById('obs').value = '';
    document.getElementById('liberado').selectedIndex = 0;
    document.getElementById('motivo').selectedIndex = 0;
    document.getElementById('tipo').selectedIndex = 0; 
    document.getElementById('cpf').focus();
}

// Busca Geral (Filtra por Data e Nome)
async function buscarRelatorio() {
    const inicio = document.getElementById('filtro-inicio').value;
    const fim = document.getElementById('filtro-fim').value;
    const nomeBusca = document.getElementById('filtro-nome').value.trim();

    if (!inicio || !fim || !nomeBusca) return alert("Preencha Data Inicial, Final e o Nome.");

    let query = _supabase.from('acessos')
        .select('*')
        .gte('data', inicio)
        .lte('data', fim)
        .ilike('nome', `%${nomeBusca}%`);

    const { data, error } = await query.order('id', { ascending: false });

    if (error) {
        alert("Erro na busca: " + error.message);
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
        alert("Nenhum dado encontrado para os filtros aplicados.");
    }
}

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

function limparFiltrosBusca() {
    document.getElementById('filtro-inicio').value = '';
    document.getElementById('filtro-fim').value = '';
    document.getElementById('filtro-nome').value = '';
    const tbody = document.querySelector('#tabela-resultados tbody');
    if (tbody) tbody.innerHTML = '';
}
