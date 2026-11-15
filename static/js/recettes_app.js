// app.js – Chargement des données, filtres, navigation, et gestion formulaire

let indexData = [];      // tableau des métadonnées (index)
let recipesMap = new Map(); // slug -> recette complète (en mémoire, après chargement)

// Racine des données : window.DATA_BASE est défini dans recettes.html
const DATA_BASE = window.DATA_BASE || 'recettes';

// Chargement de l'index au démarrage
fetch(`${DATA_BASE}/index.json`)
    .then(response => response.json())
    .then(data => {
        indexData = data;
        remplirCategories(data);
        renderList(data);
        // Préchargement des recettes à la demande (dans openRecipe)
    })
    .catch(err => {
        console.error("Erreur chargement index :", err);
        document.getElementById('recipe-list').innerHTML =
            '<p style="grid-column:1/-1;text-align:center;">Impossible de charger les recettes.</p>';
    });


function parseIngredientLine(line) {
    line = line.trim();
    if (line === "") return null;

    let idx = line.indexOf(" d'");
    let len = 3; // longueur de " d'"
    if (idx === -1) {
        idx = line.indexOf(" de ");
        len = 4;
    }
    if (idx !== -1) {
        const quantite = line.substring(0, idx).trim();
        let nom = line.substring(idx + len).trim();
        if (nom.startsWith("'")) nom = nom.substring(1);
        return { quantite: quantite || "?", nom: nom };
    } else {
        return { quantite: "", nom: line };
    }
}


function remplirCategories(recipes) {
    const select = document.getElementById('f-category');
    const categories = new Set();
    recipes.forEach(r => r.categorie.forEach(c => categories.add(c)));
    const sorted = Array.from(categories).sort();
    select.innerHTML = '<option value="">Toutes</option>';
    sorted.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        select.appendChild(option);
    });
}

function filterRecipes() {
    const search = document.getElementById('f-search').value.toLowerCase();
    const cat = document.getElementById('f-category').value;
    const ingDispos = document.getElementById('f-ingredients').value
        .toLowerCase()
        .split(',')
        .map(i => i.trim())
        .filter(i => i);

    const filtered = indexData.filter(r => {
        const textMatch = r.titre.toLowerCase().includes(search) ||
                          r.description.toLowerCase().includes(search);
        const catMatch = cat === "" || r.categorie.includes(cat);
        let ingMatch = true;
        if (ingDispos.length > 0) {
            const recetteComplete = recipesMap.get(r.slug);
            if (recetteComplete) {
                const allIngNames = recetteComplete.ingredients.map(ing => ing.nom.toLowerCase()).join(' ');
                ingMatch = ingDispos.every(dispo => allIngNames.includes(dispo));
            } else {
                // fallback sur les noms d'ingrédients de l'index (si présents)
                const ingNames = r.ingredients_noms ? r.ingredients_noms.join(' ') : '';
                ingMatch = ingDispos.every(dispo => ingNames.includes(dispo));
            }
        }
        return textMatch && catMatch && ingMatch;
    });
    renderList(filtered);
}

function openRecipe(slug) {
    // Si déjà en cache, afficher
    if (recipesMap.has(slug)) {
        renderRecipe(recipesMap.get(slug));
        return;
    }
    fetch(`${DATA_BASE}/${slug}.json`)
        .then(response => response.json())
        .then(recette => {
            // Ajouter l'image depuis l'index si non présente
            const entry = indexData.find(r => r.slug === slug);
            if (entry && entry.image && !recette.image) recette.image = entry.image;
            recipesMap.set(slug, recette);
            renderRecipe(recette);
        })
        .catch(err => {
            alert("Impossible de charger la recette.");
            console.error(err);
        });
}

// --------------------------------------------------------------
// Gestion du formulaire (ajout / modification)
// --------------------------------------------------------------

function openForm(slug = null) {
    document.getElementById('view-list').classList.add('hidden');
    document.getElementById('view-recipe').classList.add('hidden');
    document.getElementById('view-form').classList.remove('hidden');

    if (slug) {
        // Mode édition : charger la recette complète (depuis le cache ou fichier)
        document.getElementById('form-title').innerText = '✏️ Modifier la recette';
        const loadRecipe = recipesMap.has(slug) 
            ? Promise.resolve(recipesMap.get(slug))
            : fetch(`${DATA_BASE}/${slug}.json`).then(r => r.json());
        loadRecipe.then(recette => {
            fillForm(recette, slug);
        }).catch(err => {
            alert("Impossible de charger la recette à modifier");
            showList();
        });
    } else {
        // Mode ajout
        document.getElementById('form-title').innerText = '➕ Nouvelle recette';
        clearForm();
    }
}

