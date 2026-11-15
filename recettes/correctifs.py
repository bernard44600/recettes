import json
import os
import re

# TODO remplecer heure > h
# categorie  solo ou duo Plat > 2 categories =/=

sous_dossier = ""

try:
    os.chdir(sous_dossier)
    print(f"✓ Script déplacé avec succès dans le dossier : '{sous_dossier}'")
except FileNotFoundError:
    print(
        f"Erreur : Impossible de trouver le dossier '{sous_dossier}'. Arrêt du script."
    )
    exit()

def capitaliser_titre(titre):
    """Met la première lettre du titre en majuscule, le reste en minuscules."""
    if not isinstance(titre, str):
        return titre
    if titre == "":
        return titre
    return titre[0].upper() + titre[1:].lower()

def trouver_image_pour_recette(base_name):
    """
    Cherche une image dans le dossier 'image' (au même niveau que le script)
    portant le même nom de base que la recette, avec extensions .jpg, .jpeg, .png.
    Retourne le nom du fichier image trouvé, ou une chaîne vide.
    """
    dossier_image = ""
    if not os.path.isdir(dossier_image):
        return ""
    extensions = ['.jpg', '.jpeg', '.png']
    for ext in extensions:
        chemin = os.path.join(dossier_image, base_name + ext)
        if os.path.isfile(chemin):
            # On retourne juste le nom du fichier (pas le chemin complet)
            return base_name + ext
    return ""

def nettoyer_texte_temps(texte):
    """Remplace les variantes de 'minutes' par 'mn'."""
    if not isinstance(texte, str):
        return texte
    return re.sub(
        r"\bminutes?\b|\bMinutes?\b|\bmns\b", "mn", texte, flags=re.IGNORECASE
    )

def nettoyer_etapes(list_etapes):
    etapes_nettoyees = []
    for etape in list_etapes:
        if True:  # les conditions ne sont plus utile, on garde en réserve
            etapes_nettoyees.append(etape)
    return etapes_nettoyees

def nettoyer_categories(list_categories):
    """Harmonise les catégories selon les règles demandées."""
    if not isinstance(list_categories, list):
        return list_categories
    categories_nettoyees = []
    for cat in list_categories:
        if not isinstance(cat, str):
            categories_nettoyees.append(cat)
            continue
        cat_lower = cat.lower()
        new_cat = cat
        
        if "dessert" in cat_lower:
            new_cat = "Dessert"    
        elif "soupe" in cat_lower:
            new_cat = "Soupe"
        elif "plat" in cat_lower:
            new_cat = "Plat"
        elif "apéro" in cat_lower or "apéritif" in cat_lower or "gueule" in cat_lower:
            new_cat = "Apéro"            
        elif "de resistance" in cat_lower or "de résistance" in cat_lower or "principal" in cat_lower:
            new_cat = "Plat"
        elif "entree" in cat_lower or "entrée" in cat_lower:
            new_cat = "Entrée"
        elif "crustacé" in cat_lower or "crustace" in cat_lower or "de mer" in cat_lower:
            new_cat = "Fruit de mer"
        categories_nettoyees.append(new_cat)
        if cat != new_cat:
            print(cat , '......', new_cat)        
    return categories_nettoyees

def Traiter_repertoire_courant():
    fichiers = [f for f in os.listdir(".") if f.endswith(".json")]
    if not fichiers:
        print("Aucun fichier .json trouvé dans le répertoire courant.")
        return
    print(f"Début du nettoyage de {len(fichiers)} fichier(s) JSON...\n")
    for nom_fichier in fichiers:
        print("___________________", nom_fichier)
        try:
            # Extraire le nom de base (sans extension) pour la recherche d'image
            base_name = os.path.splitext(nom_fichier)[0]

            with open(nom_fichier, "r", encoding="utf-8") as f:
                data = json.load(f)

            est_une_liste = isinstance(data, list)
            recettes = data if est_une_liste else [data]

            for recette in recettes:
                if not isinstance(recette, dict):
                    continue

                # 1. Nettoyage des temps
                if "temps_preparation" in recette:
                    recette["temps_preparation"] = nettoyer_texte_temps(
                        recette["temps_preparation"]
                    )
                if "temps_cuisson" in recette:
                    recette["temps_cuisson"] = nettoyer_texte_temps(
                        recette["temps_cuisson"]
                    )

                # 2. Nettoyage des étapes (" and " -> " et ")
                if "etapes" in recette:
                    recette["etapes"] = nettoyer_etapes(recette["etapes"])

                # 3. Nettoyage des catégories
                if "categorie" in recette:
                    recette["categorie"] = nettoyer_categories(
                        recette["categorie"]
                    )

                # 4. Mise en forme du titre : première lettre majuscule, reste minuscules
                if "titre" in recette:
                    recette["titre"] = capitaliser_titre(recette["titre"])

                # 5. Recherche d'image dans le dossier "image"
                image_trouvee = trouver_image_pour_recette(base_name)
                recette["image"] = image_trouvee  # écrase l'ancienne valeur

            donnees_a_sauver = recettes if est_une_liste else recettes[0]
            with open(nom_fichier, "w", encoding="utf-8") as f:
                json.dump(donnees_a_sauver, f, ensure_ascii=False, indent=2)

            print(f"✓ Fichier nettoyé et mis à jour : {nom_fichier}")

        except Exception as e:
            print(f"✗ Erreur lors du traitement de {nom_fichier} : {e}")

    print("\nOpération de nettoyage terminée !")

if __name__ == "__main__":
    Traiter_repertoire_courant()
