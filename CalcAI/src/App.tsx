import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import '@tldraw/tldraw/tldraw.css';

import Home from '@/screens/home';
import Landing from '@/screens/landing';

import '@/index.css';

const paths = [
    {
        path: '/',
        element: (
          <Landing/>
        ),
    },
    {
        path: '/app',
        element: (
          <Home/>
        ),
    },
];

const BrowserRouter = createBrowserRouter(paths);

const App = () => {
    return (
    <MantineProvider>
      <RouterProvider router={BrowserRouter}/>
    </MantineProvider>
    )
};

export default App;
