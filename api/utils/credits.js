const User = require('../models/User');

async function getUser(id) {
  return await User.findById(id);
}

function getCurrentDate() {
  return new Date(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate()
  );
}

const dailyLimits = {
  referrals: 2000,
  profileHits: 1000,
  date: getCurrentDate()
}

async function getUserCredInfo(id) {
  const user = await getUser(id);
  let { credits = 0, creditLimits = { ...dailyLimits } } = user;
  const currentDate = getCurrentDate();

  if (((currentDate - creditLimits.date) > 1000 * 60 * 60 *24)) {
    creditLimits = { ...dailyLimits };
  }

  return { credits: credits, creditLimits: creditLimits };
}

async function addReferralsCredit(id) {
  const { credits, creditLimits } = await getUserCredInfo(id);

  if (creditLimits.referrals > 0) {
    User.findByIdAndUpdate(
      id,
      { $set: {
        credits: credits + 500,
        creditLimits: { ...creditLimits, referrals: creditLimits.referrals - 500 }
      }
      }
    )
  }
}

async function addProfileHitsCredit(id) {
  const { credits, creditLimits } = await getUserCredInfo(id);

  if (creditLimits.profileHits > 0) {
    User.findByIdAndUpdate(
      id,
      { $set: {
        credits: credits + 100,
        creditLimits: { ...creditLimits, referrals: creditLimits.profileHits - 100 }
      }
      }
    )
  }
}

module.exports = {
  addReferralsCredit,
  addProfileHitsCredit
}