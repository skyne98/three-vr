import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

import { Keybinds } from './keybinds/mod';
import { blockMaterial } from './materials/block';
import { createChunkMesh } from './mesh';
import { TextureBuffer } from './data_texture';

// Test out the rapier3d library
import('@dimforge/rapier3d').then((rapier) => {
    console.log(rapier);
});

// CONSTANTS
const chunkSize = 16;

const renderer = new THREE.WebGLRenderer({
    precision: 'lowp',
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Print the platform capabilities
console.log(`Max Attributes: ${renderer.capabilities.maxAttributes}`);
console.log(`Max Uniforms: ${renderer.capabilities.maxVertexUniforms}/${renderer.capabilities.maxFragmentUniforms}`);
if (renderer.capabilities.isWebGL2 == false) {
    throw new Error('WebGL2 is not supported');
}
const gl = renderer.getContext() as WebGL2RenderingContext;
// Get maximum uniform block size
const maxUniformBlockSize = gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE);
console.log(`Max Uniform Block Size: ${maxUniformBlockSize}`);
console.log(gl.RGBA8UI);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.copy(new THREE.Vector3(20, 20, 20));
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.target = new THREE.Vector3(chunkSize / 2, chunkSize / 2, chunkSize / 2);
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const controls = new Keybinds();

// Stats
const stats = new Stats();
document.body.appendChild(stats.dom);

// Add a wireframe control
controls.keyboardKey('toggleWireframe', 'KeyF');

// Postprocessing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Wireframe
let wireframe = false;

// Load the texture
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load(new URL('../materials/prototype/Green/texture_01.png', import.meta.url).href);
// Projection matrix
const projectionMatrix = camera.projectionMatrix.clone();
const modelViewMatrix = camera.matrixWorldInverse.clone();
// Generate a material
const material = blockMaterial(new THREE.Vector2(1024, 1024), texture, projectionMatrix, modelViewMatrix);
// Generate a chunk
const chunkTypes = new Uint16Array(chunkSize * chunkSize * chunkSize);
for (let i = 0; i < chunkTypes.length; i++) {
    chunkTypes[i] = Math.round(Math.random());
}
const chunkMeshData = createChunkMesh({
    width: chunkSize,
    data: {
        type: chunkTypes,
        topUV: new Uint16Array(chunkSize * chunkSize * chunkSize * 2),
    },
    uvScale: 1,
});
const chunkMesh = new THREE.BufferGeometry();
const vertexIdAttribute = new THREE.BufferAttribute(chunkMeshData.vertexId, 1);
(vertexIdAttribute as any).gpuType = THREE.UnsignedIntType;
chunkMesh.setAttribute('vertexId', vertexIdAttribute);
const quadIdAttribute = new THREE.BufferAttribute(chunkMeshData.quadId, 1);
(quadIdAttribute as any).gpuType = THREE.UnsignedIntType;
chunkMesh.setAttribute('quadId', quadIdAttribute);
chunkMesh.setAttribute('position', new THREE.BufferAttribute(chunkMeshData.position, 3));
chunkMesh.setAttribute('normal', new THREE.BufferAttribute(chunkMeshData.normal, 3));
chunkMesh.setAttribute('uv', new THREE.BufferAttribute(chunkMeshData.uv, 2));
chunkMesh.setIndex(new THREE.BufferAttribute(chunkMeshData.index, 1));
console.log(chunkMesh.attributes);
const chunk = new THREE.Mesh(chunkMesh, material);
scene.add(chunk);

// Vertex calculation data (quad vertex positions and colors)
const lightingData = new TextureBuffer(
    chunkSize * chunkSize * chunkSize // blocks per chunk
    * 6 // 6 sides per block
    * (4 + 4) // 4 vertices per quad, 4 colors per quad
    * 3 // vec3
);
// Fill the texture with data from the mesh as well as random colors
for (let i = 0; i < chunkMeshData.quadId.length; i += 4) {
    const quadId = chunkMeshData.quadId[i];

    const vertexColor0 = new THREE.Color(0xff0000);
    const vertexColor1 = new THREE.Color(Math.random(), Math.random(), Math.random());
    const vertexColor2 = new THREE.Color(Math.random(), Math.random(), Math.random());
    const vertexColor3 = new THREE.Color(Math.random(), Math.random(), Math.random());

    const vertexId0 = i;
    const vertexPosition0 = new THREE.Vector3(
        chunkMeshData.position[vertexId0 * 3 + 0],
        chunkMeshData.position[vertexId0 * 3 + 1],
        chunkMeshData.position[vertexId0 * 3 + 2]
    );
    const vertexId1 = i + 1;
    const vertexPosition1 = new THREE.Vector3(
        chunkMeshData.position[vertexId1 * 3 + 0],
        chunkMeshData.position[vertexId1 * 3 + 1],
        chunkMeshData.position[vertexId1 * 3 + 2]
    );
    const vertexId2 = i + 2;
    const vertexPosition2 = new THREE.Vector3(
        chunkMeshData.position[vertexId2 * 3 + 0],
        chunkMeshData.position[vertexId2 * 3 + 1],
        chunkMeshData.position[vertexId2 * 3 + 2]
    );
    const vertexId3 = i + 3;
    const vertexPosition3 = new THREE.Vector3(
        chunkMeshData.position[vertexId3 * 3 + 0],
        chunkMeshData.position[vertexId3 * 3 + 1],
        chunkMeshData.position[vertexId3 * 3 + 2]
    );

    const quadStructureSize = 8 * 3;
    const quadStructureOffset = quadStructureSize * quadId;
    const vec3Size = 3;
    // Vertex 0
    lightingData.setVec3Value(quadStructureOffset + vec3Size * 0, vertexPosition0);
    lightingData.setColorValue(quadStructureOffset + vec3Size * 1, vertexColor0);
    // Vertex 1
    lightingData.setVec3Value(quadStructureOffset + vec3Size * 2, vertexPosition1);
    lightingData.setColorValue(quadStructureOffset + vec3Size * 3, vertexColor1);
    // Vertex 2
    lightingData.setVec3Value(quadStructureOffset + vec3Size * 4, vertexPosition2);
    lightingData.setColorValue(quadStructureOffset + vec3Size * 5, vertexColor2);
    // Vertex 3
    lightingData.setVec3Value(quadStructureOffset + vec3Size * 6, vertexPosition3);
    lightingData.setColorValue(quadStructureOffset + vec3Size * 7, vertexColor3);
}
// Set first 0 bytes to 0 for testing
lightingData.setIntValue(345, 1);
// Upload the data to the GPU
lightingData.updateTexture();
// Set it to the material as a uniform
material.uniforms.uLightingData = {
    value: lightingData.texture
};
material.uniforms.uLightingDataSize = {
    value: lightingData.width
};
material.needsUpdate = true;
let lastTime = 0;

renderer.setAnimationLoop((time) => {
    const delta = time - lastTime;
    lastTime = time;
    stats.update();
    composer.render();
    orbitControls.update();

    // Check the wireframe control
    if (controls.get('toggleWireframe').isJustReleased) {
        wireframe = !wireframe;
        console.log(`Wireframe: ${wireframe}`);
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.material.wireframe = wireframe;
            }
        });
    }

    controls.maintenance(time);
});