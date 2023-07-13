import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import { GUI } from 'lil-gui';
import { effectScope, computed, ref } from '@vue/reactivity';

import { Keybinds } from './keybinds/mod';
import { blockMaterial } from './materials/block';
import { createChunkMesh } from './mesh';
import { TextureBuffer } from './data_texture';
import { humanSize, humanTime } from './human';
import { ChunkMesh } from './chunk_mesh';

// Test out the rapier3d library
import('@dimforge/rapier3d').then((rapier) => {
    console.log(rapier);
});

// Test out the Vue reactivity library
console.log(`===Reactivity tests===`);
const a = ref(1);
const b = ref(2);
const c = computed(() => a.value + b.value);
console.log(`Computed (a + b): ${c.value}`);
a.value = 2;
console.log(`Computed (a + b, a -> 2): ${c.value}`);
// Test out reactivity inside of objects
const reactiveObj = ref({
    val: 15,
});
console.log(`Reactive object: ${reactiveObj.value.val}`);
reactiveObj.value.val = 20;
console.log(`Reactive object (value -> 20): ${reactiveObj.value.val}`);
const reactiveObjPlus10 = computed(() => reactiveObj.value.val + 10);
console.log(`Reactive object + 10: ${reactiveObjPlus10.value}`);
reactiveObj.value.val = 30;
console.log(`Reactive object + 10 (value -> 30): ${reactiveObjPlus10.value}`);
function sleep(ms) {
    var e = new Date().getTime() + ms;
    while (new Date().getTime() <= e) { }
}
// Measure the overhead of reactivity by doing a lot of a simple
// computation with and without reactivity
console.log('');
console.log('Reacity overhead test');
const reactivityOverheadTest = ref(0);
const reactivityOverheadTestComputed = computed(() => reactivityOverheadTest.value + 1);
const reactivityOverheadTestStart = performance.now();
let sum = 0;
for (let i = 0; i < 1000000; i++) {
    reactivityOverheadTest.value = reactivityOverheadTestComputed.value;
    sum += reactivityOverheadTest.value;
}
const reactivityOverheadTestEnd = performance.now();
console.log(`Finished reactivity overhead test in ${humanTime(reactivityOverheadTestEnd - reactivityOverheadTestStart)} with a sum of ${sum}`);
// Now do the same thing without reactivity
console.log('');
console.log('Non-reactivity overhead test');
let nonReactivityOverheadTest = 0;
const nonReactivityOverheadTestStart = performance.now();
let nonReactivitySum = 0;
for (let i = 0; i < 1000000; i++) {
    nonReactivityOverheadTest += 1;
    nonReactivitySum += nonReactivityOverheadTest;
}
const nonReactivityOverheadTestEnd = performance.now();
console.log(`Finished non-reactivity overhead test in ${humanTime(nonReactivityOverheadTestEnd - nonReactivityOverheadTestStart)} with a sum of ${nonReactivitySum}`);

// CONSTANTS
const chunkSize = 64;

console.log(`===THREE.js===`);
const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
console.log(`Rendering at ${window.innerWidth}x${window.innerHeight}`);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
const button = VRButton.createButton(renderer);
document.body.appendChild(button);

// Print the platform capabilities
console.log(`Using WebGL${renderer.capabilities.isWebGL2 ? '2' : '1'}`);
console.log(`Max Attributes: ${renderer.capabilities.maxAttributes}`);
console.log(`Max Uniforms: ${renderer.capabilities.maxVertexUniforms}/${renderer.capabilities.maxFragmentUniforms}`);
console.log(`Max Precision: ${renderer.capabilities.precision}`);
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
camera.position.copy(new THREE.Vector3(70, 70, 70));
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

function getAttributeSize(attribute: THREE.BufferAttribute) {
    return attribute.array.length;
}

const quadIdAttribute = new THREE.Uint32BufferAttribute(chunkMeshData.quadId, 1);
chunkMesh.setAttribute('quadId', quadIdAttribute);
const positionAttribute = new THREE.Uint8BufferAttribute(chunkMeshData.position, 3);
positionAttribute.name = 'position attribute';
(positionAttribute as any).gpuType = THREE.IntType;
const positionAttributeUploadStart = performance.now();
positionAttribute.onUpload(() => {
    const positionAttributeUploadEnd = performance.now();
    const size = humanSize(getAttributeSize(positionAttribute));
    const name = positionAttribute.name;
    console.log(`Uploaded ${name} (${size}) in ${positionAttributeUploadEnd - positionAttributeUploadStart}ms`);
});
chunkMesh.setAttribute('position', positionAttribute);
chunkMesh.setAttribute('normal', new THREE.BufferAttribute(chunkMeshData.normal, 3));
chunkMesh.setAttribute('uv', new THREE.BufferAttribute(chunkMeshData.uv, 2));
console.log(chunkMesh.attributes);
const chunk = new ChunkMesh(chunkMesh, material);
scene.add(chunk);

// GUI
const gui = new GUI();
const guiState = {
    // Stats
    sayHi: () => {
        console.log('Hi!');
    },
    get vertices() {
        return chunkMesh.attributes.position.count;
    },
    get positionBufferSize() {
        return humanSize(getAttributeSize(positionAttribute));
    },
    get texture() {
        return texture;
    },
    // Actions
    setNativeResolution: () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        console.log(`Set resolution to ${window.innerWidth}x${window.innerHeight}`);
    },
    setPicoResolution: () => {
        // Pico 4 is 2000x2000x2=4000x2000, but try to maintain aspect ratio
        const landscape = window.innerWidth > window.innerHeight;
        const renderWidth = landscape ? 4000 : 2000;
        const renderHeight = landscape ? 2000 : 4000;
        const realWidth = window.innerWidth;
        const realHeight = window.innerHeight;
        const aspectRatio = realWidth / realHeight;
        camera.aspect = aspectRatio;
        camera.updateProjectionMatrix();
        renderer.setSize(realWidth, realHeight);
        renderer.setViewport(0, 0, renderWidth, renderHeight);
        renderer.setPixelRatio(renderWidth / realWidth);
        console.log(`Set resolution to ${renderWidth}x${renderHeight}`);
    }
};
const statsFolder = gui.addFolder('Stats');
statsFolder.add(guiState, 'sayHi').name('Say Hi');
statsFolder.add(guiState, 'vertices').listen().name('Vertices').disable(true);
statsFolder.add(guiState, 'positionBufferSize').listen().name('Position Buffer Size').disable(true);
const actionsFolder = gui.addFolder('Actions');
actionsFolder.add(guiState, 'setNativeResolution').name('Set Native Resolution');
actionsFolder.add(guiState, 'setPicoResolution').name('Set Pico Resolution');

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