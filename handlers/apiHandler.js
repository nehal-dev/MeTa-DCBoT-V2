const axios = require('axios');
const { handleError } = require('../errorHandler');

class APIHandler {
  constructor() {
    this.endpoints = new Map();
    this.axios = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'MeTa-AI Bot'
      }
    });
  }

  registerEndpoint(name, config) {
    this.endpoints.set(name, config);
  }

  async makeRequest(endpointName, params = {}) {
    try {
      const endpoint = this.endpoints.get(endpointName);
      if (!endpoint) throw new Error(`Endpoint ${endpointName} not found`);

      const response = await this.axios({
        method: endpoint.method || 'GET',
        url: endpoint.url,
        params: { ...endpoint.defaultParams, ...params },
        headers: endpoint.headers,
        data: params.data
      });

      return response.data;
    } catch (error) {
      handleError('APIRequest', error);
      throw error;
    }
  }
}

module.exports = new APIHandler();