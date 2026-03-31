// js/auth.js - Versão Segura (login via n8n)
async function fazerLogin(portariaAtual) {
    const userDigitado = document.getElementById('user-login').value.trim();
    const passDigitada = document.getElementById('user-pass').value.trim();

    if (!userDigitado || !passDigitada) {
        alert("Por favor, preencha o usuário e a senha.");
        return;
    }

    // --- PASSO 1: ENVIAR CREDENCIAIS AO SERVIDOR (n8n) ---
    let resultado;
    try {
        const resposta = await fetch('https://n8n.laminlpp.com.br/webhook/login-portaria', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                login: userDigitado,
                senha: passDigitada,
                portaria: portariaAtual
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

    // --- PASSO 3: CHECAR NÍVEL DE ACESSO E REDIRECIONAR ---
    
    // Se for administrador, redireciona para o dashboard global
    if (resultado.nivel_acesso === 'administrador') {
        localStorage.setItem('usuario_nome', 'administrador');
        window.location.href = './admin/dashboard.html';
        return;
    }

    // Se for o nível da portaria atual, abre o sistema na página
    if (resultado.nivel_acesso === portariaAtual) {
        document.getElementById('tela-login').style.display = 'none';
        document.getElementById('sistema-principal').style.display = 'block';
        document.getElementById('nome-logado').innerText = resultado.nome_completo;
        document.body.classList.add('sistema-aberto');
        console.log("Acesso liberado para: " + resultado.nome_completo);
    } else {
        alert("ACESSO NEGADO: Seu nível é " + resultado.nivel_acesso.toUpperCase() + " e esta tela é apenas para " + portariaAtual.toUpperCase());
    }
}
