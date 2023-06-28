varying vec2 vUv;
varying vec3 vColor;

void main(){
    vUv=uv;
    int index=gl_VertexID;
    float indexIsEven=mod(float(index),2.);
    vColor=vec3(1.,1.,1);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}