// ========== LEVELS DATA ==========
const LEVELS = [
    {
        id: 1,
        title: "Meet the AND Gate",
        description: "The AND gate outputs 1 only when <strong>ALL</strong> inputs are 1. Drag two Switches and one LED onto the canvas. Connect both switches to the AND gate inputs, then connect the AND output to the LED.",
        goal: "Turn both switches ON to light the LED!",
        hint: "Think of AND like a series circuit - both switches must be closed.",
        requiredGates: ["AND"],
        preplacedGates: [
            { type: "AND", x: 300, y: 200 }
        ],
        successCondition: (circuit) => {
            // Check if any LED is ON
            return circuit.gates.some(g => g.type === 'LED' && g.output === 1);
        }
    },
    {
        id: 2,
        title: "The OR Gate",
        description: "The OR gate outputs 1 when <strong>ANY</strong> input is 1. It only outputs 0 when all inputs are 0.",
        goal: "Light the LED using just ONE switch!",
        hint: "OR is like a parallel circuit - either path works.",
        requiredGates: ["OR"],
        preplacedGates: [
            { type: "OR", x: 300, y: 200 },
            { type: "SWITCH", x: 100, y: 150 },
            { type: "SWITCH", x: 100, y: 250 },
            { type: "LED", x: 500, y: 200 }
        ],
        successCondition: (circuit) => {
            return circuit.gates.some(g => g.type === 'LED' && g.output === 1);
        }
    },
    {
        id: 3,
        title: "The NOT Gate (Inverter)",
        description: "The NOT gate <strong>inverts</strong> its input. If input is 1, output is 0. If input is 0, output is 1. It only has ONE input.",
        goal: "Light the LED when the switch is OFF!",
        hint: "NOT flips the signal - 0 becomes 1, 1 becomes 0.",
        requiredGates: ["NOT"],
        preplacedGates: [
            { type: "NOT", x: 300, y: 200 }
        ],
        successCondition: (circuit) => {
            const led = circuit.gates.find(g => g.type === 'LED');
            const sw = circuit.gates.find(g => g.type === 'SWITCH');
            // LED should be ON when switch is OFF
            return led && sw && led.output === 1 && sw.output === 0;
        }
    },
    {
        id: 4,
        title: "NAND - The Universal Gate",
        description: "NAND is AND followed by NOT. It outputs 0 <strong>only</strong> when all inputs are 1. Fun fact: You can build ANY other gate using just NAND gates!",
        goal: "Light the LED, then turn BOTH switches on to turn it OFF.",
        hint: "NAND = NOT(AND). It's the opposite of AND.",
        requiredGates: ["NAND"],
        preplacedGates: [
            { type: "NAND", x: 300, y: 200 },
            { type: "SWITCH", x: 100, y: 150 },
            { type: "SWITCH", x: 100, y: 250 },
            { type: "LED", x: 500, y: 200 }
        ],
        successCondition: (circuit) => {
            const led = circuit.gates.find(g => g.type === 'LED');
            const switches = circuit.gates.filter(g => g.type === 'SWITCH');
            // LED OFF when both switches ON
            return led && led.output === 0 && switches.every(s => s.output === 1);
        }
    },
    {
        id: 5,
        title: "NOR Gate",
        description: "NOR is OR followed by NOT. It outputs 1 <strong>only</strong> when all inputs are 0. Like NAND, NOR is also a universal gate!",
        goal: "Keep both switches OFF to light the LED.",
        hint: "NOR = NOT(OR). Only outputs 1 when everything is 0.",
        requiredGates: ["NOR"],
        preplacedGates: [
            { type: "NOR", x: 300, y: 200 }
        ],
        successCondition: (circuit) => {
            const led = circuit.gates.find(g => g.type === 'LED');
            const switches = circuit.gates.filter(g => g.type === 'SWITCH');
            return led && led.output === 1 && switches.every(s => s.output === 0);
        }
    },
    {
        id: 6,
        title: "XOR - Exclusive OR",
        description: "XOR outputs 1 when inputs are <strong>different</strong>. If both inputs are the same (both 0 or both 1), it outputs 0.",
        goal: "Light the LED by making the switches DIFFERENT.",
        hint: "XOR is like asking 'Are these different?'",
        requiredGates: ["XOR"],
        preplacedGates: [
            { type: "XOR", x: 300, y: 200 },
            { type: "SWITCH", x: 100, y: 150 },
            { type: "SWITCH", x: 100, y: 250 },
            { type: "LED", x: 500, y: 200 }
        ],
        successCondition: (circuit) => {
            return circuit.gates.some(g => g.type === 'LED' && g.output === 1);
        }
    },
    {
        id: 7,
        title: "XNOR - Equality Checker",
        description: "XNOR outputs 1 when inputs are the <strong>same</strong>. It's the opposite of XOR - think of it as an equality checker!",
        goal: "Light the LED by making both switches the SAME.",
        hint: "XNOR asks 'Are these equal?'",
        requiredGates: ["XNOR"],
        preplacedGates: [
            { type: "XNOR", x: 300, y: 200 }
        ],
        successCondition: (circuit) => {
            const led = circuit.gates.find(g => g.type === 'LED');
            const switches = circuit.gates.filter(g => g.type === 'SWITCH');
            if (!led || switches.length < 2) return false;
            return led.output === 1 && (switches[0].output === switches[1].output);
        }
    },
    {
        id: 8,
        title: "Build a NOT from NAND",
        description: "Since NAND is universal, you can build a NOT gate using just NAND! Connect both inputs of a NAND gate to the same source.",
        goal: "Create an inverter using only a NAND gate.",
        hint: "What happens when both NAND inputs are the same?",
        requiredGates: ["NAND"],
        preplacedGates: [
            { type: "SWITCH", x: 100, y: 200 },
            { type: "LED", x: 500, y: 200 }
        ],
        successCondition: (circuit) => {
            const led = circuit.gates.find(g => g.type === 'LED');
            const sw = circuit.gates.find(g => g.type === 'SWITCH');
            // Test inverter behavior - LED should be opposite of switch
            return led && sw && led.output === (sw.output === 0 ? 1 : 0);
        }
    },
    {
        id: 9,
        title: "Two-Input Controlled Light",
        description: "Build a circuit where the LED only turns on when Switch A is ON and Switch B is OFF. Use what you've learned!",
        goal: "LED on ONLY when: A=ON, B=OFF",
        hint: "You might need to invert one of the signals...",
        requiredGates: [],
        preplacedGates: [
            { type: "SWITCH", x: 100, y: 150 },
            { type: "SWITCH", x: 100, y: 250 },
            { type: "LED", x: 500, y: 200 }
        ],
        successCondition: (circuit) => {
            // Complex check - would need to test multiple states
            const led = circuit.gates.find(g => g.type === 'LED');
            const switches = circuit.gates.filter(g => g.type === 'SWITCH');
            if (!led || switches.length < 2) return false;
            // A=1, B=0 -> LED=1
            return led.output === 1 && switches[0].output === 1 && switches[1].output === 0;
        }
    },
    {
        id: 10,
        title: "Sandbox Unlocked! 🎉",
        description: "Congratulations! You've learned all the basic logic gates. Now experiment freely in Sandbox mode, or try building more complex circuits like a half-adder!",
        goal: "You did it! Try Sandbox mode for unlimited creativity.",
        hint: "Click 'Sandbox' in the top bar to build freely!",
        requiredGates: [],
        preplacedGates: [],
        successCondition: () => true
    }
];

