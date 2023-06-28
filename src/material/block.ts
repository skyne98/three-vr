import * as THREE from 'three';
import vertex from './block.vert';
import fragment from './block.frag';

export function blockMaterial(resolution: THREE.Vec2, texture: THREE.Texture): THREE.ShaderMaterial {
    console.log(vertex);
    console.log(fragment);

    return new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
            uTextureSize: {
                value: new THREE.Vector2(1024, 1024)
            },
            uTexture: {
                value: texture
            },
            uResolution: {
                value: resolution
            }
        }
    });
}