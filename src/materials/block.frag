#version 300 es

precision highp float;

in highp float vVertexId;
flat in uint vQuadId;
in vec3 vPosition;
in vec2 vUv;

uniform sampler2D uTexture;
uniform uint uLightingDataSize;
uniform mediump usampler2D uLightingData;// rgba, unsigned byte, { vec3 vPos0 ... vec3 vPos3, vec3 vColor0 ... vec3 vColor3 }
uniform vec2 uTextureSize;
uniform vec2 uResolution;

out highp vec4 fragColor;

// Functions to get data from the data texture
uint getSamplerData(uint pixelIndex,mediump usampler2D data,uint dataSize){
    uint x=pixelIndex%dataSize;
    uint y=pixelIndex/dataSize;
    return texelFetch(data,ivec2(x,y),0).r;
}

// Functions specific to lighting data
uvec3 getVertexPos(uint quadId,uint vertexId){
    const uint perQuadDataSize=8u*3u;
    uint quadStructIndex=quadId*perQuadDataSize;
    uint vertexStructIndex=quadStructIndex+vertexId*3u*2u;
    return uvec3(
        getSamplerData(vertexStructIndex+0u,uLightingData,uLightingDataSize),
        getSamplerData(vertexStructIndex+1u,uLightingData,uLightingDataSize),
        getSamplerData(vertexStructIndex+2u,uLightingData,uLightingDataSize)
    );
}
vec3 getVertexColor(uint quadId,uint vertexId){
    const uint perQuadDataSize=8u*3u;
    uint quadStructIndex=quadId*perQuadDataSize;
    uint colorStructIndex=quadStructIndex+3u+vertexId*3u*2u;
    return vec3(
        float(getSamplerData(colorStructIndex+0u,uLightingData,uLightingDataSize))/255.,
        float(getSamplerData(colorStructIndex+1u,uLightingData,uLightingDataSize))/255.,
        float(getSamplerData(colorStructIndex+2u,uLightingData,uLightingDataSize))/255.
    );
}

