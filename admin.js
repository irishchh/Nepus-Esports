document.addEventListener('DOMContentLoaded', () => {
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

// --- DOM Elements ---
const authView = document.getElementById('auth-view');
const mainAppView = document.getElementById('main-app-view');
const loginForm = document.getElementById('login-form');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');
const adminEmail = document.getElementById('admin-email');
const createTournamentForm = document.getElementById('create-tournament-form');
const adminTournamentList = document.getElementById('admin-tournament-list');
const depositRequestsList = document.getElementById('deposit-requests-list');
const withdrawalRequestsList = document.getElementById('withdrawal-requests-list');
const withdrawalHistoryList = document.getElementById('withdrawal-history-list');
const settingsForm = document.getElementById('settings-form');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');

// Main Admin Tabs
const mainTabTournaments = document.getElementById('main-tab-tournaments');
const mainTabSettings = document.getElementById('main-tab-settings');
const mainTabTransactions = document.getElementById('main-tab-transactions');
const panelTournaments = document.getElementById('panel-tournaments');
const panelSettings = document.getElementById('panel-settings');
const panelTransactions = document.getElementById('panel-transactions');
const mainTabMyTournaments = document.getElementById('main-tab-my-tournaments');
const panelMyTournaments = document.getElementById('panel-my-tournaments');
const toggleAdvancedOptions = document.getElementById('toggle-advanced-options');
const advancedOptions = document.getElementById('advanced-options');

// Tournament list tabs
const tListTabAll = document.getElementById('t-list-tab-all');
const tListTabUpcoming = document.getElementById('t-list-tab-upcoming');
const tListTabOngoing = document.getElementById('t-list-tab-ongoing');
const tListTabCompleted = document.getElementById('t-list-tab-completed');


// Transaction tabs
const txTabDeposits = document.getElementById('tx-tab-deposits');
const txTabWithdrawals = document.getElementById('tx-tab-withdrawals');
const txTabHistory = document.getElementById('tx-tab-history');
const txPanelDeposits = document.getElementById('tx-panel-deposits');
const txPanelWithdrawals = document.getElementById('tx-panel-withdrawals');
const txPanelHistory = document.getElementById('tx-panel-history');

const loginBtn = document.getElementById('login-btn');
const toggleLoginPassword = document.getElementById('toggle-login-password');

// --- Transaction Tab Logic ---
if (txTabDeposits) {
    const txTabs = [txTabDeposits, txTabWithdrawals, txTabHistory];
    const txPanels = [txPanelDeposits, txPanelWithdrawals, txPanelHistory];

    txTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Hide all panels
            txPanels.forEach(panel => panel.classList.add('hidden'));
            // Deactivate all tabs
            txTabs.forEach(t => {
                t.classList.remove('text-teal-400', 'border-teal-500');
                t.classList.add('text-slate-400', 'border-transparent');
            });

            // Show the selected panel
            txPanels[index].classList.remove('hidden');
            // Activate the selected tab
            tab.classList.add('text-teal-400', 'border-teal-500');
            tab.classList.remove('text-slate-400', 'border-transparent');
        });
    });
}

let currentAdmin = null;
let currentTournamentFilter = 'all';
let currentMyTournamentFilter = 'all';

// --- Helper Functions ---

// --- Edit Tournament Logic ---
const editTournamentModal = document.getElementById('edit-tournament-modal');
const editTournamentForm = document.getElementById('edit-tournament-form');
const closeEditModalBtn = document.getElementById('close-edit-modal-btn');

async function openEditTournamentModal(tournamentId) {
    const tournamentRef = db.ref(`tournaments/${tournamentId}`);
    const snapshot = await tournamentRef.once('value');
    const tournament = snapshot.val();

    if (tournament) {
        document.getElementById('edit-tournament-id').value = tournamentId;
        document.getElementById('edit-t-name').value = tournament.name;
        document.getElementById('edit-t-status').value = tournament.status;
        document.getElementById('edit-t-desc').value = tournament.description || '';
        document.getElementById('edit-t-room-id').value = tournament.roomId || '';
        document.getElementById('edit-t-room-password').value = tournament.roomPassword || '';
        editTournamentModal.classList.remove('hidden');
    }
}

if (closeEditModalBtn) {
    closeEditModalBtn.addEventListener('click', () => {
        editTournamentModal.classList.add('hidden');
    });
}

if (editTournamentForm) {
    editTournamentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tournamentId = document.getElementById('edit-tournament-id').value;
        const newStatus = document.getElementById('edit-t-status').value;
        const tournamentName = document.getElementById('edit-t-name').value;

        const tournamentRef = db.ref(`tournaments/${tournamentId}`);

        try {
            const snapshot = await tournamentRef.once('value');
            const tournament = snapshot.val();
            const oldStatus = tournament.status;

            const updates = {
                name: tournamentName,
                status: newStatus,
                description: document.getElementById('edit-t-desc').value,
                roomId: document.getElementById('edit-t-room-id').value,
                roomPassword: document.getElementById('edit-t-room-password').value
            };

            await tournamentRef.update(updates);

            if (oldStatus === 'upcoming' && newStatus === 'ongoing' && tournament.registrations) {
                const userIds = Object.keys(tournament.registrations);
                const notificationPromises = userIds.map(userId => {
                    const notificationRef = db.ref(`notifications/${userId}`).push();
                    return notificationRef.set({
                        message: `The tournament '${tournament.name}' has started!`,
                        tournamentId: tournamentId,
                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                        read: false
                    });
                });
                await Promise.all(notificationPromises);
                showToast(`Notifications sent to ${userIds.length} users.`, 'info');
            }

            showToast('Tournament updated successfully!', 'success');
            editTournamentModal.classList.add('hidden');
        } catch (error) {
            showToast('Error updating tournament: ' + error.message, 'error');
        }
    });
}

function handleAuthError(error) {
    let message = 'An unknown error occurred.';
    switch (error.code) {
        case 'auth/user-not-found':
            message = 'No user found with this email.';
            break;
        case 'auth/wrong-password':
            message = 'Incorrect password. Please try again.';
            break;
        case 'auth/invalid-email':
            message = 'The email address is not valid.';
            break;
        default:
            message = error.message;
    }
    showToast(message, 'error');
}

const gameTypes = {
    'PUBG': ['TDM', 'Erangel', 'Miramar', 'Sanhok', 'Vikendi'],
    'Free Fire': ['Clash Squad', 'Bermuda', 'Kalahari', 'Purgatory']
};

