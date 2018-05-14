import * as redis from "redis";
import {IWeightedPool, RedisConfig, RedisWeightedPool} from "../index";

describe("RedisWeightedPool", () => {
    const config: RedisConfig = new RedisConfig(
        "localhost",
        6379,
        null,
        null,
    );
    const myPool: IWeightedPool<string> = new RedisWeightedPool(config);
    const testKey: string = "test123";
    const testEmptyKey: string = "testEmptyKey999";
    const unusedKey: string = "unusedKey333";
    const testEntry1: string = "math";
    const testWeight1: number = 25;
    const testEntry2: string = "reading";
    const testWeight2: number = 40;
    const testEntry3: string = "writing";
    const testWeight3: number = 35;
    const testUnusedEntry: string = "unused";
    const testUnusedWeight: number = 5;

    const client: any = redis.createClient(); // for confirming app TODO: mock

    it("instantiates a Pool", () => {
        expect(myPool).toBeInstanceOf(RedisWeightedPool);
    }); // constructor

    it("uses existing RedisClient if passed", () => {
        const poolWithClient: IWeightedPool<string> = new RedisWeightedPool(null, client);
        expect(poolWithClient).toBeInstanceOf(RedisWeightedPool);
    }); // constructor

    beforeAll((done) => {
        Promise.all([
            myPool.addPeer(testKey, testEntry1, testWeight1),
            myPool.addPeer(testKey, testEntry2, testWeight2),
            myPool.addPeer(testKey, testEntry3, testWeight3),
        ])
            .then((values) => {
                done();
            })
            .catch((error) => {
                done.fail(error);
            });
    });

    afterAll((done) => {
        client.multi()
            .del(testKey)
            .del(testEmptyKey)
            .del(unusedKey)
            .exec((err, reply) => {
                if (err !== null) {
                    done.fail(err);
                } else {
                    done();
                }
            });
    });

    describe("length", () => {
        it("returns a Promise", () => {
            expect(myPool.length(testKey)).toBeInstanceOf(Promise);
        });

        it("throws error if channel not valid", (done) => {
            myPool.length(null)
                .then((result) => {
                    done.fail();
                })
                .catch((error) => {
                    expect(error).toBeInstanceOf(TypeError);
                    done();
                });
        });

        it("returns number of elements in active Pool", (done) => {
            myPool.length(testKey)
                .then((result) => {
                    expect(result).toEqual(3);
                    done();
                })
                .catch((error) => {
                    done.fail(error);
                });
        });

        it("returns 0 if no elements or inactive Pool", (done) => {
            myPool.length(testEmptyKey)
                .then((result) => {
                    expect(result).toEqual(0);
                    done();
                })
                .catch((error) => {
                    done.fail(error);
                });
        });
    }); // length

    describe("isEmpty", () => {
        it("returns a Promise", () => {
            expect(myPool.isEmpty(testKey)).toBeInstanceOf(Promise);
        });

        it("throws error if channel not valid", (done) => {
            myPool.isEmpty(null)
                .then((result) => {
                    done.fail();
                })
                .catch((error) => {
                    expect(error).toBeInstanceOf(TypeError);
                    done();
                });
        });

        it("returns true if no elements are in Pool", (done) => {
            myPool.isEmpty(testEmptyKey)
                .then((result) => {
                    expect(result).toBeTruthy();
                    done();
                })
                .catch((error) => {
                    done.fail(error);
                });
        });

        it("returns false if elements are in Pool", (done) => {
            myPool.isEmpty(testKey)
                .then((result) => {
                    expect(result).toBeFalsy();
                    done();
                })
                .catch((error) => {
                    done.fail(error);
                });
        });
    }); // isEmpty

    describe("addPeer", () => {
        it("throws error if channel not valid", (done) => {
            myPool.addPeer(null, testEntry1, testWeight1)
                .then((result) => {
                    done.fail();
                })
                .catch((error) => {
                    expect(error).toBeInstanceOf(TypeError);
                    done();
                });
        });

        it("throws error if key (entry) not valid", (done) => {
            myPool.addPeer(testKey, null, testWeight1)
                .then((result) => {
                    done.fail();
                })
                .catch((error) => {
                    expect(error).toBeInstanceOf(TypeError);
                    done();
                });
        });

        it("throws error if weight not valid", (done) => {
            myPool.addPeer(testKey, testEntry1, null)
                .then((result) => {
                    done.fail();
                })
                .catch((error) => {
                    expect(error).toBeInstanceOf(TypeError);
                    done();
                });
        });

        it("adds a weighted peer to pool and respective entries", (done) => {
            myPool.addPeer(unusedKey, testUnusedEntry, testUnusedWeight)
                .then((result) => {
                    expect(result).not.toBeDefined();
                    done();
                })
                .catch((error) => {
                    done.fail(error);
                });
        });
    }); // addPeer

    describe("removePeer", () => {
        it("throws error if channel not valid", (done) => {
            myPool.removePeer(null, testEntry1)
                .then((result) => {
                    done.fail();
                })
                .catch((error) => {
                    expect(error).toBeInstanceOf(TypeError);
                    done();
                });
        });

        it("throws error if key (entry) not valid", (done) => {
            myPool.removePeer(testKey, null)
                .then((result) => {
                    done.fail();
                })
                .catch((error) => {
                    expect(error).toBeInstanceOf(TypeError);
                    done();
                });
        });

        it("removes desired peer from pool if it exists and respective entries", (done) => {
            myPool.removePeer(unusedKey, testUnusedEntry)
                .then((result) => {
                    // expect peer count to be decreased
                    expect(result).not.toBeDefined();
                    done();
                })
                .catch((error) => {
                    done.fail(error);
                });
        });
    }); // removePeer

    describe("getNextPeer", () => {
        it("throws error if channel not valid", (done) => {
            myPool.getNextPeer(null)
                .then((result) => {
                    done.fail();
                })
                .catch((error) => {
                    expect(error).toBeInstanceOf(TypeError);
                    done();
                });
        });

        it("returns a valid peer entry", (done) => {
            myPool.getNextPeer("channelId")
                .then((result) => {
                    // expect one of peer Ids to be returned
                    expect(result).toBeDefined();
                    done();
                })
                .catch((error) => {
                    done.fail(error);
                });
        });
    }); // getNextPeer

    describe("reset", () => {
        it("throws error if channel not valid", (done) => {
            myPool.reset(null)
                .then((result) => {
                    done.fail();
                })
                .catch((error) => {
                    expect(error).toBeInstanceOf(TypeError);
                    done();
                });
        });

        it("removes peers and entries and resets pool", (done) => {
            myPool.reset(testKey)
                .then((result) => {
                    done();
                })
                .catch((error) => {
                    done.fail(error);
                });
        });
    }); // reset

}); // redis priority Pool
