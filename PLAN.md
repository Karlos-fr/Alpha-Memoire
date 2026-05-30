# Plan de développement - Alpha-Mémoire

## Phase 1 - Initialisation du projet

- [x] Initialiser une application Vite + React + TypeScript.
- [x] Installer les dépendances de base.
- [x] Nettoyer les fichiers générés inutiles.
- [x] Créer la structure des dossiers : `src/components`, `src/data`, `src/features`, `src/hooks`, `src/lib`, `src/styles`, `src/types`.
- [x] Configurer les scripts `dev`, `build`, `preview` et `lint`.
- [x] Ajouter une feuille de style globale.
- [x] Mettre en place un premier écran fonctionnel avec le titre `Alpha-Mémoire`.
- [x] Vérifier que l'application démarre sur navigateur PC.
- [x] Vérifier que l'application s'affiche correctement en largeur mobile.

## Phase 2 - Modèles TypeScript

- [x] Créer le type `LetterStatus` : `new`, `learning`, `fragile`, `known`.
- [x] Créer le type `ExerciseType` : `discovery`, `recognition`, `choice`, `association`, `naming`.
- [x] Créer le type `LetterCard` pour décrire une lettre, son mot, son image et sa phrase audio.
- [x] Créer le type `LetterProgress` pour stocker la progression d'une lettre.
- [x] Créer le type `ExerciseResult` pour stocker le résultat d'un exercice.
- [x] Créer le type `SessionRecord` pour stocker une séance complète.
- [x] Créer le type `AppProgress` pour stocker toute la progression de Nathan.
- [x] Ajouter des constantes pour le prénom `Nathan`, la durée cible et le nombre d'exercices.

## Phase 3 - Données des lettres

- [x] Créer le fichier de données des lettres.
- [x] Ajouter les lettres du groupe initial : `N`, `A`, `T`, `H`.
- [x] Ajouter les cartes des 26 lettres avec mot, phrase audio et visuel temporaire.
- [x] Ajouter pour chaque lettre un mot associé.
- [x] Ajouter pour chaque lettre une phrase audio, par exemple `N comme Nathan`.
- [x] Ajouter une représentation visuelle temporaire pour chaque lettre.
- [x] Préparer la structure pour ajouter les 26 lettres plus tard.
- [x] Vérifier que les accents sont correctement encodés dans les fichiers.

## Phase 4 - Stockage local

- [x] Créer une clé de stockage unique pour Alpha-Mémoire.
- [x] Créer une fonction `loadProgress`.
- [x] Créer une fonction `saveProgress`.
- [x] Créer une fonction `createInitialProgress`.
- [x] Initialiser automatiquement la progression si aucune donnée n'existe.
- [x] Sauvegarder la progression après chaque séance.
- [x] Créer une fonction `exportProgressToJson`.
- [x] Créer une fonction `importProgressFromJson`.
- [x] Gérer les erreurs d'import JSON.
- [x] Tester la persistance après rechargement de la page.

## Phase 5 - Moteur de progression

- [x] Créer une fonction qui met à jour une lettre après une bonne réponse sans aide.
- [x] Créer une fonction qui met à jour une lettre après une bonne réponse avec aide.
- [x] Créer une fonction qui met à jour une lettre après une erreur.
- [x] Incrémenter les réussites, erreurs, aides et séries de réussites.
- [x] Mettre à jour les dates de dernière apparition et dernière réussite.
- [x] Passer une lettre en `learning` lorsqu'elle a été vue.
- [x] Passer une lettre en `fragile` après des erreurs ou aides répétées.
- [x] Passer une lettre en `known` seulement après plusieurs réussites sur plusieurs séances.
- [x] Éviter qu'une seule bonne séance rende une lettre définitivement connue.
- [x] Ajouter des tests manuels ou unitaires simples sur ces règles.

## Phase 6 - Générateur de séance

- [x] Créer une fonction `generateSessionPlan`.
- [x] Lire la progression actuelle avant de générer la séance.
- [x] Générer 8 à 10 exercices par séance.
- [x] Limiter la séance à 12 exercices maximum.
- [x] Utiliser 3 à 5 lettres différentes au départ.
- [x] Démarrer par 1 ou 2 exercices faciles.
- [x] Prioriser les lettres fragiles.
- [x] Ajouter des lettres en apprentissage.
- [x] Ajouter une petite part de lettres connues en révision.
- [x] Ajouter 0 ou 1 nouvelle lettre maximum par séance.
- [x] Ne pas ajouter de nouvelle lettre si trop de lettres sont fragiles.
- [x] Construire une séance différente à chaque génération.

## Phase 7 - Synthèse vocale

- [x] Créer un hook ou service `useSpeech`.
- [x] Détecter si `speechSynthesis` est disponible.
- [x] Sélectionner une voix française si possible.
- [x] Créer une fonction `speak(text)`.
- [x] Créer une fonction `stopSpeaking`.
- [x] Ajouter un réglage de vitesse de parole.
- [x] Ajouter un réglage de volume.
- [x] Lire les consignes automatiquement.
- [x] Ajouter un bouton pour répéter la consigne.
- [x] Afficher la consigne à l'écran si la synthèse vocale n'est pas disponible.

## Phase 8 - Interface enfant

