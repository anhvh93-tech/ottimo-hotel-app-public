import { BrowserRouter } from 'react-router-dom';
import { Providers } from './app/Providers';
import { AppRoutes } from './app/routes';

export function App() {
  return (
    <Providers>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Providers>
  );
}
