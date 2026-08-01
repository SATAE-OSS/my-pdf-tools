(() => {
    'use strict';

    const isAppleTouchDevice = /iPad|iPhone|iPod/i.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    function dataUrlToBlob(dataUrl) {
        const [header, encoded] = dataUrl.split(',');
        const mimeType = header.match(/^data:([^;]+)/)?.[1] || 'application/octet-stream';
        const binary = header.includes(';base64') ? atob(encoded) : decodeURIComponent(encoded);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
        return new Blob([bytes], { type: mimeType });
    }

    function reserveWindow() {
        if (!isAppleTouchDevice) return null;
        const target = window.open('', '_blank');
        if (target) {
            target.document.title = 'กำลังเตรียมไฟล์';
            target.document.body.textContent = 'กำลังเตรียมไฟล์ กรุณารอสักครู่…';
        }
        return target;
    }

    function classicDownload(blob, fileName, fallbackWindow = null) {
        const url = URL.createObjectURL(blob);
        if (isAppleTouchDevice) {
            const target = fallbackWindow || window.open('', '_blank');
            if (target) target.location.href = url;
            else window.location.href = url;
            window.setTimeout(() => URL.revokeObjectURL(url), 60000);
            return 'opened';
        }

        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.rel = 'noopener';
        link.hidden = true;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        return 'downloaded';
    }

    async function saveBlob(blob, fileName, options = {}) {
        const fallbackWindow = options.fallbackWindow || null;
        if (isAppleTouchDevice && navigator.share && navigator.canShare) {
            const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
            if (navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({ files: [file], title: options.title || fileName });
                    if (fallbackWindow && !fallbackWindow.closed) fallbackWindow.close();
                    return 'shared';
                } catch (error) {
                    if (error?.name === 'AbortError') {
                        if (fallbackWindow && !fallbackWindow.closed) fallbackWindow.close();
                        return 'cancelled';
                    }
                }
            }
        }
        return classicDownload(blob, fileName, fallbackWindow);
    }

    function saveDataUrl(dataUrl, fileName, options = {}) {
        return saveBlob(dataUrlToBlob(dataUrl), fileName, options);
    }

    window.janeDownload = {
        isAppleTouchDevice,
        reserveWindow,
        saveBlob,
        saveDataUrl
    };
})();
