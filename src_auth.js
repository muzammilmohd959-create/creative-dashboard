(function () {
  var SUPABASE_URL = 'https://gylaptyzritzwvhkimot.supabase.co';
  var SUPABASE_KEY = 'sb_publishable__QdFMSF1tuH59Ey__zQxfA_ViBQ5_9Q';
  var AuthClient = null;
  var appStarted = false;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function authMessage(text, kind) {
    var el = document.getElementById('authMessage');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'auth-message' + (kind ? ' ' + kind : '');
  }

  function renderAuth(mode) {
    var gate = document.getElementById('authGate');
    if (!gate) return;
    var isSignup = mode === 'signup';
    gate.innerHTML =
      '<div class="auth-shell">' +
        '<div class="auth-brand"><span class="dot"></span><span>ARKFLUENCE</span></div>' +
        '<div class="auth-card">' +
          '<div class="auth-kicker">CREATOR PERFORMANCE</div>' +
          '<h1>' + (isSignup ? 'Create your account' : 'Welcome back') + '</h1>' +
          '<p class="auth-sub">' + (isSignup ? 'Create your ARKFLUENCE workspace account.' : 'Sign in to your creator-performance workspace.') + '</p>' +
          '<form id="authForm">' +
            (isSignup ? '<label>Full name<input id="authName" type="text" autocomplete="name" placeholder="Your name" required></label>' : '') +
            '<label>Email<input id="authEmail" type="email" autocomplete="email" placeholder="you@company.com" required></label>' +
            '<label>Password<input id="authPassword" type="password" autocomplete="' + (isSignup ? 'new-password' : 'current-password') + '" placeholder="••••••••" minlength="6" required></label>' +
            (isSignup ? '<label>Confirm password<input id="authConfirm" type="password" autocomplete="new-password" placeholder="••••••••" minlength="6" required></label>' : '') +
            '<button class="auth-submit" type="submit">' + (isSignup ? 'Create account' : 'Log in') + '</button>' +
          '</form>' +
          '<div id="authMessage" class="auth-message"></div>' +
          '<div class="auth-switch">' +
            (isSignup ? 'Already have an account? <button id="authModeLogin" type="button">Log in</button>' : 'New to ARKFLUENCE? <button id="authModeSignup" type="button">Create account</button>') +
          '</div>' +
        '</div>' +
        '<div class="auth-foot">Private workspace · Powered by Supabase Auth</div>' +
      '</div>';

    document.getElementById('authForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var email = document.getElementById('authEmail').value.trim();
      var password = document.getElementById('authPassword').value;
      var submit = event.target.querySelector('.auth-submit');

      if (isSignup) {
        var name = document.getElementById('authName').value.trim();
        var confirm = document.getElementById('authConfirm').value;
        if (password !== confirm) {
          authMessage('Passwords do not match.', 'error');
          return;
        }
        submit.disabled = true;
        submit.textContent = 'Creating account…';
        AuthClient.auth.signUp({
          email: email,
          password: password,
          options: { data: { full_name: name } }
        }).then(function (result) {
          if (result.error) throw result.error;
          if (result.data.session) {
            authMessage('Account created. Opening your workspace…', 'success');
          } else {
            authMessage('Account created. Check your email to confirm your account, then log in.', 'success');
          }
        }).catch(function (error) {
          authMessage(error.message || 'Could not create the account.', 'error');
        }).finally(function () {
          submit.disabled = false;
          submit.textContent = 'Create account';
        });
      } else {
        submit.disabled = true;
        submit.textContent = 'Signing in…';
        AuthClient.auth.signInWithPassword({ email: email, password: password })
          .then(function (result) {
            if (result.error) throw result.error;
          })
          .catch(function (error) {
            authMessage(error.message || 'Could not sign in.', 'error');
          })
          .finally(function () {
            submit.disabled = false;
            submit.textContent = 'Log in';
          });
      }
    });

    var signupButton = document.getElementById('authModeSignup');
    var loginButton = document.getElementById('authModeLogin');
    if (signupButton) signupButton.addEventListener('click', function () { renderAuth('signup'); });
    if (loginButton) loginButton.addEventListener('click', function () { renderAuth('login'); });
  }

  function updateUserBar(user) {
    var left = document.querySelector('.topbar-left');
    if (left) {
      left.innerHTML = '<span class="auth-user-pill"><span class="auth-user-dot"></span>' + esc(user && user.email ? user.email : 'Signed in') + '</span>';
    }
    var logout = document.getElementById('btnLogout');
    if (logout) logout.style.display = 'inline-flex';
  }

  function showDashboard(user) {
    if (appStarted) {
      updateUserBar(user);
      return;
    }
    appStarted = true;
    var gate = document.getElementById('authGate');
    var shell = document.querySelector('.app-shell');
    if (gate) gate.style.display = 'none';
    if (shell) shell.classList.remove('auth-hidden');
    updateUserBar(user);
    if (typeof window.startDashboard === 'function') window.startDashboard();
  }

  function showLogin() {
    appStarted = false;
    var shell = document.querySelector('.app-shell');
    if (shell) shell.classList.add('auth-hidden');
    var gate = document.getElementById('authGate');
    if (gate) {
      gate.style.display = 'block';
      renderAuth('login');
    }
  }

  window.initAuth = function () {
    if (!window.supabase || !window.supabase.createClient) {
      var gate = document.getElementById('authGate');
      if (gate) gate.innerHTML = '<div class="auth-shell"><div class="auth-card"><h1>Authentication unavailable</h1><p class="auth-sub">The Supabase client did not load. Refresh the page and try again.</p></div></div>';
      return;
    }

    AuthClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    window.AuthClient = AuthClient;

    var logout = document.getElementById('btnLogout');
    if (logout) logout.addEventListener('click', function () {
      logout.disabled = true;
      AuthClient.auth.signOut().finally(function () { logout.disabled = false; });
    });

    AuthClient.auth.onAuthStateChange(function (event, session) {
      if (session && session.user) showDashboard(session.user);
      else showLogin();
    });

    AuthClient.auth.getSession().then(function (result) {
      if (result.error) {
        showLogin();
        authMessage(result.error.message, 'error');
        return;
      }
      if (result.data.session && result.data.session.user) showDashboard(result.data.session.user);
      else showLogin();
    }).catch(function (error) {
      showLogin();
      authMessage(error.message || 'Could not initialize authentication.', 'error');
    });
  };
})();