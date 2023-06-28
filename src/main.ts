import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { Controls } from './controls';
import { World } from './world';

// Test out a Web Worker

const white = new THREE.Color(0xffffff);
const renderer = new THREE.WebGLRenderer({
    precision: "lowp"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Set render resolution of PICO 4
// 4320x2160
// camera.aspect = 4320 / 2160;
// camera.updateProjectionMatrix();
// renderer.setSize(4320, 2160);
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

let lastTime = performance.now();
let leaveLight = false;

// Chunks
const world = new World(pointerLockControls, scene);

function animate() {
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
    world.updateChunks(delta);

    renderer.render(scene, camera);

    requestAnimationFrame(animate);
}

animate();