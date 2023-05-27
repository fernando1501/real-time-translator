import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Config, Home } from './pages';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      Component: Home,
    },
    {
      path: '/configs',
      Component: Config,
    }
  ])
  return (
    <RouterProvider router={router}/>
  );
}

export default App;
