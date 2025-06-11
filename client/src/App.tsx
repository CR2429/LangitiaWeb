import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import TextFileWindow from './components/TextFileWindow';
import Terminal from './components/Terminal';
import SecurityProtocols from './components/SecurityProtocols';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/textfile/:id" element={<TextFileWindow />} />
        <Route path="/terminal"  element={<Terminal />}/>
        <Route path="/protocoles_de_securite" element={<SecurityProtocols />} />
      </Routes>
    </Router>
  );
}

export default App;