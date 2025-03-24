import {
	DINO_FALL_FORCE,
	DINO_GRAVITY,
	DINO_INVULNERABILITY_DURATION,
	DINO_JUMP_FORCE,
	DINO_LONG_JUMP_SCALE,
	DINO_REGULAR_JUMP_SCALE,
	DINO_SPRITE_SWITCH_INTERVAL,
	MARGIN,
	MOBILE_SPEED_FACTOR,
} from "../constants";
import { StatePlay } from "../states/state-play";
import { AEntity } from "../types/entity";
import { SpriteSheet } from "../utils/spritesheet";
import { Log } from "../utils/log"; 
import { Rectangle } from "./rectangle";
import { Theme } from "../utils/theme";
import { InputHandler } from "../components/input-handler";
import { Gizmo } from "../utils/gizmo";

export class Dinosaur extends AEntity {

    private spriteTimer = 0;
    protected isCrounching = false;

    constructor(private state: StatePlay) {
        super()

        this.position.x = MARGIN;
        this.position.y = this.state.height - SpriteSheet.ground.height - this.sprite.height + SpriteSheet.groundOffset
    }

    protected get groundHeight() {
        const height = this.isCrounching ? SpriteSheet.dinoCrouch1.height : SpriteSheet.dino0.height;

        return this.state.height - SpriteSheet.ground.height - height + SpriteSheet.groundOffset;
    }

    protected get isGrounded() {
        return this.velocity.y >= 0 && this.position.y >= this.groundHeight;
    }

    public get sprite() {
        // if(this.state instanceof StateGameOver) {
        //     return SpriteSheet.dino4
        // }

        if(this.isGrounded){
            if(this.isCrounching)
                return this.spriteTimer < DINO_SPRITE_SWITCH_INTERVAL ? SpriteSheet.dinoCrouch2 : SpriteSheet.dinoCrouch1;
            else
                return this.spriteTimer < DINO_SPRITE_SWITCH_INTERVAL ? SpriteSheet.dino3 : SpriteSheet.dino2;
        } else {
            return SpriteSheet.dino0;
        }
    }


    public get bounds() {
        const sprite = this.sprite;

        return new Rectangle(this.position.x, this.position.y, sprite.width, sprite.height);
    }


    protected jump(scalar = 1.0) {
        if(this.isGrounded) {
            Log.debug("Dinosaur", "Jumping!");

            this.acceleration.y = DINO_JUMP_FORCE * scalar;

            // TODO: add sound effect
        }
    } 

    // TODO: updateInvulnerability function
    private updateInvulnerability(deltaTime: number) {
        if(this.state.isInvulnerable) {
            this.state.invulnerabilityTime += deltaTime;
            if(this.state.invulnerabilityTime >= DINO_INVULNERABILITY_DURATION) {
                this.state.isInvulnerable = false;
                this.state.invulnerabilityTime = 0;
            }
        }
    }

    // TODO: updateInput function
    protected updateInput() {
        if(InputHandler.isCrounching()) {
            if(this.isGrounded){
                this.isCrounching = true;
                this.position.y = this.groundHeight
            } else {
                this.isCrounching = false;
                this.acceleration.y += DINO_FALL_FORCE;
            }
        } else {
            this.isCrounching = false;

            // Jump
            if(this.isGrounded) {
                if(InputHandler.isJumping()) {
                    Log.debug("Input", "Jumping...")
                    this.jump(DINO_REGULAR_JUMP_SCALE)
                } 
            }
        }
    }

    private applyConstraints() {
        if(this.position.y > this.groundHeight) {
            this.position.y = this.groundHeight;
            this.velocity.y = 0;
        } else if(this.position.y < 0) {
            this.position.y = 0;
            this.velocity.y = 0;
        }
    }

    public update(deltaTime: number): void { 
        this.updateInvulnerability(deltaTime);

        // Update sprite 
        this.spriteTimer += deltaTime * this.state.speed;
        if(this.spriteTimer >= DINO_SPRITE_SWITCH_INTERVAL * 2.0) this.spriteTimer -= DINO_SPRITE_SWITCH_INTERVAL * 2.0;

        // Apply gravity
        if(!this.isGrounded) {
            const mobileFactor = window.isMobile() ? MOBILE_SPEED_FACTOR : 1.0;
            if(this.velocity.y < 0) {
                this.acceleration.y = DINO_GRAVITY * mobileFactor;
            } else {
                this.acceleration.y = DINO_FALL_FORCE * mobileFactor;
            }
        }

        this.updateInput();

        // Velocity Verlet integration 
        this.position.y += this.velocity.y * deltaTime + 0.5 * this.acceleration.y * Math.pow(deltaTime, 2.0);
        this.velocity.y += this.acceleration.y

        this.applyConstraints();

        Gizmo.circle(this.position.add(this.bounds.size.divide(2)), 5)
        Gizmo.arrow(this.position.add(this.bounds.size.divide(2)), this.velocity.normalize().multiply(this.sprite.height / 2.0), Theme.secondary)

    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save()
        if(this.state.isInvulnerable) ctx.globalAlpha = Math.oscilate(this.state.main.globalTimer, 2.5, 0.25, 0.75)
        ctx.drawSprite(this.sprite, this.position.x, this.position.y)
        ctx.restore()

        // Debug bounding box
        Gizmo.outline(new Rectangle(this.position.x, this.position.y, this.sprite.width, this.sprite.height), "rgba(247, 0, 255, 0.63)")
    }
}