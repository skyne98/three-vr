import '../vite-env.d.ts';

import * as THREE from 'three';
import vertex from './block.vert';
import fragment from './block.frag';

export function blockMaterial(
    resolution: THREE.Vec2,
    texture: THREE.Texture,
    projectionMatrix: THREE.Matrix4,
    modelViewMatrix: THREE.Matrix4
): THREE.ShaderMaterial {
    let vertexShader = vertex.replace('#version 300 es', '');
    let fragmentShader = fragment.replace('#version 300 es', '');

    return new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uTextureSize: {
                value: new THREE.Vector2(1024, 1024)
            },
            uTexture: {
                value: texture
            },
            uResolution: {
                value: resolution
            },
            projectionMatrix: {
                value: projectionMatrix
            },
            modelViewMatrix: {
                value: modelViewMatrix
            }
        },
        depthTest: true,
        depthWrite: true,
        glslVersion: THREE.GLSL3
    });
}