import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

export function buildRaymarchingPass() {
    const material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms: {
            tDiffuse: { value: null },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uCameraFar: { value: 1000.0 },
            uCameraFov: { value: THREE.MathUtils.degToRad(100) },
            uCameraNear: { value: 0.1 },
            uCameraDirection: { value: new THREE.Vector3() },
            uCameraPositon: { value: new THREE.Vector3() },
            uMatrixWorld: { value: new THREE.Matrix4() },
            uProjectionMatrixInverse: { value: new THREE.Matrix4() },
            uModelView: { value: new THREE.Matrix4() },
        },
        vertexShader: `#version 300 es

            precision highp float;

            out vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `.replace('#version 300 es', ''),
        fragmentShader: `
            precision highp float;

            in vec2 vUv;

            uniform sampler2D tDiffuse;
            uniform vec2 uResolution;
            uniform vec3 uCameraPositon;
            uniform vec3 uCameraDirection;
            uniform float uCameraFov;
            uniform float uCameraNear;
            uniform float uCameraFar;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrixInverse;
            uniform mat4 uMatrixWorld;
            uniform mat4 uModelView;

            out vec4 fragColor;

            const float EPS = 0.001;

            float dot2( in vec2 v ) { return dot(v,v); }
            float dot2( in vec3 v ) { return dot(v,v); }
            float ndot( in vec2 a, in vec2 b ) { return a.x*b.x - a.y*b.y; }
            float maxcomp(vec3 v) {
                return max(max (v.x, v.y), v.z);
            }

            // Transforms
            vec3 transformPosition( in vec3 p, in vec3 t, in vec3 r, in vec3 s ) {
                return s * (p * mat3(
                    cos(r.y) * cos(r.z), cos(r.z) * sin(r.x) * sin(r.y) - cos(r.x) * sin(r.z), sin(r.x) * sin(r.z) + cos(r.x) * cos(r.z) * sin(r.y),
                    cos(r.y) * sin(r.z), cos(r.x) * cos(r.z) + sin(r.x) * sin(r.y) * sin(r.z), cos(r.x) * sin(r.y) * sin(r.z) - cos(r.z) * sin(r.x),
                    -sin(r.y), cos(r.y) * sin(r.x), cos(r.x) * cos(r.y)
                ) + t);
            }

            // Distance Functions
            // https://iquilezles.org/articles/distfunctions
            float boxDistance( in vec3 p, in vec3 rad ) 
            {
                vec3 d = abs(p)-rad;
                return length(max(d,0.0)) + min(maxcomp(d),0.0);
            }
            float boxDistanceZeroOrigin( in vec3 p, in vec3 rad )
            {
                vec3 point = transformPosition(p, -rad, vec3(0.0, 0.0, 0.0), vec3(1.0));
                return boxDistance(point, rad);
            }
            float sceneDist( vec3 p ) {
                return boxDistanceZeroOrigin(p, vec3(8.0));
            }

            // Utilities
            vec3 getNormal( vec3 p ) {
				return normalize(vec3(
					sceneDist(p + vec3( EPS, 0.0, 0.0 ) ) - sceneDist(p + vec3( -EPS, 0.0, 0.0 ) ),
					sceneDist(p + vec3( 0.0, EPS, 0.0 ) ) - sceneDist(p + vec3( 0.0, -EPS, 0.0 ) ),
					sceneDist(p + vec3( 0.0, 0.0, EPS ) ) - sceneDist(p + vec3( 0.0, 0.0, -EPS ) )
				));
			}

            void main() {
                vec3 cameraPos = uCameraPositon;

                vec3 uvScreenSpace = vec3(vUv * 2.0 - 1.0, 1.0);
                vec3 uvCameraSpace = (uProjectionMatrixInverse * vec4(uvScreenSpace, 1.0)).xyz;
                vec3 uvWorldSpace = (uMatrixWorld * vec4(uvCameraSpace, 1.0)).xyz;
                vec3 ray = normalize(uvWorldSpace - cameraPos);

                // fragColor = vec4(ray, 1.0);
                // return;

                // raymarch
                float t = 0.0;
                for (int i = 0; i < 256; i++) {
                    vec3 p = cameraPos + ray * t;
                    float d = sceneDist(p);
                    if (d < 0.001) {
                        // calculate normal
                        vec3 normal = getNormal(p);
                        fragColor = vec4(normal * 0.5 + 0.5, 1.0);
                        return;
                    }
                    if (t > 50.0) {
                        break;
                    }
                    t += d;
                }
                // fragColor = vec4(0.0, 0.0, 0.0, 1.0);
                fragColor = texture(tDiffuse, vUv);
            }
        `
    });
    return new ShaderPass(material);
}

export function raymarchingPassUpdateUniforms(pass: ShaderPass, camera: THREE.Camera) {
    const material = pass.material as THREE.ShaderMaterial;
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    material.uniforms.uCameraPositon.value.copy(perspectiveCamera.position);
    material.uniforms.uCameraDirection.value.copy(perspectiveCamera.getWorldDirection(new THREE.Vector3()));
    material.uniforms.uCameraFov.value = THREE.MathUtils.degToRad(perspectiveCamera.fov);
    material.uniforms.uCameraNear.value = perspectiveCamera.near;
    material.uniforms.uCameraFar.value = perspectiveCamera.far;
    material.uniforms.uMatrixWorld.value.copy(perspectiveCamera.matrixWorld);
    material.uniforms.uProjectionMatrixInverse.value.copy(perspectiveCamera.projectionMatrixInverse);
    material.uniforms.uModelView.value.copy(perspectiveCamera.matrixWorldInverse);
}