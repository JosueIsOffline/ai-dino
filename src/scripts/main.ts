import "./extensions";
import { DesintyCanvas } from "./components/density-canvas";
import { InputHandler } from "./components/input-handler";
import { Size } from "./types/size";
import { Log } from "./utils/log";
import { ImageUtils } from "./utils/image";
import { Theme } from "./utils/theme";
import { SpriteSheet } from "./utils/spritesheet";
import { FontUtils } from "./utils/font";
import {
	MARGIN,
	SIMULATION_FREQUENCY,
	SIMULATION_SUBSTEPS,
	USE_ANIMATION_FRAME,
} from "./constants";
import { Cursor } from "./utils/cursor";
import { AState } from "./types/state";
import { StatePlay } from "./states/state-play";
import { StateMenu } from "./states/state-menu";
import { Gizmo } from "./utils/gizmo";

export class Main {
	// Graphics
	public canvas = new DesintyCanvas("Canvas");
	public screen: Size = { width: 0, height: 0 };
	private isDirty = true;

	// Frame
	private handleAnimationFrameRequest = -1;
	private lastFrameTime = performance.now();

	// Misc
	public globalTimer = 0;

	// Game logic
	public state: AState;

    constructor() {
        Log.info("Main", "Starting up...")

        if(DEBUG) this.state = new StatePlay(this)
        else this.state = new StateMenu(this)

        this.attachHooks()
    }

	private attachHooks() {
		Log.info("Main", "Attaching hooks...");

		 window.addLoadEventListener(this.onLoad.bind(this));
         window.addVisibilityChangeEventListener(this.onVisibilityChange.bind(this));
		 window.addEventListener("resize", this.onResize.bind(this));

		 InputHandler.setup(this)

      
	}

	// #region Event listeners
	private async onLoad() {
		try {
			Log.debug("Main", "Window loaded");

			// Attach the canvas element to DOM
			this.canvas.attachToElement(document.body);

			// Setup canvas
			this.onResize();

			// Load moudle in parallel
			const modules = [
				Theme.setup(),
				FontUtils.setup(),
				ImageUtils.setup(),
				SpriteSheet.setup(),
			];

			await Promise.all(modules);

			// Setup game state
			await this.state.setup();

			this.requestNextFrame();
		} catch (e) {
			Log.error("Main", "Failed to load modules", e.toString());
			alert(
				`Failed to load modules. Please refresh the page.${DEBUG ? `Error: ${e}` : ""}`,
			);
		}
	}

	private onVisibilityChange(isVisible: boolean) {
		Log.info(
			"Main",
			`Window visibility changed to ${isVisible ? "visible" : "hidden"}`,
		);

		if (isVisible) {
			if (this.handleAnimationFrameRequest >= 0) {
				if (USE_ANIMATION_FRAME) {
					cancelAnimationFrame(
						this.handleAnimationFrameRequest as number,
					);
				} else {
					clearInterval(this.handleAnimationFrameRequest);
				}
			}

			this.invalidate();
			this.lastFrameTime = performance.now();

			// Request the next frame
			setTimeout(this.requestNextFrame.bind(this), 0);
		} else {
			// cancel the next frame
			if (this.handleAnimationFrameRequest) {
				if (USE_ANIMATION_FRAME) {
					cancelAnimationFrame(
						this.handleAnimationFrameRequest as number,
					);
				} else {
					clearInterval(this.handleAnimationFrameRequest as number);
				}

				this.handleAnimationFrameRequest = -1;
			}
		}
	}

	private onResize() {
		Log.debug("Main", "Resizing canvas");

		let width = window.innerWidth - MARGIN * 4;
		let height = window.innerHeight - MARGIN * 4;

		if (window.isMobile() || window.innerWidth < 800) {
			document.body.classList.add("mobile");
			width = window.innerWidth;
			height = window.innerHeight;
			this.screen = { width, height: height * 0.75 };
		} else {
			document.body.classList.remove("mobile");
			const aspectRatio = 16 / 10;
			const maxWidth = 1200;
			const maxHeight = maxWidth / aspectRatio;
			if (width > maxWidth) width = maxWidth;
			if (height > maxHeight) height = maxHeight;

			// Enforce aspect ratio
			if (width / height > aspectRatio) {
				width = height * aspectRatio;
			} else {
				height = width / aspectRatio;
			}

			this.screen = { width, height };
		}

		// Resize canvas
		this.canvas.setSize(width, height);
		this.invalidate();
	}

	// #region state Management
	public setState(state: AState) {
		this.state = state;
		this.state.setup();
		Cursor.apply(this.canvas.element);
		this.invalidate();
	}

	// #region Frame
	public invalidate() {
		this.isDirty = true;
	}

	private requestNextFrame() {
		if (USE_ANIMATION_FRAME) {
			this.handleAnimationFrameRequest = requestAnimationFrame(
				this.loop.bind(this),
			);
		} else {
			if (this.handleAnimationFrameRequest === -1) {
				this.handleAnimationFrameRequest = setInterval(
					() => this.loop(performance.now()),
					1000 / SIMULATION_FREQUENCY,
				) as unknown as number;
			}
		}
	}

	private update(newTime: DOMHighResTimeStamp) {
		const deltaTime = (newTime - this.lastFrameTime) / 1000.0;
		this.lastFrameTime = newTime;

		const dt = deltaTime / SIMULATION_SUBSTEPS;
		for (let i = 0; i < SIMULATION_SUBSTEPS; i++) {
			this.state.update(dt)
			InputHandler.update()
			// if(DEBUG) this.analitics.endUpdate()
		}

		//TODD: update clouds

		this.globalTimer += deltaTime;
	}

	private loop(time: DOMHighResTimeStamp) {
		this.update(time);
		Cursor.apply(this.canvas.element);

		// Redraw canvas, if needed
		if (this.isDirty) {
			this.canvas.clear()

			this.state.render(this.canvas.context);
			this.isDirty = false;

			Gizmo.render(this.canvas.context);
			Gizmo.clear();
		}

		this.requestNextFrame();
	}
}

// Start the game
window._instance = new Main();
