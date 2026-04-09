// js/ui.js
// Arquivo responsável por funções de Interface

// --- NOTIFICAÇÃO GLOBAL (substitui alert) ---
function notify(mensagem, tipo = 'info') {
    const anterior = document.getElementById('notify-box');
    if (anterior) anterior.remove();

    const cores = {
        info:    { bg: '#3498db', icon: 'ℹ️' },
        sucesso: { bg: '#27ae60', icon: '✅' },
        erro:    { bg: '#e74c3c', icon: '❌' },
        aviso:   { bg: '#f39c12', icon: '⚠️' }
    };

    const { bg, icon } = cores[tipo] || cores.info;

    const box = document.createElement('div');
    box.id = 'notify-box';
    box.innerHTML = `
        <div style="
            position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
            background: ${bg}; color: white; padding: 16px 28px;
            border-radius: 10px; font-family: 'Segoe UI', sans-serif;
            font-size: 14px; font-weight: 600; z-index: 99999;
            box-shadow: 0 8px 30px rgba(0,0,0,0.25);
            display: flex; align-items: center; gap: 10px;
            min-width: 280px; max-width: 480px; text-align: center;
            animation: slideDown 0.3s ease;
        ">
            <span style="font-size: 18px;">${icon}</span>
            <span>${mensagem}</span>
        </div>
        <style>
            @keyframes slideDown {
                from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        </style>
    `;

    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3500);
}

function limpar() { 
    document.querySelectorAll('#sistema-principal input').forEach(i => i.value = ''); 
    document.querySelectorAll('#sistema-principal select').forEach(s => s.selectedIndex = 0); 
}

function limparFiltrosBusca() {
    document.getElementById('filtro-inicio').value = '';
    document.getElementById('filtro-fim').value = '';
    document.getElementById('filtro-nome').value = '';
    const tbody = document.querySelector('#tabela-resultados tbody');
    if(tbody) tbody.innerHTML = '';
    dadosFiltradosGlobal = [];
}

function abrirBusca() {
    document.getElementById('modal-busca').style.display = 'block';
    const hoje = new Date().toLocaleDateString('en-CA');
    const inicio = document.getElementById('filtro-inicio');
    const fim    = document.getElementById('filtro-fim');
    if (!inicio.value) inicio.value = hoje;
    if (!fim.value)    fim.value    = hoje;
}

function fecharBusca() { 
    limparFiltrosBusca(); 
    document.getElementById('modal-busca').style.display = 'none'; 
}
