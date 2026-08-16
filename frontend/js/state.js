// ==========================================================
// STATE.JS — current application/battle state (in-memory only)
// ==========================================================

const APP = {
  currentUser: null,      // reference into TRAINERS array
  page: "home",           // home | dashboard | leaderboard | battle
  dashboardSection: "dashboard", // dashboard | create-team | edit-team | pokedex
  battle: null            // active battle object, see battle.js
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
