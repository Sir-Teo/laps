class RacingLineOptimizer {
    constructor() {
        this.canvas = document.getElementById('trackCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentMode = 'inner'; // 'inner' or 'outer'
        this.innerBoundary = [];
        this.outerBoundary = [];
        this.racingLine = [];
        
        this.setupEventListeners();
        this.updateStatus('Ready to draw inner boundary');
    }

    setupEventListeners() {
        // Button event listeners
        document.getElementById('drawInnerBtn').addEventListener('click', () => this.setMode('inner'));
        document.getElementById('drawOuterBtn').addEventListener('click', () => this.setMode('outer'));
        document.getElementById('clearBtn').addEventListener('click', () => this.clearTrack());
        document.getElementById('computeBtn').addEventListener('click', () => this.computeRacingLine());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());

        // Canvas event listeners
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
    }

    setMode(mode) {
        this.currentMode = mode;
        
        // Update button states
        document.querySelectorAll('.btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`draw${mode.charAt(0).toUpperCase() + mode.slice(1)}Btn`).classList.add('active');
        
        this.updateStatus(`Ready to draw ${mode} boundary`);
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        
        if (this.currentMode === 'inner') {
            this.innerBoundary = [pos];
        } else {
            this.outerBoundary = [pos];
        }
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        
        if (this.currentMode === 'inner') {
            this.innerBoundary.push(pos);
        } else {
            this.outerBoundary.push(pos);
        }
        
        this.render();
    }

    stopDrawing() {
        this.isDrawing = false;
        
        if (this.currentMode === 'inner' && this.innerBoundary.length > 0) {
            this.updateStatus('Inner boundary drawn. Switch to outer boundary.');
        } else if (this.currentMode === 'outer' && this.outerBoundary.length > 0) {
            this.updateStatus('Outer boundary drawn. Ready to compute racing line.');
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw inner boundary
        if (this.innerBoundary.length > 1) {
            this.drawPath(this.innerBoundary, '#2196F3', 3);
        }
        
        // Draw outer boundary
        if (this.outerBoundary.length > 1) {
            this.drawPath(this.outerBoundary, '#f44336', 3);
        }
        
        // Draw racing line
        if (this.racingLine.length > 1) {
            this.drawPath(this.racingLine, '#4CAF50', 4);
        }
    }

    drawPath(points, color, width) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        
        this.ctx.stroke();
    }

    clearTrack() {
        this.innerBoundary = [];
        this.outerBoundary = [];
        this.racingLine = [];
        this.render();
        this.updateStatus('Track cleared. Ready to draw inner boundary.');
        this.setMode('inner');
    }

    reset() {
        this.clearTrack();
    }

    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
    }

    computeRacingLine() {
        if (this.innerBoundary.length === 0 || this.outerBoundary.length === 0) {
            this.updateStatus('Please draw both inner and outer boundaries first.');
            return;
        }

        this.updateStatus('Computing optimal racing line...');
        
        // Normalize boundaries to have similar number of points
        const innerNormalized = this.normalizePoints(this.innerBoundary, 100);
        const outerNormalized = this.normalizePoints(this.outerBoundary, 100);
        
        // Compute racing line
        this.racingLine = this.calculateOptimalPath(innerNormalized, outerNormalized);
        
        // Smooth the racing line
        this.racingLine = this.smoothPath(this.racingLine);
        
        this.render();
        this.updateStatus('Racing line computed! Green line shows the optimal path.');
    }

    normalizePoints(points, targetCount) {
        if (points.length <= targetCount) return points;
        
        const normalized = [];
        const step = points.length / targetCount;
        
        for (let i = 0; i < targetCount; i++) {
            const index = Math.floor(i * step);
            normalized.push(points[index]);
        }
        
        return normalized;
    }

    calculateOptimalPath(inner, outer) {
        const racingLine = [];
        const minLength = Math.min(inner.length, outer.length);
        
        for (let i = 0; i < minLength; i++) {
            const innerPoint = inner[i];
            const outerPoint = outer[i];
            
            // Calculate the optimal position between inner and outer boundaries
            // This is a simplified racing line calculation
            const t = this.calculateOptimalPosition(i, minLength, inner, outer);
            
            const x = innerPoint.x + t * (outerPoint.x - innerPoint.x);
            const y = innerPoint.y + t * (outerPoint.y - innerPoint.y);
            
            racingLine.push({ x, y });
        }
        
        return racingLine;
    }

    calculateOptimalPosition(index, total, inner, outer) {
        // Simplified racing line algorithm
        // The idea is to stay on the outside of corners, cut to the inside at the apex,
        // and return to the outside
        
        const progress = index / total;
        const windowSize = Math.min(10, Math.floor(total / 10));
        
        // Calculate local curvature
        const curvature = this.calculateLocalCurvature(index, windowSize, inner, outer);
        
        // For straight sections, prefer the racing line closer to the inside
        // For corners, calculate the optimal position based on curvature
        let t = 0.3; // Default position (closer to inner)
        
        if (Math.abs(curvature) > 0.1) {
            // This is a corner
            if (curvature > 0) {
                // Right turn - stay outside before, inside at apex, outside after
                t = 0.7 - 0.4 * Math.sin(progress * Math.PI);
            } else {
                // Left turn - similar logic
                t = 0.3 + 0.4 * Math.sin(progress * Math.PI);
            }
        }
        
        return Math.max(0, Math.min(1, t));
    }

    calculateLocalCurvature(index, windowSize, inner, outer) {
        const start = Math.max(0, index - windowSize);
        const end = Math.min(inner.length - 1, index + windowSize);
        
        if (end - start < 3) return 0;
        
        // Calculate average direction change
        let totalAngleChange = 0;
        let count = 0;
        
        for (let i = start + 1; i < end; i++) {
            const prev = inner[i - 1];
            const curr = inner[i];
            const next = inner[i + 1];
            
            const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
            const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
            
            let angleDiff = angle2 - angle1;
            
            // Normalize angle difference
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            totalAngleChange += angleDiff;
            count++;
        }
        
        return count > 0 ? totalAngleChange / count : 0;
    }

    smoothPath(path) {
        if (path.length < 3) return path;
        
        const smoothed = [];
        const alpha = 0.8; // Smoothing factor
        
        // Add first point
        smoothed.push(path[0]);
        
        // Smooth intermediate points
        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            const next = path[i + 1];
            
            const x = alpha * curr.x + (1 - alpha) * (prev.x + next.x) / 2;
            const y = alpha * curr.y + (1 - alpha) * (prev.y + next.y) / 2;
            
            smoothed.push({ x, y });
        }
        
        // Add last point
        smoothed.push(path[path.length - 1]);
        
        return smoothed;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RacingLineOptimizer();
}); 