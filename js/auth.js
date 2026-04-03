// js/auth.js - Versão Segura (login via n8n)
async function fazerLogin(portariaAtual) {
    const userDigitado = document.getElementById('user-login').value.trim();
    const passDigitada = document.getElementById('user-pass').value.trim();

    if (!userDigitado || !passDigitada) {
        alert("Por favor, preencha o usuário e a senha.");
        return;
    }

    // --- PASSO 1: ENVIAR CREDENCIAIS AO SERVIDOR (n8n) ---
    // Senha hasheada antes de sair do browser
    let resultado;
    try {
        const senhaHash = await hashSenha(userDigitado, passDigitada);
        const resposta = await fetch('https://n8n.laminlpp.com.br/webhook/login-portaria', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                login: userDigitado,
                senha: senhaHash,
                portaria: portariaAtual,
                _api_key: N8N_API_KEY
            })
        });
        resultado = await resposta.json();
    } catch (err) {
        console.error("Erro de conexão:", err);
        alert("Erro de conexão com o servidor.");
        return;
    }

    // --- PASSO 2: VALIDAR RESPOSTA DO SERVIDOR ---
    if (!resultado.ok) {
        alert(resultado.mensagem || "Login ou senha inválidos!");
        return;
    }

    // --- PASSO 3: CHECAR NÍVEL DE ACESSO ---
    if (portariaAtual === 'menu') {
        sessionStorage.setItem('d2p-auth', resultado.nome_completo);
        window.location.href = '../portarias.html';
        return;
    }
    const niveis = resultado.nivel_acesso.toLowerCase().split(',').map(n => n.trim());
    if (niveis.includes('administrador') || niveis.includes(portariaAtual.toLowerCase())) {
        document.getElementById('tela-login').style.display = 'none';
        document.getElementById('sistema-principal').style.display = 'block';
        document.getElementById('nome-logado').innerText = resultado.nome_completo;
        document.body.classList.add('sistema-aberto');
        console.log("Acesso liberado para: " + resultado.nome_completo);
    } else {
        alert("ACESSO NEGADO: Seu nível é " + resultado.nivel_acesso.toUpperCase() + " e esta tela é apenas para " + portariaAtual.toUpperCase());
    }
}
