/**
 * PORTARIA 03
 * Tabela: portaria-03-acessos
 * Regra: Ordenação por ID Decrescente (Mais recente primeiro)
 */

const TABELA_P03 = 'portaria-03-acessos';
let dadosFiltradosGlobal = [];

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    ['p03-cpf', 'p03-num-cracha'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') localizar();
        });
    });
});

// ── 1. LOCALIZAR por CPF ou N° Crachá ────────────────────────────────────────
async function localizar() {
    const cpf    = document.getElementById('p03-cpf').value.trim();
    const cracha = document.getElementById('p03-num-cracha').value.trim();

    if (!cpf && !cracha) return notify('Digite o CPF ou N° Crachá para localizar.', 'aviso');

    const filtros = cpf ? { cpf } : { num_cracha: cracha };
    const data = await dbBuscar(TABELA_P03, filtros, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const u = data[0];
        document.getElementById('p03-nome').value        = u.nome        || '';
        document.getElementById('p03-cpf').value         = u.cpf         || '';
        document.getElementById('p03-empresa').value     = u.empresa     || '';
        document.getElementById('p03-responsavel').value = u.responsavel || '';
        document.getElementById('p03-motivo').value      = u.motivo      || '';
        document.getElementById('p03-liberado').value    = u.liberado    || '';
        document.getElementById('p03-num-cracha').value  = u.num_cracha  || '';
        document.getElementById('p03-vigilante').value   = u.vigilante   || '';
        notify('Cadastro localizado!', 'sucesso');
    } else {
        notify('CPF não localizado na base.', 'aviso');
    }
}

// ── 2. SALVAR ─────────────────────────────────────────────────────────────────
async function salvar() {
    const agora = new Date();
    const dados = {
        nome:        document.getElementById('p03-nome').value.trim().toUpperCase(),
        cpf:         document.getElementById('p03-cpf').value.trim(),
        empresa:     document.getElementById('p03-empresa').value.trim().toUpperCase(),
        responsavel: document.getElementById('p03-responsavel').value.trim().toUpperCase(),
        motivo:      document.getElementById('p03-motivo').value,
        liberado:    document.getElementById('p03-liberado').value,
        num_cracha:  document.getElementById('p03-num-cracha').value.trim(),
        vigilante:   document.getElementById('p03-vigilante').value.trim().toUpperCase(),
        obs:         document.getElementById('p03-obs').value.trim().toUpperCase(),
        acesso:      document.getElementById('p03-acesso').value,
        data:        agora.toLocaleDateString('en-CA'),
        hora:        agora.toTimeString().slice(0, 8)
    };

    if (!dados.nome || !dados.cpf || !dados.acesso || !dados.motivo) {
        return notify('Preencha todos os campos obrigatórios antes de salvar.', 'aviso');
    }

    const result = await dbSalvar(TABELA_P03, dados);
    if (result && result.ok) {
        notify('Acesso registrado com sucesso!', 'sucesso');
        p03Limpar();
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 3. LIMPAR TELA ────────────────────────────────────────────────────────────
function p03Limpar() {
    const ids = ['p03-nome','p03-cpf','p03-empresa','p03-responsavel','p03-num-cracha','p03-vigilante','p03-obs','p03-motivo','p03-liberado','p03-acesso'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

// ── 4. RELATÓRIO — CONTROLES ──────────────────────────────────────────────────
function p03AbrirRelatorio() {
    document.getElementById('modal-p03').style.display = 'block';
    const hoje = new Date().toLocaleDateString('en-CA');
    document.getElementById('filtro-inicio').value = hoje;
    document.getElementById('filtro-fim').value    = hoje;
}

function p03FecharRelatorio() {
    p03LimparFiltro();
    document.getElementById('modal-p03').style.display = 'none';
}

function p03LimparFiltro() {
    document.getElementById('filtro-inicio').value = '';
    document.getElementById('filtro-fim').value    = '';
    document.getElementById('filtro-nome').value   = '';
    document.querySelector('#tabela-resultados tbody').innerHTML = '';
    dadosFiltradosGlobal = [];
}

// ── 5. BUSCAR RELATÓRIO ───────────────────────────────────────────────────────
async function buscarRelatorio() {
    const inicio = document.getElementById('filtro-inicio').value;
    const fim    = document.getElementById('filtro-fim').value;
    const busca  = document.getElementById('filtro-nome').value.trim().toUpperCase();

    if (!inicio || !fim) return notify('Selecione o período.', 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };
    if (busca) {
        filtros[/^\d+$/.test(busca) ? 'cpf' : 'nome_like'] = busca;
    }

    const data = await dbBuscar(TABELA_P03, filtros, { order: 'id.desc' });
    if (data === null) return;

    if (data.length > 0) {
        dadosFiltradosGlobal = data;
        renderizarTabela(data);
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
        document.querySelector('#tabela-resultados tbody').innerHTML = '';
    }
}

// ── 6. RENDERIZAR TABELA ──────────────────────────────────────────────────────
function _formatarData(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function renderizarTabela(lista) {
    const tbody = document.querySelector('#tabela-resultados tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';
        [
            [_formatarData(item.data), false], [item.hora || '', false],
            [item.cpf || '', false], [item.nome || '', false],
            [item.empresa || '', false], [item.responsavel || '', false],
            [item.motivo || '', false], [item.liberado || '', false],
            [item.num_cracha || '', false], [item.vigilante || '', false],
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
function exportarExcel() {
    if (dadosFiltradosGlobal.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    const cabecalho = ['Data','Hora','CPF','Nome','Empresa','Responsável','Motivo','Liberado','Nº Crachá','Vigilante','OBS','Acesso'];
    const linhas = dadosFiltradosGlobal.map(r => [
        _formatarData(r.data),
        r.hora        || '',
        String(r.cpf  || ''),
        r.nome        || '',
        r.empresa     || '',
        r.responsavel || '',
        r.motivo      || '',
        r.liberado    || '',
        r.num_cracha  || '',
        r.vigilante   || '',
        r.obs         || '',
        r.acesso      || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Portaria 03');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob  = new Blob([wbout], { type: 'application/octet-stream' });
    const link  = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'relatorio_p03.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
}
