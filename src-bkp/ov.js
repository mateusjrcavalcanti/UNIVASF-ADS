const fs = require("fs").promises;
const math = require("mathjs");
const path = require("path");
const os = require("os");

const outDir = path.join(__dirname, "..", "out");

async function measureExecutionTime(task, iterations, filename) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await task();
    const end = process.hrtime.bigint();
    const executionTime = Number(end - start) / 1e9;
    times.push(executionTime);
  }
  await fs.writeFile(path.join(outDir, filename), times.join("\n") + "\n");
}

async function performOverhead() {
  let sum = 0n;
  for (let b = 0; b < 1000000000; b++) {
    sum = BigInt(b);
  }
}

async function main() {
  const start = process.hrtime.bigint();
  await measureExecutionTime(performOverhead, 10, "overhead_results.txt");
  const end2 = process.hrtime.bigint();

  console.log("Start Time:", start.toString());
  console.log("End Time 2:", end2.toString());
  console.log("Duration Function 1:", (end2 - start).toString() + "ns");
}

main().catch(console.error);
