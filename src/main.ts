import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

import { Controls } from './controls';

// Test out the rapier3d library
import('@dimforge/rapier3d').then((rapier) => {
    console.log(rapier);
});

const white = new THREE.Color(0xffffff);
const renderer = new THREE.WebGLRenderer({
    precision: "lowp"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const controls = new Controls();

// Stats
const stats = new Stats();
document.body.appendChild(stats.dom);

let lastTime = performance.now();
// Add a wireframe control
controls.keyboardKey('toggleWireframe', 'KeyF');

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Wireframe
let wireframe = false;

function loop() {
    const time = performance.now();
    const delta = (time - lastTime) / 1000;
    lastTime = time;
    stats.update();
    composer.render();

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