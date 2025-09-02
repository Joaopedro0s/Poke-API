const API_BASE = "https://pokeapi.co/api/v2/";

const menuItems = document.querySelectorAll("#menu li");
const searchContainer = document.getElementById("search-container");
const searchInput = document.getElementById("search-input");
const btnSearch = document.getElementById("btn-search");
const resultado = document.getElementById("resultado");

let currentApiEndpoint = null;

const placeholders = {
    "pokemon": "Digite o nome ou ID do Pokémon",
    "pokemon-species": "Digite o nome ou ID da espécie",
    "type": "Digite o nome ou ID do tipo",
    "move": "Digite o nome ou ID do movimento",
    "ability": "Digite o nome ou ID da habilidade",
    "item": "Digite o nome ou ID do item",
    "evolution-chain": "Digite o ID do Pokemon",
    "generation": "Digite o nome ou ID da geração",
    "location": "Digite o nome ou ID da localização",
    "region": "Digite o nome ou ID da região",
};

menuItems.forEach(item => {
    item.addEventListener("click", () => {
        menuItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        searchContainer.classList.remove("hidden");

        currentApiEndpoint = item.dataset.api;

        searchInput.value = "";
        searchInput.placeholder = placeholders[currentApiEndpoint];
        searchInput.focus();

        resultado.innerHTML = "";
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

    } catch (err) {
        resultado.innerHTML = `<p style="color:red;">Erro: ${err.message}</p>`;
    }
}

function montarResultado(tipo, data) {
    switch(tipo) {
        case "pokemon":
            return `
                <h2>${data.name.toUpperCase()} (#${data.id})</h2>
                <img src="${data.sprites.front_default}" alt="${data.name}" />
                <p><strong>Tipos:</strong> ${data.types.map(t => t.type.name).join(", ")}</p>
                <p><strong>Habilidades:</strong> ${data.abilities.map(a => a.ability.name).join(", ")}</p>
                <p><strong>Movimentos (5 primeiros):</strong> ${data.moves.slice(0,5).map(m => m.move.name).join(", ")}</p>
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
                <p><strong>Gerações:</strong> ${data.generation ? data.generation.name : "Desconhecido"}</p>
            `;
        default:
            return "<p>Tipo de pesquisa não implementado.</p>";
    }
}

function parseEvolutionChainDetailed(chain) {
    function formatEvolutionDetails(details) {
        if (!details || details.length === 0) return "";
        let d = details[0];
        let parts = [];

        if (d.min_level) parts.push(`nível ${d.min_level}`);
        if (d.item) parts.push(`item: ${d.item.name}`);
        if (d.trigger) parts.push(`gatilho: ${d.trigger.name}`);
        if (d.time_of_day && d.time_of_day !== "") parts.push(`hora do dia: ${d.time_of_day}`);
        if (d.held_item) parts.push(`item segurado: ${d.held_item.name}`);
        if (d.min_happiness) parts.push(`felicidade mínima: ${d.min_happiness}`);
        if (d.location) parts.push(`local: ${d.location.name}`);

        return parts.length > 0 ? ` (${parts.join(", ")})` : "";
    }

    function recurse(node) {
        let str = node.species.name;
        if (node.evolution_details && node.evolution_details.length > 0) {
            str += formatEvolutionDetails(node.evolution_details);
        }

        if (node.evolves_to && node.evolves_to.length > 0) {
            str += " → ";
            str += node.evolves_to.map(evo => recurse(evo)).join(" / ");
        }
        return str;
    }

    return recurse(chain);
}
