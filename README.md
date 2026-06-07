# Alpha-Memoire

Alpha-Memoire est une application web React/Vite pour accompagner Nathan dans
l'apprentissage progressif des lettres de l'alphabet. Elle propose des séances
courtes, positives et adaptatives, avec consignes vocales, images associées aux
lettres, suivi local de la progression et tableau de bord parent.

L'application est pensée pour un enfant de moyenne section avec besoin de
répétition, de consignes simples et d'un cadre sans mise en échec.

## Fonctionnalités

- Espace enfant avec démarrage de séance, consignes affichées et synthèse vocale.
- Exercices de reconnaissance avec 2 ou 3 choix.
- Exercices d'association lettre + mot + image.
- Exercice de nomination quand la reconnaissance devient suffisamment stable.
- Feedback positif après réussite et aide douce après erreur.
- Masquage de la lettre cible dans les exercices de reconnaissance pour éviter
  que l'écran donne la réponse.
- Espace parent avec statistiques, historique, détail des séances et graphiques.
- Export, import et réinitialisation de la progression au format JSON.
- Option parent pour masquer les images pendant les exercices, enregistrée dans
  le navigateur.
- Mode debug depuis l'accueil pour tester rapidement chaque type d'exercice.
- Sauvegarde entièrement locale via `localStorage`, sans serveur applicatif.

## Parcours pédagogique

Le premier groupe travaillé est centré sur le prénom de Nathan :

```text
N A T H
```

Chaque lettre de l'alphabet dispose d'une carte locale avec :

- une majuscule ;
- un mot simple ;
- une phrase audio de type `C comme Chat` ;
- une image dans `public/assets/letters`.

Les exercices disponibles sont :

| Type | Description |
| --- | --- |
| `twoChoice` | Choisir la bonne lettre parmi 2 choix. |
| `threeChoice` | Choisir la bonne lettre parmi 3 choix. |
| `association` | Voir et entendre l'association lettre + mot + image. |
| `naming` | Nommer la lettre, avec validation par le parent. |

## Moteur adaptatif

La progression de chaque lettre est suivie avec les compteurs suivants :

- nombre d'expositions ;
- réussites totales ;
- réussites autonomes ;
- réussites avec aide ;
- erreurs ;
- série courante ;
- séances réussies ;
- dates de première vue, dernière vue, dernière réussite et dernière erreur.

Une lettre peut avoir le statut `new`, `learning`, `fragile` ou `known`.

Les règles principales sont :

- une réussite autonome augmente la série courante ;
- une réussite avec aide compte comme réussite, mais remet la série à zéro ;
- une erreur remet la série à zéro et peut rendre la lettre fragile ;
- une lettre devient `known` après plusieurs réussites autonomes réparties sur
  plusieurs séances ;
- les lettres fragiles ou récemment aidées reviennent plus souvent ;
- une lettre connue mais non revue depuis plusieurs jours peut être proposée en
  révision ;
- une nouvelle lettre n'est introduite que lorsque le groupe actif est stable ou
  après plusieurs séances récentes propres.

Les séances contiennent généralement 8 à 10 exercices. Elles peuvent dépasser ce
nombre quand l'historique contient davantage de lettres à couvrir, afin de ne
pas oublier des lettres déjà engagées dans la progression.

## Evolution des séances

Chaque nouvelle séance est générée à partir de la progression sauvegardée et des
trois dernières séances. Le générateur ne suit donc pas un ordre alphabétique
strict : il choisit les lettres qui ont le plus de sens pédagogiquement au moment
où la séance démarre.

### 1. Lettres prioritaires

La séance sélectionne d'abord les lettres qui demandent le plus d'attention :

- lettres ayant posé problème récemment, c'est-à-dire avec aide, plusieurs
  essais ou erreur dans les trois dernières séances ;
- lettres au statut `fragile` ;
- lettres du groupe actif initial `N A T H` tant qu'elles ne sont pas toutes
  stabilisées ;
- lettres déjà en apprentissage ;
- lettres connues à revoir.

Les lettres problématiques et fragiles sont répétées plus souvent dans la même
séance. Une lettre stable et connue reste présente, mais avec une fréquence plus
faible.

### 2. Introduction d'une nouvelle lettre

Une seule nouvelle lettre peut être introduite dans une séance.

Elle est introduite seulement si :

- aucune lettre n'est actuellement `fragile` ;
- le groupe actif contient au plus une lettre encore instable ;
- ou les trois dernières séances sont propres, c'est-à-dire sans erreur, sans
  aide et avec des réponses au premier essai.

Si une lettre fragile existe, la séance reste concentrée sur les lettres déjà en
cours et n'ajoute pas de nouveauté.

### 3. Révision des lettres connues

Une lettre `known` n'est pas abandonnée. Elle peut revenir :

- si elle fait partie des lettres obligatoires à couvrir ;
- si elle n'a pas été vue depuis au moins 7 jours ;
- si elle redevient problématique dans une séance récente.

