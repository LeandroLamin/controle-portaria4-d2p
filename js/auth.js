// js/auth.js - Versão Blindada com RLS + Tabela de Usuários
async function fazerLogin(portariaAtual) {
    const userDigitado = document.getElementById('user-login').value.trim();
    const passDigitada = document.getElementById('user-pass').value.trim();
    
    if (!userDigitado || !passDigitada) {
        alert("Por favor, preencha o usuário e a senha.");
        return;
    }

    // --- PASSO 1: ABRIR A PORTA DO BANCO (AUTENTICAÇÃO OFICIAL) ---
    // Usamos o e-mail coringa que você cadastrou no Authentication do Supabase
    const { error: authError } = await _supabase.auth.signInWithPassword({
        email: 'leandrolamindepaulapereira@gmail.com', // Seu e-mail coringa
        password: 'Portaria#Lamin@Secure_2026_!X'    // Sua senha forte
    });

    if (authError) {
        console.error("Falha na Camada de Segurança:", authError.message);
        alert("Erro de conexão segura. O banco está blindado.");
        return;
    }

    // --- PASSO 2: VALIDAR QUEM É O VIGILANTE (SUA TABELA) ---
    // Agora que o banco está "aberto", conseguimos ler a tabela 'usuarios'
    const { data, error: dbError } = await _supabase
        .from('usuarios')
        .select('*')
        .eq('login', userDigitado)
        .eq('senha', passDigitada)
        .single();

    if (dbError || !data) {
        console.error("Erro de Login:", dbError);
        alert("Login ou senha inválidos!");
        return;
    }

    // --- PASSO 3: CHECAR NÍVEL DE ACESSO ---
    if (data.nivel_acesso === 'administrador' || data.nivel_acesso === portariaAtual) {
        document.getElementById('tela-login').style.display = 'none';
        document.getElementById('sistema-principal').style.display = 'block';
        document.getElementById('nome-logado').innerText = data.nome_completo;
        document.body.classList.add('sistema-aberto');
        console.log("Acesso liberado para: " + data.nome_completo);
    } else {
        alert("ACESSO NEGADO: Seu nível é " + data.nivel_acesso.toUpperCase() + " e esta tela é apenas para " + portariaAtual.toUpperCase());
    }
}
