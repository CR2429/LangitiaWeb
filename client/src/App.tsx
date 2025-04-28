import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import TextFileWindow from './components/TextFileWindow';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/textfile/:id" element={<TextFileWindow />} />
      </Routes>
    </Router>
  );
}

export default App;