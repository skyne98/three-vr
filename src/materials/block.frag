#version 300 es

precision lowp float;
precision highp int;

in highp float vVertexId;
flat in uint vQuadId;
in vec3 vPosition;
in vec2 vUv;

uniform sampler2D uTexture;
uniform uint uDataSize;
uniform mediump usampler2D uData;// rgba, unsigned byte, { vec3 vPos0 ... vec3 vPos3, vec3 vColor0 ... vec3 vColor3 }
uniform vec2 uTextureSize;
uniform vec2 uResolution;

out vec4 fragColor;

// Functions to get data from the data texture
uint getSamplerData(uint pixelIndex,mediump usampler2D data,uint dataSize){
    uint x=pixelIndex%dataSize;
    uint y=pixelIndex/dataSize;
    return texelFetch(data,ivec2(x,y),0).r;
}

void main(){
    fragColor=vec4(1.);
}