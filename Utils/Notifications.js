// ALL NOTIFICATIONS INSTANCES

import NotificationModel from "../Models/Notifications.js";
export const newRentInitiated = (userId, sourceId, amount) => {
  let res = new NotificationModel().fromJson({
    userId: userId,
    title: `Your monthly rent of Rs - ${amount} has been Initiated`,
    sourceId: sourceId,
    icon: "paid",
    sourceType: 'get-rent-by-id',
  })
  return res.toDatabaseJson();
}

export const amountAdded = (userId, transactionId, amount) => {
  let res = new NotificationModel().fromJson({
    userId: userId,
    title: `Your Account has been credited with - RS${amount}`,
    icon: "wallet",
    sourceId: transactionId,
    sourceType: "get-trans-by-id"
  })
  return res.toDatabaseJson;
}

export const amountWithdraw = (userId, transactionId, amount) => {
  let res = new NotificationModel().fromJson({
    userId: userId,
    icon: "check",
    title: `Your withdrawal request has been successfully made with- RS${amount}`,
    sourceId: transactionId,
    sourceType: "get-trans-by-id"
  })
  return res;
}

export const transfered = (userId, transactionId, receiverId, amount) => {
  const res = new NotificationModel().fromJson({
    userId: userId,
    title: `Amount - RS${amount} transfered to ${receiverId}`,
    sourceId: transactionId,
    icon: "receipt",
    sourceType: "get-trans-by-id"
  })
  return res.toDatabaseJson();
}

export const monthlyRent = (userId, amount, rendId) => {
  return {
    userId: userId,
    title: `Your monthly rent of RS${amount} has been made. Your account will be credited by end of the month.`,
    sourceId: rendId,
    icon: "wallet",
    sourceType: "get-rent-by-id"
  }
}

export const newIncentive = (userId, amount, incomeId) => {
  let res = new NotificationModel().fromJson({
    userId: userId,
    title: `Congratulations! Your new incentive of RS${amount} has been added to your wallet. Keep it up.`,
    sourceId: incomeId,
    icon: "redeem",
    sourceType: "get-income-by-id"
  })
  return res.toDatabaseJson();
}

export const unsuccessfulTransaction = (userId, transactionId) => {
  let res = new NotificationModel().fromJson({
    userId: userId,
    title: "You have made a Unsuccessful Transaction",
    sourceId: transactionId,
    icon: "report",
    sourceType: "get-trans-by-id"
  })
  return res.toDatabaseJson();
}

export const newRef = (userId, referedId) => {
  let res =new NotificationModel().fromJson({
    userId: userId,
    title: `Congratulations! you have successfully Reffered new Id.${userId}`,
    icon: "groupadd",
    route: `get-user-by-Id?userId=${referedId}`,
    type: "registration",
    link: "/dashboard"
  })
  return res.toDatabaseJson();
}

export const rewardAchieved = (userId, rewardId, reward) => {
  let res = new NotificationModel().fromJson({
    userId: userId,
    title: `Congratulations! you have successfully Achieved a new Reward of (${reward})`,
    sourceId: rewardId,
    icon: "gift",
    sourceType: `get-claim-by-userId/`
  })
  return res.toDatabaseJson();
}

export const royalityAch = (userId, royalityId, designation) => {
  let res = new NotificationModel().fromJson({
    userId: userId,
    title: `Congratulations! you have successfully Become a (${designation})`,
    sourceId: royalityId,
    icon: "gift",
    sourceType: `get-rent-by-userId`
  })
  return res.toDatabaseJson();
}


export const newPlacement = (userId, referedId) => {
  let res = new NotificationModel().fromJson({
    userId: userId,
    title: `Congratulations! New member has been places under your id.`,
    sourceId: referedId,
    icon: "personadd",
    sourceType: `get-user-by-Id/${referedId}`
  })
  return res.toDatabaseJson();
}

export const newConnection = (userId) => {
  let res = new NotificationModel().fromJson({
    userId: userId,
    title: "Congratulations! You took first step towards profitable future. Kindly complete transaction to start earning.",
    sourceId: userId,
    icon: "inventory",
    sourceType: "get-connection-by-userId"
  })
  return res.toDatabaseJson();
}

export const transactionMade = (userId, transactionId) => {
  let res = new NotificationModel().fromJson({
    userId: userId,
    title: "You have made a successfull Transaction. Kindly activate connection to receive Monthly rent.",
    sourceId: transactionId,
    icon: "paid",
    sourceType: "get-transaction-by-id"
  });
  return res;
}