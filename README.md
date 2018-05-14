# Redis Priority Queue
This is a simple Promise based multi-channel priority queue implementation that leverages Redis sorted set.

# Requirements
You will need Redis server running.

# Installation
```bash
npm install redis-priority-queue
yarn add redis-priority-queue
```

# Test
The test script in `package.json` preprocesses the `.ts` file and then executes.

`npm test`

# Usage
The source was written in Typescript, yet it compiles to Javascript (`npm run build`). You can use in ES5 or later supported environments. The following code snippets are implemented in the `__tests__` folder.

## Quick start (Node)
```javascript
const queue = require('redis-priority-queue');

const config = queue.RedisConfig("localhost", 6379, null, null);

const myQueue = new queue.RedisPriorityQueue(config);

myQueue.length("emptyQueue")
  .then(result => {
    console.log({result});
  })
  .catch(error => {
    console.error({error});
  });
```

## Optional with existing client
If you already have a program with a `RedisClient` you can pass the client as an optional second parameter.
```javascript
const myQueue = new queue.RedisPriorityQueue(null, client);

myQueue.length("emptyQueue")
  .then(result => {
    console.log({result});
  })
  .catch(error => {
    console.error({error});
  });
```

## Typescript
### Initialization
```typescript
import {RedisConfig, IPriorityQueue, RedisPriorityQueue} from 'redis-priority-queue';

let config: RedisConfig = new RedisConfig(
    "localhost",
    6379,
    null,
    null
);

let myQueue : IPriorityQueue<string> = new RedisPriorityQueue(config);
```

### Add peers
```typescript
Promise.all([
    myPool.addPeer("channelId", "peerId1", weight1),
    myPool.addPeer("channelId", "peerId2", weight2),
    myPool.addPeer("channelId", "peerId3", weight3)
])
    .then(values => {
        done();
    })
    .catch(error => {
        done.fail(error);
    });
```

### Get next peer (weighted round robin)
```typescript
myPool.getNextPeer("channelId")
    .then(result => {
        // expect one of peer Ids to be returned
        expect(result).toBeDefined();
    })
    .catch(error => {
        done.fail(error);
    });
```

### Remove peer from channel
```typescript
myPool.removePeer("channelId", "peerId1")
    .then(result => {
        // expect peer count to be decreased
        expect(result).toBeDefined();
    })
    .catch(error => {
        done.fail(error);
    });
```

### Reset pool for channel
```typescript
myPool.reset("channelId")
    .then(result => {
        done();
    })
    .catch(error => {
        done.fail(error);
    });
```

### Check if empty
```typescript
myPool.isEmpty("channelId")
    .then(result => {
        expect(result).toBeFalsy();
        done();
    })
    .catch(error => {
        done.fail(error);
    });
```

### Get pool length
```typescript
myPool.length("channelId")
    .then(result => {
        expect(result).toEqual(3);
        done();
    })
    .catch(error => {
        done.fail(error);
    });
```

# Contributing
I haven't thought that far ahead yet. I needed this for my project and wanted to give back. ;-)

# License
MIT (if you enhance it, fork and PR so the community benefits)
