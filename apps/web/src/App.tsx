import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/shared/ui/toaster";
import { TooltipProvider } from "@/shared/ui/tooltip";
import NotFound from "@/pages/not-found";
import DashboardHome from "@/features/dashboard/pages/home";
import LandingPage from "@/features/landing/pages/landing-page";
import BillingPage from "./features/billing/BillingPage";

const queryClient = new QueryClient();

function Router() {
  return (
    // <Switch>
    //   <Route path="/dashboard" component={DashboardHome} />
    //   <Route path="/">
    //     <Redirect to="/dashboard" />
    //   </Route>
    //   <Route component={NotFound} />
    // </Switch>

    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={DashboardHome} />
      <Route path="/billing" component={BillingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

