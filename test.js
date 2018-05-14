const pool = [];

// getNext skill between 0 and sum of weights (number of items in pool)
const getNext = () => {
  const nextIndex = Math.floor(Math.random()*pool.length);
  return pool[nextIndex];
};

const addWorkerSkillsToPool = (worker) => {
  // loop through skills and add weighted number to pool
  Object.keys(worker.skills).map(key => {
    const skill = worker.skills[key];

    for (let i = 0; i < key; i ++) {
      pool.push(skill);
    }
  });
};

const getDistribution = (testRuns) => {
  const hitCount = {};
  const hitPercent = {};

  for (let i = 0; i < testRuns; i++) {
    const nextSkill = getNext();
    hitCount[nextSkill] = (hitCount[nextSkill]) ? hitCount[nextSkill] + 1 : 1;
  }

  let totalHits = 0;
  Object.keys(hitCount).map(key => totalHits += hitCount[key]);
  Object.keys(hitCount).map(key => hitPercent[key] = hitCount[key] / totalHits);

  return {testRuns, hitCount, hitPercent};
}


// try it out
const testWorker = {id: 1, skills: {10: "math", 20: "reading", 15: "writing"}, name: "Joe"};
addWorkerSkillsToPool(testWorker);
console.log(pool);
console.log(`Next skill: ${getNext()}`);

// test distribution
console.log(getDistribution(1000));