- [x] Créer l'écran d'accueil enfant.
- [x] Ajouter un bouton pour démarrer une séance.
- [x] Créer le composant d'exercice principal.
- [x] Afficher une très grande lettre centrale.
- [x] Afficher les choix sous forme de gros boutons tactiles.
- [x] Créer le mode découverte.
- [x] Créer le mode reconnaissance.
- [x] Créer le mode choix avec 2 lettres.
- [x] Créer le mode choix avec 3 lettres.
- [x] Créer le mode association.
- [x] Créer le mode nomination avec validation parentale.
- [x] Ajouter les messages positifs personnalisés avec `Nathan`.
- [x] Ajouter une aide visuelle après une erreur.
- [x] Ne jamais afficher de score côté enfant.
- [x] Créer un écran de fin de séance positif.

## Phase 9 - Univers visuel

- [ ] Créer une direction visuelle espace et mission.
- [ ] Ajouter un compagnon visuel type petit droïde original.
- [ ] Éviter toute reprise directe de Star Wars : noms, logos, personnages, musiques.
- [ ] Définir une palette douce, contrastée et lisible.
- [ ] Adapter les tailles pour mobile et PC.
- [ ] Ajouter des états visuels pour réponse correcte, aide et transition.
- [ ] Vérifier que tous les boutons restent facilement cliquables sur mobile.
- [ ] Vérifier que le texte ne déborde pas dans les boutons.

## Phase 10 - Enregistrement des séances

- [ ] Créer un identifiant unique pour chaque séance.
- [ ] Enregistrer la date de début de séance.
- [ ] Enregistrer la date de fin de séance.
- [ ] Enregistrer la durée de séance.
- [ ] Enregistrer chaque exercice réalisé.
- [ ] Enregistrer la lettre demandée pour chaque exercice.
- [ ] Enregistrer le type d'exercice.
- [ ] Enregistrer le nombre d'essais.
- [ ] Enregistrer si une aide a été utilisée.
- [ ] Enregistrer si la réponse finale est réussie.
- [ ] Ajouter la séance terminée à l'historique.
- [ ] Sauvegarder automatiquement après la fin de séance.

## Phase 11 - Tableau de bord parent

- [ ] Créer une route ou vue parent.
- [ ] Ajouter une navigation entre espace enfant et espace parent.
- [ ] Afficher le nombre total de séances.
- [ ] Afficher la date de la dernière séance.
- [ ] Afficher les lettres connues.
- [ ] Afficher les lettres en apprentissage.
- [ ] Afficher les lettres fragiles.
- [ ] Afficher une carte de progression par lettre.
- [ ] Afficher l'historique séance par séance.
- [ ] Afficher le détail d'une séance sélectionnée.
- [ ] Ajouter le bouton export JSON.
- [ ] Ajouter le bouton import JSON.
- [ ] Ajouter un bouton de réinitialisation avec confirmation.

## Phase 12 - Adaptation séance après séance

- [ ] Utiliser l'historique pour générer la séance suivante.
- [ ] Augmenter la fréquence d'une lettre après erreur.
- [ ] Réduire la fréquence d'une lettre stable.
- [ ] Réviser une lettre connue si elle n'a pas été vue depuis plusieurs jours.
- [ ] Proposer la nomination seulement si la reconnaissance est stable.
- [ ] Revenir à un exercice plus simple après une erreur.
- [ ] Vérifier manuellement qu'une erreur influence bien la séance suivante.
- [ ] Vérifier manuellement qu'une réussite répétée réduit la fréquence d'une lettre.

## Phase 13 - Tests et validation navigateur

- [ ] Lancer l'application en local.
- [ ] Tester une séance complète sur PC.
- [ ] Tester une séance complète en affichage mobile.
- [ ] Tester la synthèse vocale dans Chrome ou Edge.
- [ ] Tester le bouton de répétition de consigne.
- [ ] Tester la sauvegarde après séance.
- [ ] Tester le rechargement de page après une séance.
- [ ] Tester l'export JSON.
- [ ] Tester l'import JSON.
- [ ] Tester le tableau de bord parent.
- [ ] Vérifier qu'aucun message négatif n'apparaît.
- [ ] Vérifier que l'enfant peut terminer une séance sans blocage.

## Phase 14 - Première observation avec Nathan

- [ ] Faire une séance réelle courte avec Nathan.
- [ ] Noter les lettres reconnues facilement.
- [ ] Noter les lettres qui demandent de l'aide.
- [ ] Noter les consignes qui ne sont pas comprises.
- [ ] Noter si la durée de séance est adaptée.
- [ ] Ajuster le nombre d'exercices si nécessaire.
- [ ] Ajuster la vitesse de la voix si nécessaire.
- [ ] Ajuster les mots ou visuels qui ne fonctionnent pas.
- [ ] Ajuster les règles du moteur adaptatif avec les résultats réels.

## Priorité de la V1

- [ ] Application React utilisable sur navigateur PC et mobile.
- [ ] Séances de 8 à 10 exercices.
- [ ] Groupe initial `N`, `A`, `T`, `H`.
- [ ] Reconnaissance des lettres.
- [ ] Nomination avec validation parentale.
- [ ] Synthèse vocale avec le prénom Nathan.
- [ ] Sauvegarde automatique des séances.
- [ ] Tableau de bord parent.
- [ ] Export et import JSON.
