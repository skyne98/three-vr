import * as THREE from 'three';

export function nodeDepthToSize(chunkSize: number, depth: number) {
    return chunkSize / Math.pow(2, depth);
}

export class Octree {
    constructor(
        public readonly chunkSize: number,
        public readonly root: OctreeNode
    ) { }

    public sizeAtDepth(depth: number) {
        return nodeDepthToSize(this.chunkSize, depth);
    }

    /// Insert a voxel into the octree.
    public insert(x: number, y: number, z: number, type: number) {
    }
}

export class OctreeNode {
    constructor(
        public readonly size: number,
        public readonly min: THREE.Vector3,
        public readonly max: THREE.Vector3,
        public childTopLeftFront: OctreeNode | null,
        public childTopLeftBack: OctreeNode | null,
        public childTopRightFront: OctreeNode | null,
        public childTopRightBack: OctreeNode | null,
        public childBottomLeftFront: OctreeNode | null,
        public childBottomLeftBack: OctreeNode | null,
        public childBottomRightFront: OctreeNode | null,
        public childBottomRightBack: OctreeNode | null,
        public type: number
    ) { }

    public get isLeaf() {
        return this.childTopLeftFront === null
            && this.childTopLeftBack === null
            && this.childTopRightFront === null
            && this.childTopRightBack === null
            && this.childBottomLeftFront === null
            && this.childBottomLeftBack === null
            && this.childBottomRightFront === null
            && this.childBottomRightBack === null;
    }

    public divide() {
        if (!this.isLeaf) {
            throw new Error('Cannot divide a node that is not a leaf');
        }

        // front = true north = z+
        // back = true south = z-
        // right = true east = x+
        // left = true west = x-
        // top = true up = y+
        // bottom = true down = y-

        const halfSize = this.size / 2;
        let min = new THREE.Vector3();
        min.x = this.min.x;
        min.y = this.min.y + halfSize;
        min.z = this.min.z + halfSize;
        let max = new THREE.Vector3();
        max.x = this.max.x - halfSize;
        max.y = this.max.y;
        max.z = this.max.z;
        this.childTopLeftFront = new OctreeNode(halfSize, min, max, null, null, null, null, null, null, null, null, this.type);

        min = new THREE.Vector3();
        min.x = this.min.x;
        min.y = this.min.y + halfSize;
        min.z = this.min.z;
        max = new THREE.Vector3();
        max.x = this.max.x - halfSize;
        max.y = this.max.y;
        max.z = this.max.z - halfSize;
        this.childTopLeftBack = new OctreeNode(halfSize, min, max, null, null, null, null, null, null, null, null, this.type);

        min = new THREE.Vector3();
        min.x = this.min.x + halfSize;
        min.y = this.min.y + halfSize;
        min.z = this.min.z + halfSize;
        max = new THREE.Vector3();
        max.x = this.max.x;
        max.y = this.max.y;
        max.z = this.max.z;
        this.childTopRightFront = new OctreeNode(halfSize, min, max, null, null, null, null, null, null, null, null, this.type);

        min = new THREE.Vector3();
        min.x = this.min.x + halfSize;
        min.y = this.min.y + halfSize;
        min.z = this.min.z;
        max = new THREE.Vector3();
        max.x = this.max.x;
        max.y = this.max.y;
        max.z = this.max.z - halfSize;
        this.childTopRightBack = new OctreeNode(halfSize, min, max, null, null, null, null, null, null, null, null, this.type);

        min = new THREE.Vector3();
        min.x = this.min.x;
        min.y = this.min.y;
        min.z = this.min.z + halfSize;
        max = new THREE.Vector3();
        max.x = this.max.x - halfSize;
        max.y = this.max.y - halfSize;
        max.z = this.max.z;
        this.childBottomLeftFront = new OctreeNode(halfSize, min, max, null, null, null, null, null, null, null, null, this.type);

        min = new THREE.Vector3();
        min.x = this.min.x;
        min.y = this.min.y;
        min.z = this.min.z;
        max = new THREE.Vector3();
        max.x = this.max.x - halfSize;
        max.y = this.max.y - halfSize;
        max.z = this.max.z - halfSize;
        this.childBottomLeftBack = new OctreeNode(halfSize, min, max, null, null, null, null, null, null, null, null, this.type);

        min = new THREE.Vector3();
        min.x = this.min.x + halfSize;
        min.y = this.min.y;
        min.z = this.min.z + halfSize;
        max = new THREE.Vector3();
        max.x = this.max.x;
        max.y = this.max.y - halfSize;
        max.z = this.max.z;
        this.childBottomRightFront = new OctreeNode(halfSize, min, max, null, null, null, null, null, null, null, null, this.type);

        min = new THREE.Vector3();
        min.x = this.min.x + halfSize;
        min.y = this.min.y;
        min.z = this.min.z;
        max = new THREE.Vector3();
        max.x = this.max.x;
        max.y = this.max.y - halfSize;
        max.z = this.max.z - halfSize;
        this.childBottomRightBack = new OctreeNode(halfSize, min, max, null, null, null, null, null, null, null, null, this.type);

        this.type = -1;
    }
    public contains(x: number, y: number, z: number) {
        return x >= 0 && x < 1
            && y >= 0 && y < 1
            && z >= 0 && z < 1;
    }
}