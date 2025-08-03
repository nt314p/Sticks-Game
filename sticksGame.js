import { Random } from "random";
import sticks from "./data/sticks.js";

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class CanvasObject {
    constructor(value) {
        this.value = value;
        this.hidden = true;
        this.position = new Point(0, 0);
    }
}

class Player {
    constructor() {
        this.sticks = [];
        this.cards = [];
        this.joined = false;
    }
}

export const PLAYER_ONE = 0;
export const PLAYER_TWO = 1;

const CARDS_PER_DECK = 52;

function generateDeck(numDecks) {
    let deck = [];
    const deckLength = numDecks * CARDS_PER_DECK;

    for (let index = 0; index < deckLength; index++) {
        deck.push(index);
    }

    return deck;
}

function seededShuffle(deck, seed) {
    const rng = new Random(seed);
    return rng.shuffle(deck);
}

export class SticksGame {
    constructor(seed) {
        this.seed = seed;
        let deck = generateDeck(5);
        this.deck = seededShuffle(deck, seed);
        this.discard = [];
        this.sticks = seededShuffle(sticks, seed);
        this.players = [new Player(), new Player()];
    }

    isValidPlayer(playerLabel) {
        return playerLabel === PLAYER_ONE || playerLabel === PLAYER_TWO;
    }

    drawCard(playerLabel) {
        if (!this.isValidPlayer(playerLabel)) return;

        let player = this.players[playerLabel];

        // TODO: if deck is empty, use discard pile to shuffle in new cards
        let card = this.deck.pop();
        player.cards.push(card);

        return card;
    }

    drawStick(playerLabel) {
        if (!this.isValidPlayer(playerLabel)) return;

        let player = this.players[playerLabel];

        // TODO: if no more sticks, indicate so
        let stick = this.sticks.pop();
        player.sticks.push(stick);

        return stick;
    }
}

/*
Potential game actions

Move card
Move stick

Show/hide cards
Show/hide stick

Draw stick

Draw card from deck
Draw card from discard

Discard card



*/