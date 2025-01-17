const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

function setupAPI(app) {
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });
}

async function makeAPIRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        return await response.json();
    } catch (error) {
        throw new Error(`API Request Failed: ${error.message}`);
    }
}

module.exports = { setupAPI, makeAPIRequest };
