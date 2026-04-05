/**
 * PORTARIA 02 — NOTAS FISCAIS
 * Tabela: portaria-02-notas
 * Depende: /conexao/config.js, /conexao/db.js, /js/ui.js
 *
 * Fluxo:
 *  - Leitor de código de barras digita o número e pressiona Enter
 *  - Se NF não existe: salva → feedback verde → limpa campo
 *  - Se NF já existe: feedback vermelho → abre modal com dados existentes
 */

const TABELA_NF = 'portaria-02-notas';
let dadosNfGlobal = [];

// ── Auto-foco ao entrar na aba ────────────────────────────────────────────────
function notasFocar() {
    const input = document.getElementById('nf-numero');
    if (input) setTimeout(() => input.focus(), 50);
}

// ── Listener: dispara ao atingir 44 caracteres ou Enter (fallback) ───────────
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('nf-numero');
    input.addEventListener('input', async () => {
        if (input.value.trim().length === 44) await notasLer();
    });
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') await notasLer();
    });
});

// ── LEITURA DA NF ─────────────────────────────────────────────────────────────
async function notasLer() {
    const input    = document.getElementById('nf-numero');
    const status   = document.getElementById('nf-status');
    const numeroNf = input.value.trim();

    if (!numeroNf) return;

    // Verifica se já existe
    const existente = await dbBuscar(TABELA_NF, { numero_nf: numeroNf }, { limit: 1 });

    if (existente && existente.length > 0) {
        // NF já registrada → vermelho → modal
        _nfFeedback('vermelho', 'NF JÁ REGISTRADA');
        notasAbrirModal(existente[0]);
    } else {
        // NF nova → salva → verde
        const result = await dbSalvar(TABELA_NF, { numero_nf: numeroNf });
        if (result && result.ok) {
            _nfFeedback('verde', 'NF REGISTRADA COM SUCESSO');
            input.value = '';
        } else {
            _nfFeedback('vermelho', 'ERRO AO SALVAR');
        }
    }

    input.focus();
}

// ── Feedback visual no input ──────────────────────────────────────────────────
function _nfFeedback(tipo, mensagem) {
    const input  = document.getElementById('nf-numero');
    const status = document.getElementById('nf-status');
    const cls    = tipo === 'verde' ? 'nf-verde' : 'nf-vermelho';
    const cor    = tipo === 'verde' ? '#27ae60'  : '#e03030';

    input.classList.add(cls);
    status.textContent  = mensagem;
    status.style.color  = cor;

    setTimeout(() => {
        input.classList.remove(cls);
        status.textContent = '';
    }, 2000);
}

// ── Modal NF duplicada ────────────────────────────────────────────────────────
function notasAbrirModal(registro) {
    document.getElementById('nf-dup-numNf').textContent  = registro.num_nf    || '';
    document.getElementById('nf-dup-numero').textContent = registro.numero_nf || '';
    document.getElementById('nf-dup-data').textContent   = _nfFormatarData(registro.data);
    document.getElementById('nf-dup-hora').textContent   = registro.hora      || '';
    document.getElementById('modal-nf-dup').style.display = 'block';
}

function notasFecharModal() {
    document.getElementById('modal-nf-dup').style.display = 'none';
    const input = document.getElementById('nf-numero');
    input.value = '';
    input.focus();
}

// ── RELATÓRIO ─────────────────────────────────────────────────────────────────
function notasLimparFiltro() {
    document.getElementById('nf-f-inicio').value = '';
    document.getElementById('nf-f-fim').value    = '';
    document.getElementById('nf-f-busca').value  = '';
    document.querySelector('#nf-tabela tbody').innerHTML = '';
    dadosNfGlobal = [];
}

async function notasBuscarRelatorio() {
    const inicio = document.getElementById('nf-f-inicio').value;
    const fim    = document.getElementById('nf-f-fim').value;
    const busca  = document.getElementById('nf-f-busca').value.trim();

    if (!inicio && !fim && !busca) return notify('Informe o período ou um número de NF.', 'aviso');

    const filtros = {};
    if (inicio) filtros.data_gte = inicio;
    if (fim)    filtros.data_lte = fim;

    const data = await dbBuscar(TABELA_NF, filtros);
    if (data === null) return;

    let resultado = data;
    if (busca) {
        resultado = data.filter(item => {
            const numNf = item.num_nf || _nfExtrairNumero(item.numero_nf);
            return numNf === busca;
        });
    }

    if (resultado.length > 0) {
        dadosNfGlobal = resultado;
        _nfRenderizarTabela(resultado);
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
        document.querySelector('#nf-tabela tbody').innerHTML = '';
    }
}

function _nfFormatarData(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function _nfExtrairNumero(chave) {
    if (!chave || chave.length !== 44) return '';
    return parseInt(chave.substring(25, 34), 10).toString();
}

function _nfRenderizarTabela(lista) {
    const tbody = document.querySelector('#nf-tabela tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';
        tr.innerHTML = `
            <td style="padding:7px 10px;">${_nfFormatarData(item.data)}</td>
            <td style="padding:7px 10px;">${item.hora || ''}</td>
            <td style="padding:7px 10px; font-size:11px; color:#888;">${item.numero_nf || ''}</td>
            <td style="padding:7px 10px; font-weight:700; color:var(--teal-dk);">${item.num_nf || _nfExtrairNumero(item.numero_nf) || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ── EXPORTAR CSV ──────────────────────────────────────────────────────────────
function notasExportarCSV() {
    if (dadosNfGlobal.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    let csv = '\uFEFFData;Hora;Nº NF;Chave de Acesso\n';
    dadosNfGlobal.forEach(r => {
        csv += `${_nfFormatarData(r.data)};${r.hora};${_nfExtrairNumero(r.numero_nf)};${r.numero_nf}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'relatorio_p02_notas.csv');
    link.click();
}
