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

  // Initialize Firebase (check if already initialized)
  let app;
  try {
    app = firebase.app();
  } catch (e) {
    app = firebase.initializeApp(window.firebaseConfig);
  }
  const auth = firebase.auth(app);
  const db = firebase.firestore(app);
  const storage = firebase.storage(app);

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
  const uploadSpeedEl = document.getElementById("upload-speed");
  const uploadEtaEl = document.getElementById("upload-eta");
  const uploadFilesListEl = document.getElementById("upload-files-list");
  const userUidInput = document.getElementById("user-uid");
  const userRoleSelect = document.getElementById("user-role");
  const saveRoleBtn = document.getElementById("save-role");
  const roleStatus = document.getElementById("role-status");
  const usersList = document.getElementById("users-list");
  const userSearchInput = document.getElementById("user-search");
  const userFilterRole = document.getElementById("user-filter-role");
  const refreshUsersBtn = document.getElementById("refresh-users");
  const selectAllBtn = document.getElementById("select-all");
  const deselectAllBtn = document.getElementById("deselect-all");
  const bulkOperationProgress = document.getElementById("bulk-operation-progress");
  const bulkOperationStatus = document.getElementById("bulk-operation-status");
  const bulkOperationCount = document.getElementById("bulk-operation-count");
  const bulkOperationBar = document.getElementById("bulk-operation-bar");

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

  // Helper function to format bytes
  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  // Helper function to format time
  function formatTime(seconds) {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }

  async function uploadFiles(files) {
    setStatus(`Uploading ${files.length} file(s)...`);
    const now = Date.now();
    let completed = 0;
    let totalBytes = 0;
    let totalBytesTransferred = 0;
    const startTime = Date.now();
    const fileUploads = [];
    
    // Calculate total size
    files.forEach(file => {
      totalBytes += file.size;
    });

    // Initialize file tracking
    files.forEach((file, index) => {
      fileUploads.push({
        name: file.name,
        size: file.size,
        index: index,
        status: "pending", // pending, uploading, completed, error
        progress: 0,
        bytesTransferred: 0,
        speed: 0,
        startTime: null,
      });
    });

    // Update files list display
    function updateFilesList() {
      if (!uploadFilesListEl) return;
      uploadFilesListEl.innerHTML = "";
      fileUploads.forEach((fileUpload, idx) => {
        const item = document.createElement("div");
        item.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          margin-bottom: 4px;
          background: ${fileUpload.status === "uploading" ? "#1a1a1c" : fileUpload.status === "completed" ? "#0f1f0f" : fileUpload.status === "error" ? "#1f0f0f" : "#0f0f10"};
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 12px;
        `;
        
        const left = document.createElement("div");
        left.style.cssText = "flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
        left.textContent = fileUpload.name;
        
        const right = document.createElement("div");
        right.style.cssText = "display: flex; align-items: center; gap: 8px; margin-left: 8px;";
        
        if (fileUpload.status === "uploading") {
          const progress = document.createElement("span");
          progress.textContent = `${fileUpload.progress.toFixed(0)}%`;
          progress.style.color = "var(--accent)";
          right.appendChild(progress);
        } else if (fileUpload.status === "completed") {
          const check = document.createElement("span");
          check.textContent = "✓";
          check.style.color = "#4ade80";
          right.appendChild(check);
        } else if (fileUpload.status === "error") {
          const error = document.createElement("span");
          error.textContent = "✗";
          error.style.color = "#ff7171";
          right.appendChild(error);
        }
        
        item.appendChild(left);
        item.appendChild(right);
        uploadFilesListEl.appendChild(item);
      });
    }

    if (uploadProgress && uploadBar) {
      uploadProgress.style.display = "block";
      uploadBar.style.width = "0%";
      updateFilesList();
    }

    // Upload speed calculation
    let lastUpdateTime = Date.now();
    let lastTotalBytesTransferred = 0;
    let currentSpeed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileUpload = fileUploads[i];
      const path = `gallery/${now}-${i}-${file.name}`;
      const ref = storage.ref().child(path);
      
      fileUpload.status = "uploading";
      fileUpload.startTime = Date.now();
      updateFilesList();

      await new Promise((resolve, reject) => {
        const task = ref.put(file);
        task.on(
          "state_changed",
          (snap) => {
            const now = Date.now();
            const timeDelta = (now - lastUpdateTime) / 1000; // seconds
            
            fileUpload.bytesTransferred = snap.bytesTransferred;
            fileUpload.progress = (snap.bytesTransferred / snap.totalBytes) * 100;

            // Update total progress
            totalBytesTransferred = fileUploads.reduce((sum, fu) => sum + fu.bytesTransferred, 0);
            const bytesDelta = totalBytesTransferred - lastTotalBytesTransferred;
            
            if (timeDelta > 0.5) { // Update speed every 500ms
              currentSpeed = bytesDelta / timeDelta;
              lastUpdateTime = now;
              lastTotalBytesTransferred = totalBytesTransferred;
            }

            fileUpload.speed = currentSpeed;
            
            // Calculate total progress percentage
            const totalPct = (totalBytesTransferred / totalBytes) * 100;
            
            if (uploadBar) {
              uploadBar.style.width = `${totalPct.toFixed(2)}%`;
            }

            // Update speed and ETA
            if (uploadSpeedEl && currentSpeed > 0) {
              uploadSpeedEl.textContent = `Speed: ${formatBytes(currentSpeed)}/s`;
            }
            
            if (uploadEtaEl && currentSpeed > 0) {
              const remainingBytes = totalBytes - totalBytesTransferred;
              const etaSeconds = remainingBytes / currentSpeed;
              uploadEtaEl.textContent = `ETA: ${formatTime(etaSeconds)}`;
            }

            updateFilesList();
          },
          (error) => {
            fileUpload.status = "error";
            updateFilesList();
            reject(error);
          },
          async () => {
            try {
              const url = await ref.getDownloadURL();
              const orderVal = await nextOrderValue();
              const captionDefault = (defaultCaptionInput?.value || "").trim();
              const categoryDefault =
                defaultCategorySelect?.value || "campaign";
              
              // Extract EXIF data using centralized metadata manager
              let exifData = {};
              if (window.metadataManager && typeof window.metadataManager.extractEXIF === 'function') {
                try {
                  exifData = await window.metadataManager.extractEXIF(file);
                } catch (exifErr) {
                  console.warn("EXIF extraction failed:", exifErr);
                  exifData = {};
                }
              } else if (typeof EXIF !== 'undefined') {
                // Fallback to direct EXIF extraction if metadataManager not available
                try {
                  exifData = await new Promise((resolve) => {
                    const timeout = setTimeout(() => resolve({}), 5000);
                    EXIF.getData(file, function () {
                      clearTimeout(timeout);
                      try {
                        const exposureTime = EXIF.getTag(this, "ExposureTime");
                        const shutterSpeed = exposureTime ? 
                          (exposureTime >= 1 ? `${exposureTime}s` : `1/${Math.round(1 / exposureTime)}s`) : "";
                        resolve({
                          make: EXIF.getTag(this, "Make") || "",
                          model: EXIF.getTag(this, "Model") || "",
                          dateTime: EXIF.getTag(this, "DateTime") || EXIF.getTag(this, "DateTimeOriginal") || "",
                          iso: EXIF.getTag(this, "ISOSpeedRatings") || "",
                          aperture: EXIF.getTag(this, "FNumber") ? `f/${EXIF.getTag(this, "FNumber")}` : "",
                          shutterSpeed: shutterSpeed,
                          focalLength: EXIF.getTag(this, "FocalLength") ? `${Math.round(EXIF.getTag(this, "FocalLength"))}mm` : "",
                          gps: { latitude: null, longitude: null },
                        });
                      } catch (err) {
                        resolve({});
                      }
                    });
                  });
                } catch (exifErr) {
                  console.warn("EXIF extraction failed:", exifErr);
                  exifData = {};
                }
              }

              // Generate automatic alt text and keywords if metadataManager is available
              let autoAltText = captionDefault || file.name;
              let autoKeywords = [];
              
              if (window.metadataManager) {
                const tempImage = {
                  url: url,
                  caption: captionDefault || file.name,
                  category: categoryDefault,
                  metadata: {
                    title: captionDefault || file.name,
                    description: "",
                    altText: "",
                    keywords: [],
                    exif: exifData,
                  },
                };
                
                // Generate alt text
                if (typeof window.metadataManager.generateAltText === 'function') {
                  try {
                    autoAltText = window.metadataManager.generateAltText(tempImage);
                  } catch (err) {
                    console.warn("Failed to generate alt text:", err);
                  }
                }
                
                // Extract keywords
                if (typeof window.metadataManager.extractKeywords === 'function') {
                  try {
                    autoKeywords = window.metadataManager.extractKeywords(tempImage);
                  } catch (err) {
                    console.warn("Failed to extract keywords:", err);
                  }
                }
              }

              await db.collection("gallery").add({
                url,
                path,
                caption: captionDefault || file.name,
                category: categoryDefault,
                order: orderVal,
                metadata: {
                  title: captionDefault || file.name,
                  description: "",
                  altText: autoAltText,
                  keywords: autoKeywords,
                  exif: exifData,
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              });
              
              fileUpload.status = "completed";
              fileUpload.progress = 100;
              completed += 1;
              setStatus(`Uploaded ${completed}/${files.length}`);
              updateFilesList();
              resolve();
            } catch (e) {
              fileUpload.status = "error";
              updateFilesList();
              reject(e);
            }
          }
        );
      });
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    setStatus(`Upload complete! ${files.length} file(s) uploaded in ${totalTime}s`);
    
    // Clear speed and ETA after completion
    if (uploadSpeedEl) uploadSpeedEl.textContent = "";
    if (uploadEtaEl) uploadEtaEl.textContent = "";
    
    // Hide progress after a delay
    setTimeout(() => {
      if (uploadProgress) uploadProgress.style.display = "none";
    }, 3000);
    
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
      // Use generated alt text if available, otherwise fallback to caption
      const altText = data.metadata?.altText || 
                     (window.metadataManager?.generateAltText ? 
                       window.metadataManager.generateAltText(data) : 
                       data.caption || "");
      img.setAttribute("alt", String(altText));
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
      label.textContent = String(data.metadata?.title || data.caption || "");

      // Store metadata attributes for search
      item.setAttribute("data-title", String(data.metadata?.title || data.caption || ""));
      item.setAttribute("data-description", String(data.metadata?.description || ""));
      item.setAttribute("data-keywords", Array.isArray(data.metadata?.keywords) ? data.metadata.keywords.join(" ") : "");
      item.setAttribute("data-category", String(data.category || ""));

      const editBtn = document.createElement("span");
      editBtn.className = "edit-btn";
      editBtn.style.cursor = "pointer";
      editBtn.style.color = "var(--accent)";
      editBtn.style.marginRight = "8px";
      editBtn.setAttribute("data-action", "edit");
      editBtn.title = "Edit Metadata";
      editBtn.textContent = "Edit";

      const del = document.createElement("span");
      del.className = "danger";
      del.setAttribute("data-action", "delete");
      del.title = "Delete";
      del.textContent = "Delete";

      meta.appendChild(select);
      meta.appendChild(handle);
      meta.appendChild(label);
      meta.appendChild(editBtn);
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
        ?.addEventListener("click", async () => {
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

      // Edit metadata handler
      item
        .querySelector('[data-action="edit"]')
        ?.addEventListener("click", () => {
          openMetadataEditor(doc.id, data);
        });
    });
  }

  refreshBtn?.addEventListener("click", loadGallery);
  saveOrderBtn?.addEventListener("click", async () => {
    const items = Array.from(galleryAdmin.children);
    if (items.length === 0) {
      alert("No items to save.");
      return;
    }
    
    showBulkProgress(true);
    updateBulkProgress(0, items.length, "Saving order...");
    
    const batch = db.batch();
    let processed = 0;
    
    items.forEach((item, index) => {
      const id = item.getAttribute("data-id");
      if (!id) {
        processed++;
        return;
      }
      const ref = db.collection("gallery").doc(id);
      batch.update(ref, { order: index + 1 });
      processed++;
      updateBulkProgress(processed, items.length, `Updating order for ${processed} of ${items.length}...`);
    });
    
    try {
      await batch.commit();
      updateBulkProgress(items.length, items.length, "Order saved successfully!");
    } catch (err) {
      console.error("Save order error:", err);
      updateBulkProgress(items.length, items.length, `Error: ${err.message || "Failed to save order"}`);
    }
    
    setTimeout(() => {
      showBulkProgress(false);
    }, 2000);
  });

  // Select all / Deselect all
  selectAllBtn?.addEventListener("click", () => {
    galleryAdmin.querySelectorAll(".select-item").forEach((cb) => {
      /** @type {HTMLInputElement} */ (cb).checked = true;
    });
  });

  deselectAllBtn?.addEventListener("click", () => {
    galleryAdmin.querySelectorAll(".select-item").forEach((cb) => {
      /** @type {HTMLInputElement} */ (cb).checked = false;
    });
  });

  // Show/hide bulk operation progress
  function showBulkProgress(show) {
    if (bulkOperationProgress) {
      bulkOperationProgress.style.display = show ? "block" : "none";
    }
    if (!show && bulkOperationBar) {
      bulkOperationBar.style.width = "0%";
    }
  }

  function updateBulkProgress(current, total, status) {
    if (bulkOperationStatus) {
      bulkOperationStatus.textContent = status || "";
    }
    if (bulkOperationCount) {
      bulkOperationCount.textContent = `${current}/${total}`;
    }
    if (bulkOperationBar && total > 0) {
      const pct = (current / total) * 100;
      bulkOperationBar.style.width = `${pct.toFixed(1)}%`;
    }
  }

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
    
    showBulkProgress(true);
    let completed = 0;
    const total = selected.length;

    for (const item of selected) {
      const id = item.getAttribute("data-id");
      if (!id) {
        completed++;
        updateBulkProgress(completed, total, `Deleting...`);
        continue;
      }
      
      try {
        updateBulkProgress(completed, total, `Deleting ${item.querySelector("img")?.alt || id}...`);
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
        completed++;
        updateBulkProgress(completed, total, `Deleted ${completed} of ${total}...`);
      } catch (err) {
        console.error("Delete error:", err);
        completed++;
        updateBulkProgress(completed, total, `Error deleting ${id}...`);
      }
    }
    
    updateBulkProgress(completed, total, `Deleted ${completed} image(s) successfully.`);
    setTimeout(() => {
      showBulkProgress(false);
    }, 2000);
    
    await loadGallery();
  });

  // Users management
  let allUsersData = [];
  
  async function loadUsers() {
    if (!usersList) return;
    usersList.textContent = "Loading users...";
    try {
      const snap = await db.collection("users").orderBy("role").get();
      allUsersData = [];
      
      snap.forEach((doc) => {
        const data = doc.data() || {};
        const uid = doc.id;
        allUsersData.push({
          uid,
          role: data.role || "unknown",
          email: data.email || "", // Email stored in Firestore
          displayName: data.displayName || "",
          createdAt: data.createdAt || "",
          lastSignIn: data.lastSignIn || "",
        });
      });
      
      renderUsers(allUsersData);
    } catch (err) {
      usersList.textContent = (err && err.message) || "Failed to load users.";
    }
  }

  function renderUsers(users) {
    if (!usersList) return;
    
    const searchTerm = (userSearchInput?.value || "").toLowerCase().trim();
    const roleFilter = userFilterRole?.value || "all";
    
    // Filter users
    let filtered = users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.uid.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        (user.displayName && user.displayName.toLowerCase().includes(searchTerm));
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
    
    if (filtered.length === 0) {
      usersList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--muted);">No users found.</div>`;
      return;
    }
    
    const container = document.createElement("div");
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(12, 1fr)";
    container.style.gap = "8px";
    
    filtered.forEach((user) => {
      const row = document.createElement("div");
      row.className = "admin-col-12";
      row.setAttribute("data-uid", user.uid);
      
      const box = document.createElement("div");
      box.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 12px 14px;
        background: ${user.uid === auth.currentUser?.uid ? "#1a1a1c" : "#0f0f10"};
      `;
      
      const left = document.createElement("div");
      left.style.cssText = "flex: 1; min-width: 0;";
      
      const uidDiv = document.createElement("div");
      uidDiv.style.cssText = "font-size: 12px; color: var(--muted); margin-bottom: 4px; font-family: monospace;";
      uidDiv.textContent = user.uid;
      
      const emailDiv = document.createElement("div");
      emailDiv.style.cssText = "font-size: 14px; color: var(--text); margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
      emailDiv.textContent = user.email || "(no email)";
      
      if (user.displayName) {
        const nameDiv = document.createElement("div");
        nameDiv.style.cssText = "font-size: 13px; color: var(--muted);";
        nameDiv.textContent = user.displayName;
        left.appendChild(nameDiv);
      }
      
      left.appendChild(uidDiv);
      left.appendChild(emailDiv);
      
      const right = document.createElement("div");
      right.style.cssText = "display: flex; align-items: center; gap: 8px; margin-left: 12px;";
      
      const roleBadge = document.createElement("span");
      roleBadge.style.cssText = `
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        background: ${user.role === "admin" ? "#1f3a1f" : "#1f1f3a"};
        color: ${user.role === "admin" ? "#4ade80" : "#8b9aff"};
        border: 1px solid ${user.role === "admin" ? "#2d4d2d" : "#2d2d4d"};
      `;
      roleBadge.textContent = user.role || "unknown";
      
      const quickRoleBtn = document.createElement("button");
      quickRoleBtn.className = "btn btn-small";
      quickRoleBtn.style.cssText = "font-size: 11px; padding: 4px 8px;";
      quickRoleBtn.textContent = user.role === "admin" ? "→ Member" : "→ Admin";
      quickRoleBtn.title = `Change role to ${user.role === "admin" ? "member" : "admin"}`;
      quickRoleBtn.addEventListener("click", async () => {
        const newRole = user.role === "admin" ? "member" : "admin";
        if (confirm(`Change ${user.email || user.uid} role to ${newRole}?`)) {
          try {
            await db.collection("users").doc(user.uid).set({ role: newRole }, { merge: true });
            roleStatus.textContent = `Role changed to ${newRole}.`;
            await loadUsers();
            // Auto-fill the form
            if (userUidInput) userUidInput.value = user.uid;
            if (userRoleSelect) userRoleSelect.value = newRole;
          } catch (err) {
            roleStatus.textContent = `Error: ${err.message || "Failed to change role"}`;
          }
        }
      });
      
      right.appendChild(roleBadge);
      if (user.uid !== auth.currentUser?.uid) {
        right.appendChild(quickRoleBtn);
      } else {
        const currentUserBadge = document.createElement("span");
        currentUserBadge.style.cssText = "font-size: 11px; color: var(--accent);";
        currentUserBadge.textContent = "(You)";
        right.appendChild(currentUserBadge);
      }
      
      box.appendChild(left);
      box.appendChild(right);
      row.appendChild(box);
      container.appendChild(row);
    });
    
    usersList.innerHTML = "";
    usersList.appendChild(container);
  }

  // Search and filter users
  userSearchInput?.addEventListener("input", () => {
    renderUsers(allUsersData);
  });

  userFilterRole?.addEventListener("change", () => {
    renderUsers(allUsersData);
  });

  refreshUsersBtn?.addEventListener("click", () => {
    loadUsers();
  });

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
      roleStatus.style.color = "#ff7171";
      return;
    }
    
    if (role !== "admin" && role !== "member") {
      roleStatus.textContent = "Role must be 'admin' or 'member'.";
      roleStatus.style.color = "#ff7171";
      return;
    }
    
    // Note: Client SDK can't verify user existence in Auth directly
    // This is a limitation - consider using Cloud Functions for full validation
    
    // Prevent changing own role (security)
    if (uid === auth.currentUser?.uid) {
      roleStatus.textContent = "Cannot change your own role. Ask another admin.";
      roleStatus.style.color = "#ff7171";
      return;
    }
    
    roleStatus.textContent = "Saving...";
    roleStatus.style.color = "var(--muted)";
    
    try {
      await db.collection("users").doc(uid).set({ role }, { merge: true });
      roleStatus.textContent = `Role saved: ${role}`;
      roleStatus.style.color = "#4ade80";
      await loadUsers();
      
      // Clear form after 2 seconds
      setTimeout(() => {
        if (userUidInput) userUidInput.value = "";
        roleStatus.textContent = "";
      }, 2000);
    } catch (err) {
      roleStatus.textContent = `Error: ${err.message || "Failed to save role"}`;
      roleStatus.style.color = "#ff7171";
    }
  });

  // Metadata editor modal
  function openMetadataEditor(imageId, imageData) {
    const modal = document.createElement("div");
    modal.className = "metadata-modal";
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 20px;
    `;

    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    `;

    const title = document.createElement("h3");
    title.textContent = "Edit Image Metadata";
    title.style.marginBottom = "20px";

    const form = document.createElement("form");
    form.className = "form-grid";

    const titleInput = createFormField("Title", "title", imageData.metadata?.title || imageData.caption || "");
    const descInput = createFormField("Description", "description", imageData.metadata?.description || "", "textarea");
    const altInput = createFormField("Alt Text", "altText", imageData.metadata?.altText || imageData.caption || "");
    const keywordsInput = createFormField("Keywords (comma-separated)", "keywords", Array.isArray(imageData.metadata?.keywords) ? imageData.metadata.keywords.join(", ") : "");

    const exifSection = document.createElement("div");
    exifSection.style.marginTop = "20px";
    exifSection.style.paddingTop = "20px";
    exifSection.style.borderTop = "1px solid var(--border)";
    
    const exifTitle = document.createElement("h4");
    exifTitle.textContent = "EXIF Data";
    exifTitle.style.marginBottom = "12px";
    exifTitle.style.fontSize = "18px";

    const exifDisplay = document.createElement("div");
    exifDisplay.className = "exif-display";
    exifDisplay.style.cssText = `
      background: #0a0a0b;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      color: var(--muted);
      line-height: 1.8;
    `;

    const exifData = imageData.metadata?.exif || {};
    
    // Create EXIF display safely (avoid XSS)
    const exifFields = [
      { label: "Camera", value: `${exifData.make || ""} ${exifData.model || ""}`.trim() || "N/A" },
    ];
    
    // Add lens info if available
    if (exifData.lens?.make || exifData.lens?.model) {
      exifFields.push({
        label: "Lens",
        value: `${exifData.lens.make || ""} ${exifData.lens.model || ""}`.trim() || "N/A"
      });
    }
    
    exifFields.push(
      { label: "Date", value: exifData.dateTime || "N/A" },
      { label: "ISO", value: exifData.iso || "N/A" },
      { label: "Aperture", value: exifData.aperture || "N/A" },
      { label: "Shutter Speed", value: exifData.shutterSpeed || "N/A" },
      { label: "Focal Length", value: exifData.focalLength || "N/A" }
    );
    
    // Add additional EXIF fields if available
    if (exifData.flash) {
      exifFields.push({ label: "Flash", value: exifData.flash });
    }
    if (exifData.whiteBalance) {
      exifFields.push({ label: "White Balance", value: exifData.whiteBalance });
    }
    if (exifData.exposureMode) {
      exifFields.push({ label: "Exposure Mode", value: exifData.exposureMode });
    }
    if (exifData.dimensions?.width && exifData.dimensions?.height) {
      exifFields.push({
        label: "Dimensions",
        value: `${exifData.dimensions.width} × ${exifData.dimensions.height}`
      });
    }
    
    // Display GPS coordinates (decimal format)
    let hasValidGPS = false;
    let gpsLat = null;
    let gpsLon = null;
    if (exifData.gps?.latitude !== null && exifData.gps?.longitude !== null) {
      gpsLat = exifData.gps.latitude;
      gpsLon = exifData.gps.longitude;
      if (typeof gpsLat === 'number' && typeof gpsLon === 'number' && 
          gpsLat >= -90 && gpsLat <= 90 && gpsLon >= -180 && gpsLon <= 180) {
        hasValidGPS = true;
        exifFields.push({
          label: "Location",
          value: `${gpsLat.toFixed(6)}, ${gpsLon.toFixed(6)}`
        });
      }
    }
    
    exifFields.forEach((field) => {
      const div = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = `${field.label}: `;
      div.appendChild(strong);
      div.appendChild(document.createTextNode(field.value));
      exifDisplay.appendChild(div);
      
      // Add Google Maps link after Location field
      if (hasValidGPS && field.label === "Location") {
        const mapsLink = document.createElement("a");
        mapsLink.href = `https://www.google.com/maps?q=${gpsLat},${gpsLon}`;
        mapsLink.target = "_blank";
        mapsLink.rel = "noopener noreferrer";
        mapsLink.textContent = "View on Google Maps";
        mapsLink.style.cssText = "color: var(--accent); margin-top: 4px; display: inline-block;";
        div.appendChild(document.createElement("br"));
        div.appendChild(mapsLink);
      }
    });

    exifSection.appendChild(exifTitle);
    exifSection.appendChild(exifDisplay);

    const btnGroup = document.createElement("div");
    btnGroup.style.cssText = "display: flex; gap: 12px; margin-top: 20px;";

    const saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.className = "btn btn-primary";
    saveBtn.textContent = "Save";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => modal.remove());

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const keywordsStr = formData.get("keywords") || "";
      const keywords = keywordsStr.split(",").map(k => k.trim()).filter(k => k);
      
      const metadata = {
        title: formData.get("title") || "",
        description: formData.get("description") || "",
        altText: formData.get("altText") || "",
        keywords: keywords,
        exif: exifData,
      };

      const success = await window.metadataManager?.updateImageMetadata(imageId, metadata);
      if (success) {
        alert("Metadata saved successfully!");
        modal.remove();
        await loadGallery();
      } else {
        alert("Failed to save metadata.");
      }
    });

    btnGroup.appendChild(saveBtn);
    btnGroup.appendChild(cancelBtn);

    form.appendChild(titleInput);
    form.appendChild(descInput);
    form.appendChild(altInput);
    form.appendChild(keywordsInput);
    form.appendChild(exifSection);
    form.appendChild(btnGroup);

    modalContent.appendChild(title);
    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  }

  function createFormField(label, name, value, type = "input") {
    const container = document.createElement("label");
    container.className = "full";
    container.style.cssText = "display: flex; flex-direction: column; gap: 8px;";

    const span = document.createElement("span");
    span.textContent = label;
    span.style.fontSize = "15px";
    span.style.fontWeight = "500";

    let input;
    if (type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 4;
    } else {
      input = document.createElement("input");
      input.type = "text";
    }
    input.name = name;
    input.value = value;
    input.style.cssText = `
      width: 100%;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text);
      font-size: 15px;
      font-family: inherit;
    `;

    container.appendChild(span);
    container.appendChild(input);
    return container;
  }

  // Bulk edit functionality
  const bulkEditBtn = document.getElementById("bulk-edit-btn");
  bulkEditBtn?.addEventListener("click", async () => {
    const selected = Array.from(galleryAdmin.querySelectorAll(".gallery-item"))
      .filter((el) => {
        const cb = el.querySelector(".select-item");
        return cb && cb.checked;
      })
      .map((el) => el.getAttribute("data-id"))
      .filter(Boolean);

    if (!selected.length) {
      alert("Please select images to edit.");
      return;
    }

    const bulkModal = document.createElement("div");
    bulkModal.className = "metadata-modal";
    bulkModal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 20px;
    `;

    const bulkContent = document.createElement("div");
    bulkContent.style.cssText = `
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 100%;
    `;

    const title = document.createElement("h3");
    title.textContent = `Bulk Edit ${selected.length} Image(s)`;
    title.style.marginBottom = "20px";

    const form = document.createElement("form");
    form.className = "form-grid";

    const keywordsInput = createFormField("Add Keywords (comma-separated)", "keywords", "");
    const categorySelect = document.createElement("label");
    categorySelect.className = "full";
    categorySelect.style.cssText = "display: flex; flex-direction: column; gap: 8px;";
    const catSpan = document.createElement("span");
    catSpan.textContent = "Update Category (optional)";
    catSpan.style.fontSize = "15px";
    catSpan.style.fontWeight = "500";
    const catSelect = document.createElement("select");
    catSelect.name = "category";
    catSelect.style.cssText = `
      width: 100%;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text);
      font-size: 15px;
      font-family: inherit;
    `;
    catSelect.innerHTML = `
      <option value="">No change</option>
      <option value="safw">SA Fashion Week</option>
      <option value="sfw">Soweto Fashion Week</option>
      <option value="editorial">Editorial</option>
      <option value="campaign">Campaign</option>
    `;
    categorySelect.appendChild(catSpan);
    categorySelect.appendChild(catSelect);

    const btnGroup = document.createElement("div");
    btnGroup.style.cssText = "display: flex; gap: 12px; margin-top: 20px;";

    const saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.className = "btn btn-primary";
    saveBtn.textContent = "Apply to Selected";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => bulkModal.remove());

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const keywordsStr = formData.get("keywords") || "";
      const keywordsToAdd = keywordsStr.split(",").map(k => k.trim()).filter(k => k);
      const categoryUpdate = formData.get("category");

      if (!keywordsToAdd.length && !categoryUpdate) {
        alert("Please provide keywords or select a category to update.");
        return;
      }

      bulkModal.remove();
      showBulkProgress(true);
      
      let completed = 0;
      const total = selected.length;
      const batch = db.batch();
      const updates = [];
      
      for (const id of selected) {
        try {
          updateBulkProgress(completed, total, `Updating ${completed + 1} of ${total}...`);
          const docRef = db.collection("gallery").doc(id);
          const docSnap = await docRef.get();
          if (!docSnap.exists) {
            completed++;
            continue;
          }
          
          const data = docSnap.data();
          const currentMetadata = data.metadata || {};
          const currentKeywords = Array.isArray(currentMetadata.keywords) ? currentMetadata.keywords : [];
          
          const updateData = {};
          if (keywordsToAdd.length) {
            const newKeywords = [...new Set([...currentKeywords, ...keywordsToAdd])];
            // Update entire metadata object to avoid nested field path issues
            updateData.metadata = {
              ...currentMetadata,
              keywords: newKeywords,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            };
          }
          if (categoryUpdate) {
            updateData.category = categoryUpdate;
          }
          if (Object.keys(updateData).length) {
            batch.update(docRef, updateData);
            updates.push(id);
          }
          completed++;
          updateBulkProgress(completed, total, `Processing ${completed} of ${total}...`);
        } catch (err) {
          console.error("Update error:", err);
          completed++;
          updateBulkProgress(completed, total, `Error updating...`);
        }
      }

      try {
        if (updates.length > 0) {
          await batch.commit();
          updateBulkProgress(completed, total, `Successfully updated ${updates.length} image(s).`);
        } else {
          updateBulkProgress(completed, total, `No updates to apply.`);
        }
      } catch (err) {
        console.error("Batch commit error:", err);
        updateBulkProgress(completed, total, `Error: ${err.message || "Failed to update"}`);
      }
      
      setTimeout(() => {
        showBulkProgress(false);
      }, 2000);
      
      await loadGallery();
    });

    btnGroup.appendChild(saveBtn);
    btnGroup.appendChild(cancelBtn);

    form.appendChild(keywordsInput);
    form.appendChild(categorySelect);
    form.appendChild(btnGroup);

    bulkContent.appendChild(title);
    bulkContent.appendChild(form);
    bulkModal.appendChild(bulkContent);
    bulkModal.addEventListener("click", (e) => {
      if (e.target === bulkModal) bulkModal.remove();
    });

    document.body.appendChild(bulkModal);
  });

  // Footer year (moved from inline script)
  (function () {
    const y = document.getElementById("year-admin");
    if (y) y.textContent = String(new Date().getFullYear());
  })();
})();
