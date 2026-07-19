import fs from 'fs';


const content = fs.readFileSync('/tmp/file_attachments/monsternamegendat.txt', 'utf8');
const lines = content.split('\n');

const vocabList = [];
let parsingVocab = false;

for (let line of lines) {
    line = line.trim();
    if (line === '--VOCABULARY') {
        parsingVocab = true;
        continue;
    }

    if (parsingVocab && line && !line.startsWith('//')) {
        const parts = line.split(',');
        if (parts.length >= 2) {
            vocabList.push(parts[0]);
        }
    }
}

// Fallback logic if the vocabulary structure is complex, we just extract words to make ad-hoc generation.
const grammar = {
    "SEED": [
        "<ADJ> <NOUN>",
        "<ADJ> <ADJ> <NOUN>",
        "The <ADJ> <NOUN>"
    ],
    "ADJ": [],
    "NOUN": []
};

// Very rough separation based on common word patterns in the file
for(let word of vocabList) {
    if (word.endsWith('ic') || word.endsWith('al') || word.endsWith('ed') || word.endsWith('ous') || word.endsWith('ing')) {
        grammar["ADJ"].push(word);
    } else {
        grammar["NOUN"].push(word);
        grammar["ADJ"].push(word); // Many nouns act as adjectives in these
    }
}

fs.writeFileSync('./src/data/monster.json', JSON.stringify(grammar, null, 2));
console.log("Re-parsed monster.json with fallback logic.");
