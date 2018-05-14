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
    const testDistKey: string = "testDistKey222";
    const unusedKey: string = "unusedKey333";
    const testEntry1: string = "math";
    const testWeight1: number = 20;
    const testEntry2: string = "reading";
    const testWeight2: number = 50;
    const testEntry3: string = "writing";
    const testWeight3: number = 30;
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
            myPool.addPeer(testDistKey, testEntry1, testWeight1),
            myPool.addPeer(testDistKey, testEntry2, testWeight2),
            myPool.addPeer(testDistKey, testEntry3, testWeight3),
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
            .del([testKey, ":peers"].join(":"))
            .del([testKey, ":entries"].join(":"))
            .del([testEmptyKey, ":peers"].join(":"))
            .del([testEmptyKey, ":entries"].join(":"))
            .del([testDistKey, ":peers"].join(":"))
            .del([testDistKey, ":entries"].join(":"))
            .del([unusedKey, ":peers"].join(":"))
            .del([unusedKey, ":entries"].join(":"))
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
                    // assert
                    client.zrank([unusedKey, "peers"].join(":"), testUnusedEntry, (err: Error, reply: number) => {
                        expect(reply).not.toBeNull();
                        done();
                    });
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
            myPool.removePeer(unusedKey, null)
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
                    // assert
                    client.multi()
                        .zrank([unusedKey, "peers"].join(":"), testUnusedEntry, (err: Error, reply: number) => {
                            expect(reply).toBeNull(); // removed peer from sorted set
                        })
                        .lindex([unusedKey, "entries"].join(":"), 0, (err: Error, reply: number) => {
                            expect(reply).toBeNull(); // removed weighted entries from list
                        })
                        .exec((err: Error, replies: any) => {
                            done();
                        });
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
            myPool.getNextPeer(testKey)
                .then((result) => {
                    // expect one of peer Ids to be returned
                    expect([testEntry1, testEntry2, testEntry3]).toContain(result);
                    done();
                })
                .catch((error) => {
                    done.fail(error);
                });
        });

        it("distributes responses close to weight", (done) => {
            // arrange
            const hitCount: {[key: string]: number} = {};
            const hitPercent: {[key: string]: number} = {};
            const tests: number = 1000;
            const variance: number = 1;
            const testRuns: Array<Promise<any>> = [];

            // act
            for (let i = 0; i < tests; i++) {
                testRuns.push(myPool.getNextPeer(testDistKey));
            }

            Promise.all(testRuns)
                .then((values) => {
                    // loop through values and build hitCount
                    values.map((value) => {
                        hitCount[value] = (hitCount[value]) ? hitCount[value] + 1 : 1;
                    });

                    // add percentage of total distribution to hitPercent
                    Object.keys(hitCount).map((key) => hitPercent[key] = hitCount[key] / tests);

                    // assert
                    expect(hitPercent[testEntry1]).toBeCloseTo(testWeight1 / 100, variance);
                    done();
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
                    // assert
                    client.multi()
                        .llen([unusedKey, "peers"].join(":"), (err: Error, reply: number) => {
                            expect(reply).toEqual(0); // removed sorted set
                        })
                        .llen([unusedKey, "entries"].join(":"), (err: Error, reply: number) => {
                            expect(reply).toEqual(0); // removed list
                        })
                        .exec((err: Error, replies: any) => {
                            done();
                        });
                })
                .catch((error) => {
                    done.fail(error);
                });
        });
    }); // reset

}); // redis priority Pool
