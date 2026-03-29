// js/auth.js - Versão Final Corrigida
async function fazerLogin(portariaAtual) {
    const user = document.getElementById('user-login').value;
    const pass = document.getElementById('user-pass').value;
    
    // 1. Conexão com a tabela correta (sem acento)
    const { data, error } = await _supabase
        .from('usuarios') 
        .select('*')
        .eq('login', user)
        .eq('senha', pass)
        .single();
    
    if (error) {
        console.error("Erro na busca:", error);
        return alert("Login ou senha inválidos! Verifique se usou letras maiúsculas.");
    }

    if (data) {
        // 2. Trava de Segurança: ADM entra em tudo, P04 só na P04
        if (data.nivel_acesso === 'administrador' || data.nivel_acesso === portariaAtual) {
            document.getElementById('tela-login').style.display = 'none';
            document.getElementById('sistema-principal').style.display = 'block';
            document.getElementById('nome-logado').innerText = data.nome_completo;
            document.body.classList.add('sistema-aberto');
        } else {
            alert("ACESSO NEGADO: Você está na " + portariaAtual.toUpperCase() + " mas seu nível é " + data.nivel_acesso.toUpperCase());
        }
    }
}