function populateGameTypes() {
    const gameSelect = document.getElementById('t-game');
    const gameTypeSelect = document.getElementById('t-game-type');
    const selectedGame = gameSelect.value;

    gameTypeSelect.innerHTML = ''; // Clear existing options

    if (gameTypes[selectedGame]) {
        gameTypes[selectedGame].forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            gameTypeSelect.appendChild(option);
        });
    }
}
document.getElementById('t-game').addEventListener('change', populateGameTypes);

createTournamentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateStage(3)) return;

    const dateTime = document.getElementById('t-datetime').value.split('T');
    const date = dateTime[0];
    const time = dateTime[1];

    const newTournament = {
        createdBy: currentAdmin.uid,
        name: document.getElementById('t-name').value,
        description: document.getElementById('t-desc').value,
        game: document.getElementById('t-game').value,
        gameType: document.getElementById('t-game-type').value,
        format: document.getElementById('t-format').value,
        slots: parseInt(document.getElementById('t-slots').value, 10),
        date: date,
        time: time,
        fee: parseFloat(document.getElementById('t-fee').value),
        prizePool: {
            first: parseFloat(document.getElementById('t-prize-first').value),
            second: parseFloat(document.getElementById('t-prize-second').value),
            third: parseFloat(document.getElementById('t-prize-third').value)
        },
        status: document.getElementById('t-status').value,
        roomId: document.getElementById('t-room-id').value,
        roomPassword: document.getElementById('t-room-password').value,
        registrations: {},
        results: {}
    };

    const newTournamentRef = db.ref('tournaments').push();
    newTournamentRef.set(newTournament)
        .then(() => {
            showToast('Tournament created successfully!', 'success');
            createTournamentForm.reset();
            goToStage(1);
        })
        .catch(error => {
            showToast('Error creating tournament: ' + error.message, 'error');
        });
});

settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const upiId = document.getElementById('upi-id').value;
    const qrCodeFile = document.getElementById('qr-code-upload').files[0];
    const existingQrCodeUrl = document.getElementById('qr-code-preview').src;

    if (!upiId) {
        showToast('Please fill out the Payment ID.', 'error');
        return;
    }

    let qrCodeUrl = existingQrCodeUrl;

    if (qrCodeFile) {
        const storageRef = storage.ref(`qrcodes/${qrCodeFile.name}`);
        try {
            const snapshot = await storageRef.put(qrCodeFile);
            qrCodeUrl = await snapshot.ref.getDownloadURL();
        } catch (error) {
            showToast('Error uploading QR code: ' + error.message, 'error');
            return;
        }
    }

    if (!qrCodeUrl) {
        showToast('Please upload a QR code image.', 'error');
        return;
    }

    db.ref('settings').set({
        upiId: upiId,
        qrCodeUrl: qrCodeUrl
    }).then(() => {
        showToast('Settings saved successfully!', 'success');
    }).catch(error => {
        showToast('Error saving settings: ' + error.message, 'error');
    });
});

function handleGameTypeChange() {
    const gameSelect = document.getElementById('t-game');
    const gameTypeSelect = document.getElementById('t-game-type');
    const teamFormatSelect = document.getElementById('t-format');
    const slotsInput = document.getElementById('t-slots');
    const prizeSecondInput = document.getElementById('t-prize-second');
    const prizeThirdInput = document.getElementById('t-prize-third');

    const prizeSecondContainer = prizeSecondInput.parentElement;
    const prizeThirdContainer = prizeThirdInput.parentElement;

    const selectedGame = gameSelect.value;
    const selectedGameType = gameTypeSelect.value;

    let slots = 0;
    if (selectedGameType === 'TDM' || selectedGameType === 'Clash Squad') {
        slots = 8;
        teamFormatSelect.value = 'Squad';
        teamFormatSelect.disabled = true;

        prizeSecondContainer.style.display = 'none';
        prizeSecondInput.required = false;
        prizeSecondInput.value = 0;

        prizeThirdContainer.style.display = 'none';
        prizeThirdInput.required = false;
        prizeThirdInput.value = 0;
    } else if (selectedGame === 'PUBG' && ['Erangel', 'Miramar', 'Sanhok', 'Vikendi'].includes(selectedGameType)) {
        slots = 100;
        teamFormatSelect.disabled = false;
        prizeSecondContainer.style.display = 'block';
        prizeSecondInput.required = true;
        prizeThirdContainer.style.display = 'block';
        prizeThirdInput.required = true;
    } else if (selectedGame === 'Free Fire' && ['Bermuda', 'Kalahari', 'Purgatory'].includes(selectedGameType)) {
        slots = 48;
        teamFormatSelect.disabled = false;
        prizeSecondContainer.style.display = 'block';
        prizeSecondInput.required = true;
        prizeThirdContainer.style.display = 'block';
        prizeThirdInput.required = true;
    } else {
        teamFormatSelect.disabled = false;
        prizeSecondContainer.style.display = 'block';
        prizeSecondInput.required = true;
        prizeThirdContainer.style.display = 'block';
        prizeThirdInput.required = true;
    }

    slotsInput.value = slots;
}

document.getElementById('t-game-type').addEventListener('change', handleGameTypeChange);

document.getElementById('t-game').addEventListener('change', () => {
    populateGameTypes();
    setTimeout(handleGameTypeChange, 0); 
});

document.addEventListener('DOMContentLoaded', () => {
    // Initialize tabs, auth, etc.
    if (document.getElementById('t-game')) {
        populateGameTypes(); // Initial population
        handleGameTypeChange(); // Adjust form on initial load
    }
});

// --- Authentication Logic ---
auth.onAuthStateChanged(user => {
    if (user) {
        // Verify if the user is an admin
        db.ref('admins').child(user.uid).once('value', snapshot => {
            if (snapshot.exists()) {
                currentAdmin = user;
                authView.classList.add('hidden');
                mainAppView.classList.remove('hidden');
                adminEmail.textContent = user.email;
                fetchAdminTournaments();
                fetchSettings();
                fetchDepositRequests();
                fetchWithdrawalRequests();
                fetchWithdrawalHistory();
            } else {
                // If not an admin, sign them out
                auth.signOut();
                showToast('You are not authorized to access this panel.', 'error');
            }
        });
    } else {
        currentAdmin = null;
        authView.classList.remove('hidden');
        mainAppView.classList.add('hidden');
        adminEmail.textContent = '';
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    toggleLoading(loginBtn, true);
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            handleAuthError(error);
        })
        .finally(() => {
            toggleLoading(loginBtn, false);
        });
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

if (toggleAdvancedOptions) {
    toggleAdvancedOptions.addEventListener('click', () => {
        advancedOptions.classList.toggle('hidden');
    });
}

// --- Mobile Navigation Logic ---
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mainNavContainer = document.getElementById('main-nav-container');
const mobileNavToggle = document.getElementById('mobile-nav-toggle');
const mobileNavMenu = document.getElementById('mobile-nav-menu');
const currentMobileTab = document.getElementById('current-mobile-tab');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mainNavContainer.classList.toggle('hidden');
    });
}

