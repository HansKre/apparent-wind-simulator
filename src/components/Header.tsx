export function Header() {
  return (
    <header
      className="glass-dark border-b border-white/10"
      data-testid="app-header"
    >
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
          Apparent Wind Simulator
        </h1>
        <p className="hidden md:block text-white/80 text-center mt-2 text-sm md:text-base">
          Interactive sailing wind vector calculator
        </p>
      </div>
    </header>
  );
}
