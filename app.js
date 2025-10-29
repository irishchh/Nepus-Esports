const auth = firebase.auth();
const db = firebase.database();

// --- DOM Elements ---
const authView = document.getElementById('auth-view');
const mainAppView = document.getElementById('main-app-view');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const authError = document.getElementById('auth-error');
const toggleToSignup = document.getElementById('toggle-to-signup');
const toggleToLogin = document.getElementById('toggle-to-login');
const forgotPasswordLink = document.getElementById('forgot-password-link');
const backToLogin = document.getElementById('back-to-login');
const toggleToSignupText = document.getElementById('toggle-to-signup-text');
const toggleToLoginText = document.getElementById('toggle-to-login-text');
const backToLoginText = document.getElementById('back-to-login-text');
const homeLogoBtn = document.getElementById('home-logo-btn');
const logoutBtn = document.getElementById('logout-btn');
const tournamentList = document.getElementById('tournament-list');
let currentTournament = null;
let allTournaments = {};
const navTournaments = document.getElementById('nav-tournaments');
const navMyRegistrations = document.getElementById('nav-my-registrations');
const navLeaderboard = document.getElementById('nav-leaderboard');
const navProfile = document.getElementById('nav-profile');

// Profile Dropdown Elements
const editProfileBtn = document.getElementById('edit-profile-btn');
const walletBtn = document.getElementById('wallet-btn');
const supportBtn = document.getElementById('support-btn');

// Views
const mainContent = document.getElementById('tournament-list');
const editProfileView = document.getElementById('edit-profile-view');
const walletView = document.getElementById('wallet-view');
const supportView = document.getElementById('support-view');
const aboutUsView = document.getElementById('about-us-view');
const myEventsView = document.getElementById('my-events-view');
const profileView = document.getElementById('profile-view');
const editProfileForm = document.getElementById('edit-profile-form');
const supportForm = document.getElementById('support-form');
const changePasswordForm = document.getElementById('change-password-form');
const profileLogoutBtn = document.getElementById('profile-logout-btn');
const displayNameInput = document.getElementById('display-name');
const profileEmailInput = document.getElementById('profile-email');
const userUpiIdInput = document.getElementById('user-upi-id');
const inGameNameInput = document.getElementById('in-game-name');
const registrationModal = document.getElementById('registration-modal');
const registrationModalTitle = document.getElementById('registration-modal-title');
const registrationForm = document.getElementById('registration-form');
const teamUidInputs = document.getElementById('team-uid-inputs');
const cancelRegistrationBtn = document.getElementById('cancel-registration');
const walletBalance = document.getElementById('wallet-balance');
const headerWalletBalance = document.getElementById('header-wallet-balance');
const transactionHistoryList = document.getElementById('transaction-history-list');
const headerWalletBtn = document.getElementById('header-wallet-btn');
const notificationBtn = document.getElementById('notification-btn');
const notificationPanel = document.getElementById('notification-panel');
const notificationList = document.getElementById('notification-list');
const notificationIndicator = document.getElementById('notification-indicator');


// Wallet Modal Elements
const addMoneyBtn = document.getElementById('add-money-btn');
const withdrawMoneyBtn = document.getElementById('withdraw-money-btn');
const addMoneyModal = document.getElementById('add-money-modal');
const withdrawMoneyModal = document.getElementById('withdraw-money-modal');
const addMoneyForm = document.getElementById('add-money-form');
const withdrawMoneyForm = document.getElementById('withdraw-money-form');
const cancelAddMoney = document.getElementById('cancel-add-money');
const cancelWithdrawMoney = document.getElementById('cancel-withdraw-money');
const userUpiIdDisplay = document.getElementById('user-upi-id-display');

const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const forgotPasswordBtn = document.getElementById('forgot-password-btn');
const googleSigninBtn = document.getElementById('google-signin-btn');
const facebookSigninBtn = document.getElementById('facebook-signin-btn');

const toggleLoginPassword = document.getElementById('toggle-login-password');
const toggleSignupPassword = document.getElementById('toggle-signup-password');
const toggleConfirmPassword = document.getElementById('toggle-confirm-password');

let currentUser = null;
let currentView = 'all'; // 'all', 'my', or 'history'

// --- Authentication Logic ---
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

auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        authView.classList.add('hidden');
        mainAppView.classList.remove('hidden');
        // Set initial view
        setActiveView('all', navTournaments);
        fetchUserData();
        fetchAdminSettings();
        fetchTransactionHistory();
        fetchNotifications();
    } else {
        authView.classList.remove('hidden');
        mainAppView.classList.add('hidden');
    }
});

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const username = document.getElementById('signup-username').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
    }

    if (username.trim() === '') {
        showToast('Username is required.', 'error');
        return;
    }

    toggleLoading(signupBtn, true);

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            return user.updateProfile({
                displayName: username
            }).then(() => {
                db.ref('users/' + user.uid).set({
                    email: user.email,
                    displayName: username,
                    inGameName: '',
                    upiId: '',
                    wallet: 0
                });
            });
        })
        .catch(error => {
            handleAuthError(error);
        })
        .finally(() => {
            toggleLoading(signupBtn, false);
        });
});


toggleToSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    toggleToSignupText.classList.add('hidden');
    toggleToLoginText.classList.remove('hidden');
    authError.textContent = '';
});

function showLoginForm() {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    forgotPasswordForm.classList.add('hidden');
    toggleToSignupText.classList.remove('hidden');
    toggleToLoginText.classList.add('hidden');
    backToLoginText.classList.add('hidden');
    authError.textContent = '';
    authError.classList.remove('text-green-400');
    authError.classList.add('text-red-400');
}

forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    forgotPasswordForm.classList.remove('hidden');
    toggleToSignupText.classList.add('hidden');
    toggleToLoginText.classList.add('hidden');
    backToLoginText.classList.remove('hidden');
    authError.textContent = '';
});

backToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
});


forgotPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    toggleLoading(forgotPasswordBtn, true);

    auth.sendPasswordResetEmail(email)
        .then(() => {
            handleAuthError({ code: 'auth/reset-link-sent' });
        })
        .catch(error => {
            handleAuthError(error);
        })
        .finally(() => {
            toggleLoading(forgotPasswordBtn, false);
        });
});

toggleToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
});

// --- Social Sign-in Logic ---
googleSigninBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    signInWithProvider(provider);
});

facebookSigninBtn.addEventListener('click', () => {
    const provider = new firebase.auth.FacebookAuthProvider();
    signInWithProvider(provider);
});

function signInWithProvider(provider) {
    auth.signInWithPopup(provider)
        .then(result => {
            const user = result.user;
            const isNewUser = result.additionalUserInfo.isNewUser;

            if (isNewUser) {
                // Create a new user profile in the database
                db.ref('users/' + user.uid).set({
                    email: user.email,
                    displayName: user.displayName,
                    inGameName: '',
                    upiId: '',
                    wallet: 0
                }).then(() => {
                    showToast('Welcome to Nepus Esports!', 'success');
                });
            } else {
                showToast('Signed in successfully!', 'success');
            }
        })
        .catch(error => {
            handleAuthError(error);
        });
}

