import { Routes, Route } from 'react-router-dom';
import { EditorPage } from './pages/EditorPage';
import { PreviewPage } from './pages/PreviewPage';

function App() {
  return (
    <Routes>
      {/* La route principale '/' affiche l'éditeur de workflow */}
      <Route path="/" element={<EditorPage />} />
      
      {/* La route '/preview/:publishedId' affiche la page de prévisualisation publique */}
      <Route path="/preview/:publishedId" element={<PreviewPage />} />
    </Routes>
  );
}

export default App;