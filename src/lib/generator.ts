import tavernData from '../data/tavern.json';
import monsterData from '../data/monster.json';
import swordData from '../data/sword.json';

type Grammar = Record<string, string[]>;

export function generateFromGrammar(grammar: Grammar, startSymbol: string = '<SEED>'): string {
    let result = startSymbol;
    let keepExpanding = true;
    let safetyCounter = 0;

    // Hardcode some specific Sanctum macros that show up
    const macros: Record<string, string> = {
        '<REFTHEVAR>': ' the ',
        '<REFESTABLISHMENT>': 'Tavern',
        '<REFFORM>': ' humanoid ',
        '<GENPOS>': '',
        '<GENBPOS>': '',
        '<GENBSING>': '',
        '<GENBPLUR>': 's',
        '<GENBDESC>': '',
        '<GENOBJDESC>': '',
        '<GENOBJECT>': '',
    };

    while (keepExpanding && safetyCounter < 1000) {
        keepExpanding = false;
        safetyCounter++;

        const tagRegex = /<[^>]+>/g;

        result = result.replace(tagRegex, (match) => {
            keepExpanding = true;
            const tagName = match.slice(1, -1);

            if (macros[match]) {
                return macros[match];
            }

            if (grammar[tagName] && grammar[tagName].length > 0) {
                const choices = grammar[tagName];
                return choices[Math.floor(Math.random() * choices.length)];
            } else if (grammar[match] && grammar[match].length > 0) {
                 const choices = grammar[match];
                 return choices[Math.floor(Math.random() * choices.length)];
            } else {
                // If it's a structural tag that's just a grouping like <GETOBJECT>
                // We shouldn't leave it, it might break grammar.
                // Let's just remove tags we don't understand to keep the text somewhat clean
                return '';
            }
        });
    }

    // Capitalize first letter and clean up double spaces
    result = result.replace(/\s+/g, ' ').trim();
    result = result.charAt(0).toUpperCase() + result.slice(1);

    return result;
}

export function generateTavern() {
    return generateFromGrammar(tavernData as Grammar, '<SEED>');
}

export function generateMonster() {
    return generateFromGrammar(monsterData as Grammar, '<SEED>');
}

export function generateSword() {
    return generateFromGrammar(swordData as Grammar, '<SEED>');
}
