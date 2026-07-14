import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { AppLayout } from './components/layout';
import { ExecutiveSummaryPage, PreferencesPage, NotFoundPage } from './pages';

function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<ExecutiveSummaryPage />} />
            <Route path="preferences" element={<PreferencesPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </FluentProvider>
  );
}

export default App;