// --- Tournament Logic ---
function renderSkeletonCards() {
    tournamentList.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const card = document.createElement('div');
        card.className = 'bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg overflow-hidden animate-pulse';
        card.innerHTML = `
            <div class="p-3">
                <div class="flex justify-between items-start">
                    <div class="space-y-2">
                        <div class="h-4 bg-slate-700 rounded w-3/4"></div>
                        <div class="h-3 bg-slate-700 rounded w-1/2"></div>
                    </div>
                    <div class="h-4 bg-slate-700 rounded w-1/4"></div>
                </div>
                <div class="mt-3 space-y-2">
                    <div class="h-3 bg-slate-700 rounded w-full"></div>
                    <div class="h-3 bg-slate-700 rounded w-5/6"></div>
                </div>
                <div class="flex justify-between items-center mt-4 pt-2 border-t border-slate-700/50">
                    <div class="h-8 bg-slate-700 rounded w-1/3"></div>
                    <div class="h-8 bg-slate-700 rounded w-1/4"></div>
                </div>
            </div>
        `;
        tournamentList.appendChild(card);
    }
}

function fetchTournaments() {
    const tournamentsRef = db.ref('tournaments');
    renderSkeletonCards();
    tournamentsRef.on('value', (snapshot) => {
        allTournaments = snapshot.val() || {};
        if (Object.keys(allTournaments).length > 0) {
            renderTournaments(allTournaments);
        } else {
            tournamentList.innerHTML = '<p class="text-gray-500 text-center">No tournaments available at the moment.</p>';
        }
    });
}

function renderTournaments(tournaments) {
    tournamentList.innerHTML = '';
    const tournamentsToShow = Object.entries(tournaments).filter(([id, t]) => {
        if (currentView === 'all') return t.status !== 'completed';
        if (currentView === 'my') return t.registrations && t.registrations[currentUser.uid];
        return false;
    }).sort((a, b) => new Date(a[1].date) - new Date(b[1].date));

    if (tournamentsToShow.length === 0) {
        let message;
        switch (currentView) {
            case 'my': message = 'You have not registered for any events yet.'; break;
            default: message = 'No upcoming tournaments. Check back soon!';
        }
        tournamentList.innerHTML = `<div class="text-center py-10 px-4"><i class="fas fa-trophy fa-3x text-slate-500"></i><p class="text-slate-400 mt-4">${message}</p></div>`;
        return;
    }

    tournamentsToShow.forEach(([id, tournament], index) => {
        const isRegistered = tournament.registrations && tournament.registrations[currentUser.uid];
        const card = document.createElement('div');
        card.className = 'bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg overflow-hidden fade-in-up cursor-pointer hover:border-teal-500 transition-all duration-300 relative';
        card.dataset.id = id;
        card.style.animationDelay = `${index * 100}ms`;

        let statusColor, statusText, statusIcon;
        switch(tournament.status) {
            case 'upcoming': statusColor = 'bg-blue-500/20 text-blue-300'; statusText = 'Upcoming'; statusIcon = 'fa-calendar-alt'; break;
            case 'ongoing': statusColor = 'bg-green-500/20 text-green-300'; statusText = 'Ongoing'; statusIcon = 'fa-play-circle'; break;
            case 'completed': statusColor = 'bg-gray-500/20 text-gray-300'; statusText = 'Completed'; statusIcon = 'fa-check-circle'; break;
            default: statusColor = 'bg-slate-700 text-slate-300'; statusText = 'Unknown'; statusIcon = 'fa-question-circle';
        }

        let registeredPlayersCount = 0;
        if (tournament.registrations) {
            Object.values(tournament.registrations).forEach(reg => {
                if (reg.team && Array.isArray(reg.team)) {
                    registeredPlayersCount += reg.team.length;
                } else {
                    // Fallback for older data structures or solo registrations
                    registeredPlayersCount += 1;
                }
            });
        }

        const prizePool = tournament.prizePool || { first: 0, second: 0, third: 0 };

        let prizeDisplayHtml;
        if (tournament.gameType === 'TDM' || tournament.gameType === 'Clash Squad') {
            prizeDisplayHtml = `<div class="flex items-center"><i class="fas fa-trophy mr-1.5 text-yellow-400"></i>Winner: ${prizePool.first}</div>`;
        } else {
            prizeDisplayHtml = `
                <div class="grid grid-cols-3 gap-2 text-xs text-slate-300">
                    <div class="flex items-center"><i class="fas fa-trophy mr-1.5 text-yellow-400"></i>1st: ${prizePool.first}</div>
                    <div class="flex items-center"><i class="fas fa-trophy mr-1.5 text-gray-300"></i>2nd: ${prizePool.second}</div>
                    <div class="flex items-center"><i class="fas fa-trophy mr-1.5 text-orange-400"></i>3rd: ${prizePool.third}</div>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="absolute inset-0 bg-cover bg-center z-0 opacity-20" style="background-image: url('assets/card_bg.jpg');"></div>
            <div class="relative z-10 p-3 flex flex-col h-full">
                <div class="flex-grow">
                    <div class="flex justify-between items-start">
                        <h2 class="text-md font-bold text-white leading-tight pr-2">${tournament.name}</h2>
                        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor} flex items-center space-x-1 flex-shrink-0">
                            <i class="fas ${statusIcon} text-xs"></i>
                            <span>${statusText}</span>
                        </span>
                    </div>
                    <p class="text-xs text-slate-400 mt-0.5">${tournament.gameType}</p>
                    
                     <div class="text-xs text-slate-300 mt-2 space-y-1">
                        <div class="flex justify-between">
                            <div class="flex items-center"><i class="fas fa-calendar-alt w-4 mr-1.5 text-slate-400"></i>${new Date(tournament.date).toLocaleDateString()} at ${tournament.time}</div>
                        </div>
                        <div class="flex justify-between">
                            <div class="flex items-center"><i class="fas fa-users w-4 mr-1.5 text-slate-400"></i>${tournament.format}</div>
                            <div class="flex items-center"><i class="fas fa-user-friends w-4 mr-1.5 text-slate-400"></i>${registeredPlayersCount} / ${tournament.slots} Registered</div>
                        </div>
                    </div>
                </div>

                <div class="flex-shrink-0 mt-2 pt-2 border-t border-slate-700/50">
                    <div class="flex justify-between items-center">
                        <div class="space-y-1">
                            <div class="text-xs text-slate-300">${prizeDisplayHtml}</div>
                            <div class="text-xs text-slate-400">Entry Fee: <span class="font-semibold text-green-400">${tournament.fee} Points</span></div>
                        </div>
                        ${ (tournament.status === 'completed' && tournament.results && tournament.results.firstPlace) ? `<div class="text-right"><div class="text-xs text-slate-400">Winner</div><div class="text-sm font-bold text-yellow-400">${tournament.results.firstPlace}</div></div>` : (isRegistered
                            ? `<button disabled class="text-white text-xs font-semibold py-1 px-3 rounded-md bg-green-500/80 cursor-not-allowed flex items-center"><i class="fas fa-check mr-1.5"></i>Registered</button>`
                            : tournament.status === 'upcoming' 
                                ? `<button data-id="${id}" class="register-btn text-white text-xs font-bold py-1 px-3 rounded-md bg-blue-600 hover:bg-blue-500 transition-colors">Join</button>`
                                : `<button disabled class="text-slate-400 text-xs font-semibold py-1 px-3 rounded-md bg-slate-700/50 cursor-not-allowed">Closed</button>`
                        )}
                    </div>
                </div>
            </div>
        `;
        tournamentList.appendChild(card);
    });
}

tournamentList.addEventListener('click', (e) => {
    const card = e.target.closest('[data-id]');
    if (!card) return;

    const tournamentId = card.dataset.id;

    if (e.target.classList.contains('register-btn')) {
        openRegistrationModal(tournamentId);
    } else {
        const tournament = allTournaments[tournamentId];
        if (tournament) {
            showTournamentDetail({ ...tournament, id: tournamentId });
        }
    }
});

let currentRegStep = 1;
const regSteps = { 1: 'reg-step-1', 2: 'reg-step-2', 3: 'reg-step-3' };
const regIndicators = { 1: 'reg-step-1-indicator', 2: 'reg-step-2-indicator', 3: 'reg-step-3-indicator' };

function goToRegStep(step) {
    Object.values(regSteps).forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById(regSteps[step]).classList.remove('hidden');

    for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById(`reg-step-${i}-indicator`);
        const line = indicator.nextElementSibling;
        if (i <= step) {
            indicator.classList.add('bg-blue-600', 'text-white');
            indicator.classList.remove('bg-slate-700', 'text-slate-400');
            if (line) {
                line.classList.add('border-blue-600');
                line.classList.remove('border-slate-600');
            }
        } else {
            indicator.classList.remove('bg-blue-600', 'text-white');
            indicator.classList.add('bg-slate-700', 'text-slate-400');
            if (line) {
                line.classList.remove('border-blue-600');
                line.classList.add('border-slate-600');
            }
        }
    }

    document.getElementById('reg-prev-btn').classList.toggle('hidden', step === 1);
    document.getElementById('reg-next-btn').classList.toggle('hidden', step === 3);
    document.getElementById('reg-submit-btn').classList.toggle('hidden', step !== 3);
    const cancelButton = document.getElementById('cancel-registration');
    const nextButton = document.getElementById('reg-next-btn');
    const prevButton = document.getElementById('reg-prev-btn');
    const submitButton = document.getElementById('reg-submit-btn');

    prevButton.classList.toggle('hidden', step === 1);
    nextButton.classList.toggle('hidden', step === 3);
    submitButton.classList.toggle('hidden', step !== 3);
    cancelButton.classList.toggle('hidden', step === 3);

    // Adjust button layout
    if (step === 1) {
        nextButton.classList.add('ml-auto');
    } else {
        nextButton.classList.remove('ml-auto');
    }
    currentRegStep = step;
}

