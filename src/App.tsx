import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { AppLayout } from "./components/layout";
import { ExecutiveSummaryPage, PreferencesPage, NotFoundPage } from "./pages";
import { ROUTES } from "./constants/routes";

function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Landing page — User Preferences */}
            <Route
              index
              element={<Navigate to={ROUTES.PREFERENCES} replace />}
            />
            <Route path="UserPreference" element={<PreferencesPage />} />
            {/* Dashboard — reachable only via Save & Continue / Open Dashboard */}
            <Route path="ExecutiveSummary" element={<ExecutiveSummaryPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </FluentProvider>
  );
}

export default App;
