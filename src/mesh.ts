import * as THREE from 'three';

import { Coord } from './coordinate';

// === BUILDING ONE FACE ===
export interface FaceMeshData {
    position: Uint8Array;
    normal: Uint8Array;
    uv: Float32Array;
}

export class FaceMeshBuilder {
    /// Build a voxel face mesh of a unit size, situated at 0,0,0.
    public static forDirection(id: number): FaceMeshData {
        let position = new Uint8Array(6 * 3);
        let normal = new Uint8Array(6 * 3);
        let uv = new Float32Array(6 * 2);

        switch (id) {
            case Coord.FRONT_ID: // Front face lies on the XY plane at Z=0.
                position = new Uint8Array([
                    0, 0, 0,
                    0, 1, 0,
                    1, 1, 0,
                    0, 0, 0,
                    1, 1, 0,
                    1, 0, 0
                ]);
                uv = new Float32Array([
                    1, 0,
                    1, 1,
                    0, 1,
                    1, 0,
                    0, 1,
                    0, 0
                ]);
                break;

            case Coord.BACK_ID: // Back face lies on the XY plane at Z=1.
                position = new Uint8Array([
                    0, 0, 1,
                    1, 0, 1,
                    1, 1, 1,
                    0, 0, 1,
                    1, 1, 1,
                    0, 1, 1
                ]);
                uv = new Float32Array([
                    0, 0,
                    1, 0,
                    1, 1,
                    0, 0,
                    1, 1,
                    0, 1
                ]);
                break;

            case Coord.LEFT_ID: // Left face lies on the YZ plane at X=0.
                position = new Uint8Array([
                    0, 0, 0,
                    0, 0, 1,
                    0, 1, 1,
                    0, 0, 0,
                    0, 1, 1,
                    0, 1, 0
                ]);
                uv = new Float32Array([
                    0, 0,
                    1, 0,
                    1, 1,
                    0, 0,
                    1, 1,
                    0, 1
                ]);
                break;

            case Coord.RIGHT_ID: // Right face lies on the YZ plane at X=1.
                position = new Uint8Array([
                    1, 0, 0,
                    1, 1, 0,
                    1, 1, 1,
                    1, 0, 0,
                    1, 1, 1,
                    1, 0, 1
                ]);
                uv = new Float32Array([
                    1, 0,
                    1, 1,
                    0, 1,
                    1, 0,
                    0, 1,
                    0, 0
                ]);
                break;


            case Coord.TOP_ID: // Top face lies on the XZ plane at Y=1.
                position = new Uint8Array([
                    0, 1, 0,
                    0, 1, 1,
                    1, 1, 1,
                    0, 1, 0,
                    1, 1, 1,
                    1, 1, 0
                ]);
                uv = new Float32Array([
                    0, 1,
                    0, 0,
                    1, 0,
                    0, 1,
                    1, 0,
                    1, 1
                ]);
                break;

            case Coord.BOTTOM_ID: // Bottom face lies on the XZ plane at Y=0.
                position = new Uint8Array([
                    0, 0, 0,
                    1, 0, 0,
                    1, 0, 1,
                    0, 0, 0,
                    1, 0, 1,
                    0, 0, 1
                ]);
                uv = new Float32Array([
                    0, 0,
                    1, 0,
                    1, 1,
                    0, 0,
                    1, 1,
                    0, 1
                ]);
                break;
        }

        return { position, normal, uv };
    }
    /// Offset the face mesh data by the given offset.
    public static offset(faceMeshData: FaceMeshData, offset: THREE.Vector3): FaceMeshData {
        const { position, normal, uv } = faceMeshData;
        const offsetPosition = new Uint8Array(position.length);
        for (let i = 0; i < position.length; i += 3) {
            offsetPosition[i] = position[i] + offset.x;
            offsetPosition[i + 1] = position[i + 1] + offset.y;
            offsetPosition[i + 2] = position[i + 2] + offset.z;
        }
        return { position: offsetPosition, normal, uv };
    }
}


// === BUILDING A VOXEL MESH ===
export interface VoxelMeshData {
    // ... for each direction
    position: Uint8Array;
    normal: Uint8Array;
    uv: Float32Array;
}

