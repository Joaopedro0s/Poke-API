const API_BASE = "https://pokeapi.co/api/v2/";

const menuItems = document.querySelectorAll("#menu li");
const searchContainer = document.getElementById("search-container");
const searchInput = document.getElementById("search-input");
const btnSearch = document.getElementById("btn-search");
const resultado = document.getElementById("resultado");
const pokedexBody = document.getElementById("pokedex-body");
const leftHalf = document.getElementById("left-half");
const rightHalf = document.getElementById("right-half");

// Elementos do minigame
const minigameBtn = document.getElementById("minigame-btn");
const minigameContainer = document.getElementById("minigame-container");
const pokemonShadowImg = document.getElementById("pokemon-shadow");
const pokemonRevealedImg = document.getElementById("pokemon-revealed");
const guessInput = document.getElementById("guess-input");
const btnGuess = document.getElementById("btn-guess");
const minigameFeedback = document.getElementById("minigame-feedback");
const btnNextPokemon = document.getElementById("btn-next-pokemon");

let currentApiEndpoint = null;
let currentPokemon = null;
let isLoadingPokemon = false;

const placeholders = {
    "pokemon": "Digite o nome ou ID do Pokémon",
    "pokemon-species": "Digite o nome ou ID da espécie",
    "type": "Digite o nome ou ID do tipo",
    "move": "Digite o nome ou ID do movimento",
    "ability": "Digite o nome ou ID da habilidade",
    "item": "Digite o nome ou ID do item",
    "evolution-chain": "Digite o ID da cadeia de evolução",
    "generation": "Digite o nome ou ID da geração",
    "location": "Digite o nome ou ID da localização",
    "region": "Digite o nome ou ID da região",
};

function openPokedex() {
    setTimeout(() => {
        pokedexBody.classList.add("pokedex-open");
        leftHalf.style.transform = "translateX(-100%) translateY(-50%)";
        rightHalf.style.transform = "translateX(100%) translateY(-50%)";
    }, 500);

    setTimeout(() => {
        leftHalf.style.display = "none";
        rightHalf.style.display = "none";
        document.body.style.overflow = "auto";
    }, 1500);
}

window.addEventListener("load", openPokedex);

menuItems.forEach(item => {
    item.addEventListener("click", () => {
        menuItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        resultado.innerHTML = ""; // Limpa o resultado anterior

        if (item.id !== "minigame-btn") {
            searchContainer.classList.remove("hidden");
            resultado.classList.remove("hidden");
            minigameContainer.classList.add("hidden");

            currentApiEndpoint = item.dataset.api;
            searchInput.value = "";
            searchInput.placeholder = placeholders[currentApiEndpoint];
            searchInput.focus();

            // Lógica para exibir os cards de pré-visualização
            displayPreviewCards(currentApiEndpoint);
            
        } else {
            searchContainer.classList.add("hidden");
            resultado.classList.add("hidden");
            minigameContainer.classList.remove("hidden");
            startMinigame();
        }
    });
});

btnSearch.addEventListener("click", () => {
    if (!currentApiEndpoint) {
        alert("Selecione uma categoria para pesquisar primeiro.");
        return;
    }
    pesquisar(currentApiEndpoint, searchInput.value.trim().toLowerCase());
});

searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        btnSearch.click();
    }
});

// Nova função para exibir os cards de pré-visualização
async function displayPreviewCards(endpoint) {
    resultado.innerHTML = "<p>Carregando...</p>";
    
    // A maioria das APIs usa a URL base + endpoint para obter a lista.
    const url = API_BASE + endpoint + "?limit=3";

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Não foi possível carregar a pré-visualização.");
        const data = await res.json();
        
        let cardHtml = '<div class="preview-cards-container">';
        
        // Mapeia os resultados da API para gerar os cards
        const itemsToDisplay = data.results || data; // 'results' para listas, 'data' para casos específicos
        
        for (const item of itemsToDisplay) {
            let name = item.name;
            let imageUrl = '';
            
            // Lógica para obter a imagem de cada item
            if (endpoint === 'pokemon') {
                const pokemonRes = await fetch(item.url);
                const pokemonData = await pokemonRes.json();
                imageUrl = pokemonData.sprites.front_default;
            } else if (endpoint === 'item') {
                const itemRes = await fetch(item.url);
                const itemData = await itemRes.json();
                imageUrl = itemData.sprites.default;
            }
            
            cardHtml += `
                <div class="preview-card">
                    <h3>${name}</h3>
                    ${imageUrl ? `<img src="${imageUrl}" alt="${name}" />` : ''}
                </div>
            `;
        }
        
        cardHtml += '</div>';
        resultado.innerHTML = cardHtml;
        
    } catch(err) {
        resultado.innerHTML = `<p style="color:red;">Erro ao carregar pré-visualização: ${err.message}</p>`;
    }
}


