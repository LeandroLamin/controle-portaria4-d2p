// conexao/crypto.js
// ============================================================
// HASH DE SENHA — SHA-256 com login como salt
// Uso: const hash = await hashSenha('leandro', 'minhasenha')
// ============================================================

async function hashSenha(login, senha) {
    const encoder = new TextEncoder();
    const data = encoder.encode(login.toLowerCase() + ':' + senha);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
