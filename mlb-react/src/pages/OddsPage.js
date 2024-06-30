import React, { useState, useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import './OddsPage.css';
import StatCard from '../components/StatCard';
import Sidebar from '../components/Sidebar';
import zoomPlugin from 'chartjs-plugin-zoom';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

Chart.register(zoomPlugin);

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA40g-cxWxQV1R0niqZfBpwJ1OlImx1ghE",
    authDomain: "live-odds-tracker.firebaseapp.com",
    projectId: "live-odds-tracker",
    storageBucket: "live-odds-tracker.appspot.com",
    messagingSenderId: "78785845250",
    appId: "1:78785845250:web:9e756ade4fd465f494af1b",
    measurementId: "G-L9G8SVLWJB"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

Chart.register(zoomPlugin);

const OddsPage = ({ updateLastUpdated, sport, favorites, setFavorites }) => {
    const [oddsData, setOddsData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [historicalData, setHistoricalData] = useState([]);
    const [historicalChart, setHistoricalChart] = useState(null);
    const [filters, setFilters] = useState({
        playerName: '',
        teamOpponent: '',
        propType: 'all',
        sortBy: 'default',
    });
    const [dataFilter, setDataFilter] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const itemsPerPage = 20;

    const originalOddsData = useRef([]);
    const filterTimeout = useRef(null);

    useEffect(() => {
        fetchOdds();
    }, [sport]);

    const fetchOdds = async () => {
        try {
            const response = await fetch(`/merged_data?sport=${sport}`);
            const data = await response.json();
            console.log('Fetched odds data:', data); // Log the fetched data
            setOddsData(data);
            setFilteredData(data);
            originalOddsData.current = data;
            updateLastUpdated(formatDate(new Date()));
        } catch (error) {
            console.error('Error fetching odds data:', error);
        }
    };

    const applyFilters = (filters) => {
        let filtered = Array.isArray(originalOddsData.current) ? [...originalOddsData.current] : [];

        if (filters.playerName) {
            filtered = filtered.filter(odds => odds.PlayerName.toLowerCase().includes(filters.playerName.toLowerCase()));
        }

        if (filters.teamOpponent) {
            filtered = filtered.filter(odds => `${odds.team} vs. ${odds.opp}`.toLowerCase().includes(filters.teamOpponent.toLowerCase()));
        }

        if (filters.propType !== 'all') {
            filtered = filtered.filter(odds => odds.Prop === filters.propType);
        }

        if (filters.sortBy === 'impliedProbAsc') {
            filtered.sort((a, b) => parseFloat(a.Implied_Prob) - parseFloat(b.Implied_Prob));
        } else if (filters.sortBy === 'impliedProbDesc') {
            filtered.sort((a, b) => parseFloat(b.Implied_Prob) - parseFloat(a.Implied_Prob));
        }

        setFilteredData(filtered);
    };

    useEffect(() => {
        if (filterTimeout.current) {
            clearTimeout(filterTimeout.current);
        }

        filterTimeout.current = setTimeout(() => {
            applyFilters(filters);
        }, 300);

        return () => {
            if (filterTimeout.current) {
                clearTimeout(filterTimeout.current);
            }
        };
    }, [filters]);

    const formatDate = (date) => {
        return date.toLocaleString('en-US', {
            hour12: true,
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const showHistoricalData = async (playerName, prop, overUnder) => {
        const encodedPlayerName = encodeURIComponent(playerName);
        const encodedProp = encodeURIComponent(prop);
        const encodedOverUnder = encodeURIComponent(overUnder);

        const url = `/get_historical_data?player_name=${encodedPlayerName}&prop=${encodedProp}&over_under=${encodedOverUnder}&sport=${sport}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error fetching historical data: ${response.statusText}`);
            const data = await response.json();

            setHistoricalData(data);
            updateChart(data);
            document.getElementById('historicalModal').style.display = 'block';
        } catch (error) {
            console.error(error.message);
        }
    };

    const updateChart = (data) => {
        const extractOddsValue = (value) => {
            const parts = value.split(' ');
            return parts.length > 1 ? parseFloat(parts[1]) : null;
        };

        const filteredData = data.slice(-dataFilter);
        const timestamps = filteredData.map(item => new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}));
        const draftkings = filteredData.map(item => extractOddsValue(item.draftkings));
        const fanduel = filteredData.map(item => extractOddsValue(item.fanduel));
        const mgm = filteredData.map(item => extractOddsValue(item.mgm));
        const betrivers = filteredData.map(item => extractOddsValue(item.betrivers));

        if (historicalChart) {
            historicalChart.destroy();
        }

        const ctx = document.getElementById('historicalChart').getContext('2d');

        const themeColors = {
            mlb: {
                backgroundColor: '#001f3f',
                borderColor: 'rgba(255, 99, 132, 1)',
                draftkings: 'rgba(255, 99, 132, 1)',
                fanduel: 'rgba(54, 162, 235, 1)',
                mgm: 'rgba(75, 192, 192, 1)',
                betrivers: 'rgba(153, 102, 255, 1)',
            },
            wnba: {
                backgroundColor: '#3f1f00',
                borderColor: 'rgba(255, 69, 0, 1)',
                draftkings: 'rgba(255, 99, 132, 1)',
                fanduel: 'rgba(54, 162, 235, 1)',
                mgm: 'rgba(75, 192, 192, 1)',
                betrivers: 'rgba(153, 102, 255, 1)',
            }
        };

        const theme = themeColors[sport] || themeColors.mlb;
        if (ctx) {
            const newChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: timestamps,
                    datasets: [
                        {
                            label: 'DraftKings',
                            data: draftkings,
                            borderColor: theme.draftkings,
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            borderWidth: 2,
                            pointRadius: 5,
                            fill: true,
                            tension: 0.4,
                        },
                        {
                            label: 'FanDuel',
                            data: fanduel,
                            borderColor: theme.fanduel,
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderWidth: 2,
                            pointRadius: 5,
                            fill: true,
                            tension: 0.4,
                        },
                        {
                            label: 'MGM',
                            data: mgm,
                            borderColor: theme.mgm,
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderWidth: 2,
                            pointRadius: 5,
                            fill: true,
                            tension: 0.4,
                        },
                        {
                            label: 'BetRivers',
                            data: betrivers,
                            borderColor: theme.betrivers,
                            backgroundColor: 'rgba(153, 102, 255, 0.2)',
                            borderWidth: 2,
                            pointRadius: 5,
                            fill: true,
                            tension: 0.4,
                        }
                    ]
                },
                options: {
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#fff', // Set legend text color
                                font: {
                                    size: 14,
                                },
                            },
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)', // Set tooltip background color
                            titleColor: '#fff', // Set tooltip title color
                            bodyColor: '#fff', // Set tooltip body color
                        },
                        zoom: {
                            pan: {
                                enabled: true,
                                mode: 'xy',
                            },
                        },
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Time',
                                color: '#fff', // Set x-axis title color
                                font: {
                                    family: 'Arial',
                                    size: 16,
                                    weight: 'bold',
                                    lineHeight: 1.2,
                                },
                                padding: { top: 20, left: 0, right: 0, bottom: 0 }
                            },
                            ticks: {
                                color: '#fff', // Set x-axis tick color
                                maxRotation: 45,
                                minRotation: 45,
                                autoSkip: true,
                                maxTicksLimit: 10,
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.2)', // Set x-axis grid line color
                            },
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Odds',
                                color: '#fff', // Set y-axis title color
                                font: {
                                    family: 'Arial',
                                    size: 16,
                                    weight: 'bold',
                                    lineHeight: 1.2,
                                },
                                padding: { top: 30, left: 0, right: 0, bottom: 0 }
                            },
                            ticks: {
                                color: '#fff', // Set y-axis tick color
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.2)', // Set y-axis grid line color
                            },
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                }
            });

            setHistoricalChart(newChart);
        } else {
            console.error('Historical chart element not found');
        }
    };

    const closeHistoricalModal = () => {
        document.getElementById('historicalModal').style.display = 'none';
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    };

    const handleDataFilterChange = (e) => {
        const value = parseInt(e.target.value, 10);
        setDataFilter(value);
        if (historicalData.length > 0) {
            updateChart(historicalData);
        }
    };

    useEffect(() => {
        if (historicalData.length > 0) {
            updateChart(historicalData);
        }
    }, [dataFilter]);

    const getPaginatedData = () => {
        if (!Array.isArray(filteredData)) {
            console.error('filteredData is not an array:', filteredData);
            return [];
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredData.slice(startIndex, endIndex);
    };

    const totalPages = useMemo(() => {
        if (!Array.isArray(filteredData)) {
            return 1;
        }
        return Math.ceil(filteredData.length / itemsPerPage);
    }, [filteredData.length]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Handle incoming messages for notifications
    useEffect(() => {
        onMessage(messaging, (payload) => {
            console.log('Message received: ', payload);
            // Show notification or handle it accordingly
            if (Notification.permission === 'granted') {
                new Notification(payload.notification.title, {
                    body: payload.notification.body,
                    icon: payload.notification.icon,
                });
            }
        });
    }, []);

    return (
        <div className="odds-page-container">
            {sidebarOpen && (
                <Sidebar
                    filters={filters}
                    handleFilterChange={handleFilterChange}
                    sport={sport}
                />
            )}
            <div className={`flex-grow ${sidebarOpen ? 'pl-64' : ''}`}>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="toggle-button">
                </button>
                <div id="notification" className="bg-yellow-300 text-gray-800 p-2 text-center">New data available. Please refresh the page.</div>
                <div className="scrollable-container">
                    <div id="odds-container">
                        {getPaginatedData().map((odds, index) => (
                            <StatCard 
                                key={index} 
                                odds={odds} 
                                showHistoricalData={() => showHistoricalData(odds.PlayerName, odds.Prop, odds.Over_Under)} 
                                sport={sport} 
                                imageUrl={odds.ImageURL}
                                favorites={favorites}
                                setFavorites={setFavorites}
                            />
                        ))}
                    </div>
                </div>
                <div className="pagination-controls flex justify-center gap-4 mt-4">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="btn"
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="btn"
                    >
                        Next
                    </button>
                </div>
                <div id="historicalModal">
                    <div className="modal-header">
                        <select id="data-filter" onChange={handleDataFilterChange} value={dataFilter} className="select select-bordered">
                            <option value={10}>Last 10</option>
                            <option value={50}>Last 50</option>
                            <option value={historicalData.length}>All</option>
                        </select>
                        <button onClick={closeHistoricalModal} className="red-button">Close</button>
                    </div>
                    <canvas id="historicalChart"></canvas>
                </div>
            </div>
        </div>
    );
};

export default OddsPage;
