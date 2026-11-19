#!/bin/sh
# Publie les modifications de ce dossier sur GitHub.
#   ./publier.sh                 → commit « mise à jour »
#   ./publier.sh "mon message"   → commit avec ce message
# Gère aussi le cas « rien de modifié mais des commits non poussés ».
set -e
cd "$(dirname "$0")"
MSG="${1:-mise à jour}"

# liste des fiches drawio, si le dépôt en a un
if [ -x ./maj_liste.sh ]; then ./maj_liste.sh >/dev/null 2>&1 || true; fi

git fetch -q origin 2>/dev/null || true
EN_ATTENTE=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -q -m "$MSG"
  echo "Commit : $MSG"
elif [ "$EN_ATTENTE" -gt 0 ]; then
  echo "Aucune modification, mais $EN_ATTENTE commit(s) local(aux) non poussé(s)."
else
  echo "Rien à publier : aucune modification, tout est déjà en ligne."
  exit 0
fi

if ! git push -q origin HEAD 2>/tmp/push_err.$$; then
  echo "" >&2
  echo "ÉCHEC DU PUSH — les modifications sont enregistrées localement mais pas en ligne :" >&2
  sed 's/^/  /' /tmp/push_err.$$ >&2
  rm -f /tmp/push_err.$$
  echo "" >&2
  echo "Si le message parle de clé ou d'authentification : la clé SSH n'est pas installée" >&2
  echo "sur cette machine (~/.ssh/config + ~/.ssh/id_ed25519_bernard44600)." >&2
  echo "Relancer ensuite simplement ./publier.sh : le commit sera poussé." >&2
  exit 1
fi
rm -f /tmp/push_err.$$

CHEMIN=$(git remote get-url origin | sed 's#.*:##; s#\.git$##')
PROPRIO=${CHEMIN%%/*}; NOM=${CHEMIN#*/}
echo "Publié."
echo "→ https://${PROPRIO}.github.io/${NOM}/"
