// ===============================
// BabiGames - Authentification
// ===============================


document.addEventListener("DOMContentLoaded", () => {

    const currentUser = localStorage.getItem("babiGamesCurrentUser");

    if (currentUser) {
        showApp(currentUser);
    } else {
        showLogin();
    }

});


// ===============================
// AFFICHER LOGIN
// ===============================

function showLogin() {

    document.getElementById("loginPage").classList.remove("hidden");

    document.getElementById("appPage").classList.add("hidden");

    document.getElementById("loginForm").classList.remove("hidden");

    document.getElementById("registerForm").classList.add("hidden");
}


// ===============================
// AFFICHER INSCRIPTION
// ===============================

function showRegister() {

    document.getElementById("loginForm").classList.add("hidden");

    document.getElementById("registerForm").classList.remove("hidden");

    clearMessages();
}


// ===============================
// REVENIR LOGIN
// ===============================

function showLogin() {

    document.getElementById("loginForm").classList.remove("hidden");

    document.getElementById("registerForm").classList.add("hidden");

    clearMessages();
}


// ===============================
// INSCRIPTION
// ===============================

function register() {

    const username =
        document.getElementById("registerUsername").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    const confirmPassword =
        document.getElementById("registerPasswordConfirm").value;

    const message =
        document.getElementById("registerMessage");


    if (!username || !password || !confirmPassword) {

        message.textContent =
            "Veuillez remplir tous les champs.";

        return;
    }


    if (password !== confirmPassword) {

        message.textContent =
            "Les mots de passe ne correspondent pas.";

        return;
    }


    if (password.length < 4) {

        message.textContent =
            "Le mot de passe doit contenir au moins 4 caractères.";

        return;
    }


    const users =
        JSON.parse(localStorage.getItem("babiGamesUsers") || "[]");


    const existingUser =
        users.find(user => user.username === username);


    if (existingUser) {

        message.textContent =
            "Ce nom d'utilisateur existe déjà.";

        return;
    }


    const newUser = {

        username: username,

        password: password,

        scores: {

            chess: 0,

            checkers: 0,

            snake: 0,

            minesweeper: 0

        }

    };


    users.push(newUser);


    localStorage.setItem(
        "babiGamesUsers",
        JSON.stringify(users)
    );


    localStorage.setItem(
        "babiGamesCurrentUser",
        username
    );


    showApp(username);
}


// ===============================
// CONNEXION
// ===============================

function login() {

    const username =
        document.getElementById("loginUsername").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    const message =
        document.getElementById("loginMessage");


    const users =
        JSON.parse(localStorage.getItem("babiGamesUsers") || "[]");


    const user =
        users.find(
            user =>
                user.username === username &&
                user.password === password
        );


    if (!user) {

        message.textContent =
            "Nom d'utilisateur ou mot de passe incorrect.";

        return;
    }


    localStorage.setItem(
        "babiGamesCurrentUser",
        username
    );


    showApp(username);
}


// ===============================
// AFFICHER APPLICATION
// ===============================

function showApp(username) {

    document.getElementById("loginPage").classList.add("hidden");

    document.getElementById("appPage").classList.remove("hidden");

    document.getElementById("welcomeUser").textContent =
        "👤 " + username;
}


// ===============================
// DÉCONNEXION
// ===============================

function logout() {

    localStorage.removeItem("babiGamesCurrentUser");

    showLogin();

    document.getElementById("loginUsername").value = "";

    document.getElementById("loginPassword").value = "";
}


// ===============================
// MESSAGES
// ===============================

function clearMessages() {

    document.getElementById("loginMessage").textContent = "";

    document.getElementById("registerMessage").textContent = "";
}


// ===============================
// SERVICE WORKER
// ===============================

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker.register(
            "service-worker.js"
        ).catch(error => {

            console.error(
                "Service Worker error:",
                error
            );

        });

    });

}