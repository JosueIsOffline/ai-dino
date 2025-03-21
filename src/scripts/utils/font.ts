import { FONT_SIZE, FONT_FAMILY } from '../constants'

export abstract class FontUtils {
    static async setup() {
        const font = `${FONT_SIZE}pt ${FONT_FAMILY}`;
        if(!document.fonts.check(font)) {
            await document.fonts.load(font);
        }
    }
}