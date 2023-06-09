import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { Controls } from './controls';
import { createChunk, createCube } from './mesh';
import { Noise } from './noise';

const white = new THREE.Color(0xffffff);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

});
const pointerLockControls = new PointerLockControls(camera, renderer.domElement);
pointerLockControls.addEventListener('lock', () => {
    console.log('PointerLockControls locked');
});
pointerLockControls.addEventListener('unlock', () => {
    console.log('PointerLockControls unlocked');
});

const pointLight = new THREE.PointLight(white, 1, 100);
pointLight.position.set(0, 0, 0);
pointLight.castShadow = true;
scene.add(pointLight);
const ambientLight = new THREE.AmbientLight(white, 0.3);
scene.add(ambientLight);

const textureLoader = new THREE.TextureLoader();
const colorMapUrl = new URL('../materials/sand/Ground054_2K_Color.jpg', import.meta.url);
const colorTexture = textureLoader.load(colorMapUrl.href);
colorTexture.colorSpace = THREE.SRGBColorSpace;
const normalMapUrl = new URL('../materials/sand/Ground054_2K_NormalGL.jpg', import.meta.url);
const normalTexture = textureLoader.load(normalMapUrl.href);
const roughnessMapUrl = new URL('../materials/sand/Ground054_2K_Roughness.jpg', import.meta.url);
const roughnessTexture = textureLoader.load(roughnessMapUrl.href);
const aoMapUrl = new URL('../materials/sand/Ground054_2K_AmbientOcclusion.jpg', import.meta.url);
const aoTexture = textureLoader.load(aoMapUrl.href);
const bumpMapUrl = new URL('../materials/sand/Ground054_2K_Displacement.jpg', import.meta.url);
const bumpTexture = textureLoader.load(bumpMapUrl.href);

window.addEventListener('click', () => {
    pointerLockControls.lock();
});
const controls = new Controls();
controls.keyboardAxis2('move', 'KeyW', 'KeyS', 'KeyA', 'KeyD');
controls.keyboardAxis('upDown', 'ShiftLeft', 'Space');
controls.keyboardKey('unlock', 'Escape');
controls.keyboardKey('leaveLight', 'KeyL');

// Stats
const stats = new Stats();
document.body.appendChild(stats.dom);

const material = new THREE.MeshStandardMaterial({
    color: white,
    map: colorTexture,
    roughnessMap: roughnessTexture,
    metalnessMap: roughnessTexture,
    aoMap: aoTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.05,
});
const geometry = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
const cube = new THREE.Mesh(geometry, material);
cube.castShadow = true;
cube.receiveShadow = true;
scene.add(cube);

camera.position.z = 5;

// Custom mesh (vers, indices, uvs)
const prototypeColorMapUrl = new URL('../materials/prototype/Orange/texture_01.png', import.meta.url);
const prototypeColorTexture = new THREE.TextureLoader().load(prototypeColorMapUrl.href);
prototypeColorTexture.colorSpace = THREE.SRGBColorSpace;
const prototypeMaterial = new THREE.MeshStandardMaterial({
    color: white,
    map: prototypeColorTexture,
});
const customGeometry = createCube({});
const customMesh = new THREE.Mesh(customGeometry, prototypeMaterial);
customMesh.position.set(0, 0, -2);
customMesh.castShadow = true;
customMesh.receiveShadow = true;
scene.add(customMesh);

// Noise
const noise = new Noise('seed');

// Draw noise texture on screen
const noiseCanvas = document.createElement('canvas');
noiseCanvas.width = 256;
noiseCanvas.height = 256;
const noiseContext = noiseCanvas.getContext('2d');
if (!noiseContext) throw new Error('Could not get canvas context');
const noiseImageData = noiseContext.createImageData(noiseCanvas.width, noiseCanvas.height);
for (let x = 0; x < noiseCanvas.width; x++) {
    for (let y = 0; y < noiseCanvas.height; y++) {
        const i = (x + y * noiseCanvas.width) * 4;
        const value = noise.noise(x / 10, y / 10);
        noiseImageData.data[i + 0] = value * 255;
        noiseImageData.data[i + 1] = value * 255;
        noiseImageData.data[i + 2] = value * 255;
        noiseImageData.data[i + 3] = 255;
    }
}
noiseContext.putImageData(noiseImageData, 0, 0);

const noiseTexture = new THREE.CanvasTexture(noiseCanvas);
noiseTexture.needsUpdate = true;
const noiseMaterial = new THREE.MeshBasicMaterial({
    map: noiseTexture,
});
const noiseGeometry = new THREE.PlaneGeometry(1, 1);
const noiseMesh = new THREE.Mesh(noiseGeometry, noiseMaterial);
noiseMesh.position.set(0, 0, -1);
scene.add(noiseMesh);

let lastTime = performance.now();
let leaveLight = false;

