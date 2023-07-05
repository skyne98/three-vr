import * as THREE from 'three';

/** Represents a single action that can be performed by the user.
Button press will range from 0 to 1.
Axis movement will range from -1 to 1.
*/
export class KeybindState {
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

export class Keybinds {
    private _keybinds: Set<string> = new Set<string>();
    private _states: Map<string, KeybindState> = new Map<string, KeybindState>();

    public maintenance(delta: number): void {
        for (const state of this._states.values()) {
            state.processDirty();
        }
    }
    public get(key: string): KeybindState {
        if (!this._keybinds.has(key)) {
            throw new Error(`Control ${key} does not exist`);
        }

        return this._states.get(key)!;
    }
    public keyboardKey(control: string, key: string): void {
        if (this._keybinds.has(control)) {
            throw new Error(`Control ${key} is already bound to a key (or axis)`);
        }
        this._keybinds.add(control);
        this._states.set(control, new KeybindState());

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
}