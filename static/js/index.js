// 在全局作用域存储语言数据
const languageData = document.getElementById('language-data').textContent;
const langData = document.getElementById('lang-data').textContent;

let currentLanguage, currentLang;
try {
    currentLanguage = JSON.parse(languageData);
    currentLang = JSON.parse(langData);
} catch (error) {
    console.error('Failed to parse language data:', error);
    currentLanguage = {};
    currentLang = 'en';
}

// 模态框实例
let addModal, editModal, languageModal;

// 当前正在编辑的设备ID
let currentEditingId;

document.addEventListener('DOMContentLoaded', function() {
    addModal = new bootstrap.Modal(document.getElementById('addDeviceModal'));
    editModal = new bootstrap.Modal(document.getElementById('editDeviceModal'));
    languageModal = new bootstrap.Modal(document.getElementById('languageModal'));
    loadDevices();
    // 每30秒刷新一次设备状态
    setInterval(updateAllDevicesStatus, 30000);
});

function showAddDeviceModal() {
    document.getElementById('addDeviceForm').reset();
    addModal.show();
}

function showEditDeviceModal(device) {
    currentEditingId = device.id;
    const form = document.getElementById('editDeviceForm');
    form.elements['name'].value = device.name;
    form.elements['ip'].value = device.ip;
    form.elements['mac'].value = device.mac;
    form.elements['broadcast'].value = device.broadcast;
    editModal.show();
}

async function loadDevices() {
    try {
        const response = await fetch('/api/devices');
        const devices = await response.json();
        displayDevices(devices);
        // 设备显示后，检查所有设备的状态
        devices.forEach(device => {
            checkStatus(device.id);
        });
    } catch (error) {
        showError('加载设备列表失败');
    }
}

