import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { AuthStateIndicator } from "./components/auth/AuthStateIndicator";
import { LoginButton } from "./components/auth/LoginButton";
import { DailyMotivationalQuote } from "./components/quotes/DailyMotivationalQuote";
import { BecomingView } from "./features/becoming/components/BecomingView";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const appIdentifier =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.hostname)
      : "unknown-app";

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <header className="glass-surface">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Becoming</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Track your habits, build consistency
                </p>
              </div>
              <div className="flex items-center gap-3">
                <AuthStateIndicator />
                <LoginButton />
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <DailyMotivationalQuote />
          <BecomingView />
        </main>

        <footer className="border-t border-border mt-16 py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()}. Built with{" "}
            <Heart className="inline h-3 w-3 text-primary fill-primary" /> using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </div>
        </footer>

        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
