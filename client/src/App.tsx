import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import FileWindow from './components/FileWindow';
import Terminal from './components/Terminal';
import SecurityProtocols from './components/SecurityProtocols';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/file/:id" element={<FileWindow />} />
        <Route path="/terminal"  element={<Terminal />}/>
        <Route path="/protocoles_de_securite" element={<SecurityProtocols />} />

      </Routes>
    </Router>
  );
}

export default App;