// js/auth.js - Versão para Banco de Dados Padronizado
async function fazerLogin(portariaAtual) {
    const user = document.getElementById('user-login').value.trim();
    const pass = document.getElementById('user-pass').value.trim();
    
    if (!user || !pass) return alert("Preencha todos os campos!");

    // Busca simples na tabela usuarios
    const { data, error } = await _supabase
        .from('usuarios')
        .select('*')
        .eq('login', user)
        .eq('senha', pass)
        .single(); // Agora o .single() vai funcionar porque o ID está correto

    if (error) {
        console.error("Erro no login:", error.message);
        return alert("Login ou senha inválidos! (Lembre-se do L maiúsculo em Leandro)");
    }

    if (data) {
        // Validação de Permissão: administrador entra em tudo, portaria específica entra na sua pasta
        if (data.nivel_acesso === 'administrador' || data.nivel_acesso === portariaAtual) {
            document.getElementById('tela-login').style.display = 'none';
            document.getElementById('sistema-principal').style.display = 'block';
            document.getElementById('nome-logado').innerText = data.nome_completo;
            document.body.classList.add('sistema-aberto');
        } else {
            alert("ACESSO NEGADO: Seu nível é " + data.nivel_acesso.toUpperCase() + ". Procure o administrador.");
        }
    }
}
