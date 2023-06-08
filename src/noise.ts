// https://github.com/jwagner/simplex-noise.js
import { createNoise2D } from 'simplex-noise';

export class Noise {
    private noise2D: (x: number, y: number) => number;

    constructor(seed: string) {
        const noise = createNoise2D();
        this.noise2D = (x, y) => noise(x, y);
    }

    public noise(x: number, y: number): number {
        return this.noise2D(x, y);
    }
}