// js/auth.js - Ajustado para a nova tabela 'usuarios'
async function fazerLogin(portariaAtual) {
    const user = document.getElementById('user-login').value;
    const pass = document.getElementById('user-pass').value;
    
    // O erro 42P01 acontece aqui se houver acento. Deixe sem acento:
    const { data, error } = await _supabase
        .from('usuarios') 
        .select('*')
        .eq('login', user)
        .eq('senha', pass)
        .single();
    
    if (data) {
        if (data.nivel_acesso === 'administrador' || data.nivel_acesso === portariaAtual) {
            document.getElementById('tela-login').style.display = 'none';
            document.getElementById('sistema-principal').style.display = 'block';
            document.getElementById('nome-logado').innerText = data.nome_completo;
            document.body.classList.add('sistema-aberto');
        } else {
            alert("ACESSO NEGADO: Você não tem permissão para a " + portariaAtual.toUpperCase());
        }
    } else { 
        alert("Login ou senha inválidos! (Lembre-se das letras maiúsculas)"); 
    }
}
