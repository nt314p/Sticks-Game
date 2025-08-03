import animals from "./data/animals.js";
import habitats from "./data/habitats.js";
import crypto from "crypto";

const AnimalCount = animals.length;
const HabitatCount = habitats.length;
const NumbersCount = 100;
export const TotalIdCount = AnimalCount * HabitatCount * NumbersCount;

console.log(`Loaded ${AnimalCount} animals`);
console.log(`Loaded ${HabitatCount} habitats`);
console.log(`Total unique IDs: ${TotalIdCount}`);
// IDs are formatted as habitat-animal-number
// the number is from 0 to 99

export function idToIndex(id) {
    const parts = id.split("-");
    const habitat = parts[0];
    const animal = parts[1];
    const number = parseInt(parts[2]);

    if (number == NaN) return -1;
    if (!(number >= 0 && number < NumbersCount)) return -1;

    const habitatIndex = habitats.indexOf(habitat);
    const animalIndex = animals.indexOf(animal);

    if (habitatIndex == -1 || animalIndex == -1) return -1;

    return AnimalCount * NumbersCount * habitatIndex + NumbersCount * animalIndex + number;
}

export function indexToId(index) {
    if (!(index >= 0 && index < TotalIdCount)) return null;
    const habitatIndex = Math.floor(index / (AnimalCount * NumbersCount));
    const animalIndex = Math.floor(index / NumbersCount) % AnimalCount;
    const number = index % NumbersCount;

    return `${habitats[habitatIndex]}-${animals[animalIndex]}-${number}`;
}

// Returns an id, index pair
export function getRandomIdIndex() {
    const buffer = crypto.randomBytes(4);
    const randomNumber = buffer.readUInt32BE(0);
    const index = randomNumber % TotalIdCount;
    const id = indexToId(index);

    return { id: id, index: index };
}