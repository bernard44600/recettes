#!/bin/sh
# Publie les modifications de ce dossier sur GitHub.
#   ./publier.sh                 → commit « mise à jour »
#   ./publier.sh "mon message"   → commit avec ce message
# Le site (GitHub Pages, mode branche) se reconstruit tout seul en ~30 s.
set -e
cd "$(dirname "$0")"
MSG="${1:-mise à jour}"

# liste des fiches drawio, si le dépôt en a un
if [ -x ./maj_liste.sh ]; then ./maj_liste.sh >/dev/null 2>&1 || true; fi

if [ -z "$(git status --porcelain)" ]; then
  echo "Rien à publier : aucune modification depuis le dernier commit."
  exit 0
fi

git add -A
git commit -q -m "$MSG"
if ! git push -q origin HEAD 2>/tmp/push_err.$$; then
  echo "Échec du push :" >&2; cat /tmp/push_err.$$ >&2; rm -f /tmp/push_err.$$
  echo "" >&2
  echo "Si le message parle de clé ou d'authentification, c'est que la clé SSH" >&2
  echo "n'est pas installée sur cette machine (voir ~/.ssh/config et" >&2
  echo "~/.ssh/id_ed25519_bernard44600)." >&2
  exit 1
fi
rm -f /tmp/push_err.$$

CHEMIN=$(git remote get-url origin | sed 's#.*:##; s#\.git$##')
PROPRIO=${CHEMIN%%/*}; NOM=${CHEMIN#*/}
echo "Publié : $MSG"
echo "→ https://${PROPRIO}.github.io/${NOM}/"
