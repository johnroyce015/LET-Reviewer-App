window.showNeoModal = function({ 
    title = 'Alert', 
    icon = 'fa-solid fa-circle-info', 
    message = '', 
    confirmText = 'OK', 
    cancelText = null, 
    headerColor = '#FDE68A', 
    confirmColor = '#111827', 
    onConfirm = null 
}) {
    
    // 1. Create the overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex'; 

    // 2. Build the buttons
    let buttonsHtml = '';
    
    if (cancelText) {
        buttonsHtml += `<button class="neo-button cancel-btn" style="background: #E5E7EB; color: #111827; padding: 10px 20px; width: auto; border: 2px solid #111827; font-weight: bold; cursor: pointer;">${cancelText}</button>`;
    }
    
    buttonsHtml += `<button class="neo-button confirm-btn" style="background: ${confirmColor}; color: #FFFFFF; padding: 10px 20px; width: auto; border: 2px solid #111827; font-weight: bold; cursor: pointer;">${confirmText}</button>`;

    // 3. Build the modal HTML (No 'X' button!)
    overlay.innerHTML = `
        <div class="modal-content neo-brutal-modal">
            <div class="modal-header" style="background: ${headerColor}; display: flex; align-items: center;">
                <h3 style="margin: 0;"><i class="${icon}"></i> ${title}</h3>
            </div>
            
            <div class="modal-body">
                <p style="font-weight: 600; margin: 0; color: #374151;">${message}</p>
            </div>
            
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 12px; background: #F9FAFB;">
                ${buttonsHtml}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeModal = () => document.body.removeChild(overlay);

    // 4. Wire up the buttons
    if (cancelText) {
        overlay.querySelector('.cancel-btn').addEventListener('click', closeModal);
    }

    overlay.querySelector('.confirm-btn').addEventListener('click', () => {
        if (onConfirm) onConfirm(); 
        closeModal();
    });
};