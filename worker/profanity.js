const BLOCKED_TERMS = [
    'ass', 'asshole', 'bastard', 'bitch', 'bollocks', 'boner', 'boob', 'boobs', 'bullshit',
    'clit', 'cock', 'coon', 'crap', 'cuck', 'cum', 'cunt', 'dam', 'damn', 'dic', 'dick',
    'dik', 'dildo', 'douche', 'fag', 'faggot', 'fck', 'fk', 'fuc', 'fuck', 'fucker',
    'fucking', 'fuk', 'goddamn', 'hell', 'homo', 'idiot', 'jackass', 'jerkoff', 'jiz',
    'jizz', 'jyz', 'kike', 'klit', 'kum', 'kunt', 'loser', 'mf', 'mfer', 'motherfucker',
    'nazi', 'nigga', 'nigger', 'nutsack', 'paki', 'penis', 'piss', 'porn', 'prick',
    'pus', 'puss', 'pussy', 'retard', 'scrotum', 'sex', 'shit', 'slut', 'sperm', 'spic',
    'spurm', 'suck', 'tit', 'tits', 'twat', 'vagina', 'wank', 'whore'
];

const LEET_MAP = {
    '@': 'a',
    '4': 'a',
    '3': 'e',
    '1': 'i',
    '!': 'i',
    '0': 'o',
    '$': 's',
    '5': 's',
    '7': 't'
};

const NAME_REGEX = /^[A-Za-z0-9 ]{3,10}$/;

function normalizeName(value) {
    const base = value.toLowerCase();
    let normalized = '';
    for (const ch of base) {
        normalized += LEET_MAP[ch] || ch;
    }
    return normalized.replace(/\s+/g, '');
}

export function validatePlayerName(name) {
    if (typeof name !== 'string') {
        return { valid: false, reason: 'Name not allowed' };
    }

    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 10) {
        return { valid: false, reason: 'Name must be 3-10 characters' };
    }

    if (!NAME_REGEX.test(trimmed)) {
        return { valid: false, reason: 'Use letters, numbers, and spaces only' };
    }

    const normalized = normalizeName(trimmed);
    const blocked = BLOCKED_TERMS.some(term => normalized.includes(term));
    if (blocked) {
        return { valid: false, reason: 'Name not allowed' };
    }

    return { valid: true, name: trimmed };
}

export { BLOCKED_TERMS };
