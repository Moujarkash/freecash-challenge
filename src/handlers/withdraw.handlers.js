const { giftCardWithdraw } = require('../services/withdraw.service');
const { checkIsUserVerified } = require('../services/user.service');

function registerWithdrawHandlers(io, socket) {
  let socketUser = socket.request.user;
  // SocketUser is false if the user is not logged in
  if (socketUser.logged_in == false) socketUser = false;

  const onsiteGiftCardWithdraw = async (data) => {
    let type = '';
    try {
      if (!data) {
        throw new Error('An unknown error occurred');
      }

      const isVerified = await checkIsUserVerified(socketUser.gainid);

      type = data.type;
      const coinAmount = parseInt(data.coinAmount);
      const countryCode = data.countryCode || 'WW';

      await giftCardWithdraw(socketUser, type, coinAmount, countryCode, isVerified);

      let event = 'withdrawalPending';
      if (isVerified) {
        event = 'withdrawalApproved'
      }

      socket.emit(event, {
        coins: coinAmount,
      });
    } catch (error) {
      socket.emit('withdrawFeedback', error.message, type);
    }
  };

  socket.on('onsiteGiftcardWithdraw', onsiteGiftCardWithdraw);
}

module.exports = registerWithdrawHandlers;
