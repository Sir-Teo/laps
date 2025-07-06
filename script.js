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
        
        // Draw racing line with speed visualization
        if (this.racingLine.length > 1) {
            this.drawRacingLineWithSpeed();
        }
    }

    drawRacingLineWithSpeed() {
        if (!this.trackAnalysis) return;
        
        const ctx = this.ctx;
        const lineWidth = 6;
        
        for (let i = 1; i < this.racingLine.length; i++) {
            const prev = this.racingLine[i - 1];
            const curr = this.racingLine[i];
            
            // Get speed for this segment
            const speed = this.trackAnalysis[i] ? this.trackAnalysis[i].speed : 150;
            const color = this.getSpeedColor(speed);
            
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();
        }
    }

    getSpeedColor(speed) {
        // Color gradient based on speed: red (slow) -> yellow -> green (fast)
        if (speed < 80) return '#ff0000';      // Red for very slow
        if (speed < 120) return '#ff6600';     // Orange for slow
        if (speed < 150) return '#ffcc00';     // Yellow for medium
        if (speed < 180) return '#66cc00';     // Light green for fast
        return '#00ff00';                      // Green for very fast
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
        this.trackAnalysis = null;
        this.render();
        this.updateStatus('Track cleared. Ready to draw inner boundary.');
        this.setMode('inner');
        document.getElementById('speedLegend').style.display = 'none';
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
        
        // Create a more sophisticated racing line using track centerline and optimization
        this.racingLine = this.computeAdvancedRacingLine();
        
        this.render();
        
        // Calculate estimated lap time
        const lapTime = this.calculateLapTime();
        this.updateStatus(`Racing line computed! Estimated lap time: ${lapTime.toFixed(2)}s. Color-coded line shows optimal path with speed zones.`);
        document.getElementById('speedLegend').style.display = 'block';
    }

    computeAdvancedRacingLine() {
        // Step 1: Create a centerline from the track boundaries
        const centerline = this.createCenterline();
        
        // Step 2: Analyze track geometry to identify corners and straights
        this.trackAnalysis = this.analyzeTrackGeometry(centerline);
        
        // Step 3: Generate optimal racing line based on track analysis
        const racingLine = this.generateOptimalRacingLine(centerline, this.trackAnalysis);
        
        // Step 4: Apply advanced smoothing
        return this.applyAdvancedSmoothing(racingLine);
    }

    createCenterline() {
        const centerline = [];
        const innerPoints = this.resamplePath(this.innerBoundary, 200);
        const outerPoints = this.resamplePath(this.outerBoundary, 200);
        
        // Create centerline by finding the midpoint between corresponding points
        const minLength = Math.min(innerPoints.length, outerPoints.length);
        
        for (let i = 0; i < minLength; i++) {
            const inner = innerPoints[i];
            const outer = outerPoints[i];
            
            centerline.push({
                x: (inner.x + outer.x) / 2,
                y: (inner.y + outer.y) / 2,
                width: this.calculateTrackWidth(inner, outer)
            });
        }
        
        return centerline;
    }

    resamplePath(points, targetCount) {
        if (points.length <= 2) return points;
        
        const totalLength = this.calculatePathLength(points);
        const step = totalLength / (targetCount - 1);
        
        const resampled = [points[0]];
        let currentDistance = 0;
        let currentIndex = 0;
        
        for (let i = 1; i < targetCount - 1; i++) {
            const targetDistance = i * step;
            
            while (currentDistance < targetDistance && currentIndex < points.length - 1) {
                const segmentLength = this.distance(points[currentIndex], points[currentIndex + 1]);
                currentDistance += segmentLength;
                currentIndex++;
            }
            
            if (currentIndex < points.length - 1) {
                const prev = points[currentIndex - 1];
                const next = points[currentIndex];
                const segmentLength = this.distance(prev, next);
                const t = (targetDistance - (currentDistance - segmentLength)) / segmentLength;
                
                resampled.push({
                    x: prev.x + t * (next.x - prev.x),
                    y: prev.y + t * (next.y - prev.y)
                });
            }
        }
        
        resampled.push(points[points.length - 1]);
        return resampled;
    }

    calculatePathLength(points) {
        let length = 0;
        for (let i = 1; i < points.length; i++) {
            length += this.distance(points[i - 1], points[i]);
        }
        return length;
    }

    distance(p1, p2) {
        return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    }

    calculateTrackWidth(inner, outer) {
        return this.distance(inner, outer);
    }

    analyzeTrackGeometry(centerline) {
        const analysis = [];
        const windowSize = 15;
        
        for (let i = 0; i < centerline.length; i++) {
            const curvature = this.calculateCurvature(centerline, i, windowSize);
            const trackWidth = centerline[i].width;
            const speed = this.calculateOptimalSpeed(curvature, trackWidth);
            const turnRadius = this.calculateTurnRadius(curvature);
            const isBrakingZone = this.isBrakingZone(centerline, i, curvature);
            const isAccelerationZone = this.isAccelerationZone(centerline, i, curvature);
            
            analysis.push({
                index: i,
                curvature: curvature,
                trackWidth: trackWidth,
                speed: speed,
                turnRadius: turnRadius,
                isCorner: Math.abs(curvature) > 0.05,
                cornerDirection: curvature > 0 ? 'right' : 'left',
                isBrakingZone: isBrakingZone,
                isAccelerationZone: isAccelerationZone,
                cornerType: this.classifyCorner(curvature, trackWidth),
                entrySpeed: this.calculateEntrySpeed(centerline, i, speed),
                exitSpeed: this.calculateExitSpeed(centerline, i, speed)
            });
        }
        
        return analysis;
    }

    calculateCurvature(centerline, index, windowSize) {
        const start = Math.max(0, index - windowSize);
        const end = Math.min(centerline.length - 1, index + windowSize);
        
        if (end - start < 3) return 0;
        
        // Use three points to calculate curvature
        const p1 = centerline[start];
        const p2 = centerline[index];
        const p3 = centerline[end];
        
        const a = this.distance(p1, p2);
        const b = this.distance(p2, p3);
        const c = this.distance(p1, p3);
        
        if (a === 0 || b === 0) return 0;
        
        // Calculate angle between segments
        const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
        
        let angleDiff = angle2 - angle1;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        return angleDiff / (a + b);
    }

    calculateOptimalSpeed(curvature, trackWidth) {
        // Base speed calculation based on curvature and track width
        const maxSpeed = 200; // km/h
        const minSpeed = 50;  // km/h
        
        // Curvature factor (0 = straight, 1 = very tight corner)
        const curvatureFactor = Math.min(1, Math.abs(curvature) * 100);
        
        // Track width factor (wider track allows higher speeds)
        const widthFactor = Math.min(1, trackWidth / 50);
        
        // Speed decreases with curvature, increases with track width
        const speed = maxSpeed - (curvatureFactor * (maxSpeed - minSpeed)) + (widthFactor * 20);
        
        return Math.max(minSpeed, Math.min(maxSpeed, speed));
    }

    calculateTurnRadius(curvature) {
        if (Math.abs(curvature) < 0.001) return Infinity; // Straight
        return 1 / Math.abs(curvature);
    }

    classifyCorner(curvature, trackWidth) {
        const radius = this.calculateTurnRadius(curvature);
        
        if (Math.abs(curvature) < 0.02) return 'straight';
        if (radius < 20) return 'hairpin';
        if (radius < 50) return 'tight';
        if (radius < 100) return 'medium';
        return 'sweeper';
    }

    isBrakingZone(centerline, index, curvature) {
        // Look ahead to see if there's a corner coming
        const lookAhead = 10;
        const endIndex = Math.min(index + lookAhead, centerline.length - 1);
        
        for (let i = index; i <= endIndex; i++) {
            const futureCurvature = this.calculateCurvature(centerline, i, 5);
            if (Math.abs(futureCurvature) > 0.05) {
                return true;
            }
        }
        return false;
    }

    isAccelerationZone(centerline, index, curvature) {
        // Look behind to see if we just came out of a corner
        const lookBack = 10;
        const startIndex = Math.max(0, index - lookBack);
        
        for (let i = startIndex; i <= index; i++) {
            const pastCurvature = this.calculateCurvature(centerline, i, 5);
            if (Math.abs(pastCurvature) > 0.05) {
                return true;
            }
        }
        return false;
    }

    calculateEntrySpeed(centerline, index, currentSpeed) {
        // Calculate optimal entry speed for the upcoming corner
        const lookAhead = 15;
        const endIndex = Math.min(index + lookAhead, centerline.length - 1);
        
        let maxEntrySpeed = currentSpeed;
        
        for (let i = index; i <= endIndex; i++) {
            const curvature = this.calculateCurvature(centerline, i, 5);
            const entrySpeed = this.calculateOptimalSpeed(curvature, centerline[i].width);
            maxEntrySpeed = Math.min(maxEntrySpeed, entrySpeed);
        }
        
        return maxEntrySpeed;
    }

    calculateExitSpeed(centerline, index, currentSpeed) {
        // Calculate optimal exit speed for the current corner
        const lookBack = 15;
        const startIndex = Math.max(0, index - lookBack);
        
        let minExitSpeed = currentSpeed;
        
        for (let i = startIndex; i <= index; i++) {
            const curvature = this.calculateCurvature(centerline, i, 5);
            const exitSpeed = this.calculateOptimalSpeed(curvature, centerline[i].width);
            minExitSpeed = Math.max(minExitSpeed, exitSpeed);
        }
        
        return minExitSpeed;
    }

    generateOptimalRacingLine(centerline, analysis) {
        const racingLine = [];
        
        for (let i = 0; i < centerline.length; i++) {
            const point = centerline[i];
            const analysisPoint = analysis[i];
            
            // Calculate optimal offset from centerline
            const offset = this.calculateOptimalOffset(analysis, centerline, i, point.width);
            
            // Calculate proposed racing line point
            const proposedPoint = {
                x: point.x + offset.x,
                y: point.y + offset.y
            };
            
            // Constrain the point to stay within track boundaries
            const constrainedPoint = this.constrainToTrackBoundaries(proposedPoint, i);
            
            racingLine.push(constrainedPoint);
        }
        
        return racingLine;
    }

    constrainToTrackBoundaries(point, index) {
        // Use the resampled boundaries for more accurate constraint checking
        const innerPoints = this.resamplePath(this.innerBoundary, 200);
        const outerPoints = this.resamplePath(this.outerBoundary, 200);
        
        // Find the closest points on both boundaries
        const closestInner = this.findClosestPointOnPath(point, innerPoints);
        const closestOuter = this.findClosestPointOnPath(point, outerPoints);
        
        // Calculate distances to boundaries
        const distanceToInner = this.distance(point, closestInner);
        const distanceToOuter = this.distance(point, closestOuter);
        
        // Calculate local track width
        const localTrackWidth = this.distance(closestInner, closestOuter);
        
        // Check if point is outside track boundaries
        const isOutside = this.isPointOutsideTrack(point, innerPoints, outerPoints);
        
        if (isOutside) {
            // Move the point back inside the track
            return this.movePointInsideTrack(point, closestInner, closestOuter, localTrackWidth);
        }
        
        return point;
    }

    findClosestPointOnPath(point, path) {
        let closestPoint = path[0];
        let minDistance = this.distance(point, closestPoint);
        
        for (let i = 1; i < path.length; i++) {
            const distance = this.distance(point, path[i]);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = path[i];
            }
        }
        
        return closestPoint;
    }

    isPointOutsideTrack(point, innerPoints, outerPoints) {
        // Use ray casting algorithm to determine if point is inside the track
        // Count intersections with track boundaries
        let intersections = 0;
        
        // Check intersections with inner boundary
        for (let i = 0; i < innerPoints.length - 1; i++) {
            if (this.rayIntersectsSegment(point, innerPoints[i], innerPoints[i + 1])) {
                intersections++;
            }
        }
        
        // Check intersections with outer boundary
        for (let i = 0; i < outerPoints.length - 1; i++) {
            if (this.rayIntersectsSegment(point, outerPoints[i], outerPoints[i + 1])) {
                intersections++;
            }
        }
        
        // If odd number of intersections, point is outside
        return intersections % 2 === 1;
    }

    rayIntersectsSegment(point, segmentStart, segmentEnd) {
        // Ray casting: shoot a ray to the right and count intersections
        const rayEnd = { x: point.x + 1000, y: point.y };
        
        // Check if ray intersects with segment
        const d1 = (point.x - segmentStart.x) * (segmentEnd.y - segmentStart.y);
        const d2 = (point.y - segmentStart.y) * (segmentEnd.x - segmentStart.x);
        const d3 = (rayEnd.x - segmentStart.x) * (segmentEnd.y - segmentStart.y);
        const d4 = (rayEnd.y - segmentStart.y) * (segmentEnd.x - segmentStart.x);
        
        const denominator = (rayEnd.x - point.x) * (segmentEnd.y - segmentStart.y) - 
                           (rayEnd.y - point.y) * (segmentEnd.x - segmentStart.x);
        
        if (denominator === 0) return false;
        
        const ua = ((d1 - d2) * (rayEnd.x - point.x) - (point.x - segmentStart.x) * (d3 - d4)) / denominator;
        const ub = ((d1 - d2) * (rayEnd.y - point.y) - (point.y - segmentStart.y) * (d3 - d4)) / denominator;
        
        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }

    movePointInsideTrack(point, closestInner, closestOuter, trackWidth) {
        // Calculate the center point between inner and outer boundaries
        const centerPoint = {
            x: (closestInner.x + closestOuter.x) / 2,
            y: (closestInner.y + closestOuter.y) / 2
        };
        
        // Calculate the direction from center to the point
        const direction = {
            x: point.x - centerPoint.x,
            y: point.y - centerPoint.y
        };
        
        // Normalize the direction
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        if (length === 0) return centerPoint;
        
        direction.x /= length;
        direction.y /= length;
        
        // Move the point to a safe position inside the track
        // Use 30% of track width as maximum offset from center
        const safeOffset = trackWidth * 0.3;
        
        return {
            x: centerPoint.x + direction.x * safeOffset,
            y: centerPoint.y + direction.y * safeOffset
        };
    }

    findClosestBoundaryPoint(point, boundary) {
        let closestPoint = boundary[0];
        let minDistance = this.distance(point, closestPoint);
        
        for (let i = 1; i < boundary.length; i++) {
            const distance = this.distance(point, boundary[i]);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = boundary[i];
            }
        }
        
        return closestPoint;
    }

    findClosestCenterlinePoint(point, index) {
        // Use the centerline point at the given index
        const centerline = this.createCenterline();
        return centerline[index] || { x: point.x, y: point.y };
    }

    calculateSafeOffset(point, centerlinePoint, innerPoint, outerPoint) {
        // Calculate the direction from centerline to the proposed point
        const direction = {
            x: point.x - centerlinePoint.x,
            y: point.y - centerlinePoint.y
        };
        
        // Normalize the direction
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        if (length === 0) return { x: 0, y: 0 };
        
        direction.x /= length;
        direction.y /= length;
        
        // Calculate the track width
        const trackWidth = this.distance(innerPoint, outerPoint);
        
        // Use a safe fraction of the track width (e.g., 35% instead of 40%)
        const maxSafeOffset = trackWidth * 0.35;
        
        // Calculate the current offset
        const currentOffset = this.distance(point, centerlinePoint);
        
        // If the current offset is too large, scale it down
        if (currentOffset > maxSafeOffset) {
            return {
                x: direction.x * maxSafeOffset,
                y: direction.y * maxSafeOffset
            };
        }
        
        return {
            x: direction.x * currentOffset,
            y: direction.y * currentOffset
        };
    }

        calculateOptimalOffset(analysis, centerline, index, trackWidth) {
        const maxOffset = trackWidth * 0.3; // Reduced maximum offset from centerline for safety
        const point = analysis[index];
        
        // Straight section optimization
        if (!point.isCorner) {
            // On straights, stay on the inside for shorter distance
            // But consider upcoming corners for positioning
            const upcomingCorner = this.findUpcomingCorner(analysis, index);
            if (upcomingCorner && upcomingCorner.distance < 20) {
                // Position for upcoming corner
                return this.positionForUpcomingCorner(centerline, index, upcomingCorner, maxOffset);
            }
            return { x: 0, y: 0 };
        }
        
        // Corner section - apply advanced racing line principles
        const cornerAnalysis = this.analyzeCornerSection(analysis, index);
        const progress = cornerAnalysis.progress;
        const cornerType = point.cornerType;
        
        // Calculate offset based on corner type and racing dynamics
        let offsetRatio = this.calculateCornerOffsetRatio(cornerAnalysis, cornerType, point);
        
        // Apply speed-based adjustments
        offsetRatio = this.applySpeedAdjustments(offsetRatio, point, cornerAnalysis);
        
        // Apply braking/acceleration zone adjustments
        offsetRatio = this.applyZoneAdjustments(offsetRatio, point, cornerAnalysis);
        
        // Calculate perpendicular offset
        const tangent = this.calculateTangent(centerline, index);
        const perpendicular = { x: -tangent.y, y: tangent.x };
        
        return {
            x: perpendicular.x * offsetRatio * maxOffset,
            y: perpendicular.y * offsetRatio * maxOffset
        };
    }

    findUpcomingCorner(analysis, index) {
        const lookAhead = 30;
        const endIndex = Math.min(index + lookAhead, analysis.length - 1);
        
        for (let i = index; i <= endIndex; i++) {
            if (analysis[i].isCorner) {
                return {
                    index: i,
                    distance: i - index,
                    direction: analysis[i].cornerDirection,
                    type: analysis[i].cornerType
                };
            }
        }
        return null;
    }

    positionForUpcomingCorner(centerline, index, corner, maxOffset) {
        const distance = corner.distance;
        const direction = corner.direction;
        
        // Gradually move to the outside as we approach the corner
        const approachFactor = Math.max(0, (20 - distance) / 20);
        const offsetRatio = direction === 'right' ? approachFactor : -approachFactor;
        
        const tangent = this.calculateTangent(centerline, index);
        const perpendicular = { x: -tangent.y, y: tangent.x };
        
        return {
            x: perpendicular.x * offsetRatio * maxOffset * 0.3,
            y: perpendicular.y * offsetRatio * maxOffset * 0.3
        };
    }

    calculateCornerOffsetRatio(cornerAnalysis, cornerType, point) {
        const progress = cornerAnalysis.progress;
        const direction = cornerAnalysis.direction;
        
        let baseOffset;
        
        switch (cornerType) {
            case 'hairpin':
                // Hairpins need more aggressive racing line
                baseOffset = 0.7;
                break;
            case 'tight':
                // Tight corners need significant offset
                baseOffset = 0.6;
                break;
            case 'medium':
                // Medium corners use standard racing line
                baseOffset = 0.5;
                break;
            case 'sweeper':
                // Sweepers can use less aggressive line
                baseOffset = 0.4;
                break;
            default:
                baseOffset = 0.5;
        }
        
        // Apply direction-specific offset
        if (direction === 'right') {
            return baseOffset * Math.sin(progress * Math.PI);
        } else {
            return -baseOffset * Math.sin(progress * Math.PI);
        }
    }

    applySpeedAdjustments(offsetRatio, point, cornerAnalysis) {
        const speedFactor = point.speed / 200; // Normalize speed (0-1)
        const progress = cornerAnalysis.progress;
        
        // At higher speeds, use more conservative racing line
        const speedAdjustment = 1 - (speedFactor * 0.2);
        
        // Adjust based on entry/exit speeds
        const entrySpeedFactor = point.entrySpeed / point.speed;
        const exitSpeedFactor = point.exitSpeed / point.speed;
        
        // If entry speed is much higher than corner speed, be more conservative
        if (entrySpeedFactor > 1.5) {
            return offsetRatio * 0.8;
        }
        
        // If exit speed is much higher than corner speed, optimize for exit
        if (exitSpeedFactor > 1.3) {
            return offsetRatio * 1.1;
        }
        
        return offsetRatio * speedAdjustment;
    }

    applyZoneAdjustments(offsetRatio, point, cornerAnalysis) {
        const progress = cornerAnalysis.progress;
        
        // Braking zone adjustments
        if (point.isBrakingZone && progress < 0.3) {
            // In braking zone, stay more to the outside for better braking
            return offsetRatio * 1.2;
        }
        
        // Acceleration zone adjustments
        if (point.isAccelerationZone && progress > 0.7) {
            // In acceleration zone, optimize for early acceleration
            return offsetRatio * 0.9;
        }
        
        // Apex region (0.4-0.6) - optimize for minimum radius
        if (progress >= 0.4 && progress <= 0.6) {
            return offsetRatio * 1.1;
        }
        
        return offsetRatio;
    }

    calculateLapTime() {
        if (!this.trackAnalysis || this.racingLine.length < 2) return 0;
        
        let totalTime = 0;
        const totalDistance = this.calculatePathLength(this.racingLine);
        
        // Calculate time for each segment based on speed
        for (let i = 1; i < this.racingLine.length; i++) {
            const segmentLength = this.distance(this.racingLine[i - 1], this.racingLine[i]);
            const speed = this.trackAnalysis[i] ? this.trackAnalysis[i].speed : 150;
            
            // Convert speed from km/h to m/s
            const speedMs = speed / 3.6;
            
            // Add segment time
            totalTime += segmentLength / speedMs;
            
            // Add cornering time penalty for tight corners
            if (this.trackAnalysis[i] && this.trackAnalysis[i].isCorner) {
                const cornerType = this.trackAnalysis[i].cornerType;
                switch (cornerType) {
                    case 'hairpin':
                        totalTime += 0.5; // 0.5s penalty for hairpins
                        break;
                    case 'tight':
                        totalTime += 0.3; // 0.3s penalty for tight corners
                        break;
                    case 'medium':
                        totalTime += 0.1; // 0.1s penalty for medium corners
                        break;
                }
            }
        }
        
        return totalTime;
    }

    analyzeCornerSection(analysis, index) {
        // Find the start and end of the current corner
        let start = index;
        let end = index;
        
        // Look backwards for corner start
        while (start > 0 && analysis[start - 1].isCorner && 
               analysis[start - 1].cornerDirection === analysis[index].cornerDirection) {
            start--;
        }
        
        // Look forwards for corner end
        while (end < analysis.length - 1 && analysis[end + 1].isCorner && 
               analysis[end + 1].cornerDirection === analysis[index].cornerDirection) {
            end++;
        }
        
        const cornerLength = end - start + 1;
        const positionInCorner = index - start;
        const progress = cornerLength > 1 ? positionInCorner / (cornerLength - 1) : 0.5;
        
        return {
            start: start,
            end: end,
            length: cornerLength,
            progress: progress,
            direction: analysis[index].cornerDirection
        };
    }

    calculateTangent(centerline, index) {
        const lookAhead = 5;
        const nextIndex = Math.min(index + lookAhead, centerline.length - 1);
        
        // Calculate direction vector
        const dx = centerline[nextIndex].x - centerline[index].x;
        const dy = centerline[nextIndex].y - centerline[index].y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        return length > 0 ? { x: dx / length, y: dy / length } : { x: 1, y: 0 };
    }

    applyAdvancedSmoothing(path) {
        if (path.length < 3) return path;
        
        // Apply multiple passes of smoothing with different parameters
        let smoothed = [...path];
        
        // First pass: aggressive smoothing
        smoothed = this.smoothPathPass(smoothed, 0.7);
        
        // Second pass: gentle smoothing
        smoothed = this.smoothPathPass(smoothed, 0.9);
        
        // Third pass: very gentle smoothing for final polish
        smoothed = this.smoothPathPass(smoothed, 0.95);
        
        return smoothed;
    }

    smoothPathPass(path, alpha) {
        if (path.length < 3) return path;
        
        const smoothed = [path[0]];
        
        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            const next = path[i + 1];
            
            const x = alpha * curr.x + (1 - alpha) * (prev.x + next.x) / 2;
            const y = alpha * curr.y + (1 - alpha) * (prev.y + next.y) / 2;
            
            smoothed.push({ x, y });
        }
        
        smoothed.push(path[path.length - 1]);
        return smoothed;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RacingLineOptimizer();
}); 