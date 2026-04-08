/**
 * PORTARIA 02 — PEÃO 2
 * Tabela: portaria-02-peao2
 * Depende: /conexao/config.js, /conexao/db.js, /js/ui.js
 */

const TABELA_P2 = 'portaria-02-peao2';
let dadosP2Global = [];

document.addEventListener('DOMContentLoaded', () => {
    const cpfInput = document.getElementById('p2-cpf');
    if (cpfInput) {
        cpfInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') p2Pesquisar();
        });

        // Máscara CPF: 000.000.000-00
        cpfInput.addEventListener('input', () => {
            let v = cpfInput.value.replace(/\D/g, '').slice(0, 11);
            if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
            else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
            else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
            cpfInput.value = v;
        });
    }
});

// ── 1. REGISTRAR ENTRADA / SAÍDA ─────────────────────────────────────────────
async function p2Registrar(acesso) {
    const dados = {
        nome:        document.getElementById('p2-nome').value.trim().toUpperCase(),
        cpf:         document.getElementById('p2-cpf').value.trim(),
        responsavel: document.getElementById('p2-responsavel').value.trim().toUpperCase(),
        empresa:     document.getElementById('p2-empresa').value.trim().toUpperCase(),
        motivo:      document.getElementById('p2-motivo').value,
        num_cracha:  document.getElementById('p2-cracha').value.trim().toUpperCase(),
        liberado:    document.getElementById('p2-liberado').value,
        porteiro:    document.getElementById('p2-porteiro').value,
        observacao:  document.getElementById('p2-obs').value.trim(),
        acesso:      acesso
    };
    if (!dados.nome || !dados.cpf || !dados.responsavel || !dados.empresa || !dados.motivo || !dados.liberado || !dados.porteiro) {
        return notify('Preencha todos os campos obrigatórios antes de salvar.', 'aviso');
    }
    const result = await dbSalvar(TABELA_P2, dados);
    if (result && result.ok) {
        notify(`${acesso} registrada com sucesso!`, 'sucesso');
        limparCampos('tela-peao2');
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 2. PESQUISAR por CPF ─────────────────────────────────────────────────────
async function p2Pesquisar() {
    const cpf = document.getElementById('p2-cpf').value.trim();
    if (!cpf) return notify('Digite o CPF para pesquisar.', 'aviso');

    const data = await dbBuscar(TABELA_P2, { cpf }, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const u = data[0];
        document.getElementById('p2-nome').value        = u.nome        || '';
        document.getElementById('p2-cpf').value         = u.cpf         || '';
        document.getElementById('p2-responsavel').value = u.responsavel || '';
        document.getElementById('p2-empresa').value     = u.empresa     || '';
        document.getElementById('p2-motivo').value      = u.motivo      || '';
        document.getElementById('p2-cracha').value      = u.num_cracha  || '';
        document.getElementById('p2-liberado').value    = u.liberado    || '';
        document.getElementById('p2-porteiro').value    = u.porteiro    || '';
        document.getElementById('p2-obs').value         = u.observacao  || '';
        notify('Registro localizado!', 'sucesso');
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
    }
}

// ── 3. FILTRO / RELATÓRIO ─────────────────────────────────────────────────────
function p2AbrirFiltro() {
    document.getElementById('modal-p2').style.display = 'block';
}

function p2FecharFiltro() {
    p2LimparFiltro();
    document.getElementById('modal-p2').style.display = 'none';
}

function p2LimparFiltro() {
    document.getElementById('p2-f-inicio').value = '';
    document.getElementById('p2-f-fim').value    = '';
    document.getElementById('p2-f-busca').value  = '';
    document.querySelector('#p2-tabela tbody').innerHTML = '';
    dadosP2Global = [];
}

async function p2BuscarRelatorio() {
    const inicio = document.getElementById('p2-f-inicio').value;
    const fim    = document.getElementById('p2-f-fim').value;
    const busca  = document.getElementById('p2-f-busca').value.trim().toUpperCase();

    if (!inicio || !fim) return notify('Selecione o período.', 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };
    if (busca) filtros.cpf_like = busca;

    const data = await dbBuscar(TABELA_P2, filtros);
    if (data === null) return;

    if (data.length > 0) {
        dadosP2Global = data;
        _p2RenderizarTabela(data);
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
        document.querySelector('#p2-tabela tbody').innerHTML = '';
    }
}

function _formatarDataP2(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function _p2RenderizarTabela(lista) {
    const tbody = document.querySelector('#p2-tabela tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';
        tr.innerHTML = `
            <td style="padding:7px 10px;">${_formatarDataP2(item.data)}</td>
            <td style="padding:7px 10px;">${item.hora        || ''}</td>
            <td style="padding:7px 10px;">${item.nome        || ''}</td>
            <td style="padding:7px 10px;">${item.cpf         || ''}</td>
            <td style="padding:7px 10px;">${item.responsavel || ''}</td>
            <td style="padding:7px 10px;">${item.empresa     || ''}</td>
            <td style="padding:7px 10px;">${item.motivo      || ''}</td>
            <td style="padding:7px 10px;">${item.num_cracha  || ''}</td>
            <td style="padding:7px 10px;">${item.liberado    || ''}</td>
            <td style="padding:7px 10px;">${item.porteiro    || ''}</td>
            <td style="padding:7px 10px;">${item.observacao  || ''}</td>
            <td style="padding:7px 10px; font-weight:700;">${item.acesso || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ── 4. EXPORTAR XLSX ─────────────────────────────────────────────────────────
function p2ExportarXLSX() {
    if (dadosP2Global.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    const cabecalho = ['Data','Hora','Nome','CPF','Responsável','Empresa','Motivo','N° Crachá','Liberado','Porteiro','Observação','Acesso'];
    const linhas = dadosP2Global.map(r => [
        _formatarDataP2(r.data),
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
    XLSX.utils.book_append_sheet(wb, ws, 'Peão 2');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob  = new Blob([wbout], { type: 'application/octet-stream' });
    const link  = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'relatorio_p02_peao2.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
}
