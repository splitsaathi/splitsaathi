// src/utils/format.js

export const formatCurrency = (amount) => {
  return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatCurrencyShort = (amount) => {
  const n = Number(amount || 0);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toFixed(0)}`;
};

export const formatDate = (date, format = 'short') => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (format === 'short')  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (format === 'long')   return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  if (format === 'relative') return formatRelativeDate(d);
  return d.toLocaleDateString('en-IN');
};

export const formatRelativeDate = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffDays = Math.floor((new Date() - d) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(d, 'short');
};

export const formatPhone = (phone) => {
  const clean = (phone || '').replace(/\D/g, '').slice(-10);
  if (clean.length !== 10) return phone;
  return `${clean.slice(0,5)} ${clean.slice(5)}`;
};

export const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const firstName = (name = '') => name.trim().split(' ')[0];