if (mobileNavToggle) {
    mobileNavToggle.addEventListener('click', () => {
        mobileNavMenu.classList.toggle('hidden');
    });
}

document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const panelId = item.dataset.panel;
        const panel = document.getElementById(panelId);

        document.querySelectorAll('.main-panel').forEach(p => p.classList.add('hidden'));
        if (panel) {
            panel.classList.remove('hidden');
        }

        currentMobileTab.textContent = item.textContent;
        mobileNavMenu.classList.add('hidden');
    });
});

// --- Main Admin Tab Logic ---
if (mainTabTournaments) {
    const mainTabs = [mainTabTournaments, mainTabMyTournaments, mainTabSettings, mainTabTransactions];
    const mainPanels = [panelTournaments, panelMyTournaments, panelSettings, panelTransactions];

    mainTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Hide all panels
            mainPanels.forEach(panel => panel.classList.add('hidden'));
            // Deactivate all tabs
            mainTabs.forEach(t => {
                t.classList.remove('text-teal-400', 'border-teal-500');
                t.classList.add('text-slate-400', 'border-transparent');
            });

            // Show the selected panel
            mainPanels[index].classList.remove('hidden');
            // Activate the selected tab
            tab.classList.add('text-teal-400', 'border-teal-500');
            tab.classList.remove('text-slate-400', 'border-transparent');
        });
    });
}

// --- Settings ---
if (settingsForm) {
    const qrCodeUpload = document.getElementById('qr-code-upload');
    const qrFileName = document.getElementById('qr-file-name');

    if (qrCodeUpload && qrFileName) {
        qrCodeUpload.addEventListener('change', () => {
            if (qrCodeUpload.files.length > 0) {
                qrFileName.textContent = qrCodeUpload.files[0].name;
            } else {
                qrFileName.textContent = 'No file chosen';
            }
        });
    }

    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const upiId = document.getElementById('upi-id').value;
        const qrCodeFile = document.getElementById('qr-code-upload').files[0];
        const existingQrCodeUrl = document.getElementById('qr-code-preview').src;

        if (!upiId) {
            showToast('Please fill out the Payment ID.', 'error');
            return;
        }

        let qrCodeUrl = existingQrCodeUrl;

        if (qrCodeFile) {
            const storageRef = storage.ref(`qrcodes/${qrCodeFile.name}`);
            try {
                const snapshot = await storageRef.put(qrCodeFile);
                qrCodeUrl = await snapshot.ref.getDownloadURL();
            } catch (error) {
                showToast('Error uploading QR code: ' + error.message, 'error');
                return;
            }
        }

        if (!qrCodeUrl) {
            showToast('Please upload a QR code image.', 'error');
            return;
        }

        db.ref('settings').set({
            upiId: upiId,
            qrCodeUrl: qrCodeUrl
        }).then(() => {
            showToast('Settings saved successfully!', 'success');
        }).catch(error => {
            showToast('Error saving settings: ' + error.message, 'error');
        });
    });
}

function fetchSettings() {
    const settingsRef = db.ref('settings');
    settingsRef.on('value', (snapshot) => {
        const settings = snapshot.val();
        if (settings) {
            const upiIdInput = document.getElementById('upi-id');
            const qrCodePreview = document.getElementById('qr-code-preview');
            if (upiIdInput) upiIdInput.value = settings.upiId || '';
            if (qrCodePreview && settings.qrCodeUrl) {
                qrCodePreview.src = settings.qrCodeUrl;
                qrCodePreview.classList.remove('hidden');
            }
        }
    });
}

// --- Deposit Requests ---
function fetchDepositRequests() {
    const requestsRef = db.ref('deposits');
    requestsRef.orderByChild('status').equalTo('pending').on('value', (snapshot) => {
        depositRequestsList.innerHTML = '';
        const requests = snapshot.val();
        if (requests) {
            Object.entries(requests).forEach(([id, request]) => {
                const card = createDepositRequestCard(id, request);
                depositRequestsList.appendChild(card);
            });
        } else {
            depositRequestsList.innerHTML = '<p class="text-gray-400">No pending deposit requests.</p>';
        }
    });
}

function createDepositRequestCard(id, request) {
    const card = document.createElement('div');
    card.className = 'bg-slate-700/50 p-4 rounded-lg shadow-md flex justify-between items-center transition-all hover:bg-slate-700';
    card.innerHTML = `
        <div class="flex-1">
            <p class="text-sm text-gray-300 font-medium">${request.userEmail}</p>
            <p class="text-lg font-bold text-white">NPR ${request.amount.toFixed(2)}</p>
            <p class="text-xs text-gray-400 truncate mt-1">ID: ${request.transactionId}</p>
        </div>
        <div class="flex flex-col space-y-2">
            <button data-id="${id}" class="approve-deposit-btn flex items-center justify-center w-24 text-xs font-bold py-2 px-3 rounded-md bg-green-500/20 text-green-300 hover:bg-green-500/40 transition-colors">
                <i class="fas fa-check mr-2"></i>Approve
            </button>
            <button data-id="${id}" class="reject-deposit-btn flex items-center justify-center w-24 text-xs font-bold py-2 px-3 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/40 transition-colors">
                <i class="fas fa-times mr-2"></i>Reject
            </button>
        </div>
    `;
    return card;
}

depositRequestsList.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const id = button.dataset.id;
    if (button.classList.contains('approve-deposit-btn')) {
        approveDepositRequest(id);
    }
    if (button.classList.contains('reject-deposit-btn')) {
        rejectDepositRequest(id);
    }
});

async function approveDepositRequest(id) {
    const requestRef = db.ref(`deposits/${id}`);
    const requestSnap = await requestRef.once('value');
    const request = requestSnap.val();

    if (!request || request.status !== 'pending') return;

    let userId = request.userId;

    // Fallback for older requests that might not have userId
    if (!userId) {
        const usersQuery = db.ref('users').orderByChild('email').equalTo(request.userEmail);
        const usersSnap = await usersQuery.once('value');
        if (usersSnap.exists()) {
            userId = Object.keys(usersSnap.val())[0];
        } else {
            showToast(`User not found for email: ${request.userEmail}`, 'error');
            return;
        }
    }

    const userRef = db.ref(`users/${userId}`);
    try {
        await userRef.transaction((userData) => {
            if (userData) {
                userData.wallet = (userData.wallet || 0) + request.amount;
            }
            return userData;
        });
        await requestRef.update({ status: 'approved', userId: userId });
        showToast('Deposit approved!', 'success');
    } catch (error) {
        showToast('Transaction failed: ' + error.message, 'error');
    }
}

