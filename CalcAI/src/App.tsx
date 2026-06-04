import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import '@tldraw/tldraw/tldraw.css';

import Home from '@/screens/home';
import Landing from '@/screens/landing';
import Board from '@/screens/board';

import '@/index.css';

const paths = [
    { path: '/', element: <Landing /> },
    { path: '/app', element: <Home /> },
    { path: '/board', element: <Board /> },
];

const BrowserRouter = createBrowserRouter(paths);

const App = () => (
    <MantineProvider>
        <RouterProvider router={BrowserRouter} />
    </MantineProvider>
);

export default App;
