/**
 * @param {object} pubsubMessage
 * @param {string} pubsubMessage.data
 */
module.exports = pubsubMessage => {
  const message = Buffer.from(pubsubMessage.data, 'base64').toString();
  const branch = JSON.parse(message)
};
