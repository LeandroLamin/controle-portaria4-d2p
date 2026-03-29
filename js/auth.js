// js/auth.js - Versão Administrador Completo

async function fazerLogin(portariaAtual) {
    const user = document.getElementById('user-login').value;
    const pass = document.getElementById('user-pass').value;
    
    const { data, error } = await _supabase
        .from('usuarios')
        .select('*')
        .eq('login', user)
        .eq('senha', pass)
        .single();
    
    if (data) {
        // Agora verificamos se é 'administrador' (escrito por extenso)
        if (data.nivel_acesso === 'administrador' || data.nivel_acesso === portariaAtual) {
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
