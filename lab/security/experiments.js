const SECURITY_EXPERIMENTS = [
    {
        id: 1,
        type: 'caesar',
        title: "Caesar's Secret",
        description: "Drag the cipher wheel to decode the message.",
        fact: "CAESAR USED SHIFT OF THREE",
        shift: 3,
        parTime: 60,
        hints: [
            "Start by trying a small shift like 1, 2, or 3.",
            "This one uses the classic Caesar shift.",
            "Try shift = 3."
        ]
    },
    {
        id: 2,
        type: 'caesar',
        title: "Rot13 Challenge",
        description: "Find the shift and reveal the fact. Watch for a special shift that undoes itself.",
        fact: "ROT13 IS ITS OWN INVERSE",
        shift: 13,
        parTime: 45,
        hints: [
            "Some shifts are their own reverse.",
            "Half of 26 has a special property here.",
            "Try shift = 13."
        ]
    },
    {
        id: 3,
        type: 'frequency',
        title: "Frequency Attack",
        description: "Drag the letter tiles onto the ciphertext bars to guess the most common letters.",
        fact: "THE LETTER E APPEARS MOST IN ENGLISH",
        parTime: 90,
        bars: ["Q", "L", "Z", "M", "P"],
        targetOrder: ["E", "T", "A", "O", "N"],
        hints: [
            "The most common English letter is E.",
            "The next most common letters are usually T and A.",
            "Try the order: E, T, A, O, N."
        ]
    },
    {
        id: 4,
        type: 'xor',
        title: "XOR: The Spy's Tool",
        description: "Toggle the key bits so the decoded word becomes 'XOR'.",
        fact: "XOR WITH THE SAME KEY TWICE RETURNS THE ORIGINAL",
        parTime: 60,
        plaintext: "XOR",
        keyBytes: [21, 62, 7],
        hints: [
            "Each bit flips when the key bit is 1.",
            "Try matching the output letters to X, O, R.",
            "The key is 00010101 00111110 00000111."
        ]
    },
    {
        id: 5,
        type: 'otp',
        title: "One-Time Pad",
        description: "Drag the key to encrypt, then use the same key to decrypt.",
        fact: "NEVER REUSE A ONE TIME PAD KEY",
        parTime: 45,
        hints: [
            "Encrypt first, then decrypt.",
            "A one-time pad works only if the key stays secret and unique.",
            "Use the key tile twice: once to lock, once to unlock."
        ]
    },
    {
        id: 6,
        type: 'hash',
        title: "Hash Avalanche",
        description: "Drag the flip tile onto one letter to change it. Watch the hash jump.",
        fact: "SMALL CHANGES CREATE BIG HASH CHANGES",
        parTime: 45,
        word: "HASH",
        hints: [
            "Change just one letter.",
            "Any single change should wildly change the hash.",
            "Drag the flip tile onto a letter tile."
        ]
    },
    {
        id: 7,
        type: 'collision',
        title: "Collision Hunt",
        description: "Generate inputs and drag two matching hashes into the slots.",
        fact: "WEAK HASHES MAKE COLLISIONS EASY",
        parTime: 75,
        alphabet: "ABCDE",
        length: 3,
        hints: [
            "Weak hashes collide often.",
            "Try generating several inputs quickly.",
            "Look for the same 2-digit hash on different tiles."
        ]
    },
    {
        id: 8,
        type: 'public',
        title: "Public & Private Keys",
        description: "Drag the public lock to encrypt, then the private key to decrypt.",
        fact: "PUBLIC LOCKS PRIVATE UNLOCKS",
        parTime: 60,
        hints: [
            "Public keys can lock messages.",
            "Only the private key can unlock.",
            "Lock with public, unlock with private."
        ]
    }
];
