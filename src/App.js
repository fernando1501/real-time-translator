import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Home } from './pages';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      Component: Home,
    },
  ])
  return (
    <RouterProvider router={router} />
  );
}

export default App;
