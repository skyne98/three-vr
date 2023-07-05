#version 300 es

precision mediump float;

in vec2 vUv;
in vec3 vColor;

uniform sampler2D uTexture;
uniform vec2 uTextureSize;
uniform vec2 uResolution;

out vec4 fragColor;

void main(){
    vec4 texColor=texture(uTexture,vUv);
    fragColor=vec4(texColor.rgb*vColor,texColor.a);
}