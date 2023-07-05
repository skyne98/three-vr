#version 300 es

in vec3 position;
in vec2 uv;
in vec3 color;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

out vec2 vUv;
out vec3 vColor;

void main(){
    vUv=uv;
    vColor=color;
    int index=gl_VertexID;
    float indexIsEven=mod(float(index),2.);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}