// Gate definitions with truth tables
const GATE_INFO = {
    AND: {
        name: "AND Gate",
        description: "Outputs 1 only when ALL inputs are 1",
        inputs: 2,
        truthTable: [
            [0, 0, 0],
            [0, 1, 0],
            [1, 0, 0],
            [1, 1, 1]
        ],
        evaluate: (a, b) => a && b ? 1 : 0
    },
    OR: {
        name: "OR Gate",
        description: "Outputs 1 when ANY input is 1",
        inputs: 2,
        truthTable: [
            [0, 0, 0],
            [0, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ],
        evaluate: (a, b) => a || b ? 1 : 0
    },
    NOT: {
        name: "NOT Gate (Inverter)",
        description: "Inverts the input: 0→1, 1→0",
        inputs: 1,
        truthTable: [
            [0, 1],
            [1, 0]
        ],
        evaluate: (a) => a ? 0 : 1
    },
    NAND: {
        name: "NAND Gate",
        description: "NOT + AND: Outputs 0 only when ALL inputs are 1",
        inputs: 2,
        truthTable: [
            [0, 0, 1],
            [0, 1, 1],
            [1, 0, 1],
            [1, 1, 0]
        ],
        evaluate: (a, b) => (a && b) ? 0 : 1
    },
    NOR: {
        name: "NOR Gate",
        description: "NOT + OR: Outputs 1 only when ALL inputs are 0",
        inputs: 2,
        truthTable: [
            [0, 0, 1],
            [0, 1, 0],
            [1, 0, 0],
            [1, 1, 0]
        ],
        evaluate: (a, b) => (a || b) ? 0 : 1
    },
    XOR: {
        name: "XOR Gate",
        description: "Outputs 1 when inputs are DIFFERENT",
        inputs: 2,
        truthTable: [
            [0, 0, 0],
            [0, 1, 1],
            [1, 0, 1],
            [1, 1, 0]
        ],
        evaluate: (a, b) => a !== b ? 1 : 0
    },
    XNOR: {
        name: "XNOR Gate",
        description: "Outputs 1 when inputs are the SAME",
        inputs: 2,
        truthTable: [
            [0, 0, 1],
            [0, 1, 0],
            [1, 0, 0],
            [1, 1, 1]
        ],
        evaluate: (a, b) => a === b ? 1 : 0
    },
    SWITCH: {
        name: "Switch (Input)",
        description: "Click to toggle between 0 and 1",
        inputs: 0,
        truthTable: [],
        evaluate: () => 0 // Handled separately
    },
    LED: {
        name: "LED (Output)",
        description: "Lights up when input is 1",
        inputs: 1,
        truthTable: [],
        evaluate: (a) => a ? 1 : 0
    }
};
