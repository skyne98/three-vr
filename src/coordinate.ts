import * as THREE from 'three';

export class Coord {
    // Simple coordinate constants
    public static readonly FRONT = new THREE.Vector3(0, 0, -1);
    public static readonly BACK = new THREE.Vector3(0, 0, 1);
    public static readonly LEFT = new THREE.Vector3(-1, 0, 0);
    public static readonly RIGHT = new THREE.Vector3(1, 0, 0);
    public static readonly TOP = new THREE.Vector3(0, 1, 0);
    public static readonly BOTTOM = new THREE.Vector3(0, -1, 0);

    // Zero-clamped coordinate constants
    public static readonly FRONT_ZC = new THREE.Vector3(0, 0, 0);
    public static readonly BACK_ZC = new THREE.Vector3(0, 0, 1);
    public static readonly LEFT_ZC = new THREE.Vector3(0, 0, 0);
    public static readonly RIGHT_ZC = new THREE.Vector3(1, 0, 0);
    public static readonly TOP_ZC = new THREE.Vector3(0, 1, 0);
    public static readonly BOTTOM_ZC = new THREE.Vector3(0, 0, 0);

    // Ids (positive, then negative, then perpendicular)
    public static readonly BACK_ID = 0;
    public static readonly FRONT_ID = 1;
    public static readonly RIGHT_ID = 2;
    public static readonly LEFT_ID = 3;
    public static readonly TOP_ID = 4;
    public static readonly BOTTOM_ID = 5;

    public static readonly DIRECTIONS = [
        Coord.BACK,
        Coord.FRONT,
        Coord.RIGHT,
        Coord.LEFT,
        Coord.TOP,
        Coord.BOTTOM
    ];
    public static readonly DIRECTIONS_ZC = [
        Coord.BACK_ZC,
        Coord.FRONT_ZC,
        Coord.RIGHT_ZC,
        Coord.LEFT_ZC,
        Coord.TOP_ZC,
        Coord.BOTTOM_ZC
    ];

    // Index utilities
    public static threeToIndex(position: THREE.Vector3, size: number): number {
        return position.x + position.y * size + position.z * size * size;
    }
    public static indexToThree(index: number, size: number): THREE.Vector3 {
        const x = index % size;
        const y = Math.floor(index / size) % size;
        const z = Math.floor(index / (size * size));
        return new THREE.Vector3(x, y, z);
    }
}