function fillForm(recette, slug) {
    document.getElementById('recipe-slug').value = slug;
    document.getElementById('form-titre').value = recette.titre;
    document.getElementById('form-description').value = recette.description;
    document.getElementById('form-categorie').value = recette.categorie.join(', ');
    document.getElementById('form-portions').value = recette.portions;
    document.getElementById('form-prep').value = recette.temps_preparation;
    document.getElementById('form-cuisson').value = recette.temps_cuisson;
    document.getElementById('form-image').value = recette.image || '';
    // Ingrédients : format quantité@nom

    const ingText = recette.ingredients.map(ing => {
        if (ing.quantite && ing.quantite !== "?" && ing.quantite !== "") {
            const premier = ing.nom.charAt(0).toLowerCase();
            const separateur = "aeiouy".includes(premier) ? " d'" : " de ";
            return `${ing.quantite}${separateur}${ing.nom}`;
        } else {
            return ing.nom;
        }
    }).join('\n');




    document.getElementById('form-ingredients').value = ingText;
    document.getElementById('form-etapes').value = recette.etapes.join('\n');
}

function clearForm() {
    document.getElementById('recipe-slug').value = '';
    document.getElementById('form-titre').value = '';
    document.getElementById('form-description').value = '';
    document.getElementById('form-categorie').value = '';
    document.getElementById('form-portions').value = '';
    document.getElementById('form-prep').value = '';
    document.getElementById('form-cuisson').value = '';
    document.getElementById('form-image').value = '';
    document.getElementById('form-ingredients').value = '';
    document.getElementById('form-etapes').value = '';
}

function saveRecipeFromForm() {
    const titre = document.getElementById('form-titre').value.trim();
    if (!titre) { alert("Le titre est requis"); return; }
    const description = document.getElementById('form-description').value.trim();
    if (!description) { alert("La description est requise"); return; }

    const slugInput = document.getElementById('recipe-slug').value;
    let slug = slugInput;
    if (!slug) {
        slug = titre.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        let base = slug;
        let counter = 1;
        while (indexData.some(r => r.slug === slug) || recipesMap.has(slug)) {
            slug = `${base}-${counter++}`;
        }
    }

    const categories = document.getElementById('form-categorie').value.split(',').map(c => c.trim()).filter(c => c);
    const portions = document.getElementById('form-portions').value || "1";
    const temps_preparation = document.getElementById('form-prep').value || "—";
    const temps_cuisson = document.getElementById('form-cuisson').value || "—";
    const image = document.getElementById('form-image').value.trim();

    // Parsing des ingrédients
    const ingLines = document.getElementById('form-ingredients').value.split('\n');
    const ingredients = [];
    for (let line of ingLines) {
        line = line.trim();
        if (!line) continue;
        
        const parsed = parseIngredientLine(line);
        if (parsed) ingredients.push(parsed);
        
        
        
        
    }

    const etapes = document.getElementById('form-etapes').value.split('\n').filter(s => s.trim() !== "");

    const newRecipe = {
        slug, titre, description, categorie: categories, portions,
        temps_preparation, temps_cuisson, image, ingredients, etapes
    };

    // Mise à jour des structures locales
    recipesMap.set(slug, newRecipe);
    const existingIndex = indexData.findIndex(r => r.slug === slug);
    const indexEntry = {
        slug, titre, description, categorie: categories, portions,
        temps_preparation, temps_cuisson, image,
        ingredients_noms: ingredients.map(i => i.nom)
    };
    if (existingIndex !== -1) {
        indexData[existingIndex] = indexEntry;
    } else {
        indexData.push(indexEntry);
    }

    remplirCategories(indexData);
    showList();
    filterRecipes(); // rafraîchit la liste
    alert(`Recette "${titre}" sauvegardée localement.`);
}

