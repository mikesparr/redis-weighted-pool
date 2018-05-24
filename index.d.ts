import * as redis from "redis";
export interface IWeightedPool<T> {
    length(channel: string): Promise<number>;
    isEmpty(channel: string): Promise<boolean>;
    addPeer(channel: string, key: T, weight: number): Promise<void>;
    removePeer(channel: string, key: T): Promise<void>;
    getNextPeer(channel: string): Promise<T>;
    reset(channel: string): Promise<void>;
}
export declare class RedisConfig {
    host: string;
    port: number;
    db: number;
    password: string;
    constructor(host: string, port: number, db?: number, password?: string);
}
export declare class RedisWeightedPool implements IWeightedPool<string> {
    protected client: redis.RedisClient;
    protected readonly DEFAULT_REDIS_HOST: string;
    protected readonly DEFAULT_REDIS_PORT: number;
    protected readonly ENTRY_TYPE: string;
    protected readonly PEER_TYPE: string;
    constructor(config: RedisConfig, client?: redis.RedisClient);
    length(channel: string): Promise<number>;
    isEmpty(channel: string): Promise<boolean>;
    addPeer(channel: string, key: string, weight: number): Promise<void>;
    removePeer(channel: string, key: string): Promise<void>;
    getNextPeer(channel: string): Promise<string>;
    reset(channel: string): Promise<void>;
}
