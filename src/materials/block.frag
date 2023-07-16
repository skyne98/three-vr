#version 300 es

precision highp float;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vUv;

uniform sampler2D uTexture;
uniform vec2 uTextureSize;
uniform vec2 uResolution;

out highp vec4 fragColor;

void main(){
    vec4 texColor=texture(uTexture,vUv);
    fragColor=texColor;
    return;
    
    vec3 position=vec3(vPosition);
    fragColor=vec4(position/2.,1);
}