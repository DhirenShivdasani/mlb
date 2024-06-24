import logo from './logo.svg';
import './App.css';
import StatCard from './components/StatCard';
import { useState } from 'react';
import OddsPage from './pages/OddsPage';

function App() {
  const [cards, setCards] = useState([
    { title: "Dhiren", description: "big gym guy" },
    { title: "Miles", description: "big gym guy" },
    { title: "Miles", description: "big gym guy" },
    { title: "Miles", description: "big gym guy" },
  ]);

  const removeCard = (index) => {
    const newCards = cards.filter((card, i) => i !== index);
    setCards(newCards);
  }


  return (
    <div className="App">
      <OddsPage />
    </div>


  );
}

export default App;