// Lógica do Minigame (mantida do passo anterior)
async function startMinigame() {
    if (isLoadingPokemon) return;
    isLoadingPokemon = true;

    minigameFeedback.textContent = "";
    minigameFeedback.classList.remove("correct", "wrong");
    guessInput.value = "";
    btnGuess.disabled = false;
    guessInput.disabled = false;
    btnNextPokemon.classList.add("hidden");

    pokemonRevealedImg.classList.add("hidden");
    pokemonRevealedImg.classList.remove("show");

    const randomId = Math.floor(Math.random() * 898) + 1;
    const url = API_BASE + "pokemon/" + randomId;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Falha ao carregar Pokémon para o minigame.");
        const data = await res.json();

        currentPokemon = data.name.toLowerCase();
        const spriteUrl = data.sprites.front_default;
        
        if (spriteUrl) {
            pokemonShadowImg.src = spriteUrl;
            pokemonRevealedImg.src = spriteUrl;
            pokemonShadowImg.style.display = "block";
        } else {
            throw new Error("Sprite do Pokémon não encontrado.");
        }

    } catch (err) {
        minigameFeedback.textContent = `Erro ao carregar: ${err.message}`;
        minigameFeedback.classList.add("wrong");
        pokemonShadowImg.src = "";
        currentPokemon = null;
    } finally {
        isLoadingPokemon = false;
    }
}

btnGuess.addEventListener("click", checkGuess);
guessInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        checkGuess();
    }
});

btnNextPokemon.addEventListener("click", startMinigame);

function checkGuess() {
    if (!currentPokemon || guessInput.disabled) return;

    const userGuess = guessInput.value.trim().toLowerCase();

    if (userGuess === currentPokemon) {
        minigameFeedback.textContent = `Correto! É o ${currentPokemon.toUpperCase()}!`;
        minigameFeedback.classList.remove("wrong");
        minigameFeedback.classList.add("correct");
        revealPokemon();
        playPokemonCry(currentPokemon); // Adiciona o som
    } else {
        minigameFeedback.textContent = "Errado! Tente novamente.";
        minigameFeedback.classList.remove("correct");
        minigameFeedback.classList.add("wrong");
    }
}

function revealPokemon() {
    btnGuess.disabled = true;
    guessInput.disabled = true;

    pokemonShadowImg.style.display = "none";
    pokemonRevealedImg.classList.remove("hidden");
    pokemonRevealedImg.classList.add("show");

    setTimeout(() => {
        btnNextPokemon.classList.remove("hidden");
    }, 1000);
}

// Funções de pesquisa existentes
async function pesquisar(tipo, termo) {
    if (!termo) {
        resultado.innerHTML = "<p style='color:red;'>Digite um termo para buscar.</p>";
        return;
    }

    resultado.innerHTML = "<p>Carregando...</p>";

    let url = API_BASE + tipo + "/" + termo;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Nenhum resultado encontrado para "${termo}" em ${tipo}`);
        const data = await res.json();

        resultado.innerHTML = montarResultado(tipo, data);

        // Se o tipo for 'pokemon', reproduza o som
        if (tipo === "pokemon") {
            playPokemonCry(data.name);
        }

    } catch (err) {
        resultado.innerHTML = `<p style="color:red;">Erro: ${err.message}</p>`;
    }
}

// NOVA FUNÇÃO: Reproduz o som do Pokémon
function playPokemonCry(pokemonName) {
    const normalizedName = pokemonName.toLowerCase().replace(/['.]/g, '');
    const audio = new Audio(`https://play.pokemonshowdown.com/audio/cries/${normalizedName}.mp3`);
    audio.volume = 0.5; // Ajuste o volume se necessário
    audio.play().catch(e => console.error("Erro ao reproduzir áudio:", e));
}