export class VoxelMeshBuilder {
    public static build(): VoxelMeshData {
        const position = new Uint8Array(6 * 6 * 3);
        const normal = new Uint8Array(6 * 6 * 3);
        const uv = new Float32Array(6 * 6 * 2);

        for (let i = 0; i < 6; i++) {
            const faceMeshData: FaceMeshData = FaceMeshBuilder.forDirection(i);
            position.set(faceMeshData.position, i * 6 * 3);
            normal.set(faceMeshData.normal, i * 6 * 3);
            uv.set(faceMeshData.uv, i * 6 * 2);
        }

        return { position, normal, uv };
    }
    /// Offset the voxel mesh data by the given offset.
    public static offset(voxelMeshData: VoxelMeshData, offset: THREE.Vector3): VoxelMeshData {
        const { position, normal, uv } = voxelMeshData;
        const offsetPosition = new Uint8Array(position.length);
        for (let i = 0; i < position.length; i++) {
            offsetPosition[i] = position[i] + offset.x;
            offsetPosition[i + 1] = position[i + 1] + offset.y;
            offsetPosition[i + 2] = position[i + 2] + offset.z;
        }
        return { position: offsetPosition, normal, uv };
    }
}

// === BUILDING A CHUNK MESH ===
export interface ChunkMeshData {
    // ... for each direction
    position: Uint8Array[];
    normal: Uint8Array[];
    uv: Float32Array[];
}

export class ChunkMeshBuilder {
    public static build(chunkSize: number, chunkData: Uint16Array): ChunkMeshData {
        const maxFaces = chunkSize ** 3; // Maximum possible number of faces per direction
        const position: Uint8Array[] = Array(6).fill(null).map(() => new Uint8Array(maxFaces * 6 * 3));
        const normal: Uint8Array[] = Array(6).fill(null).map(() => new Uint8Array(maxFaces * 6 * 3));
        const uv: Float32Array[] = Array(6).fill(null).map(() => new Float32Array(maxFaces * 6 * 2));
        const faceCounts: number[] = Array(6).fill(0);

        for (let x = 0; x < chunkSize; x++) {
            for (let y = 0; y < chunkSize; y++) {
                for (let z = 0; z < chunkSize; z++) {
                    const voxPos = new THREE.Vector3(x, y, z);
                    const voxIndex = Coord.threeToIndex(voxPos, chunkSize);
                    if (chunkData[voxIndex] !== 0) { // If the voxel is not air
                        for (let i = 0; i < 6; i++) {
                            const neighborDirection = Coord.DIRECTIONS[i];
                            const neighborPosition = voxPos.clone().add(neighborDirection);
                            let neighborOutside = false;
                            if (neighborPosition.x < 0 || neighborPosition.x >= chunkSize ||
                                neighborPosition.y < 0 || neighborPosition.y >= chunkSize ||
                                neighborPosition.z < 0 || neighborPosition.z >= chunkSize) {
                                neighborOutside = true;
                            }

                            const neighborIndex = Coord.threeToIndex(neighborPosition, chunkSize);
                            if ((neighborIndex < 0 || neighborIndex >= chunkData.length) && !neighborOutside) {
                                throw new Error(`Neighbor index ${neighborIndex} out of bounds`);
                            }
                            // Check if the neighboring voxel in the direction is air
                            if (neighborOutside || chunkData[neighborIndex] === 0) {
                                const faceMeshData: FaceMeshData = FaceMeshBuilder.forDirection(i);
                                const offsetFaceMeshData: FaceMeshData = FaceMeshBuilder.offset(faceMeshData, voxPos);
                                position[i].set(offsetFaceMeshData.position, faceCounts[i] * 6 * 3);
                                normal[i].set(offsetFaceMeshData.normal, faceCounts[i] * 6 * 3);
                                uv[i].set(offsetFaceMeshData.uv, faceCounts[i] * 6 * 2);
                                faceCounts[i]++;
                            }
                        }
                    }
                }
            }
        }

        // Shrink the arrays to the actual size
        for (let i = 0; i < 6; i++) {
            position[i] = position[i].subarray(0, faceCounts[i] * 6 * 3);
            normal[i] = normal[i].subarray(0, faceCounts[i] * 6 * 3);
            uv[i] = uv[i].subarray(0, faceCounts[i] * 6 * 2);
        }

        return { position, normal, uv };
    }
    /// Offset the chunk mesh data by the given offset.
    public static offset(chunkMeshData: ChunkMeshData, offset: THREE.Vector3): ChunkMeshData {
        const { position, normal, uv } = chunkMeshData;
        const offsetPosition: Uint8Array[] = [];
        for (let i = 0; i < position.length; i++) {
            offsetPosition.push(FaceMeshBuilder.offset({ position: position[i], normal: normal[i], uv: uv[i] }, offset).position);
        }
        return { position: offsetPosition, normal, uv };
    }
}
