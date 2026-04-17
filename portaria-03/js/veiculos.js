/**
 * PORTARIA 03 — ABA ACESSO DE VEÍCULOS
 * Tabela: portaria-03-veiculos
 */

const TABELA_V03 = 'portaria-03-veiculos';
let v03DadosFiltrados = [];

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    ['v03-placa', 'v03-cpf'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') v03Localizar();
        });
    });
});

// ── 1. LOCALIZAR por Placa ou CPF ────────────────────────────────────────────
async function v03Localizar() {
    const placa = document.getElementById('v03-placa').value.trim().toUpperCase();
    const cpf   = document.getElementById('v03-cpf').value.trim();

    if (!placa && !cpf) return notify('Digite a placa ou CPF para localizar.', 'aviso');

    const filtros = placa ? { placa } : { cpf };
    const data = await dbBuscar(TABELA_V03, filtros, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const u = data[0];
        document.getElementById('v03-placa').value     = u.placa      || '';
        document.getElementById('v03-tipo').value      = u.tipo       || '';
        document.getElementById('v03-cor').value       = u.cor        || '';
        document.getElementById('v03-motorista').value = u.motorista  || '';
        document.getElementById('v03-cpf').value       = u.cpf        || '';
        document.getElementById('v03-empresa').value   = u.empresa    || '';
        document.getElementById('v03-destino').value   = u.destino    || '';
        document.getElementById('v03-motivo').value    = u.motivo     || '';
        document.getElementById('v03-vigilante').value = u.vigilante  || '';
        notify('Veículo localizado!', 'sucesso');
    } else {
        notify('Placa não localizada na base.', 'aviso');
    }
}

// ── 2. SALVAR ─────────────────────────────────────────────────────────────────
async function v03Salvar() {
    const agora = new Date();
    const dados = {
        placa:     document.getElementById('v03-placa').value.trim().toUpperCase(),
        tipo:      document.getElementById('v03-tipo').value,
        cor:       document.getElementById('v03-cor').value.trim().toUpperCase(),
        motorista: document.getElementById('v03-motorista').value.trim().toUpperCase(),
        cpf:       document.getElementById('v03-cpf').value.trim(),
        empresa:   document.getElementById('v03-empresa').value.trim().toUpperCase(),
        destino:   document.getElementById('v03-destino').value.trim().toUpperCase(),
        motivo:    document.getElementById('v03-motivo').value,
        vigilante: document.getElementById('v03-vigilante').value.trim().toUpperCase(),
        obs:       document.getElementById('v03-obs').value.trim().toUpperCase(),
        acesso:    document.getElementById('v03-acesso').value,
        data:      agora.toLocaleDateString('en-CA'),
        hora:      agora.toTimeString().slice(0, 8)
    };

    if (!dados.placa || !dados.motorista || !dados.acesso || !dados.motivo) {
        return notify('Preencha os campos obrigatórios: Placa, Motorista, Motivo e Acesso.', 'aviso');
    }

    const result = await dbSalvar(TABELA_V03, dados);
    if (result && result.ok) {
        notify('Acesso de veículo registrado com sucesso!', 'sucesso');
        v03Limpar();
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 3. LIMPAR TELA ────────────────────────────────────────────────────────────
function v03Limpar() {
    ['v03-placa','v03-tipo','v03-cor','v03-motorista','v03-cpf','v03-empresa','v03-destino','v03-motivo','v03-vigilante','v03-obs','v03-acesso'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

// ── 4. RELATÓRIO ─────────────────────────────────────────────────────────────
function v03AbrirRelatorio() {
    document.getElementById('modal-v03').style.display = 'block';
    const hoje = new Date().toLocaleDateString('en-CA');
    document.getElementById('v-filtro-inicio').value = hoje;
    document.getElementById('v-filtro-fim').value    = hoje;
}

function v03FecharRelatorio() {
    v03LimparFiltro();
    document.getElementById('modal-v03').style.display = 'none';
}

function v03LimparFiltro() {
    document.getElementById('v-filtro-inicio').value = '';
    document.getElementById('v-filtro-fim').value    = '';
    document.getElementById('v-filtro-busca').value  = '';
    document.querySelector('#tabela-v03 tbody').innerHTML = '';
    v03DadosFiltrados = [];
}

// ── 5. BUSCAR RELATÓRIO ───────────────────────────────────────────────────────
async function v03BuscarRelatorio() {
    const inicio = document.getElementById('v-filtro-inicio').value;
    const fim    = document.getElementById('v-filtro-fim').value;
    const busca  = document.getElementById('v-filtro-busca').value.trim().toUpperCase();

    if (!inicio || !fim) return notify('Selecione o período.', 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };
    if (busca) {
        filtros[/^[A-Z]{3}/.test(busca) ? 'placa' : 'motorista_like'] = busca;
    }

    const data = await dbBuscar(TABELA_V03, filtros, { order: 'id.desc' });
    if (data === null) return;

    if (data.length > 0) {
        v03DadosFiltrados = data;
        v03RenderizarTabela(data);
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
        document.querySelector('#tabela-v03 tbody').innerHTML = '';
    }
}

// ── 6. RENDERIZAR TABELA ──────────────────────────────────────────────────────
function _v03FormatarData(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function v03RenderizarTabela(lista) {
    const tbody = document.querySelector('#tabela-v03 tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';
        [
            [_v03FormatarData(item.data), false], [item.hora || '', false],
            [item.placa || '', true], [item.tipo || '', false],
            [item.cor || '', false], [item.motorista || '', false],
            [item.cpf || '', false], [item.empresa || '', false],
            [item.destino || '', false], [item.motivo || '', false],
            [item.vigilante || '', false], [item.obs || '', false],
            [item.acesso || '', true]
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
function v03ExportarExcel() {
    if (v03DadosFiltrados.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    const cabecalho = ['Data','Hora','Placa','Tipo','Cor','Motorista','CPF','Empresa','Destino','Motivo','Vigilante','OBS','Acesso'];
    const linhas = v03DadosFiltrados.map(r => [
        _v03FormatarData(r.data),
        r.hora       || '',
        r.placa      || '',
        r.tipo       || '',
        r.cor        || '',
        r.motorista  || '',
        String(r.cpf || ''),
        r.empresa    || '',
        r.destino    || '',
        r.motivo     || '',
        r.vigilante  || '',
        r.obs        || '',
        r.acesso     || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Veículos P03');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob  = new Blob([wbout], { type: 'application/octet-stream' });
    const link  = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'relatorio_veiculos_p03.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
}
