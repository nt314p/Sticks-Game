const socket = io();

const token = window.localStorage.getItem("token");

//Konva.pixelRatio = 1.5;

const stage = new Konva.Stage({
    container: 'container',
    width: window.innerWidth,
    height: window.innerHeight,
});

console.log({ width: window.innerWidth, height: window.innerHeight });

const mainLayer = new Konva.Layer();
const moveLayer = new Konva.Layer();

stage.add(mainLayer);
stage.add(moveLayer);

const opponentMouse = new Konva.Arrow({
    x: 0,
    y: -100,
    points: [1, 1, 0, 0],
    pointerLength: 35,
    pointerWidth: 35,
    fill: "#D9A0EA",
    stroke: "black",
    strokeWidth: 2,
    lineJoin: "round",
    shadowColor: 'black',
    shadowBlur: 6,
    shadowOffset: { x: 2, y: 2 },
    shadowOpacity: 0.5,
});

moveLayer.add(opponentMouse);

stage.on("pointermove dragmove", (evt) => {
    const mousePos = stage.getPointerPosition();
    socket.emit("moveCursor",
        roundToPrecision(mousePos.x, 1),
        roundToPrecision(mousePos.y, 1)
    );
});

function createStick(text) {
    const stick = new Konva.Group({ draggable: true });

    stick.add(new Konva.Rect({
        x: 0,
        y: 0,
        width: 360,
        height: 40,
        cornerRadius: 20,
        fill: "#FFF6E5",
        stroke: "#000000",
        strokeWidth: 1,
    }));

    stick.add(new Konva.Text({
        x: 0,
        y: 2,
        text: text,
        fontSize: 24,
        fontFamily: "Segoe UI",
        width: 360,
        height: 40,
        fill: "#000000",
        align: "center",
        verticalAlign: "middle",
    }));

    return stick;
}

mainLayer.add(createStick("Two runs of 3 + Two sets of 3"));

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

// Currently reorders full deck
// TODO: should only reorder a certain subset of cards
// belonging to the current player or opponent
// TODO: adjust to accept cards param?
// TODO: need to keep track of self and opponent cards separately
function reorderCards() {
    let tempCards = [];
    for (var i = 0; i < 52; i++) {
        tempCards[i] = cards[i]; // TODO: only copy self cards
    }

    tempCards.sort((a, b) => a.x() - b.x());

    for (var i = 0; i < 52; i++) {
        tempCards[i].zIndex(i);
    }
}

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
            draggable: true,

            shadowColor: "black",
            shadowBlur: 6,
            shadowOffset: { x: 2, y: 2 },
            shadowOpacity: 0.3,
        });

        card.on("mouseover", function () {
            document.body.style.cursor = "pointer";
        });
        card.on("mouseout", function () {
            document.body.style.cursor = "default";
        });

        card.on("dragstart", () => {
            card.moveToTop();
            card.moveTo(moveLayer);
        });

        card.on("dragmove", () => {
            socket.emit(
                "moveCard",
                cardIndex,
                roundToPrecision(card.x(), 1),
                roundToPrecision(card.y(), 1),
            );
        });

        card.on("dragend", () => {
            card.moveTo(mainLayer);

            reorderCards();
        });

        card.perfectDrawEnabled(false);

        //card.cache();

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
    // const text = document.createElement("p");
    // text.innerText = message;
    // document.getElementById("gameLog").append(text);
}

function roundToPrecision(number, precision) {
    return Math.round(number * Math.pow(10, precision)) / Math.pow(10, precision);
}

socket.on("joinGame", (playerNumber) => {
    console.log(`Player ${playerNumber + 1} joined!`);
    log(`Player ${playerNumber + 1} joined!`);
});

socket.on("leaveGame", (playerNumber) => {
    console.log(`Player ${playerNumber + 1} left!`);
    log(`Player ${playerNumber + 1} left!`);
});

let cardStopTimers = new Map();

function cardStoppedMoving(index) {
    cards[index].moveTo(mainLayer);
    reorderCards();
}

socket.on("moveCard", (index, x, y) => {
    // TODO: scaling
    const card = cards[index];

    card.moveTo(moveLayer);
    card.moveToTop();
    card.position({ x: x, y: y });

    if (cardStopTimers.has(index)) {
        clearTimeout(cardStopTimers.get(index));
    }

    const timeoutId = setTimeout(() => {
        cardStoppedMoving(index);
    }, 300);

    cardStopTimers.set(index, timeoutId);
});

socket.on("moveCursor", (x, y) => {
    opponentMouse.position({ x: x, y: y });
    opponentMouse.moveToTop();
});