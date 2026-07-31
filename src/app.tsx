import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import AudioMarkerPage from '@/pages/AudioMarkerPage/AudioMarkerPage';
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<AudioMarkerPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
