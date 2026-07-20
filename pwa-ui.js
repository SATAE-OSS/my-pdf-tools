const onlineStatus = document.getElementById('onlineStatus');
const installAppBtn = document.getElementById('installAppBtn');
const updateToast = document.getElementById('updateToast');
const reloadAppBtn = document.getElementById('reloadAppBtn');
let deferredInstallPrompt = null;

function updateConnectivityUI() {
    const online = navigator.onLine;
    onlineStatus.textContent = online ? 'ออนไลน์' : 'ออฟไลน์';
    onlineStatus.classList.toggle('offline', !online);
}

window.addEventListener('online', updateConnectivityUI);
window.addEventListener('offline', updateConnectivityUI);
updateConnectivityUI();

window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installAppBtn.hidden = false;
});

installAppBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installAppBtn.hidden = true;
});

window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installAppBtn.hidden = true;
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            if (registration.waiting && navigator.serviceWorker.controller) {
                updateToast.hidden = false;
            }
            registration.addEventListener('updatefound', () => {
                const installingWorker = registration.installing;
                installingWorker?.addEventListener('statechange', () => {
                    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        updateToast.hidden = false;
                    }
                });
            });
        } catch (error) {
            console.error('ลงทะเบียน Service Worker ไม่สำเร็จ:', error);
        }
    });
}

reloadAppBtn.addEventListener('click', () => location.reload());
