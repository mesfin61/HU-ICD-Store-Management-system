const USERS_STORAGE_KEY = "hu-icd-system-users";
const ACTIVE_USER_STORAGE_KEY = "hu-icd-current-user";

const defaultUsers = [
  {
    id: "USR-001",
    fullName: "Abebe Kebede",
    email: "abebe.k@haramaya.edu.et",
    department: "Network Infrastructure",
    role: "Administrator",
    status: "Active",
    lastLogin: "10 mins ago",
    avatarColor: "bg-sky-500",
    roleTone: "blue",
    twoFactorEnabled: true,
    permissions: {
      viewInventory: true,
      manageStock: true,
      approveRequests: true,
      generateReports: true,
      systemConfig: true,
    },
  },
  {
    id: "USR-002",
    fullName: "Martha Tilahun",
    email: "martha.t@haramaya.edu.et",
    department: "Central Store",
    role: "Store Manager",
    status: "Active",
    lastLogin: "Yesterday, 4:20 PM",
    avatarColor: "bg-emerald-500",
    roleTone: "green",
    twoFactorEnabled: false,
    permissions: {
      viewInventory: true,
      manageStock: true,
      approveRequests: true,
      generateReports: true,
      systemConfig: false,
    },
  },
  {
    id: "USR-003",
    fullName: "Daniel Solomon",
    email: "daniel.s@haramaya.edu.et",
    department: "Maintenance Unit",
    role: "Store Officer",
    status: "Inactive",
    lastLogin: "2 weeks ago",
    avatarColor: "bg-amber-500",
    roleTone: "orange",
    twoFactorEnabled: false,
    permissions: {
      viewInventory: true,
      manageStock: true,
      approveRequests: false,
      generateReports: false,
      systemConfig: false,
    },
  },
  {
    id: "USR-004",
    fullName: "Hirut Bekele",
    email: "hirut.b@haramaya.edu.et",
    department: "Directorate Admin",
    role: "Staff",
    status: "Active",
    lastLogin: "05 Oct 2024",
    avatarColor: "bg-violet-500",
    roleTone: "slate",
    twoFactorEnabled: true,
    permissions: {
      viewInventory: true,
      manageStock: false,
      approveRequests: false,
      generateReports: true,
      systemConfig: false,
    },
  },
];

function canUseStorage(storage) {
  return (
    typeof window !== "undefined" && typeof window[storage] !== "undefined"
  );
}

function cloneUsers(users) {
  return users.map((user) => ({
    ...user,
    permissions: { ...(user.permissions || {}) },
  }));
}

function getStoredUsers() {
  if (!canUseStorage("localStorage")) {
    return cloneUsers(defaultUsers);
  }

  const rawUsers = window.localStorage.getItem(USERS_STORAGE_KEY);
  if (!rawUsers) {
    return cloneUsers(defaultUsers);
  }

  try {
    const parsedUsers = JSON.parse(rawUsers);
    if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
      return cloneUsers(parsedUsers);
    }
  } catch {
    return cloneUsers(defaultUsers);
  }

  return cloneUsers(defaultUsers);
}

function saveStoredUsers(users) {
  if (!canUseStorage("localStorage")) {
    return;
  }

  const toSave = Array.isArray(users)
    ? users.map((user) => ({
        ...user,
        permissions: { ...(user.permissions || {}) },
      }))
    : [];

  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(toSave));
}

function buildUserRecord(form) {
  const fullName = form.fullName.trim();
  const email = form.email.trim().toLowerCase();
  const initials = fullName
    ? fullName
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US";

  return {
    id: `USR-${Date.now().toString().slice(-6)}`,
    fullName: fullName || email || "New User",
    email,
    department: form.department.trim(),
    role: form.role.trim(),
    status: "Active",
    lastLogin: "Just now",
    avatarColor: "bg-sky-500",
    roleTone:
      form.role === "Administrator"
        ? "blue"
        : form.role === "Store Manager"
          ? "green"
          : form.role === "Store Officer"
            ? "orange"
            : "slate",
    initials,
    photo: form.photo || "",
    twoFactorEnabled: Boolean(form.twoFactorEnabled),
    permissions: {
      viewInventory: Boolean(form.permissions?.viewInventory),
      manageStock: Boolean(form.permissions?.manageStock),
      approveRequests: Boolean(form.permissions?.approveRequests),
      generateReports: Boolean(form.permissions?.generateReports),
      systemConfig: Boolean(form.permissions?.systemConfig),
    },
  };
}

function addStoredUser(user) {
  const users = getStoredUsers();
  const nextUsers = [
    user,
    ...users.filter((entry) => entry.email !== user.email),
  ];
  saveStoredUsers(nextUsers);
  return nextUsers;
}

function getUserSummary(users) {
  return users.reduce(
    (summary, user) => {
      summary.totalUsers += 1;
      summary.activeUsers += user.status === "Active" ? 1 : 0;
      summary.twoFactorDisabled += user.twoFactorEnabled ? 0 : 1;
      summary.adminUsers += user.role === "Administrator" ? 1 : 0;
      return summary;
    },
    {
      totalUsers: 0,
      activeUsers: 0,
      twoFactorDisabled: 0,
      adminUsers: 0,
    },
  );
}

function getStoredCurrentUser() {
  if (canUseStorage("localStorage")) {
    const persistedUser = window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (persistedUser) {
      try {
        return JSON.parse(persistedUser);
      } catch {
        window.localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      }
    }
  }

  if (canUseStorage("sessionStorage")) {
    const sessionUser = window.sessionStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (sessionUser) {
      try {
        return JSON.parse(sessionUser);
      } catch {
        window.sessionStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      }
    }
  }

  return null;
}

function setStoredCurrentUser(user, remember = true) {
  if (!user) {
    clearStoredCurrentUser();
    return;
  }

  const targetStorage =
    remember && canUseStorage("localStorage")
      ? window.localStorage
      : canUseStorage("sessionStorage")
        ? window.sessionStorage
        : null;

  if (!targetStorage) {
    return;
  }

  targetStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));

  const alternateStorage =
    targetStorage === window.localStorage
      ? window.sessionStorage
      : window.localStorage;
  if (alternateStorage && typeof alternateStorage.removeItem === "function") {
    alternateStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
  }
}

function clearStoredCurrentUser() {
  if (canUseStorage("localStorage")) {
    window.localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
  }

  if (canUseStorage("sessionStorage")) {
    window.sessionStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
  }
}

function getDisplayUserName(user) {
  if (!user) {
    return "Admin User";
  }

  return user.fullName || user.email || "Admin User";
}

function getUserInitials(user) {
  if (!user) {
    return "AU";
  }

  if (user.initials) {
    return user.initials;
  }

  const source = user.fullName || user.email || "AU";
  return source
    .split(/\s+|@/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export {
  ACTIVE_USER_STORAGE_KEY,
  addStoredUser,
  buildUserRecord,
  clearStoredCurrentUser,
  defaultUsers,
  getDisplayUserName,
  getStoredCurrentUser,
  getStoredUsers,
  getUserInitials,
  getUserSummary,
  saveStoredUsers,
  setStoredCurrentUser,
};