function rejectDepositRequest(id) {
    db.ref(`deposits/${id}`).update({ status: 'rejected' });
}

// --- Withdrawal Requests ---
function fetchWithdrawalRequests() {
    const requestsRef = db.ref('withdrawals');
    requestsRef.orderByChild('status').equalTo('pending').on('value', (snapshot) => {
        withdrawalRequestsList.innerHTML = '';
        const requests = snapshot.val();
        if (requests) {
            Object.entries(requests).forEach(([id, request]) => {
                const card = createWithdrawalRequestCard(id, request);
                withdrawalRequestsList.appendChild(card);
            });
        } else {
            withdrawalRequestsList.innerHTML = '<p class="text-gray-400">No pending withdrawal requests.</p>';
        }
    });
}

function createWithdrawalRequestCard(id, request) {
    const card = document.createElement('div');
    card.className = 'bg-slate-700/50 p-4 rounded-lg shadow-md flex justify-between items-center transition-all hover:bg-slate-700';
    card.innerHTML = `
        <div class="flex-1">
            <p class="text-sm text-gray-300 font-medium">${request.userEmail}</p>
            <p class="text-lg font-bold text-white">NPR ${request.amount.toFixed(2)}</p>
            <p class="text-xs text-gray-400 truncate mt-1">UPI: ${request.upiId}</p>
        </div>
        <div class="flex flex-col space-y-2">
            <button data-id="${id}" class="confirm-withdrawal-btn flex items-center justify-center w-24 text-xs font-bold py-2 px-3 rounded-md bg-green-500/20 text-green-300 hover:bg-green-500/40 transition-colors">
                <i class="fas fa-check mr-2"></i>Confirm
            </button>
            <button data-id="${id}" class="reject-withdrawal-btn flex items-center justify-center w-24 text-xs font-bold py-2 px-3 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/40 transition-colors">
                <i class="fas fa-times mr-2"></i>Reject
            </button>
        </div>
    `;
    return card;
}

withdrawalRequestsList.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const id = button.dataset.id;
    if (button.classList.contains('confirm-withdrawal-btn')) {
        confirmWithdrawalRequest(id);
    }
    if (button.classList.contains('reject-withdrawal-btn')) {
        rejectWithdrawalRequest(id);
    }
});

function confirmWithdrawalRequest(id) {
    const requestRef = db.ref(`withdrawals/${id}`);
    requestRef.once('value', (snapshot) => {
        const request = snapshot.val();
        if (request && request.status === 'pending') {
            const userRef = db.ref(`users/${request.userId}`);
            userRef.transaction((userData) => {
                if (userData) {
                    userData.wallet = (userData.wallet || 0) - request.amount;
                }
                return userData;
            }, (error, committed) => {
                if (error) {
                    showToast('Transaction failed: ' + error.message, 'error');
                } else if (committed) {
                    requestRef.update({ status: 'completed' });
                    showToast('Withdrawal confirmed!', 'success');
                }
            });
        }
    });
}

function rejectWithdrawalRequest(id) {
    db.ref(`withdrawals/${id}`).update({ status: 'rejected' }).then(() => {
        showToast('Withdrawal request rejected.', 'info');
    });
}

async function fetchWithdrawalHistory() {
    const depositsRef = db.ref('deposits');
    const withdrawalsRef = db.ref('withdrawals');

    const [depositsSnap, withdrawalsSnap] = await Promise.all([depositsRef.once('value'), withdrawalsRef.once('value')]);

    const deposits = depositsSnap.val() || {};
    const withdrawals = withdrawalsSnap.val() || {};

    const allTransactions = [];

    Object.entries(deposits).forEach(([id, tx]) => {
        if (tx.status !== 'pending') {
            allTransactions.push({ ...tx, id, type: 'Deposit' });
        }
    });

    Object.entries(withdrawals).forEach(([id, tx]) => {
        if (tx.status !== 'pending') {
            allTransactions.push({ ...tx, id, type: 'Withdrawal' });
        }
    });

    allTransactions.sort((a, b) => b.timestamp - a.timestamp);

    withdrawalHistoryList.innerHTML = '';
    if (allTransactions.length > 0) {
        allTransactions.forEach(tx => {
            const card = createWithdrawalHistoryCard(tx.id, tx);
            withdrawalHistoryList.appendChild(card);
        });
    } else {
        withdrawalHistoryList.innerHTML = '<p class="text-gray-400">No transaction history.</p>';
    }
}

function createWithdrawalHistoryCard(id, request) {
    const card = document.createElement('div');
    card.className = 'bg-slate-700/50 p-4 rounded-lg shadow-md flex justify-between items-center';

    const isDeposit = request.type === 'Deposit';
    const amountColor = isDeposit ? 'text-green-400' : 'text-red-400';
    const amountSign = isDeposit ? '+' : '-';

    let statusColor, statusText;
    switch(request.status) {
        case 'approved':
        case 'completed':
            statusColor = 'bg-green-500/20 text-green-300';
            statusText = isDeposit ? 'Approved' : 'Completed';
            break;
        case 'rejected':
            statusColor = 'bg-red-500/20 text-red-300';
            statusText = 'Rejected';
            break;
        default:
            statusColor = 'bg-slate-600 text-slate-300';
            statusText = 'Pending';
    }

    card.innerHTML = `
        <div class="flex-1">
            <p class="text-sm text-gray-300 font-medium">${request.userEmail}</p>
            <p class="text-lg font-bold ${amountColor}">${amountSign} NPR ${request.amount.toFixed(2)}</p>
            <p class="text-xs text-gray-400 truncate mt-1">${isDeposit ? `TxID: ${request.transactionId}` : `UPI: ${request.upiId}`}</p>
        </div>
        <div class="text-right">
            <p class="text-xs text-gray-400 mb-2">${new Date(request.timestamp).toLocaleString()}</p>
            <span class="text-xs font-semibold px-2 py-1 rounded-full ${statusColor}">${statusText}</span>
        </div>
    `;
    return card;
}



// --- Tournament Management ---
// --- Multi-Stage Form Logic ---
let currentStage = 1;
const stages = [document.getElementById('form-stage-1'), document.getElementById('form-stage-2'), document.getElementById('form-stage-3')];
const indicators = [document.getElementById('step-1-indicator'), document.getElementById('step-2-indicator'), document.getElementById('step-3-indicator')];
const nextBtn = document.getElementById('next-stage-btn');
const prevBtn = document.getElementById('prev-stage-btn');
const submitBtn = document.getElementById('create-tournament-submit-btn');

