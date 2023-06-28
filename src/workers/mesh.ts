/// <reference lib="webworker" />

import * as THREE from 'three';
import { CubeGeometryOptions, GenerateChunkRequest, GenerateMeshResponse } from './mesh_client';

export function createChunk(
    width: number,
    height: number,
    depth: number,
    buffer: Uint8Array,
    options: CubeGeometryOptions = {}
): GenerateMeshResponse {
    function getAt(x: number, y: number, z: number): boolean {
        if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth) {
            return false;
        }
        return buffer[z + y * depth + x * depth * height] === 1;
    }

    // Create cube face indices
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const normals: number[] = [];
    let indexOffset = 0;
    for (let x = 0; x < width; x += 1) {
        for (let y = 0; y < height; y += 1) {
            for (let z = 0; z < depth; z += 1) {
                const localOpts = { ...options };
                const current = getAt(x, y, z);
                localOpts.renderFront = current && getAt(x, y, z + 1) === false;
                localOpts.renderBack = current && getAt(x, y, z - 1) === false;
                localOpts.renderLeft = current && getAt(x - 1, y, z) === false;
                localOpts.renderRight = current && getAt(x + 1, y, z) === false;
                localOpts.renderTop = current && getAt(x, y + 1, z) === false;
                localOpts.renderBottom = current && getAt(x, y - 1, z) === false;

                const width = localOpts.width || 1;
                const height = localOpts.height || 1;
                const depth = localOpts.depth || 1;
                const frontUV = localOpts.frontUV || new THREE.Vector2(0, 0);
                const backUV = localOpts.backUV || frontUV;
                const leftUV = localOpts.leftUV || frontUV;
                const rightUV = localOpts.rightUV || frontUV;
                const topUV = localOpts.topUV || frontUV;
                const bottomUV = localOpts.bottomUV || frontUV;
                const uvScale = localOpts.uvScale || 1;

                const renderFront = localOpts.renderFront === undefined ? true : localOpts.renderFront;
                const renderBack = localOpts.renderBack === undefined ? true : localOpts.renderBack;
                const renderLeft = localOpts.renderLeft === undefined ? true : localOpts.renderLeft;
                const renderRight = localOpts.renderRight === undefined ? true : localOpts.renderRight;
                const renderTop = localOpts.renderTop === undefined ? true : localOpts.renderTop;
                const renderBottom = localOpts.renderBottom === undefined ? true : localOpts.renderBottom;

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
    const geometry = new THREE.BufferGeometry();
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

self.addEventListener('message', (event) => {
    if (event.data.type == 'chunk') {
        const chunkRequest = event.data as GenerateChunkRequest;
        const chunk = createChunk(
            chunkRequest.width,
            chunkRequest.height,
            chunkRequest.depth,
            chunkRequest.buffer,
            chunkRequest.options
        );
        self.postMessage({
            id: chunkRequest.id,
            data: chunk
        }, [chunk.position.buffer, chunk.uv.buffer, chunk.normal.buffer, chunk.index.buffer]);
    }
});