document.getElementById('reg-next-btn').addEventListener('click', () => {
    if (currentRegStep === 1) {
        const teamName = document.getElementById('team-name').value.trim();
        if ((currentTournament.format === 'duo' || currentTournament.format === 'squad') && !teamName) {
            showToast('Please enter a team name.', 'error');
            return;
        }
    }
    if (currentRegStep === 2) {
        const teamUids = [];
        const teamSize = getTeamSize(currentTournament.format);
        for (let i = 1; i <= teamSize; i++) {
            const input = document.getElementById(`team-uid-${i}`);
            if (!input.value.trim()) {
                showToast(`Please enter the in-game name for Player ${i}.`, 'error');
                return;
            }
            teamUids.push(input.value.trim());
        }
        generateRegistrationSummary(teamUids);
    }
    goToRegStep(currentRegStep + 1);
});

document.getElementById('reg-prev-btn').addEventListener('click', () => goToRegStep(currentRegStep - 1));
document.getElementById('cancel-registration').addEventListener('click', () => registrationModal.classList.add('hidden'));

function getTeamSize(format) {
    format = format.toLowerCase();
    if (format === 'duo') return 2;
    if (format === 'squad') return 4;
    return 1;
}

function generateRegistrationSummary(teamUids) {
    const summaryContainer = document.getElementById('registration-summary');
    const teamName = document.getElementById('team-name').value.trim();
    let summaryHtml = `<p><strong>Team Name:</strong> ${teamName || 'N/A'}</p>`;
    summaryHtml += '<p><strong>Players:</strong></p>';
    summaryHtml += '<ul class="list-disc list-inside">';
    teamUids.forEach(uid => {
        summaryHtml += `<li>${uid}</li>`;
    });
    summaryHtml += '</ul>';
    summaryContainer.innerHTML = summaryHtml;
}

async function openRegistrationModal(tournamentId) {
    const tournamentRef = db.ref(`tournaments/${tournamentId}`);
    const tournamentSnapshot = await tournamentRef.once('value');
    const tournament = tournamentSnapshot.val();
    currentTournament = { ...tournament, id: tournamentId }; // Set the global tournament object
    const format = tournament.format.toLowerCase();
    let teamSize = 1;
    const teamNameInputContainer = document.getElementById('team-name-input-container');
    if (format === 'duo' || format === 'squad') {
        teamSize = format === 'duo' ? 2 : 4;
        teamNameInputContainer.classList.remove('hidden');
    } else {
        teamNameInputContainer.classList.add('hidden');
    }

    registrationModalTitle.textContent = `Register for ${tournament.name}`;
    document.getElementById('registration-fee').textContent = `Entry Fee: ${tournament.fee} Points`;
    teamUidInputs.innerHTML = '';

    for (let i = 1; i <= teamSize; i++) {
        const isFirstPlayer = i === 1;
        const userInGameName = isFirstPlayer ? (inGameNameInput.value || '') : '';
        teamUidInputs.innerHTML += `
            <div>
                <label for="team-uid-${i}" class="block text-sm font-medium text-slate-300">Player ${i} In-Game Name</label>
                <input type="text" id="team-uid-${i}" value="${userInGameName}" required class="mt-1 w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 text-white" placeholder="Enter Player ${i}'s Name">
            </div>
        `;
    }

    registrationModal.classList.remove('hidden');
    goToRegStep(1);

    registrationForm.onsubmit = async (e) => {
        e.preventDefault();
        const teamSize = getTeamSize(tournament.format);
        const teamUids = [];
        for (let i = 1; i <= teamSize; i++) {
            const input = document.getElementById(`team-uid-${i}`);
            teamUids.push(input.value.trim());
        }
        await registerForTournament(tournamentId, teamUids);
    };
}


