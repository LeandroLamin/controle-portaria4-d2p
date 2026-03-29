// js/auth.js - Versão Sincronizada com o Banco Perfeito
async function fazerLogin(portariaAtual) {
    // Pegamos os valores e removemos espaços extras que o teclado pode colocar
    const userDigitado = document.getElementById('user-login').value.trim();
    const passDigitada = document.getElementById('user-pass').value.trim();
    
    if (!userDigitado || !passDigitada) {
        alert("Por favor, preencha o usuário e a senha.");
        return;
    }

    // Buscamos na tabela 'usuarios' (exatamente como na foto)
    const { data, error } = await _supabase
        .from('usuarios')
        .select('*')
        .eq('login', userDigitado)
        .eq('senha', passDigitada)
        .single();

    if (error) {
        console.error("Erro Supabase:", error);
        alert("Login ou senha inválidos!");
        return;
    }

    if (data) {
        // Validação de Permissão (administrador ou a portaria da pasta)
        if (data.nivel_acesso === 'administrador' || data.nivel_acesso === portariaAtual) {
            document.getElementById('tela-login').style.display = 'none';
            document.getElementById('sistema-principal').style.display = 'block';
            document.getElementById('nome-logado').innerText = data.nome_completo;
            document.body.classList.add('sistema-aberto');
        } else {
            alert("ACESSO NEGADO: Seu nível é " + data.nivel_acesso.toUpperCase() + " e esta tela é apenas para " + portariaAtual.toUpperCase());
        }
    }
}
