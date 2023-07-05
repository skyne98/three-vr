import * as THREE from 'three';

/** Represents a single action that can be performed by the user.
Button press will range from 0 to 1.
Axis movement will range from -1 to 1.
*/
export class ControlState {
    private _value: THREE.Vector2 = new THREE.Vector2();
    private _lastValue: THREE.Vector2 = new THREE.Vector2();
    private _dirty: boolean = false;

    constructor() {
        /* ... */
    }
    public get value(): THREE.Vector2 {
        return this._value;
    }
    public get valueX(): number {
        return this._value.x;
    }
    public get valueY(): number {
        return this._value.y;
    }

    public get lastValue(): THREE.Vector2 {
        return this._lastValue;
    }
    public get lastValueX(): number {
        return this._lastValue.x;
    }
    public get lastValueY(): number {
        return this._lastValue.y;
    }

    public update(value: THREE.Vector2): void {
        this._lastValue.copy(this._value);
        this._value.copy(value);

        if (this.isJustPressed || this.isJustReleased) {
            this._dirty = true;
        }
    }
    public processDirty(): void {
        this._dirty = false;
        if (this.isJustPressed) {
            this._lastValue.copy(this._value);
        }
        if (this.isJustReleased) {
            this._lastValue.set(0, 0);
        }
    }

    // Helper functions
    public get isPressed(): boolean {
        return this._value.x === 1;
    }
    public get isReleased(): boolean {
        return this._value.length() === 0;
    }
    public get isJustPressed(): boolean {
        return this._value.x === 1 && this._lastValue.x === 0;
    }
    public get isJustReleased(): boolean {
        return this._value.x === 0 && this._lastValue.x === 1;
    }
    public get normalizedVector(): THREE.Vector2 {
        return this._value.clone().normalize();
    }
    public get normalizedValue(): number {
        return this.normalizedVector.length();
    }

    // toString()
    public toString(): string {
        return `ControlState(${this._value.x}, ${this._value.y}) = ${this.normalizedValue.toFixed(2)}`;
    }
}

export class Controls {
    private _controls: Set<string> = new Set<string>();
    private _states: Map<string, ControlState> = new Map<string, ControlState>();

    public maintenance(delta: number): void {
        for (const state of this._states.values()) {
            state.processDirty();
        }
    }
    public get(key: string): ControlState {
        if (!this._controls.has(key)) {
            throw new Error(`Control ${key} does not exist`);
        }

        return this._states.get(key)!;
    }
    public keyboardKey(control: string, key: string): void {
        if (this._controls.has(control)) {
            throw new Error(`Control ${key} is already bound to a key (or axis)`);
        }
        this._controls.add(control);
        this._states.set(control, new ControlState());

        window.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === key) {
                this._states.get(control)!.update(new THREE.Vector2(1, 1));
            }
        });
        window.addEventListener('keyup', (event: KeyboardEvent) => {
            if (event.code === key) {
                this._states.get(control)!.update(new THREE.Vector2(0, 0));
            }
        });
    }
    public keyboardAxis(control: string, negativeKey: string, positiveKey: string): void {
        const self = this;
        if (this._controls.has(control)) {
            throw new Error(`Key ${positiveKey} or ${negativeKey} is already bound to a control`);
        }
        this._controls.add(control);
        this._states.set(control, new ControlState());

        let positiveIsDown = false;
        let negativeIsDown = false;
        function setStateValue() {
            if (positiveIsDown && negativeIsDown) {
                self._states.get(control)!.update(new THREE.Vector2(0, 0));
            }
            else if (positiveIsDown) {
                self._states.get(control)!.update(new THREE.Vector2(1, 1));
            }
            else if (negativeIsDown) {
                self._states.get(control)!.update(new THREE.Vector2(-1, -1));
            }
            else {
                self._states.get(control)!.update(new THREE.Vector2(0, 0));
            }
        }

        window.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === positiveKey) {
                positiveIsDown = true;
            }
            if (event.code === negativeKey) {
                negativeIsDown = true;
            }
            setStateValue();
        });
        window.addEventListener('keyup', (event: KeyboardEvent) => {
            if (event.code === positiveKey) {
                positiveIsDown = false;
            }
            if (event.code === negativeKey) {
                negativeIsDown = false;
            }
            setStateValue();
        });
    }
    public keyboardAxis2(control: string, northKey: string, southKey: string, westKey: string, eastKey: string): void {
        const self = this;
        if (this._controls.has(control)) {
            throw new Error(`Key ${northKey}, ${southKey}, ${westKey}, or ${eastKey} is already bound to a control`);
        }
        this._controls.add(control);
        this._states.set(control, new ControlState());

        let northIsDown = false;
        let southIsDown = false;
        let westIsDown = false;
        let eastIsDown = false;
        function setStateValue() {
            let x = 0;
            let y = 0;
            if (northIsDown) {
                y -= 1;
            }
            if (southIsDown) {
                y += 1;
            }
            if (westIsDown) {
                x -= 1;
            }
            if (eastIsDown) {
                x += 1;
            }
            self._states.get(control)!.update(new THREE.Vector2(x, y));
        }

        window.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === northKey) {
                northIsDown = true;
            }
            if (event.code === southKey) {
                southIsDown = true;
            }
            if (event.code === westKey) {
                westIsDown = true;
            }
            if (event.code === eastKey) {
                eastIsDown = true;
            }
            setStateValue();
        });
        window.addEventListener('keyup', (event: KeyboardEvent) => {
            if (event.code === northKey) {
                northIsDown = false;
            }
            if (event.code === southKey) {
                southIsDown = false;
            }
            if (event.code === westKey) {
                westIsDown = false;
            }
            if (event.code === eastKey) {
                eastIsDown = false;
            }
            setStateValue();
        });
    }
}