async function registerForTournament(tournamentId, teamUids) {
    if (!currentUser) return;

    const userRef = db.ref(`users/${currentUser.uid}`);

    try {
        const tournamentSnapshot = await db.ref(`tournaments/${tournamentId}`).once('value');
        const tournament = tournamentSnapshot.val();
        const fee = tournament.fee;
        const teamName = document.getElementById('team-name').value.trim();

        if ((tournament.format === 'duo' || tournament.format === 'squad') && !teamName) {
            showToast('Please enter a team name.', 'error');
            return;
        }

        const userSnapshot = await userRef.once('value');
        const user = userSnapshot.val();
        const balance = user.wallet || 0;

        if (balance < fee) {
            showToast('Insufficient funds to register for this tournament.', 'error');
            return;
        }

        const newBalance = balance - fee;
        const transactionId = db.ref().child(`transactions/${currentUser.uid}`).push().key;

        const updates = {};
        updates[`/users/${currentUser.uid}/wallet`] = newBalance;
        updates[`/tournaments/${tournamentId}/registrations/${currentUser.uid}`] = {
            team: teamUids,
            teamName: teamName || null,
            registeredAt: firebase.database.ServerValue.TIMESTAMP
        };
        updates[`/transactions/${currentUser.uid}/${transactionId}`] = {
            type: 'fee',
            amount: fee,
            tournamentName: tournament.name,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        await db.ref().update(updates);

        showToast('Successfully registered!', 'success');
        registrationModal.classList.add('hidden');
    } catch (error) {
        console.error('Registration failed:', error);
        showToast('Registration failed. Please try again.', 'error');
    }
}

function showTournamentDetail(tournament) {
    currentTournament = tournament;
    const modal = document.getElementById('tournament-detail-modal');
    const date = new Date(`${tournament.date}T${tournament.time}`);
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const formattedDateTime = date.toLocaleString('en-US', options);
    
    const prizePool = tournament.prizePool || { first: 0, second: 0, third: 0 };
    document.getElementById('detail-title').textContent = tournament.name;
    document.getElementById('detail-format').textContent = tournament.format;
    document.getElementById('detail-slots').textContent = `${tournament.slots} Slots`;
    document.getElementById('detail-fee').textContent = `Points ${tournament.fee.toFixed(2)}`;

    if (tournament.gameType === 'TDM' || tournament.gameType === 'Clash Squad') {
        document.getElementById('detail-prize').innerHTML = `<span class="text-yellow-400">Winner: ${prizePool.first}</span>`;
    } else {
        document.getElementById('detail-prize').innerHTML = `
            <span class="text-yellow-400">1st: ${prizePool.first}</span>, 
            <span class="text-gray-300">2nd: ${prizePool.second}</span>, 
            <span class="text-orange-400">3rd: ${prizePool.third}</span>`;
    }

    document.getElementById('detail-datetime').textContent = formattedDateTime;
    document.getElementById('detail-description').textContent = tournament.description || 'No description provided.';
    
    let registeredPlayersCount = 0;
    if (tournament.registrations) {
        Object.values(tournament.registrations).forEach(reg => {
            if (reg.team && Array.isArray(reg.team)) {
                registeredPlayersCount += reg.team.length;
            } else {
                // Fallback for older data structures or solo registrations
                registeredPlayersCount += 1;
            }
        });
    }
    const registeredPlayersHeader = document.querySelector('#registered-players h4');
    registeredPlayersHeader.textContent = `Registered Players (${registeredPlayersCount} / ${tournament.slots || 'Unlimited'})`;

    const playersList = document.getElementById('detail-players-list');
    playersList.innerHTML = '';
    if (tournament.registrations) {
        Object.values(tournament.registrations).forEach(reg => {
            if (reg.team && Array.isArray(reg.team)) {
                reg.team.forEach(playerName => {
                    const playerEl = document.createElement('div');
                    playerEl.className = 'text-sm text-slate-300';
                    playerEl.textContent = playerName;
                    playersList.appendChild(playerEl);
                });
            }
        });
    } else {
        playersList.innerHTML = '<p class="text-sm text-slate-400">No players registered yet.</p>';
    }

    const registerBtn = document.getElementById('register-btn');
    registerBtn.onclick = () => {
        closeTournamentDetail(); // Close detail modal before opening registration
        openRegistrationModal(tournament.id);
    };

    const isRegistered = tournament.registrations && tournament.registrations[currentUser.uid];

    if (isRegistered) {
        registerBtn.textContent = 'Already Registered';
        registerBtn.disabled = true;
        registerBtn.className = 'w-full bg-gradient-to-r from-green-500 to-teal-500 opacity-70 cursor-not-allowed text-white font-bold py-2 px-4 rounded-md';
    } else if (tournament.status === 'upcoming') {
        registerBtn.textContent = 'Register Now';
        registerBtn.disabled = false;
        registerBtn.className = 'w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:opacity-90 text-white font-bold py-2 px-4 rounded-md';
    } else if (tournament.status === 'ongoing') {
        registerBtn.textContent = 'Tournament in Progress';
        registerBtn.disabled = true;
        registerBtn.className = 'w-full bg-slate-600 text-slate-400 font-bold py-2 px-4 rounded-md cursor-not-allowed';
    } else {
        registerBtn.textContent = 'Tournament Completed';
        registerBtn.disabled = true;
        registerBtn.className = 'w-full bg-slate-600 text-slate-400 font-bold py-2 px-4 rounded-md cursor-not-allowed';
    }
    
    modal.classList.remove('hidden');
}

function closeTournamentDetail() {
    document.getElementById('tournament-detail-modal').classList.add('hidden');
}

window.addEventListener('click', (event) => {
    const detailModal = document.getElementById('tournament-detail-modal');
    if (event.target == detailModal) {
        closeTournamentDetail();
    }
});


// --- User Data Logic ---
function fetchUserData() {
    if (!currentUser) return;
    const userRef = db.ref(`users/${currentUser.uid}`);
    userRef.on('value', (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
            displayNameInput.value = userData.displayName || '';
            userUpiIdInput.value = userData.upiId || '';
            userUpiIdDisplay.textContent = userData.upiId || 'Not set';
            inGameNameInput.value = userData.inGameName || '';
            profileEmailInput.value = currentUser.email;
            const balance = `Points ${(userData.wallet || 0).toFixed(2)}`;
            walletBalance.textContent = balance;
            headerWalletBalance.textContent = balance;
        } else {
            // If no user data, initialize it
            userRef.set({ displayName: '', wallet: 0 });
        }
    });
}

editProfileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newName = displayNameInput.value;
    const upiId = userUpiIdInput.value;
    const inGameName = inGameNameInput.value;
    if (newName) {
        db.ref(`users/${currentUser.uid}`).update({ displayName: newName, upiId: upiId, inGameName: inGameName })
            .then(() => {
                showToast('Profile updated successfully!', 'success');
                showMainContent();
            })
            .catch(error => showToast(error.message, 'error'));
    }
});

changePasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;

    if (newPassword !== confirmNewPassword) {
        showToast('New passwords do not match.', 'error');
        return;
    }

    const user = auth.currentUser;
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);

    user.reauthenticateWithCredential(credential).then(() => {
        return user.updatePassword(newPassword);
    }).then(() => {
        showToast('Password updated successfully!', 'success');
        changePasswordForm.reset();
    }).catch((error) => {
        showToast('Error: ' + error.message, 'error');
    });
});

profileLogoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// --- View Management ---
const leaderboardView = document.getElementById('leaderboard-view');
const allViews = [mainContent, editProfileView, walletView, supportView, aboutUsView, myEventsView, profileView, leaderboardView];
const backToHomeBtns = document.querySelectorAll('.back-to-home-btn');

// --- Password Visibility Toggle ---
function togglePasswordVisibility(passwordInput, toggleButton) {
    const icon = toggleButton.querySelector('i');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

toggleLoginPassword.addEventListener('click', () => {
    togglePasswordVisibility(document.getElementById('login-password'), toggleLoginPassword);
});

toggleSignupPassword.addEventListener('click', () => {
    togglePasswordVisibility(document.getElementById('signup-password'), toggleSignupPassword);
});

toggleConfirmPassword.addEventListener('click', () => {
    togglePasswordVisibility(document.getElementById('confirm-password'), toggleConfirmPassword);
});

function showView(viewToShow) {
    allViews.forEach(v => v.classList.add('hidden'));
    viewToShow.classList.remove('hidden');
}

function showMainContent() {
    allViews.forEach(v => v.classList.add('hidden'));
    mainContent.classList.remove('hidden');
    document.querySelector('nav').classList.remove('hidden');
}

// --- Navigation Logic ---
const navButtons = [navTournaments, navMyRegistrations, navLeaderboard, navProfile];

function setActiveView(view, activeBtn) {
    currentView = view;
    showMainContent();

    if (view === 'leaderboard') {
        showView(leaderboardView);
        fetchLeaderboard();
    } else if (view === 'profile') {
        showView(profileView);
    } else {
        showView(mainContent);
        fetchTournaments(); // Re-fetch/re-render for all tournament views
    }

    // Toggle nav button styles
    navButtons.forEach(btn => {
        btn.classList.remove('text-teal-400', 'border-t-2', 'border-teal-400');
        btn.classList.add('text-slate-400');
    });
    activeBtn.classList.add('text-teal-400', 'border-t-2', 'border-teal-400');
    activeBtn.classList.remove('text-slate-400');
}

function fetchLeaderboard() {
    const usersRef = db.ref('users');
    usersRef.orderByChild('wallet').limitToLast(100).on('value', (snapshot) => {
        const users = [];
        snapshot.forEach((childSnapshot) => {
            users.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        renderLeaderboard(users.reverse());
    });
}

function renderLeaderboard(users) {
    leaderboardView.innerHTML = '';
    if (users.length === 0) {
        leaderboardView.innerHTML = '<p class="text-gray-500 text-center">No users found for the leaderboard.</p>';
        return;
    }

    const leaderboardList = document.createElement('div');
    leaderboardList.className = 'space-y-3';

    users.forEach((user, index) => {
        const rank = index + 1;
        const card = document.createElement('div');
        card.className = 'bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center justify-between';
        
        let rankColor = 'text-slate-400';
        if (rank === 1) rankColor = 'text-yellow-400';
        if (rank === 2) rankColor = 'text-gray-300';
        if (rank === 3) rankColor = 'text-orange-400';

        card.innerHTML = `
            <div class="flex items-center">
                <span class="font-bold text-lg w-8 text-center ${rankColor}">${rank}</span>
                <div class="ml-3">
                    <p class="font-semibold text-white">${user.displayName}</p>
                </div>
            </div>
            <div class="font-bold text-green-400">${(user.wallet || 0).toFixed(2)} Points</div>
        `;
        leaderboardList.appendChild(card);
    });

    leaderboardView.appendChild(leaderboardList);
}

navTournaments.addEventListener('click', () => setActiveView('all', navTournaments));
navMyRegistrations.addEventListener('click', () => setActiveView('my', navMyRegistrations));
navLeaderboard.addEventListener('click', () => setActiveView('leaderboard', navLeaderboard));
navProfile.addEventListener('click', () => setActiveView('profile', navProfile));

addMoneyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('add-amount').value);
    const transactionId = document.getElementById('transaction-id').value.trim();

    if (amount > 0 && transactionId !== '') {
        const depositRef = db.ref('deposits').push();
        depositRef.set({
            userId: currentUser.uid,
            userEmail: currentUser.email,
            amount: amount,
            transactionId: transactionId,
            status: 'pending',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        })
            .then(() => {
                showToast('Deposit request submitted!', 'success');
                addMoneyForm.reset();
                addMoneyModal.classList.add('hidden');
            })
            .catch(error => showToast(error.message, 'error'));
    } else {
        showToast('Please enter a valid amount and transaction ID.', 'error');
    }
});

withdrawMoneyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const upiId = document.getElementById('withdraw-upi-id').value;

    if (amount > 0 && upiId) {
        const userRef = db.ref(`users/${currentUser.uid}`);
        userRef.once('value').then(snapshot => {
            const userData = snapshot.val();
            if (userData.wallet >= amount) {
                const withdrawalRef = db.ref('withdrawals').push();
                withdrawalRef.set({
                    userId: currentUser.uid,
                    userEmail: currentUser.email,
                    amount: amount,
                    upiId: upiId,
                    status: 'pending',
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                }).then(() => {
                    showToast('Withdrawal request submitted!', 'success');
                    withdrawMoneyForm.reset();
                    withdrawMoneyModal.classList.add('hidden');
                }).catch(error => showToast(error.message, 'error'));
            } else {
                showToast('Insufficient funds.', 'error');
            }
        });
    }
});

// --- Notification Logic ---
notificationBtn.addEventListener('click', () => {
    notificationPanel.classList.toggle('hidden');
    if (!notificationPanel.classList.contains('hidden')) {
        markNotificationsAsRead();
    }
});

function fetchNotifications() {
    if (!currentUser) return;
    const notificationsRef = db.ref(`notifications/${currentUser.uid}`).orderByChild('timestamp').limitToLast(20);
    notificationsRef.on('value', snapshot => {
        const notifications = snapshot.val();
        renderNotifications(notifications);
    });
}

