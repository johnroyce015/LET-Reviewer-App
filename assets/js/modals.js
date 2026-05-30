window.showNeoModal = function({ 
    title = 'Alert', 
    icon = 'fa-solid fa-circle-info', 
    message = '', 
    confirmText = 'OK', 
    cancelText = null, 
    headerColor = '#FDE68A', 
    confirmColor = '#111827', // Dynamic color is back!
    onConfirm = null 
}) {
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    let buttonsHtml = '';
    
    if (cancelText) {
        // Restored thick classes and neutral gray
        buttonsHtml += `<button class="neo-button btn-cancel" style="background: #E5E7EB; color: #111827;">${cancelText}</button>`;
    }
    
    // Restored dynamic confirmColor! Delete will be Red, Save will be Green/Purple.
    buttonsHtml += `<button class="neo-button btn-confirm" style="background: ${confirmColor}; color: #FFFFFF;">${confirmText}</button>`;

    overlay.innerHTML = `
        <div class="modal-content neo-brutal-modal">
            <div class="modal-header" style="background: ${headerColor};">
                <h3><i class="${icon}"></i> ${title}</h3>
            </div>
            
            <div class="modal-body">
                <p>${message}</p>
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
        if (onConfirm) onConfirm(); 
        closeModal();
    });
};