// js/auth.js

async function fazerLogin() {
    const user = document.getElementById('user-login').value;
    const pass = document.getElementById('user-pass').value;
    
    // O _supabase aqui é "herdado" do config.js que você acabou de criar
    const { data } = await _supabase.from('usuarios').select('*').eq('login', user).eq('senha', pass).single();
    
    if (data) {
        document.getElementById('tela-login').style.display = 'none';
        document.getElementById('sistema-principal').style.display = 'block';
        document.getElementById('nome-logado').innerText = data.nome_completo;
        document.body.classList.add('sistema-aberto');
    } else { 
        alert("Login inválido!"); 
    }
}
