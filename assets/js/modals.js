window.showNeoModal = function({ 
    title = 'Alert', 
    icon = 'fa-solid fa-circle-info', 
    message = '', 
    confirmText = 'OK', 
    cancelText = null, 
    headerColor = '#FDE68A', // Default Yellow
    confirmColor = '#111827', // Default Black
    onConfirm = null 
}) {
    
    // 1. Create the overlay container
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    // Ensure the overlay displays immediately
    overlay.style.display = 'flex'; 

    // 2. Build the buttons dynamically
    let buttonsHtml = '';
    if (cancelText) {
        buttonsHtml += `<button class="neo-button cancel-btn" style="background: #E5E7EB; color: #111827; width: auto; padding: 10px 20px;">${cancelText}</button>`;
    }
    buttonsHtml += `<button class="neo-button confirm-btn" style="background: ${confirmColor}; color: #FFFFFF; width: auto; padding: 10px 20px;">${confirmText}</button>`;

    // 3. Build the modal HTML utilizing your existing CSS classes
    overlay.innerHTML = `
        <div class="modal-content neo-brutal-modal">
            <div class="modal-header" style="background: ${headerColor};">
                <h3><i class="${icon}"></i> ${title}</h3>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px;">
                ${buttonsHtml}
            </div>
        </div>
    `;

    // 4. Inject it into the page
    document.body.appendChild(overlay);

    // 5. Event Listeners for closing/confirming
    const closeModal = () => document.body.removeChild(overlay);

    if (cancelText) {
        overlay.querySelector('.cancel-btn').addEventListener('click', closeModal);
    }

    overlay.querySelector('.confirm-btn').addEventListener('click', () => {
        if (onConfirm) onConfirm(); // Run the custom action if one was provided
        closeModal();
    });
};