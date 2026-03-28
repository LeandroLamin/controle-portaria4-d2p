// js/ui.js
// Arquivo responsável por funções de Interface (Limpar tela, abrir/fechar janelas)

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
    dadosFiltradosGlobal = []; // Variável global do api.js
}

function abrirBusca() { 
    limparFiltrosBusca(); 
    document.getElementById('modal-busca').style.display = 'block'; 
}

function fecharBusca() { 
    limparFiltrosBusca(); 
    document.getElementById('modal-busca').style.display = 'none'; 
}
