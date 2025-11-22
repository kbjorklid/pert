import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
// We'll create these next
import { IterationView } from './pages/IterationView';
import { StoryView } from './pages/StoryView';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="iteration/:iterationId" element={<IterationView />} />
                    <Route path="iteration/:iterationId/story/:storyId" element={<StoryView />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
