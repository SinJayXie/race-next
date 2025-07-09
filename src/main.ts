import { createApp } from '@/race';
import { Counter } from './views';

// 创建 App
const app = createApp(Counter);
// 挂载 App
app.mount('#race');
