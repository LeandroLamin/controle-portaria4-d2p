// js/auth.js - Versão Final para Banco Limpo
async function fazerLogin(portariaAtual) {
    const user = document.getElementById('user-login').value.trim();
    const pass = document.getElementById('user-pass').value.trim();
    
    if (!user || !pass) {
        alert("Por favor, preencha o usuário e a senha.");
        return;
    }

    try {
        const { data, error } = await _supabase
            .from('usuarios')
            .select('*')
            .eq('login', user)
            .eq('senha', pass)
            .single();

        if (error) {
            console.error("Erro Supabase:", error);
            alert("Login ou senha inválidos!");
            return;
        }

        if (data) {
            // administrador ou a portaria da pasta (p04)
            if (data.nivel_acesso === 'administrador' || data.nivel_acesso === portariaAtual) {
                document.getElementById('tela-login').style.display = 'none';
                document.getElementById('sistema-principal').style.display = 'block';
                document.getElementById('nome-logado').innerText = data.nome_completo;
                document.body.classList.add('sistema-aberto');
            } else {
                alert("ACESSO NEGADO: Seu nível é " + data.nivel_acesso.toUpperCase() + " e esta tela é restrita para " + portariaAtual.toUpperCase());
            }
        }
    } catch (err) {
        console.error("Erro crítico:", err);
        alert("Erro ao conectar ao servidor. Tente novamente.");
    }
}
