/**
 * PORTARIA PEÃO 2 — VISITANTES
 * Tabela: portaria-peao2-visitantes
 * Depende: /conexao/config.js, /conexao/db.js, /js/ui.js
 */

const TABELA_PV = 'portaria-peao2-visitantes';
let dadosPVGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    const cpfInput = document.getElementById('pv-cpf');
    if (cpfInput) {
        cpfInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') pvPesquisar();
        });
    }
});

// ── 1. REGISTRAR ENTRADA / SAÍDA ─────────────────────────────────────────────
async function pvRegistrar(acesso) {
    const agora  = new Date();
    const dados = {
        nome:        document.getElementById('pv-nome').value.trim().toUpperCase(),
        cpf:         document.getElementById('pv-cpf').value.trim(),
        responsavel: document.getElementById('pv-responsavel').value.trim().toUpperCase(),
        empresa:     document.getElementById('pv-empresa').value.trim().toUpperCase(),
        motivo:      document.getElementById('pv-motivo').value,
        num_cracha:  document.getElementById('pv-cracha').value.trim().toUpperCase(),
        liberado:    document.getElementById('pv-liberado').value.trim(),
        porteiro:    document.getElementById('pv-porteiro').value,
        observacao:  document.getElementById('pv-obs').value.trim(),
        acesso:      acesso,
        data:        agora.toLocaleDateString('en-CA'),
        hora:        agora.toTimeString().slice(0, 8)
    };
    if (!dados.nome || !dados.cpf || !dados.responsavel || !dados.empresa || !dados.motivo || !dados.porteiro) {
        return notify('Preencha todos os campos obrigatórios antes de salvar.', 'aviso');
    }
    const result = await dbSalvar(TABELA_PV, dados);
    if (result && result.ok) {
        notify(`${acesso} registrada com sucesso!`, 'sucesso');
        limparCampos('tela-visitantes');
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 2. PESQUISAR por CPF ─────────────────────────────────────────────────────
async function pvPesquisar() {
    const cpf = document.getElementById('pv-cpf').value.trim();
    if (!cpf) return notify('Digite o CPF para pesquisar.', 'aviso');

    const data = await dbBuscar(TABELA_PV, { cpf }, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const u = data[0];
        document.getElementById('pv-nome').value        = u.nome        || '';
        document.getElementById('pv-cpf').value         = u.cpf         || '';
        document.getElementById('pv-responsavel').value = u.responsavel || '';
        document.getElementById('pv-empresa').value     = u.empresa     || '';
        document.getElementById('pv-motivo').value      = u.motivo      || '';
        document.getElementById('pv-cracha').value      = u.num_cracha  || '';
        document.getElementById('pv-liberado').value    = u.liberado    || '';
        document.getElementById('pv-porteiro').value    = u.porteiro    || '';
        document.getElementById('pv-obs').value         = u.observacao  || '';
        notify('Registro localizado!', 'sucesso');
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
    }
}

// ── 3. FILTRO / RELATÓRIO ─────────────────────────────────────────────────────
function pvAbrirFiltro() {
    document.getElementById('modal-pv').style.display = 'block';
    const hoje = new Date().toLocaleDateString('en-CA');
    if (!document.getElementById('pv-f-inicio').value) document.getElementById('pv-f-inicio').value = hoje;
    if (!document.getElementById('pv-f-fim').value)    document.getElementById('pv-f-fim').value    = hoje;
}

function pvFecharFiltro() {
    pvLimparFiltro();
    document.getElementById('modal-pv').style.display = 'none';
}

function pvLimparFiltro() {
    document.getElementById('pv-f-inicio').value = '';
    document.getElementById('pv-f-fim').value    = '';
    document.getElementById('pv-f-busca').value  = '';
    document.querySelector('#pv-tabela tbody').innerHTML = '';
    dadosPVGlobal = [];
}

async function pvBuscarRelatorio() {
    const inicio = document.getElementById('pv-f-inicio').value;
    const fim    = document.getElementById('pv-f-fim').value;
    const busca  = document.getElementById('pv-f-busca').value.trim();

    if (!inicio || !fim) return notify('Selecione o período.', 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };
    if (busca) filtros.cpf_like = busca;

    const data = await dbBuscar(TABELA_PV, filtros);
    if (data === null) return;

    if (data.length > 0) {
        dadosPVGlobal = data;
        _pvRenderizarTabela(data);
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
        document.querySelector('#pv-tabela tbody').innerHTML = '';
    }
}

function _formatarDataPV(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function _pvRenderizarTabela(lista) {
    const tbody = document.querySelector('#pv-tabela tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';
        [
            [_formatarDataPV(item.data), false], [item.hora || '', false],
            [item.nome || '', false], [item.cpf || '', false],
            [item.responsavel || '', false], [item.empresa || '', false],
            [item.motivo || '', false], [item.num_cracha || '', false],
            [item.liberado || '', false], [item.porteiro || '', false],
            [item.observacao || '', false], [item.acesso || '', true]
        ].forEach(([val, bold]) => {
            const td = document.createElement('td');
            td.style.padding = '7px 10px';
            if (bold) td.style.fontWeight = '700';
            td.textContent = val;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

// ── 4. EXPORTAR XLSX ─────────────────────────────────────────────────────────
function pvExportarXLSX() {
    if (dadosPVGlobal.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    const cabecalho = ['Data','Hora','Nome','CPF','Responsável','Empresa','Motivo','N° Crachá','Liberado','Porteiro','Observação','Acesso'];
    const linhas = dadosPVGlobal.map(r => [
        _formatarDataPV(r.data),
        r.hora        || '',
        r.nome        || '',
        String(r.cpf  || ''),
        r.responsavel || '',
        r.empresa     || '',
        r.motivo      || '',
        r.num_cracha  || '',
        r.liberado    || '',
        r.porteiro    || '',
        r.observacao  || '',
        r.acesso      || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Visitantes');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob  = new Blob([wbout], { type: 'application/octet-stream' });
    const link  = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'relatorio_peao2_visitantes.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
}
