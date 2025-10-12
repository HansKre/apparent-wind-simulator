# ⛵ Apparent Wind Simulator

An interactive web application for visualizing and calculating apparent wind in sailing. Drag arrows to see real-time wind vector calculations!

![Apparent Wind Simulator](design.png)

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## ✨ Features

- 🎯 **Interactive Drag Controls** - Adjust wind speed and direction by dragging arrow endpoints
- 📐 **Real-time Physics** - Accurate apparent wind calculations using sailing formulas
- 🎨 **Beautiful UI** - Modern glassmorphism design with ocean gradient
- 📱 **Fully Responsive** - Works on desktop, tablet, and mobile
- 🔄 **Live Visual Feedback** - Angle arcs and glow effects during interaction

## 🧮 How It Works

The simulator implements standard sailing wind triangle formulas:

**Apparent Wind Speed (AWS)**
```
AWS = √((W cos α + V)² + (W sin α)²)
```

**Apparent Wind Angle (AWA)**
```
AWA = atan2(W sin α, W cos α + V)
```

Where:
- **W** = True Wind Speed (knots)
- **V** = Boat Speed (knots)
- **α** = Angle between boat course and true wind

## 🎮 Usage

1. **Blue Arrow** - True wind (drag to adjust speed and direction)
2. **Green Arrow** - Induced wind from boat movement (drag to adjust boat speed and heading)
3. **Red Arrow** - Apparent wind (calculated automatically)

Watch the data panels update in real-time as you drag!

## 🛠️ Tech Stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS 3
- HTML5 Canvas

## 📚 Documentation

See [CLAUDE.md](CLAUDE.md) for detailed documentation including:
- Architecture overview
- Component details
- Mathematical formulas explained
- Development notes
- Future enhancements

## 🧪 Testing

Tested with Playwright to ensure:
- ✅ Accurate calculations
- ✅ Smooth interactions
- ✅ Responsive design
- ✅ Cross-browser compatibility

## 📄 License

Open source - free for educational use.

---

**Happy Sailing!** 🌊⛵