function renderNotifications(notifications) {
    notificationList.innerHTML = '';
    if (!notifications) {
        notificationList.innerHTML = '<p class="text-slate-400 text-sm text-center p-4">No notifications yet.</p>';
        notificationIndicator.classList.add('hidden');
        return;
    }

    const sortedNotifications = Object.entries(notifications).sort((a, b) => b[1].timestamp - a[1].timestamp);
    let hasUnread = false;

    sortedNotifications.forEach(([id, notification]) => {
        const notificationEl = document.createElement('div');
        notificationEl.className = `p-3 border-b border-slate-700/50 text-sm cursor-pointer hover:bg-slate-700 ${!notification.read ? 'bg-slate-700/50' : ''}`;
        notificationEl.innerHTML = `
            <p class="${!notification.read ? 'text-white' : 'text-slate-300'}">${notification.message}</p>
            <p class="text-xs text-slate-400 mt-1">${new Date(notification.timestamp).toLocaleString()}</p>
        `;
        notificationEl.addEventListener('click', () => {
            if (notification.tournamentId) {
                // Future enhancement: show tournament details
                notificationPanel.classList.add('hidden');
            }
        });
        notificationList.appendChild(notificationEl);

        if (!notification.read) {
            hasUnread = true;
        }
    });

    if (hasUnread) {
        notificationIndicator.classList.remove('hidden');
    } else {
        notificationIndicator.classList.add('hidden');
    }
}

function markNotificationsAsRead() {
    if (!currentUser) return;
    const notificationsRef = db.ref(`notifications/${currentUser.uid}`);
    notificationsRef.once('value', snapshot => {
        const notifications = snapshot.val();
        if (notifications) {
            const updates = {};
            Object.keys(notifications).forEach(key => {
                if (!notifications[key].read) {
                    updates[`${key}/read`] = true;
                }
            });
            if (Object.keys(updates).length > 0) {
                notificationsRef.update(updates);
            }
        }
    });
}

function fetchAdminSettings() {
    const settingsRef = db.ref('settings');
    settingsRef.on('value', (snapshot) => {
        const settings = snapshot.val();
        if (settings) {
            const adminUpiIdElement = document.getElementById('admin-upi-id');
            const adminQrCodeElement = document.getElementById('admin-qr-code');

            if (adminUpiIdElement) {
                adminUpiIdElement.textContent = settings.upiId || '';
            }
            if (adminQrCodeElement) {
                adminQrCodeElement.src = settings.qrCodeUrl || '';
            }
        }
    });
}

async function fetchTransactionHistory() {
    if (!currentUser) return;

    const depositsRef = db.ref('deposits').orderByChild('userId').equalTo(currentUser.uid);
    const withdrawalsRef = db.ref('withdrawals').orderByChild('userId').equalTo(currentUser.uid);
    const feesRef = db.ref(`transactions/${currentUser.uid}`);

    const [depositsSnap, withdrawalsSnap, feesSnap] = await Promise.all([
        depositsRef.once('value'),
        withdrawalsRef.once('value'),
        feesRef.once('value')
    ]);

    const allTransactions = [];

    depositsSnap.forEach(snap => {
        allTransactions.push({ ...snap.val(), type: 'Deposit' });
    });

    withdrawalsSnap.forEach(snap => {
        allTransactions.push({ ...snap.val(), type: 'Withdrawal' });
    });

    feesSnap.forEach(snap => {
        const feeData = snap.val();
        allTransactions.push({ ...feeData, type: 'Tournament Fee', description: feeData.tournamentName });
    });

    allTransactions.sort((a, b) => b.timestamp - a.timestamp);
    renderTransactionHistory(allTransactions);
}

function renderTransactionHistory(transactions) {
    transactionHistoryList.innerHTML = '';

    if (transactions.length === 0) {
        transactionHistoryList.innerHTML = '<p class="text-slate-400 text-center">No transactions yet.</p>';
        return;
    }

    transactions.forEach(tx => {
        const card = document.createElement('div');
        card.className = 'bg-slate-700/50 p-3 rounded-lg flex justify-between items-center';

        let amountHtml, descriptionHtml;

        switch (tx.type) {
            case 'Deposit':
                amountHtml = `<span class="font-semibold text-green-400">+${tx.amount.toFixed(2)}</span>`;
                descriptionHtml = `Deposit via TXID: ${tx.transactionId}`;
                break;
            case 'Withdrawal':
                amountHtml = `<span class="font-semibold text-red-400">-${tx.amount.toFixed(2)}</span>`;
                descriptionHtml = `Withdrawal to ${tx.upiId}`;
                break;
            case 'Tournament Fee':
                amountHtml = `<span class="font-semibold text-orange-400">-${tx.amount.toFixed(2)}</span>`;
                descriptionHtml = `Entry fee for ${tx.description}`;
                break;
        }

        card.innerHTML = `
            <div>
                <p class="text-white font-semibold">${tx.type}</p>
                <p class="text-xs text-slate-400">${descriptionHtml}</p>
            </div>
            <div class="text-right">
                ${amountHtml}
                <p class="text-xs text-slate-500 mt-1">${new Date(tx.timestamp).toLocaleDateString()}</p>
            </div>
        `;
        transactionHistoryList.appendChild(card);
    });
}

homeLogoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    setActiveView('all', navTournaments);
});

headerWalletBtn.addEventListener('click', () => {
    showView(walletView);
});

addMoneyBtn.addEventListener('click', () => {
    addMoneyModal.classList.remove('hidden');
});

withdrawMoneyBtn.addEventListener('click', () => {
    withdrawMoneyModal.classList.remove('hidden');
});

cancelAddMoney.addEventListener('click', () => {
    addMoneyModal.classList.add('hidden');
});

cancelWithdrawMoney.addEventListener('click', () => {
    withdrawMoneyModal.classList.add('hidden');
});

backToHomeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        showMainContent();
    });
});

editProfileBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showView(editProfileView);
});

walletBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showView(walletView);
});

supportBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showView(supportView);
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

const upcomingTab = document.getElementById('upcoming-tab');
const completedTab = document.getElementById('completed-tab');

navMyRegistrations.addEventListener('click', () => {
    setActiveView('my', navMyRegistrations);
    showView(myEventsView);
    renderMyEvents('upcoming');
    upcomingTab.classList.add('text-teal-400', 'border-teal-400');
    completedTab.classList.remove('text-teal-400', 'border-teal-400');
});

upcomingTab.addEventListener('click', () => {
    renderMyEvents('upcoming');
    upcomingTab.classList.add('bg-slate-700', 'text-white');
    upcomingTab.classList.remove('text-slate-300');
    completedTab.classList.remove('bg-slate-700', 'text-white');
    completedTab.classList.add('text-slate-300');
});

completedTab.addEventListener('click', () => {
    renderMyEvents('completed');
    completedTab.classList.add('bg-slate-700', 'text-white');
    completedTab.classList.remove('text-slate-300');
    upcomingTab.classList.remove('bg-slate-700', 'text-white');
    upcomingTab.classList.add('text-slate-300');
});

