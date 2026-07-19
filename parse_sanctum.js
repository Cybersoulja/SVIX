import fs from 'fs';
import path from 'path';

const SRC_DIR = '/tmp/file_attachments/';
const DEST_DIR = './src/data/';

function parseSanctumGrammar(filename, outputName) {
  const content = fs.readFileSync(path.join(SRC_DIR, filename), 'utf8');
  const lines = content.split('\n');

  const rules = {};
  let currentRule = null;

  for (let line of lines) {
    if (line.trim() === '' || line.startsWith('//')) {
      continue; // Skip empty lines and comments
    }

    if (!line.startsWith('\t')) {
      // It's a new rule definition (header)
      currentRule = line.trim();
      rules[currentRule] = [];
    } else {
      // It's a production for the current rule
      if (currentRule) {
         rules[currentRule].push(line.trim());
      }
    }
  }

  fs.writeFileSync(path.join(DEST_DIR, outputName), JSON.stringify(rules, null, 2));
  console.log(`Parsed ${filename} into ${outputName}`);
}

parseSanctumGrammar('tavernnamegendat.txt', 'tavern.json');
parseSanctumGrammar('monsternamegendat.txt', 'monster.json');
parseSanctumGrammar('sworddescdat.txt', 'sword.json');
