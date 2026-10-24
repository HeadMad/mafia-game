import { mount } from 'svelte';
import App from './App.svelte';
import './lib/css/tokens';
import './lib/css/resets';

const app = mount(App, {
	target: document.getElementById('app')
});

export default app;
