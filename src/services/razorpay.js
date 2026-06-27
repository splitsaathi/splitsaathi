// Razorpay integration — placeholder until react-native-razorpay is properly installed
// For now, settlement is recorded directly in the database without payment gateway

import { recordPayment, settleBill } from './database';
import { sendNotification } from './notifications';

const RAZORPAY_KEY = 'rzp_test_YOUR_KEY_HERE';

// ── Main settle function ──────────────────────────────────────────────────────
export const initiatePayment = async ({
  amount,
  description = 'Bill Settlement',
  fromUser,
  toUser,
  billId   = null,
  groupId  = null,
}) => {
  try {
    // Direct settlement (no payment gateway — records as cash/manual payment)
    await recordPayment({
      from_user:  fromUser.id,
      to_user:    toUser.id,
      amount,
      bill_id:    billId,
      group_id:   groupId,
      status:     'success',
      method:     'manual',
    });

    // Mark bill as settled
    if (billId) await settleBill(billId, fromUser.id);

    // Send notification to payee
    await sendNotification({
      toUserId: toUser.id,
      title:    '💸 Payment Received!',
      body:     `${fromUser.name} settled ₹${amount.toFixed(2)}`,
    });

    return { success: true };
  } catch (err) {
    throw err;
  }
};
