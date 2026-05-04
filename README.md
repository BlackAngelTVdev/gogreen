# 🚀 goGreen
![Stars](https://img.shields.io/github/stars/BlackAngelTVdev/gogreen?style=for-the-badge&color=yellow)
![Commits](https://img.shields.io/github/commit-activity/m/BlackAngelTVdev/gogreen?style=for-the-badge&color=blue)
![Issues](https://img.shields.io/github/issues/BlackAngelTVdev/gogreen?style=for-the-badge&color=orange)
![Forks](https://img.shields.io/github/forks/BlackAngelTVdev/gogreen?style=for-the-badge&color=808080)
![Last Commit](https://img.shields.io/github/last-commit/BlackAngelTVdev/gogreen?style=for-the-badge&color=blue)

> **Génère automatiquement des commits Git sur un dépôt cible, avec une plage de dates personnalisée et une petite interface web.**
>
> Le front est séparé du back, et le backend clone le dépôt indiqué avant de créer les commits et de pousser les changements.

---

## ⚡ Utilisation rapide

> ⚠️ **Le script doit être exécuté avec un accès Git valide** sur le dépôt cible, et tu dois avoir les droits de push sur ce repo.

Dans le projet :
```bash
npm install
npm run start
```

Puis ouvre :
```text
http://localhost:3000
```

Dans l'interface :
- coche ou décoche le mode `Oui, je veux fake sur ce repo-là`
- renseigne l'URL du dépôt cible, par exemple `https://github.com/BlackAngelTVdev/gogreen.git`
- choisis une date de début et une date de fin
- règle le nombre de commits
- laisse la génération se lancer automatiquement

Les commits sont créés dans le dépôt ciblé, puis poussés à la fin.

---

## 🧐 Aperçu
Ce projet contient une petite interface web qui :
- affiche un formulaire simple pour choisir le dépôt cible,
- prend une plage de dates personnalisée,
- génère une série de commits datés dans cet intervalle,
- clone le dépôt cible dans un dossier temporaire,
- pousse les commits vers le remote à la fin,
- affiche le résultat dans la page.

> Le bloc de résultat est affiché en bas de page pour garder le formulaire lisible.

---

## ✨ Fonctionnalités
- ✅ **Interface web simple** pour piloter la génération.
- ✅ **Choix du dépôt cible** avec une URL Git complète.
- ✅ **Plage de dates personnalisée** pour répartir les commits.
- ✅ **Auto-lancement** dès l'ouverture de la page.
- ✅ **Front séparé du back** pour garder la logique propre.
- ✅ **Clonage temporaire du repo** avant génération.
- ✅ **Push final automatique** une fois les commits créés.
- ✅ **Mode rapide** avec commits `--allow-empty`, sans I/O inutile sur des fichiers de travail.

---

## 🧠 Format recommandé
Le projet fonctionne avec un formulaire, donc il n'y a pas de format de commit à taper manuellement.

Si tu veux adapter les messages, le backend utilise actuellement :
- `update 1/10`
- `update 2/10`
- etc.

Tu peux changer le message de base dans l'interface.

---

## 🛠 Tech Stack
| Technologie | Usage |
| :--- | :--- |
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) | Serveur local et logique d'exécution |
| ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) | Interface web |
| ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) | Mise en forme |
| ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) | Logique front et backend |
| ![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white) | Source et destination des commits |
| ![moment](https://img.shields.io/badge/moment-005C99?style=flat-square) | Manipulation des dates |
| ![simple-git](https://img.shields.io/badge/simple--git-2E8B57?style=flat-square) | Commandes Git via Node |

---

## 🚀 Installation & Lancement

### Prérequis
- Node.js
- Git
- Accès au dépôt cible en lecture et écriture

### Lancer le projet
```bash
npm install
npm run start
```

### Utiliser l'interface
1. Ouvre `http://localhost:3000`
2. Garde ou change l'URL du dépôt cible
3. Choisis une date de début et une date de fin
4. Renseigne le nombre de commits
5. Laisse la génération se lancer automatiquement

---

## 📖 Utilisation

### Où lancer le projet ?
Lance-le depuis le dossier du projet, puis utilise l'interface web.

### Exemple de workflow
1. Tu mets l'URL du dépôt, par exemple :
   - `https://github.com/BlackAngelTVdev/gogreen.git`
2. Tu choisis une plage de dates.
3. Tu laisses la génération créer les commits automatiquement.
4. Le dépôt cible reçoit les commits puis le push final.

### Dépannage rapide
- Si l'URL du dépôt est incorrecte, vérifie qu'elle se termine bien par `.git`.
- Si le push échoue, vérifie tes droits sur le dépôt cible.
- Si le dépôt est privé, il faut un accès Git authentifié.
- Si l'interface n'affiche rien, relance `npm run start` et recharge la page.

---

## 🤝 Contribution

### Cloner le projet
```bash
git clone https://github.com/BlackAngelTVdev/gogreen.git
cd gogreen
```

### Proposer une amélioration
1. Forke le projet
2. Crée ta branche : `git checkout -b feature/AmazingFeature`
3. Commit : `git commit -m "Add some AmazingFeature"`
4. Push : `git push origin feature/AmazingFeature`
5. Ouvre une Pull Request

### 🧑‍💻 Contributors

Merci à toutes les personnes qui contribuent au projet.

[![Contributors](https://contrib.rocks/image?repo=BlackAngelTVdev/gogreen)](https://github.com/BlackAngelTVdev/gogreen/graphs/contributors)

---

## 👤 Auteur

**BlackAngelTVdev**  
![Follow](https://img.shields.io/github/followers/BlackAngelTVdev?label=Follow%20Me&style=social)

---

## 📄 Licence
Ce projet est distribué sous licence **MIT**.

- ✅ Tu peux utiliser, modifier et redistribuer le code.
- ✅ Tu peux l'utiliser dans des projets personnels ou commerciaux.
- ⚠️ Garde la notice de licence dans les copies du projet.

Détails complets : voir le fichier [LICENSE](LICENSE).
