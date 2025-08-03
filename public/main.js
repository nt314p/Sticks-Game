const socket = io();

// Allows the user to proceed to join the game by pressing
// enter after entering the game id
document.getElementById("gameIdInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        joinGame();
    }
});

// Clears join modal after it is hidden
document.getElementById("joinModal").addEventListener("hidden.bs.modal", () => {
    document.getElementById("gameIdInput").value = "";
    joinErrorText.classList.add("d-none");
})

function loadGamePage() {
    // Generate a form to perform a redirect to the origin url,
    // except the request contains the property "game" in the body.
    // This is interpreted server side to serve the game page rather
    // than the lobby page.

    const form = document.createElement("form");
    form.method = "POST";
    form.action = window.location.origin;

    const gameInput = document.createElement("input");
    gameInput.type = "hidden";
    gameInput.name = "game";
    gameInput.value = "true";
    form.appendChild(gameInput);

    document.body.appendChild(form);

    form.submit();
}

function createGame(callback) {
    console.log("Creating game...");

    fetch(`${window.location.origin}/api/create`, { method: "POST" })
        .then((res) => res.json())
        .then((body) => {
            const gameId = body.gameId;
            const token = body.token;

            console.log(`Game id: ${gameId}`);
            console.log(`Token: ${token}`);

            callback(null, gameId, token);
        })
        .catch((err) => {
            callback(err, null, null);
        });
}

async function showCreateModal() {
    document.getElementById('roomIdDisplay').textContent = "Generating ID...";
    const createModal = new bootstrap.Modal(document.getElementById('createModal'));
    createModal.show();

    createGame((err, gameId, token) => {
        if (err) {
            console.log(err);
            return;
        }
        document.getElementById('roomIdDisplay').textContent = gameId;

        window.localStorage.setItem("token", token);
    });
}

function showJoinModalError(message) {
    const joinErrorText = document.getElementById("joinErrorText");
    joinErrorText.textContent = message;
    joinErrorText.classList.remove("d-none");
}

function joinGame() {
    console.log("Joining game...");

    const gameId = document.getElementById("gameIdInput").value;
    if (gameId === "") return;

    fetch(`${window.location.origin}/api/join/${gameId}`, { method: "POST" })
        .then((res) => res.json())
        .then((body) => {
            if (body.error) throw new Error(body.error);

            const token = body.token;
            console.log(`Token: ${token}`);

            window.localStorage.setItem("token", token);

            loadGamePage();
        })
        .catch((err) => {
            showJoinModalError(err.message);
            console.log(err);
            return;
        });
}