void main(){
    vec4 texColor=texture(uTexture,vUv);
    // fragColor=vec4(texColor.rgb,1);
    
    // vec3 color=vec3(0);
    // for(uint i=0u;i<4u;i++){
        //     vec3 p=vPosition-vec3(getVertexPos(vQuadId,i));
        //     for(uint j=0u;j<4u;j++){
            //         vec3 edge=vec3(getVertexPos(vQuadId,i))-vec3(getVertexPos(vQuadId,j));
            //         float edge_length=length(edge);
            //         edge=normalize(edge);
            //         float tau=dot(vec3(edge_length),p)/edge_length;
            
            //         color+=mix(vec3(getVertexColor(vQuadId,i)),vec3(getVertexColor(vQuadId,i)),tau);
        //     }
    // }
    // color*=.25;
    // fragColor=vec4(texColor.rgb*color,texColor.a);
    
    // Alternative
    vec3 position=vec3(vPosition);
    fragColor=vec4(position/64.,1);
    return;
    float distanceTo0=length(position-vec3(getVertexPos(vQuadId,0u)));
    float distanceTo1=length(position-vec3(getVertexPos(vQuadId,1u)));
    float distanceTo2=length(position-vec3(getVertexPos(vQuadId,2u)));
    float distanceTo3=length(position-vec3(getVertexPos(vQuadId,3u)));
    float minDistance=min(min(distanceTo0,distanceTo1),min(distanceTo2,distanceTo3));
    
    vec3 color0=getVertexColor(vQuadId,0u)*(1.-minDistance/distanceTo0);
    vec3 color1=getVertexColor(vQuadId,1u)*(1.-minDistance/distanceTo1);
    vec3 color2=getVertexColor(vQuadId,2u)*(1.-minDistance/distanceTo2);
    vec3 color3=getVertexColor(vQuadId,3u)*(1.-minDistance/distanceTo3);
    
    vec3 color=color0+color1+color2+color3;
    color*=.25;
    fragColor=vec4(texColor.rgb*color,texColor.a);
    
    // Alternative, where one color is chosen from the closest vertex out of all 4
    // float distanceTo0=length(vPosition-vec3(getVertexPos(vQuadId,0u)));
    // float distanceTo1=length(vPosition-vec3(getVertexPos(vQuadId,1u)));
    // float distanceTo2=length(vPosition-vec3(getVertexPos(vQuadId,2u)));
    // float distanceTo3=length(vPosition-vec3(getVertexPos(vQuadId,3u)));
    // float minDistance=min(min(distanceTo0,distanceTo1),min(distanceTo2,distanceTo3));
    // vec3 color;
    // if(minDistance==distanceTo0){
        //     color=getVertexColor(vQuadId,0u);
    // }else if(minDistance==distanceTo1){
        //     color=getVertexColor(vQuadId,1u);
    // }else if(minDistance==distanceTo2){
        //     color=getVertexColor(vQuadId,2u);
    // }else{
        //     color=getVertexColor(vQuadId,3u);
    // }
    // fragColor=vec4(texColor.rgb*color,texColor.a);
    
    // DEBUGGING
    // fragColor=vec4(float(getSamplerData(345u,uLightingData,uLightingDataSize)),0,0,1);
    
    // Color (0-1) by distance to the closest vertex
    // float distanceTo0=length(vPosition-vec3(getVertexPos(vQuadId,0u)));
    // float distanceTo1=length(vPosition-vec3(getVertexPos(vQuadId,1u)));
    // float distanceTo2=length(vPosition-vec3(getVertexPos(vQuadId,2u)));
    // float distanceTo3=length(vPosition-vec3(getVertexPos(vQuadId,3u)));
    // float minDistance=min(min(distanceTo0,distanceTo1),min(distanceTo2,distanceTo3));
    // fragColor=vec4(vec3(minDistance),1);
    
    // uint quadId=vQuadId;
    // fragColor=vec4(getQuadColor0(quadId),1);
    
    // Color based on vQuadId as 0-1 (based on 16*16*16*6)
    // uint quadId=vQuadId;
    // vec3 quadIdf=vec3(quadId);
    // vec3 quadIdfNormalized=quadIdf/vec3(16*16*16*6);
    // fragColor=vec4(quadIdfNormalized,1);
    
    // Color based on vPosition - vVertexPos0 as 0-1
    // uvec3 vertexPos0=getVertexPos(vQuadId,0u);
    // vec3 vertexPos0f=vec3(vertexPos0);
    // vec3 diff=vPosition-vertexPos0f;
    // fragColor=vec4(vec3(diff.x),1);
    
    // Color based on distance of vVertexPos0 from vec3(0) as 0-1 (based on 16-block size)
    // uvec3 vertexPos0=getVertexPos(vQuadId,0u);
    // vec3 vertexPos0f=vec3(vertexPos0);
    // fragColor=vec4(vertexPos0f/16.,1);
    
    // Color based on distance of vVertexPos0 from vec3(0) as 0-1 (based on 16-block size), but only x component
    // uvec3 vertexPos0=getVertexPos(vQuadId,0u);
    // vec3 vertexPos0f=vec3(vertexPos0);
    // fragColor=vec4(vec3(vertexPos0f.x/16.),1);
    
    // Color red if vVertexPos0.x is exactly 0
    // uvec3 vertexPos0=getVertexPos(vQuadId,0u);
    // vec3 vertexPos0f=vec3(vertexPos0);
    // if(vertexPos0f.x==0.){
        //     fragColor=vec4(1,0,0,1);
    // }else{
        //     if(vertexPos0f.x==1.){
            //         fragColor=vec4(0,1,0,1);
        //     }else{
            //         fragColor=vec4(0,0,1,1);
        //     }
    // }
    
    // Now based on average of all 4 vertex positions
    // uint quadId=vQuadId;
    // vec3 vertexPos0f=vec3(getVertexPos(quadId,0u));
    // vec3 vertexPos1f=vec3(getVertexPos(quadId,1u));
    // vec3 vertexPos2f=vec3(getVertexPos(quadId,2u));
    // vec3 vertexPos3f=vec3(getVertexPos(quadId,3u));
    // vec3 avgPos=(vertexPos0f+vertexPos1f+vertexPos2f+vertexPos3f)/4.;
    // fragColor=vec4(avgPos/16.,1);
    
    // // Now based on the vertex id (range from 0-16*16*16*6*4)
    // float vertexId=vVertexId;
    // vec3 vertexIdf=vec3(vertexId);
    // vec3 vertexIdfNormalized=vertexIdf/vec3(16*16*16*6*4);
    // fragColor=vec4(vertexIdfNormalized,1);
    
    // Now based on the verted id, but with a much smaller, block-level granularity
    // float vertexId=vVertexId;
    // float vertexIdNormalized=vertexId/float(3);
    // fragColor=vec4(vec3(vertexIdNormalized),1);
    
    // // Now based on vPosition
    // vec3 vPositionNormalized=vPosition/vec3(16);
    // fragColor=vec4(vPositionNormalized,1);
}