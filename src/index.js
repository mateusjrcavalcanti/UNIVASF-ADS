const fs = require("fs").promises;
const path = require("path");

const NUMBER_OF_OPERATIONS = 1000000000;
const NUMBER_OF_ITERATIONS = 10;
const DIRECTORY = "data";

const outDir = path.join(__dirname, "..", DIRECTORY);

async function clearDir(diretorio) {
  try {
    let diretorioExiste = false;
    try {
      await fs.stat(diretorio);
      diretorioExiste = true;
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    if (diretorioExiste) {
      const files = await fs.readdir(diretorio);
      for (const file of files) {
        const filePath = path.join(diretorio, file);
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
          await fs.rmdir(filePath, { recursive: true });
        } else {
          await fs.unlink(filePath);
        }
      }
      console.log(`Todos os arquivos em ${diretorio} foram removidos.`);
    } else {
      await fs.mkdir(diretorio, { recursive: true });
      console.log(`O diretório ${diretorio} foi criado.`);
    }
  } catch (error) {
    console.error("Ocorreu um erro ao limpar o diretório:", error);
    process.exit(1);
  }
}

async function measureExecutionTime(task, iterations, filename) {
  console.log(`\nStarting to measure execution time for ${filename}`);
  let sum = 0n;
  for (let i = 0; i < iterations; i++) {
    const result = await task(sum);
    sum = result.sum;
    try {
      const value = `${i + 1},${result.time},${sum}`;
      await fs.appendFile(path.join(outDir, filename), `${value}\n`);
      console.log(value);
    } catch (err) {
      console.error(err);
    }
  }
}

async function performOperation(sum = 0n) {
  const start = process.hrtime.bigint();
  for (let b = 0; b < NUMBER_OF_OPERATIONS; b++) {
    sum = BigInt(sum) + 3n;
  }
  const end = process.hrtime.bigint();
  return { time: end - start, sum };
}

async function performOverhead(sum = 0n) {
  const start = process.hrtime.bigint();
  for (let b = 0; b < NUMBER_OF_OPERATIONS; b++) {
    sum = BigInt(b);
  }
  const end = process.hrtime.bigint();
  return { time: end - start, sum };
}

function mean(values) {
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  return sum / values.length;
}

function standardDeviation(values) {
  const avg = mean(values);
  const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
  const avgSquareDiff = mean(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

async function statistics(
  operationResultsFile,
  overheadResultsFile,
  differenceOutputFile
) {
  const operationResults = await fs.readFile(
    path.join(outDir, operationResultsFile),
    "utf-8"
  );
  const overheadResults = await fs.readFile(
    path.join(outDir, overheadResultsFile),
    "utf-8"
  );

  const operationLines = operationResults.trim().split("\n");
  const overheadLines = overheadResults.trim().split("\n");

  if (operationLines.length !== overheadLines.length) {
    throw new Error("Number of operation and overhead results do not match.");
  }

  const differences = [];

  const header =
    "Operation Time (ns)\t|\tOverhead Time (ns)\t|\tDifference (ns)";

  differences.push(header);

  for (let i = 0; i < operationLines.length; i++) {
    const operationValues = operationLines[i].split(",");
    const overheadValues = overheadLines[i].split(",");

    if (operationValues.length !== 3 || overheadValues.length !== 3) {
      throw new Error("Invalid line format in results.");
    }

    const operationTime = parseFloat(operationValues[1]) / NUMBER_OF_OPERATIONS;
    const overheadTime = parseFloat(overheadValues[1]) / NUMBER_OF_OPERATIONS;

    const differenceNanoSeconds = operationTime - overheadTime;

    const formattedDifference = `${operationTime.toFixed(
      5
    )} ns\t|\t${overheadTime.toFixed(5)} ns\t|\t${differenceNanoSeconds.toFixed(
      5
    )} ns`;
    differences.push(formattedDifference);
  }

  // Calcular a média e o desvio padrão
  const operationTimes = operationLines.map((line) =>
    parseFloat(line.split(",")[1])
  );
  const overheadTimes = overheadLines.map((line) =>
    parseFloat(line.split(",")[1])
  );

  // Calcular a média e o desvio padrão
  const meanOperationTime = mean(operationTimes) / NUMBER_OF_OPERATIONS;
  const meanOverheadTime = mean(overheadTimes) / NUMBER_OF_OPERATIONS;
  const stdOperationTime =
    standardDeviation(operationTimes) / NUMBER_OF_OPERATIONS;
  const stdOverheadTime =
    standardDeviation(overheadTimes) / NUMBER_OF_OPERATIONS;

  // Calcular média e desvio padrão da diferença
  const differencesArray = differences
    .slice(1)
    .map((d) => parseFloat(d.split("\t|\t")[2]));
  const meanDifference = mean(differencesArray).toFixed(5);
  const stdDifference = standardDeviation(differencesArray).toFixed(5);
  differences.push("\nMean");
  differences.push(
    `${meanOperationTime.toFixed(5)} ns\t|\t${meanOverheadTime.toFixed(
      5
    )} ns\t|\t${meanDifference} ns`
  );
  differences.push("\nStandard Deviation");
  differences.push(
    `${stdOperationTime.toFixed(5)} ns\t|\t${stdOverheadTime.toFixed(
      5
    )} ns\t|\t${stdDifference} ns`
  );

  const differencesOutput = differences.join("\n");
  await fs.writeFile(
    path.join(outDir, differenceOutputFile),
    differencesOutput,
    "utf-8"
  );
}

async function main() {
  // await clearDir(outDir);

  // await measureExecutionTime(
  //   performOperation,
  //   NUMBER_OF_ITERATIONS,
  //   "operation_results.txt"
  // );
  // await measureExecutionTime(
  //   performOverhead,
  //   NUMBER_OF_ITERATIONS,
  //   "overhead_results.txt"
  // );

  await statistics(
    "operation_results.txt",
    "overhead_results.txt",
    "statistics.txt"
  );
}

main().catch(console.error);