Les lettres connues très stables, avec au moins 4 réussites autonomes et une
série courante d'au moins 4, sont moins répétées que les lettres fragiles ou en
apprentissage.

### 4. Choix des exercices dans la séance

La séance commence par des exercices faciles de reconnaissance à 2 choix sur les
lettres les moins difficiles du groupe sélectionné. Ensuite, le générateur varie
les types d'exercices selon le niveau de chaque lettre :

| Situation de la lettre | Exercices privilégiés |
| --- | --- |
| Lettre nouvelle | Association puis reconnaissance à 2 choix. |
| Lettre récemment aidée ou échouée | Association et reconnaissance à 2 choix. |
| Lettre fragile | Association et reconnaissance à 3 choix. |
| Lettre en apprentissage stable | Reconnaissance à 3 choix, parfois association. |
| Lettre prête à être nommée | Nomination possible, sinon reconnaissance à 3 choix. |

L'exercice `naming` n'apparaît que si la lettre est assez stable :

- statut `learning` ou `known` ;
- au moins 3 réussites autonomes ;
- série courante d'au moins 3 ;
- au moins une séance réussie pour cette lettre ;
- aucun problème récent sur cette lettre.

### 5. Effet des réponses sur la séance suivante

Les réponses de Nathan influencent directement les séances suivantes :

- réussite autonome : la lettre progresse, sa série augmente et elle peut devenir
  `known` après plusieurs séances réussies ;
- réussite avec aide : la lettre progresse, mais reste à consolider car la série
  revient à zéro ;
- erreur : la lettre devient prioritaire et peut passer `fragile` après erreurs
  répétées ;
- simple exposition en association : la lettre est marquée comme vue, sans être
  comptée comme réussite ou erreur.

Une lettre devient `known` seulement après au moins 2 séances réussies, 4
réussites autonomes et une série courante d'au moins 3.

## Espace parent

L'espace parent affiche :

- le nombre de séances terminées ;
- la date de la dernière séance ;
- le nombre de lettres connues et fragiles ;
- les groupes de lettres par statut ;
- une grille de progression pour tout l'alphabet ;
- l'historique des séances ;
- le détail de chaque exercice d'une séance ;
- des graphiques simples sur les résultats récents et les lettres connues.

Les boutons `Export JSON`, `Import JSON` et `Reinitialiser` permettent de gérer
la sauvegarde locale.

L'option `Afficher les images pendant les exercices` permet de travailler sans
support visuel illustré. Ce choix est conservé localement dans le navigateur et
s'applique aux séances suivantes.

## Technologies

- React 19
- TypeScript 6
- Vite 8
- Vitest
- Playwright
- ESLint
- Web Speech API (`speechSynthesis`)
- `localStorage`

## Installation

Le workflow GitHub Actions utilise Node.js 24. Utiliser une version récente de
Node compatible avec les dépendances du projet.

```bash
npm ci
```

## Développement

```bash
npm run dev
```

Par défaut, Vite démarre sur :

```text
http://localhost:5173/Alpha-Memoire/
```

## Commandes

```bash
npm run dev       # serveur de développement
npm run build     # vérification TypeScript + build Vite
npm run preview   # prévisualisation du build
npm run lint      # lint ESLint
npm run test      # tests unitaires Vitest
npm run test:e2e  # tests Playwright
```

Les tests Playwright attendent une application servie sur
`http://127.0.0.1:5173`. Lancer `npm run dev` dans un terminal avant
`npm run test:e2e`.

## Structure du projet

```text
src/
  App.tsx                         Interface enfant et espace parent
  data/
    letters.ts                    Cartes de lettres et assets associés
    speechPhrases.ts              Messages vocaux positifs
  features/
    progress/progressEngine.ts    Règles de progression par lettre
    session/sessionGenerator.ts   Génération adaptative des séances
  hooks/
    useSpeech.ts                  Hook navigateur pour la synthèse vocale
  lib/
    appConfig.ts                  Constantes applicatives
    progressStorage.ts            Persistance localStorage + import/export
    speech.ts                     Réglages et choix de voix
  types/
    learning.ts                   Modèles d'apprentissage
tests/
  unit/                           Tests Vitest du moteur et des utilitaires
  e2e/                            Tests Playwright du parcours navigateur
public/
  assets/letters/                 Images des cartes de lettres
```

## Déploiement

Le dépôt est configuré pour publier automatiquement sur GitHub Pages à chaque
push sur `master`.

URL publique :

```text
https://karlos-fr.github.io/Alpha-Memoire/
```

La configuration Vite utilise le chemin de base `/Alpha-Memoire/`, ce qui permet
de charger correctement les assets depuis GitHub Pages.

## Données et confidentialité

Aucune donnée n'est envoyée à un serveur par l'application. La progression est
stockée dans le navigateur, sous la clé :

```text
alpha-memoire:nathan:progress:v1
```

Le choix d'affichage des images est également stocké localement, sous la clé :

```text
alpha-memoire:nathan:show-images:v1
```

Pour changer de navigateur ou sauvegarder l'historique, utiliser l'export JSON
depuis l'espace parent.
