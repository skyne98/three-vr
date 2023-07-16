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
import { ChunkMeshBuilder, FaceMeshBuilder, VoxelMeshBuilder } from './mesh';
import { TextureBuffer } from './data_texture';
import { humanCount, humanSize, humanTime } from './human';
import { ChunkMesh } from './chunk_mesh';
import { Coord } from './coordinate';

// Test out the rapier3d library
import('@dimforge/rapier3d').then((rapier) => {
    console.log(rapier);
});

// CONSTANTS
const chunkSize = 64;

console.log(`===THREE.js===`);
const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
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

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.copy(new THREE.Vector3(chunkSize + 2, chunkSize + 2, chunkSize + 2));
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.target = new THREE.Vector3(chunkSize / 2, chunkSize / 2, chunkSize / 2);
const axesHelper = new THREE.AxesHelper(1);
scene.add(axesHelper);
const nativeWindowSize = new THREE.Vector2(window.innerWidth, window.innerHeight);
function resizeRenderer(
    internalWidth: number,
    internalHeight: number
) {
    console.log(`Resizing renderer to ${internalWidth}x${internalHeight}`);
    const aspect = internalWidth / internalHeight;
    renderer.setSize(internalWidth, internalHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.domElement.style.width = nativeWindowSize.x + 'px';
    renderer.domElement.style.height = nativeWindowSize.y + 'px';
}
function resizeToNativePercent(percent: number) {
    const internalWidth = Math.round(nativeWindowSize.x * percent);
    const internalHeight = Math.round(nativeWindowSize.y * percent);
    resizeRenderer(internalWidth, internalHeight);
}
resizeRenderer(window.innerWidth, window.innerHeight);
window.addEventListener('resize', () => {
    nativeWindowSize.set(window.innerWidth, window.innerHeight);
    resizeRenderer(nativeWindowSize.x, nativeWindowSize.y);
});

const controls = new Keybinds();

// Stats
const stats = new Stats();
document.body.appendChild(stats.dom);

// Add a wireframe control
controls.keyboardKey('toggleWireframe', 'KeyF');
// Add cull camera control
controls.keyboardKey('switchCullCamera', 'KeyC');

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
// Generate a voxel
// const voxelMeshData = VoxelMeshBuilder.offset(VoxelMeshBuilder.build(), new THREE.Vector3(0, 0, 0));
// const voxelMesh = new THREE.BufferGeometry();
// voxelMesh.setAttribute('position', new THREE.Uint8BufferAttribute(voxelMeshData.position, 3));
// (voxelMesh.getAttribute('position') as any).gpuType = THREE.IntType;
// voxelMesh.setAttribute('normal', new THREE.Uint8BufferAttribute(voxelMeshData.normal, 3));
// voxelMesh.setAttribute('uv', new THREE.Float32BufferAttribute(voxelMeshData.uv, 2));
// const voxel = new THREE.Mesh(voxelMesh, material);
// scene.add(voxel);

// Generate a chunk
const chunkTypes = new Uint16Array(chunkSize * chunkSize * chunkSize);
for (let i = 0; i < chunkTypes.length; i++) {
    chunkTypes[i] = Math.round(Math.random());
}
const chunkMeshData = ChunkMeshBuilder.offset(ChunkMeshBuilder.build(chunkSize, chunkTypes), new THREE.Vector3(0, 0, 0));
function getAttributeSize(attribute: THREE.BufferAttribute) {
    return attribute.array.length;
}
const geometries: THREE.BufferGeometry[] = [];
const positionAttributes: THREE.Uint8BufferAttribute[] = [];
const chunkMeshes: ChunkMesh[] = [];
for (let i = 0; i < chunkMeshData.position.length; i++) {
    const chunkMesh = new THREE.BufferGeometry();
    geometries.push(chunkMesh);
    const positionAttribute = new THREE.Uint8BufferAttribute(chunkMeshData.position[i], 3);
    positionAttribute.name = 'position attribute';
    (positionAttribute as any).gpuType = THREE.IntType;
    positionAttributes.push(positionAttribute);
    const positionAttributeUploadStart = performance.now();
    positionAttribute.onUpload(() => {
        const positionAttributeUploadEnd = performance.now();
        const size = humanSize(getAttributeSize(positionAttribute));
        const name = positionAttribute.name;
        console.log(`Uploaded ${name} (${size}) in ${positionAttributeUploadEnd - positionAttributeUploadStart}ms`);
    });
    chunkMesh.setAttribute('position', positionAttribute);
    chunkMesh.setAttribute('normal', new THREE.BufferAttribute(chunkMeshData.normal[i], 3));
    chunkMesh.setAttribute('uv', new THREE.BufferAttribute(chunkMeshData.uv[i], 2));
    const chunk = new ChunkMesh(chunkMesh, material);
    chunk.geometry.computeBoundingBox();
    chunkMeshes.push(chunk);
    scene.add(chunk);
}

// GUI
const gui = new GUI();
const guiState = {
    // Stats
    get vertices() {
        return humanCount(geometries.reduce((acc, g) => acc + g.attributes.position.count, 0));
    },
    get positionBufferSize() {
        return humanSize(positionAttributes.reduce((acc, attribute) => acc + getAttributeSize(attribute), 0));
    },
    get texture() {
        return texture;
    },
    get resolution() {
        const boundingClientRect = renderer.domElement.getBoundingClientRect();
        return `${boundingClientRect.width}x${boundingClientRect.height}`;
    },
    get renderResolution() {
        const target = new THREE.Vector2();
        renderer.getSize(target);
        return `${target.x}x${target.y}`;
    },
    get pixelRatio() {
        return renderer.getPixelRatio();
    },

    // Actions
    setNativeResolution: () => {
        resizeRenderer(window.innerWidth, window.innerHeight);
    },
    setHalfNativeResolution: () => {
        resizeToNativePercent(0.5);
    },
    setPicoResolution: () => {
        // Pico 4 is 2000x2000x2=4000x2000, but try to maintain aspect ratio
        resizeRenderer(4000, 2000);
    }
};
const statsFolder = gui.addFolder('Stats');
statsFolder.add(guiState, 'resolution').listen().name('Resolution').disable(true);
statsFolder.add(guiState, 'renderResolution').listen().name('Render Resolution').disable(true);
statsFolder.add(guiState, 'pixelRatio').listen().name('Pixel Ratio').disable(true);
statsFolder.add(guiState, 'vertices').listen().name('Vertices').disable(true);
statsFolder.add(guiState, 'positionBufferSize').listen().name('Position Buffer Size').disable(true);
const actionsFolder = gui.addFolder('Actions');
actionsFolder.add(guiState, 'setNativeResolution').name('Set Native Resolution');
actionsFolder.add(guiState, 'setHalfNativeResolution').name('Set 0.5x Native Resolution');
actionsFolder.add(guiState, 'setPicoResolution').name('Set Pico Resolution');

// Face culling
let cullCamera = camera;
const raycaster = new THREE.Raycaster();
function isNormalVisible(normal: THREE.Vector3, sample: THREE.Vector2, camera: THREE.PerspectiveCamera) {
    // Create a ray from the camera through the sample point
    raycaster.setFromCamera(sample, camera);
    // Check if the ray direction is in the same direction as the normal
    return raycaster.ray.direction.dot(normal) < 0;
}
function cullNormals(meshes: ChunkMesh[], camera: THREE.PerspectiveCamera) {
    // Set all meshes to be invisible
    for (var mesh of meshes) {
        mesh.visible = false;
    }

    // Get the overall bounding box
    let minX, minY, minZ, maxX, maxY, maxZ;
    minX = minY = minZ = Number.POSITIVE_INFINITY;
    maxX = maxY = maxZ = Number.NEGATIVE_INFINITY;
    for (var mesh of meshes) {
        const boundingBox = mesh.geometry.boundingBox;
        minX = Math.min(minX, boundingBox!.min.x);
        minY = Math.min(minY, boundingBox!.min.y);
        minZ = Math.min(minZ, boundingBox!.min.z);
        maxX = Math.max(maxX, boundingBox!.max.x);
        maxY = Math.max(maxY, boundingBox!.max.y);
        maxZ = Math.max(maxZ, boundingBox!.max.z);
    }

    // Create 8 bounding box corners
    const corners = [
        new THREE.Vector3(minX, minY, minZ),
        new THREE.Vector3(minX, minY, maxZ),
        new THREE.Vector3(minX, maxY, minZ),
        new THREE.Vector3(minX, maxY, maxZ),
        new THREE.Vector3(maxX, minY, minZ),
        new THREE.Vector3(maxX, minY, maxZ),
        new THREE.Vector3(maxX, maxY, minZ),
        new THREE.Vector3(maxX, maxY, maxZ),
    ];
    // Turn them into screen space
    const screenCorners = corners.map((corner) => {
        const screenCorner = corner.clone();
        screenCorner.project(camera);
        return screenCorner;
    });

    // Check each direction
    for (let i = 0; i < meshes.length; i++) {
        const direction = Coord.DIRECTIONS[i];
        for (let j = 0; j < screenCorners.length; j++) {
            const corner = screenCorners[j];
            const sample = new THREE.Vector2(corner.x, corner.y);
            if (isNormalVisible(direction, sample, camera)) {
                meshes[i].visible = true;
                break;
            }
        }
    }
}

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
    // Switch the cull camera
    if (controls.get('switchCullCamera').isJustReleased) {
        if (cullCamera == camera) {
            cullCamera = camera.clone();
            console.log(`Cull camera: clone of current camera`);
        } else {
            cullCamera = camera;
            console.log(`Cull camera: current camera`);
        }
    }

    // Do automatic backface culling
    cullNormals(chunkMeshes, cullCamera);

    controls.maintenance(time);
});