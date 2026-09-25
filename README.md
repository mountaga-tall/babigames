# 🎮 BabiGames

BabiGames est une PWA Glassmorphism / Wow Effect comprenant 8 jeux : Snake, Démineur, Échecs, Dames, Puissance 4, 2048, Memory et Tetris.

## Échecs & Dames
- 3 niveaux : Facile, Moyen, Expert.
- Score en temps réel + meilleur score sauvegardé en local.
- Chronomètre par tour du joueur : lorsque le temps expire, le tour passe à l'IA.
- Échecs : déplacements légaux, protection du roi, échec, échec et mat, pat, roque, prise en passant et promotion automatique.
- Dames : prise obligatoire, rafles multiples, promotion et vraies dames à longue portée sur diagonales.

## Arcade
Chaque jeu dispose de son score en direct, de son meilleur score local et d'effets de fin de partie.

## PWA / GitHub Pages
Le projet est 100% statique : HTML, CSS et JavaScript sans dépendance externe. Le Service Worker est versionné en `babigames-v2` pour éviter de conserver l'ancienne version en cache.

Structure :
```text
babigames-main/
├── .gitignore
├── index.html
├── manifest.json
├── sw.js
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── snake.js
│   ├── minesweeper.js
│   ├── board-games.js
│   └── arcade-games.js
└── icons/
    ├── icon-192.png
    └── icon-512.png
```
