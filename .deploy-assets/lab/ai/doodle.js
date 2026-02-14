window.DoodleLab = (function () {
    function loadTF() {
        if (window.tf) return Promise.resolve(window.tf);
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.16.0/dist/tf.min.js';
            script.onload = () => resolve(window.tf);
            script.onerror = () => reject(new Error('TF load failed'));
            document.head.appendChild(script);
        });
    }

    function createButton(label, className) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.className = className;
        return btn;
    }

    function DoodleLab(container) {
        this.container = container;
        this.samples = [];
        this.labels = ['Circle', 'Square', 'Triangle'];
        this.activeLabel = null;
        this.model = null;
        this.losses = [];
        this.prototypeMap = {};
        this.ready = false;

        const canvas = document.createElement('canvas');
        canvas.width = 280;
        canvas.height = 280;
        canvas.className = 'ai-canvas';
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const lossCanvas = document.createElement('canvas');
        lossCanvas.width = 280;
        lossCanvas.height = 120;
        lossCanvas.className = 'ai-canvas small';
        const lossCtx = lossCanvas.getContext('2d');

        const status = document.createElement('div');
        status.className = 'raised-tile';
        status.textContent = 'Draw a shape, pick a label, add samples, then train.';

        const labelRow = document.createElement('div');
        labelRow.className = 'choice-row';
        const labelButtons = this.labels.map(label => {
            const btn = createButton(label, 'choice-btn');
            btn.addEventListener('click', () => {
                labelButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeLabel = label;
            });
            labelRow.appendChild(btn);
            return btn;
        });

        const actions = document.createElement('div');
        actions.className = 'maze-controls';
        const addBtn = createButton('Add Sample', 'maze-btn');
        const trainBtn = createButton('Train', 'maze-btn');
        const predictBtn = createButton('Predict', 'maze-btn');
        const clearBtn = createButton('Clear', 'maze-btn');
        actions.append(addBtn, trainBtn, predictBtn, clearBtn);

        const sampleCount = document.createElement('div');
        sampleCount.className = 'raised-tile';
        sampleCount.textContent = 'Samples: 0';

        container.appendChild(canvas);
        container.appendChild(labelRow);
        container.appendChild(actions);
        container.appendChild(sampleCount);
        container.appendChild(lossCanvas);
        container.appendChild(status);

        let drawing = false;
        const pointer = (event) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: (event.clientX - rect.left) * (canvas.width / rect.width),
                y: (event.clientY - rect.top) * (canvas.height / rect.height)
            };
        };

        const startDraw = (event) => {
            drawing = true;
            canvas.setPointerCapture(event.pointerId);
            const pos = pointer(event);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        };

        const draw = (event) => {
            if (!drawing) return;
            const pos = pointer(event);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        };

        const endDraw = () => {
            drawing = false;
        };

        canvas.addEventListener('pointerdown', startDraw);
        canvas.addEventListener('pointermove', draw);
        canvas.addEventListener('pointerup', endDraw);
        canvas.addEventListener('pointerleave', endDraw);

        function getVector() {
            const downscale = document.createElement('canvas');
            downscale.width = 28;
            downscale.height = 28;
            const dctx = downscale.getContext('2d');
            dctx.drawImage(canvas, 0, 0, 28, 28);
            const data = dctx.getImageData(0, 0, 28, 28).data;
            const out = [];
            for (let i = 0; i < data.length; i += 4) {
                const value = data[i] / 255;
                out.push(value);
            }
            return out;
        }

        const updatePrototype = () => {
            const sums = {};
            const counts = {};
            this.labels.forEach(label => {
                sums[label] = new Array(784).fill(0);
                counts[label] = 0;
            });
            this.samples.forEach(sample => {
                counts[sample.label] += 1;
                sample.data.forEach((v, idx) => {
                    sums[sample.label][idx] += v;
                });
            });
            this.labels.forEach(label => {
                const count = Math.max(1, counts[label]);
                this.prototypeMap[label] = sums[label].map(v => v / count);
            });
        };

        addBtn.addEventListener('click', () => {
            if (!this.activeLabel) {
                status.textContent = 'Pick a label first.';
                return;
            }
            const data = getVector();
            this.samples.push({ label: this.activeLabel, data });
            updatePrototype();
            sampleCount.textContent = `Samples: ${this.samples.length}`;
            status.textContent = `Added ${this.activeLabel} sample.`;
        });

        clearBtn.addEventListener('click', () => {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });

        trainBtn.addEventListener('click', async () => {
            if (this.samples.length < 6) {
                status.textContent = 'Add at least 6 samples (2 per class) to train.';
                return;
            }
            status.textContent = 'Loading training engine...';
            try {
                const tf = await loadTF();
                const xs = tf.tensor2d(this.samples.map(s => s.data));
                const labels = this.samples.map(s => this.labels.indexOf(s.label));
                const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), 3);
                if (!this.model) {
                    this.model = tf.sequential();
                    this.model.add(tf.layers.dense({ inputShape: [784], units: 64, activation: 'relu' }));
                    this.model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
                    this.model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });
                }
                this.losses = [];
                await this.model.fit(xs, ys, {
                    epochs: 12,
                    batchSize: 8,
                    callbacks: {
                        onEpochEnd: (_, logs) => {
                            const loss = Math.min(1, Math.max(0, logs.loss));
                            this.losses.push(loss);
                            window.AiViz.drawLossGraph(lossCtx, this.losses);
                        }
                    }
                });
                xs.dispose();
                ys.dispose();
                this.ready = true;
                status.textContent = 'Training complete. Try predicting!';
            } catch (err) {
                status.textContent = 'Training engine failed to load. Using simple matching instead.';
                this.ready = false;
            }
        });

        predictBtn.addEventListener('click', async () => {
            if (this.samples.length < 3) {
                status.textContent = 'Add samples first.';
                return;
            }
            const vector = getVector();
            let result = 'Unknown';
            if (this.model && window.tf && this.ready) {
                const tf = window.tf;
                const xs = tf.tensor2d([vector]);
                const preds = this.model.predict(xs);
                const data = await preds.data();
                xs.dispose();
                preds.dispose();
                const maxIndex = data.indexOf(Math.max(...data));
                result = this.labels[maxIndex];
            } else {
                updatePrototype();
                let bestScore = Infinity;
                this.labels.forEach(label => {
                    const proto = this.prototypeMap[label];
                    let dist = 0;
                    for (let i = 0; i < vector.length; i++) {
                        const diff = vector[i] - proto[i];
                        dist += diff * diff;
                    }
                    if (dist < bestScore) {
                        bestScore = dist;
                        result = label;
                    }
                });
            }
            status.textContent = `Prediction: ${result}`;
        });
    }

    return {
        DoodleLab
    };
})();
