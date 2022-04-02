const assert = require('better-assert');

const query = require('../helpers/mysql');

async function getAccountStanding(gainid) {
  let sql = `
      SELECT * FROM banned WHERE gainid = ?;
      SELECT * FROM frozen WHERE gainid = ?;
      SELECT * FROM muted WHERE gainid = ?;
      SELECT * FROM countrybanned WHERE gainid = ?;
      SELECT deleted FROM users WHERE gainid = ?;
    `;

  try {
    const result = await query(sql, [gainid, gainid, gainid, gainid, gainid]);

    let accountStanding = {
      banned: false,
      frozen: false,
      muted: false,
      countryBanned: false,
      deleted: false,
    };

    if (result[0].length) accountStanding.banned = true;
    if (result[1].length) accountStanding.frozen = true;
    if (result[2].length) accountStanding.muted = true;
    if (result[3].length) accountStanding.countryBanned = true;
    if (result[4][0].deleted) accountStanding.deleted = true;

    return accountStanding;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

async function isDefaultUserEmailVerified(gainid) {
  const sql = `
        SELECT email_confirmed FROM defaultusers WHERE gainid = ?`;

  let isEmailVerified = false;
  try {
    const result = await query(sql, [gainid]);

    if (result && result[0] && result[0].email_confirmed) {
      isEmailVerified = true;
    }

    return isEmailVerified;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

async function isUserVerified(gainid) {
  const sql = `
        SELECT verified FROM users WHERE gainid = ?`;

  let isVerified = false;
  try {
    const result = await query(sql, [gainid]);

    if (result && result[0] && result[0].verified) {
      isVerified = true;
    }

    return isVerified;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

async function getBalanceByGainId(gainid) {
  try {
    const result = await query(`SELECT balance FROM users WHERE gainid = ?`, [gainid]);

    assert(result.length === 1);
    return result[0].balance;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

async function updateBalanceByGainId(gainid, amount) {
  try {
    const result = await query(`UPDATE users SET balance = balance + ? WHERE gainid = ?`, [
      amount,
      gainid,
    ]);

    assert(result.affectedRows === 1);

    const result2 = await query(
      `INSERT INTO balance_movements (gainid, amount, new_balance) VALUES (?, ?, (SELECT balance FROM users WHERE gainid = ?));`,
      [gainid, amount, gainid]
    );

    assert(result2.affectedRows === 1);
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

module.exports = {
  getAccountStanding,
  isDefaultUserEmailVerified,
  isUserVerified,
  getBalanceByGainId,
  updateBalanceByGainId,
};
