import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import PurchaseOrders from "./pages/PurchaseOrders";
import Transactions from "./pages/Transactions";
import Warehouses from "./pages/Warehouses";
import QRScanner from "./pages/QRScanner";
import Alerts from "./pages/Alerts";

function Router() {
  return (
    <Switch>
      <Route path={"/"}>
        {() => (
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/products"}>
        {() => (
          <DashboardLayout>
            <Products />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/suppliers"}>
        {() => (
          <DashboardLayout>
            <Suppliers />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/purchase-orders"}>
        {() => (
          <DashboardLayout>
            <PurchaseOrders />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/transactions"}>
        {() => (
          <DashboardLayout>
            <Transactions />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/warehouses"}>
        {() => (
          <DashboardLayout>
            <Warehouses />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/qr-scanner"}>
        {() => (
          <DashboardLayout>
            <QRScanner />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/alerts"}>
        {() => (
          <DashboardLayout>
            <Alerts />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
