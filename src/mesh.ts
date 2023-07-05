import * as THREE from 'three';

export interface ChunkData {
    type: Int16Array; // 0 = air
    topUV: Int16Array;
    bottomUV?: Int16Array;
    leftUV?: Int16Array;
    rightUV?: Int16Array;
    frontUV?: Int16Array;
    backUV?: Int16Array;
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
    position: Float32Array;
    uv: Float32Array;
    normal: Float32Array;
    index: Uint16Array;
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

export function createChunk(
    options: CreateMeshOptions
): CreateMeshResult {
    // Create cube face indices
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const normals: number[] = [];
    const width = options.width;
    const height = options.height || width;
    const depth = options.depth || width;
    const uvScale = options.uvScale || 1;
    let indexOffset = 0;
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

                const topUV = new THREE.Vector2(
                    options.data.topUV[current * 2] * uvScale,
                    options.data.topUV[current * 2 + 1] * uvScale
                );
                const bottomUV = new THREE.Vector2(
                    options.data.bottomUV ? options.data.bottomUV[current * 2] * uvScale : topUV.x,
                    options.data.bottomUV ? options.data.bottomUV[current * 2 + 1] * uvScale : topUV.y
                );
                const leftUV = new THREE.Vector2(
                    options.data.leftUV ? options.data.leftUV[current * 2] * uvScale : topUV.x,
                    options.data.leftUV ? options.data.leftUV[current * 2 + 1] * uvScale : topUV.y
                );
                const rightUV = new THREE.Vector2(
                    options.data.rightUV ? options.data.rightUV[current * 2] * uvScale : topUV.x,
                    options.data.rightUV ? options.data.rightUV[current * 2 + 1] * uvScale : topUV.y
                );
                const frontUV = new THREE.Vector2(
                    options.data.frontUV ? options.data.frontUV[current * 2] * uvScale : topUV.x,
                    options.data.frontUV ? options.data.frontUV[current * 2 + 1] * uvScale : topUV.y
                );
                const backUV = new THREE.Vector2(
                    options.data.backUV ? options.data.backUV[current * 2] * uvScale : topUV.x,
                    options.data.backUV ? options.data.backUV[current * 2 + 1] * uvScale : topUV.y
                );

                if (renderFront) {
                    vertices.push(
                        // Front face
                        -width / 2 + x, -height / 2 + y, depth / 2 + z,  // 0
                        width / 2 + x, -height / 2 + y, depth / 2 + z,  // 1
                        width / 2 + x, height / 2 + y, depth / 2 + z,  // 2
                        -width / 2 + x, height / 2 + y, depth / 2 + z,  // 3
                    );
                    indices.push(0 + indexOffset, 1 + indexOffset, 2 + indexOffset, 0 + indexOffset, 2 + indexOffset, 3 + indexOffset);
                    indexOffset += 4;
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
                }
                if (renderBack) {
                    vertices.push(
                        // Back face
                        -width / 2 + x, -height / 2 + y, -depth / 2 + z,  // 4
                        width / 2 + x, -height / 2 + y, -depth / 2 + z,  // 5
                        width / 2 + x, height / 2 + y, -depth / 2 + z,  // 6
                        -width / 2 + x, height / 2 + y, -depth / 2 + z,  // 7
                    );
                    indices.push(0 + indexOffset, 2 + indexOffset, 1 + indexOffset, 0 + indexOffset, 3 + indexOffset, 2 + indexOffset);
                    indexOffset += 4;
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
                }
                if (renderLeft) {
                    vertices.push(
                        // Left face
                        -width / 2 + x, -height / 2 + y, -depth / 2 + z,  // 8
                        -width / 2 + x, -height / 2 + y, depth / 2 + z,  // 9
                        -width / 2 + x, height / 2 + y, depth / 2 + z,  // 10
                        -width / 2 + x, height / 2 + y, -depth / 2 + z,  // 11
                    );
                    indices.push(0 + indexOffset, 1 + indexOffset, 2 + indexOffset, 0 + indexOffset, 2 + indexOffset, 3 + indexOffset);
                    indexOffset += 4;
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
                }
                if (renderRight) {
                    vertices.push(
                        // Right face
                        width / 2 + x, -height / 2 + y, depth / 2 + z,  // 12
                        width / 2 + x, -height / 2 + y, -depth / 2 + z,  // 13
                        width / 2 + x, height / 2 + y, -depth / 2 + z,  // 14
                        width / 2 + x, height / 2 + y, depth / 2 + z,  // 15
                    );
                    indices.push(0 + indexOffset, 1 + indexOffset, 2 + indexOffset, 0 + indexOffset, 2 + indexOffset, 3 + indexOffset);
                    indexOffset += 4;
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
                }
                if (renderTop) {
                    vertices.push(
                        // Top face
                        -width / 2 + x, height / 2 + y, depth / 2 + z,  // 16
                        width / 2 + x, height / 2 + y, depth / 2 + z,  // 17
                        width / 2 + x, height / 2 + y, -depth / 2 + z,  // 18
                        -width / 2 + x, height / 2 + y, -depth / 2 + z,  // 19
                    );
                    indices.push(0 + indexOffset, 1 + indexOffset, 2 + indexOffset, 0 + indexOffset, 2 + indexOffset, 3 + indexOffset);
                    indexOffset += 4;
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
                }
                if (renderBottom) {
                    vertices.push(
                        // Bottom face
                        -width / 2 + x, -height / 2 + y, -depth / 2 + z,  // 20
                        width / 2 + x, -height / 2 + y, -depth / 2 + z,  // 21
                        width / 2 + x, -height / 2 + y, depth / 2 + z,  // 22
                        -width / 2 + x, -height / 2 + y, depth / 2 + z   // 23
                    );
                    indices.push(0 + indexOffset, 1 + indexOffset, 2 + indexOffset, 0 + indexOffset, 2 + indexOffset, 3 + indexOffset);
                    indexOffset += 4;
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
                }
            }
        }
    }

    // Create cube geometry
    const position = new Float32Array(vertices);
    const uv = new Float32Array(uvs);
    const normal = new Float32Array(normals);
    const index = new Uint16Array(indices);

    return {
        position,
        uv,
        normal,
        index
    };
}