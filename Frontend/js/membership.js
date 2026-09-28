document.addEventListener('DOMContentLoaded', function () {
    var api = (window.FITNESS_CONFIG && window.FITNESS_CONFIG.apiBaseUrl) || '../../backend/api.php';
    var checkout = document.createElement('dialog');
    checkout.className = 'checkout-modal';
    checkout.innerHTML = '<form method="dialog" id="checkout-form"><div class="checkout-head"><div><p class="about-eyebrow">SECURE CHECKOUT</p><h2>Reserve your plan</h2></div><button type="submit" class="modal-close" value="cancel" aria-label="Close">&times;</button></div><p class="checkout-selected" id="checkout-selected"></p><label>Payment method<select id="checkout-method"><option>UPI</option><option>Card</option><option>Cash at desk</option></select></label><button class="btn" id="checkout-submit" value="submit" type="submit">Continue securely</button><p class="checkout-note" id="checkout-note"></p></form></dialog>';
    document.body.appendChild(checkout);
    var selectedPlan = null;
    var selectedAmount = null;
    document.querySelectorAll('.pricing-btn, .training-card .pricing-btn').forEach(function (button) {
        button.addEventListener('click', function (event) {
            event.preventDefault();
            var card = button.closest('article');
            var title = card.querySelector('h3').textContent.trim();
            var amountText = (card.querySelector('.pricing-price, .training-price') || {}).textContent || '0';
            selectedPlan = card.classList.contains('training-card') ? 'Personal Training - ' + title : title;
            selectedAmount = Number(amountText.replace(/[^0-9]/g, ''));
            document.getElementById('checkout-selected').textContent = selectedPlan + ' | Rs. ' + selectedAmount.toLocaleString('en-IN');
            document.getElementById('checkout-note').textContent = '';
            checkout.showModal();
        });
    });
    document.getElementById('checkout-form').addEventListener('submit', function (event) {
        if (!event.submitter || event.submitter.value !== 'submit') return;
        event.preventDefault();
        var note = document.getElementById('checkout-note');
        var submit = document.getElementById('checkout-submit');
        submit.disabled = true;
        fetch(api + '?action=create_payment', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: selectedPlan, amount: selectedAmount, payment_method: document.getElementById('checkout-method').value }) }).then(function (response) { return response.json().then(function (data) { if (!response.ok || !data.success) throw new Error(data.message || 'Checkout failed.'); return data; }); }).then(function (data) { note.textContent = data.message; note.className = 'checkout-note checkout-note--success'; submit.textContent = 'Checkout reserved'; }).catch(function (error) { note.textContent = error.message; note.className = 'checkout-note checkout-note--error'; submit.disabled = false; });
    });
});