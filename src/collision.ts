import { Vector3 } from 'three';
export type Rapier = typeof import('@dimforge/rapier3d');

export class Sphere {
    constructor(public center: Vector3, public radius: number) { }

    collidesWithSphere(other: Sphere) {
        const radiusSum = this.radius + other.radius;
        return this.center.distanceTo(other.center) <= radiusSum;
    }

    collidesWithAABB(aabb: AABB) {
        return aabb.collidesWithSphere(this);
    }
}

export class AABB {
    constructor(public min: Vector3, public max: Vector3) { }

    collidesWithSphere(sphere: Sphere) {
        let v1 = new Vector3();

        v1.copy(sphere.center).clamp(this.min, this.max);

        return v1.distanceToSquared(sphere.center) <= (sphere.radius * sphere.radius);
    }

    collidesWithAABB(other: AABB) {
        return (this.min.x <= other.max.x && this.max.x >= other.min.x) &&
            (this.min.y <= other.max.y && this.max.y >= other.min.y) &&
            (this.min.z <= other.max.z && this.max.z >= other.min.z);
    }

    collidesWithRay(vector: Vector3, direction: Vector3) {
        let t1 = (this.min.x - vector.x) * direction.x;
        let t2 = (this.max.x - vector.x) * direction.x;
        let t3 = (this.min.y - vector.y) * direction.y;
        let t4 = (this.max.y - vector.y) * direction.y;
        let t5 = (this.min.z - vector.z) * direction.z;
        let t6 = (this.max.z - vector.z) * direction.z;

        let tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
        let tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

        if (tmax < 0) {
            return false;
        }

        if (tmin > tmax) {
            return false;
        }

        return true;
    }
}