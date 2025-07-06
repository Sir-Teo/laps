# Racing Line Optimizer

A web-based application that allows users to draw track boundaries and automatically computes the optimal racing line using advanced path optimization algorithms.

## Features

- **Interactive Drawing**: Draw inner and outer track boundaries using mouse or touch
- **Racing Line Computation**: Advanced algorithm that calculates the optimal racing line
- **Real-time Visualization**: See your track boundaries and racing line rendered in real-time
- **Mobile Support**: Touch-friendly interface that works on tablets and phones
- **Smooth Path Generation**: Intelligent smoothing for natural racing lines

## How to Use

1. **Draw Inner Boundary**: Click "Draw Inner Boundary" and draw the inside edge of your track (shown in blue)
2. **Draw Outer Boundary**: Click "Draw Outer Boundary" and draw the outside edge of your track (shown in red)
3. **Compute Racing Line**: Click "Compute Fastest Lap" to generate the optimal racing line (shown in green)
4. **Clear/Reset**: Use the Clear or Reset buttons to start over

## Racing Line Algorithm

The application uses a sophisticated racing line optimization algorithm that:

- **Analyzes Track Curvature**: Calculates local curvature to identify corners and straights
- **Optimizes Corner Entry/Exit**: Follows racing principles of late braking and early acceleration
- **Minimizes Lap Time**: Positions the racing line to maximize speed through corners
- **Applies Smoothing**: Creates natural, drivable racing lines

### Algorithm Details

The racing line computation follows these principles:

1. **Straight Sections**: Positions the line closer to the inside for shorter distance
2. **Corner Approach**: Stays on the outside to maximize braking and turning radius
3. **Corner Apex**: Cuts to the inside at the optimal point
4. **Corner Exit**: Returns to the outside for maximum acceleration

## Technical Implementation

- **Frontend**: HTML5 Canvas with JavaScript
- **Styling**: Modern CSS with responsive design
- **Path Optimization**: Custom algorithm based on curvature analysis
- **Smoothing**: Weighted average smoothing for natural paths

## Files Structure

```
laps/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript logic and algorithms
└── README.md          # This documentation
```

## Running the Application

Simply open `index.html` in any modern web browser. No additional setup or dependencies required.

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

- Save/load track configurations
- Export racing line data
- Multiple racing line algorithms
- Speed visualization along the racing line
- Sector time analysis

## Contributing

Feel free to submit issues and enhancement requests!
