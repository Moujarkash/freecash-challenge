const { isUserVerified } = require('../models/user.model');

async function checkIsUserVerified(gainId) {
  try {
    return await isUserVerified(gainId);
  } catch (error) {
    throw new Error('An error occurred');
  }
}

module.exports = {
  checkIsUserVerified,
};
