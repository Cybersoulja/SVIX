document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('svix-form');
  const resultContainer = document.getElementById('result-container');
  const resultContent = document.getElementById('result-content');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const apiToken = document.getElementById('api-token').value.trim();
    const appName = document.getElementById('app-name').value.trim();

    if (!apiToken || !appName) {
      alert('Please provide both API Token and App Name');
      return;
    }

    // Update UI to show loading
    resultContainer.classList.remove('hidden');
    resultContent.textContent = 'Creating app...';
    resultContent.className = '';

    try {
      const response = await fetch('https://api.eu.svix.com/api/v1/app/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({ name: appName })
      });

      const data = await response.json();

      if (response.ok) {
        resultContent.textContent = `Success!\n\n${JSON.stringify(data, null, 2)}`;
        resultContent.classList.add('success');
      } else {
        resultContent.textContent = `Error: ${response.status} ${response.statusText}\n\n${JSON.stringify(data, null, 2)}`;
        resultContent.classList.add('error');
      }
    } catch (error) {
      resultContent.textContent = `Network Error:\n\n${error.message}`;
      resultContent.classList.add('error');
    }
  });
});