function goToStage(stage) {
    stages.forEach((s, i) => {
        s.classList.toggle('hidden', i !== stage - 1);
    });
    indicators.forEach((indicator, i) => {
        const p = indicator.nextElementSibling;
        if (i < stage) {
            indicator.classList.add('bg-teal-500', 'text-white');
            indicator.classList.remove('bg-slate-700', 'text-slate-400');
            p.classList.add('text-white');
            p.classList.remove('text-slate-400');
        } else {
            indicator.classList.remove('bg-teal-500', 'text-white');
            indicator.classList.add('bg-slate-700', 'text-slate-400');
            p.classList.remove('text-white');
            p.classList.add('text-slate-400');
        }
    });

    prevBtn.classList.toggle('hidden', stage === 1);
    nextBtn.classList.toggle('hidden', stage === 3);
    submitBtn.classList.toggle('hidden', stage !== 3);
    currentStage = stage;
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        if (validateStage(currentStage)) {
            goToStage(currentStage + 1);
        }
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        goToStage(currentStage - 1);
    });
}

function validateStage(stage) {
    const stageContainer = stages[stage - 1];
    const inputs = stageContainer.querySelectorAll('input[required], textarea[required], select[required]');
    for (const input of inputs) {
        if (!input.value.trim()) {
            showToast(`Please fill out the ${input.previousElementSibling.textContent} field.`, 'error');
            return false;
        }
    }
    return true;
}

createTournamentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const dateTime = document.getElementById('t-datetime').value.split('T');
    const date = dateTime[0];
    const time = dateTime[1];

    const newTournament = {
        createdBy: currentAdmin.uid,
        name: document.getElementById('t-name').value,
        description: document.getElementById('t-desc').value,
        game: document.getElementById('t-game').value,
        gameType: document.getElementById('t-game-type').value,
        format: document.getElementById('t-format').value,
        slots: parseInt(document.getElementById('t-slots').value, 10),
        date: date,
        time: time,
        fee: parseFloat(document.getElementById('t-fee').value),
        prizePool: {
            first: parseFloat(document.getElementById('t-prize-first').value),
            second: parseFloat(document.getElementById('t-prize-second').value),
            third: parseFloat(document.getElementById('t-prize-third').value)
        },
        status: document.getElementById('t-status').value,
        roomId: document.getElementById('t-room-id').value,
        roomPassword: document.getElementById('t-room-password').value,
        registrations: {},
        results: {}
    };

    const newTournamentRef = db.ref('tournaments').push();
    newTournamentRef.set(newTournament)
        .then(() => {
            showToast('Tournament created successfully!', 'success');
            createTournamentForm.reset();
        })
        .catch(error => {
            showToast('Error creating tournament: ' + error.message, 'error');
        });
});

function renderAdminSkeletonCards() {
    adminTournamentList.innerHTML = '';
    for (let i = 0; i < 2; i++) {
        const card = document.createElement('div');
        card.className = 'bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg overflow-hidden animate-pulse';
        card.innerHTML = `
            <div class="p-5">
                <div class="flex justify-between items-start">
                    <div class="space-y-2">
                        <div class="h-5 bg-slate-700 rounded w-48"></div>
                        <div class="h-4 bg-slate-700 rounded w-32"></div>
                    </div>
                    <div class="h-6 bg-slate-700 rounded w-24"></div>
                </div>
                <div class="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-700">
                    <div class="h-4 bg-slate-700 rounded col-span-1"></div>
                    <div class="h-4 bg-slate-700 rounded col-span-1"></div>
                    <div class="h-4 bg-slate-700 rounded col-span-1"></div>
                    <div class="h-4 bg-slate-700 rounded col-span-1"></div>
                </div>
            </div>
            <div class="bg-slate-800/30 px-5 py-3 flex justify-between items-center border-t border-slate-700/50">
                <div class="h-6 bg-slate-700 rounded w-32"></div>
                <div class="flex space-x-2">
                    <div class="h-8 w-8 bg-slate-700 rounded"></div>
                    <div class="h-8 w-8 bg-slate-700 rounded"></div>
                    <div class="h-8 w-8 bg-slate-700 rounded"></div>
                </div>
            </div>
        `;
        adminTournamentList.appendChild(card);
    }
}

function fetchAdminTournaments() {
    const tournamentsRef = db.ref('tournaments');
    renderAdminSkeletonCards();
    tournamentsRef.on('value', (snapshot) => {
        const tournaments = snapshot.val() || {};
        renderAdminTournaments(tournaments);
    });
}

