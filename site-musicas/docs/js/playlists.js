import { API_URL } from './config.js';

// Função principal
export function iniciarPlaylists() {
    const container = document.getElementById('tela-playlists');
    if (!container) return;

    // Monta a estrutura da tela de playlists
    container.innerHTML = `
        <h2>Gerenciar Playlists</h2>
        
        <!-- Formulário para Criar Playlist -->
        <form id="form-criar-playlist" style="margin-bottom: 20px;">
            <input type="text" id="nome-playlist" placeholder="Nome da Playlist" required style="padding: 8px; margin-right: 5px;">
            <input type="text" id="desc-playlist" placeholder="Descrição (opcional)" style="padding: 8px; margin-right: 5px;">
            <button type="submit" style="padding: 8px 12px;">Criar Playlist</button>
        </form>

        <hr>

        <!-- Lista de Playlists -->
        <h3>Suas Playlists</h3>
        <div id="lista-playlists">Carregando playlists...</div>

        <!-- Detalhes da Playlist selecionada -->
        <div id="detalhe-playlist" style="margin-top: 20px;"></div>
    `;

    // Ativa o formulário de criar playlist
    const formCriar = document.getElementById('form-criar-playlist');
    formCriar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome-playlist').value;
        const descricao = document.getElementById('desc-playlist').value;

        try {
            const resposta = await fetch(`${API_URL}/api/playlists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, descricao })
            });
            const resultado = await resposta.json();
            
            if (resultado.sucesso) {
                document.getElementById('nome-playlist').value = '';
                document.getElementById('desc-playlist').value = '';
                carregarPlaylists();
            } else {
                alert('Erro: ' + resultado.erro);
            }
        } catch (erro) {
            console.error('Erro ao criar playlist:', erro);
        }
    });

    // Carrega as playlists existentes
    carregarPlaylists();
}

// Função para buscar e listar as playlists da API
async function carregarPlaylists() {
    const listaDiv = document.getElementById('lista-playlists');
    if (!listaDiv) return;

    try {
        const resposta = await fetch(`${API_URL}/api/playlists`);
        const resultado = await resposta.json();

        if (resultado.sucesso) {
            if (resultado.dados.length === 0) {
                listaDiv.innerHTML = '<p>Nenhuma playlist encontrada.</p>';
                return;
            }

            listaDiv.innerHTML = '';
            resultado.dados.forEach(playlist => {
                const item = document.createElement('div');
                item.className = 'playlist-item';
                item.innerHTML = `
                    <h3>${playlist.nome}</h3>
                    <p>${playlist.descricao || ''}</p>
                    <span>${playlist.totalMusicas || 0} músicas</span><br><br>
                    <button onclick="abrirPlaylist(${playlist.id})">Ver / Adicionar Músicas</button>
                    <button onclick="excluirPlaylist(${playlist.id})">Excluir</button>
                `;
                listaDiv.appendChild(item);
            });
        }
    } catch (erro) {
        listaDiv.innerHTML = '<p>Servidor ainda não conectado ou offline.</p>';
        console.error('Erro ao carregar playlists:', erro);
    }
}

// Apagar Playlist
window.excluirPlaylist = async function(id) {
    if (!confirm('Tem certeza que deseja apagar esta playlist?')) return;

    try {
        const resposta = await fetch(`${API_URL}/api/playlists/${id}`, {
            method: 'DELETE'
        });
        const resultado = await resposta.json();
        if (resultado.sucesso) {
            document.getElementById('detalhe-playlist').innerHTML = '';
            carregarPlaylists();
        } else {
            alert('Erro ao excluir: ' + resultado.erro);
        }
    } catch (erro) {
        console.error('Erro ao excluir playlist:', erro);
    }
};

// Abrir Playlist para ver as músicas
window.abrirPlaylist = async function(id) {
    try {
        const resposta = await fetch(`${API_URL}/api/playlists/${id}`);
        const resultado = await resposta.json();

        if (resultado.sucesso) {
            const p = resultado.dados;
            const container = document.getElementById('detalhe-playlist');
            if (!container) return;

            let htmlMusicas = p.musicas ? p.musicas.map(m => `
                <li>
                    <strong>${m.nome}</strong> (${m.formato}) 
                    <button onclick="removerMusica(${p.id}, ${m.id})">Remover</button>
                </li>
            `).join('') : '';

            container.innerHTML = `
                <div style="border: 2px dashed #007bff; padding: 15px; border-radius: 8px;">
                    <h2>Playlist: ${p.nome}</h2>
                    <p>${p.descricao || 'Sem descrição'}</p>
                    
                    <h4>Músicas na playlist:</h4>
                    <ul>${htmlMusicas.length ? htmlMusicas : '<li>Nenhuma música adicionada ainda.</li>'}</ul>

                    <button onclick="tocarPlaylist(${JSON.stringify(p.musicas || []).replace(/"/g, '&quot;')})">▶ Tocar Playlist</button>
                </div>
            `;
        }
    } catch (erro) {
        console.error('Erro ao abrir playlist:', erro);
    }
};

// Remover música da playlist
window.removerMusica = async function(playlistId, musicaId) {
    try {
        const resposta = await fetch(`${API_URL}/api/playlists/${playlistId}/musicas/${musicaId}`, {
            method: 'DELETE'
        });
        const resultado = await resposta.json();
        if (resultado.sucesso) {
            window.abrirPlaylist(playlistId);
        }
    } catch (erro) {
        console.error('Erro ao remover música:', erro);
    }
};

// Tocar a playlist no Player (Pessoa 3)
window.tocarPlaylist = function(musicas) {
    if (!musicas || musicas.length === 0) {
        alert('A playlist está vazia!');
        return;
    }
    if (window.tocarFila && typeof window.tocarFila === 'function') {
        window.tocarFila(musicas, 0);
    } else {
        alert('Player de áudio ainda não integrado.');
    }
};
