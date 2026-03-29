// js/auth.js - Versão com Trava de Segurança por Portaria

async function fazerLogin(portariaAtual) {
    const user = document.getElementById('user-login').value;
    const pass = document.getElementById('user-pass').value;
    
    // Busca o usuário no banco
    const { data, error } = await _supabase
        .from('usuarios')
        .select('*')
        .eq('login', user)
        .eq('senha', pass)
        .single();
    
    if (data) {
        // REGRA: O Administrador entra em tudo. 
        // O Vigilante só entra se o nível dele for igual à portaria (ex: 'p04')
        if (data.nivel_acesso === 'admin' || data.nivel_acesso === portariaAtual) {
            document.getElementById('tela-login').style.display = 'none';
            document.getElementById('sistema-principal').style.display = 'block';
            document.getElementById('nome-logado').innerText = data.nome_completo;
            document.body.classList.add('sistema-aberto');
        } else {
            alert("ACESSO NEGADO: Seu usuário não tem permissão para a " + portariaAtual.toUpperCase());
        }
    } else { 
        alert("Login ou senha inválidos!"); 
    }
}
