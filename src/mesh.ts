import * as THREE from 'three';

export interface ChunkData {
    type: Uint16Array; // 0 = air
    topUV: Uint16Array;
    bottomUV?: Uint16Array;
    leftUV?: Uint16Array;
    rightUV?: Uint16Array;
    frontUV?: Uint16Array;
    backUV?: Uint16Array;
}

export interface CreateMeshOptions {
    width: number;
    height?: number;
    depth?: number;
    uvScale?: number;
    data: ChunkData;
    neighborChunkData?: NeighborChunkDataCallback;
}

export interface CreateMeshResult {
    quadId: Uint32Array;
    position: Uint8Array;
    uv: Float32Array;
    normal: Float32Array;
}

/** Used to get the chunk data of a neighbor chunk. */
export type NeighborChunkDataCallback = (x: number, y: number, z: number) => ChunkData;

export function getBlockType(
    options: CreateMeshOptions,
    x: number,
    y: number,
    z: number
): number {
    let { width, height, depth } = options;
    height = height || width;
    depth = depth || width;
    const { type } = options.data;

    const localX = x % width;
    const localY = y % height;
    const localZ = z % depth;
    const chunkX = Math.floor(x / width);
    const chunkY = Math.floor(y / height);
    const chunkZ = Math.floor(z / depth);

    if (chunkX === 0 && chunkY === 0 && chunkZ === 0) {
        return type[localX + localY * width + localZ * width * height];
    }
    if (options.neighborChunkData) {
        const neighborChunkData = options.neighborChunkData(chunkX, chunkY, chunkZ);
        if (neighborChunkData) {
            return neighborChunkData.type[localX + localY * width + localZ * width * height];
        }
    }

    return 0;
}

