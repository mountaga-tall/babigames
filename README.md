# 🎮 BabiGames

BabiGames est une PWA statique Glassmorphism / Wow Effect comprenant 8 jeux : Snake, Démineur, Échecs, Dames, Puissance 4, 2048, Memory et Tetris.

## Corrections principales

- Sélecteurs HTML/JavaScript réalignés pour les 8 jeux.
- Scores et meilleurs scores persistants avec `localStorage`.
- Contrôles tactiles dédiés pour Snake, 2048 et Tetris, en plus du clavier et du swipe lorsque pertinent.
- Timers et IA annulés proprement lorsqu'on quitte un jeu afin d'éviter les actions fantômes.
- Échecs : prise en passant correctement comptabilisée, roque sécurisé avec vérification des tours, meilleure détection d'échec.
- Dames : rafles multiples verrouillées sur la même pièce pendant la séquence de prise.
- Puissance 4 : IA corrigée, victoire/égalité gérées, animation du dernier coup.
- 2048 : meilleure gestion du game over, détection de mouvements impossibles, score et victoire à 2048.
- Memory : animation de retournement, score calculé et meilleur score sauvegardé.
- Tetris : collisions fiables, ghost piece, chute instantanée, niveaux et scoring par lignes.
- UX : focus clavier, fermeture avec Échap, dialogue de fin de partie, ripple/click feedback, responsive et `prefers-reduced-motion`.
- Service Worker versionné en `babigames-v4` pour éviter de conserver l'ancienne version en cache.

## Déploiement

Projet 100% statique : HTML, CSS et JavaScript sans dépendance externe. Fonctionne sur GitHub Pages, Netlify, Cloudflare Pages et tout hébergement statique.
