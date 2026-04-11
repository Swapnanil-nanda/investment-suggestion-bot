/* ============================================================
   MARKET.JS — TradingView Widget Integration
   Real-time interactive charts for stocks, metals, crypto
   ============================================================ */

const Market = (() => {
    let currentWidget = null;

    function init() {
        const select = document.getElementById('market-select');
        if (select) {
            loadChart(select.value);
            select.addEventListener('change', () => {
                loadChart(select.value);
            });
        }
    }

    function loadChart(symbol) {
        const container = document.getElementById('tradingview-widget');
        if (!container) return;

        // Clear previous widget
        container.innerHTML = '';

        // Create TradingView Advanced Chart widget
        const widgetDiv = document.createElement('div');
        widgetDiv.id = 'tradingview_chart';
        widgetDiv.style.width = '100%';
        widgetDiv.style.height = '100%';
        container.appendChild(widgetDiv);

        // Map our symbols to TradingView symbols
        const symbolMap = {
            'NSE:NIFTY': 'NSE:NIFTY',
            'BSE:SENSEX': 'BSE:SENSEX',
            'NASDAQ:NDX': 'NASDAQ:NDX',
            'SP:SPX': 'SP:SPX',
            'KRX:KOSPI': 'KRX:KOSPI',
            'TVC:GOLD': 'TVC:GOLD',
            'TVC:SILVER': 'TVC:SILVER',
            'BINANCE:BTCINR': 'BINANCE:BTCINR',
            'BINANCE:ETHINR': 'BINANCE:ETHINR',
            'BINANCE:BNBINR': 'BINANCE:BNBINR'
        };

        const tvSymbol = symbolMap[symbol] || symbol;

        // Load TradingView widget script
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.onload = () => {
            if (typeof TradingView !== 'undefined') {
                currentWidget = new TradingView.widget({
                    'autosize': true,
                    'symbol': tvSymbol,
                    'interval': 'D',
                    'timezone': 'Asia/Kolkata',
                    'theme': 'light',
                    'style': '1',
                    'locale': 'en',
                    'toolbar_bg': '#f1f3f6',
                    'enable_publishing': false,
                    'allow_symbol_change': true,
                    'container_id': 'tradingview_chart',
                    'hide_side_toolbar': false,
                    'studies': ['MASimple@tv-basicstudies'],
                    'show_popup_button': true,
                    'popup_width': '1000',
                    'popup_height': '650',
                    'withdateranges': true,
                    'details': true,
                    'calendar': false
                });
            }
        };

        // Check if TradingView script is already loaded
        if (typeof TradingView !== 'undefined') {
            currentWidget = new TradingView.widget({
                'autosize': true,
                'symbol': tvSymbol,
                'interval': 'D',
                'timezone': 'Asia/Kolkata',
                'theme': 'light',
                'style': '1',
                'locale': 'en',
                'toolbar_bg': '#f1f3f6',
                'enable_publishing': false,
                'allow_symbol_change': true,
                'container_id': 'tradingview_chart',
                'hide_side_toolbar': false,
                'studies': ['MASimple@tv-basicstudies'],
                'show_popup_button': true,
                'popup_width': '1000',
                'popup_height': '650',
                'withdateranges': true,
                'details': true,
                'calendar': false
            });
        } else {
            document.head.appendChild(script);
        }
    }

    return { init, loadChart };
})();
