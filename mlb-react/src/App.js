import logo from './logo.svg';
import './App.css';
import StatCard from './components/StatCard';
import { useState } from 'react';

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
      <h1 className='text-3xl'>Miles</h1>
      <button className='btn btn-secondary btn-outline'>Click me</button>
      <div className='flex flex-wrap justify-center items-center'>
        {cards.map((card, index) => (
          <div className='p-2'>
            <StatCard key={index}
            title={card.title}
            description={card.description}
            removeCard={() => removeCard(index)}
            />
          </div>
        ))}
      </div>

    </div>
  );
}

export default App;
