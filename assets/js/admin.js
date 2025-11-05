/* global firebaseConfig */
(function () {
  // Mobile nav toggle for admin header
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("admin-nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }

  if (!window.firebaseConfig) {
    alert(
      "Firebase config is missing. Copy assets/js/config.example.js to assets/js/config.js and fill your project values."
    );
    return;
  }

  // Initialize Firebase
  const app = firebase.initializeApp(window.firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();

  const authView = document.getElementById("auth-view");
  const appView = document.getElementById("app-view");
  const loginForm = document.getElementById("login-form");
  const authError = document.getElementById("auth-error");
  const userEmailEl = document.getElementById("user-email");
  const logoutBtn = document.getElementById("logout");
  const forgotPasswordLink = document.getElementById("forgot-password");

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const uploadStatus = document.getElementById("upload-status");
  const galleryAdmin = document.getElementById("gallery-admin");
  const refreshBtn = document.getElementById("refresh");
  const saveOrderBtn = document.getElementById("save-order");
  const deleteSelectedBtn = document.getElementById("delete-selected");
  const defaultCaptionInput = document.getElementById("default-caption");
  const defaultCategorySelect = document.getElementById("default-category");
  const uploadProgress = document.getElementById("upload-progress");
  const uploadBar = document.getElementById("upload-bar");
  const userUidInput = document.getElementById("user-uid");
  const userRoleSelect = document.getElementById("user-role");
  const saveRoleBtn = document.getElementById("save-role");
  const roleStatus = document.getElementById("role-status");
  const usersList = document.getElementById("users-list");

  // Ensure persistent login
  try {
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  } catch (_) {}

  // Roles
  async function getUserRole(uid) {
    try {
      const doc = await db.collection("users").doc(uid).get();
      if (!doc.exists) return null;
      const data = doc.data();
      return data?.role || null; // expected values: 'admin' | 'member'
    } catch (_) {
      return null;
    }
  }

  // Session + admin gate
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const role = await getUserRole(user.uid);
      if (role !== "admin") {
        authError.textContent = "Access denied: admin only.";
        await auth.signOut();
        return;
      }
      authView.classList.add("hidden");
      appView.classList.remove("hidden");
      userEmailEl.textContent = user.email || "";
      await Promise.all([loadGallery(), loadUsers()]);
    } else {
      authView.classList.remove("hidden");
      appView.classList.add("hidden");
      loginForm.reset();
    }
  });

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    authError.textContent = "";
    const email = /** @type {HTMLInputElement} */ (
      document.getElementById("email")
    ).value.trim();
    const password = /** @type {HTMLInputElement} */ (
      document.getElementById("password")
    ).value;
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      authError.textContent = err.message || "Login failed";
    }
  });

  logoutBtn?.addEventListener("click", () => auth.signOut());

  // Password reset
  forgotPasswordLink?.addEventListener("click", async (e) => {
    e.preventDefault();
    authError.textContent = "";
    const emailInput = /** @type {HTMLInputElement} */ (
      document.getElementById("email")
    );
    const email = (emailInput?.value || "").trim();
    if (!email) {
      authError.textContent = "Enter your email above to reset password.";
      emailInput?.focus();
      return;
    }
    try {
      await auth.sendPasswordResetEmail(email);
      alert("Password reset email sent. Check your inbox.");
    } catch (err) {
      authError.textContent = err.message || "Failed to send reset email";
    }
  });

  // Upload handling
  function setStatus(text) {
    uploadStatus.textContent = text;
  }
  function pickFiles() {
    fileInput.click();
  }
  dropzone?.addEventListener("click", pickFiles);
  dropzone?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pickFiles();
    }
  });
  dropzone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("drag");
  });
  dropzone?.addEventListener("dragleave", () =>
    dropzone.classList.remove("drag")
  );
  dropzone?.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("drag");
    const files = Array.from(e.dataTransfer?.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length) uploadFiles(files);
  });
  fileInput?.addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length) uploadFiles(files);
    fileInput.value = "";
  });

  async function uploadFiles(files) {
    setStatus(`Uploading ${files.length} file(s)...`);
    const now = Date.now();
    let completed = 0;
    if (uploadProgress && uploadBar) {
      uploadProgress.style.display = "block";
      uploadBar.style.width = "0%";
    }
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `gallery/${now}-${i}-${file.name}`;
      const ref = storage.ref().child(path);
      await new Promise((resolve, reject) => {
        const task = ref.put(file);
        task.on(
          "state_changed",
          (snap) => {
            if (uploadBar) {
              const filePct = (snap.bytesTransferred / snap.totalBytes) * 100;
              const totalPct =
                ((completed + filePct / 100) / files.length) * 100;
              uploadBar.style.width = `${totalPct.toFixed(2)}%`;
            }
          },
          reject,
          async () => {
            try {
              const url = await ref.getDownloadURL();
              const orderVal = await nextOrderValue();
              const captionDefault = (defaultCaptionInput?.value || "").trim();
              const categoryDefault =
                defaultCategorySelect?.value || "campaign";
              await db.collection("gallery").add({
                url,
                path,
                caption: captionDefault || file.name,
                category: categoryDefault,
                order: orderVal,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              });
              completed += 1;
              setStatus(`Uploaded ${completed}/${files.length}`);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        );
      });
    }
    setStatus("Upload complete.");
    if (uploadProgress) uploadProgress.style.display = "none";
    await loadGallery();
  }

  async function nextOrderValue() {
    const snap = await db
      .collection("gallery")
      .orderBy("order", "desc")
      .limit(1)
      .get();
    if (snap.empty) return 1;
    const max = snap.docs[0].data().order || 0;
    return max + 1;
  }

  // Load and render gallery list (no innerHTML to avoid XSS)
  async function loadGallery() {
    galleryAdmin.innerHTML = "";
    const snap = await db.collection("gallery").orderBy("order").get();
    snap.forEach((doc) => {
      const data = doc.data();

      const item = document.createElement("div");
      item.className = "gallery-item";
      item.setAttribute("data-id", doc.id);
      item.setAttribute("draggable", "true");

      const img = document.createElement("img");
      img.setAttribute("src", String(data.url || ""));
      img.setAttribute("alt", String(data.caption || ""));
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");

      const meta = document.createElement("div");
      meta.className = "meta";

      const select = document.createElement("input");
      select.type = "checkbox";
      select.className = "select-item";

      const handle = document.createElement("span");
      handle.className = "handle";
      handle.title = "Drag to reorder";
      handle.textContent = "☰";

      const label = document.createElement("small");
      label.style.flex = "1";
      label.style.overflow = "hidden";
      label.style.textOverflow = "ellipsis";
      label.style.whiteSpace = "nowrap";
      label.textContent = String(data.caption || "");

      const del = document.createElement("span");
      del.className = "danger";
      del.setAttribute("data-action", "delete");
      del.title = "Delete";
      del.textContent = "Delete";

      meta.appendChild(select);
      meta.appendChild(handle);
      meta.appendChild(label);
      meta.appendChild(del);

      item.appendChild(img);
      item.appendChild(meta);
      galleryAdmin.appendChild(item);
    });
    enableDragAndDrop();
  }

  // Drag & drop ordering
  let dragEl = null;
  function enableDragAndDrop() {
    galleryAdmin.querySelectorAll(".gallery-item").forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        if (!(e.target && e.target.closest(".handle"))) {
          e.preventDefault();
          return;
        }
        dragEl = item;
        item.style.opacity = "0.6";
      });
      item.addEventListener("dragend", () => {
        if (dragEl) dragEl.style.opacity = "";
        dragEl = null;
      });
      item.addEventListener("dragover", (e) => {
        e.preventDefault();
      });
      item.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!dragEl || dragEl === item) return;
        const children = Array.from(galleryAdmin.children);
        const dragIndex = children.indexOf(dragEl);
        const dropIndex = children.indexOf(item);
        if (dragIndex < dropIndex) {
          galleryAdmin.insertBefore(dragEl, item.nextSibling);
        } else {
          galleryAdmin.insertBefore(dragEl, item);
        }
      });
      item
        .querySelector('[data-action="delete"]')
        .addEventListener("click", async () => {
          const id = item.getAttribute("data-id");
          if (!id) return;
          if (!confirm("Delete this image?")) return;
          const docRef = db.collection("gallery").doc(id);
          const docSnap = await docRef.get();
          const data = docSnap.data();
          if (data?.path) {
            try {
              await storage.ref().child(data.path).delete();
            } catch (_) {}
          }
          await docRef.delete();
          item.remove();
        });
    });
  }

  refreshBtn?.addEventListener("click", loadGallery);
  saveOrderBtn?.addEventListener("click", async () => {
    const batch = db.batch();
    Array.from(galleryAdmin.children).forEach((item, index) => {
      const id = item.getAttribute("data-id");
      if (!id) return;
      const ref = db.collection("gallery").doc(id);
      batch.update(ref, { order: index + 1 });
    });
    await batch.commit();
    alert("Order saved");
  });

  // Bulk delete selected
  deleteSelectedBtn?.addEventListener("click", async () => {
    const items = Array.from(galleryAdmin.querySelectorAll(".gallery-item"));
    const selected = items.filter((el) => {
      const cb = el.querySelector(".select-item");
      return cb && /** @type {HTMLInputElement} */ (cb).checked;
    });
    if (!selected.length) {
      alert("No images selected.");
      return;
    }
    if (!confirm(`Delete ${selected.length} selected image(s)?`)) return;
    for (const item of selected) {
      const id = item.getAttribute("data-id");
      if (!id) continue;
      try {
        const docRef = db.collection("gallery").doc(id);
        const snap = await docRef.get();
        const data = snap.data();
        if (data?.path) {
          try {
            await storage.ref().child(data.path).delete();
          } catch (_) {}
        }
        await docRef.delete();
        item.remove();
      } catch (_) {}
    }
  });

  // Users management
  async function loadUsers() {
    if (!usersList) return;
    usersList.textContent = "Loading users...";
    try {
      const snap = await db.collection("users").orderBy("role").get();
      if (snap.empty) {
        usersList.textContent = "No users found.";
        return;
      }
      const container = document.createElement("div");
      container.style.display = "grid";
      container.style.gridTemplateColumns = "repeat(12, 1fr)";
      container.style.gap = "8px";
      snap.forEach((doc) => {
        const data = doc.data() || {};
        const row = document.createElement("div");
        row.className = "admin-col-12";
        const box = document.createElement("div");
        box.style.display = "flex";
        box.style.justifyContent = "space-between";
        box.style.alignItems = "center";
        box.style.border = "1px solid var(--border)";
        box.style.borderRadius = "8px";
        box.style.padding = "8px 10px";
        const left = document.createElement("div");
        left.style.overflow = "hidden";
        left.style.textOverflow = "ellipsis";
        left.style.whiteSpace = "nowrap";
        left.textContent = `${doc.id}`;
        const right = document.createElement("small");
        right.className = "muted";
        right.textContent = `role: ${String(data.role || "unknown")}`;
        box.appendChild(left);
        box.appendChild(right);
        row.appendChild(box);
        container.appendChild(row);
      });
      usersList.innerHTML = "";
      usersList.appendChild(container);
    } catch (err) {
      usersList.textContent = (err && err.message) || "Failed to load users.";
    }
  }

  saveRoleBtn?.addEventListener("click", async () => {
    if (!userUidInput || !userRoleSelect || !roleStatus) return;
    const uid = String(
      /** @type {HTMLInputElement} */ (userUidInput).value || ""
    ).trim();
    const role = String(
      /** @type {HTMLSelectElement} */ (userRoleSelect).value || ""
    ).trim();
    roleStatus.textContent = "";
    if (!uid) {
      roleStatus.textContent = "Enter a user UID.";
      return;
    }
    if (role !== "admin" && role !== "member") {
      roleStatus.textContent = "Role must be 'admin' or 'member'.";
      return;
    }
    try {
      await db.collection("users").doc(uid).set({ role }, { merge: true });
      roleStatus.textContent = "Saved.";
      await loadUsers();
    } catch (err) {
      roleStatus.textContent = (err && err.message) || "Failed to save role.";
    }
  });

  // Footer year (moved from inline script)
  (function () {
    const y = document.getElementById("year-admin");
    if (y) y.textContent = String(new Date().getFullYear());
  })();
})();
