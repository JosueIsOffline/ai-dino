export abstract class AState {
    setup(): Promise<void> {
        return Promise.resolve();
    }
}