function montarResultado(tipo, data) {
    switch(tipo) {
        case "pokemon":
            return `
                <h2>${data.name.toUpperCase()} (#${data.id})</h2>
                <img src="${data.sprites.front_default}" alt="${data.name}" />
                <p><strong>Tipos:</strong> ${data.types.map(t => t.type.name).join(", ")}</p>
                <p><strong>Habilidades:</strong> ${data.abilities.map(a => a.ability.name).join(", ")}</p>
                <p><strong>Movimentos (${data.moves.length}):</strong></p>
                <ul class="moves-list">
                    ${data.moves.map(m => `<li>${m.move.name}</li>`).join("")}
                </ul>
                <p><strong>Altura:</strong> ${data.height / 10} m</p>
                <p><strong>Peso:</strong> ${data.weight / 10} kg</p>
            `;
        case "pokemon-species":
            return `
                <h2>${data.name.toUpperCase()} (Espécie)</h2>
                <p><strong>Cor:</strong> ${data.color.name}</p>
                <p><strong>Habitat:</strong> ${data.habitat ? data.habitat.name : "Desconhecido"}</p>
                <p><strong>Geração:</strong> ${data.generation.name}</p>
                <p><strong>Captura rate:</strong> ${data.capture_rate}</p>
            `;
        case "type":
            return `
                <h2>Tipo: ${data.name.toUpperCase()}</h2>
                <p><strong>Moves Damage Class:</strong> ${data.damage_class ? data.damage_class.name : "Desconhecido"}</p>
                <p><strong>Pokémons deste tipo (máx 10):</strong> ${data.pokemon.slice(0,10).map(p => p.pokemon.name).join(", ")}</p>
            `;
        case "move":
            return `
                <h2>Movimento: ${data.name.toUpperCase()}</h2>
                <p><strong>Tipo:</strong> ${data.type.name}</p>
                <p><strong>Categoria:</strong> ${data.damage_class.name}</p>
                <p><strong>Poder:</strong> ${data.power || "—"}</p>
                <p><strong>Precisão:</strong> ${data.accuracy || "—"}</p>
                <p><strong>Efeito:</strong> ${data.effect_entries.find(e => e.language.name === "en")?.effect || "Sem descrição"}</p>
            `;
        case "ability":
            return `
                <h2>Habilidade: ${data.name.toUpperCase()}</h2>
                <p><strong>Descrição:</strong> ${data.effect_entries.find(e => e.language.name === "en")?.effect || "Sem descrição"}</p>
                <p><strong>Pokémons com esta habilidade (máx 10):</strong> ${data.pokemon.slice(0,10).map(p => p.pokemon.name).join(", ")}</p>
            `;
        case "item":
            return `
                <h2>Item: ${data.name.toUpperCase()}</h2>
                <p><strong>Categoria:</strong> ${data.category.name}</p>
                <p><strong>Descrição:</strong> ${data.effect_entries.find(e => e.language.name === "en")?.short_effect || "Sem descrição"}</p>
            `;
        case "evolution-chain":
            return `
                <h2>Cadeia de Evolução ID: ${data.id}</h2>
                <p><strong>Evoluções:</strong> ${parseEvolutionChainDetailed(data.chain)}</p>
            `;
        case "generation":
            return `
                <h2>Geração: ${data.name.toUpperCase()}</h2>
                <p><strong>Pokémons nesta geração (máx 10):</strong> ${data.pokemon_species.slice(0,10).map(p => p.name).join(", ")}</p>
                <p><strong>Região:</strong> ${data.main_region.name}</p>
            `;
        case "location":
            return `
                <h2>Localização: ${data.name.toUpperCase()}</h2>
                <p><strong>Áreas:</strong> ${data.areas.map(a => a.name).join(", ")}</p>
            `;
        case "region":
            return `
                <h2>Região: ${data.name.toUpperCase()}</h2>
                <p><strong>Locais (máx 10):</strong> ${data.locations.slice(0,10).map(l => l.name).join(", ")}</p>
                <p><strong>Principais cidades:</strong> ${data.main_generation.name}</p>
            `;
        default:
            return `<p>Tipo de dado não suportado.</p>`;
    }
}

function parseEvolutionChainDetailed(chain) {
    let result = [];

    function traverse(node) {
        result.push(node.species.name);
        node.evolves_to.forEach(e => traverse(e));
    }

    traverse(chain);

    return result.map(name => `<strong>${name}</strong>`).join(" → ");
}