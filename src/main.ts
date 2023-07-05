import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

import { Keybinds } from './keybinds/mod';
import { blockMaterial } from './materials/block';
import { createChunkMesh } from './mesh';

// Test out the rapier3d library
import('@dimforge/rapier3d').then((rapier) => {
    console.log(rapier);
});

// CONSTANTS
const chunkSize = 16;

const renderer = new THREE.WebGLRenderer({
    precision: "lowp"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

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

let lastTime = performance.now();
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
// Generate a material
const material = blockMaterial(new THREE.Vector2(1024, 1024), texture);
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
chunkMesh.setAttribute('position', new THREE.BufferAttribute(chunkMeshData.position, 3));
chunkMesh.setAttribute('normal', new THREE.BufferAttribute(chunkMeshData.normal, 3));
chunkMesh.setAttribute('uv', new THREE.BufferAttribute(chunkMeshData.uv, 2));
chunkMesh.setIndex(new THREE.BufferAttribute(chunkMeshData.index, 1));
const chunk = new THREE.Mesh(chunkMesh, material);
scene.add(chunk);

function loop() {
    const time = performance.now();
    const delta = (time - lastTime) / 1000;
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

    controls.maintenance(delta);
    requestAnimationFrame(loop);
}

loop();