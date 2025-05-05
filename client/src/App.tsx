import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import TextFileWindow from './components/TextFileWindow';
import Terminal from './components/Terminal';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/textfile/:id" element={<TextFileWindow />} />
        <Route path="/terminal"  element={<Terminal />}/>
      </Routes>
    </Router>
  );
}

export default App;