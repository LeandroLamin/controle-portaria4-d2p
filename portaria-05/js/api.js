/**
 * PORTARIA 05 — CVU
 * Tabela: portaria-05-acessos
 * Depende: /conexao/config.js, /conexao/db.js, /js/ui.js
 */

const TABELA_P05 = 'portaria-05-acessos';
let dadosFiltradosGlobal = [];

// ── Relógio em tempo real ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    function atualizarRelogio() {
        const agora = new Date();
        const data = agora.toLocaleDateString('pt-BR');
        const hora = agora.toTimeString().slice(0, 8);
        document.getElementById('p05-data-display').textContent = data;
        document.getElementById('p05-hora-display').textContent = hora;
    }
    atualizarRelogio();
    setInterval(atualizarRelogio, 1000);

    document.getElementById('p05-cpf').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') localizar();
    });
});

// ── 1. LOCALIZAR por CPF ──────────────────────────────────────────────────────
async function localizar() {
    const cpf = document.getElementById('p05-cpf').value.trim();
    if (!cpf) return notify('Digite o CPF para localizar.', 'aviso');

    const data = await dbBuscar(TABELA_P05, { cpf }, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const u = data[0];
        document.getElementById('p05-nome').value        = u.nome        || '';
        document.getElementById('p05-empresa').value     = u.empresa     || '';
        document.getElementById('p05-responsavel').value = u.responsavel || '';
        document.getElementById('p05-num-cracha').value  = u.num_cracha  || '';
        document.getElementById('p05-vigilante').value   = u.vigilante   || '';
        document.getElementById('p05-motivo').value      = u.motivo      || '';
        document.getElementById('p05-liberado').value    = u.liberado    || '';
        notify('Registro localizado!', 'sucesso');
    } else {
        notify('CPF não localizado na base.', 'aviso');
    }
}

// ── 2. SALVAR ─────────────────────────────────────────────────────────────────
async function salvar() {
    const agora = new Date();
    const dados = {
        nome:        document.getElementById('p05-nome').value.trim().toUpperCase(),
        cpf:         document.getElementById('p05-cpf').value.trim(),
        empresa:     document.getElementById('p05-empresa').value.trim().toUpperCase(),
        responsavel: document.getElementById('p05-responsavel').value.trim().toUpperCase(),
        motivo:      document.getElementById('p05-motivo').value,
        liberado:    document.getElementById('p05-liberado').value,
        num_cracha:  document.getElementById('p05-num-cracha').value.trim(),
        vigilante:   document.getElementById('p05-vigilante').value.trim().toUpperCase(),
        obs:         document.getElementById('p05-obs').value.trim().toUpperCase(),
        acesso:      document.getElementById('p05-acesso').value,
        data:        agora.toLocaleDateString('en-CA'),
        hora:        agora.toTimeString().slice(0, 8)
    };

    if (!dados.nome || !dados.cpf || !dados.empresa || !dados.responsavel ||
        !dados.motivo || !dados.liberado || !dados.num_cracha || !dados.vigilante || !dados.acesso) {
        return notify('Preencha todos os campos obrigatórios antes de salvar.', 'aviso');
    }

    const result = await dbSalvar(TABELA_P05, dados);
    if (result && result.ok) {
        notify('Acesso registrado com sucesso!', 'sucesso');
        limpar();
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 3. LIMPAR ─────────────────────────────────────────────────────────────────
function limpar() {
    ['p05-nome','p05-cpf','p05-empresa','p05-responsavel','p05-num-cracha','p05-vigilante','p05-obs'].forEach(id => {
        document.getElementById(id).value = '';
    });
    ['p05-motivo','p05-liberado','p05-acesso'].forEach(id => {
        document.getElementById(id).selectedIndex = 0;
    });
}

// ── 4. BUSCAR RELATÓRIO ───────────────────────────────────────────────────────
async function buscarRelatorio() {
    const inicio = document.getElementById('filtro-inicio').value;
    const fim    = document.getElementById('filtro-fim').value;
    const busca  = document.getElementById('filtro-nome').value.trim().toUpperCase();

    if (!inicio || !fim) return notify('Selecione o período.', 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };
    if (busca) {
        filtros[/^\d+$/.test(busca) ? 'cpf' : 'nome_like'] = busca;
    }

    const data = await dbBuscar(TABELA_P05, filtros);
    if (data === null) return;

    if (data.length > 0) {
        dadosFiltradosGlobal = data;
        renderizarTabela(data);
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
        document.querySelector('#tabela-resultados tbody').innerHTML = '';
    }
}

// ── 5. RENDERIZAR TABELA ──────────────────────────────────────────────────────
function _formatarData(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function renderizarTabela(lista) {
    const tbody = document.querySelector('#tabela-resultados tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        tbody.innerHTML += `<tr>
            <td>${_formatarData(item.data)}</td>
            <td>${item.hora        || ''}</td>
            <td>${item.cpf         || ''}</td>
            <td>${item.nome        || ''}</td>
            <td>${item.empresa     || ''}</td>
            <td>${item.responsavel || ''}</td>
            <td>${item.motivo      || ''}</td>
            <td>${item.liberado    || ''}</td>
            <td>${item.num_cracha  || ''}</td>
            <td>${item.vigilante   || ''}</td>
            <td>${item.obs         || ''}</td>
            <td style="font-weight:700;">${item.acesso || ''}</td>
        </tr>`;
    });
}

// ── 6. EXPORTAR EXCEL ─────────────────────────────────────────────────────────
function exportarExcel() {
    if (dadosFiltradosGlobal.length === 0) return notify('Busque os dados primeiro.', 'aviso');
    let csv = '\uFEFFData;Hora;CPF;Nome;Empresa;Responsável;Motivo;Liberado;Nº Crachá;Vigilante;OBS;Acesso\n';
    dadosFiltradosGlobal.forEach(r => {
        csv += `${_formatarData(r.data)};${r.hora};${r.cpf};${r.nome};${r.empresa};${r.responsavel};${r.motivo};${r.liberado};${r.num_cracha};${r.vigilante};${r.obs};${r.acesso}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'relatorio_p05.csv';
    link.click();
}