export function createChunkMesh(
    options: CreateMeshOptions
): CreateMeshResult {
    // Create cube face indices
    const quadIds: number[] = [];
    const vertices: number[] = [];
    const uvs: number[] = [];
    const normals: number[] = [];
    const width = options.width;
    const height = options.height || width;
    const depth = options.depth || width;
    const uvScale = options.uvScale || 0;

    let indexOffset = 0;
    let quadIdOffset = 0;
    for (let x = 0; x < width; x += 1) {
        for (let y = 0; y < height; y += 1) {
            for (let z = 0; z < depth; z += 1) {
                const current = getBlockType(options, x, y, z);
                const currentSolid = current !== 0;
                const renderFront = currentSolid && getBlockType(options, x, y, z + 1) === 0;
                const renderBack = currentSolid && getBlockType(options, x, y, z - 1) === 0;
                const renderLeft = currentSolid && getBlockType(options, x - 1, y, z) === 0;
                const renderRight = currentSolid && getBlockType(options, x + 1, y, z) === 0;
                const renderTop = currentSolid && getBlockType(options, x, y + 1, z) === 0;
                const renderBottom = currentSolid && getBlockType(options, x, y - 1, z) === 0;

                const width = 1;
                const height = 1;
                const depth = 1;

                const topUV = new THREE.Vector2(
                    options.data.topUV[current * 2] * uvScale,
                    options.data.topUV[current * 2 + 1] * uvScale
                );
                const bottomUV = options.data.bottomUV ? new THREE.Vector2(
                    options.data.bottomUV[current * 2] * uvScale,
                    options.data.bottomUV[current * 2 + 1] * uvScale
                ) : topUV;
                const leftUV = options.data.leftUV ? new THREE.Vector2(
                    options.data.leftUV[current * 2] * uvScale,
                    options.data.leftUV[current * 2 + 1] * uvScale
                ) : topUV;
                const rightUV = options.data.rightUV ? new THREE.Vector2(
                    options.data.rightUV[current * 2] * uvScale,
                    options.data.rightUV[current * 2 + 1] * uvScale
                ) : topUV;
                const frontUV = options.data.frontUV ? new THREE.Vector2(
                    options.data.frontUV[current * 2] * uvScale,
                    options.data.frontUV[current * 2 + 1] * uvScale
                ) : topUV;
                const backUV = options.data.backUV ? new THREE.Vector2(
                    options.data.backUV[current * 2] * uvScale,
                    options.data.backUV[current * 2 + 1] * uvScale
                ) : topUV;

                if (renderFront) {
                    // pointing towards true north (z+)
                    vertices.push(
                        x, y, depth + z, // 0
                        width + x, y, depth + z, // 1
                        width + x, height + y, depth + z, // 2
                        x, y, depth + z, // 0
                        width + x, height + y, depth + z, // 2
                        x, height + y, depth + z, // 3
                    );
                    uvs.push(
                        frontUV.x, frontUV.y,
                        frontUV.x + uvScale, frontUV.y,
                        frontUV.x + uvScale, frontUV.y + uvScale,
                        frontUV.x, frontUV.y + uvScale,
                    );
                    normals.push(
                        // Front
                        0, 0, 1,
                        0, 0, 1,
                        0, 0, 1,
                        0, 0, 1
                    );
                    quadIds.push(quadIdOffset, quadIdOffset, quadIdOffset, quadIdOffset);
                    quadIdOffset += 1;
                }
                if (renderBack) {
                    vertices.push(
                        x, y, z, // 0
                        width + x, height + y, z, // 2
                        width + x, y, z, // 1
                        x, y, z, // 0
                        x, height + y, z, // 3
                        width + x, height + y, z, // 2
                    );
                    uvs.push(
                        backUV.x + uvScale, backUV.y,
                        backUV.x, backUV.y,
                        backUV.x, backUV.y + uvScale,
                        backUV.x + uvScale, backUV.y + uvScale,
                    );
                    normals.push(
                        // Back
                        0, 0, -1,
                        0, 0, -1,
                        0, 0, -1,
                        0, 0, -1
                    );
                    quadIds.push(quadIdOffset, quadIdOffset, quadIdOffset, quadIdOffset);
                    quadIdOffset += 1;
                }
                if (renderLeft) {
                    vertices.push(
                        x, y, z, // 0
                        x, y, depth + z, // 1
                        x, height + y, depth + z, // 2
                        x, y, z, // 0
                        x, height + y, depth + z, // 2
                        x, height + y, z, // 3
                    );
                    uvs.push(
                        leftUV.x, leftUV.y,
                        leftUV.x + uvScale, leftUV.y,
                        leftUV.x + uvScale, leftUV.y + uvScale,
                        leftUV.x, leftUV.y + uvScale,
                    );
                    normals.push(
                        // Left
                        -1, 0, 0,
                        -1, 0, 0,
                        -1, 0, 0,
                        -1, 0, 0
                    );
                    quadIds.push(quadIdOffset, quadIdOffset, quadIdOffset, quadIdOffset);
                    quadIdOffset += 1;
                }
                if (renderRight) {
                    vertices.push(
                        width + x, y, depth + z, // 0
                        width + x, y, z, // 1
                        width + x, height + y, z, // 2
                        width + x, y, depth + z, // 0
                        width + x, height + y, z, // 2
                        width + x, height + y, depth + z, // 3
                    );
                    uvs.push(
                        // Right face
                        rightUV.x, rightUV.y,
                        rightUV.x + uvScale, rightUV.y,
                        rightUV.x + uvScale, rightUV.y + uvScale,
                        rightUV.x, rightUV.y + uvScale,
                    );
                    normals.push(
                        // Right
                        1, 0, 0,
                        1, 0, 0,
                        1, 0, 0,
                        1, 0, 0
                    );
                    quadIds.push(quadIdOffset, quadIdOffset, quadIdOffset, quadIdOffset);
                    quadIdOffset += 1;
                }
                if (renderTop) {
                    vertices.push(
                        x, height + y, depth + z, // 0
                        width + x, height + y, depth + z, // 1
                        width + x, height + y, z, // 2
                        x, height + y, depth + z, // 0
                        width + x, height + y, z, // 2
                        x, height + y, z, // 3
                    );
                    uvs.push(
                        topUV.x, topUV.y,
                        topUV.x + uvScale, topUV.y,
                        topUV.x + uvScale, topUV.y + uvScale,
                        topUV.x, topUV.y + uvScale,
                    );
                    normals.push(
                        // Top
                        0, 1, 0,
                        0, 1, 0,
                        0, 1, 0,
                        0, 1, 0
                    );
                    quadIds.push(quadIdOffset, quadIdOffset, quadIdOffset, quadIdOffset);
                    quadIdOffset += 1;
                }
                if (renderBottom) {
                    vertices.push(
                        x, y, z, // 0
                        width + x, y, z, // 1
                        width + x, y, depth + z, // 2
                        x, y, z, // 0
                        width + x, y, depth + z, // 2
                        x, y, depth + z, // 3
                    );
                    uvs.push(
                        bottomUV.x, bottomUV.y,
                        bottomUV.x + uvScale, bottomUV.y,
                        bottomUV.x + uvScale, bottomUV.y + uvScale,
                        bottomUV.x, bottomUV.y + uvScale,
                    );
                    normals.push(
                        // Bottom
                        0, -1, 0,
                        0, -1, 0,
                        0, -1, 0,
                        0, -1, 0
                    );
                    quadIds.push(quadIdOffset, quadIdOffset, quadIdOffset, quadIdOffset);
                    quadIdOffset += 1;
                }
            }
        }
    }

    // Create cube geometry
    const quadId = new Uint32Array(quadIds);
    const position = new Uint8Array(vertices);
    const uv = new Float32Array(uvs);
    const normal = new Float32Array(normals);

    return {
        quadId,
        position,
        uv,
        normal,
    };
}