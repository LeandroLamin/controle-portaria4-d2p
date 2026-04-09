/**
 * PORTARIA 05 — CVU
 * Tabela: portaria-05-acessos
 * Regra: Ordenação por ID Decrescente (Mais recente primeiro)
 */

const TABELA_P05 = 'portaria-05-acessos';
let dadosFiltradosGlobal = [];

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const cpfInput = document.getElementById('p05-cpf');
    if (cpfInput) {
        cpfInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') localizar();
        });
    }
});

// ── 1. LOCALIZAR por CPF ──────────────────────────────────────────────────────
async function localizar() {
    const cpf = document.getElementById('p05-cpf').value.trim();
    if (!cpf) return notify('Digite o CPF para localizar.', 'aviso');

    // Busca o último registro desse CPF (ID mais alto)
    const data = await dbBuscar(TABELA_P05, { cpf }, { order: 'id.desc', limit: 1 });

    if (data && data.length > 0) {
        const u = data[0];
        document.getElementById('p05-nome').value        = u.nome        || '';
        document.getElementById('p05-empresa').value     = u.empresa     || '';
        document.getElementById('p05-responsavel').value = u.responsavel || '';
        document.getElementById('p05-num-cracha').value  = u.num_cracha  || '';
        document.getElementById('p05-vigilante').value   = u.vigilante   || '';
        
        // Mantém "Selecione" vazio para obrigar preenchimento do novo acesso
        document.getElementById('p05-motivo').value   = '';
        document.getElementById('p05-liberado').value = '';
        
        notify('Cadastro localizado! Preencha Motivo e Acesso.', 'sucesso');
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
        data:        agora.toLocaleDateString('en-CA'), // Formato YYYY-MM-DD
        hora:        agora.toTimeString().slice(0, 8)
    };

    if (!dados.nome || !dados.cpf || !dados.acesso || !dados.motivo) {
        return notify('Campos Nome, CPF, Motivo e Acesso são obrigatórios.', 'aviso');
    }

    const result = await dbSalvar(TABELA_P05, dados);
    if (result && result.ok) {
        notify('Acesso registrado com sucesso!', 'sucesso');
        p05Limpar();
    } else {
        notify('Erro ao salvar no servidor.', 'erro');
    }
}

// ── 3. LIMPAR TELA ────────────────────────────────────────────────────────────
function p05Limpar() {
    const ids = ['p05-nome','p05-cpf','p05-empresa','p05-responsavel','p05-num-cracha','p05-vigilante','p05-obs','p05-motivo','p05-liberado','p05-acesso'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

// ── 4. RELATÓRIO — CONTROLES ──────────────────────────────────────────────────
function p05AbrirRelatorio() {
    document.getElementById('modal-p05').style.display = 'block';
    const hoje = new Date().toLocaleDateString('en-CA');
    document.getElementById('filtro-inicio').value = hoje;
    document.getElementById('filtro-fim').value = hoje;
}

function p05FecharRelatorio() {
    document.getElementById('modal-p05').style.display = 'none';
}

function p05LimparFiltro() {
    document.getElementById('filtro-inicio').value = '';
    document.getElementById('filtro-fim').value = '';
    document.getElementById('filtro-nome').value = '';
    document.querySelector('#tabela-resultados tbody').innerHTML = '';
}

async function buscarRelatorio() {
    const inicio = document.getElementById('filtro-inicio').value;
    const fim    = document.getElementById('filtro-fim').value;
    const busca  = document.getElementById('filtro-nome').value.trim().toUpperCase();

    if (!inicio || !fim) return notify('Selecione o período.', 'aviso');

    const filtros = { data_gte: inicio, data_lte: fim };
    if (busca) {
        filtros[/^\d+$/.test(busca) ? 'cpf' : 'nome_like'] = busca;
    }

    const data = await dbBuscar(TABELA_P05, filtros, { order: 'id.desc' });
    
    if (data && data.length > 0) {
        dadosFiltradosGlobal = data;
        renderizarTabela(data);
    } else {
        notify('Nenhum registro encontrado.', 'aviso');
        document.querySelector('#tabela-resultados tbody').innerHTML = '';
    }
}

// ── 5. RENDERIZAR TABELA (CORREÇÃO DE DADOS FALTANTES) ───────────────────────
function renderizarTabela(lista) {
    const tbody = document.querySelector('#tabela-resultados tbody');
    tbody.innerHTML = '';
    
    lista.forEach(item => {
        // Formata a data de YYYY-MM-DD para DD/MM/YYYY
        const dataFormatada = item.data ? item.data.split('-').reverse().join('/') : '';
        const horaFormatada = item.hora ? item.hora.slice(0, 5) : '';

        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding:8px;">${dataFormatada}</td>
                <td style="padding:8px;">${horaFormatada}</td>
                <td style="padding:8px;">${item.cpf || ''}</td>
                <td style="padding:8px;">${item.nome || ''}</td>
                <td style="padding:8px;">${item.empresa || ''}</td>
                <td style="padding:8px;">${item.responsavel || ''}</td>
                <td style="padding:8px;">${item.motivo || ''}</td>
                <td style="padding:8px;">${item.liberado || ''}</td>
                <td style="padding:8px;">${item.num_cracha || ''}</td>
                <td style="padding:8px;">${item.vigilante || ''}</td>
                <td style="padding:8px;">${item.obs || ''}</td>
                <td style="padding:8px; font-weight:700; color:${item.acesso === 'ENTRADA' ? '#27ae60' : '#e03030'};">
                    ${item.acesso || ''}
                </td>
            </tr>`;
    });
}

// ── 6. EXPORTAR EXCEL ─────────────────────────────────────────────────────────
function exportarExcel() {
    if (dadosFiltradosGlobal.length === 0) return notify('Busque os dados primeiro.', 'aviso');
    let csv = '\uFEFFData;Hora;CPF;Nome;Empresa;Responsável;Motivo;Liberado;Crachá;Vigilante;OBS;Acesso\n';
    dadosFiltradosGlobal.forEach(r => {
        csv += `${r.data};${r.hora};${r.cpf};${r.nome};${r.empresa};${r.responsavel};${r.motivo};${r.liberado};${r.num_cracha};${r.vigilante};${r.obs};${r.acesso}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_p05_${new Date().getTime()}.csv`;
    link.click();
}
