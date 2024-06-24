import { useState } from "react";


export default function StatCard({ key, title, description, removeCard }) {
    const [count, setCount] = useState(0);


    const handleCardClick = () => {
        setCount(count + 1);
    }


    return (
    <div className="card bg-base-100 w-96 shadow-xl">
        <figure>
            <img
            src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg"
            alt="Shoes" />
        </figure>
        <div className="card-body">
            <h2 className="card-title">{title}</h2>
            <p>{description}</p>
            <div className="card-actions justify-end">
            <button onClick={handleCardClick} className="btn btn-primary">{count}</button>
            <button onClick={removeCard} className="btn btn-secondary">DELETE ME</button>
            </div>
        </div>
      </div>
    )
}