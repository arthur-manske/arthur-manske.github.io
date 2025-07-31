const btnToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

if (localStorage.getItem('theme') === 'dark') {
	html.setAttribute('data-theme', 'dark');
	btnToggle.textContent = '☀️';
}

btnToggle.addEventListener('click', () => {
	if (html.getAttribute('data-theme') === 'dark') {
		html.removeAttribute('data-theme');
		localStorage.setItem('theme', 'light');
		btnToggle.textContent = '🌙';
	} else {
		html.setAttribute('data-theme', 'dark');
		localStorage.setItem('theme', 'dark');
		btnToggle.textContent = '☀️';
	}
});
