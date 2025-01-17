function handleError(error, client) {
  console.error('[META ERROR]', error);

  const errorEmbed = {
      color: 0xFF0000,
      title: 'Error Occurred',
      description: error.message,
      timestamp: new Date()
  };

  const adminUser = client.users.cache.get(require('../config.json').adminID);
  if (adminUser) {
      adminUser.send({ embeds: [errorEmbed] }).catch(console.error);
  }
}

module.exports = { handleError };
