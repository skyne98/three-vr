#version 300 es

in uvec3 position;
in uvec3 normal;
in vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

out vec3 vPosition;
out vec2 vUv;

void main(){
    vPosition=vec3(position);
    vUv=uv;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}