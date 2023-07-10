#version 300 es

in uint quadId;
in uvec3 position;
in vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

out float vVertexId;
flat out uint vQuadId;
out vec3 vPosition;
out vec2 vUv;

void main(){
    vQuadId=quadId;
    vPosition=vec3(position);
    vUv=uv;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}