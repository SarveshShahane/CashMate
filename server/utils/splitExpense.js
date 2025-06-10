function splitExpenseEqually(amount, participants) {
  if (!participants || participants.length === 0) {
    return []; // Or throw an error, depending on desired handling
  }

  const splitDetails = [];
  const numParticipants = participants.length;
  const standardShare = parseFloat((amount / numParticipants).toFixed(2));
  let totalAllocatedAmount = 0;

  for (let i = 0; i < numParticipants; i++) {
    const userId = participants[i]; // Assuming participants is an array of user IDs
    let shareForThisUser;

    if (i < numParticipants - 1) {
      // For all but the last participant, assign the standard share
      shareForThisUser = standardShare;
      totalAllocatedAmount += shareForThisUser;
    } else {
      // For the last participant, assign the remainder to ensure the total matches
      // Round the final share to 2 decimal places as well
      shareForThisUser = parseFloat((amount - totalAllocatedAmount).toFixed(2));
    }
    
    splitDetails.push({
      user: userId,
      share: shareForThisUser // Correct field name
    });
  }

  // Optional sanity check (can be removed in production if confident)
  const sumOfShares = splitDetails.reduce((sum, detail) => sum + detail.share, 0);
  if (parseFloat(sumOfShares.toFixed(2)) !== parseFloat(amount.toFixed(2))) {
      console.warn(`[splitExpenseEqually] Sum of shares (${sumOfShares.toFixed(2)}) does not match original amount (${amount.toFixed(2)}).`);
  }

  return splitDetails;
}

module.exports = splitExpenseEqually;