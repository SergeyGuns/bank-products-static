document.addEventListener('DOMContentLoaded', () => {
  const filter = document.getElementById('bankFilter');
  if (!filter) return;

  filter.addEventListener('change', () => {
    const value = filter.value;
    const cards = document.querySelectorAll('[data-bank]');
    cards.forEach(card => {
      const cardBank = card.dataset.bank || '';
      card.style.display = (value === 'all' || cardBank === value) ? '' : 'none';
    });
  });
});