function renderMyEvents(filter) {
    const myEventsList = document.getElementById('my-events-list');
    myEventsList.innerHTML = '';

    const myRegisteredTournaments = Object.entries(allTournaments)
        .filter(([id, t]) => t.registrations && t.registrations[currentUser.uid])
        .filter(([id, t]) => {
            if (filter === 'upcoming') {
                return t.status === 'upcoming' || t.status === 'ongoing';
            } else {
                return t.status === 'completed';
            }
        })
        .sort((a, b) => new Date(b[1].date) - new Date(a[1].date));

    if (myRegisteredTournaments.length === 0) {
        let message = filter === 'upcoming' ? 'You have no upcoming or live events.' : 'No completed events found.';
        myEventsList.innerHTML = `<div class="text-center py-10 px-4"><i class="fas fa-trophy fa-3x text-slate-500"></i><p class="text-slate-400 mt-4">${message}</p></div>`;
        return;
    }

    myRegisteredTournaments.forEach(([id, tournament]) => {
        const card = document.createElement('div');
        card.className = 'bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg p-4';
        
        let statusColor, statusText, statusIcon;
        switch(tournament.status) {
            case 'upcoming': statusColor = 'text-blue-400'; statusText = 'Upcoming'; statusIcon = 'fa-calendar-alt'; break;
            case 'ongoing': statusColor = 'text-green-400'; statusText = 'Live'; statusIcon = 'fa-play-circle'; break;
            case 'completed': statusColor = 'text-gray-400'; statusText = 'Completed'; statusIcon = 'fa-check-circle'; break;
            default: statusColor = 'text-gray-500'; statusText = 'Unknown'; statusIcon = 'fa-question-circle';
        }

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-lg font-bold text-white">${tournament.name}</h3>
                    <p class="text-xs text-teal-400 font-semibold mt-1">${tournament.game} - ${tournament.gameType}</p>
                </div>
                <span class="text-xs font-semibold px-2.5 py-1 bg-slate-700/50 rounded-full ${statusColor} flex items-center space-x-2">
                    <i class="fas ${statusIcon}"></i>
                    <span>${statusText}</span>
                </span>
            </div>
            <div class="mt-4 pt-4 border-t border-slate-700/50">
                <p class="text-sm text-slate-300">Your Team: <span class="font-semibold text-white">${tournament.registrations[currentUser.uid].teamName || 'N/A'}</span></p>
                ${tournament.results && tournament.results.firstPlace ? `<p class="text-sm text-slate-300 mt-2">Winner: <span class="font-semibold text-yellow-400">${tournament.results.firstPlace}</span></p>` : ''}
            </div>
        `;
        myEventsList.appendChild(card);
    });
}

navHistory.addEventListener('click', () => setActiveView('history', navHistory));
navProfile.addEventListener('click', () => {
    setActiveView('profile', navProfile);
    showView(profileView);
});



// --- Profile Dropdown Logic ---
editProfileBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showView(editProfileView);
    document.querySelector('nav').classList.add('hidden');
});

walletBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showView(walletView);
    fetchTransactionHistory();
    document.querySelector('nav').classList.add('hidden');
});

headerWalletBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showView(walletView);
    fetchTransactionHistory();
    document.querySelector('nav').classList.add('hidden');
});

supportBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showView(supportView);
    document.querySelector('nav').classList.add('hidden');
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// --- Support Logic ---
backToHomeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        showMainContent();
        setActiveView('all', navTournaments);
    });
});

homeLogoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showMainContent();
    setActiveView('all', navTournaments);
});

supportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // In a real app, you would send this data to a backend or a service like Firestore.
    showToast('Your support request has been sent.', 'success');
    supportForm.reset();
    showMainContent();
    setActiveView('all', navTournaments);
});

// --- Wallet Logic ---
async function fetchTransactionHistory() {
    if (!currentUser) return;

    const depositsRef = db.ref('deposits').orderByChild('userId').equalTo(currentUser.uid);
    const withdrawalsRef = db.ref('withdrawals').orderByChild('userId').equalTo(currentUser.uid);

    const [depositsSnapshot, withdrawalsSnapshot] = await Promise.all([
        depositsRef.once('value'),
        withdrawalsRef.once('value')
    ]);

    const deposits = depositsSnapshot.val() || {};
    const withdrawals = withdrawalsSnapshot.val() || {};

    const transactions = [];
    Object.entries(deposits).forEach(([id, t]) => {
        transactions.push({ ...t, type: 'Deposit', id });
    });

    Object.entries(withdrawals).forEach(([id, t]) => {
        transactions.push({ ...t, type: 'Withdrawal', id });
    });

    transactions.sort((a, b) => b.timestamp - a.timestamp);

    transactionHistoryList.innerHTML = '';
    if (transactions.length > 0) {
        transactions.forEach(t => {
            const item = document.createElement('div');
            item.className = 'bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center justify-between';
            const isDeposit = t.type === 'Deposit';
            let statusColor, statusText;
            switch (t.status) {
                case 'approved':
                case 'completed':
                    statusColor = 'bg-green-500/20 text-green-300';
                    statusText = 'Approved';
                    break;
                case 'pending':
                    statusColor = 'bg-yellow-500/20 text-yellow-300';
                    statusText = 'Pending';
                    break;
                case 'rejected':
                    statusColor = 'bg-red-500/20 text-red-300';
                    statusText = 'Denied';
                    break;
                default:
                    statusColor = 'bg-slate-600 text-slate-300';
                    statusText = 'Unknown';
            }

            const sign = isDeposit ? '+' : '-';
            const amountColor = isDeposit ? 'text-green-400' : 'text-red-400';

            const iconClass = isDeposit ? 'fa-arrow-down text-green-400' : 'fa-arrow-up text-red-400';

            item.innerHTML = `
                <div class="flex items-center">
                    <i class="fas ${iconClass} fa-lg w-6 text-center"></i>
                    <div class="ml-3 flex-1">
                        <p class="font-semibold text-white">${t.type}</p>
                        <p class="text-xs text-slate-400">${new Date(t.timestamp).toLocaleString()}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold ${amountColor}">${sign} Points ${t.amount.toFixed(2)}</p>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor} mt-1 inline-block">${statusText}</span>
                </div>
            `;
            transactionHistoryList.appendChild(item);
        });
    } else {
        transactionHistoryList.innerHTML = '<p class="text-gray-400">No transactions yet.</p>';
    }
}
addMoneyBtn.addEventListener('click', () => {
    const settingsRef = db.ref('settings');
    settingsRef.once('value', (snapshot) => {
        const settings = snapshot.val();
        if (settings && settings.upiId && settings.qrCodeUrl) {
            document.getElementById('admin-upi-id').textContent = settings.upiId;
            document.getElementById('admin-qr-code').src = settings.qrCodeUrl;
            addMoneyModal.classList.remove('hidden');
        } else {
            showToast('Admin has not set up deposit information yet.', 'error');
        }
    });
});
withdrawMoneyBtn.addEventListener('click', () => {
    const userRef = db.ref(`users/${currentUser.uid}`);
    userRef.once('value', (snapshot) => {
        const userData = snapshot.val();
        if (userData && userData.upiId) {
            userUpiIdDisplay.textContent = userData.upiId;
        } else {
            userUpiIdDisplay.textContent = 'Not set';
        }
        withdrawMoneyModal.classList.remove('hidden');
    });
});
cancelAddMoney.addEventListener('click', () => addMoneyModal.classList.add('hidden'));
cancelWithdrawMoney.addEventListener('click', () => withdrawMoneyModal.classList.add('hidden'));

withdrawMoneyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('withdraw-amount').value);

    if (!currentUser || !amount || amount <= 0) {
        showToast('Please enter a valid amount.', 'error');
        return;
    }

    const userRef = db.ref(`users/${currentUser.uid}`);
    const userSnapshot = await userRef.once('value');
    const userData = userSnapshot.val();
    const balance = userData.wallet || 0;

    if (amount > balance) {
        showToast('Insufficient balance.', 'error');
        return;
    }

    const withdrawalRequest = {
        amount: amount,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        upiId: userData.upiId,
        status: 'pending',
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    db.ref('withdrawals').push(withdrawalRequest)
        .then(() => {
            showToast('Withdrawal request submitted successfully.', 'success');
            withdrawMoneyModal.classList.add('hidden');
            withdrawMoneyForm.reset();
        })
        .catch(error => {
            showToast('Failed to submit withdrawal request. ' + error.message, 'error');
        });
});

addMoneyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('add-amount').value);
    const transactionId = document.getElementById('transaction-id').value.trim();

    if (amount > 0 && transactionId) {
        const depositRequest = {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            amount: amount,
            transactionId: transactionId,
            status: 'pending',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        db.ref('deposits').push(depositRequest)
            .then(() => {
                alert('Your request to add funds has been submitted for verification.');
                addMoneyModal.classList.add('hidden');
                addMoneyForm.reset();
            })
            .catch(error => {
                alert('Error submitting request: ' + error.message);
            });
    } else {
        alert('Please enter a valid amount and transaction ID.');
    }
});

withdrawMoneyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    if (amount > 0) {
            if (userData.wallet < amount) {
                alert('Insufficient funds.');
                return;
            }
        const userRef = db.ref(`users/${currentUser.uid}`);
        userRef.once('value', (snapshot) => {
            const userData = snapshot.val();
            if (userData.wallet < amount) {
                alert('Insufficient funds.');
                return;
            }
            if (!userData.upiId) {
                alert('Please set your UPI ID in your profile before making a withdrawal request.');
                return;
            }

            const withdrawalRequest = {
                amount: amount,
                userId: currentUser.uid,
                userEmail: currentUser.email,
                upiId: userData.upiId,
                status: 'pending',
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };

            db.ref('withdrawals').push(withdrawalRequest)
                .then(() => {
                    alert('Your withdrawal request has been submitted.');
                    withdrawMoneyModal.classList.add('hidden');
                    withdrawMoneyForm.reset();
                })
                .catch(error => {
                    alert('Error submitting withdrawal request: ' + error.message);
                });
        });
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

toggleSignupPassword.addEventListener('click', () => {
    togglePasswordVisibility(document.getElementById('signup-password'), toggleSignupPassword);
});

toggleConfirmPassword.addEventListener('click', () => {
    togglePasswordVisibility(document.getElementById('confirm-password'), toggleConfirmPassword);
});

function handleAuthError(error) {
    let message = 'An unknown error occurred.';
    let type = 'error';

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
        case 'auth/email-already-in-use':
            message = 'This email is already in use.';
            break;
        case 'auth/weak-password':
            message = 'Password should be at least 6 characters.';
            break;
        case 'auth/reset-link-sent':
            message = 'Password reset link sent! Check your email.';
            type = 'success';
            break;
        default:
            message = error.message;
    }
    showToast(message, type);
}

let myEventsTab = 'upcoming';

document.getElementById('upcoming-tab').addEventListener('click', () => {
    myEventsTab = 'upcoming';
    document.getElementById('upcoming-tab').classList.add('text-teal-400', 'border-teal-400');
    document.getElementById('upcoming-tab').classList.remove('text-slate-400');
    document.getElementById('completed-tab').classList.remove('text-teal-400', 'border-teal-400');
    document.getElementById('completed-tab').classList.add('text-slate-400');
    renderMyEvents(myEventsTab);
});

document.getElementById('completed-tab').addEventListener('click', () => {
    myEventsTab = 'completed';
    document.getElementById('completed-tab').classList.add('text-teal-400', 'border-teal-400');
    document.getElementById('completed-tab').classList.remove('text-slate-400');
    document.getElementById('upcoming-tab').classList.remove('text-teal-400', 'border-teal-400');
    document.getElementById('upcoming-tab').classList.add('text-slate-400');
    renderMyEvents(myEventsTab);
});

function renderMyEvents(tab) {
    const myEventsList = document.getElementById('my-events-list');
    myEventsList.innerHTML = '<p class="text-slate-400 text-center">Loading events...</p>';

    db.ref('tournaments').once('value', snapshot => {
        const allTournaments = snapshot.val() || {};
        const userTournaments = Object.entries(allTournaments).filter(([id, t]) => t.registrations && t.registrations[currentUser.uid]);

        const filteredTournaments = userTournaments.filter(([id, t]) => {
            if (tab === 'upcoming') return t.status !== 'completed';
            if (tab === 'completed') return t.status === 'completed';
            return false;
        });

        if (filteredTournaments.length === 0) {
            myEventsList.innerHTML = `<p class="text-slate-400 text-center">No ${tab} events found.</p>`;
            return;
        }

        myEventsList.innerHTML = '';
        filteredTournaments.forEach(([id, t]) => {
            let detailsHtml = '';
            if (t.status === 'ongoing' && t.roomId) {
                detailsHtml = `
                    <div class="mt-2 p-2 bg-slate-700 rounded-md text-sm">
                        <p><strong>Room ID:</strong> ${t.roomId}</p>
                        <p><strong>Password:</strong> ${t.roomPassword}</p>
                    </div>`;
            }

            if (t.status === 'completed' && t.results && t.results[currentUser.uid]) {
                const result = t.results[currentUser.uid];
                detailsHtml = `
                    <div class="mt-2 p-2 bg-slate-700 rounded-md text-sm">
                        <p><strong>Rank:</strong> ${result.rank}</p>
                        <p><strong>Prize:</strong> Points ${result.prize.toFixed(2)}</p>
                    </div>`;
            }

            const card = document.createElement('div');
            card.className = 'bg-slate-800 p-4 rounded-lg';
            card.innerHTML = `
                <h3 class="font-bold text-white">${t.name}</h3>
                <p class="text-sm text-slate-400">${t.date} at ${t.time}</p>
                ${detailsHtml}
            `;
            myEventsList.appendChild(card);
        });
    });
}

function updateWallet(amount, type) {
    const userRef = db.ref(`users/${currentUser.uid}`);
    userRef.transaction((userData) => {
        if (userData) {
            let currentBalance = userData.wallet || 0;
            if (type === 'withdraw') {
                if (currentBalance < amount) {
                    alert('Insufficient funds.');
                    return; // Abort transaction
                }
                userData.wallet = currentBalance - amount;
            }
        }
        return userData;
    }, (error, committed) => {
        if (error) {
            alert('Transaction failed: ' + error.message);
        } else if (committed) {
            withdrawMoneyModal.classList.add('hidden');
            withdrawMoneyForm.reset();
        }
    });
}
