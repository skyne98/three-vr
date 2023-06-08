import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { Controls } from './controls';
import { createChunk, createCube } from './mesh';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
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

const pointLight = new THREE.PointLight(0xffffff, 1, 10);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
scene.add(ambientLight);

const colorMapUrl = new URL('../materials/sand/Ground054_2K_Color.jpg', import.meta.url);
const colorTexture = new THREE.TextureLoader().load(colorMapUrl.href);
const normalMapUrl = new URL('../materials/sand/Ground054_2K_NormalGL.jpg', import.meta.url);
const normalTexture = new THREE.TextureLoader().load(normalMapUrl.href);
const roughnessMapUrl = new URL('../materials/sand/Ground054_2K_Roughness.jpg', import.meta.url);
const roughnessTexture = new THREE.TextureLoader().load(roughnessMapUrl.href);
const aoMapUrl = new URL('../materials/sand/Ground054_2K_AmbientOcclusion.jpg', import.meta.url);
const aoTexture = new THREE.TextureLoader().load(aoMapUrl.href);
const bumpMapUrl = new URL('../materials/sand/Ground054_2K_Displacement.jpg', import.meta.url);
const bumpTexture = new THREE.TextureLoader().load(bumpMapUrl.href);

window.addEventListener('click', () => {
    pointerLockControls.lock();
});
const controls = new Controls();
controls.keyboardAxis2('move', 'KeyW', 'KeyS', 'KeyA', 'KeyD');
controls.keyboardAxis('upDown', 'ShiftLeft', 'Space');
controls.keyboardKey('unlock', 'Escape');

// Stats
const stats = new Stats();
document.body.appendChild(stats.dom);

const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: colorTexture,
    // normalMap: normalTexture,
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
const prototypeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: prototypeColorTexture,
});
const customGeometry = createCube({});
const customMesh = new THREE.Mesh(customGeometry, prototypeMaterial);
customMesh.position.set(0, 0, -2);
customMesh.castShadow = true;
customMesh.receiveShadow = true;
scene.add(customMesh);

// Create a chunk of cubes
const chunkGeometry = createChunk(3, 3, 3, {});
const chunkMesh = new THREE.Mesh(chunkGeometry, prototypeMaterial);
chunkMesh.position.set(0, 0, 2);
chunkMesh.castShadow = true;
chunkMesh.receiveShadow = true;
scene.add(chunkMesh);

let lastTime = performance.now();
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
    pointLight.position.set(camera.position.x, camera.position.y, camera.position.z);
    renderer.render(scene, camera);
}

animate();