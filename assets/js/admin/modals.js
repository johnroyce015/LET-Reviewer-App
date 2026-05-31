window.showNeoModal = function({ 
    title = 'Alert', 
    icon = 'fa-solid fa-circle-info', 
    message = '', 
    confirmText = 'OK', 
    cancelText = null, 
    headerColor = '#FDE68A', 
    confirmColor = '#C4B5FD', 
    requireInput = false,        // NEW: Triggers the input box
    inputType = 'text',          // NEW: Defines type (e.g. 'password')
    inputPlaceholder = '',       // NEW: Placeholder text
    onConfirm = null 
}) {
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    let buttonsHtml = '';
    
    if (cancelText) {
        buttonsHtml += `<button class="btn-cancel" type="button">${cancelText}</button>`;
    }
    
    buttonsHtml += `<button class="btn-confirm" style="background: ${confirmColor} !important;" type="button">${confirmText}</button>`;

    // Build the Input Box if required
    let inputHtml = '';
    if (requireInput) {
        inputHtml = `
            <div style="margin-top: 15px;">
                <input type="${inputType}" id="neoModalInput" class="neo-input" placeholder="${inputPlaceholder}" style="width: 100%; box-sizing: border-box;" autocomplete="off">
            </div>
        `;
    }

    overlay.innerHTML = `
        <div class="modal-content neo-brutal-modal">
            <div class="modal-header" style="background: ${headerColor};">
                <h3><i class="${icon}"></i> ${title}</h3>
            </div>
            
            <div class="modal-body">
                <p>${message}</p>
                ${inputHtml}
            </div>
            
            <div class="modal-footer">
                ${buttonsHtml}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeModal = () => document.body.removeChild(overlay);

    if (cancelText) {
        overlay.querySelector('.btn-cancel').addEventListener('click', closeModal);
    }

    overlay.querySelector('.btn-confirm').addEventListener('click', () => {
        let val = null;
        if (requireInput) {
            const inputEl = overlay.querySelector('#neoModalInput');
            val = inputEl.value.trim();
            if (!val) {
                // If they try to submit an empty PIN, turn the box red and stop them!
                inputEl.style.border = "3px solid #EF4444";
                inputEl.focus();
                return; 
            }
        }

        if (onConfirm) onConfirm(val); 
        closeModal();
    });
};