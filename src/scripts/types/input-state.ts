export type InputState = {
    // DOM Events
    active: boolean;
    lastChange: number,
    lastTrigger: number,
    

    // Virtual State
    justPressed: boolean;
    justReleased: boolean;
    press: boolean;
}