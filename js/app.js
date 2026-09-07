# /*

BabiGames — Application Core
Version 1.0
===========

*/

/* =========================================
INITIALISATION
========================================= */

document.addEventListener("DOMContentLoaded", () => {

```
const currentUser =
    localStorage.getItem("babiGamesCurrentUser");

if (currentUser) {
    showApp(currentUser);
} else {
    showLogin();
}
```

});

/* =========================================
STORAGE
========================================= */

function getUsers() {

```
try {
    return JSON.parse(
        localStorage.getItem("babiGamesUsers") || "[]"
    );
} catch {
    return [];
}
```

}

function saveUsers(users) {

```
localStorage.setItem(
    "babiGamesUsers",
    JSON.stringify(users)
);
```

}

function getCurrentUser() {

```
const username =
    localStorage.getItem("babiGamesCurrentUser");

if (!username) return null;

const users = getUsers();

return users.find(
    user => user.username === username
) || null;
```

}

/* =========================================
AUTH — LOGIN
========================================= */

function login() {

```
const username =
    document
        .getElementById("loginUsername")
        .value
        .trim();

const password =
    document
        .getElementById("loginPassword")
        .value;

const message =
    document.getElementById("loginMessage");


if (!username || !password) {

    message.textContent =
        "Entre ton identifiant et ton mot de passe.";

    return;
}


const users = getUsers();

const user = users.find(
    u =>
        u.username.toLowerCase() === username.toLowerCase() &&
        u.password === password
);


if (!user) {

    message.textContent =
        "Identifiant ou mot de passe incorrect.";

    shake(document.querySelector(".auth-box"));

    return;
}


localStorage.setItem(
    "babiGamesCurrentUser",
    user.username
);


showApp(user.username);

showToast(
    "Bienvenue 👋",
    `Content de te revoir, ${user.username}.`
);
```

}

/* =========================================
AUTH — REGISTER
========================================= */

function register() {

```
const username =
    document
        .getElementById("registerUsername")
        .value
        .trim();

const password =
    document
        .getElementById("registerPassword")
        .value;

const confirmPassword =
    document
        .getElementById("registerPasswordConfirm")
        .value;

const message =
    document.getElementById("registerMessage");


if (!username || !password || !confirmPassword) {

    message.textContent =
        "Tous les champs sont obligatoires.";

    return;
}


if (username.length < 3) {

    message.textContent =
        "Ton pseudo doit contenir au moins 3 caractères.";

    return;
}


if (password.length < 6) {

    message.textContent =
        "Le mot de passe doit contenir au moins 6 caractères.";

    return;
}


if (password !== confirmPassword) {

    message.textContent =
        "Les deux mots de passe ne correspondent pas.";

    return;
}


const users = getUsers();


const exists = users.some(
    user =>
        user.username.toLowerCase() === username.toLowerCase()
);


if (exists) {

    message.textContent =
        "Ce pseudo est déjà utilisé.";

    return;
}


const newUser = {

    username,

    password,

    createdAt: new Date().toISOString(),

    level: 1,

    xp: 0,

    wins: 0,

    games: 0,

    streak: 0,

    scores: {

        chess: 0,

        checkers: 0,

        snake: 0,

        minesweeper: 0

    }

};


users.push(newUser);

saveUsers(users);


localStorage.setItem(
    "babiGamesCurrentUser",
    username
);


showApp(username);


showToast(
    "Profil créé 🚀",
    "Bienvenue dans l’arène BabiGames."
);
```

}

/* =========================================
AUTH — PAGES
========================================= */

function showLogin() {

```
document
    .getElementById("loginPage")
    .classList.remove("hidden");

document
    .getElementById("registerPage")
    .classList.add("hidden");

document
    .getElementById("appPage")
    .classList.add("hidden");

clearMessages();
```

}

function openRegister() {

```
document
    .getElementById("loginPage")
    .classList.add("hidden");

document
    .getElementById("registerPage")
    .classList.remove("hidden");

document
    .getElementById("appPage")
    .classList.add("hidden");

clearMessages();
```

}

function showApp(username) {

```
document
    .getElementById("loginPage")
    .classList.add("hidden");

document
    .getElementById("registerPage")
    .classList.add("hidden");

document
    .getElementById("appPage")
    .classList.remove("hidden");


updateDashboard(username);
```

}

function clearMessages() {

```
const login =
    document.getElementById("loginMessage");

const register =
    document.getElementById("registerMessage");

if (login) login.textContent = "";

if (register) register.textContent = "";
```

}

