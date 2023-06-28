import * as THREE from "three";
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { Noise } from './noise';
import { Sphere, AABB } from "./collision";
import { meshWorker } from "./workers/mesh_client";
import { blockMaterial } from "./material/block";

export const CHUNK_SIZE = 32;
export const CHUNK_RADIUS = 2;

export class Chunk {
    world: World;
    nextMeshIteration: number = 0;
    mesh: THREE.Mesh | null = null;
    position: THREE.Vector3;
    blocks: boolean[];
    scene: THREE.Scene;
    aabb: AABB;

    constructor(world: World, position: THREE.Vector3, blocks: boolean[], scene: THREE.Scene) {
        this.world = world;
        this.position = position;
        this.blocks = blocks;
        this.scene = scene;
        this.aabb = new AABB(
            new THREE.Vector3(position.x * CHUNK_SIZE, position.y * CHUNK_SIZE, position.z * CHUNK_SIZE),
            new THREE.Vector3(position.x * CHUNK_SIZE + CHUNK_SIZE, position.y * CHUNK_SIZE + CHUNK_SIZE, position.z * CHUNK_SIZE + CHUNK_SIZE),
        );
    }

    getBlock(x: number, y: number, z: number): boolean {
        return this.blocks[z + y * CHUNK_SIZE + x * CHUNK_SIZE * CHUNK_SIZE];
    }
    setBlock(x: number, y: number, z: number, value: boolean): void {
        this.blocks[z + y * CHUNK_SIZE + x * CHUNK_SIZE * CHUNK_SIZE] = value;
    }
    getKey(): string {
        return `${this.position.x},${this.position.y},${this.position.z}`;
    }

    async remesh(buffer: boolean[] | undefined, material: THREE.Material): Promise<void> {
        const thisMeshIteration = this.nextMeshIteration;
        this.nextMeshIteration += 1;

        if (buffer !== undefined) {
            this.blocks = buffer;
        }
        const uInt8Array = new Uint8Array(this.blocks.map((value) => value ? 1 : 0));
        const chunkGeometry = await meshWorker.generateChunk({
            width: CHUNK_SIZE,
            height: CHUNK_SIZE,
            depth: CHUNK_SIZE,
            buffer: uInt8Array,
            options: {},
        });

        if (thisMeshIteration === this.nextMeshIteration - 1) {
            const oldMesh = this.mesh;
            const chunkMesh = new THREE.Mesh(chunkGeometry, material);
            chunkMesh.position.set(
                oldMesh ? oldMesh.position.x : this.position.x * CHUNK_SIZE,
                oldMesh ? oldMesh.position.y : this.position.y * CHUNK_SIZE,
                oldMesh ? oldMesh.position.z : this.position.z * CHUNK_SIZE,
            );
            chunkMesh.castShadow = false;
            chunkMesh.receiveShadow = false;
            if (oldMesh && oldMesh.parent) {
                this.scene.remove(oldMesh);
            }
            this.mesh = chunkMesh;
            this.scene.add(chunkMesh);
        }
    }
    setMaterial(material: THREE.Material): void {
        if (this.mesh) {
            this.mesh.material = material;
        }
    }
    setShadows(castShadow: boolean, receiveShadow: boolean): void {
        if (this.mesh) {
            this.mesh.castShadow = castShadow;
            this.mesh.receiveShadow = receiveShadow;
        }
    }
}

export class World {
    chunks: Map<string, Chunk> = new Map();
    chunkOffsets: Map<Chunk, number> = new Map();
    pointerLockControls: PointerLockControls;
    scene: THREE.Scene;
    noise: Noise;

    shaderMaterial: THREE.ShaderMaterial;
    pbrMaterial: THREE.MeshStandardMaterial;
    lambertMaterial: THREE.MeshLambertMaterial;
    basicMaterial: THREE.MeshBasicMaterial;

