const fs = require("fs").promises;
const math = require("mathjs");
const path = require("path");
const os = require("os");

const outDir = path.join(__dirname, "..", "out");

async function calculateStatistics() {
  let differences = [];
  let sum_1 = 0,
    sum_2 = 0,
    sum_3 = 0;
  let sd1 = 0,
    sd2 = 0,
    sd3 = 0;

  try {
    const file1 = await fs.readFile(
      path.join(outDir, "operation_results.txt"),
      "utf8"
    );
    const file2 = await fs.readFile(
      path.join(outDir, "overhead_results.txt"),
      "utf8"
    );

    const lines1 = file1.trim().split("\n");
    const lines2 = file2.trim().split("\n");

    for (let i = 0; i < Math.min(lines1.length, lines2.length); i++) {
      const value1 = parseFloat(lines1[i]);
      const value2 = parseFloat(lines2[i]);
      if (!isNaN(value1) && !isNaN(value2)) {
        differences.push(value1 - value2);
        sum_1 += value1;
        sum_2 += value2;
        sum_3 += value1 - value2;
        sd1 += Math.pow(sum_1 / 10 - value1, 2);
        sd2 += Math.pow(sum_2 / 10 - value2, 2);
        sd3 += Math.pow(sum_3 / 10 - (value1 - value2), 2);
      }
    }

    await fs.writeFile(
      path.join(outDir, "statistics.txt"),
      `${differences.join("\n")}\n\n${sum_1 / 10}\n${sum_2 / 10}\n${
        sum_3 / 10
      }\n${math.sqrt(sd1 / 9)}\n${math.sqrt(sd2 / 9)}\n${math.sqrt(sd3 / 9)}\n`
    );
  } catch (error) {
    console.error("Error calculating statistics:", error);
  }
}

async function generateSystemInfoFile() {
  const filename = path.join(outDir, "system_info.txt");
  try {
    const cpuInfo = os.cpus()[0];
    const totalMemory = os.totalmem();
    const memoryInGiB = (totalMemory / 1024 ** 3).toFixed(1);

    const systemInfo = `CPU: ${cpuInfo.model}, Cores: ${
      os.cpus().length
    }, RAM: ${memoryInGiB} GiB\n`;
    const osInfo = `OS: ${os.type()}, Kernel: ${os.release()}\n`;

    const fileContent = `${systemInfo}${osInfo}`;

    await fs.writeFile(filename, fileContent);
    console.log(`System information saved to ${filename}`);
  } catch (error) {
    console.error("Error generating system information:", error);
  }
}

async function main() {
  await calculateStatistics();
  await generateSystemInfoFile();
}

main().catch(console.error);