/* =========================================
DASHBOARD
========================================= */

function updateDashboard(username) {

```
const user =
    getCurrentUser();

if (!user) return;


const welcome =
    document.getElementById("welcomeUser");

const avatar =
    document.getElementById("userAvatar");

const level =
    document.getElementById("userLevel");


welcome.textContent =
    user.username;

avatar.textContent =
    user.username
        .charAt(0)
        .toUpperCase();


level.textContent =
    `Niveau ${user.level || 1} • ${getRank(user.level || 1)}`;


document.getElementById("winsStat").textContent =
    user.wins || 0;

document.getElementById("xpStat").textContent =
    user.xp || 0;

document.getElementById("streakStat").textContent =
    user.streak || 0;

document.getElementById("gamesStat").textContent =
    user.games || 0;
```

}

/* =========================================
LEVEL / RANK
========================================= */

function getRank(level) {

```
if (level >= 50) return "LEGEND";

if (level >= 30) return "MASTER";

if (level >= 20) return "ELITE";

if (level >= 10) return "VETERAN";

if (level >= 5) return "WARRIOR";

return "ROOKIE";
```

}

/* =========================================
GAME LAUNCHER
========================================= */

function launchGame(gameName) {

```
const user =
    getCurrentUser();

if (!user) return;


/*
 * Pour le moment, les cartes déclenchent
 * l'expérience UI.
 *
 * Tu peux ensuite remplacer cette fonction
 * par l'ouverture de :
 *
 * games/chess.html
 * games/checkers.html
 * games/snake.html
 * games/minesweeper.html
 */


showToast(
    "Arène sélectionnée 🎮",
    `${gameName} sera bientôt disponible.`
);


/*
 * Effet visuel
 */

const cards =
    document.querySelectorAll(".game-card");


cards.forEach(card => {

    if (
        card.textContent
            .toLowerCase()
            .includes(gameName.toLowerCase())
    ) {

        card.style.transform =
            "scale(.97)";

        setTimeout(() => {

            card.style.transform = "";

        }, 180);

    }

});
```

}

/* =========================================
SCROLL
========================================= */

function scrollToGames() {

```
const section =
    document.getElementById("gamesSection");

if (section) {

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}
```

}

/* =========================================
STATS
========================================= */

function showStats() {

```
const user =
    getCurrentUser();

if (!user) return;


showToast(
    "Tes statistiques 📊",
    `${user.wins || 0} victoire(s) • ${user.xp || 0} XP`
);
```

}

/* =========================================
LOGOUT
========================================= */

function logout() {

```
localStorage.removeItem(
    "babiGamesCurrentUser"
);

showLogin();

const username =
    document.getElementById("loginUsername");

const password =
    document.getElementById("loginPassword");

if (username) username.value = "";

if (password) password.value = "";


showToast(
    "À bientôt 👋",
    "Ta session a été fermée."
);
```

}

/* =========================================
PASSWORD VISIBILITY
========================================= */

function togglePassword(id, button) {

```
const input =
    document.getElementById(id);

if (!input) return;


if (input.type === "password") {

    input.type = "text";

    button.textContent = "◎";

} else {

    input.type = "password";

    button.textContent = "◉";

}
```

}

/* =========================================
TOAST
========================================= */

let toastTimeout;

function showToast(title, text) {

```
const toast =
    document.getElementById("toast");

const toastTitle =
    document.getElementById("toastTitle");

const toastText =
    document.getElementById("toastText");


if (!toast) return;


toastTitle.textContent =
    title;

toastText.textContent =
    text;


toast.classList.add("show");


clearTimeout(toastTimeout);


toastTimeout =
    setTimeout(() => {

        toast.classList.remove("show");

    }, 3500);
```

}

/* =========================================
SHAKE EFFECT
========================================= */

function shake(element) {

```
if (!element) return;


element.animate(
    [
        { transform: "translateX(0)" },
        { transform: "translateX(-8px)" },
        { transform: "translateX(8px)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(0)" }
    ],
    {
        duration: 350
    }
);
```

}

/* =========================================
SERVICE WORKER
========================================= */

if ("serviceWorker" in navigator) {

```
window.addEventListener("load", () => {

    navigator.serviceWorker
        .register("service-worker.js")
        .then(() => {
            console.log("BabiGames Service Worker actif.");
        })
        .catch(error => {
            console.warn(
                "Service Worker:",
                error
            );
        });

});
```

}
