// src/utils/validation.js

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPhone = (phone) => /^[6-9]\d{9}$/.test((phone || '').replace(/\D/g, ''));

export const isValidUPI = (upi) => /^[\w.-]+@[\w]+$/.test(upi);

export const isValidPassword = (password) => (password || '').length >= 6;

export const validateBillForm = ({ title, amount, paidBy, splitAmong }) => {
  if (!title?.trim()) return 'Bill ka naam daalo!';
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return 'Sahi amount daalo!';
  if (!paidBy) return 'Kisne pay kiya, select karo!';
  if (!splitAmong?.length) return 'Kam se kam 1 member select karo!';
  return null;
};

export const validateGroupForm = ({ name, members }) => {
  if (!name?.trim()) return 'Group ka naam daalo!';
  if (!members?.length) return 'Kam se kam 1 member chuno!';
  return null;
};

export const validateSignupForm = ({ name, email, password, confirm }) => {
  if (!name?.trim()) return 'Naam daalo!';
  if (!isValidEmail(email)) return 'Sahi email daalo!';
  if (!isValidPassword(password)) return 'Password min 6 characters hona chahiye!';
  if (password !== confirm) return 'Passwords match nahi kar rahe!';
  return null;
};

