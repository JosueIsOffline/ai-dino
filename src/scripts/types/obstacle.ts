import { Rectangle } from "../models/rectangle";    
import { Sprite } from "../utils/spritesheet";
import { AEntity } from "./entity";

export abstract class AObstacle extends AEntity {
    public abstract get sprite(): Sprite;
    public abstract get bounds(): Rectangle;
    public abstract get isOutOfScreen(): boolean;
 }