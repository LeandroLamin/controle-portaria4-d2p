/**
 * APP MOBILE — Gestão Portaria CVU
 * Tabela: app-controle-veiculos
 */

const TABELA_APP = 'app-controle-veiculos';

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const session = sessionStorage.getItem('app-auth');
    if (session) {
        const { nome } = JSON.parse(session);
        mostrarForm(nome);
    }
    // Data padrão = hoje
    document.getElementById('f-data').value = new Date().toLocaleDateString('en-CA');

    // Enter no login
    document.getElementById('login-senha').addEventListener('keydown', e => {
        if (e.key === 'Enter') autenticar();
    });
});

// ── Login ─────────────────────────────────────────────────────────────────────
async function autenticar() {
    const user  = document.getElementById('login-user').value.trim();
    const senha = document.getElementById('login-senha').value.trim();
    const erro  = document.getElementById('login-erro');

    if (!user || !senha) { erro.style.display = 'block'; erro.textContent = 'Preencha login e senha.'; return; }
    erro.style.display = 'none';

    const resp = await fetch(`${N8N_URL}/login-portaria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: user, senha, portaria: 'app-mobile', _api_key: N8N_API_KEY })
    }).catch(() => null);

    const data = resp ? await resp.json().catch(() => null) : null;

    if (data && data.ok) {
        sessionStorage.setItem('app-auth', JSON.stringify({ nome: data.nome_completo || user }));
        mostrarForm(data.nome_completo || user);
    } else {
        erro.style.display = 'block';
        erro.textContent = 'Usuário ou senha incorretos.';
    }
}

function mostrarForm(nome) {
    document.getElementById('tela-login').style.display = 'none';
    document.getElementById('tela-form').style.display  = 'block';
    document.getElementById('nome-operador').textContent = nome;
}

function sair() {
    sessionStorage.removeItem('app-auth');
    document.getElementById('tela-login').style.display = 'flex';
    document.getElementById('tela-form').style.display  = 'none';
    document.getElementById('login-user').value  = '';
    document.getElementById('login-senha').value = '';
}

// ── Seleção de botões radio ───────────────────────────────────────────────────
function selecionar(btn, campoId, valor) {
    const grupo = btn.closest('.radio-group');
    grupo.querySelectorAll('.radio-btn').forEach(b => b.classList.remove('selecionado'));
    btn.classList.add('selecionado');
    document.getElementById(campoId).value = valor;
}

// ── Salvar ────────────────────────────────────────────────────────────────────
async function salvarRegistro() {
    const agora = new Date();
    const session = JSON.parse(sessionStorage.getItem('app-auth') || '{}');

    const dados = {
        data:        document.getElementById('f-data').value,
        modelo:      document.getElementById('f-modelo').value.trim().toUpperCase(),
        chassi:      document.getElementById('f-chassi').value.trim().toUpperCase(),
        placa:       document.getElementById('f-placa').value.trim().toUpperCase(),
        numero_sv:   document.getElementById('f-numero-sv').value.trim(),
        motorista:   document.getElementById('f-motorista').value.trim().toUpperCase(),
        placa_tipo:  document.getElementById('f-placa-tipo').value,
        step:        document.getElementById('f-step').value,
        liga_leve:   document.getElementById('f-liga-leve').value,
        multimidia:  document.getElementById('f-multimidia').value,
        acesso:      document.getElementById('f-acesso').value,
        portaria:    document.getElementById('f-portaria').value,
        obs:         document.getElementById('f-obs').value.trim().toUpperCase(),
        operador:    session.nome || '',
        hora:        agora.toTimeString().slice(0, 8)
    };

    if (!dados.modelo || !dados.chassi || !dados.placa || !dados.motorista ||
        !dados.placa_tipo || !dados.step || !dados.liga_leve || !dados.multimidia ||
        !dados.acesso || !dados.portaria) {
        return mostrarModal('Preencha todos os campos obrigatórios!', 'aviso');
    }

    const result = await fetch(`${N8N_URL}/db-salvar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabela: TABELA_APP, dados, _api_key: N8N_API_KEY })
    }).then(r => r.json()).catch(() => null);

    if (result && result.ok) {
        mostrarModal('Acesso registrado com sucesso!', 'sucesso');
        limparForm();
    } else {
        mostrarModal('Erro ao salvar. Tente novamente.', 'erro');
    }
}

// ── Limpar ────────────────────────────────────────────────────────────────────
function limparForm() {
    ['f-modelo','f-chassi','f-placa','f-numero-sv','f-motorista','f-obs'].forEach(id => {
        document.getElementById(id).value = '';
    });
    ['f-placa-tipo','f-step','f-liga-leve','f-multimidia','f-acesso'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('f-portaria').value = '';
    document.getElementById('f-data').value = new Date().toLocaleDateString('en-CA');
    document.querySelectorAll('.radio-btn').forEach(b => b.classList.remove('selecionado'));
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function mostrarModal(msg, tipo) {
    const icons = { sucesso: '✅', erro: '❌', aviso: '⚠️' };
    document.getElementById('modal-icon').textContent = icons[tipo] || 'ℹ️';
    document.getElementById('modal-msg').textContent  = msg;
    document.getElementById('modal-notif').classList.add('show');
}

function fecharModal() {
    document.getElementById('modal-notif').classList.remove('show');
}
