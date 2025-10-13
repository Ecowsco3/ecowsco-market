// AJAX store name availability check with debounce
document.addEventListener("DOMContentLoaded", () => {
  const storeInput = document.getElementById("store_name");
  if (!storeInput) return;

  const msg = document.getElementById("store_availability");
  let timeout;

  storeInput.addEventListener("input", () => {
    clearTimeout(timeout);
    const name = storeInput.value.trim();

    if (name.length < 2) {
      msg.textContent = '';
      return;
    }

    timeout = setTimeout(() => {
      fetch(`/check-store?store_name=${encodeURIComponent(name)}`)
        .then(res => res.json())
        .then(data => {
          if (data.available) {
            msg.textContent = "✅ Available";
            msg.style.color = "green";
          } else {
            msg.textContent = "❌ Already taken";
            msg.style.color = "red";
          }
        })
        .catch(err => {
          console.error('Error checking store:', err);
        });
    }, 300); // waits 300ms after user stops typing
  });
});