// Chunks storage
const chunks: Map<string, THREE.Mesh> = new Map();
const chunkOffsets: Map<THREE.Mesh, number> = new Map();
function getChunkKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
}
function getChunk(x: number, y: number, z: number): THREE.Mesh | undefined {
    return chunks.get(getChunkKey(x, y, z));
}
function setChunk(x: number, y: number, z: number, chunk: THREE.Mesh): void {
    chunks.set(getChunkKey(x, y, z), chunk);
}
function removeChunk(x: number, y: number, z: number): void {
    let chunk = getChunk(x, y, z);
    if (!chunk) return;
    chunks.delete(getChunkKey(x, y, z));
    scene.remove(chunk);
}
function updateChunks(): void {
    const chunkSize = 16;
    const chunkRadius = 3;

    const cameraObject = pointerLockControls.getObject();
    const cameraPosition = cameraObject.position;
    const playerChunkX = Math.floor(cameraPosition.x / chunkSize);
    const playerChunkY = Math.floor(cameraPosition.y / chunkSize);
    const playerChunkZ = Math.floor(cameraPosition.z / chunkSize);

    for (let chunk of chunks.values()) {
        const chunkPosition = chunk.position;
        const chunkX = Math.floor(chunkPosition.x / chunkSize);
        const chunkY = Math.floor(chunkPosition.y / chunkSize);
        const chunkZ = Math.floor(chunkPosition.z / chunkSize);
        const distance = Math.sqrt((chunkX - playerChunkX) ** 2 + (chunkY - playerChunkY) ** 2 + (chunkZ - playerChunkZ) ** 2);
        if (distance > chunkRadius * 2.0) {
            removeChunk(chunkX, chunkY, chunkZ);
        }
    }

    for (let chunkX = playerChunkX - chunkRadius; chunkX <= playerChunkX + chunkRadius; chunkX++) {
        for (let chunkY = playerChunkY - chunkRadius; chunkY <= playerChunkY + chunkRadius; chunkY++) {
            for (let chunkZ = playerChunkZ - chunkRadius; chunkZ <= playerChunkZ + chunkRadius; chunkZ++) {
                if (getChunk(chunkX, chunkY, chunkZ)) continue;
                const buffer: boolean[] = [];
                for (let blockX = 0; blockX < chunkSize; blockX++) {
                    for (let blockY = 0; blockY < chunkSize; blockY++) {
                        for (let blockZ = 0; blockZ < chunkSize; blockZ++) {
                            let worldX = blockX + chunkX * chunkSize;
                            let worldY = blockY + chunkY * chunkSize;
                            let worldZ = blockZ + chunkZ * chunkSize;

                            let noiseVal = noise.noise(worldX / 50, worldZ / 50);
                            let height = noiseVal * 16;

                            buffer.push(worldY <= height);
                        }
                    }
                }
                const chunkGeometry = createChunk(chunkSize, chunkSize, chunkSize, buffer, {});
                const chunkMesh = new THREE.Mesh(chunkGeometry, prototypeMaterial);
                chunkMesh.position.set(chunkX * chunkSize, chunkY * chunkSize, chunkZ * chunkSize);
                chunkMesh.castShadow = true;
                chunkMesh.receiveShadow = true;
                setChunk(chunkX, chunkY, chunkZ, chunkMesh);
                scene.add(chunkMesh);
                chunkOffsets.set(chunkMesh, 5);
            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = (time - lastTime) / 1000;
    lastTime = time;
    stats.update();

    // Controls
    if (controls.get('unlock').isJustPressed) {
        pointerLockControls.unlock();
    }
    // Move camera around
    let movement = new THREE.Vector3();
    movement.setX(controls.get('move').value.x);
    movement.setY(controls.get('upDown').value.x);
    movement.setZ(controls.get('move').value.y);
    movement.multiplyScalar(10 * delta);
    // Move in the direction of the camera
    const cameraObject = pointerLockControls.getObject();
    const cameraLocalMovement = movement.clone().applyQuaternion(cameraObject.quaternion);
    cameraObject.position.add(cameraLocalMovement);

    // Set point light position to camera position
    if (controls.get('leaveLight').isJustPressed) {
        leaveLight = !leaveLight;
    }
    if (leaveLight == false) {
        pointLight.position.set(camera.position.x, camera.position.y, camera.position.z);
    }

    // Update chunks
    updateChunks();

    // Set chunk offsets
    let chunkSize = 16;
    for (let chunk of chunks.values()) {
        const chunkPosition = chunk.position;
        const chunkY = Math.ceil(chunkPosition.y / chunkSize);
        let offset = chunkOffsets.get(chunk)!;
        if (offset === 0) continue;
        let newOffset = offset - delta * 10;
        if (newOffset < 0) newOffset = 0;
        chunkOffsets.set(chunk, newOffset);
        chunk.position.setY(chunkY * chunkSize - newOffset);
    }

    renderer.render(scene, camera);
}

animate();