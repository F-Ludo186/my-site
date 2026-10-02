//
// =======   CONSTANTES ===============
//
const API_URL = "https://pokeapi.co/api/v2/pokemon";
const DATA_KEY = "data.json";
const MAX_SUGGESTIONS = 20 ;
const MAX_NIVEAU_POKEMON = 255 ;

const typeColors = {
    normal: "#A8A77A",
    fire: "#EE8130",
    water: "#6390F0",
    electric: "#F7D02C",
    grass: "#7AC74C",
    ice: "#96D9D6",
    fighting: "#C22E28",
    poison: "#A33EA1",
    ground: "#E2BF65",
    flying: "#A98FF3",
    psychic: "#F95587",
    bug: "#A6B91A",
    rock: "#B6A136",
    ghost: "#735797",
    dragon: "#6F35FC",
    dark: "#705746",
    steel: "#B7B7CE",
    fairy: "#D685AD"
};

const statLabels = {
    "hp": "PV",
    "attack": "Attaque",
    "defense": "Défense",
    "special-attack": "Att. Spé",
    "special-defense": "Déf. Spé",
    "speed": "Vitesse"
};

//
// =======   ÉLÉMENTS DU DOM ===============
//
const $ = (selector) => document.querySelector(selector);

const form = $("#search-form");
const input = $("#search");
const result = $("#result");
const loader = $("#loader");
const cardsContainer = $(".cards-container");
const datalist = $("#suggestions");
const imageSlots =[
    { element: $("#imgPokemon"), cle: "front_default" },
    { element: $("#imgPokemonfemal"), cle: "front_female" },
    { element: $("#imgPokemonShiny"), cle: "front_shiny" },
    { element: $("#imgPokemonShinyFemal"), cle: "front_shiny_female" }
];

//
// =======   démarrage et événements ===============
//

let noms = []; // variable pour l'autocomplementation
const cachePokemon = new Map(); // pour eviter de recharger si deja afficher.

initAutocompletion();
chargeExamplePokemon();

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    cacherResultats();

    const valeurSaisie = normalise(input.value);
    if (valeurSaisie === "") {
        afficherErreur("Merci de saisir une valeur avant de lancer la recherche !!");
        return;
    }

    loader.hidden = false;
    const poke = await searchPokemon(valeurSaisie);
    if (poke) await prechargerImages(poke);

    if(poke != null){
        cardsContainer.style.display = "flex";
        ChargePokemon(poke);
    }
    loader.hidden = true;
});

input.addEventListener("input", () => {
    afficherSuggestions(normalise(input.value));
});

//
// =======   APPELS API ===============
//
async function fetchJson(url) {
    const response = await fetch(url);
    return response.ok ? response.json() : null;
}

async function chargeExamplePokemon() {
    const listeP = await fetchJson(`${API_URL}/`);;
    
    for(let i=0; i< listeP.results.length ; i++){
        let bt = document.createElement("button");
        bt.textContent =toProperCase( listeP.results[i].name);
        bt.dataset.url = listeP.results[i].url; 
        bt.addEventListener("click", async (e) => {
            input.value = bt.textContent;
            form.requestSubmit();
        });
        $("#listePokemon").appendChild(bt);
    }
}

async function searchPokemon(name) {
    if(cachePokemon.has(name)) return cachePokemon.get(name);

    try {
        const pokemon = await fetchJson(`${API_URL}/${name}`);
        if (!pokemon) {
            afficherErreur(`Le pokémon "${nom}" est introuvable`);
            return null;
        } else {
            cachePokemon.set(name, pokemon);
            return pokemon;
        }
    } catch (error) {
        afficherErreur("Impossible de joindre l'API, réessaie dans un instant");
        return null;
    }
}

//
// =======   Gestion images ===============
//
function chargerImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => resolve();   // une image cassée ne bloque pas le reste
        img.src = url;
    });
}

function prechargerImages(pokemon) {
    const home = pokemon.sprites?.other?.home ?? {};
    const urls = imageSlots.map(({ cle }) => home[cle]).filter(Boolean);
    return Promise.all(urls.map(chargerImage));       // toutes en parallèle
}

//
// =======   Affichage ===============
//
async function ChargePokemon(poke){
    afficherIdentite(poke);
    afficherCapacite(poke)
    afficherType(poke)
    afficherStats(poke);
    afficherImage(poke);
    afficherSon(poke)
}

function afficherIdentite(pokemon){
    // remplissage info
    $("#nomPokemon").innerHTML = `Nom : ${pokemon.name.toLocaleUpperCase()}`;
    $("#HauteurPokemon").innerHTML = `Hauteur : ${pokemon.height /10} m`;
    $("#PoidsPokemon").innerHTML = `Poids : ${pokemon.weight /10} Kg`;
    $("#ExperiencePokemon").innerHTML = `Experience : ${pokemon.base_experience}`;
}

function afficherType(pokemon) {
    const types = $("#types");
    types.innerHTML = "";
    for (let i = 0; i < pokemon.types.length; i++) {
        const type = pokemon.types[i].type.name;
        const carte = createDiv("type-badge", type.toUpperCase());
        carte.style.background = typeColors[type];
        types.appendChild(carte);
    }
}

function afficherCapacite(pokemon) {

    const abilities = $("#abilities");
    abilities.innerHTML = "";
    for (let i = 0; i < pokemon.abilities.length; i++) {
        const ability = pokemon.abilities[i];
        const carte = createDiv("ability-badge",ability.ability.name);
        if (ability.is_hidden) {
            carte.classList.add("hidden-ability");
        }
        abilities.appendChild(carte);
    }
}

