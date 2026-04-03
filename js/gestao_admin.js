// js/gestao_admin.js - O cérebro do Painel Master

// 1. Inicia a página buscando os usuários
document.addEventListener('DOMContentLoaded', buscarUsuariosNoBanco);

async function buscarUsuariosNoBanco() {
    const corpoTabela = document.getElementById('corpo-tabela-usuarios');
    corpoTabela.innerHTML = '<tr><td colspan="5" style="text-align:center">Carregando usuários...</td></tr>';

    try {
        // Busca todos os usuários na tabela 'usuarios' (sem acento)
        const { data: usuarios, error } = await _supabase
            .from('usuarios')
            .select('*')
            .order('id', { ascending: true }); // Ordena pelo ID

        if (error) throw error;

        // Limpa o 'Carregando...'
        corpoTabela.innerHTML = '';

        if (usuarios && usuarios.length > 0) {
            // Preenche a tabela linha por linha
            usuarios.forEach(user => {
                
                // Define a cor do badge (Verde para Admin)
                const classeBadge = user.nivel_acesso === 'administrador' ? 'badge-admin' : 'badge-portaria';

                const tr = document.createElement('tr');

                const tdId = document.createElement('td');
                tdId.textContent = user.id;

                const tdLogin = document.createElement('td');
                const b = document.createElement('b');
                b.textContent = user.login;
                tdLogin.appendChild(b);

                const tdNome = document.createElement('td');
                tdNome.textContent = user.nome_completo;

                const tdNivel = document.createElement('td');
                const span = document.createElement('span');
                span.className = `badge ${classeBadge}`;
                span.textContent = user.nivel_acesso;
                tdNivel.appendChild(span);

                const tdAcao = document.createElement('td');
                tdAcao.style.textAlign = 'center';
                const btn = document.createElement('button');
                btn.className = 'btn-delete';
                btn.title = `Excluir ${user.login}`;
                btn.textContent = '🗑️';
                btn.addEventListener('click', () => solicitarExclusao(user.id, user.login));
                tdAcao.appendChild(btn);

                tr.appendChild(tdId);
                tr.appendChild(tdLogin);
                tr.appendChild(tdNome);
                tr.appendChild(tdNivel);
                tr.appendChild(tdAcao);
                corpoTabela.appendChild(tr);
            });
        } else {
            corpoTabela.innerHTML = '<tr><td colspan="5" style="text-align:center">Nenhum usuário cadastrado.</td></tr>';
        }

    } catch (err) {
        console.error("Erro ao buscar usuários:", err.message);
        corpoTabela.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red">Erro ao carregar dados do banco.</td></tr>';
    }
}

// 2. Função para o botão Excluir (🗑️)
async function solicitarExclusao(idUsuario, loginUsuario) {
    // Dupla verificação para evitar acidentes
    const confirmarAcao = confirm(`⚠️ ATENÇÃO: Tem certeza que deseja excluir permanentemente o acesso de '${loginUsuario.toUpperCase()}' (ID: ${idUsuario})?\n\nEsta ação não pode ser desfeita.`);

    if (confirmarAcao) {
        // Terceira verificação para o Leandro (Admin) não se excluir sem querer
        if (loginUsuario === 'Leandro') {
            alert("Ação Bloqueada: Você não pode excluir seu próprio acesso de Administrador.");
            return;
        }

        try {
            // Comando para deletar no Supabase
            const { error } = await _supabase
                .from('usuarios')
                .delete()
                .eq('id', idUsuario);

            if (error) throw error;

            alert(`Sucesso! O acesso de '${loginUsuario}' foi removido do sistema.`);
            
            // Recarrega a tabela para mostrar a lista atualizada
            buscarUsuariosNoBanco();

        } catch (err) {
            console.error("Erro na exclusão:", err.message);
            alert("Erro ao tentar excluir o usuário do banco de dados.");
        }
    }
}
