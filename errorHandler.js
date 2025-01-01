const chalk = require('chalk');

function handleError(type, error) {
  const timestamp = new Date().toISOString();
  console.error(chalk.red(`[ERROR] ${type} at ${timestamp}:`));
  console.error(chalk.red(error.stack || error));

  if (error.response) {
    console.error(chalk.yellow('Response Error:'), error.response.data);
  }
}

module.exports = { handleError };