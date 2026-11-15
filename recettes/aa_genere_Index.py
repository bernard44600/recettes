#!/usr/bin/env python3
import json, os, re, glob, copy
from typing import List

def capitaliser_titre(titre):
    return titre[0].upper() + titre[1:].lower() if titre else ""

def nettoyer_texte_temps(texte):
    if not isinstance(texte, str): return texte
    return re.sub(r"\bminutes?\b|\bMinutes?\b|\bmns\b", "mn", texte, flags=re.IGNORECASE)

def nettoyer_categories(cats):
    if not isinstance(cats, list): return cats
    mapping = {
        "dessert": "Dessert","déssert": "Dessert", "soupe": "Soupe", "plat": "Plat",
        "apéro": "Apéro", "apéritif": "Apéro", "gueule": "Apéro",
        "entree": "Entrée", "entrée": "Entrée",
        "crustacé": "Fruit de mer", "crustace": "Fruit de mer", "de mer": "Fruit de mer",
        "régime": "Régime"
    }
    return [mapping.get(cat.lower(), cat) for cat in cats]

def trouver_toutes_images(slug: str) -> List[str]:
    images = []
    for ext in ('.jpg', '.jpeg', '.png'):
        pattern = f"{slug}*{ext}"
        fichiers = glob.glob(pattern)
        fichiers.sort()
        images.extend(fichiers)
    return images

def traiter():
    print(f"📁 Dossier : {os.getcwd()}")
    fichiers = [f for f in os.listdir() if f.endswith(".json") and f != "index.json"]
    index = []
    modif = 0
    
    for f in fichiers:
        slug = f[:-5]
        print(f"📄 {f}")
        
        with open(f, "r", encoding="utf-8") as fp:
            data = json.load(fp)
            
        if isinstance(data, list):
            recette = data[0] if data else {}
        else:
            recette = data
            
        if not isinstance(recette, dict):
            continue

        # 1. On fait une copie profonde pour comparer plus tard
        recette_originale = copy.deepcopy(recette)

        # Nettoyage
        if "temps_preparation" in recette:
            recette["temps_preparation"] = nettoyer_texte_temps(recette["temps_preparation"])
        if "temps_cuisson" in recette:
            recette["temps_cuisson"] = nettoyer_texte_temps(recette["temps_cuisson"])
        if "categorie" in recette:
            recette["categorie"] = nettoyer_categories(recette["categorie"])
        if "titre" in recette:
            recette["titre"] = capitaliser_titre(recette["titre"])

        # Liste d'images
        images = trouver_toutes_images(slug)
        recette["image"] = images

        # 2. Vérification : est-ce que le dictionnaire a changé ?
        # En Python, comparer deux dictionnaires compare leur contenu exact (clés et valeurs)
        if recette != recette_originale:
            print(f"   ✍️ Modification détectée, réécriture de {f}...")
            
            # Sauvegarde des dates d'origine
            stats = os.stat(f)
            date_acces = stats.st_atime
            date_modif = stats.st_mtime

            # Réécriture propre
            with open(f, "w", encoding="utf-8") as fp:
                json.dump(recette, fp, ensure_ascii=False, indent=2)
            modif += 1

            # Restauration des dates
            os.utime(f, (date_acces, date_modif))
        else:
            print(f"   ⚡ Déjà à jour ")

        # Index (on l'alimente toujours, qu'il y ait eu modification physique ou non)
        ingredients_noms = [ing["nom"].lower() for ing in recette.get("ingredients", [])]
        index.append({
            "slug": slug,
            "titre": recette.get("titre", ""),
            "description": recette.get("description", ""),
            "portions": recette.get("portions", ""),
            "temps_preparation": recette.get("temps_preparation", ""),
            "temps_cuisson": recette.get("temps_cuisson", ""),
            "categorie": recette.get("categorie", []),
            "image": images,
            "ingredients_noms": ingredients_noms
        })

    if index:
        index.sort(key=lambda x: x["titre"].lower())
        with open("index.json", "w", encoding="utf-8") as fp:
            json.dump(index, fp, ensure_ascii=False, indent=2)
        print(f"📇 Index mis à jour ({len(index)} recettes)")

    print(f"✅ {modif} fichier(s) JSON réécrit(s)")

if __name__ == "__main__":
    traiter()
