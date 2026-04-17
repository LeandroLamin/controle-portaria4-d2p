/**
 * APP GESTOR — Acesso de Gestor por Placa
 * Tabela: app-gestores (cadastro de gestores autorizados)
 */

const TABELA_GESTORES = 'portaria-gestores';
let stream = null;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const session = sessionStorage.getItem('gestor-auth');
    if (session) {
        const { nome } = JSON.parse(session);
        mostrarPrincipal(nome);
    }
    document.getElementById('login-senha').addEventListener('keydown', e => {
        if (e.key === 'Enter') autenticar();
    });
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
    document.getElementById('tela-login').style.display     = 'none';
    document.getElementById('tela-principal').style.display = 'flex';
    document.getElementById('nome-operador').textContent    = nome;
    iniciarCamera();
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

// ── Capturar e OCR ────────────────────────────────────────────────────────────
async function capturarPlaca() {
    const video  = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const status = document.getElementById('status-ocr');

    if (!stream) { buscarPlaca(); return; }

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    status.textContent = '🔍 Lendo placa...';

    try {
        const { data: { text } } = await Tesseract.recognize(canvas, 'por', {
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-'
        });

        // Extrai padrão de placa: AAA-0000 ou AAA0A00 (Mercosul)
        const match = text.replace(/\s/g,'').match(/[A-Z]{3}[-]?[0-9A-Z][0-9]{2}[0-9A-Z]/);
        if (match) {
            const placa = match[0].toUpperCase();
            document.getElementById('placa-manual').value = placa;
            status.textContent = `Placa detectada: ${placa}`;
            await buscarPorPlaca(placa);
        } else {
            status.textContent = 'Placa não reconhecida — tente manualmente.';
        }
    } catch {
        status.textContent = 'Erro na leitura — tente manualmente.';
    }
}

// ── Busca manual ──────────────────────────────────────────────────────────────
async function buscarPlaca() {
    const placa = document.getElementById('placa-manual').value.trim().toUpperCase();
    if (!placa) return;
    await buscarPorPlaca(placa);
}

// ── Busca no Supabase ─────────────────────────────────────────────────────────
async function buscarPorPlaca(placa) {
    document.getElementById('status-ocr').textContent = `Consultando ${placa}...`;

    const data = await fetch(`${N8N_URL}/db-buscar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabela: TABELA_GESTORES, filtros: { placa }, order: 'id.desc', limit: 1, _api_key: N8N_API_KEY })
    }).then(r => r.json()).catch(() => null);

    if (data && Array.isArray(data) && data.length > 0) {
        mostrarLiberado(placa, data[0]);
    } else {
        mostrarNegado(placa);
    }
}

// ── Resultado LIBERADO ────────────────────────────────────────────────────────
function mostrarLiberado(placa, gestor) {
    const tela = document.getElementById('tela-resultado');
    tela.className = 'liberado';
    tela.style.display = 'flex';

    document.getElementById('result-icon').textContent   = '✅';
    document.getElementById('result-status').textContent = 'LIBERADO';
    document.getElementById('result-placa').textContent  = placa;

    document.getElementById('result-card').innerHTML = `
        <div class="result-field">
            <div class="result-field-label">Nome</div>
            <div class="result-field-value">${gestor.nome || '—'}</div>
        </div>
        <div class="result-field">
            <div class="result-field-label">Empresa</div>
            <div class="result-field-value">${gestor.empresa || '—'}</div>
        </div>
        <div class="result-field">
            <div class="result-field-label">Cargo</div>
            <div class="result-field-value">${gestor.cargo || '—'}</div>
        </div>
    `;
}

// ── Resultado NEGADO ──────────────────────────────────────────────────────────
function mostrarNegado(placa) {
    const tela = document.getElementById('tela-resultado');
    tela.className = 'negado';
    tela.style.display = 'flex';

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
function voltarScan() {
    document.getElementById('tela-resultado').style.display = 'none';
    document.getElementById('placa-manual').value = '';
    document.getElementById('status-ocr').textContent = 'Aponte para a placa e capture';
}
