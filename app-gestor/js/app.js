/**
 * APP GESTOR — Acesso de Gestor por Placa
 * Tabela: app-gestores (cadastro de gestores autorizados)
 */

const TABELA_GESTORES    = 'portaria-gestores';
const TABELA_LOG         = 'portaria-gestores-log';
let _gestorAtual = null;
const PLATE_RECOGNIZER   = 'https://api.platerecognizer.com/v1/plate-reader/';
const PLATE_TOKEN        = '2bc63f6c1150244884c85b2b147fcae03ca5104d';
let stream = null;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Login desativado — entra direto
    mostrarPrincipal('Gestor');
    document.getElementById('placa-manual').addEventListener('keydown', e => {
        if (e.key === 'Enter') buscarPlaca();
    });
});

// ── Login ─────────────────────────────────────────────────────────────────────
async function autenticar() {
    const user  = document.getElementById('login-user').value.trim();
    const senha = document.getElementById('login-senha').value.trim();
    const erro  = document.getElementById('login-erro');
    if (!user || !senha) { erro.style.display='block'; erro.textContent='Preencha login e senha.'; return; }
    erro.style.display = 'none';

    const resp = await fetch(`${N8N_URL}/login-portaria`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: user, senha, portaria: 'app-gestor', _api_key: N8N_API_KEY })
    }).catch(() => null);
    const data = resp ? await resp.json().catch(() => null) : null;

    if (data && data.ok) {
        sessionStorage.setItem('gestor-auth', JSON.stringify({ nome: data.nome_completo || user }));
        mostrarPrincipal(data.nome_completo || user);
    } else {
        erro.style.display = 'block';
        erro.textContent = 'Usuário ou senha incorretos.';
    }
}

function mostrarPrincipal(nome) {
    document.getElementById('tela-principal').style.display = 'flex';
    document.getElementById('nome-operador').textContent    = nome;
}

function sair() {
    pararCamera();
    sessionStorage.removeItem('gestor-auth');
    document.getElementById('tela-login').style.display     = 'flex';
    document.getElementById('tela-principal').style.display = 'none';
    document.getElementById('login-user').value  = '';
    document.getElementById('login-senha').value = '';
}

// ── Câmera ────────────────────────────────────────────────────────────────────
async function iniciarCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        document.getElementById('video').srcObject = stream;
    } catch {
        document.getElementById('status-ocr').textContent = 'Câmera indisponível — use a digitação manual.';
    }
}

function pararCamera() {
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
}

// ── Capturar e enviar para Platerecognizer ────────────────────────────────────
async function capturarPlaca() {
    const video  = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const status = document.getElementById('status-ocr');

    if (!stream) { buscarPlaca(); return; }

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    status.textContent = '🔍 Enviando para leitura...';

    canvas.toBlob(async (blob) => {
        try {
            const form = new FormData();
            form.append('upload', blob, 'placa.jpg');
            form.append('regions', 'br');

            const resp = await fetch(PLATE_RECOGNIZER, {
                method: 'POST',
                headers: { 'Authorization': `Token ${PLATE_TOKEN}` },
                body: form
            });

            const data = await resp.json();

            if (data.results && data.results.length > 0) {
                const placa = data.results[0].plate.toUpperCase();
                document.getElementById('placa-manual').value = placa;
                status.textContent = `Placa detectada: ${placa}`;
                await buscarPorPlaca(placa);
            } else {
                status.textContent = 'Placa não detectada — tente manualmente.';
            }
        } catch {
            status.textContent = 'Erro na leitura — tente manualmente.';
        }
    }, 'image/jpeg', 0.9);
}

// ── Busca manual ──────────────────────────────────────────────────────────────
async function buscarPlaca() {
    const valor = document.getElementById('placa-manual').value.trim().toUpperCase();
    if (!valor) return;
    document.getElementById('lista-resultados').style.display = 'none';

    const ehPlaca = /^[A-Z]{3}[-]?[0-9A-Z]{4}$/.test(valor);

    if (ehPlaca) {
        const placa = valor.replace('-', '');
        const data = await dbBuscar(TABELA_GESTORES, { placa }, { order: 'id.desc', limit: 1 });
        if (data && data.length > 0) mostrarLiberado(data[0].placa, data[0]);
        else mostrarNegado(valor);
    } else {
        const data = await dbBuscar(TABELA_GESTORES, { nome_like: valor }, { order: 'nome.asc' });
        if (!data || data.length === 0) {
            mostrarNegado(valor);
        } else if (data.length === 1) {
            mostrarLiberado(data[0].placa, data[0]);
        } else {
            mostrarListaResultados(data);
        }
    }
}

