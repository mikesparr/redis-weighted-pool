import * as redis from "redis";

export interface IWeightedPool<T> {
    length(channel: string): Promise<number>;
    isEmpty(channel: string): Promise<boolean>;
    addPeer(channel: string, key: T, weight: number): Promise<void>;
    removePeer(channel: string, key: T): Promise<void>;
    getNextPeer(channel: string): Promise<T>;
    reset(channel: string): Promise<void>;
}

export class RedisConfig {
    public host: string;
    public port: number;
    public db: number;
    public password: string;

    constructor(host: string, port: number, db?: number, password?: string) {
        this.host = host;
        this.port = port;
        this.db = db ? db : null;
        this.password = password ? password : null;
    }
}

export class RedisWeightedPool implements IWeightedPool<string> {
    protected client: redis.RedisClient;
    protected readonly DEFAULT_REDIS_HOST: string = "localhost";
    protected readonly DEFAULT_REDIS_PORT: number = 6379;
    protected readonly ENTRY_TYPE: string = "entries";
    protected readonly PEER_TYPE: string = "peers";

    constructor(config: RedisConfig, client?: redis.RedisClient) {
        if (client && client instanceof redis.RedisClient) {
            this.client = client;
        } else {
            // build properties for instantiating Redis
            const options: {[key: string]: any} = {
                host: config.host || this.DEFAULT_REDIS_HOST,
                port: config.port || this.DEFAULT_REDIS_PORT,
                retry_strategy: (status: any) => {
                    if (status.error && status.error.code === "ECONNREFUSED") {
                        // End reconnecting on a specific error and flush all commands with
                        // a individual error
                        return new Error("The server refused the connection");
                    }
                    if (status.total_retry_time > 1000 * 60 * 60) {
                        // End reconnecting after a specific timeout and flush all commands
                        // with a individual error
                        return new Error("Retry time exhausted");
                    }
                    if (status.attempt > 10) {
                        // End reconnecting with built in error
                        return undefined;
                    }
                    // reconnect after
                    return Math.min(status.attempt * 100, 3000);
                },
            };
            if (config.db) { options.db = config.db; }
            if (config.password) { options.password = config.password; }

            this.client = redis.createClient(options);
        }
    }

    public length(channel: string): Promise<number> {
        return new Promise((resolve, reject) => {
            if (typeof channel !== "string") {
                throw new TypeError("Channel parameter must be a string");
            }

            this.client.zcard([channel, this.PEER_TYPE].join(":"), (err: Error, reply: number) => {
                if (err !== null) {
                    reject(err);
                }

                resolve(reply);
            });
        });
    }

    public isEmpty(channel: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (typeof channel !== "string") {
                throw new TypeError("Channel parameter must be a string");
            }

            this.client.zcard([channel, this.PEER_TYPE].join(":"), (err: Error, reply: number) => {
                if (err !== null) {
                    reject(err);
                }

                resolve(reply === 0);
            });
        });
    }

    public addPeer(channel: string, key: string, weight: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof channel !== "string") {
                throw new TypeError("Channel parameter must be a string");
            }
            if (typeof key !== "string") {
                throw new TypeError("Key parameter must be a string");
            }
            if (typeof weight !== "number") {
                throw new TypeError("Weight parameter must be a number");
            }

            // build array of keys of length (weight)
            const entries = [];
            for (let i = 0; i < weight; i ++) {
                entries.push(key);
            }

            // add peer, reset list for key, re-add (weight * key) entries
            this.client.multi()
                .zadd([channel, this.PEER_TYPE].join(":"), weight, key)
                .lrem([channel, this.ENTRY_TYPE].join(":"), 0, key)
                .rpush([channel, this.ENTRY_TYPE].join(":"), entries)
                .exec((err: Error, replies: any) => {
                    if (err !== null) {
                        reject(err);
                    }

                    resolve();
                });
        });
    }

    public removePeer(channel: string, key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof channel !== "string") {
                throw new TypeError("Channel parameter must be a string");
            }
            if (typeof key !== "string") {
                throw new TypeError("Key parameter must be a string");
            }

            // remove peer and entries in pool
            this.client.multi()
                .zrem([channel, this.PEER_TYPE].join(":"), key)
                .lrem([channel, this.ENTRY_TYPE].join(":"), 0, key)
                .exec((err: Error, replies: any) => {
                    if (err !== null) {
                        reject(err);
                    }

                    resolve();
                });
        });
    }

    public getNextPeer(channel: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (typeof channel !== "string") {
                throw new TypeError("Channel parameter must be a string");
            }

            // get length of entries (sum of weights), choose random index
            let chosenIndex: number = 0;
            this.client.multi()
                .llen([channel, this.ENTRY_TYPE].join(":"), (err: Error, reply: number) => {
                    // get random integer between 0 and bounds to choose index
                    chosenIndex = Math.floor(Math.random() * reply);
                })
                .lindex([channel, this.ENTRY_TYPE].join(":"), chosenIndex)
                .exec((err: Error, replies: any) => {
                    console.log({err, replies});
                    resolve(replies[1]); // TODO: add guard
                });
        });
    }

    public reset(channel: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof channel !== "string") {
                throw new TypeError("Channel parameter must be a string");
            }

            // remove list and hash for channel (key)
            this.client.multi()
                .del([channel, this.PEER_TYPE].join(":"))
                .del([channel, this.ENTRY_TYPE].join(":"))
                .exec((err: Error, replies: any) => {
                    if (err !== null) {
                        reject(err);
                    }

                    resolve();
                });
        });
    }
}
