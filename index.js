"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var redis = require("redis");
var RedisConfig = (function () {
    function RedisConfig(host, port, db, password) {
        this.host = host;
        this.port = port;
        this.db = db ? db : null;
        this.password = password ? password : null;
    }
    return RedisConfig;
}());
exports.RedisConfig = RedisConfig;
var RedisWeightedPool = (function () {
    function RedisWeightedPool(config, client) {
        this.DEFAULT_REDIS_HOST = "localhost";
        this.DEFAULT_REDIS_PORT = 6379;
        this.ENTRY_TYPE = "entries";
        this.PEER_TYPE = "peers";
        if (client && client instanceof redis.RedisClient) {
            this.client = client;
        }
        else {
            var options = {
                host: config.host || this.DEFAULT_REDIS_HOST,
                port: config.port || this.DEFAULT_REDIS_PORT,
                retry_strategy: function (status) {
                    if (status.error && status.error.code === "ECONNREFUSED") {
                        return new Error("The server refused the connection");
                    }
                    if (status.total_retry_time > 1000 * 60 * 60) {
                        return new Error("Retry time exhausted");
                    }
                    if (status.attempt > 10) {
                        return undefined;
                    }
                    return Math.min(status.attempt * 100, 3000);
                },
            };
            if (config.db) {
                options.db = config.db;
            }
            if (config.password) {
                options.password = config.password;
            }
            this.client = redis.createClient(options);
        }
    }
    RedisWeightedPool.prototype.length = function (channel) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (typeof channel !== "string") {
                throw new TypeError("Channel parameter must be a string");
            }
            _this.client.zcard([channel, _this.PEER_TYPE].join(":"), function (err, reply) {
                if (err !== null) {
                    reject(err);
                }
                resolve(reply);
            });
        });
    };
    RedisWeightedPool.prototype.isEmpty = function (channel) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (typeof channel !== "string") {
                throw new TypeError("Channel parameter must be a string");
            }
            _this.client.zcard([channel, _this.PEER_TYPE].join(":"), function (err, reply) {
                if (err !== null) {
                    reject(err);
                }
                resolve(reply === 0);
            });
        });
    };
    RedisWeightedPool.prototype.addPeer = function (channel, key, weight) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var _a;
            if (typeof channel !== "string") {
                throw new TypeError("Channel parameter must be a string");
            }
            if (typeof key !== "string") {
                throw new TypeError("Key parameter must be a string");
            }
            if (typeof weight !== "number") {
                throw new TypeError("Weight parameter must be a number");
            }
            var entries = [];
            for (var i = 0; i < weight; i++) {
                entries.push(key);
            }
            (_a = _this.client.multi()
                .zadd([channel, _this.PEER_TYPE].join(":"), weight, key)
                .lrem([channel, _this.ENTRY_TYPE].join(":"), 0, key)).lpush.apply(_a, [[channel, _this.ENTRY_TYPE].join(":")].concat(entries)).exec(function (err, replies) {
                if (err !== null) {
                    reject(err);
                }
                resolve();
            });
        });
    };
    RedisWeightedPool.prototype.removePeer = function (channel, key) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (typeof channel !== "string") {
                throw new TypeError("Channel parameter must be a string");
            }
            if (typeof key !== "string") {
                throw new TypeError("Key parameter must be a string");
            }
            _this.client.multi()
                .zrem([channel, _this.PEER_TYPE].join(":"), key)
                .lrem([channel, _this.ENTRY_TYPE].join(":"), 0, key)
                .exec(function (err, replies) {
                if (err !== null) {
                    reject(err);
                }
                resolve();
            });
        });
    };
    RedisWeightedPool.prototype.getNextPeer = function (channel) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (typeof channel !== "string") {
                throw new TypeError("Channel parameter must be a string");
            }
            var chosenIndex = 0;
            _this.client.llen([channel, _this.ENTRY_TYPE].join(":"), function (lenError, sumWeights) {
                if (lenError !== null) {
                    reject(lenError);
                }
                chosenIndex = Math.floor(Math.random() * sumWeights);
                _this.client.lindex([channel, _this.ENTRY_TYPE].join(":"), chosenIndex, function (indexError, entry) {
                    if (indexError !== null) {
                        reject(indexError);
                    }
                    resolve(entry);
                });
            });
        });
    };
    RedisWeightedPool.prototype.reset = function (channel) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (typeof channel !== "string") {
                throw new TypeError("Channel parameter must be a string");
            }
            _this.client.multi()
                .del([channel, _this.PEER_TYPE].join(":"))
                .del([channel, _this.ENTRY_TYPE].join(":"))
                .exec(function (err, replies) {
                if (err !== null) {
                    reject(err);
                }
                resolve();
            });
        });
    };
    return RedisWeightedPool;
}());
exports.RedisWeightedPool = RedisWeightedPool;
//# sourceMappingURL=index.js.map