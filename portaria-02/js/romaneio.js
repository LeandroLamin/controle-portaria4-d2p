/**
 * PORTARIA 02 — ROMANEIO
 * Tabela: portaria-02-romaneio
 * Depende: /conexao/config.js, /conexao/db.js, /js/ui.js
 */

const TABELA_ROM = 'portaria-02-romaneio';
let dadosRomGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('rom-cpf').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') romPesquisar();
    });
    document.getElementById('rom-placa').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') romPesquisar();
    });
});

// ── 1. REGISTRAR ENTRADA / SAÍDA ─────────────────────────────────────────────
async function romRegistrar(acesso) {
    const dados = {
        nome:      document.getElementById('rom-nome').value.trim().toUpperCase(),
        cpf:       document.getElementById('rom-cpf').value.trim(),
        empresa:   document.getElementById('rom-empresa').value.trim().toUpperCase(),
        placa:     document.getElementById('rom-placa').value.trim().toUpperCase(),
        carreta1:  document.getElementById('rom-carreta1').value.trim().toUpperCase(),
        carreta2:  document.getElementById('rom-carreta2').value.trim().toUpperCase(),
        serie1:    document.getElementById('rom-serie1').value.trim().toUpperCase(),
        serie2:    document.getElementById('rom-serie2').value.trim().toUpperCase(),
        serie3:    document.getElementById('rom-serie3').value.trim().toUpperCase(),
        serie4:    document.getElementById('rom-serie4').value.trim().toUpperCase(),
        serie5:    document.getElementById('rom-serie5').value.trim().toUpperCase(),
        serie6:    document.getElementById('rom-serie6').value.trim().toUpperCase(),
        observacao: document.getElementById('rom-obs').value.trim(),
        acesso:    acesso
    };
    if (!dados.nome || !dados.cpf || !dados.empresa || !dados.placa ||
        !dados.carreta1 || !dados.carreta2 || !dados.serie1 || !dados.serie2 ||
        !dados.serie3 || !dados.serie4 || !dados.serie5 || !dados.serie6 || !dados.observacao) {
        return notify('Preencha todos os campos antes de salvar.', 'aviso');
    }
    const result = await dbSalvar(TABELA_ROM, dados);
    if (result && result.ok) {
        notify(`${acesso} registrada com sucesso!`, 'sucesso');
        limparCampos('tela-romaneio');
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 2. PESQUISAR por Placa ou CPF ─────────────────────────────────────────────
async function romPesquisar() {
    const placa = document.getElementById('rom-placa').value.trim().toUpperCase();
    const cpf   = document.getElementById('rom-cpf').value.trim();

    if (!placa && !cpf) return notify('Digite a Placa ou CPF para pesquisar.', 'aviso');

    const filtros = placa ? { placa } : { cpf };
    const data = await dbBuscar(TABELA_ROM, filtros, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const u = data[0];
        document.getElementById('rom-nome').value      = u.nome     || '';
        document.getElementById('rom-cpf').value       = u.cpf      || '';
        document.getElementById('rom-empresa').value   = u.empresa  || '';
        document.getElementById('rom-placa').value     = u.placa    || '';
        document.getElementById('rom-carreta1').value  = u.carreta1 || '';
        document.getElementById('rom-carreta2').value  = u.carreta2 || '';
        notify('Registro localizado!', 'sucesso');
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
    }
}

// ── 3. FILTRO / RELATÓRIO ─────────────────────────────────────────────────────
function romAbrirFiltro() {
    document.getElementById('modal-rom').style.display = 'block';
}

function romFecharFiltro() {
    romLimparFiltro();
    document.getElementById('modal-rom').style.display = 'none';
}

function romLimparFiltro() {
    document.getElementById('rom-f-inicio').value = '';
    document.getElementById('rom-f-fim').value    = '';
    document.getElementById('rom-f-busca').value  = '';
    document.querySelector('#rom-tabela tbody').innerHTML = '';
    dadosRomGlobal = [];
}

async function romBuscarRelatorio() {
    const inicio = document.getElementById('rom-f-inicio').value;
    const fim    = document.getElementById('rom-f-fim').value;
    const busca  = document.getElementById('rom-f-busca').value.trim().toUpperCase();

    if (!inicio || !fim) return notify('Selecione o período.', 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };
    if (busca) filtros.placa_like = busca;

    const data = await dbBuscar(TABELA_ROM, filtros);
    if (data === null) return;

    if (data.length > 0) {
        dadosRomGlobal = data;
        _romRenderizarTabela(data);
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
        document.querySelector('#rom-tabela tbody').innerHTML = '';
    }
}

function _formatarData(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function _romRenderizarTabela(lista) {
    const tbody = document.querySelector('#rom-tabela tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';
        tr.innerHTML = `
            <td style="padding:7px 10px;">${_formatarData(item.data)}</td>
            <td style="padding:7px 10px;">${item.hora      || ''}</td>
            <td style="padding:7px 10px;">${item.nome      || ''}</td>
            <td style="padding:7px 10px;">${item.cpf       || ''}</td>
            <td style="padding:7px 10px;">${item.empresa   || ''}</td>
            <td style="padding:7px 10px;">${item.placa     || ''}</td>
            <td style="padding:7px 10px;">${item.carreta1  || '-'}</td>
            <td style="padding:7px 10px;">${item.carreta2  || '-'}</td>
            <td style="padding:7px 10px;">${item.serie1    || '-'}</td>
            <td style="padding:7px 10px;">${item.serie2    || '-'}</td>
            <td style="padding:7px 10px;">${item.serie3    || '-'}</td>
            <td style="padding:7px 10px;">${item.serie4    || '-'}</td>
            <td style="padding:7px 10px;">${item.serie5    || '-'}</td>
            <td style="padding:7px 10px;">${item.serie6    || '-'}</td>
            <td style="padding:7px 10px;">${item.observacao || ''}</td>
            <td style="padding:7px 10px; font-weight:700;">${item.acesso || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ── 4. EXPORTAR XLSX ─────────────────────────────────────────────────────────
function romExportarXLSX() {
    if (dadosRomGlobal.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    const cabecalho = ['Data','Hora','Nome','CPF','Empresa','Placa','Carreta1','Carreta2','Serie1','Serie2','Serie3','Serie4','Serie5','Serie6','Observação','Acesso'];
    const linhas = dadosRomGlobal.map(r => [
        _formatarData(r.data),
        r.hora       || '',
        r.nome       || '',
        String(r.cpf || ''),
        r.empresa    || '',
        r.placa      || '',
        r.carreta1   || '',
        r.carreta2   || '',
        r.serie1     || '',
        r.serie2     || '',
        r.serie3     || '',
        r.serie4     || '',
        r.serie5     || '',
        r.serie6     || '',
        r.observacao || '',
        r.acesso     || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Romaneio');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob  = new Blob([wbout], { type: 'application/octet-stream' });
    const link  = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'relatorio_p02_romaneio.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
}
