const AI_EXPERIMENTS = [
    {
        id: 1,
        type: 'line',
        title: 'Draw the Line',
        description: 'Drag the line to separate the magenta and orange dots. Aim for 90% accuracy.',
        fact: 'A linear classifier splits data with a straight line called a decision boundary.',
        parTime: 60,
        seed: 42,
        clusterCount: 24,
        clusters: [
            { label: 'magenta', center: [0.3, 0.65] },
            { label: 'orange', center: [0.7, 0.35] }
        ],
        hints: [
            'Try lining the boundary between the two clusters.',
            'Rotate the line to make each side mostly one color.',
            'Aim for 90% or higher accuracy to finish.'
        ],
        deepDive: {
            formula: 'w_1x + w_2y + b = 0 \\\\ \\hat{y} = \\text{sign}(w\\cdot x + b)',
            code: 'for point in points:\n  score = w1 * point.x + w2 * point.y + b\n  label = 1 if score >= 0 else 0'
        }
    },
    {
        id: 2,
        type: 'features',
        title: 'Pick the Features',
        description: 'Drag three features into the model. Find the best set to classify if an emoji is food.',
        fact: 'Feature selection can make models faster and more accurate.',
        parTime: 75,
        features: [
            { id: 'smell', label: 'Has smell' },
            { id: 'crumbs', label: 'Leaves crumbs' },
            { id: 'edible', label: 'Edible' },
            { id: 'handheld', label: 'Handheld' },
            { id: 'music', label: 'Makes music' },
            { id: 'sports', label: 'Used in sports' }
        ],
        optimalSet: ['edible', 'crumbs', 'handheld'],
        hints: [
            'Pick features tied directly to eating.',
            'One feature should exclude instruments and sports gear.',
            'Try edible + crumbs + handheld.'
        ],
        deepDive: {
            formula: '\\text{Accuracy} = \\frac{\\text{correct}}{\\text{total}}',
            code: 'selected = [f for f in features if f in model]\nscore = evaluate(selected)'
        }
    },
    {
        id: 3,
        type: 'bias',
        title: 'Spot the Bias',
        description: 'Select 8 loan applicants to train on. Make the training set balanced.',
        fact: 'Skewed training data can cause unfair model decisions.',
        parTime: 90,
        profiles: [
            { id: 'A1', group: 'A', score: 720, debt: 'Low' },
            { id: 'A2', group: 'A', score: 690, debt: 'Low' },
            { id: 'A3', group: 'A', score: 660, debt: 'Medium' },
            { id: 'A4', group: 'A', score: 740, debt: 'Low' },
            { id: 'A5', group: 'A', score: 610, debt: 'Medium' },
            { id: 'A6', group: 'A', score: 580, debt: 'High' },
            { id: 'A7', group: 'A', score: 705, debt: 'Low' },
            { id: 'A8', group: 'A', score: 630, debt: 'Medium' },
            { id: 'B1', group: 'B', score: 725, debt: 'Low' },
            { id: 'B2', group: 'B', score: 690, debt: 'Medium' },
            { id: 'B3', group: 'B', score: 645, debt: 'Medium' },
            { id: 'B4', group: 'B', score: 710, debt: 'Low' },
            { id: 'B5', group: 'B', score: 600, debt: 'High' },
            { id: 'B6', group: 'B', score: 570, debt: 'High' },
            { id: 'B7', group: 'B', score: 705, debt: 'Low' },
            { id: 'B8', group: 'B', score: 625, debt: 'Medium' }
        ],
        hints: [
            'Make sure both groups are represented equally.',
            'A balanced training set is 4 from Group A and 4 from Group B.',
            'Aim for 4/4 to remove selection bias.'
        ],
        deepDive: {
            formula: '|r_A - r_B| \\leq \\epsilon',
            code: 'rate_A = approved_A / total_A\nrate_B = approved_B / total_B'
        }
    },
    {
        id: 4,
        type: 'neuron',
        title: 'Neuron Playground',
        description: 'Tune weights and bias so the neuron matches the AND gate. Stretch goals: OR and XOR.',
        fact: 'A single neuron can learn AND/OR but not XOR.',
        parTime: 60,
        stages: ['AND', 'OR', 'XOR'],
        hints: [
            'AND needs a high threshold so only 1+1 fires.',
            'Use positive weights for both inputs.',
            'Try weights around 1 and bias around -1.5.'
        ],
        deepDive: {
            formula: '\\hat{y} = \\mathbb{1}(w\\cdot x + b \\ge 0)',
            code: 'sum = w1*x1 + w2*x2 + w3*x3 + b\noutput = 1 if sum >= 0 else 0'
        }
    },
    {
        id: 5,
        type: 'knn',
        title: 'Find Your Neighbors',
        description: 'Pick K and classify mystery points using K-Nearest Neighbors.',
        fact: 'KNN predicts by voting among the closest examples.',
        parTime: 75,
        seed: 84,
        pointCount: 28,
        hints: [
            'Small K follows local neighborhoods.',
            'Larger K smooths out noisy points.',
            'Watch which color dominates among the nearest dots.'
        ],
        deepDive: {
            formula: '\\hat{y} = \\text{mode}(y_{(1..k)})',
            code: 'neighbors = sort_by_distance(points, x)[:k]\nlabel = majority_vote(neighbors)'
        }
    },
    {
        id: 6,
        type: 'rl',
        title: 'Escape the Maze',
        description: 'Give rewards and train a tiny agent to reach the goal in a 5x5 grid.',
        fact: 'Reinforcement learning improves by rewarding good outcomes.',
        parTime: 120,
        gridSize: 5,
        start: [0, 0],
        goal: [4, 4],
        traps: [[1, 3], [3, 1], [2, 2]],
        hints: [
            'Set a positive goal reward and negative trap penalty.',
            'A small step penalty encourages shorter paths.',
            'Try +10 for goal, -5 for traps, -1 per step.'
        ],
        deepDive: {
            formula: 'Q(s,a) \\leftarrow Q(s,a) + \\alpha[r + \\gamma\\max_{a^{\\prime}} Q(s^{\\prime},a^{\\prime}) - Q(s,a)]',
            code: 'Q[s,a] += alpha * (reward + gamma * max(Q[s2]) - Q[s,a])'
        }
    },
    {
        id: 7,
        type: 'attention',
        title: 'Word Weights',
        description: 'Slide the threshold to keep the most important words for a summary.',
        fact: 'Attention scores highlight which tokens matter most for a task.',
        parTime: 75,
        sentence: 'The quick demo shows how attention picks key words for a short summary.' ,
        weights: [0.1, 0.12, 0.08, 0.18, 0.22, 0.05, 0.14, 0.2, 0.26, 0.09, 0.11, 0.07, 0.23],
        summaryIndexes: [2, 5, 8, 12],
        hints: [
            'Keep words with the highest weights.',
            'Slide until only the strongest words remain.',
            'The summary should still read sensibly.'
        ],
        deepDive: {
            formula: '\\text{softmax}(QK^T / \\sqrt{d})V',
            code: 'scores = softmax(query @ keys.T)\noutput = scores @ values'
        }
    },
    {
        id: 8,
        type: 'reply',
        title: 'Predict the Reply',
        description: 'Pick the reply a model is most likely to choose. Do this three times.',
        fact: 'Language models sample from probability distributions over tokens.',
        parTime: 90,
        roundsToWin: 3,
        scenarios: [
            {
                prompt: 'Hey! Any chance you want to grab lunch tomorrow?',
                replies: [
                    { text: 'Sure! What time works for you?', prob: 0.42 },
                    { text: 'I can\'t, sorry. Maybe next week.', prob: 0.28 },
                    { text: 'Lunch is overrated.', prob: 0.05 },
                    { text: 'Absolutely! I can do noon.', prob: 0.25 }
                ]
            },
            {
                prompt: 'My package says delivered but it\'s not here.',
                replies: [
                    { text: 'I\'m sorry about that! Let\'s check the tracking together.', prob: 0.46 },
                    { text: 'That\'s strange.', prob: 0.18 },
                    { text: 'Maybe it\'s at your neighbor\'s place.', prob: 0.22 },
                    { text: 'Please wait 24 hours and we\'ll help.', prob: 0.14 }
                ]
            },
            {
                prompt: 'Can you explain KNN in one sentence?',
                replies: [
                    { text: 'It predicts by voting among the closest examples.', prob: 0.47 },
                    { text: 'It uses backpropagation to learn weights.', prob: 0.06 },
                    { text: 'It\'s a linear separator like logistic regression.', prob: 0.12 },
                    { text: 'It clusters data into a single centroid.', prob: 0.35 }
                ]
            },
            {
                prompt: 'The meeting moved to 3 PM, can you make it?',
                replies: [
                    { text: 'Yes, 3 PM works for me.', prob: 0.5 },
                    { text: 'No, I can\'t do that.', prob: 0.2 },
                    { text: 'Meetings are canceled forever.', prob: 0.05 },
                    { text: 'I might be a few minutes late, but I\'ll join.', prob: 0.25 }
                ]
            }
        ],
        hints: [
            'Pick the safest, most helpful reply.',
            'Models favor polite, direct responses.',
            'Look for responses that answer the prompt clearly.'
        ],
        deepDive: {
            formula: 'p_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}',
            code: 'probs = softmax(logits)\nchoice = argmax(probs)'
        }
    }
];
