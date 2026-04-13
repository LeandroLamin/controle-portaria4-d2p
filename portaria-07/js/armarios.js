/**
 * PORTARIA 07 — CONTROLE DE ARMÁRIOS
 * Tabela: portaria-07-armarios
 * Depende: /conexao/config.js, /conexao/db.js, /js/ui.js
 */

const TABELA_ARM = 'portaria-07-armarios';
let dadosArmGlobal = [];

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    ['arm-armario', 'arm-bpu'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') armLocalizar();
        });
    });
});

// ── 1. LOCALIZAR por Nº Armário ou BPU ───────────────────────────────────────
async function armLocalizar() {
    const armario = document.getElementById('arm-armario').value.trim().toUpperCase();
    const bpu     = document.getElementById('arm-bpu').value.trim();

    if (!armario && !bpu) return notify('Digite o Nº Armário ou BPU para localizar.', 'aviso');

    const filtros = armario ? { armario } : { bpu };
    const data = await dbBuscar(TABELA_ARM, filtros, { order: 'id.desc' });

    if (!data || data.length === 0) {
        return notify('Registro não localizado na base.', 'aviso');
    }

    _armAbrirModalLocalizar(data);
}

let _armLocListaCompleta = [];

function _armAbrirModalLocalizar(lista) {
    _armLocListaCompleta = lista;
    document.getElementById('arm-loc-fabrica').selectedIndex = 0;
    const tbody = document.querySelector('#arm-loc-tabela tbody');
    tbody.innerHTML = '';

    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.cssText = 'border-bottom:1px solid #e8ecf0; cursor:pointer;';
        tr.addEventListener('mouseover',  () => { tr.style.background = '#e8f5f3'; });
        tr.addEventListener('mouseout',   () => { tr.style.background = ''; });
        tr.addEventListener('click', () => {
            _armPreencherFormulario(item);
            document.getElementById('modal-arm-localizar').style.display = 'none';
        });

        [
            item.nome        || '',
            item.bpu         || '',
            item.armario     || '',
            item.fabrica     || '',
            item.empresa     || '',
            item.situacao    || '',
            _formatarDataArm(item.data)
        ].forEach(val => {
            const td = document.createElement('td');
            td.style.padding = '8px 10px';
            td.textContent = val;
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    document.getElementById('arm-loc-count').textContent = lista.length;
    document.getElementById('modal-arm-localizar').style.display = 'block';
}

function armLocFiltrarFabrica() {
    const fab = document.getElementById('arm-loc-fabrica').value;
    const filtrado = fab ? _armLocListaCompleta.filter(i => i.fabrica === fab) : _armLocListaCompleta;
    const tbody = document.querySelector('#arm-loc-tabela tbody');
    tbody.innerHTML = '';
    filtrado.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.cssText = 'border-bottom:1px solid #e8ecf0; cursor:pointer;';
        tr.addEventListener('mouseover',  () => { tr.style.background = '#e8f5f3'; });
        tr.addEventListener('mouseout',   () => { tr.style.background = ''; });
        tr.addEventListener('click', () => {
            _armPreencherFormulario(item);
            document.getElementById('modal-arm-localizar').style.display = 'none';
        });
        [
            item.nome || '', item.bpu || '', item.armario || '',
            item.fabrica || '', item.empresa || '', item.situacao || '',
            _formatarDataArm(item.data)
        ].forEach(val => {
            const td = document.createElement('td');
            td.style.padding = '8px 10px';
            td.textContent = val;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    document.getElementById('arm-loc-count').textContent = filtrado.length;
}

function _armPreencherFormulario(u) {
    document.getElementById('arm-nome').value        = u.nome        || '';
    document.getElementById('arm-bpu').value         = u.bpu         || '';
    document.getElementById('arm-armario').value     = u.armario     || '';
    document.getElementById('arm-empresa').value     = u.empresa     || '';
    document.getElementById('arm-setor').value       = u.setor       || '';
    document.getElementById('arm-vestiario').value   = u.vestiario   || '';
    document.getElementById('arm-genero').value      = u.genero      || '';
    document.getElementById('arm-turno').value       = u.turno       || '';
    document.getElementById('arm-responsavel').value = u.responsavel || '';
    document.getElementById('arm-situacao').value    = u.situacao    || '';
    document.getElementById('arm-fone').value        = u.fone        || '';
    document.getElementById('arm-ramal').value       = u.ramal       || '';
    document.getElementById('arm-vigilante').value   = u.vigilante   || '';
    document.getElementById('arm-obs').value         = u.obs         || '';
    notify('Registro selecionado!', 'sucesso');
}

// ── 2. SALVAR ─────────────────────────────────────────────────────────────────
async function armSalvar() {
    const agora = new Date();
    const dados = {
        nome:        document.getElementById('arm-nome').value.trim().toUpperCase(),
        bpu:         document.getElementById('arm-bpu').value.trim().toUpperCase(),
        armario:     document.getElementById('arm-armario').value.trim().toUpperCase(),
        empresa:     document.getElementById('arm-empresa').value.trim().toUpperCase(),
        setor:       document.getElementById('arm-setor').value.trim().toUpperCase(),
        vestiario:   document.getElementById('arm-vestiario').value,
        genero:      document.getElementById('arm-genero').value,
        turno:       document.getElementById('arm-turno').value.trim().toUpperCase(),
        responsavel: document.getElementById('arm-responsavel').value.trim().toUpperCase(),
        situacao:    document.getElementById('arm-situacao').value,
        fone:        document.getElementById('arm-fone').value.trim(),
        ramal:       document.getElementById('arm-ramal').value.trim(),
        vigilante:   document.getElementById('arm-vigilante').value,
        obs:         document.getElementById('arm-obs').value.trim().toUpperCase(),
        data:        agora.toLocaleDateString('en-CA'),
        hora:        agora.toTimeString().slice(0, 8)
    };

    if (!dados.nome || !dados.armario || !dados.situacao) {
        return notify('Preencha Nome, Nº Armário e Situação antes de salvar.', 'aviso');
    }

    const result = await dbSalvar(TABELA_ARM, dados);
    if (result && result.ok) {
        notify('Armário registrado com sucesso!', 'sucesso');
        limparCampos('tela-armarios');
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 3. RELATÓRIO — CONTROLES ──────────────────────────────────────────────────
function armAbrirRelatorio() {
    document.getElementById('modal-arm').style.display = 'block';
    const hoje = new Date().toLocaleDateString('en-CA');
    if (!document.getElementById('arm-f-inicio').value) document.getElementById('arm-f-inicio').value = hoje;
    if (!document.getElementById('arm-f-fim').value)    document.getElementById('arm-f-fim').value    = hoje;
}

function armFecharRelatorio() {
    armLimparFiltro();
    document.getElementById('modal-arm').style.display = 'none';
}

function armLimparFiltro() {
    document.getElementById('arm-f-inicio').value  = '';
    document.getElementById('arm-f-fim').value     = '';
    document.getElementById('arm-f-busca').value   = '';
    document.getElementById('arm-f-fabrica').selectedIndex = 0;
    document.querySelector('#arm-tabela-resultados tbody').innerHTML = '';
    dadosArmGlobal = [];
}

// ── 4. BUSCAR RELATÓRIO ───────────────────────────────────────────────────────
async function armBuscarRelatorio() {
    const inicio  = document.getElementById('arm-f-inicio').value;
    const fim     = document.getElementById('arm-f-fim').value;
    const busca   = document.getElementById('arm-f-busca').value.trim().toUpperCase();
    const fabrica = document.getElementById('arm-f-fabrica').value;

    if (!inicio || !fim) return notify('Selecione o período.', 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };
    if (fabrica) filtros.fabrica = fabrica;
    if (busca) {
        if (/^\d+$/.test(busca)) {
            filtros.armario = busca;
        } else {
            filtros.nome_like = busca;
        }
    }

    const data = await dbBuscar(TABELA_ARM, filtros, { order: 'id.desc' });
    if (data === null) return;

    if (data.length > 0) {
        dadosArmGlobal = data;
        _armRenderizarTabela(data);
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
        document.querySelector('#arm-tabela-resultados tbody').innerHTML = '';
    }
}

// ── 5. RENDERIZAR TABELA ──────────────────────────────────────────────────────
function _formatarDataArm(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function _armRenderizarTabela(lista) {
    const tbody = document.querySelector('#arm-tabela-resultados tbody');
    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e8ecf0';
        [
            [_formatarDataArm(item.data), false], [item.hora || '', false],
            [item.nome || '', false], [item.bpu || '', false],
            [item.armario || '', false], [item.fabrica || '', false],
            [item.empresa || '', false], [item.setor || '', false],
            [item.vestiario || '', false], [item.genero || '', false],
            [item.turno || '', false], [item.responsavel || '', false],
            [item.situacao || '', true], [item.fone || '', false],
            [item.ramal || '', false], [item.vigilante || '', false],
            [item.obs || '', false]
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

// ── 6. EXPORTAR XLSX ─────────────────────────────────────────────────────────
function armExportarXLSX() {
    if (dadosArmGlobal.length === 0) return notify('Busque os dados primeiro.', 'aviso');

    const cabecalho = ['Data','Hora','Nome','BPU','Nº Armário','Fábrica','Empresa','Setor','Vestiário','Gênero','Turno','Responsável','Situação','Telefone','Ramal','Vigilante','OBS'];
    const linhas = dadosArmGlobal.map(r => [
        _formatarDataArm(r.data),
        r.hora        || '',
        r.nome        || '',
        r.bpu         || '',
        r.armario     || '',
        r.fabrica     || '',
        r.empresa     || '',
        r.setor       || '',
        r.vestiario   || '',
        r.genero      || '',
        r.turno       || '',
        r.responsavel || '',
        r.situacao    || '',
        r.fone        || '',
        r.ramal       || '',
        r.vigilante   || '',
        r.obs         || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Armários');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob  = new Blob([wbout], { type: 'application/octet-stream' });
    const link  = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'relatorio_p07_armarios.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
}
