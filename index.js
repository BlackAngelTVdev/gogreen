import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import random from "random";

const path = "./data.json";
const git = simpleGit();

async function commitAtDate(dateIso) {
  const data = { date: dateIso };
  await jsonfile.writeFile(path, data);
  await git.add([path]);
  await git.commit(dateIso, { "--date": dateIso });
}

function randomCommitDate() {
  return moment()
    .subtract(1, "y")
    .add(1, "d")
    .add(random.int(0, 54), "w")
    .add(random.int(0, 6), "d")
    .toISOString();
}

async function makeCommits(n) {
  for (let i = 0; i < n; i++) {
    const date = randomCommitDate();
    console.log(date);
    await commitAtDate(date);
  }
  await git.push();
}

makeCommits(10).catch((err) => {
  console.error("goGreen failed:", err);
  process.exitCode = 1;
});
