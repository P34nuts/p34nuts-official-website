/**
 * NOIR CUT DESIGN REMINDER — The application shell stays in permanent dark mode so the
 * editorial Ink Black framing and Paper White typography remain visually stable site-wide.
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Router as WouterRouter, Switch } from "wouter";
import { BrandRouteTransition } from "./components/BrandRouteTransition";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { getRouterBase } from "./lib/routerBase";
import Home from "./pages/Home";

const NotFound = lazy(() => import("@/pages/NotFound"));
const InfoPage = lazy(() => import("@/pages/InfoPage"));
const MusicLanding = lazy(() => import("@/pages/MusicLanding"));
const TrackDetail = lazy(() => import("@/pages/TrackDetail"));

function RouteFallback() {
  return <main className="route-fallback" aria-live="polite">LOADING / NEXT FRAME</main>;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <WouterRouter base={getRouterBase(import.meta.env.BASE_URL)}>
      <BrandRouteTransition>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/music"><Suspense fallback={<RouteFallback />}><MusicLanding /></Suspense></Route>
          <Route path="/music/:slug"><Suspense fallback={<RouteFallback />}><TrackDetail /></Suspense></Route>
          <Route path="/shop"><Suspense fallback={<RouteFallback />}><InfoPage kind="shop" /></Suspense></Route>
          <Route path="/booking"><Suspense fallback={<RouteFallback />}><InfoPage kind="booking" /></Suspense></Route>
          <Route path="/press"><Suspense fallback={<RouteFallback />}><InfoPage kind="press" /></Suspense></Route>
          <Route path="/impressum"><Suspense fallback={<RouteFallback />}><InfoPage kind="impressum" /></Suspense></Route>
          <Route path="/datenschutz"><Suspense fallback={<RouteFallback />}><InfoPage kind="datenschutz" /></Suspense></Route>
          <Route path="/404"><Suspense fallback={<RouteFallback />}><NotFound /></Suspense></Route>
          <Route><Suspense fallback={<RouteFallback />}><NotFound /></Suspense></Route>
        </Switch>
      </BrandRouteTransition>
    </WouterRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
