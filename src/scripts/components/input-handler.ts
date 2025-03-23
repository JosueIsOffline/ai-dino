import { Main } from "../main";
import { Log } from "../utils/log";
import { Vector } from "../models/vector";  
import { Dictionary } from "../types/dictionary";
import { Optional } from "../types/optional";
import { InputState } from "../types/input-state";
import { Key } from "../types/key";
import { MouseButton } from "../types/mouse-button";
import { LONG_PRESS } from "../constants";


export abstract class InputHandler {
    private static invalidated = false;
    private static readonly VERBOSE_KEYBOARD = DEBUG && false as const
    private static readonly VERBOSE_MOUSE = DEBUG && false as const

    public static get isDirty() {
        return this.invalidated;
    }

    // #region Keyboard
    private static keys: Dictionary<InputState> = {}

    // #region API
    public static isKeyDown(...keys: Key[]): boolean {
        return keys.some(key => this.keys[key]?.active)
    }

    public static isKeyUp(...keys: Key[]): boolean {
        return keys.some(key => !this.keys[key]?.active)
    }

    public static isKeyJustPressed(...keys: Key[]): boolean {
        return keys.some(key => this.keys[key]?.justPressed)
    }

    public static isKeyJustReleased(...keys: Key[]): boolean {
        return keys.some(key => this.keys[key]?.justReleased)
    }

    public static isKeyPressed(...keys: Key[]): boolean {
        return keys.some(key => this.keys[key]?.press)
    }
    // #endregion

    // #region Event handlers
    private static onKeyDown(event: KeyboardEvent) {
        if(event.repeat) return;
        if(!Object.values(Key).includes(event.key as Key)) return;

        if(this.VERBOSE_KEYBOARD) Log.debug("Input", `Key down: ${event.key}`)
        
        this.keys[event.key as Key] = {
            active: true,
            lastChange: Date.now(),
            lastTrigger: Date.now(),

            justPressed: true,
            justReleased: false,
            press: false
        }  

        this.invalidated = true
    }

    private static onKeyUp(event: KeyboardEvent) {
        if(event.repeat) return;
        if(!Object.values(Key).includes(event.key as Key)) return;

        if(this.VERBOSE_KEYBOARD) Log.debug("Input", `Key up: ${event.key}`)

        const obj = this.keys[event.key as Key]
        if(!obj) return;
        obj.active = false
        obj.lastChange = Date.now()
        obj.justReleased = true
        obj.justPressed = false
        //const elapsed = obj.lastChange - obj.lastTrigger
        obj.press = true

        this.invalidated = true
    }

    private static updateKeyboard() {
        for(const key in this.keys) {
            if(!this.keys.hasOwnProperty(key)) continue;

            const obj = this.keys[key]
            obj.justReleased = false
            obj.justPressed = false
            obj.press = false
        }
    }
    // #endregion
    // #endregion

    public static readonly mouse = Vector.zero;
    public static readonly mouseDelta = Vector.zero;
    private static mouseButtons: Dictionary<InputState> = {}

    // #region API
    public static isMouseButtonDown(...buttons: MouseButton[]): boolean {
        return buttons.some(button => this.mouseButtons[button]?.active)
    }

    public static isMouseButtonUp(...buttons: MouseButton[]): boolean {
        return buttons.some(button => !this.mouseButtons[button] || !this.keys[button]?.active)
    }

    public static isMouseButtonJustPressed(...buttons: MouseButton[]): boolean {
        return buttons.some(button => this.mouseButtons[button]?.justPressed)
    }

    public static isMouseButtonJustReleased(...buttons: MouseButton[]): boolean {
        return buttons.some(button => this.mouseButtons[button]?.justReleased)
    }

    public static isMouseButtonPressed(...buttons: MouseButton[]): boolean {
        return buttons.some(button => this.mouseButtons[button]?.press)
    }
    // #endregion

