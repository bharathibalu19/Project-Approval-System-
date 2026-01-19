// const API_BASE = "http://localhost:5000/api";

// export const api = {
//   register: (data) =>
//     fetch(`${API_BASE}/auth/register`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     }),

//   login: (data) =>
//     fetch(`${API_BASE}/auth/login`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     }),

//   submitProject: (data, token) =>
//     fetch(`${API_BASE}/projects`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(data),
//     }),

//   getProjects: (token) =>
//     fetch(`${API_BASE}/projects`, {
//       headers: { Authorization: `Bearer ${token}` },
//     }),

//   reviewProject: (id, data, token) =>
//     fetch(`${API_BASE}/projects/${id}/review`, {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(data),
//     }),
// };
const API_URL = "http://localhost:5000/api";

export const register = async (data) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const login = async (data) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const submitProject = async (data, token) => {
  const res = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getProjects = async (token) => {
  const res = await fetch(`${API_URL}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const reviewProject = async (id, data, token) => {
  const res = await fetch(`${API_URL}/projects/${id}/review`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
};
