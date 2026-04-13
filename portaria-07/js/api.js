/**
 * PORTARIA 07 — CVP
 * Tabela: portaria-07-acessos
 * Depende: /conexao/config.js, /conexao/db.js, /js/ui.js
 */

const TABELA_P07 = 'portaria-07-acessos';
let dadosP07Global = [];

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    ['p07-cpf', 'p07-cracha'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') localizar();
        });
    });
});

// ── 1. LOCALIZAR por CPF ou Nº Crachá ────────────────────────────────────────
async function localizar() {
    const cpf    = document.getElementById('p07-cpf').value.trim();
    const cracha = document.getElementById('p07-cracha').value.trim();

    if (!cpf && !cracha) return notify('Digite o CPF ou Nº Crachá para localizar.', 'aviso');

    const filtros = cpf ? { cpf } : { cracha };
    const data = await dbBuscar(TABELA_P07, filtros, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const u = data[0];
        document.getElementById('p07-nome').value       = u.nome       || '';
        document.getElementById('p07-cpf').value        = u.cpf        || '';
        document.getElementById('p07-empresa').value    = u.empresa    || '';
        document.getElementById('p07-responsavel').value = u.responsavel || '';
        document.getElementById('p07-motivo').value     = u.motivo     || '';
        document.getElementById('p07-liberado').value   = u.liberado   || '';
        document.getElementById('p07-cracha').value     = u.cracha     || '';
        document.getElementById('p07-vigilante').value  = u.vigilante  || '';
        document.getElementById('p07-obs').value        = u.obs        || '';
        notify('Cadastro localizado!', 'sucesso');
    } else {
        notify('Registro não localizado na base.', 'aviso');
    }
}

// ── 2. SALVAR ─────────────────────────────────────────────────────────────────
async function salvar() {
    const agora = new Date();
    const dados = {
        nome:        document.getElementById('p07-nome').value.trim().toUpperCase(),
        cpf:         document.getElementById('p07-cpf').value.trim(),
        empresa:     document.getElementById('p07-empresa').value.trim().toUpperCase(),
        responsavel: document.getElementById('p07-responsavel').value.trim().toUpperCase(),
        motivo:      document.getElementById('p07-motivo').value,
        liberado:    document.getElementById('p07-liberado').value,
        cracha:      document.getElementById('p07-cracha').value.trim(),
        vigilante:   document.getElementById('p07-vigilante').value,
        obs:         document.getElementById('p07-obs').value.trim().toUpperCase(),
        acesso:      document.getElementById('p07-acesso').value,
        data:        agora.toLocaleDateString('en-CA'),
        hora:        agora.toTimeString().slice(0, 8)
    };

    if (!dados.nome || !dados.cpf || !dados.motivo || !dados.acesso || !dados.vigilante) {
        return notify('Preencha todos os campos obrigatórios antes de salvar.', 'aviso');
    }

    const result = await dbSalvar(TABELA_P07, dados);
    if (result && result.ok) {
        notify('Acesso registrado com sucesso!', 'sucesso');
        p07Limpar();
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 3. LIMPAR TELA ────────────────────────────────────────────────────────────
function p07Limpar() {
    ['p07-nome','p07-cpf','p07-empresa','p07-responsavel','p07-cracha','p07-obs',
     'p07-motivo','p07-liberado','p07-vigilante','p07-acesso'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

// ── 4. RELATÓRIO — CONTROLES ──────────────────────────────────────────────────
function p07AbrirRelatorio() {
    document.getElementById('modal-p07').style.display = 'block';
    const hoje = new Date().toLocaleDateString('en-CA');
    if (!document.getElementById('p07-f-inicio').value) document.getElementById('p07-f-inicio').value = hoje;
    if (!document.getElementById('p07-f-fim').value)    document.getElementById('p07-f-fim').value    = hoje;
}

function p07FecharRelatorio() {
    p07LimparFiltro();
    document.getElementById('modal-p07').style.display = 'none';
}

function p07LimparFiltro() {
    document.getElementById('p07-f-inicio').value = '';
    document.getElementById('p07-f-fim').value    = '';
    document.getElementById('p07-f-busca').value  = '';
    document.querySelector('#p07-tabela-resultados tbody').innerHTML = '';
    dadosP07Global = [];
}

// ── 5. BUSCAR RELATÓRIO ───────────────────────────────────────────────────────
async function p07BuscarRelatorio() {
    const inicio = document.getElementById('p07-f-inicio').value;
    const fim    = document.getElementById('p07-f-fim').value;
    const busca  = document.getElementById('p07-f-busca').value.trim().toUpperCase();

    if (!inicio || !fim) return notify('Selecione o período.', 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };
    if (busca) {
        filtros[/^\d+$/.test(busca) ? 'cpf' : 'nome_like'] = busca;
    }

    const data = await dbBuscar(TABELA_P07, filtros, { order: 'id.desc' });
    if (data === null) return;

    if (data.length > 0) {
        dadosP07Global = data;
        _p07RenderizarTabela(data);
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
        document.querySelector('#p07-tabela-resultados tbody').innerHTML = '';
    }
}

// ── 6. RENDERIZAR TABELA ──────────────────────────────────────────────────────
function _formatarDataP07(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function _p07RenderizarTabela(lista) {
    const tbody = document.querySelector('#p07-tabela-resultados tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';
        [
            [_formatarDataP07(item.data), false], [item.hora || '', false],
            [item.cpf || '', false], [item.nome || '', false],
            [item.empresa || '', false], [item.responsavel || '', false],
            [item.motivo || '', false], [item.liberado || '', false],
            [item.cracha || '', false], [item.vigilante || '', false],
            [item.obs || '', false], [item.acesso || '', true]
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

// ── 7. EXPORTAR XLSX ─────────────────────────────────────────────────────────
function p07ExportarXLSX() {
    if (dadosP07Global.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    const cabecalho = ['Data','Hora','CPF','Nome','Empresa','Responsável','Motivo','Liberado','Nº Crachá','Vigilante','OBS','Acesso'];
    const linhas = dadosP07Global.map(r => [
        _formatarDataP07(r.data),
        r.hora        || '',
        String(r.cpf  || ''),
        r.nome        || '',
        r.empresa     || '',
        r.responsavel || '',
        r.motivo      || '',
        r.liberado    || '',
        r.cracha      || '',
        r.vigilante   || '',
        r.obs         || '',
        r.acesso      || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Portaria 07');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob  = new Blob([wbout], { type: 'application/octet-stream' });
    const link  = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'relatorio_p07.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
}
