import { CursorType } from "../types/cursor-type"

export abstract class Cursor {

    private static current: CursorType = CursorType.Default;
    private static isDirty = false;

    public static set(value: CursorType){
        if(this.current !== value) {
            this.current = value;
            this.isDirty = true;
        }
    }

    public static apply(element: HTMLElement = document.body) {
        if(this.isDirty) {
            element.style.cursor = this.current;
            this.isDirty = false;
        }
    }

    public static reset() {
        this.current = CursorType.Default;
        this.isDirty
    }
}