    // #region Event handlers
    private static onMouseMove(event: MouseEvent) {
        if(this.VERBOSE_MOUSE) Log.debug("Input", `Mouse move: ${event.clientX}, ${event.clientY}`)

        this.mouseDelta.x = event.movementX
        this.mouseDelta.y = event.movementY

        this.mouse.x = event.clientX - ((event.target as HTMLElement).offsetLeft ?? 0)
        this.mouse.y = event.clientY - ((event.target as HTMLElement).offsetTop ?? 0)
    }

    private static onMouseDown(event: MouseEvent) {
        if(!Object.values(MouseButton).includes(event.button as MouseButton)) return;

        if(this.VERBOSE_MOUSE) Log.debug("Input", `Mouse down: ${event.button}`)

        this.mouseButtons[event.button as MouseButton] = {
            active: true,
            lastChange: Date.now(),
            lastTrigger: Date.now(),

            justPressed: true,
            justReleased: false,
            press: false
        }

        this.invalidated = true
    }

    private static onMouseUp(event: MouseEvent) {
        if(!Object.values(MouseButton).includes(event.button as MouseButton)) return;

        if(this.VERBOSE_MOUSE) Log.debug("Input", `Mouse up: ${event.button}`)

        const obj = this.mouseButtons[event.button]
        if(!obj) return;
        obj.active = false
        obj.lastChange = Date.now()
        obj.justReleased = true
        obj.justPressed = false
        //const elapsed = obj.lastChange - obj.lastTrigger
        obj.press = true
        
        this.invalidated = true
    }

    private static onPointerDown(element: HTMLElement, event: PointerEvent){
        if(!Object.values(MouseButton).includes(event.button as MouseButton)) return;
        element.setPointerCapture(event.pointerId)

        this.onMouseDown(event)
    }

    private static onPointerUp(element: HTMLElement, event: PointerEvent){
        if(!Object.values(MouseButton).includes(event.button as MouseButton)) return;
        element.releasePointerCapture(event.pointerId)

        this.onMouseUp(event)
    }

    private static updateMouse() {
        for(const button in this.mouseButtons) {
            if(!this.mouseButtons.hasOwnProperty(button)) continue;

            const obj = this.mouseButtons[button]
            obj.justReleased = false
            obj.justPressed = false
            obj.press = false
        }

        this.mouseDelta.x = 0
        this.mouseDelta.y = 0
    }
    // #endregion
    // #endregion

    // #region Input mapping
    public static isJumping(){
        return this.isKeyPressed(Key.Space, Key.ArrowUp)
        || this.isMouseButtonDown(MouseButton.Left)
    }

    public static isCrounching() {
        return this.isKeyDown(Key.ArrowDown)
        || this.isMouseButtonDown(MouseButton.Right)
    }

    // make toggling AI

    // #endregion

    public static setup(main: Main) {
        // Keyboard
        window.addEventListener("keydown", this.onKeyDown.bind(this))
        window.addEventListener("keyup", this.onKeyUp.bind(this))

        // Mouse
        this.mouse.x = window.innerWidth / 2
        this.mouse.y = window.innerHeight / 2
        main.canvas.element.addEventListener("click", this.onMouseMove.bind(this))
        main.canvas.element.addEventListener("mousemove", this.onMouseMove.bind(this))
        main.canvas.element.addEventListener("mousedown", this.onMouseDown.bind(this))
        main.canvas.element.addEventListener("mouseup", this.onMouseUp.bind(this))

        // Pointer
        main.canvas.element.addEventListener("pointermove", this.onMouseMove.bind(this))
        main.canvas.element.addEventListener("pointerdown", this.onPointerDown.bind(this, main.canvas.element))
        main.canvas.element.addEventListener("pointerup", this.onPointerUp.bind(this, main.canvas.element))

    }

    public static update() {
        // setup audio on invalidate
        this.invalidated = false
        this.updateKeyboard()
        this.updateMouse()
    }
}