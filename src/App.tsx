import { WindSimulator } from "./components/WindSimulator";

export function App() {
  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Header */}
      <header className="glass-dark border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
            Apparent Wind Simulator
          </h1>
          <p className="text-white/80 text-center mt-2 text-sm md:text-base">
            Interactive sailing wind vector calculator
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full h-full">
          <WindSimulator />
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-dark border-t border-white/10 py-4">
        <div className="container mx-auto px-4">
          <p className="text-white/60 text-center text-sm">
            Drag the wind arrows to see real-time apparent wind calculations
          </p>
        </div>
      </footer>
    </div>
  );
}
