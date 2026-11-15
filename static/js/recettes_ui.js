// recettes_ui.js – Rendu des cartes et de la fiche recette (compatible liste d'images)

function renderList(recipes) {
    const grid = document.getElementById('recipe-list');
    grid.innerHTML = '';

    if (recipes.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Aucune recette trouvée 😕</p>';
        return;
    }

    recipes.forEach(r => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.onclick = () => openRecipe(r.slug);

        // Aperçu de la première image si disponible
        let previewImg = '';
        if (r.image) {
            let firstImage = null;
            if (Array.isArray(r.image) && r.image.length > 0) firstImage = r.image[0];
            else if (typeof r.image === 'string' && r.image.trim() !== '') firstImage = r.image;
            if (firstImage) previewImg = `${window.DATA_BASE || 'recettes'}/${firstImage}`;
        }

        card.innerHTML = `
            ${previewImg ? `<div class="card-img-container"><img src="${previewImg}" class="card-img" alt="${escapeHtml(r.titre)}" loading="lazy"></div>` : ''}
            <div class="card-content">
                <h3>${escapeHtml(r.titre)}</h3>
                <p>${escapeHtml(r.description)}</p>
                <div class="card-tags">
                    <span class="tag tag-type">${escapeHtml(r.categorie[0] || 'Général')}</span>
                    <span class="tag">🧑 ${escapeHtml(r.portions)}</span>
                    <span class="tag">⏱️ ${escapeHtml(r.temps_preparation)}</span>
                    <span class="tag">🔥 ${escapeHtml(r.temps_cuisson)}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function showList() {
    document.getElementById('view-recipe').classList.add('hidden');
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-list').classList.remove('hidden');
    if (typeof filterRecipes === 'function') filterRecipes();
}

function renderRecipe(recette) {
    document.getElementById('view-list').classList.add('hidden');
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-recipe').classList.remove('hidden');

    document.getElementById('detail-title').textContent = recette.titre;
    document.getElementById('detail-desc').textContent = recette.description;

    // Gestion des images (liste ou chaîne)
    const imgContainer = document.querySelector('.image-container');
    imgContainer.innerHTML = ''; // vide l'ancien contenu
    let imagesList = [];
    if (recette.image) {
        if (Array.isArray(recette.image)) {
            imagesList = recette.image;
        } else if (typeof recette.image === 'string' && recette.image.trim() !== '') {
            imagesList = [recette.image];
        }
    }

    if (imagesList.length === 0) {
        imgContainer.classList.add('no-image');
        imgContainer.innerHTML = '<div class="no-image-placeholder">📷 Aucune photo</div>';
    } else {
        imgContainer.classList.remove('no-image');
        const galleryDiv = document.createElement('div');
        galleryDiv.className = 'recipe-gallery';
        imagesList.forEach(imgFile => {
            const imgUrl = `${window.DATA_BASE || 'recettes'}/${imgFile}`;
            const img = document.createElement('img');
            img.src = imgUrl;
            img.alt = recette.titre;
            img.loading = 'lazy';
            img.className = 'gallery-img';
            galleryDiv.appendChild(img);
        });
        imgContainer.appendChild(galleryDiv);
    }

    // Métadonnées
    document.getElementById('detail-tags').innerHTML = `
        <span class="tag tag-type">🏷️ ${escapeHtml(recette.categorie.join(', '))}</span>
        <span class="tag">🧑 ${escapeHtml(recette.portions)}</span>
        <span class="tag">⏱️ ${escapeHtml(recette.temps_preparation)}</span>
        <span class="tag">🔥 ${escapeHtml(recette.temps_cuisson)}</span>
    `;

    // Ingrédients
    document.getElementById('detail-ingredients').innerHTML = recette.ingredients.map(ing => `
        <span class="ingredient-qty">${escapeHtml(ing.quantite)}</span>
        <span class="ingredient-name">${escapeHtml(ing.nom)}</span>
    `).join('');

    // Étapes
    document.getElementById('detail-etapes').innerHTML = recette.etapes.map((texte, i) => `
        <div class="step">
            <div class="step-number">${i+1}</div>
            <p>${escapeHtml(texte)}</p>
        </div>
    `).join('');
}

function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    str = String(str);
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}
