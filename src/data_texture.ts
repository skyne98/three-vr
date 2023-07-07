import * as THREE from 'three';

export class TextureBuffer {
    data: Uint32Array;
    width: number;
    height: number;
    texture: THREE.DataTexture;

    static maximumSize = 8192;
    static maximumLength = TextureBuffer.maximumSize * TextureBuffer.maximumSize * 4;
    static getOptimalSizeForLength(length: number): number {
        return Math.ceil(Math.sqrt(length));
    }

    constructor(length: number) {
        if (length > TextureBuffer.maximumLength) {
            throw new Error(`DataTexture: length cannot be greater than ${TextureBuffer.maximumLength}`);
        }

        const size = TextureBuffer.getOptimalSizeForLength(length);
        this.data = new Uint32Array(size * size);
        this.width = size;
        this.height = size;
        this.texture = new THREE.DataTexture(this.data, size, size, THREE.RedIntegerFormat, THREE.UnsignedIntType);
        this.texture.internalFormat = 'R32UI';
    }

    // Setting the data
    setIntValue(index: number, value: number): void {
        this.data[index] = value;
    }
    getIntValue(index: number): number {
        return this.data[index];
    }
    setVec3Value(index: number, value: THREE.Vector3): void {
        this.data[index] = value.x;
        if (this.data[index] !== value.x) {
            debugger;
        }
        this.data[index + 1] = value.y;
        this.data[index + 2] = value.z;
    }
    getVec3Value(index: number): THREE.Vector3 {
        return new THREE.Vector3(
            this.data[index],
            this.data[index + 1],
            this.data[index + 2]
        );
    }
    setColorValue(index: number, value: THREE.Color): void {
        this.data[index] = value.r * 255;
        this.data[index + 1] = value.g * 255;
        this.data[index + 2] = value.b * 255;
    }
    getColorValue(index: number): THREE.Color {
        return new THREE.Color(
            this.data[index] / 255,
            this.data[index + 1] / 255,
            this.data[index + 2] / 255
        );
    }
    copyFrom(buffer: DataView): void {
        if (buffer.byteLength !== this.data.byteLength) {
            throw new Error('DataTexture: buffers must be the same size');
        }

        this.data.set(new Uint8Array(buffer.buffer));
    }

    // Making sure the data gets to the GPU
    updateTexture(): void {
        this.texture.needsUpdate = true;
    }
}