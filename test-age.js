function checkAge(date) {
  const dob = new Date(date);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 18 && age <= 100;
}
console.log('2023-01-01', checkAge('2023-01-01'));
console.log('2000-01-01', checkAge('2000-01-01'));
console.log('1920-01-01', checkAge('1920-01-01'));
console.log('2008-07-21', checkAge('2008-07-21')); // today is 2026-07-21
console.log('2008-07-22', checkAge('2008-07-22'));
