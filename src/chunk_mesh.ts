import * as THREE from 'three';

export class ChunkMesh extends THREE.Mesh {
    constructor(bufferGeometry: THREE.BufferGeometry, material: THREE.Material) {
        super(bufferGeometry, material);
    }
}