import collections from "./Collection.js";
export function generateReferralKey() {
  const genrateRandomNumber = () => Math.floor(Math.random() * 10);
  const genrateRandomAlpha = () => String.fromCharCode(Math.floor(Math.random() * 26) + 65);
  let key = `${genrateRandomAlpha()}${genrateRandomAlpha()}${genrateRandomNumber()}${genrateRandomNumber()}${genrateRandomAlpha()}${genrateRandomNumber()}`;
  return key;
};
export async function isRefferalKeyUnique(referralKey) {
  const existingUser = await collections.users().findOne({ referralId: referralKey });
  return !existingUser;
};
