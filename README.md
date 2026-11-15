# Carnet de recettes

Site statique (GitHub Pages) : 168 recettes en JSON, consultables par titre, catégorie
et ingrédients.

- `recettes.html` — la page (liste, recherche, fiche détaillée)
- `recettes/` — une recette par fichier JSON + les photos, et `index.json` (métadonnées pour la liste)
- `recettes/aa_genere_Index.py` — régénère `index.json` à partir des fichiers JSON
- `static/` — CSS et JS de la page
- `index.html` — point d'entrée qui redirige vers `recettes.html`

## Version statique : pas d'écriture

La page d'origine (sur le RPi) enregistre les recettes via `POST /recette`. Ici il n'y a
pas de serveur : le bouton d'envoi est retiré et une note le remplace. Pour ajouter ou
modifier une recette :

1. composer dans le formulaire, puis **📥 Télécharger JSON** ;
2. déposer le fichier dans `recettes/` ;
3. mettre à jour `recettes/index.json` (ou lancer `aa_genere_Index.py`) ;
4. `git add -A && git commit -m "recette ..." && git push` — le site se republie seul.

Un seul réglage de chemin : `window.DATA_BASE` en haut de `recettes.html`
(`recettes` ici, `/data/recettes` sur le RPi).