// Envoi à l'API POST /recette
async function sendCurrentRecipeToApi() {
    const slug = document.getElementById('recipe-slug').value;
    let recipe;
    if (slug && recipesMap.has(slug)) {
        recipe = recipesMap.get(slug);
    } else {
        // Cas d'une nouvelle recette non encore sauvegardée ? on la construit
        recipe = buildRecipeFromForm();
        if (!recipe) return;
    }
    try {
        const response = await fetch('/recette', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipe)
        });
        if (response.ok) {
            alert(`✅ Recette "${recipe.titre}" envoyée avec succès (status ${response.status})`);
        } else {
            alert(`❌ Erreur ${response.status} : ${response.statusText}`);
        }
    } catch (err) {
        console.error(err);
        alert(`❌ Impossible d'envoyer : ${err.message}\n(Vérifiez que le serveur écoute sur /recette)`);
    }
}

function buildRecipeFromForm() {
    const titre = document.getElementById('form-titre').value.trim();
    if (!titre) { alert("Titre requis"); return null; }
    const description = document.getElementById('form-description').value.trim();
    if (!description) { alert("Description requise"); return null; }
    const categories = document.getElementById('form-categorie').value.split(',').map(c=>c.trim()).filter(c=>c);
    const portions = document.getElementById('form-portions').value;
    const temps_preparation = document.getElementById('form-prep').value;
    const temps_cuisson = document.getElementById('form-cuisson').value;
    const image = document.getElementById('form-image').value;
    const ingLines = document.getElementById('form-ingredients').value.split('\n');
    const ingredients = [];
    for (let line of ingLines) {
        line = line.trim();
        if (!line) continue;
        const parsed = parseIngredientLine(line);
        if (parsed) ingredients.push(parsed);        
        
        
    }
    const etapes = document.getElementById('form-etapes').value.split('\n').filter(s=>s.trim());
    let slug = document.getElementById('recipe-slug').value;
    if (!slug) slug = titre.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return { slug, titre, description, categorie: categories, portions, temps_preparation, temps_cuisson, image, ingredients, etapes };
}

function downloadCurrentRecipe() {
    const recipe = buildRecipeFromForm();
    if (!recipe) return;
    const dataStr = JSON.stringify(recipe, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.slug}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(`📁 Téléchargement de ${recipe.titre}.json effectué`);
}

// Écouteurs d'événements
document.getElementById('f-search').addEventListener('input', filterRecipes);
document.getElementById('f-category').addEventListener('change', filterRecipes);
document.getElementById('f-ingredients').addEventListener('input', filterRecipes);

document.getElementById('new-recipe-btn').addEventListener('click', () => openForm(null));
document.getElementById('cancel-form-btn').addEventListener('click', showList);
//document.getElementById('save-recipe-btn').addEventListener('click', saveRecipeFromForm);
document.getElementById('edit-recipe-btn').addEventListener('click', () => {
    const slug = document.querySelector('#view-recipe:not(.hidden)') ? 
        (recipesMap.size ? [...recipesMap.keys()].find(k => document.getElementById('detail-title').textContent === recipesMap.get(k)?.titre) : null) : null;
    if (slug) openForm(slug);
    else alert("Aucune recette sélectionnée");
});
// Écriture serveur : possible sur le RPi, désactivée sur le site statique
(function () {
    const btnApi = document.getElementById('send-api-btn');
    const btnSave = document.getElementById('save-recipe-btn');
    if (window.API_ECRITURE) {
        if (btnApi) btnApi.addEventListener('click', sendCurrentRecipeToApi);
    } else {
        if (btnApi) btnApi.remove();
        if (btnSave) btnSave.remove();     // aucun écouteur : bouton mort sur le RPi aussi
        const barre = document.querySelector('.action-buttons');
        if (barre) {
            const note = document.createElement('p');
            note.className = 'static-note';
            note.innerHTML = 'Site statique : rien n\'est enregistré ici. Composez la recette, cliquez sur ' +
                '<strong>📥 Télécharger JSON</strong>, puis déposez le fichier dans <code>recettes/</code> ' +
                '(et ajoutez son entrée dans <code>index.json</code>).';
            barre.appendChild(note);
        }
    }
})();
document.getElementById('download-json-btn').addEventListener('click', downloadCurrentRecipe);

// S'assurer que les fonctions globales pour les onclick HTML sont disponibles
window.showList = showList;
window.openRecipe = openRecipe;
