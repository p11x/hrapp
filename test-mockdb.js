import { mockDb } from './src/mock/mockDb.ts';
let prev = null;
mockDb.onValue('tasks', (snap) => {
  const current = snap.val();
  console.log('Tasks updated. Same ref?', prev === current);
  prev = current;
});
mockDb.set('tasks/task-001', { status: 'Completed' });
