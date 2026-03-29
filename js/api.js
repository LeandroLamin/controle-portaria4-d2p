// js/api.js - Função Localizar corrigida
async function localizar() {
    let cpfVal = document.getElementById('cpf').value.replace(/\D/g, '');
    if(!cpfVal) return alert("Digite um CPF");
    
    // Ordenamos pelo ID de forma decrescente (o maior ID é o último salvo)
    const { data, error } = await _supabase
        .from('acessos')
        .select('nome, empresa, responsavel')
        .eq('cpf', cpfVal)
        .order('id', { ascending: false }) 
        .limit(1);
    
    if (data && data.length > 0) {
        document.getElementById('nome').value = data[0].nome || '';
        document.getElementById('empresa').value = data[0].empresa || '';
        document.getElementById('responsavel').value = data[0].responsavel || '';
    } else { 
        alert("CPF não localizado."); 
    }
}