function createTournamentCard(id, tournament) {
    const card = document.createElement('div');
    card.className = 'bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg overflow-hidden';

    let registrantCount = 0;
    if (tournament.registrations) {
        Object.values(tournament.registrations).forEach(reg => {
            if (reg.team && Array.isArray(reg.team)) {
                registrantCount += reg.team.length;
            } else {
                registrantCount += 1; // Fallback for solo or old data
            }
        });
    }

    let statusColor, statusText;
    switch(tournament.status) {
        case 'upcoming': statusColor = 'text-blue-300'; statusText = 'Upcoming'; break;
        case 'ongoing': statusColor = 'text-green-300'; statusText = 'Ongoing'; break;
        case 'completed': statusColor = 'text-gray-400'; statusText = 'Completed'; break;
        default: statusColor = 'text-slate-400'; statusText = 'Unknown';
    }

    card.innerHTML = `
        <div class="p-5">
            <div class="flex justify-between items-start">
                <div class="space-y-1">
                    <h3 class="text-lg font-bold text-white">${tournament.name}</h3>
                    <p class="text-xs text-slate-400">${tournament.game} - ${tournament.gameType}</p>
                </div>
                <span class="text-sm font-semibold px-3 py-1 rounded-full ${statusColor} bg-slate-900/50">${statusText}</span>
            </div>
            <div class="grid grid-cols-4 gap-4 text-center mt-4 pt-4 border-t border-slate-700">
                <div>
                    <div class="text-xs text-slate-400">Players</div>
                    <div class="text-lg font-bold text-white">${registrantCount}/${tournament.slots}</div>
                </div>
                <div>
                    <div class="text-xs text-slate-400">Fee</div>
                    <div class="text-lg font-bold text-white">${tournament.fee}</div>
                </div>
                <div>
                    <div class="text-xs text-slate-400">Prize</div>
                    <div class="text-lg font-bold text-white">${tournament.prizePool.first}</div>
                </div>
                <div>
                    <div class="text-xs text-slate-400">Format</div>
                    <div class="text-lg font-bold text-white">${tournament.format}</div>
                </div>
            </div>
        </div>
        <div class="bg-slate-800/30 px-5 py-3 flex justify-between items-center border-t border-slate-700/50">
             <div class="text-xs text-slate-500">ID: ${id}</div>
            <div class="flex space-x-2">
                <button data-id="${id}" class="view-registrants-btn h-8 w-8 flex items-center justify-center rounded-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/40"><i class="fas fa-users"></i></button>
                <button data-id="${id}" class="edit-tournament-btn h-8 w-8 flex items-center justify-center rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500/40"><i class="fas fa-edit"></i></button>
                <button data-id="${id}" class="delete-tournament-btn h-8 w-8 flex items-center justify-center rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/40"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
    return card;
}

function renderAdminTournaments(tournaments) {
    adminTournamentList.innerHTML = '';
    const filteredTournaments = Object.entries(tournaments).filter(([id, t]) => {
        if (currentTournamentFilter === 'all') return true;
        return t.status === currentTournamentFilter;
    });

    if (filteredTournaments.length === 0) {
        adminTournamentList.innerHTML = '<p class="text-center text-slate-400 py-8">No tournaments match the current filter.</p>';
        return;
    }

    filteredTournaments.forEach(([id, tournament]) => {
        const card = createTournamentCard(id, tournament);
        adminTournamentList.appendChild(card);
    });
}

// Add event listener for the action buttons
adminTournamentList.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const tournamentId = button.dataset.id;
    if (button.classList.contains('edit-tournament-btn')) {
        openEditTournamentModal(tournamentId);
    }
    if (button.classList.contains('view-registrants-btn')) {
        viewRegistrants(tournamentId);
    }
    if (button.classList.contains('delete-tournament-btn')) {
        if (confirm('Are you sure you want to delete this tournament? This cannot be undone.')) {
            db.ref(`tournaments/${tournamentId}`).remove()
                .then(() => showToast('Tournament deleted.', 'info'))
                .catch(err => showToast(`Error: ${err.message}`, 'error'));
        }
    }
});

// --- Tournament List Tab Logic ---

async function viewRegistrants(tournamentId) {
    const tournamentRef = db.ref(`tournaments/${tournamentId}`);
    const snapshot = await tournamentRef.once('value');
    const tournament = snapshot.val();

    let content = `<div class="p-6">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-white">Registrants for ${tournament.name}</h3>
            <button onclick="closeModal()" class="text-slate-400 hover:text-white"><i class="fas fa-times"></i></button>
        </div>`;

    if (tournament.registrations) {
        content += '<div class="space-y-4">';
        for (const userId in tournament.registrations) {
            const reg = tournament.registrations[userId];
            content += `<div class="bg-slate-700/50 p-3 rounded-md">
                <p class="font-semibold text-teal-400">${reg.teamName || 'Solo Player'}</p>
                <ul class="list-disc list-inside text-sm text-slate-300 pl-2 mt-1">
                    ${reg.team.map(player => `<li>${player}</li>`).join('')}
                </ul>
            </div>`;
        }
        content += '</div>';

        // Declare Winner Form
        content += `<div class="mt-6 pt-4 border-t border-slate-700">
            <h4 class="text-md font-bold text-white mb-3">Declare Winner</h4>
            <form id="declare-winner-form">
                <input type="hidden" id="winner-tournament-id" value="${tournamentId}">
                <select id="winner-selection" class="w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 text-white mb-3">
                    ${Object.entries(tournament.registrations).map(([uid, reg]) => `<option value="${uid}">${reg.teamName || reg.team[0]}</option>`).join('')}
                </select>
                <button type="submit" class="w-full text-white font-bold py-2 px-4 rounded-md bg-green-600 hover:bg-green-700">Declare Winner & Distribute Prize</button>
            </form>
        </div>`;

    } else {
        content += '<p class="text-slate-400">No one has registered for this tournament yet.</p>';
    }

    content += '</div>';
    modalContent.innerHTML = content;
    modal.classList.remove('hidden');

    document.getElementById('declare-winner-form').addEventListener('submit', declareWinner);
}

async function declareWinner(e) {
    e.preventDefault();
    const tournamentId = document.getElementById('winner-tournament-id').value;
    const winnerId = document.getElementById('winner-selection').value;

    const tournamentRef = db.ref(`tournaments/${tournamentId}`);
    const snapshot = await tournamentRef.once('value');
    const tournament = snapshot.val();
    const prize = tournament.prizePool.first;

    const winnerRef = db.ref(`users/${winnerId}`);
    const winnerSnapshot = await winnerRef.once('value');
    const winnerData = winnerSnapshot.val();

    const updates = {};
    updates[`/tournaments/${tournamentId}/status`] = 'completed';
    const winnerRegistration = tournament.registrations[winnerId];
    const winnerName = winnerRegistration.teamName || (winnerData ? winnerData.displayName : 'Unknown');
    updates[`/tournaments/${tournamentId}/results/firstPlace`] = winnerName;
    updates[`/users/${winnerId}/wallet`] = (winnerData.wallet || 0) + prize;

    const transactionRef = db.ref(`transactions/${winnerId}`).push();
    updates[`/transactions/${winnerId}/${transactionRef.key}`] = {
        type: 'prize',
        amount: prize,
        tournamentName: tournament.name,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    await db.ref().update(updates);

    showToast('Winner declared and prize distributed!', 'success');
    closeModal();
}

function closeModal() {
    modal.classList.add('hidden');
}

if (tListTabAll) {
    const tListTabs = [
        { el: tListTabAll, filter: 'all' },
        { el: tListTabUpcoming, filter: 'upcoming' },
        { el: tListTabOngoing, filter: 'ongoing' },
        { el: tListTabCompleted, filter: 'completed' },
    ];

    tListTabs.forEach(tabInfo => {
        tabInfo.el.addEventListener('click', () => {
            currentTournamentFilter = tabInfo.filter;
            fetchAdminTournaments(); // This will re-fetch and re-render with the new filter

            // Update tab styles
            tListTabs.forEach(t => {
                t.el.classList.remove('text-teal-400', 'border-teal-500');
                t.el.classList.add('text-slate-400', 'border-transparent');
            });
            tabInfo.el.classList.add('text-teal-400', 'border-teal-500');
            tabInfo.el.classList.remove('text-slate-400', 'border-transparent');
        });
    });
}

function createTournamentCard(id, tournament) {
    const card = document.createElement('div');
    card.className = 'tournament-card relative bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-teal-500/50';

    let statusColor, statusText, statusIcon;
    switch(tournament.status) {
        case 'upcoming': statusColor = 'text-blue-400'; statusText = 'Upcoming'; statusIcon = 'fa-calendar-alt'; break;
        case 'ongoing': statusColor = 'text-green-400'; statusText = 'Ongoing'; statusIcon = 'fa-play-circle'; break;
        case 'completed': statusColor = 'text-gray-400'; statusText = 'Completed'; statusIcon = 'fa-check-circle'; break;
        default: statusColor = 'text-gray-500'; statusText = 'Unknown'; statusIcon = 'fa-question-circle';
    }

    let registrantCount = 0;
    if (tournament.registrations) {
        Object.values(tournament.registrations).forEach(reg => {
            if (reg.team && Array.isArray(reg.team)) {
                registrantCount += reg.team.length;
            } else {
                registrantCount += 1; // Fallback for solo or old data
            }
        });
    }

    card.innerHTML = `
        <div class="tournament-card-bg absolute inset-0 transition-transform duration-300"></div>
        <div class="absolute inset-0 bg-slate-900/60"></div>
        <div class="relative z-10 p-4">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h3 class="text-md font-bold text-white">${tournament.name}</h3>
                    <p class="text-xs text-teal-400 font-semibold">${tournament.game} - ${tournament.gameType}</p>
                </div>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700/50 ${statusColor} flex items-center flex-shrink-0">
                    <i class="fas ${statusIcon} mr-1"></i>${statusText}
                </span>
            </div>

            <div class="grid grid-cols-4 gap-2 text-xs text-slate-300 mb-2">
                <div class="flex items-center"><i class="fas fa-calendar-alt w-4 mr-1 text-slate-400"></i>${new Date(tournament.date).toLocaleDateString()} ${tournament.time}</div>
                <div class="flex items-center"><i class="fas fa-users w-4 mr-1 text-slate-400"></i>${tournament.format}</div>
                <div class="flex items-center"><i class="fas fa-user-friends w-4 mr-1 text-slate-400"></i>${registrantCount} / ${tournament.slots}</div>
                <div class="flex items-center font-semibold text-green-400"><i class="fas fa-coins w-4 mr-1 text-yellow-400"></i>${tournament.fee} Pts</div>
            </div>

            <div class="text-xs text-slate-400 mb-3">
                <span class="font-semibold text-slate-300">Prizes:</span> 
                <i class="fas fa-trophy text-yellow-400"></i> ${tournament.prizePool.first} 
                <i class="fas fa-trophy text-gray-300 ml-2"></i> ${tournament.prizePool.second} 
                <i class="fas fa-trophy text-orange-400 ml-2"></i> ${tournament.prizePool.third}
            </div>

            <div class="border-t border-slate-700/50 pt-2 flex justify-between items-center">
                 <p class="text-sm font-medium text-white">${registrantCount} Registrants</p>
                <div class="flex space-x-2">
                    <button data-id="${id}" class="edit-tournament-btn h-7 w-7 flex items-center justify-center rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500/40"><i class="fas fa-edit text-xs"></i></button>
                    <button data-id="${id}" class="view-registrants-btn h-7 w-7 flex items-center justify-center rounded-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/40"><i class="fas fa-users text-xs"></i></button>
                    <button data-id="${id}" class="delete-tournament-btn h-7 w-7 flex items-center justify-center rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/40"><i class="fas fa-trash text-xs"></i></button>
                </div>
            </div>
        </div>
    `;
    return card;
}

adminTournamentList.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const id = button.dataset.id;
    if (button.classList.contains('delete-btn')) {
        openConfirmationModal('Are you sure you want to delete this tournament?', () => {
            db.ref(`tournaments/${id}`).remove().then(() => {
                showToast('Tournament deleted successfully.', 'success');
            });
        });
    }
    if (button.classList.contains('edit-btn')) {
        openEditModal(id);
    }
    if (button.classList.contains('view-registrants-btn')) {
        openRegistrantsModal(id);
    }
    if (button.classList.contains('results-btn')) {
        openResultsModal(id);
    }
});

// --- Modal Logic ---
function openConfirmationModal(message, onConfirm) {
    modalContent.innerHTML = `
        <div class="p-6 bg-slate-800 text-white rounded-lg">
            <p class="text-lg mb-4">${message}</p>
            <div class="flex justify-end space-x-4">
                <button id="confirm-cancel-btn" class="px-4 py-2 rounded-md text-slate-300 bg-slate-600 hover:bg-slate-700">Cancel</button>
                <button id="confirm-action-btn" class="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700">Confirm</button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');

    document.getElementById('confirm-action-btn').onclick = () => {
        onConfirm();
        closeModal();
    };
    document.getElementById('confirm-cancel-btn').onclick = closeModal;
}

