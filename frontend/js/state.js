// ==========================================================
// STATE.JS — current application/battle state (in-memory only)
// ==========================================================

const APP = {
  currentUser: null,
  accessToken: null,
  page: "home",
  dashboardSection: "dashboard",
  battle: null
};

function isLoggedIn() {
  return APP.currentUser !== null;
}

function logout() {
  APP.currentUser = null;
  APP.battle = null;
  APP.page = "home";
  render();
}
