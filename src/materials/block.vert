#version 300 es

precision mediump float;
precision mediump int;
precision mediump usampler2D;

in uint vertexId;
in uint quadId;
in vec3 position;
in vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

out float vVertexId;
flat out uint vQuadId;
out vec3 vPosition;
out vec2 vUv;

void main(){
    vVertexId=float(vertexId);
    vQuadId=quadId;
    vPosition=position;
    vUv=uv;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}