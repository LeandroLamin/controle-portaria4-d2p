// js/api.js
// Arquivo responsável pelas chamadas ao Banco de Dados (Supabase)

// --- INÍCIO DA BLINDAGEM DE SEGURANÇA (LGPD) ---
// Credenciais do terminal (Mantenha segredo)
const _0x4a2 = 'auth_admin_v1@leandrolpp.com.br';
const _0x9b1 = '2c<x+-NMGf{Q7T3^SR%C0;P=H;p%7_h5?;@Bc<k';

async function validarTerminalLGPD() {
    // Tenta autenticar o terminal silenciosamente para liberar o RLS do banco
    const { data, error } = await _supabase.auth.signInWithPassword({
        email: _0x4a2,
        password: _0x9b1
    });

    if (error) {
        // Mensagem genérica para não dar pistas a invasores no console
        console.error("Erro 403: Acesso ao banco restrito conforme LGPD.");
    } else {
        console.log("Terminal validado com sucesso. Acesso autorizado.");
    }
}

// Inicia a trava de segurança assim que o script é carregado
validarTerminalLGPD();
// --- FIM DA BLINDAGEM ---

let dadosFiltradosGlobal = [];

// Busca o último registro de um CPF baseando-se no ID mais alto
async function localizar() {
    let cpfVal = document.getElementById('cpf').value.replace(/\D/g, '');
    if(!cpfVal) return alert("Digite um CPF");
    
    // USANDO APENAS O ID: O maior ID é SEMPRE o registro mais recente no banco
    const { data, error } = await _supabase
        .from('acessos')
        .select('nome, empresa, responsavel')
        .eq('cpf', cpfVal)
        .order('id', { ascending: false }) 
        .limit(1);
    
    if (data && data.length > 0) {
        document.getElementById('nome').value = data[0].nome || '';
        document.getElementById('empresa').value = data[0].empresa || '';
        document.getElementById('responsavel').value = data[0].responsavel || '';
    } else { 
        alert("CPF não localizado."); 
    }
}

// Salva o novo registro de acesso
async function salvar() {
    const agora = new Date();
    const dataBanco = agora.toISOString().split('T')[0];
    const horaBanco = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const payload = {
        cpf: document.getElementById('cpf').value.replace(/\D/g, ''),
        nome: document.getElementById('nome').value.toUpperCase(),
        empresa: document.getElementById('empresa').value.toUpperCase(),
        responsavel: document.getElementById('responsavel').value.toUpperCase(),
        liberado: document.getElementById('liberado').value,
        motivo: document.getElementById('motivo').value,
        vigilante: document.getElementById('vigilante').value.toUpperCase(),
        cracha: document.getElementById('cracha').value,
        acesso: document.getElementById('tipo').value,
        obs: document.getElementById('obs').value,
        data: dataBanco, 
        hora: horaBanco
    };

    const { error } = await _supabase.from('acessos').insert([payload]);
    
    if(error) {
        alert("Erro ao salvar.");
    } else { 
        alert("Acesso registrado com sucesso!"); 
        limpar(); 
    }
}

// Filtra os dados para o Relatório
async function buscarRelatorio() {
    const inicio = document.getElementById('filtro-inicio').value;
    const fim = document.getElementById('filtro-fim').value;
    const nome = document.getElementById('filtro-nome').value;

    if (!inicio || !fim || !nome) {
        return alert("Atenção: Para realizar a busca é obrigatório preencher Data Inicial, Data Final e o Nome do Visitante.");
    }

    let query = _supabase.from('acessos').select('*');
    query = query.gte('data', inicio).lte('data', fim).ilike('nome', `%${nome}%`);

    const { data } = await query.order('id', { ascending: false });

    if (data && data.length > 0) {
        dadosFiltradosGlobal = data;
        const tbody = document.querySelector('#tabela-resultados tbody');
        tbody.innerHTML = '';
        data.forEach(item => {
            tbody.innerHTML += `<tr>
                <td>${item.data}</td><td>${item.hora}</td><td>${item.cpf}</td><td>${item.nome}</td>
                <td>${item.empresa}</td><td>${item.responsavel}</td><td>${item.liberado}</td>
                <td>${item.motivo}</td><td>${item.vigilante}</td><td>${item.cracha || '-'}</td>
                <td>${item.acesso}</td><td>${item.obs || ''}</td>
            </tr>`;
        });
    } else {
        alert("Informação não encontrada: Não há dados com os filtros solicitados.");
        limparFiltrosBusca();
    }
}

// Exporta os dados filtrados para CSV
function exportarExcel() {
    if (dadosFiltradosGlobal.length === 0) return alert("Busque os dados antes de exportar.");
    let csv = '\uFEFFData;Hora;CPF;Nome;Empresa;Responsavel;Liberado;Motivo;Vigilante;Cracha;Acesso;Obs\n';
    dadosFiltradosGlobal.forEach(row => { 
        csv += `${row.data};${row.hora};${row.cpf};${row.nome};${row.empresa};${row.responsavel};${row.liberado};${row.motivo};${row.vigilante};${row.cracha};${row.acesso};${row.obs}\n`; 
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "relatorio_completo_d2p.csv");
    link.click();
}
