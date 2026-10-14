import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import SecurityProtocols from './components/SecurityProtocols';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/protocoles_de_securite" element={<SecurityProtocols />} />
      </Routes>
    </Router>
  );
}

export default App;
