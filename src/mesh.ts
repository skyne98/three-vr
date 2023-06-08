import * as THREE from 'three';

// Returns a 3d box buffer geometry with the given width and height.
export function createBox(width: number, height: number, depth: number): THREE.BufferGeometry {
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
        0, 0,
        1, 0,
        1, 1,
        0, 1,
        // Back face
        1, 0,
        0, 0,
        0, 1,
        1, 1,
        // Left face
        0, 0,
        1, 0,
        1, 1,
        0, 1,
        // Right face
        0, 0,
        1, 0,
        1, 1,
        0, 1,
        // Top face
        0, 0,
        1, 0,
        1, 1,
        0, 1,
        // Bottom face
        0, 0,
        1, 0,
        1, 1,
        0, 1
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