    constructor(pointerLockControls: PointerLockControls, scene: THREE.Scene) {
        this.pointerLockControls = pointerLockControls;
        this.scene = scene;
        this.noise = new Noise('seed');

        // Materials
        const prototypeColorMapUrl = new URL('../materials/prototype/Orange/texture_01.png', import.meta.url);
        const prototypeColorTexture = new THREE.TextureLoader().load(prototypeColorMapUrl.href);
        const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
        this.shaderMaterial = blockMaterial(resolution, prototypeColorTexture);
        const prototypeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: prototypeColorTexture,
        });
        this.pbrMaterial = prototypeMaterial;

        const lambertMaterial = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            map: prototypeColorTexture,
        });
        this.lambertMaterial = lambertMaterial;

        const basicMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: prototypeColorTexture,
        });
        this.basicMaterial = basicMaterial;
    }

    getChunkKey(x: number, y: number, z: number): string {
        return `${x},${y},${z}`;
    }
    getChunk(x: number, y: number, z: number): Chunk | undefined {
        return this.chunks.get(this.getChunkKey(x, y, z));
    }
    setChunk(x: number, y: number, z: number, chunk: Chunk): void {
        this.chunks.set(this.getChunkKey(x, y, z), chunk);
    }
    removeChunk(x: number, y: number, z: number): void {
        let chunk = this.getChunk(x, y, z);
        if (!chunk) return;
        this.chunks.delete(this.getChunkKey(x, y, z));
        this.scene.remove(chunk.mesh!);
    }
    updateChunks(delta: number): void {
        const cameraObject = this.pointerLockControls.getObject();
        const cameraPosition = cameraObject.position;
        const playerChunkX = Math.floor(cameraPosition.x / CHUNK_SIZE);
        const playerChunkY = Math.floor(cameraPosition.y / CHUNK_SIZE);
        const playerChunkZ = Math.floor(cameraPosition.z / CHUNK_SIZE);

        for (let chunk of this.chunks.values()) {
            const chunkPosition = chunk.position;
            const chunkX = Math.floor(chunkPosition.x);
            const chunkY = Math.floor(chunkPosition.y);
            const chunkZ = Math.floor(chunkPosition.z);
            const distance = Math.sqrt(
                (chunkX - playerChunkX) ** 2
                + (chunkY - playerChunkY) ** 2
                + (chunkZ - playerChunkZ) ** 2);
            if (distance > CHUNK_RADIUS * 2.0) {
                this.removeChunk(chunkX, chunkY, chunkZ);
            }
        }

        const toRemesh = new Set<{ buffer: boolean[] | undefined, chunk: Chunk }>();
        outerloop:
        for (let chunkX = playerChunkX - CHUNK_RADIUS; chunkX <= playerChunkX + CHUNK_RADIUS; chunkX++) {
            for (let chunkY = playerChunkY - CHUNK_RADIUS; chunkY <= playerChunkY + CHUNK_RADIUS; chunkY++) {
                for (let chunkZ = playerChunkZ - CHUNK_RADIUS; chunkZ <= playerChunkZ + CHUNK_RADIUS; chunkZ++) {
                    let chunk = this.getChunk(chunkX, chunkY, chunkZ);
                    if (chunk) {
                        // Do nothing if chunk already exists
                    } else {
                        const buffer: boolean[] = [];
                        for (let blockX = 0; blockX < CHUNK_SIZE; blockX++) {
                            for (let blockY = 0; blockY < CHUNK_SIZE; blockY++) {
                                for (let blockZ = 0; blockZ < CHUNK_SIZE; blockZ++) {
                                    let worldX = blockX + chunkX * CHUNK_SIZE;
                                    let worldY = blockY + chunkY * CHUNK_SIZE;
                                    let worldZ = blockZ + chunkZ * CHUNK_SIZE;

                                    let noiseVal = this.noise.noise(worldX / 50, worldZ / 50);
                                    let height = noiseVal * 16;

                                    buffer.push(worldY <= height);
                                }
                            }
                        }

                        chunk = new Chunk(
                            this,
                            new THREE.Vector3(chunkX, chunkY, chunkZ),
                            buffer,
                            this.scene);
                        // chunk.remesh(buffer, this.shaderMaterial);
                        toRemesh.add({ buffer, chunk });
                        this.setChunk(chunkX, chunkY, chunkZ, chunk);
                        this.chunkOffsets.set(chunk, 5);

                        // Call remesh on all neighbors
                        for (let x = -1; x <= 1; x++) {
                            for (let y = -1; y <= 1; y++) {
                                for (let z = -1; z <= 1; z++) {
                                    if (x === 0 && y === 0 && z === 0) continue;
                                    let neighborChunk = this.getChunk(chunkX + x, chunkY + y, chunkZ + z);
                                    if (!neighborChunk) continue;
                                    // neighborChunk.remesh(undefined, this.shaderMaterial);
                                    toRemesh.add({ chunk: neighborChunk, buffer: undefined });
                                }
                            }
                        }

                        break outerloop;
                    }
                }
            }
        }

        // Sort the chunks by distance from the player (load the closest chunks first)
        // and sort them so that ones in front of the player are rendered first
        const sortedChunks = Array.from(toRemesh);
        sortedChunks.sort((a, b) => {
            const aChunkPosition = a.chunk.position;
            const aChunkWorldPosition = new THREE.Vector3(
                aChunkPosition.x * CHUNK_SIZE,
                aChunkPosition.y * CHUNK_SIZE,
                aChunkPosition.z * CHUNK_SIZE);
            const bChunkPosition = b.chunk.position;
            const bChunkWorldPosition = new THREE.Vector3(
                bChunkPosition.x * CHUNK_SIZE,
                bChunkPosition.y * CHUNK_SIZE,
                bChunkPosition.z * CHUNK_SIZE);
            const aDistance = aChunkWorldPosition.distanceTo(cameraPosition);
            const bDistance = bChunkWorldPosition.distanceTo(cameraPosition);
            const byDistance = aDistance - bDistance;

            // Now by the dot product to the camera direction
            const cameraDirection = cameraObject.getWorldDirection(new THREE.Vector3());
            const aDot = aChunkWorldPosition.clone().sub(cameraPosition).normalize().dot(cameraDirection);
            const bDot = bChunkWorldPosition.clone().sub(cameraPosition).normalize().dot(cameraDirection);
            const byDot = bDot - aDot;

            return (byDistance * -1) * byDot;
        });

        // Remesh chunks
        for (let chunk of sortedChunks) {
            if (chunk.buffer) {
                chunk.chunk.remesh(chunk.buffer, this.shaderMaterial);
            } else {
                chunk.chunk.remesh(undefined, this.shaderMaterial);
            }
        }

        // Set chunk offsets
        for (let chunk of this.chunks.values()) {
            const chunkMesh = chunk.mesh;
            if (!chunkMesh) continue;
            const chunkPosition = chunkMesh.position;
            const chunkY = Math.ceil(chunkPosition.y / CHUNK_SIZE);
            let offset = this.chunkOffsets.get(chunk)!;
            if (offset === 0) continue;
            let newOffset = offset - delta * 10;
            if (newOffset < 0) newOffset = 0;
            this.chunkOffsets.set(chunk, newOffset);
            chunk.mesh!.position.setY(chunkY * CHUNK_SIZE - newOffset);
        }

        // Hide chunks behind the player and show chunks in front of the player
        for (let chunk of this.chunks.values()) {
            // Using a dot product to determine if the chunk is in front of the player
            // But check against all 8 corners of the chunk
            const chunkMesh = chunk.mesh;
            if (!chunkMesh) continue;
            const chunkPosition = chunkMesh.position;
            let visible = false;
            for (let x = 0; x <= 1; x++) {
                for (let y = 0; y <= 1; y++) {
                    for (let z = 0; z <= 1; z++) {
                        const corner = new THREE.Vector3(
                            chunkPosition.x + x * CHUNK_SIZE,
                            chunkPosition.y + y * CHUNK_SIZE,
                            chunkPosition.z + z * CHUNK_SIZE);
                        const cameraDirection = cameraObject.getWorldDirection(new THREE.Vector3());
                        const cameraToChunk = corner.sub(cameraPosition);
                        if (cameraDirection.dot(cameraToChunk) < 0) {
                            continue;
                        } else {
                            visible = true;
                            break;
                        }
                    }
                }
            }

            chunkMesh.visible = visible;
        }
    }

    // Block API
    getBlock(x: number, y: number, z: number): boolean {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);
        const chunkZ = Math.floor(z / CHUNK_SIZE);
        const chunk = this.getChunk(chunkX, chunkY, chunkZ);
        if (!chunk) return false;
        return chunk.getBlock(x - chunkX * CHUNK_SIZE, y - chunkY * CHUNK_SIZE, z - chunkZ * CHUNK_SIZE);
    }
}