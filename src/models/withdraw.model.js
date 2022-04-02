const assert = require('better-assert');

const query = require('../helpers/mysql');

async function earnedEnoughToWithdraw(gainid) {
  try {
    const result = await query(
      `
        SELECT SUM(coins) AS coins FROM (
          SELECT SUM(coins) AS coins FROM surveys WHERE gainid = ?
            UNION ALL
          SELECT SUM(coins) AS coins FROM videos WHERE gainid = ?
            UNION ALL
          SELECT SUM(coins) AS coins FROM refearnings WHERE gainid = ?
        ) AS f
      `,
      [gainid, gainid, gainid]
    );

    return result[0].coins && result[0].coins >= config.withdraw.minEarnedToWithdraw;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

async function insertPendingSiteGiftCardWithdraw(
  gainid,
  coinAmount,
  cardType,
  countryCode,
  date,
  warningMessage
) {
  let sql = `
      INSERT INTO pendingwithdraw (gainid, date, warning_message) VALUES (?, ?, ?);
      INSERT INTO pending_site_gift_card_withdraw (releaseid, coinamount, card_type, date, country_code) VALUES
      (LAST_INSERT_ID(), ?, ?, ?, ?);
    `;

  try {
    const result = await query(sql, [
      gainid,
      date,
      warningMessage,
      coinAmount,
      cardType,
      date,
      countryCode,
    ]);

    assert(result.length === 2);

    return result;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

async function insertSiteGiftCardWithdrawal(
  gainid,
  coinAmount,
  cardCode,
  cardType,
  countryCode,
  date,
  approver
) {
  let sql = `
      INSERT INTO withdraw (gainid, date, approver) VALUES (?, ?, ?);
      INSERT INTO site_gift_card_withdraw (withdrawid, coinamount, card_code, card_type, date, country_code) VALUES
      (LAST_INSERT_ID(), ?, ?, ?, ?, ?)
    `;
  try {
    const result = await query(sql, [
      gainid,
      date,
      approver,
      coinAmount,
      cardCode,
      cardType,
      date,
      countryCode,
    ]);

    assert(result.length === 2);

    return result;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

module.exports = {
  earnedEnoughToWithdraw,
  insertPendingSiteGiftCardWithdraw,
  insertSiteGiftCardWithdrawal,
};
