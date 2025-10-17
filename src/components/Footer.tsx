export function Footer() {
  return (
    <footer
      className="glass-dark border-t border-white/10 py-4"
      data-testid="app-footer"
    >
      <div className="container mx-auto px-4">
        <p className="hidden md:block text-white/60 text-center text-sm">
          Drag the wind arrows to see real-time apparent wind calculations
        </p>
      </div>
    </footer>
  );
}
