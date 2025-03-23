import { BASE_MOVE_SPEED } from "../constants";
import { StatePlay } from "../states/state-play";
import { AEntity } from "../types/entity";
import { SpriteSheet } from "../utils/spritesheet";

export class Ground extends AEntity {
    constructor(private state: StatePlay) {
        super();
        this.velocity.x =  BASE_MOVE_SPEED;
    }

    public update(deltaTime: number): void {
        this.position.x += this.velocity.x * this.state.speed * deltaTime;
        if(this.position.x >= SpriteSheet.ground.width) this.position.x -= SpriteSheet.ground.width;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        // First part of the ground
        const visibleWidth = Math.min(SpriteSheet.ground.width - this.position.x, this.state.width);
        
        ctx.drawImage(
            SpriteSheet.source,
            SpriteSheet.ground.x + this.position.x,
            SpriteSheet.ground.y,
            visibleWidth,
            SpriteSheet.ground.height,
            0, 
            this.state.height - SpriteSheet.ground.height,
            visibleWidth, 
            SpriteSheet.ground.height
        );
        
        // Second part of the ground (looping)
        if(visibleWidth < this.state.width) {
            const remainingWidth = this.state.width - visibleWidth;
            
            ctx.drawImage(
                SpriteSheet.source,
                SpriteSheet.ground.x,
                SpriteSheet.ground.y,
                remainingWidth,
                SpriteSheet.ground.height,
                visibleWidth,
                this.state.height - SpriteSheet.ground.height,
                remainingWidth,
                SpriteSheet.ground.height
            );
        }
    }
}