precision mediump float;

varying vec2 vUv;
varying vec3 vColor;

uniform sampler2D uTexture;
uniform vec2 uTextureSize;
uniform vec2 uResolution;

void main(){
    vec4 texColor=texture2D(uTexture,vUv);
    gl_FragColor=vec4(texColor.rgb*vColor,texColor.a);
}