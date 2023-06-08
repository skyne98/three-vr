import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface CubeGeometryOptions {
    width?: number;
    height?: number;
    depth?: number;
    frontUV?: THREE.Vector2;
    backUV?: THREE.Vector2;
    leftUV?: THREE.Vector2;
    rightUV?: THREE.Vector2;
    topUV?: THREE.Vector2;
    bottomUV?: THREE.Vector2;
    uvScale?: number;

    renderFront?: boolean;
    renderBack?: boolean;
    renderLeft?: boolean;
    renderRight?: boolean;
    renderTop?: boolean;
    renderBottom?: boolean;
}
export function createCube(options: CubeGeometryOptions = {}): THREE.BufferGeometry {
    const width = options.width || 1;
    const height = options.height || 1;
    const depth = options.depth || 1;
    const frontUV = options.frontUV || new THREE.Vector2(0, 0);
    const backUV = options.backUV || frontUV;
    const leftUV = options.leftUV || frontUV;
    const rightUV = options.rightUV || frontUV;
    const topUV = options.topUV || frontUV;
    const bottomUV = options.bottomUV || frontUV;
    const uvScale = options.uvScale || 1;

    const renderFront = options.renderFront === undefined ? true : options.renderFront;
    const renderBack = options.renderBack === undefined ? true : options.renderBack;
    const renderLeft = options.renderLeft === undefined ? true : options.renderLeft;
    const renderRight = options.renderRight === undefined ? true : options.renderRight;
    const renderTop = options.renderTop === undefined ? true : options.renderTop;
    const renderBottom = options.renderBottom === undefined ? true : options.renderBottom;

    // Create cube face indices
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const normals: number[] = [];
    let indexOffset = 0;
    if (renderFront) {
        vertices.push(
            // Front face
            -width / 2, -height / 2, depth / 2,  // 0
            width / 2, -height / 2, depth / 2,  // 1
            width / 2, height / 2, depth / 2,  // 2
            -width / 2, height / 2, depth / 2,  // 3
        );
        indices.push(0, 1, 2, 0, 2, 3);
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
            -width / 2, -height / 2, -depth / 2,  // 4
            width / 2, -height / 2, -depth / 2,  // 5
            width / 2, height / 2, -depth / 2,  // 6
            -width / 2, height / 2, -depth / 2,  // 7
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
            -width / 2, -height / 2, -depth / 2,  // 8
            -width / 2, -height / 2, depth / 2,  // 9
            -width / 2, height / 2, depth / 2,  // 10
            -width / 2, height / 2, -depth / 2,  // 11
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
            width / 2, -height / 2, depth / 2,  // 12
            width / 2, -height / 2, -depth / 2,  // 13
            width / 2, height / 2, -depth / 2,  // 14
            width / 2, height / 2, depth / 2,  // 15
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
            -width / 2, height / 2, depth / 2,  // 16
            width / 2, height / 2, depth / 2,  // 17
            width / 2, height / 2, -depth / 2,  // 18
            -width / 2, height / 2, -depth / 2,  // 19
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
            -width / 2, -height / 2, -depth / 2,  // 20
            width / 2, -height / 2, -depth / 2,  // 21
            width / 2, -height / 2, depth / 2,  // 22
            -width / 2, -height / 2, depth / 2   // 23
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

    // Create cube geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

    return geometry;
}
export function createChunk(width: number, height: number, depth: number, buffer: boolean[], options: CubeGeometryOptions = {}): THREE.BufferGeometry {
    let geometries: THREE.BufferGeometry[] = [];
    function getAt(x: number, y: number, z: number): boolean {
        if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth) {
            return false;
        }
        return buffer[x + y * width + z * width * height];
    }

    for (let x = 0; x < width; x += 1) {
        for (let y = 0; y < height; y += 1) {
            for (let z = 0; z < depth; z += 1) {
                const localOpts = JSON.parse(JSON.stringify(options));
                const current = getAt(x, y, z);
                localOpts.renderFront = current && getAt(x, y, z + 1) === false;
                localOpts.renderBack = current && getAt(x, y, z - 1) === false;
                localOpts.renderLeft = current && getAt(x - 1, y, z) === false;
                localOpts.renderRight = current && getAt(x + 1, y, z) === false;
                localOpts.renderTop = current && getAt(x, y + 1, z) === false;
                localOpts.renderBottom = current && getAt(x, y - 1, z) === false;
                const geometry = createCube(localOpts);
                geometry.translate(x, y, z);
                geometries.push(geometry);
            }
        }
    }

    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
    const withMergedVertices = BufferGeometryUtils.mergeVertices(mergedGeometry);

    return withMergedVertices;
}