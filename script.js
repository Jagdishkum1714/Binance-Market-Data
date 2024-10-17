let websocket;
let chart;
let currentCoin = 'ethusdt';
let currentInterval = '1m';
const coinData = {
    ethusdt: [],
    bnbusdt: [],
    dotusdt: []
};

function init() {
    setupEventListeners();
    loadStoredData();
    connectWebSocket();
    createChart();
}

function setupEventListeners() {
    document.getElementById('coinSelect').addEventListener('change', handleCoinChange);
    document.getElementById('intervalSelect').addEventListener('change', handleIntervalChange);
}

function connectWebSocket() {
    const wsUrl = `wss://stream.binance.com:9443/ws/${currentCoin}@kline_${currentInterval}`;
    websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
        console.log('WebSocket connection established');
        updateStatus('Connected to Binance');
    };

    websocket.onmessage = handleWebSocketMessage;

    websocket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.reason);
        updateStatus('Disconnected. Reconnecting...');
        setTimeout(connectWebSocket, 5000);
    };

    websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateStatus('Error: Connection failed');
    };
}

function handleWebSocketMessage(event) {
    const data = JSON.parse(event.data);
    if (data.e === 'kline') {
        const price = parseFloat(data.k.c);
        const timestamp = new Date(data.k.t).getTime();
        updateCoinData(currentCoin, { x: timestamp, y: price });
        updateChart();
    }
}

function updateCoinData(coin, dataPoint) {
    coinData[coin].push(dataPoint);
    if (coinData[coin].length > 100) {
        coinData[coin].shift();
    }
    localStorage.setItem(coin + '_' + currentInterval, JSON.stringify(coinData[coin]));
}

function createChart() {
    const ctx = document.getElementById('chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: currentCoin.toUpperCase() + ' Price',
                data: coinData[currentCoin],
                borderColor: '#2196f3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute',
                        displayFormats: {
                            minute: 'HH:mm'
                        }
                    },
                    grid: {
                        color: '#2a2e39'
                    },
                    ticks: {
                        color: '#787b86'
                    },
                    title: {
                        display: true,
                        text: 'Time (HH:mm)',
                        color: '#d1d4dc'
                    }
                },
                y: {
                    grid: {
                        color: '#2a2e39'
                    },
                    ticks: {
                        color: '#787b86'
                    },
                    title: {
                        display: true,
                        text: 'Price (USDT)',
                        color: '#d1d4dc'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} USDT`;
                        }
                    }
                }
            },
            animation: false
        }
    });
}

function updateChart() {
    if (chart && chart.data && chart.data.datasets) {
        chart.data.datasets[0].data = coinData[currentCoin];
        chart.data.datasets[0].label = currentCoin.toUpperCase() + ' Price';
        chart.update();
    } else {
        console.error('Chart or chart data is not properly initialized');
    }
}

function handleCoinChange(event) {
    if (websocket) websocket.close();
    currentCoin = event.target.value;
    loadStoredData();
    connectWebSocket();
    updateChart();
}

function handleIntervalChange(event) {
    if (websocket) websocket.close();
    currentInterval = event.target.value;
    loadStoredData();
    connectWebSocket();
    updateChart();
}

function loadStoredData() {
    const storedData = localStorage.getItem(currentCoin + '_' + currentInterval);
    if (storedData) {
        try {
            coinData[currentCoin] = JSON.parse(storedData);
        } catch (error) {
            console.error('Error parsing stored data:', error);
            coinData[currentCoin] = [];
        }
    } else {
        coinData[currentCoin] = [];
    }
}

function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

init();
