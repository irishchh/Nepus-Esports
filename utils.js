function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

function toggleLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const spinner = button.querySelector('.fa-spinner');
    if (isLoading) {
        button.disabled = true;
        if(btnText) btnText.classList.add('hidden');
        if(spinner) spinner.classList.remove('hidden');
    } else {
        button.disabled = false;
        if(btnText) btnText.classList.remove('hidden');
        if(spinner) spinner.classList.add('hidden');
    }
}
