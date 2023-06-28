import * as THREE from "three";
import { randomUuid } from "../crypto";

// Generations
export interface CubeGeometryOptions {
    width?: number;
    height?: number;
    depth?: number;
    frontUV?: THREE.Vector2;
    backUV?: THREE.Vector2;
    leftUV?: THREE.Vector2;
    rightUV?: THREE.Vector2;
    topUV?: THREE.Vector2;
    bottomUV?: THREE.Vector2;
    uvScale?: number;

    renderFront?: boolean;
    renderBack?: boolean;
    renderLeft?: boolean;
    renderRight?: boolean;
    renderTop?: boolean;
    renderBottom?: boolean;
}

// Requests
export interface GenerateMeshRequest {
    id?: string;
    type?: 'chunk';
}
export interface GenerateChunkRequest extends GenerateMeshRequest {
    width: number;
    height: number;
    depth: number;
    buffer: Uint8Array;
    options: CubeGeometryOptions;
}

// Response
export interface GenerateMeshResponse {
    position: Float32Array;
    uv: Float32Array;
    normal: Float32Array;
    index: Uint16Array;
}

// Promise
interface PendingGeneration {
    resolve: (geometry: THREE.BufferGeometry) => void;
    reject: (error: Error) => void;
    promise: Promise<THREE.BufferGeometry>;
}

export class MeshWorker {
    private worker: Worker;
    private promiseMap: Map<string, PendingGeneration> = new Map();

    constructor() {
        this.worker = new Worker(new URL('./mesh.ts', import.meta.url), { type: 'module' });
        this.worker.onmessage = (event) => {
            const { id, data } = event.data;
            const pending = this.promiseMap.get(id);
            if (pending == null) {
                throw new Error(`Received response for unknown id: ${id}`);
            }
            this.promiseMap.delete(id);
            if (data.error != null) {
                pending.reject(data.error);
            } else {
                const { position, uv, normal, index } = data as GenerateMeshResponse;
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
                geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
                geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
                geometry.setIndex(new THREE.BufferAttribute(index, 1));
                pending.resolve(geometry);
            }
        };
    }

    public generateChunk(request: GenerateChunkRequest): Promise<THREE.BufferGeometry> {
        if (request.id == null) {
            request.id = randomUuid();
        }
        let promiseResolve: ((geometry: THREE.BufferGeometry) => void) | null = null;
        let promiseReject: ((error: Error) => void) | null = null;
        const promise = new Promise<THREE.BufferGeometry>((resolve, reject) => {
            promiseResolve = resolve;
            promiseReject = reject;
        });
        this.promiseMap.set(request.id, { resolve: promiseResolve!, reject: promiseReject!, promise });
        request.type = 'chunk';
        this.worker.postMessage(request, [request.buffer.buffer]);
        return promise;
    }
}

// Singleton
export const meshWorker = new MeshWorker();