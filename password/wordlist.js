(function () {
    const seed = [
        'password', '123456', '123456789', 'qwerty', 'abc123', 'password1', '111111', 'letmein', 'monkey',
        'dragon', 'baseball', 'iloveyou', 'trustno1', 'welcome', 'admin', 'football', 'sunshine', 'shadow',
        'master', 'hello', 'freedom', 'whatever', 'princess', 'flower', 'cheese', 'pokemon', 'donald',
        'batman', 'superman', 'starwars', 'lovely', 'hello123', 'password123', 'qwerty123', 'qazwsx',
        '1qaz2wsx', '12345', '1234567', '12345678', '1234567890', '987654321', '000000', '11111111',
        'abc12345', 'passw0rd', 'p@ssw0rd', 'charlie', 'hannah', 'samsung', 'michael', 'jordan',
        'killer', 'secret', 'cookie', 'pepper', 'pepper123', 'silver', 'orange', 'purple', 'yellow',
        'taylor', 'jessica', 'soccer', 'hockey', 'qwertyuiop', 'asdfgh', 'asdfghjkl', 'zxcvbn',
        'zaq12wsx', '1q2w3e4r', 'qwe123', 'qweqwe', 'qwert', 'pass', 'login', 'guest', 'test',
        'changeme', 'default', 'letmein123', 'welcome1', 'admin123', 'root', 'root123'
    ];

    const keyboardPatterns = [
        'qwerty', 'asdfgh', 'zxcvbn', 'qazwsx', '1qaz2wsx', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
        '12345', '123456', '1234567', '12345678', '123456789', '1234567890', '0987654321',
        '147258', '159753', '2580', '369', '741852'
    ];

    const names = [
        'alex', 'maria', 'james', 'sarah', 'chris', 'jordan', 'taylor', 'sam', 'emily', 'linda',
        'michelle', 'andrew', 'josh', 'daniel', 'jennifer', 'nicole', 'robert', 'amanda', 'steven', 'lisa'
    ];

    const words = [
        'summer', 'winter', 'spring', 'autumn', 'coffee', 'cookie', 'dragon', 'shadow', 'sunshine', 'planet',
        'galaxy', 'music', 'future', 'rocket', 'school', 'purple', 'orange', 'yellow', 'silver', 'crystal'
    ];

    const list = new Set(seed);

    keyboardPatterns.forEach(pattern => list.add(pattern));

    names.forEach(name => {
        list.add(name);
        list.add(`${name}123`);
        list.add(`${name}1`);
        list.add(`${name}2024`);
        list.add(`${name}2025`);
    });

    words.forEach(word => {
        list.add(word);
        list.add(`${word}123`);
        list.add(`${word}!`);
        list.add(`${word}2024`);
        list.add(`${word}2025`);
    });

    for (let year = 1990; year <= 2025; year += 1) {
        list.add(String(year));
        list.add(`password${year}`);
        list.add(`summer${year}`);
        list.add(`winter${year}`);
    }

    for (let i = 1; i <= 50; i += 1) {
        list.add(`${i}${i}${i}${i}`);
        list.add(`${i}${i}${i}${i}${i}`);
    }

    for (let i = 0; i < words.length && list.size < 1000; i += 1) {
        for (let number = 0; number < 300 && list.size < 1000; number += 1) {
            list.add(`${words[i]}${number}`);
            list.add(`${words[i]}_${number}`);
            list.add(`${words[i]}-${number}`);
            list.add(`${words[i]}!${number}`);
        }
    }

    window.PASSWORD_WORDLIST = Array.from(list).slice(0, 1000);
})();
