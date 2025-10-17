import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { WindSimulator } from "./components/WindSimulator";

export function App() {
  return (
    <div className="h-full w-full flex flex-col" data-testid="app-container">
      <Header />

      <main
        className="flex-1 flex items-center justify-center"
        data-testid="app-main"
      >
        <div className="w-full h-full" data-testid="main-content">
          <WindSimulator />
        </div>
      </main>

      <Footer />
    </div>
  );
}
