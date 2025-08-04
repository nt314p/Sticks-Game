const socket = io();

const token = window.localStorage.getItem("token");

//Konva.pixelRatio = 1;

const stage = new Konva.Stage({
    container: 'container',
    width: window.innerWidth,
    height: window.innerHeight,
});

const mainLayer = new Konva.Layer();
const moveLayer = new Konva.Layer();

stage.add(mainLayer);
stage.add(moveLayer);

// TODO: refine these events because they enable all objects to be draggable
stage.on("pointerdown", (evt) => {
    const obj = evt.target;
    console.log("down!");

    if (!obj || obj.getClassName() === "Stage") return;

    obj.moveTo(moveLayer);
    obj.moveToTop();
    obj.startDrag();
});

stage.on("pointerup", (evt) => {
    const obj = evt.target;
    console.log("up!");

    if (!obj || obj.getClassName() === "Stage") return;

    obj.moveTo(mainLayer);
});

function cardIndexToFilename(cardIndex) {
    const cardValue = (cardIndex % 13) + 1;
    const cardSuit = Math.floor(cardIndex / 13);

    const suits = ["clubs", "spades", "diamonds", "hearts"];
    const suit = suits[cardSuit];
    const royals = ["jack", "queen", "king"];
    let name = "";

    if (cardValue >= 2 && cardValue <= 10) {
        name = cardValue;
    } else if (cardValue == 1) {
        name = "ace";
    } else {
        name = royals[cardValue - 11];
    }

    return `${name}_of_${suit}.png`;
}

let cards = [];

function loadCard(cardIndex) {
    const filename = cardIndexToFilename(cardIndex);

    const path = `${window.location.origin}/cards/${filename}`;

    const imageObj = new Image();

    imageObj.onload = function () {
        const card = new Konva.Image({
            x: 50,
            y: 50,
            image: imageObj,
            width: 125,
            height: 182,
            //draggable: true
        });

        card.on('mouseover', function () {
            document.body.style.cursor = 'pointer';
        });
        card.on('mouseout', function () {
            document.body.style.cursor = 'default';
        });

        card.on('dragmove', () => {
            socket.emit('moveCard', cardIndex, card.x(), card.y());
        });

        card.perfectDrawEnabled(false);

        mainLayer.add(card);
        cards[cardIndex] = card;
    };

    imageObj.src = path;
}

for (var i = 0; i < 52; i++) {
    loadCard(i);
}

socket.emit("joinGame", token, (res) => {
    console.log(res);
    if (res.error) {
        console.log(res.error);
    }
});

function log(message) {
    const text = document.createElement("p");
    text.innerText = message;
    document.getElementById("gameLog").append(text);
}

socket.on("joinGame", (playerNumber) => {
    console.log(`Player ${playerNumber + 1} joined!`);
    log(`Player ${playerNumber + 1} joined!`);
});

socket.on("leaveGame", (playerNumber) => {
    console.log(`Player ${playerNumber + 1} left!`);
    log(`Player ${playerNumber + 1} left!`);
});

socket.on("moveCard", (index, x, y) => {
    cards[index].position({ x: x, y: y });
});