function mostrarListaResultados(lista) {
    const container = document.getElementById('lista-items');
    container.innerHTML = lista.map(g => `
        <div class="gestor-item" onclick="selecionarGestor(${g.id})">
            <div class="gestor-item-nome">${g.nome || '—'}</div>
            <div class="gestor-item-sub">${g.empresa || ''} ${g.cargo ? '· ' + g.cargo : ''}</div>
            <div class="gestor-item-placa">${g.placa || '—'}</div>
        </div>
    `).join('');
    window._listaGestores = lista;
    document.getElementById('lista-resultados').style.display = 'block';
}

function selecionarGestor(id) {
    const g = (window._listaGestores || []).find(x => x.id === id);
    if (g) mostrarLiberado(g.placa, g);
}

// ── Resultado LIBERADO ────────────────────────────────────────────────────────
function mostrarLiberado(placa, gestor) {
    _gestorAtual = { ...gestor, placa };

    const tela = document.getElementById('tela-resultado');
    tela.className = 'liberado';
    tela.style.display = 'flex';

    document.getElementById('result-icon').textContent   = '✅';
    document.getElementById('result-status').textContent = 'LIBERADO';
    document.getElementById('result-placa').textContent  = placa;
    document.getElementById('btns-acesso').style.display = 'flex';

    document.getElementById('result-card').innerHTML = `
        <div class="result-field" style="text-align:center">
            <div class="result-field-label">Nome</div>
            <div class="result-field-value" style="font-size:22px">${gestor.nome || '—'}</div>
        </div>
    `;
}

// ── Registrar ENTRADA / SAÍDA ─────────────────────────────────────────────────
async function registrarAcesso(tipo) {
    if (!_gestorAtual) { alert('Erro: gestor não encontrado.'); return; }
    const agora = new Date();
    const session = JSON.parse(sessionStorage.getItem('gestor-auth') || '{}');

    const dados = {
        placa:     _gestorAtual.placa,
        nome:      _gestorAtual.nome,
        empresa:   _gestorAtual.empresa || '',
        cargo:     _gestorAtual.cargo   || '',
        acesso:    tipo,
        data:      agora.toLocaleDateString('en-CA'),
        hora:      agora.toTimeString().slice(0, 8),
        operador:  session.nome || ''
    };

    const result = await dbSalvar(TABELA_LOG, dados);
    if (result && result.ok) {
        mostrarToast(`${tipo} registrada com sucesso!`, '#27ae60');
        setTimeout(voltarScan, 1500);
    } else {
        mostrarToast('Erro ao registrar. Tente novamente.', '#e74c3c');
    }
}

// ── Resultado NEGADO ──────────────────────────────────────────────────────────
function mostrarNegado(placa) {
    _gestorAtual = null;
    const tela = document.getElementById('tela-resultado');
    tela.className = 'negado';
    tela.style.display = 'flex';
    document.getElementById('btns-acesso').style.display = 'none';

    document.getElementById('result-icon').textContent   = '🚫';
    document.getElementById('result-status').textContent = 'SEM ACESSO';
    document.getElementById('result-placa').textContent  = placa;
    document.getElementById('result-card').innerHTML     = `
        <div class="result-field" style="text-align:center">
            <div class="result-field-value" style="color:rgba(255,255,255,.7);font-size:14px">Placa não cadastrada no sistema</div>
        </div>
    `;
}

// ── Voltar ────────────────────────────────────────────────────────────────────
function mostrarToast(msg, cor) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = 'position:fixed;bottom:40px;left:50%;transform:translateX(-50%);padding:14px 28px;border-radius:12px;font-size:15px;font-weight:700;color:#fff;z-index:9999;text-align:center;transition:opacity .3s;';
        document.body.appendChild(toast);
    }
    toast.textContent    = msg;
    toast.style.background = cor;
    toast.style.opacity  = '1';
    toast.style.display  = 'block';
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => { toast.style.display = 'none'; }, 300); }, 1200);
}

function voltarScan() {
    _gestorAtual = null;
    window._listaGestores = [];
    document.getElementById('tela-resultado').style.display  = 'none';
    document.getElementById('btns-acesso').style.display     = 'none';
    document.getElementById('placa-manual').value            = '';
    document.getElementById('lista-resultados').style.display = 'none';
    document.getElementById('lista-items').innerHTML          = '';
}
