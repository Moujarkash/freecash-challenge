const {
  getAccountStanding,
  isDefaultUserEmailVerified,
  getBalanceByGainId,
  updateBalanceByGainId,
} = require('../models/user.model');

const {
  earnedEnoughToWithdraw,
  insertPendingSiteGiftCardWithdraw,
} = require('../models/withdraw.model');
const config = require('../config');

const cardTypes = ['Fortnite', 'Visa', 'Amazon', 'Steam', 'Roblox'];

async function giftCardWithdraw(user, cardType, coinAmount, countryCode, isVerified) {
  if (!user) {
    throw new Error('Please login to withdraw!');
  }

  if (cardTypes.includes(cardType)) {
    throw new Error('An error occurred. Please try refreshing.');
  }

  if (isNaN(coinAmount) || !coinAmount) {
    throw new Error('Please select an amount!');
  }

  const canUserWithdraw = await checkCanUserWithdraw(user.gainId, coinAmount);
  if (!canUserWithdraw.canUserWithdraw) {
    throw new Error(canUserWithdraw.reason);
  }

  if (isVerified) {
    let giftCardCode = '';
    try {
      giftCardCode = await GiftcardService.getGiftcard(cardType, coinAmount, countryCode);
    } catch (error) {
      let message = 'An error occurred';
      if (typeof error == 'GiftCardUnavailableError') {
        message = 'gift card is unavailable';
      }

      throw new Error(message);
    }
  } else {
    let giftCardInStock = false;
    try {
      giftCardInStock = await GiftcardService.isGiftCardInStock(cardType, coinAmount, countryCode);
    } catch (error) {
      throw new Error('An error occurred. Please try refreshing.');
    }

    if (!giftCardInStock) {
      throw new Error('This card is currently out of stock. Please choose another.');
    }
  }

  await submitUserWithdraw(user.gainId, cardType, coinAmount, countryCode, isVerified);
}

async function checkCanUserWithdraw(gainId, coinAmount) {
  const result = {
    canUserWithdraw: false,
    reason: '',
  };

  try {
    const accountStanding = await getAccountStanding(gainId);
    if (accountStanding.banned || accountStanding.frozen) {
      result.reason =
        'You are currently banned from withdrawing, please contact staff if you believe this is a mistake.';
      return result;
    }

    const isEmailVerified = await isDefaultUserEmailVerified(gainId);
    if (!isEmailVerified) {
      result.reason = 'You must verify your E-mail address before requesting a withdrawal!';
      return result;
    }

    const balance = await getBalanceByGainId(gainId);
    if (balance < coinAmount) {
      result.reason = "You don't have enough balance!";
      return result;
    }

    const earnedEnoughBool = await earnedEnoughToWithdraw(gainId);
    if (!earnedEnoughBool) {
      result.reason = `You must earn at least ${config.withdraw.minEarnedToWithdraw} coins ($${(
        config.withdraw.minEarnedToWithdraw / 1000
      ).toFixed(
        2
      )}) through the offer walls before withdrawing.<br>This is to prevent abuse of the site bonuses. Please contact staff with any questions.`;
      return result;
    }
  } catch (error) {
    throw new Error('An error occurred, please try again');
  }
}

async function submitUserWithdraw(gainId, cardType, coinAmount, countryCode, isVerified) {
  try {
    await updateBalanceByGainId(gainId, coinAmount * -1);

    if (isVerified) {
      await insertSiteGiftCardWithdrawal(
        gainId,
        coinAmount,
        cardType,
        countryCode,
        utils.getIsoString(),
        null
      );

      Notifications.storeNotification(
        gainId,
        'Info',
        'approvedwithdrawal',
        `Your ${type} Gift Card withdrawal worth ${coinAmount} coins is pending.`
      );
    } else {
      await insertPendingSiteGiftCardWithdraw(
        gainId,
        coinAmount,
        cardType,
        countryCode,
        utils.getIsoString(),
        null
      );

      Notifications.storeNotification(
        gainId,
        'Info',
        'pendingwithdrawal',
        `Your ${type} Gift Card withdrawal worth ${coinAmount} coins is pending.`
      );
    }

    emitBalance(gainId);
  } catch (error) {
    throw new Error('An error occurred, please try again');
  }
}

module.exports = {
  giftCardWithdraw,
};
