window.AiViz = (function () {
    function clearCanvas(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    function drawScatter(ctx, points, line, testPoint, neighbors) {
        clearCanvas(ctx);
        const { width, height } = ctx.canvas;
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(0, 0, width, height);

        if (line) {
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(line.x1 * width, line.y1 * height);
            ctx.lineTo(line.x2 * width, line.y2 * height);
            ctx.stroke();
        }

        points.forEach(point => {
            ctx.beginPath();
            ctx.fillStyle = point.label === 'magenta' ? '#ff4fd8' : '#ff9f3d';
            ctx.arc(point.x * width, point.y * height, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        if (testPoint) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(testPoint.x * width, testPoint.y * height, 7, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (neighbors && testPoint) {
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
            neighbors.forEach(p => {
                ctx.beginPath();
                ctx.moveTo(testPoint.x * width, testPoint.y * height);
                ctx.lineTo(p.x * width, p.y * height);
                ctx.stroke();
            });
        }
    }

    function drawMaze(ctx, gridSize, start, goal, traps, agent, values) {
        clearCanvas(ctx);
        const { width, height } = ctx.canvas;
        const cell = Math.min(width, height) / gridSize;
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(0, 0, width, height);

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const value = values ? values[r][c] : 0;
                const intensity = Math.min(1, Math.max(0, (value + 5) / 10));
                ctx.fillStyle = `rgba(0, 255, 136, ${0.08 + intensity * 0.35})`;
                ctx.fillRect(c * cell, r * cell, cell, cell);
                ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                ctx.strokeRect(c * cell, r * cell, cell, cell);
            }
        }

        traps.forEach(([r, c]) => {
            ctx.fillStyle = 'rgba(255, 80, 80, 0.45)';
            ctx.fillRect(c * cell, r * cell, cell, cell);
        });

        ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.fillRect(goal[1] * cell, goal[0] * cell, cell, cell);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(agent[1] * cell + cell / 2, agent[0] * cell + cell / 2, cell * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawHeatmapWords(container, words, weights, threshold) {
        container.innerHTML = '';
        words.forEach((word, index) => {
            const span = document.createElement('span');
            span.className = 'attention-word';
            const weight = weights[index] ?? 0;
            const alpha = 0.15 + weight * 0.7;
            span.style.background = `rgba(0, 240, 255, ${alpha})`;
            if (weight < threshold) {
                span.classList.add('faded');
            }
            span.textContent = `${word} `;
            container.appendChild(span);
        });
    }

    function drawLossGraph(ctx, losses) {
        clearCanvas(ctx);
        const { width, height } = ctx.canvas;
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        losses.forEach((loss, index) => {
            const x = (index / Math.max(1, losses.length - 1)) * (width - 20) + 10;
            const y = height - 10 - (loss * (height - 20));
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    return {
        drawScatter,
        drawMaze,
        drawHeatmapWords,
        drawLossGraph
    };
})();
