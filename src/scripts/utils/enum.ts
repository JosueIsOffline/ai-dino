type EnumType = { [key: string]: never }

export abstract class EnumUtils {
    public static valuess<T extends EnumType>(e: T): Array<T[keyof T]> {
        return Object.keys(e)
            .filter(key => typeof key === "string" && isNaN(Number(key)))
            .map(key => e[key]);
    }
}