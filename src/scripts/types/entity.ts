import { Vector } from "../models/vector";  

export abstract class AEntity {

    public position: Vector =  Vector.zero;
    public velocity: Vector =  Vector.zero;
    public acceleration: Vector =  Vector.zero;

    public update(deltaTime: number): void {
        // Ignore
    }


    public render(ctx: CanvasRenderingContext2D): void {
        // Ignore
    }
}