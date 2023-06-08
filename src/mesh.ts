import * as THREE from 'three';

export interface BoxGeometryOptions {
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
}
export function createBox(options: BoxGeometryOptions = {}): THREE.BufferGeometry {
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

    // Create cube vertices 
    const vertices = [
        // Front face
        -width / 2, -height / 2, depth / 2,  // 0
        width / 2, -height / 2, depth / 2,  // 1
        width / 2, height / 2, depth / 2,  // 2
        -width / 2, height / 2, depth / 2,  // 3

        // Back face
        -width / 2, -height / 2, -depth / 2,  // 4
        width / 2, -height / 2, -depth / 2,  // 5
        width / 2, height / 2, -depth / 2,  // 6
        -width / 2, height / 2, -depth / 2,  // 7

        // Left face
        -width / 2, -height / 2, -depth / 2,  // 8 
        -width / 2, -height / 2, depth / 2,  // 9
        -width / 2, height / 2, depth / 2,  // 10
        -width / 2, height / 2, -depth / 2,  // 11

        // Right face
        width / 2, -height / 2, depth / 2,  // 12  
        width / 2, -height / 2, -depth / 2,  // 13  
        width / 2, height / 2, -depth / 2,  // 14  
        width / 2, height / 2, depth / 2,  // 15

        // Top face
        -width / 2, height / 2, depth / 2,  // 16
        width / 2, height / 2, depth / 2,  // 17
        width / 2, height / 2, -depth / 2,  // 18
        -width / 2, height / 2, -depth / 2,  // 19

        // Bottom face
        -width / 2, -height / 2, -depth / 2,  // 20
        width / 2, -height / 2, -depth / 2,  // 21
        width / 2, -height / 2, depth / 2,  // 22
        -width / 2, -height / 2, depth / 2   // 23

    ];

    // Create cube face indices
    const indices = [
        0, 1, 2, 0, 2, 3,    // front
        4, 6, 5, 4, 7, 6,    // back
        8, 9, 10, 8, 10, 11,   // left
        12, 13, 14, 12, 14, 15,   // right
        16, 17, 18, 16, 18, 19,   // top
        20, 21, 22, 20, 22, 23    // bottom
    ];

    // Create cube UV coordinates
    const uvs = [
        // Front face
        frontUV.x, frontUV.y,
        frontUV.x + uvScale, frontUV.y,
        frontUV.x + uvScale, frontUV.y + uvScale,
        frontUV.x, frontUV.y + uvScale,
        // Back face
        frontUV.x + uvScale, frontUV.y,
        frontUV.x, frontUV.y,
        frontUV.x, frontUV.y + uvScale,
        frontUV.x + uvScale, frontUV.y + uvScale,
        // Left face
        leftUV.x, leftUV.y,
        leftUV.x + uvScale, leftUV.y,
        leftUV.x + uvScale, leftUV.y + uvScale,
        leftUV.x, leftUV.y + uvScale,
        // Right face
        rightUV.x, rightUV.y,
        rightUV.x + uvScale, rightUV.y,
        rightUV.x + uvScale, rightUV.y + uvScale,
        rightUV.x, rightUV.y + uvScale,
        // Top face
        topUV.x, topUV.y,
        topUV.x + uvScale, topUV.y,
        topUV.x + uvScale, topUV.y + uvScale,
        topUV.x, topUV.y + uvScale,
        // Bottom face
        bottomUV.x, bottomUV.y,
        bottomUV.x + uvScale, bottomUV.y,
        bottomUV.x + uvScale, bottomUV.y + uvScale,
        bottomUV.x, bottomUV.y + uvScale
    ];

    // Create cube normals
    const normals = [
        // Front
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        // Back
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        // Left
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        // Right
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        // Top
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        // Bottom
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0
    ];

    // Create cube geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

    return geometry;
}