async function afficherImage(pokemon){
   const home = pokemon.sprites?.other?.home ?? {};
    
   for (const { element, cle } of imageSlots) {
        const url = home[cle];
        element.style.display = url ? "" : "none";   // "" = on garde le display du CSS
        element.querySelector("img").src = url;
    }
}

function afficherSon(pokemon){
    // remplissage Audio
    $("#source").src =  pokemon.cries.legacy;
    $("#audio1").load();

    $("#source2").src =  pokemon.cries.latest;
    $("#audio2").load();
}

function afficherStats(pokemon) {
    const stats = $("#stats");
    stats.innerHTML = "";

    for (let i = 0; i < pokemon.stats.length; i++) {
        const nom = pokemon.stats[i].stat.name;
        const valeur = pokemon.stats[i].base_stat;

        const ligne = createDiv("stat-row");
        const label = createSpan("stat-name", statLabels[nom] ?? nom);
        const val   = createSpan("stat-value",valeur);
        const piste = createDiv("stat-track");
        const barre = createDiv("stat-bar");
        barre.style.background = couleurStat(valeur);
        piste.appendChild(barre);

        ligne.append(label, val, piste);
        stats.appendChild(ligne);

        // largeur appliquée après l'affichage pour déclencher l'animation
        requestAnimationFrame(() => {
            barre.style.width = `${Math.min(valeur / MAX_NIVEAU_POKEMON * 100, 100)}%`;
        });
    }
}

function afficherErreur(message) {
    const errorBox = $("#error");
    errorBox.textContent = message;
    errorBox.style.display = "block";
}

function afficherSuggestions(saisie) {
    const resultats = saisie
        ? noms.filter(nom => nom.startsWith(saisie)).slice(0, MAX_SUGGESTIONS)
        : [];

    datalist.replaceChildren(...resultats.map(nom => {
        const option = document.createElement("option");
        option.value = nom;
        return option;
    }));
}

//
// =======   AutoComplementation  ===============
//
async function initAutocompletion() {
    noms = await lireData() ?? await createFile();
}

function lireData() {
    try {
        const brut = localStorage.getItem(DATA_KEY);
        return brut ? JSON.parse(brut) : null;
    } catch {
        return null;
    }
}

async function createFile() {
    try {
        const data = await fetchJson(`${API_URL}?limit=100000`);
        const noms = data.results
            .map(({ name }) => name)
            .sort((a, b) => a.localeCompare(b));

        localStorage.setItem(DATA_KEY, JSON.stringify(noms));
        return noms;
    } catch (err) {
        console.error("Impossible de créer data.json :", err);
        return [];
    }
}

function createSuggestionItem(text, input, container) {
    const div = createDiv("suggestion-item");
    div.addEventListener("click", () => {
        input.value = text;
        container.innerHTML = "";
    });
    return div;
}

///
// =======   Outils ===============
//

function cacherResultats(){
    cardsContainer.style.display = "none";
    error.style.display = "none";
}

function couleurStat(valeur) {
    if (valeur < 50) return "#e63946";   // faible
    if (valeur < 80) return "#f4a261";   // moyen
    if (valeur < 110) return "#7ac74c";  // bon
    return "#3b82f6";                    // excellent
}

// "  Flabébé " -> "flabebe" ; "Mr Mime" -> "mr-mime"
function normalise(texte) {
    return texte
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")   // supprime les accents
        .replace(/\s+/g, "-");
}

function toProperCase(texte) {
    return texte.charAt(0).toUpperCase() + texte.slice(1);
}

function createDiv(nomClasse , texte =""){
    const div = document.createElement("div");
    div.classList.add(nomClasse);
    if(texte != "" ) div.textContent = texte;
    return div;
}

function createSpan(nomClasse , texte =""){
    const span = document.createElement("span");
    span.classList.add(nomClasse);   
    if(texte != "" ) span.textContent = texte;
    return span;
}

/* 
different code pour cette fonction

async function afficherImage(pokemon){
    const formPokemon = await fetchJson(pokemon.forms[0].url)
    
   for ( { element , cle } of imageSlots){
        element.children[1].src = formPokemon.sprites.other.home[cle];
        element.style.display = formPokemon.sprites.other.home[cle] === null ? "none" : "block" ;
    }

    // equivalence 
    /*
    for (let i= 0 ; i < imageSlots.length; i++) {
        const element = imageSlots[i].element;
        const cle = imageSlots[i].cle ;
        element.children[1].src = formPokemon.sprites.other.home[cle];
        element.style.display= cle=== null ? "nono" : "block" ;
    }*/
    
   /*  CODE ORIGINE
    const formPokemon = await fetchJson(pokemon.forms[0].url)
    let imgDefault = formPokemon.sprites.other.home.front_default;
    let imgFemal= formPokemon.sprites.other.home.front_female;
    let imgShiny = formPokemon.sprites.other.home.front_shiny;
    let imgShinyFemal = formPokemon.sprites.other.home.front_shiny_female;


    // remplissage images
    if(imgDefault === null){
        imagePokemon.style.display="none";
    } else {
        imagePokemon.style.display="block";
        imagePokemon.children[1].src =imgDefault;
    }
    if(imgFemal === null){
           imgPokemonfemal.style.display="none";
    } else {
        imgPokemonfemal.style.display="block";  
        imgPokemonfemal.children[1].src = imgFemal;
    }
    if(imgShiny === null){
           imgPokemonShiny.style.display="none";
    } else {
        imgPokemonShiny.style.display="block";  
        imgPokemonShiny.children[1].src = imgShiny;
    }
    if(imgShinyFemal === null){
           imgPokemonShinyFemal.style.display="none";
    } else {
        imgPokemonShinyFemal.style.display="block";  
        imgPokemonShinyFemal.children[1].src = imgShinyFemal;   
    }
}
*/