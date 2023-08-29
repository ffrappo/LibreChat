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

const defaultCredits = {
  earnings: { referrals: 0, profileHits: 0 },
  spendings: { gpt4: 0 },
  history: {
    referrals: 0,
    profileHits: 0,
    date: getCurrentDate()
  }
}

async function getUserCredInfo(id) {
  try {
    const user = await getUser(id);
    let { credits } = user;
    const currentDate = getCurrentDate();

    // We need to initialize the credits object in DB if the user does not have one yet
    if (!credits) {
      const response = await User.findByIdAndUpdate(id, { $set: { 'credits': defaultCredits } }, { new: true });
      console.log(response.credits);
      credits = defaultCredits;
    }

    // Record past credit earnings
    if (((currentDate - credits.history.date) >= 1000 * 60 * 60 *24)) {
      credits.history = { ...credits.earnings, date: getCurrentDate() };
      const response = await User.findByIdAndUpdate(id, { $set: { 'credits.history': credits.history } }, { new: true });
      console.log(response.credits);
    }

    return { credits: credits };
  } catch (error) {
    console.log(error);
  }
}

// Add 500 credits to referrals if we have not surpass the daily cap of 2000 credits
async function addReferralsCredit(id) {
  const { credits } = await getUserCredInfo(id);

  if ((credits.earnings.referrals - credits.history.referrals) < 2000) {
    try {
      const response = await User.findByIdAndUpdate(
        id,
        { $inc: { 'credits.earnings.referrals': 500 } },
        { new: true }
      );
      console.log(response.credits);
    } catch (error) {
      console.log(error);
    }
  }
}

// Add 100 credits to profileHits if we have not surpass the daily cap of 1000 credits
async function addProfileHitsCredit(id) {
  try {
    const { credits } = await getUserCredInfo(id);

    if (credits.earnings.profileHits - credits.history.profileHits < 1000) {
      const response = await User.findByIdAndUpdate(
        id,
        { $inc: { 'credits.earnings.profileHits': 100 } },
        { new: true }
      );
      console.log(response.credits);
    }
  } catch (error) {
    console.log(error);
  }

}

module.exports = {
  addReferralsCredit,
  addProfileHitsCredit
}