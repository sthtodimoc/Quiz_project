export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function isLoggedIn() {
  return !!getToken();
}

export function isAdmin() {
  const user = getUser();
  return user?.role === "admin";
}

export function isTeacher() {
  const user = getUser();
  return user?.role === "teacher";
}

// Admin OR Teacher
export function isStaff() {
  const user = getUser();
  return user?.role === "admin" || user?.role === "teacher";
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}