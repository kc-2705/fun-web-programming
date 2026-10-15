const lamp = document.getElementById('lamp');
const hint = document.getElementById('hint');
const form = document.getElementById('loginForm');
const formMessage = document.getElementById('formMessage');

const toggleLamp = () => {
  const on = lamp.classList.toggle('lamp-on');
  lamp.setAttribute('aria-pressed', on);
  lamp.setAttribute('aria-label', on ? 'Turn the lamp off' : 'Turn the lamp on');
  form.setAttribute('aria-hidden', !on);
  hint.textContent = on ? 'Pull again to turn it off' : 'Pull the cord to turn on the light';
  if (on) form.querySelector('input').focus({ preventScroll: true });
};

lamp.addEventListener('click', toggleLamp);
lamp.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggleLamp();
  }
});

// Demo only: there is no server, so just greet the user.
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = form.querySelector('input[type="text"]').value.trim();
  formMessage.textContent = `Welcome, ${name}! The lamp is happy to see you.`;
});