function openEditModal(id) {
    const tournamentRef = db.ref(`tournaments/${id}`);
    tournamentRef.once('value', (snapshot) => {
        const tournament = snapshot.val();
        modalContent.innerHTML = `
            <div class="p-6 bg-slate-800 text-white rounded-lg">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">Edit Tournament</h3>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-white"><i class="fas fa-times fa-lg"></i></button>
                </div>
                <form id="edit-tournament-form" class="space-y-4">
                    <!-- Form fields -->
                    <div>
                        <label for="edit-t-name" class="block text-sm font-medium text-slate-300">Name</label>
                        <input type="text" id="edit-t-name" value="${tournament.name}" required class="mt-1 w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    </div>
                    <div>
                        <label for="edit-t-slots" class="block text-sm font-medium text-slate-300">Slots</label>
                        <input type="number" id="edit-t-slots" value="${tournament.slots || 0}" readonly class="mt-1 w-full px-3 py-2 border rounded-md bg-slate-900 border-slate-600 focus:outline-none">
                    </div>
                    <div>
                        <label for="edit-t-prize-first" class="block text-sm font-medium text-slate-300">1st Prize</label>
                        <input type="number" id="edit-t-prize-first" value="${tournament.prizePool.first || 0}" required class="mt-1 w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    </div>
                    <div>
                        <label for="edit-t-prize-second" class="block text-sm font-medium text-slate-300">2nd Prize</label>
                        <input type="number" id="edit-t-prize-second" value="${tournament.prizePool.second || 0}" required class="mt-1 w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    </div>
                    <div>
                        <label for="edit-t-prize-third" class="block text-sm font-medium text-slate-300">3rd Prize</label>
                        <input type="number" id="edit-t-prize-third" value="${tournament.prizePool.third || 0}" required class="mt-1 w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    </div>
                    <div>
                        <label for="edit-t-room-id" class="block text-sm font-medium text-slate-300">Room ID</label>
                        <input type="text" id="edit-t-room-id" value="${tournament.roomId || ''}" class="mt-1 w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    </div>
                    <div>
                        <label for="edit-t-room-password" class="block text-sm font-medium text-slate-300">Room Password</label>
                        <input type="text" id="edit-t-room-password" value="${tournament.roomPassword || ''}" class="mt-1 w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    </div>
                    <div>
                        <label for="edit-t-status" class="block text-sm font-medium text-slate-300">Status</label>
                        <select id="edit-t-status" required class="mt-1 w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500">
                            <option value="upcoming" ${tournament.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
                            <option value="ongoing" ${tournament.status === 'ongoing' ? 'selected' : ''}>Ongoing</option>
                            <option value="completed" ${tournament.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </div>
                    <div class="flex justify-end pt-4">
                        <button type="submit" class="text-white font-bold py-2 px-6 rounded-md bg-gradient-to-r from-green-500 to-teal-500 hover:opacity-90">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
        modal.classList.remove('hidden');

        document.getElementById('edit-tournament-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const updatedData = {
                name: document.getElementById('edit-t-name').value,
                prizePool: {
                    first: parseFloat(document.getElementById('edit-t-prize-first').value),
                    second: parseFloat(document.getElementById('edit-t-prize-second').value),
                    third: parseFloat(document.getElementById('edit-t-prize-third').value)
                },
                roomId: document.getElementById('edit-t-room-id').value,
                roomPassword: document.getElementById('edit-t-room-password').value,
                status: document.getElementById('edit-t-status').value,
            };
            tournamentRef.update(updatedData).then(() => closeModal());
        });
    });
}

async function openResultsModal(id) {
    const tournamentRef = db.ref(`tournaments/${id}`);
    const snapshot = await tournamentRef.once('value');
    const tournament = snapshot.val();
    const registrants = tournament.registrations || {};
    const registrantEntries = Object.entries(registrants);

    const teams = registrantEntries.map(([uid, registration]) => {
        return {
            uid: uid,
            name: registration.teamName || registration.team.join(', ')
        };
    });

    let registrantsHtml = '<p class="text-slate-400">No registered teams.</p>';
    if (teams.length > 0) {
        registrantsHtml = '<ul class="space-y-3">';
        teams.forEach(team => {
            const result = tournament.results && tournament.results[team.uid] ? tournament.results[team.uid] : { rank: '', prize: '' };
            registrantsHtml += `
                <li class="grid grid-cols-3 gap-3 items-center bg-slate-700 p-3 rounded-md">
                    <span class="text-white col-span-1">${user.displayName}</span>
                    <input type="number" data-uid="${user.uid}" value="${result.rank}" class="rank-input w-full px-2 py-1 border rounded-md bg-slate-600 border-slate-500 text-white" placeholder="Rank">
                    <input type="number" data-uid="${user.uid}" value="${result.prize}" class="prize-input w-full px-2 py-1 border rounded-md bg-slate-600 border-slate-500 text-white" placeholder="Prize (NPR)">
                </li>`;
        });
        registrantsHtml += '</ul>';
    }

    modalContent.innerHTML = `
        <div class="p-6 bg-slate-800 text-white rounded-lg">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold">Manage Results for ${tournament.name}</h3>
                <button onclick="closeModal()" class="text-slate-400 hover:text-white"><i class="fas fa-times fa-lg"></i></button>
            </div>
            <div class="max-h-80 overflow-y-auto mb-4">${registrantsHtml}</div>
            <div class="text-right">
                <button id="save-results-btn" class="text-white font-bold py-2 px-6 rounded-md bg-gradient-to-r from-blue-500 to-teal-400 hover:opacity-90">Save & Distribute</button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');

    document.getElementById('save-results-btn').addEventListener('click', async () => {
        const results = {};
        const prizePromises = [];

        document.querySelectorAll('.rank-input').forEach(rankInput => {
            const uid = rankInput.dataset.uid;
            const prizeInput = document.querySelector(`.prize-input[data-uid="${uid}"]`);
            const rank = rankInput.value.trim();
            const prize = parseFloat(prizeInput.value.trim());

            if (rank && prize > 0) {
                results[uid] = { rank, prize };

                // Distribute prize money
                const userRef = db.ref(`users/${uid}`);
                const prizePromise = userRef.transaction(userData => {
                    if (userData) {
                        userData.wallet = (userData.wallet || 0) + prize;
                    }
                    return userData;
                });
                prizePromises.push(prizePromise);
            }
        });

        try {
            await Promise.all(prizePromises);
            await tournamentRef.child('results').set(results);
            alert('Results saved and prizes distributed successfully!');
            closeModal();
        } catch (error) {
            alert('An error occurred: ' + error.message);
        }
    });
}

async function openRegistrantsModal(id) {
    const tournamentRef = db.ref(`tournaments/${id}`);
    const snapshot = await tournamentRef.once('value');
    const tournament = snapshot.val();
    const registrantIds = tournament.registrations ? Object.keys(tournament.registrations) : [];

    let registrantsHtml = '<p class="text-gray-500">No users have registered for this tournament yet.</p>';
    if (registrantIds.length > 0) {
        registrantsHtml = '<ul class="space-y-2">';
        registrantIds.forEach(uid => {
            const userEmail = `User UID: ${uid.substring(0, 12)}...`;
            registrantsHtml += `<li class="text-gray-700 p-2 bg-gray-50 rounded-md">${userEmail}</li>`;
        });
        registrantsHtml += '</ul>';
    }
    
    modalContent.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold">Registrants for ${tournament.name}</h3>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-800"><i class="fas fa-times fa-lg"></i></button>
            </div>
            <div class="max-h-80 overflow-y-auto">${registrantsHtml}</div>
        </div>
    `;
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
    modalContent.innerHTML = '';
}

// Close modal on outside click
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

function toggleLoading(button, isLoading) {
    const text = button.querySelector('.btn-text');
    const spinner = button.querySelector('.fa-spinner');
    if (isLoading) {
        button.disabled = true;
        text.classList.add('hidden');
        spinner.classList.remove('hidden');
    } else {
        button.disabled = false;
        text.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

function handleAuthError(error) {
    let message = 'Incorrect password. Please try again.';
    switch (error.code) {
        case 'auth/invalid-email':
            message = 'Please enter a valid email address.';
            break;
        case 'auth/user-not-found':
            message = 'No account found with this email address.';
            break;
        case 'auth/wrong-password':
            message = 'Incorrect password. Please try again.';
            break;
    }
    authError.textContent = message;
}

function togglePasswordVisibility(input, button) {
    const icon = button.querySelector('i');
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    icon.classList.toggle('fa-eye', !isPassword);
    icon.classList.toggle('fa-eye-slash', isPassword);
}

toggleLoginPassword.addEventListener('click', () => {
    togglePasswordVisibility(document.getElementById('login-password'), toggleLoginPassword);
});
});
