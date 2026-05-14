const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

const current = appJson.expo.version;
const parts = current.split('.');
parts[1] = String(parseInt(parts[1], 10) + 1);
parts[2] = '0';
const next = parts.join('.');
appJson.expo.version = next;

const currentBuild = parseInt(appJson.expo.ios.buildNumber, 10);
const nextBuild = currentBuild + 1;
appJson.expo.ios.buildNumber = String(nextBuild);

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
console.log(`Version : ${current} → ${next}`);
console.log(`iOS buildNumber : ${currentBuild} → ${nextBuild}`);
