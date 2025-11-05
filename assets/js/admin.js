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
  const defaultPortfolioSectionSelect = document.getElementById("default-portfolio-section");
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

  // Image resizing function (simple client-side resize)
  function resizeImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.85) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file); // Fallback to original if resize fails
              return;
            }
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: file.lastModified
            });
            resolve(resizedFile);
          }, file.type, quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function uploadFiles(files) {
    setStatus(`Processing and uploading ${files.length} file(s)...`);
    const now = Date.now();
    let completed = 0;
    if (uploadProgress && uploadBar) {
      uploadProgress.style.display = "block";
      uploadBar.style.width = "0%";
    }
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Resize image before upload
      setStatus(`Processing ${i + 1}/${files.length}...`);
      const processedFile = await resizeImage(file);
      
      const path = `gallery/${now}-${i}-${file.name}`;
      const ref = storage.ref().child(path);
      await new Promise((resolve, reject) => {
        const task = ref.put(processedFile);
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
                defaultCategorySelect?.value || "lifestyle";
              const portfolioSectionDefault =
                defaultPortfolioSectionSelect?.value || "fashion";
              
              // Extract EXIF data if EXIF library is available
              let exifData = {};
              if (typeof EXIF !== 'undefined') {
                try {
                  exifData = await new Promise((resolve, reject) => {
                    // Set timeout to prevent hanging if EXIF extraction fails silently
                    const timeout = setTimeout(() => {
                      resolve({});
                    }, 5000);
                    
                    EXIF.getData(file, function () {
                      clearTimeout(timeout);
                      try {
                        const exposureTime = EXIF.getTag(this, "ExposureTime");
                        const shutterSpeed = exposureTime ? 
                          (exposureTime >= 1 ? `${exposureTime}s` : `1/${Math.round(1 / exposureTime)}s`) : "";
                        
                        const exif = {
                          make: EXIF.getTag(this, "Make") || "",
                          model: EXIF.getTag(this, "Model") || "",
                          dateTime: EXIF.getTag(this, "DateTime") || EXIF.getTag(this, "DateTimeOriginal") || "",
                          iso: EXIF.getTag(this, "ISOSpeedRatings") || "",
                          aperture: EXIF.getTag(this, "FNumber") ? `f/${EXIF.getTag(this, "FNumber")}` : "",
                          shutterSpeed: shutterSpeed,
                          focalLength: EXIF.getTag(this, "FocalLength") ? `${Math.round(EXIF.getTag(this, "FocalLength"))}mm` : "",
                          gps: {
                            latitude: EXIF.getTag(this, "GPSLatitude") || null,
                            longitude: EXIF.getTag(this, "GPSLongitude") || null,
                          },
                        };
                        resolve(exif);
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

              await db.collection("gallery").add({
                url,
                path,
                caption: captionDefault || file.name,
                category: categoryDefault,
                portfolioSection: portfolioSectionDefault,
                order: orderVal,
                metadata: {
                  title: captionDefault || file.name,
                  description: "",
                  altText: captionDefault || file.name,
                  keywords: [],
                  exif: exifData,
                },
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

  // Simple one-click portfolio item editor
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
      max-width: 500px;
      width: 100%;
    `;

    const title = document.createElement("h3");
    title.textContent = "Edit Portfolio Item";
    title.style.marginBottom = "20px";

    const form = document.createElement("form");
    form.className = "form-grid";

    // Title field
    const titleInput = createFormField("Title", "title", imageData.metadata?.title || imageData.caption || "");
    
    // Caption field
    const captionInput = createFormField("Caption", "caption", imageData.caption || imageData.metadata?.title || "");
    
    // Portfolio Section dropdown
    const portfolioSectionLabel = document.createElement("label");
    portfolioSectionLabel.className = "full";
    portfolioSectionLabel.style.cssText = "display: flex; flex-direction: column; gap: 8px;";
    const portfolioSectionSpan = document.createElement("span");
    portfolioSectionSpan.textContent = "Portfolio Section";
    portfolioSectionSpan.style.fontSize = "15px";
    portfolioSectionSpan.style.fontWeight = "500";
    const portfolioSectionSelect = document.createElement("select");
    portfolioSectionSelect.name = "portfolioSection";
    portfolioSectionSelect.style.cssText = "padding: 10px; border: 1px solid var(--border); border-radius: 8px; background: var(--card); color: var(--text);";
    const portfolioSections = [
      { value: "fashion", label: "Fashion" },
      { value: "photo-shoots", label: "Photo Shoots" },
      { value: "agency-portfolio", label: "Agency Portfolio Shoots" }
    ];
    portfolioSections.forEach(sec => {
      const option = document.createElement("option");
      option.value = sec.value;
      option.textContent = sec.label;
      if (imageData.portfolioSection === sec.value) option.selected = true;
      portfolioSectionSelect.appendChild(option);
    });
    portfolioSectionLabel.appendChild(portfolioSectionSpan);
    portfolioSectionLabel.appendChild(portfolioSectionSelect);
    
    // Category dropdown
    const categoryLabel = document.createElement("label");
    categoryLabel.className = "full";
    categoryLabel.style.cssText = "display: flex; flex-direction: column; gap: 8px;";
    const categorySpan = document.createElement("span");
    categorySpan.textContent = "Category";
    categorySpan.style.fontSize = "15px";
    categorySpan.style.fontWeight = "500";
    const categorySelect = document.createElement("select");
    categorySelect.name = "category";
    categorySelect.style.cssText = "padding: 10px; border: 1px solid var(--border); border-radius: 8px; background: var(--card); color: var(--text);";
    const categories = [
      { value: "fashion-events", label: "Fashion Events" },
      { value: "fashion-photography", label: "Fashion Photography" },
      { value: "portraits-headshots", label: "Portraits & Headshots" },
      { value: "model-portfolios", label: "Model Portfolios" },
      { value: "actor-portfolios", label: "Actor Portfolios" },
      { value: "lifestyle", label: "Lifestyle" },
      { value: "events", label: "Events" }
    ];
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat.value;
      option.textContent = cat.label;
      if (imageData.category === cat.value) option.selected = true;
      categorySelect.appendChild(option);
    });
    categoryLabel.appendChild(categorySpan);
    categoryLabel.appendChild(categorySelect);

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
      const titleValue = formData.get("title") || "";
      const captionValue = formData.get("caption") || "";
      const categoryValue = formData.get("category") || "lifestyle";
      const portfolioSectionValue = formData.get("portfolioSection") || "fashion";
      
      try {
        const docRef = db.collection("gallery").doc(imageId);
        const existingData = (await docRef.get()).data() || {};
        const existingMetadata = existingData.metadata || {};
        
        await docRef.update({
          caption: captionValue,
          category: categoryValue,
          portfolioSection: portfolioSectionValue,
          metadata: {
            ...existingMetadata,
            title: titleValue,
            altText: titleValue || captionValue,
          }
        });
        
        alert("Portfolio item updated successfully!");
        modal.remove();
        await loadGallery();
      } catch (err) {
        console.error("Error updating portfolio item:", err);
        alert("Failed to save changes. Please try again.");
      }
    });

    btnGroup.appendChild(saveBtn);
    btnGroup.appendChild(cancelBtn);

    form.appendChild(titleInput);
    form.appendChild(captionInput);
    form.appendChild(portfolioSectionLabel);
    form.appendChild(categoryLabel);
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

      const batch = db.batch();
      for (const id of selected) {
        const docRef = db.collection("gallery").doc(id);
        const docSnap = await docRef.get();
        if (!docSnap.exists) continue;
        
        const data = docSnap.data();
        const currentMetadata = data.metadata || {};
        const currentKeywords = Array.isArray(currentMetadata.keywords) ? currentMetadata.keywords : [];
        
        const updates = {};
        if (keywordsToAdd.length) {
          const newKeywords = [...new Set([...currentKeywords, ...keywordsToAdd])];
          // Update entire metadata object to avoid nested field path issues
          updates.metadata = {
            ...currentMetadata,
            keywords: newKeywords,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          };
        }
        if (categoryUpdate) {
          updates.category = categoryUpdate;
        }
        if (Object.keys(updates).length) {
          batch.update(docRef, updates);
        }
      }

      await batch.commit();
      alert(`Updated ${selected.length} image(s).`);
      bulkModal.remove();
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
