export abstract class AState {
    setup(): Promise<void> {
        return Promise.resolve();
    }

    update(deltaTime: number): void {
        // Ignore
    }

    render(ctx: CanvasRenderingContext2D): void {
        // Ignore
    }
}