import { Log } from "./log"; 
import { SoundFX } from "../types/soundfx";   
import { AUDIO_VOLUME } from "../constants";

export abstract class AudioUtils {
    private static readonly cache = new Map<string, HTMLAudioElement>();

    private static load(id: SoundFX): Promise<HTMLAudioElement> {
        return new Promise((resolve, reject) => {
            if(this.cache.has(id)) {
                const value = this.cache.get(id);
                if(!value) throw new Error("Invalid value in cache");

                return resolve(value);
            }

            const audio = new Audio(`${window.location.href}/assets/audio/${id}.mp3`);
            audio.crossOrigin = "anonymous";
            audio.volume = AUDIO_VOLUME;
            audio.id = `${id}`;
            audio.preload = "auto"; // Changed from "none" to "auto"

            audio.onerror = (e) => {
                Log.error("AudioUtils", `Failed to load audio: ${id}`, JSON.stringify(e, ["message", "arguments", "type", "name"]));
                reject(e);
            }
            audio.oncanplay = () => {
                Log.info("AudioUtils", `Loaded audio: ${id}`);
                this.cache.set(id, audio);
                resolve(audio);
            }
        })
    }

    public static async setup() {
        try {
            // Load all sound effects you want available at startup
            // Add all SoundFX enum values that should be preloaded
            await Promise.all([
                this.load(SoundFX.Score),
                // Add other sound effects you need preloaded
                // Example: this.load(SoundFX.Jump), this.load(SoundFX.Explosion), etc.
            ]);
            Log.info("AudioUtils", "All audio files loaded successfully");
        } catch (e) {
            Log.error("AudioUtils", "Failed to load audio", e.toString());
        }
    }

    public static async play(id: SoundFX) {
        let audio = this.cache.get(id);
        
        // If audio not found in cache, try to load it on-demand
        if(audio === undefined) {
            Log.warn("AudioUtils", `Audio not found in cache: ${id}`);
            Log.debug("AudioUtils", `Attempting to load audio: ${id}`);
            
            try {
                audio = await this.load(id);
            } catch (error) {
                Log.error("AudioUtils", `Failed to load audio on-demand: ${id}`);
                return;
            }
        }

        // Now play the audio
        audio.currentTime = 0;
        audio.play().catch(error => {
            Log.error("AudioUtils", `Failed to play audio: ${id}`, error.toString());
        });
    }
}