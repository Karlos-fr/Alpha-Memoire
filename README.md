# Projet : Les Lettres de Nathan

## Contexte

Nathan est en moyenne section (5 ans).

Il présente un retard de langage et est suivi deux fois par semaine par une orthophoniste.

Difficultés observées :

* acquisition lente du vocabulaire
* difficulté avec les articles (un/une)
* difficulté à construire des phrases
* difficulté de mémorisation

Exemple :

* les couleurs ont nécessité beaucoup de répétitions avant d'être acquises
* les lettres de l'alphabet ne sont actuellement pas maîtrisées

Points positifs :

* Nathan connaît la chanson de l'alphabet
* Nathan connaît les premières lettres de l'alphabet
* Nathan reconnaît les lettres de son prénom NATHAN
* Le H reste plus fragile

Objectif :

Créer une application web permettant à Nathan d'apprendre l'alphabet de manière progressive, ludique et adaptative.

L'application doit éviter les situations d'échec et adapter automatiquement les séances selon les résultats obtenus.

---

# Nom du projet

Nom retenu :

Les Lettres de Nathan

Autres noms possibles :

* AlphaCompagnon
* AlphaQuest
* La Chasse aux Lettres
* Les Lettres Magiques

---

# Public cible

* enfants de 4 à 6 ans
* difficultés de mémorisation
* retard de langage
* apprentissage progressif des lettres

---

# Contraintes pédagogiques

Les séances doivent durer :

* minimum 5 minutes
* maximum 10 minutes

L'application ne doit jamais :

* sanctionner l'erreur
* afficher de score négatif
* mettre l'enfant en échec

L'application doit :

* encourager
* féliciter
* répéter
* adapter les exercices

---

# Principes pédagogiques

Le cerveau mémorise mieux lorsqu'une lettre est associée à :

* une image
* un mot
* une voix
* une action

Chaque lettre est donc associée à :

* son nom
* un mot simple
* une illustration
* une synthèse vocale

---

# Association lettres / mots

| Lettre | Mot       |
| ------ | --------- |
| A      | Avion     |
| B      | Ballon    |
| C      | Chat      |
| D      | Doudou    |
| E      | Éléphant  |
| F      | Fleur     |
| G      | Gâteau    |
| H      | Hérisson  |
| I      | Île       |
| J      | Jouet     |
| K      | Koala     |
| L      | Lune      |
| M      | Maman     |
| N      | Nathan    |
| O      | Ours      |
| P      | Papa      |
| Q      | Quatre    |
| R      | Robot     |
| S      | Serpent   |
| T      | Train     |
| U      | Usine     |
| V      | Vélo      |
| W      | Wagon     |
| X      | Xylophone |
| Y      | Yaourt    |
| Z      | Zèbre     |

---

# Progression pédagogique

## Étape 1 : Reconnaissance

L'application dit :

"Montre-moi le C"

Nathan doit cliquer sur la bonne lettre.

Objectif :

Reconnaître visuellement la lettre.

---

## Étape 2 : Discrimination

L'application affiche :

C D

et demande :

"Montre-moi le C"

Objectif :

Différencier les lettres.

---

## Étape 3 : Association

L'application dit :

"C comme Chat"

Objectif :

Associer lettre + mot + image.

---

## Étape 4 : Nommer la lettre

L'application montre :

C

et demande :

"Tu te rappelles comment elle s'appelle ?"

Cette étape ne doit apparaître que lorsque la reconnaissance est maîtrisée.

---

# Modes de jeu

## Mode Découverte

L'application :

* montre la lettre
* prononce son nom
* montre l'image associée

Exemple :

"C comme Chat"

---

## Mode Trouve la lettre

L'application demande :

"Trouve le C"

Nathan clique.

---

## Mode Choisis

L'application affiche plusieurs lettres.

Exemple :

A C D

et demande :

"Montre-moi le C"

---

## Mode Révision

L'application revoit les lettres fragiles.

---

## Mode Bilan

Destiné aux parents.

Affiche :

* lettres connues
* lettres fragiles
* lettres en cours d'acquisition

---

# Moteur adaptatif

Chaque lettre possède un score.

Exemple :

```typescript
interface LetterProgress {
  letter: string;
  success: number;
  errors: number;
  streak: number;
  status: "new" | "learning" | "known";
}
```

## Règles

### Bonne réponse immédiate

* success +1
* streak +1

### Bonne réponse après erreur

* success +1
* remise en séance suivante

### Mauvaise réponse

* errors +1
* priorité haute

### 3 réussites consécutives

La lettre passe en :

known

---

# Génération des séances

Durée cible :

5 à 10 minutes

Contenu :

* 60 % lettres fragiles
* 30 % lettres en cours d'apprentissage
* 10 % lettres connues

Nombre de questions :

8 à 12 maximum

---

# Synthèse vocale

Utiliser :

SpeechSynthesis API

Exemples :

"Bonjour Nathan"

"Trouve le C"

"Bravo !"

"C comme Chat"

"On réessaie ensemble"

---

# Messages positifs

Bonnes réponses :

* Bravo !
* Super !
* Génial !
* Tu progresses !
* Bien joué !

Erreurs :

* Presque !
* On essaie encore !
* Je vais t'aider !
* Regardons ensemble !

Jamais :

* Faux
* Mauvais
* Perdu

---

# Sauvegarde

Version 1 :

localStorage

Aucun serveur requis.

Données stockées :

* progression
* historique des séances
* lettres connues
* lettres fragiles

---

# Technologies

Version simple :

* Vite
* TypeScript
* React
* CSS

Aucune dépendance serveur.

Application utilisable :

* PC
* tablette
* téléphone

---

# Interface

Éléments principaux :

* grosse lettre centrale
* image associée
* gros boutons cliquables
* couleurs douces
* mode plein écran

Police :

* adaptée aux enfants
* lettres majuscules uniquement

---

# Tableau de bord parent

Afficher :

* nombre de séances
* lettres connues
* lettres fragiles
* progression globale

Exemple :

A : acquis
B : acquis
C : fragile
D : fragile
E : apprentissage

---

# Objectif final

Permettre à Nathan d'apprendre l'alphabet à son rythme grâce à :

* des séances courtes
* beaucoup de répétitions
* une adaptation automatique
* des encouragements constants
* aucune situation d'échec
