import { flush, load, resetAll } from './store.js';
import { seedDemo } from './seed.js';

load();
resetAll({ keepSettings: true });
seedDemo();
flush();
console.log('已重置为示例数据。');