function displayDevices(devices) {
    const container = document.getElementById('devices-container');
    container.innerHTML = '';
    
    devices.forEach(device => {
        const card = document.createElement('div');
        card.className = 'device-card';
        card.innerHTML = `
            <div class="card-body">
                <div class="device-header">
                    <h5 class="device-name">${device.name}</h5>
                    <span class="status-badge" id="status-${device.id}" title="${currentLanguage.checking}">
                        <i class="bi bi-circle-fill"></i>
                        <span class="status-text">${currentLanguage.checking}</span>
                    </span>
                </div>
                <div class="device-info">
                    <div class="info-row">
                        <span class="info-label">${currentLanguage.ip_address}</span>
                        <span class="info-value">${device.ip}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">${currentLanguage.mac_address}</span>
                        <span class="info-value">${device.mac}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">${currentLanguage.broadcast_address}</span>
                        <span class="info-value">${device.broadcast}</span>
                    </div>
                </div>
                <div class="device-actions">
                    <button class="btn btn-primary" onclick="wakeDevice(${device.id})">
                        <i class="bi bi-power"></i> ${currentLanguage.wake}
                    </button>
                    <button class="btn btn-info" onclick="checkStatus(${device.id})">
                        <i class="bi bi-arrow-repeat"></i> ${currentLanguage.status}
                    </button>
                    <button class="btn btn-warning" onclick="showEditDeviceModal(${JSON.stringify(device).replace(/"/g, '"')})">
                        <i class="bi bi-pencil"></i> ${currentLanguage.edit_device}
                    </button>
                    <button class="btn btn-danger" onclick="deleteDevice(${device.id})">
                        <i class="bi bi-trash"></i> ${currentLanguage.delete}
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

async function addDevice() {
    const form = document.getElementById('addDeviceForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = {
        name: form.elements['name'].value,
        ip: form.elements['ip'].value,
        mac: form.elements['mac'].value,
        broadcast: form.elements['broadcast'].value
    };

    try {
        const response = await fetch('/api/devices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            addModal.hide();
            showSuccess(currentLanguage.device_added);
            loadDevices();
        } else {
            throw new Error(currentLanguage.device_add_failed);
        }
    } catch (error) {
        showError(error.message);
    }
}

async function updateDevice() {
    const form = document.getElementById('editDeviceForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = {
        name: form.elements['name'].value,
        ip: form.elements['ip'].value,
        mac: form.elements['mac'].value,
        broadcast: form.elements['broadcast'].value
    };

    try {
        const response = await fetch(`/api/devices/${currentEditingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            editModal.hide();
            showSuccess(currentLanguage.device_updated);
            loadDevices();
        } else {
            throw new Error(currentLanguage.device_update_failed);
        }
    } catch (error) {
        showError(error.message);
    }
}

async function deleteDevice(id) {
    const result = await Swal.fire({
        title: currentLanguage.confirm_delete,
        text: currentLanguage.confirm_delete_message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: currentLanguage.confirm_delete_button,
        cancelButtonText: currentLanguage.cancel
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`/api/devices/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showSuccess(currentLanguage.device_deleted);
                loadDevices();
            } else {
                throw new Error(currentLanguage.device_delete_failed);
            }
        } catch (error) {
            showError(error.message);
        }
    }
}

async function wakeDevice(id) {
    try {
        const response = await fetch(`/api/devices/${id}/wake`, {
            method: 'POST'
        });
        const result = await response.json();

        if (result.success) {
            showSuccess(currentLanguage.wake_signal_sent);
            setTimeout(() => checkStatus(id), 5000); // 5秒后检查状态
        } else {
            throw new Error(currentLanguage.wake_signal_failed);
        }
    } catch (error) {
        showError(error.message);
    }
}

async function checkStatus(id) {
    // 设置状态为checking
    const statusBadge = document.getElementById(`status-${id}`);
    if (statusBadge) {
        statusBadge.className = 'status-badge';
        statusBadge.innerHTML = `
            <i class="bi bi-circle-fill"></i>
            <span class="status-text">${currentLanguage.checking}</span>
        `;
        statusBadge.title = currentLanguage.checking;
    }
    
    try {
        const response = await fetch(`/api/devices/${id}/status`);
        const result = await response.json();
        updateDeviceStatus(id, result.online);
    } catch (error) {
        showError(currentLanguage.status_check_failed);
    }
}

async function updateAllDevicesStatus() {
    const devices = document.querySelectorAll('.device-card');
    devices.forEach(async (device) => {
        const id = device.querySelector('.btn-primary').getAttribute('onclick').match(/\d+/)[0];
        await checkStatus(id);
    });
}

function updateDeviceStatus(deviceId, isOnline) {
    const statusBadge = document.getElementById(`status-${deviceId}`);
    if (statusBadge) {
        statusBadge.className = 'status-badge ' + (isOnline ? 'online' : 'offline');
        statusBadge.innerHTML = `
            <i class="bi bi-circle-fill"></i>
            <span class="status-text">${isOnline ? currentLanguage.online : currentLanguage.offline}</span>
        `;
        statusBadge.title = isOnline ? currentLanguage.online : currentLanguage.offline;
    }
}

function showSuccess(message) {
    Swal.fire({
        title: currentLanguage.success,
        text: message,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
    });
}

function showError(message) {
    Swal.fire({
        title: currentLanguage.error,
        text: message,
        icon: 'error'
    });
}

async function exportDevices() {
    try {
        const response = await fetch('/api/devices/export');
        if (!response.ok) {
            throw new Error(currentLanguage.export_failed);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // 从响应头中获取文件名
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition ? contentDisposition.split('filename=')[1].replace(/"/g, '') : 'devices_export.json';
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess(currentLanguage.export_success);
    } catch (error) {
        showError(error.message);
    }
}

async function importDevices() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/devices/import', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            showSuccess(currentLanguage.import_success);
            loadDevices();
        } else {
            throw new Error(currentLanguage.import_failed);
        }
    } catch (error) {
        showError(error.message);
    }
    fileInput.value = '';
}

function showLanguageModal() {
    languageModal.show();
}

function changeLanguage(lang) {
    // 直接在前端设置cookie
    document.cookie = `lang=${lang}; path=/; max-age=${365*24*60*60}`;
    // 立即重定向
    window.location.href = '/' + lang + '/';
}

// 页面加载时检查cookie
document.addEventListener('DOMContentLoaded', function() {
    const lang = document.cookie.split('; ')
        .find(row => row.startsWith('lang='))
        ?.split('=')[1];
    
    // 如果当前URL的语言与cookie不一致，重定向
    const currentLang = window.location.pathname.split('/')[1];
    if (lang && lang !== currentLang) {
        window.location.href = '/' + lang + '/';
    }
});