import React from 'react';

const Sidebar = ({ filters, handleFilterChange, sport }) => {
  return (
    <div className="filters-sidebar open bg-base-200 p-4 shadow-md h-full fixed">
      <div className="filters-content">
        <div className="filter">
          <label htmlFor="player-name" className="text-white">Filter by Player:</label>
          <input
            type="text"
            id="player-name"
            name="playerName"
            placeholder="Enter player name"
            className="input input-bordered w-full max-w-xs"
            onChange={handleFilterChange}
            value={filters.playerName}
          />
        </div>
        <div className="filter">
          <label htmlFor="team-opponent" className="text-white">Filter by Game:</label>
          <input
            type="text"
            id="team-opponent"
            name="teamOpponent"
            placeholder="Enter team vs opponent"
            className="input input-bordered w-full max-w-xs"
            onChange={handleFilterChange}
            value={filters.teamOpponent}
          />
        </div>
        <div className="filter">
          <label htmlFor="prop-type" className="text-white">Filter by Prop:</label>
          <select
            id="prop-type"
            name="propType"
            className="select select-bordered w-full max-w-xs"
            onChange={handleFilterChange}
            value={filters.propType}
          >
            {sport === 'mlb' ? (
              <>
                <option value="all">All</option>
                <option value="Runs">Runs</option>
                <option value="Strikeouts">Strikeouts</option>
                <option value="Total Bases">Total Bases</option>
              </>
            ) : (
              <>
                <option value="all">All</option>
                <option value="Points">Points</option>
                <option value="Rebounds">Rebounds</option>
                <option value="Assists">Assists</option>
                <option value="3-Pointers Made">3-Pointers Made</option>
              </>
            )}
          </select>
        </div>
        <div className="filter">
          <label htmlFor="sort-by" className="text-white">Sort by:</label>
          <select
            id="sort-by"
            name="sortBy"
            className="select select-bordered w-full max-w-xs"
            onChange={handleFilterChange}
            value={filters.sortBy}
          >
            <option value="default">Default</option>
            <option value="impliedProbAsc">Implied Prob % (Low to High)</option>
            <option value="impliedProbDesc">Implied Prob % (High to Low)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
