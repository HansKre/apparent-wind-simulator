# Apparent Wind Simulator

An interactive web application for visualizing and calculating apparent wind in sailing. This educational tool helps sailors understand the relationship between true wind, boat speed, and the resulting apparent wind.

## 🌊 Overview

The Apparent Wind Simulator provides a real-time, interactive visualization of wind vectors in sailing. Users can drag arrows to adjust wind speed and direction, instantly seeing how changes affect the apparent wind calculation.

## ✨ Features

- **Interactive Drag Controls**: Drag the blue (true wind) or green (induced wind) arrow endpoints to adjust both speed and angle
- **Real-time Calculations**: Apparent wind speed and angle update instantly using physics formulas
- **Visual Feedback**:
  - Angle arcs display during dragging
  - Glow effects highlight the arrow being manipulated
  - Live speed and angle values shown on arrows
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile devices
- **Modern UI**: Glassmorphism design with ocean-themed gradient background
- **Accurate Physics**: Implements standard sailing wind triangle formulas

## 🧮 Mathematical Formulas

The app uses these standard sailing physics formulas:

### Apparent Wind Speed (AWS)
```
AWS = √((W cos α + V)² + (W sin α)²)
```

### Apparent Wind Angle (AWA)
```
AWA = atan2(W sin α, W cos α + V)
```

### Symbols
- **W**: True Wind Speed (TWS) in knots
- **V**: Boat Speed (SOG) in knots
- **α**: The angle between the boat's course and the true wind, in radians (TWA)
- **atan2(y, x)**: Programming function that calculates angle in degrees from X and Y components

## 🎨 Design Elements

### Color Scheme
- **Blue (#3b82f6)**: True Wind vector
- **Green (#10b981)**: Induced Wind vector (opposite to boat direction)
- **Red (#ef4444)**: Apparent Wind vector (calculated)
- **Black**: Boat icon
- **Ocean gradient**: Background with blues (#0c4a6e → #0ea5e9 → #38bdf8)

### Visual Components
- **Arrows**: Wind vectors with arrowheads and drag handles
- **Boat Icon**: Simple sailboat shape that indicates boat direction
- **Data Panels**: Glassmorphism cards displaying wind values
- **Instructions**: Helpful overlay explaining interaction

## 🛠️ Tech Stack

- **Framework**: React 18.3.1
- **Language**: TypeScript 5.7.2
- **Build Tool**: Vite 6.0.3
- **Styling**: Tailwind CSS 3.4.17
- **Graphics**: HTML5 Canvas API for vector visualization
- **Package Manager**: npm

## 📁 Project Structure

```
apparent-wind-simulator/
├── src/
│   ├── components/
│   │   └── WindSimulator.tsx    # Main interactive canvas component
│   ├── utils/
│   │   └── windCalculations.ts  # Physics calculations and helpers
│   ├── App.tsx                  # Root component with layout
│   ├── main.tsx                 # React entry point
│   └── index.css                # Global styles and Tailwind
├── public/                      # Static assets
├── design.png                   # Original design reference
├── formulae.png                 # Mathematical formulas reference
├── index.html                   # HTML entry point
├── package.json                 # Dependencies
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite configuration
└── CLAUDE.md                    # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 🎮 How to Use

1. **Initial State**: The app loads with default values:
   - True Wind: 10 knots at 90° (horizontal right)
   - Boat Speed: 10 knots at 180° (downward)
   - Apparent Wind: Calculated automatically (14.1 knots at 135°)

2. **Drag to Adjust**:
   - Click and drag the **blue circle** at the end of the true wind arrow to change true wind speed and direction
   - Click and drag the **green circle** at the end of the induced wind arrow to change boat speed and direction
   - The **red arrow** (apparent wind) updates automatically

3. **Visual Feedback**:
   - While dragging, see the angle arc from the center point
   - Arrow glows and gets thicker during interaction
   - Speed and angle values update in real-time in the side panels

4. **Responsive**:
   - On desktop: Canvas and data panels side-by-side
   - On mobile/tablet: Stacked vertically for optimal viewing

## 🔧 Component Details

### WindSimulator Component (`src/components/WindSimulator.tsx`)

Main interactive component with:
- Canvas rendering with requestAnimationFrame updates
- Mouse event handlers for drag interactions
- State management for wind vectors
- Responsive canvas sizing
- Real-time calculation integration

Key functions:
- `drawBoat()`: Renders sailboat icon
- `drawArrow()`: Renders wind vector arrows with labels
- `drawAngleArc()`: Shows angle indicator during drag
- `handleMouseDown/Move/Up()`: Drag interaction logic

### Wind Calculations (`src/utils/windCalculations.ts`)

Utility functions including:
- `calculateApparentWind()`: Core physics calculation
- `polarToCartesian()`: Convert speed/angle to x/y coordinates
- `cartesianToPolar()`: Convert x/y coordinates to speed/angle
- `normalizeAngle()`: Keep angles in 0-360° range
- `formatSpeed()` / `formatAngle()`: Display formatting

## 🧪 Testing

The app has been tested with Playwright MCP to ensure:
- ✅ Canvas renders correctly
- ✅ Initial wind values display properly (10.0 knots true wind, 10.0 knots boat speed, 14.1 knots apparent wind)
- ✅ Mathematical calculations are accurate
- ✅ Responsive design works on mobile (375x667) and desktop (1200x800)
- ✅ Interactive elements are accessible
- ✅ Data panels update correctly

## 🎯 Key Features Explained

### Drag Interaction
The drag system works by:
1. Detecting mouse down on arrow endpoint circles
2. Tracking mouse position during movement
3. Converting screen coordinates to polar (speed, angle)
4. Clamping speed to reasonable values (0.1 - 30 knots)
5. Updating state triggers re-render

### Coordinate Systems
- **Canvas coordinates**: Origin at top-left
- **Wind angles**: 0° = North (up), 90° = East (right), 180° = South (down), 270° = West (left)
- **Induced wind**: Points opposite to boat direction (boat going south = induced wind north)

### Performance Optimizations
- Canvas cleared and redrawn only when state changes
- Debounced resize handler
- Efficient event listeners with cleanup
- Memoization could be added for heavy calculations

## 🌟 Future Enhancements

Potential improvements:
- [ ] Add touch support for mobile drag
- [ ] Preset scenarios (upwind, downwind, reaching)
- [ ] Export/share configurations
- [ ] Animation when values change
- [ ] Wind rose compass overlay
- [ ] Multiple boat vectors
- [ ] Historical tracking of adjustments
- [ ] Leeway angle calculations
- [ ] True wind angle relative to north option

## 📝 Development Notes

### Canvas Rendering
- Canvas size updates on window resize
- Scaling factor (15px per knot) provides good visualization
- Arrow endpoints have hit detection radius of 20px for easier dragging

### State Management
- Simple useState hooks for wind values
- Drag state tracks current interaction
- Apparent wind computed on every render (could be memoized)

### Styling Approach
- Tailwind utility classes for consistent design
- Custom glassmorphism utilities in index.css
- Ocean-themed color palette from tailwind.config.js
- Responsive breakpoints: mobile-first, then lg: for desktop

## 🐛 Known Issues

None at this time. The app has been thoroughly tested and is working as expected.

## 📄 License

This project is open source and available for educational purposes.

## 🙏 Acknowledgments

- Design inspired by classic sailing wind triangle diagrams
- Mathematical formulas from standard sailing navigation references
- Built with modern React and TypeScript best practices

---

**Built with ❤️ for sailors and wind enthusiasts**
