function splitExpenseEqually(amount, participants) {
  const splitAmount = parseFloat((amount / participants.length).toFixed(2));
  const splitBetween = participants.map(userId => ({
    user: userId,
    amountOwed: splitAmount
  }));

  return splitBetween;
}

module.exports = splitExpenseEqually;