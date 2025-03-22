import { Main } from "../main"
import { AState } from "../types/state"
import { Log } from "../utils/log"
import { Cursor } from "../utils/cursor"
import { CursorType } from "../types/cursor-type"
// import { Dinosaur } from "../models/dinosaur"
import { Ground } from "../models/ground"
import { Theme } from "../utils/theme"
import { FONT_FAMILY, FONT_SIZE, GOD_MODE, MARGIN, MOBILE_SPEED_FACTOR, SCORE_INTERVAL } from "../constants"
import { ImageUtils } from "../utils/image"
import { TextAlign } from "../types/text-align"


export class StatePlay extends AState {
    public ground: Ground;
    // public dino: Dinosaur;


    private scoreTimer = 0
    private rawSpeed = 0
    private rawScore = 0
    private lives = 0

    public isInvulnerable = false
    public invulnerabilityTime = 0

    constructor(public main: Main) {
        super();
    }

    // #region Utility
    public get width() {
        return this.main.screen.width;
    }

    public get height() {
        return this.main.screen.height;
    }

    public get score() {
        return Math.floor(this.rawScore).toString().padStart(4, "0");
    }

    public get speed() {
        return this.rawSpeed * (window.isMobile() ? MOBILE_SPEED_FACTOR : 1.0);
    }

    public invalidate() {
        this.main.invalidate();
    }
    // #endregion

    async setup() {
        Log.debug("StatePlay", "Setting up...")

        //Leaderboard.isCurrentHighest = false

        this.lives = GOD_MODE ? 999 : 3;
        this.rawScore = 0;
        this.rawSpeed = 0;

        //this.dino = new COMDinosaur(this)
        this.ground = new Ground(this)

        if(!DEBUG) Cursor.set(CursorType.Hidden)
    }


    private updateScore(deltaTime: number) {
        this.scoreTimer += deltaTime
        if(this.scoreTimer >= SCORE_INTERVAL) {
            this.scoreTimer -= SCORE_INTERVAL
            this.rawScore++;

            // TODO: add condition to determine if the score is the highest than the current highest score

            if (this.rawScore % 100 === 0) {
                // TODO: Add sound effect
            }
        }
    }

    private updateSpeed(deltaTime: number) {
        if (this.rawSpeed){
            // Accelerate the whole game
            // Bro I don't want a new variable to track the elapsed time, since this will be only used on the ramp-up phase
            // I'll just use the deltaTime variable
            this.rawSpeed += (2.0 * Math.sqrt(this.rawSpeed) * deltaTime + deltaTime * deltaTime)
        } else {
            this.rawSpeed += 0.0057 * deltaTime
        }
    }

    async update(deltaTime: number) {
        this.updateScore(deltaTime)
        this.updateSpeed(deltaTime)
        this.ground.update(deltaTime)


        this.invalidate()
    }

    render(ctx: CanvasRenderingContext2D): void {
        // TODO: Implement render components
        this.ground.render(ctx)

        // Score
        ctx.font = `${FONT_SIZE / 3}pt ${FONT_FAMILY}`;
        ctx.fillStyle = Theme.foreground;
        ctx.textBaseline = "top"
        

        ctx.fillTextAligned(`Lives: ${this.lives}`, this.width - MARGIN, MARGIN, TextAlign.Right)
       // if(DEBUG) ctx.fillText(`rawSpeed: ${this.rawSpeed.toFixed(2)}`, this.width / 2, this.height - FONT_SIZE - MARGIN)
    }
}