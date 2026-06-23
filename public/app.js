const state = {
  user: null,
  mode: "login",
  view: "browse",
  recipes: [],
  tags: [],
  editingRecipe: null,
  maintenanceMode: false,
  maintenanceMessage: ""
};

const fallbackPhotos = [
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=900&q=80"
];

const accountPanel = document.querySelector("#accountPanel");
const recipeGrid = document.querySelector("#recipeGrid");
const recipeCount = document.querySelector("#recipeCount");
const viewTitle = document.querySelector("#viewTitle");
const searchInput = document.querySelector("#searchInput");
const tagFilter = document.querySelector("#tagFilter");
const mealFilter = document.querySelector("#mealFilter");
const difficultyFilter = document.querySelector("#difficultyFilter");
const sortFilter = document.querySelector("#sortFilter");
const recipeForm = document.querySelector("#recipeForm");
const recipeMessage = document.querySelector("#recipeMessage");
const recipeDrawer = document.querySelector("#recipeDrawer");
const drawerTitle = document.querySelector("#drawerTitle");
const authDialog = document.querySelector("#authDialog");
const authForm = document.querySelector("#authForm");
const authMessage = document.querySelector("#authMessage");
const loginTab = document.querySelector("#loginTab");
const registerTab = document.querySelector("#registerTab");
const nameField = document.querySelector("#nameField");
const authSubmit = document.querySelector("#authSubmit");
const recipeDialog = document.querySelector("#recipeDialog");
const tagCloud = document.querySelector("#tagCloud");
const adminPanel = document.querySelector("#adminPanel");
const adminStats = document.querySelector("#adminStats");
const usersTable = document.querySelector("#usersTable");
const adminRecipes = document.querySelector("#adminRecipes");
const maintenanceBanner = document.querySelector("#maintenanceBanner");
const maintenanceText = document.querySelector("#maintenanceText");
const maintenanceToggle = document.querySelector("#maintenanceToggle");

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

function formatMaintenanceLabel(enabled) {
  return enabled ? "Maintenance On" : "Maintenance Off";
}

async function updateMaintenanceMode(enabled) {
  const data = await api("/api/admin/maintenance", {
    method: "PATCH",
    body: JSON.stringify({ maintenanceMode: enabled })
  });

  state.maintenanceMode = data.settings.maintenanceMode;
  state.maintenanceMessage = data.settings.maintenanceMessage;
  maintenanceToggle.textContent = formatMaintenanceLabel(state.maintenanceMode);
  return data;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMaintenanceBanner() {
  if (!maintenanceBanner) return;

  if (state.maintenanceMode && state.user?.role !== "admin") {
    maintenanceText.textContent = state.maintenanceMessage || "Dishshare is getting a quick polish.";
    maintenanceBanner.hidden = false;
  } else {
    maintenanceBanner.hidden = true;
  }
}

async function loadSettings() {
  try {
    const data = await api("/api/config");
    state.maintenanceMode = data.maintenanceMode;
    state.maintenanceMessage = data.maintenanceMessage;
    renderMaintenanceBanner();
  } catch (error) {
    console.warn("Could not load site settings", error.message);
  }
}

function fallbackPhoto(recipe) {
  const index = Math.abs(String(recipe._id || recipe.title || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0));
  return fallbackPhotos[index % fallbackPhotos.length];
}

function recipePhoto(recipe) {
  return recipe.imageUrl || fallbackPhoto(recipe);
}

function totalMinutes(recipe) {
  return Number(recipe.prepMinutes || 0) + Number(recipe.cookMinutes || 0);
}

function setMessage(element, message, type) {
  element.textContent = message;
  element.className = `message ${type || ""}`.trim();
}

function renderAccount() {
  document.querySelectorAll(".admin-only").forEach((item) => {
    item.hidden = state.user?.role !== "admin";
  });

  if (state.user) {
    accountPanel.innerHTML = `
      <span>${escapeHtml(state.user.name)}${state.user.role === "admin" ? " · Admin" : ""}</span>
      <button class="secondary" id="logoutButton" type="button">Log out</button>
    `;
    document.querySelector("#logoutButton").addEventListener("click", logout);
  } else {
    accountPanel.innerHTML = `
      <button id="openLogin" type="button">Log in</button>
      <button class="secondary" id="openRegister" type="button">Create account</button>
    `;
    document.querySelector("#openLogin").addEventListener("click", () => openAuth("login"));
    document.querySelector("#openRegister").addEventListener("click", () => openAuth("register"));
  }
}

function renderAuthMode() {
  const isLogin = state.mode === "login";
  loginTab.classList.toggle("active", isLogin);
  registerTab.classList.toggle("active", !isLogin);
  nameField.style.display = isLogin ? "none" : "grid";
  nameField.querySelector("input").required = !isLogin;
  authSubmit.textContent = isLogin ? "Log in" : "Create account";
  authMessage.textContent = "";
  authMessage.className = "message";
}

function openAuth(mode) {
  state.mode = mode;
  authForm.reset();
  renderAuthMode();
  authDialog.showModal();
}

function renderTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === state.view);
  });

  const titles = {
    browse: "Browse Recipes",
    favorites: "Favorite Recipes",
    mine: "My Recipes",
    admin: "Admin Review"
  };
  viewTitle.textContent = titles[state.view] || "Browse Recipes";
  adminPanel.hidden = state.view !== "admin" || state.user?.role !== "admin";
}

function renderTags() {
  const current = tagFilter.value;
  tagFilter.innerHTML = '<option value="">All tags</option>';

  state.tags.forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    tagFilter.appendChild(option);
  });

  tagFilter.value = state.tags.includes(current) ? current : "";
  tagCloud.innerHTML = state.tags.length
    ? state.tags.map((tag) => `<button class="tag" data-tag="${escapeHtml(tag)}" type="button">${escapeHtml(tag)}</button>`).join("")
    : '<span class="empty">Tags will appear after recipes are added.</span>';

  tagCloud.querySelectorAll("[data-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      tagFilter.value = button.dataset.tag;
      loadRecipes();
    });
  });
}

function renderHeroStats() {
  document.querySelector("#heroRecipeCount").textContent = state.recipes.length;
  document.querySelector("#heroTagCount").textContent = state.tags.length;
  document.querySelector("#heroMemberLabel").textContent = state.user ? state.user.name.split(" ")[0] : "Family";
}

function renderRecipes() {
  recipeCount.textContent = `${state.recipes.length} ${state.recipes.length === 1 ? "recipe" : "recipes"}`;
  renderHeroStats();

  if (state.recipes.length === 0) {
    recipeGrid.innerHTML = '<div class="empty">No recipes found here yet. Add a favorite or adjust the filters.</div>';
    return;
  }

  recipeGrid.innerHTML = state.recipes
    .map((recipe) => {
      const photo = recipePhoto(recipe);
      const tags = (recipe.tags || [])
        .slice(0, 4)
        .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
        .join("");
      const time = totalMinutes(recipe);
      const author = recipe.createdBy?.name || "Family";

      return `
        <article class="recipe-card" data-recipe-id="${recipe._id}" tabindex="0">
          <div class="recipe-photo" style="background-image: linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.42)), url('${escapeHtml(photo)}')">
            <span class="pill">${escapeHtml(recipe.mealType || "other")}</span>
            <button class="favorite secondary" data-favorite="${recipe._id}" type="button" aria-label="Toggle favorite">
              ${recipe.isFavorite ? "Loved" : "Love"} · ${recipe.favoriteCount || 0}
            </button>
          </div>
          <div class="recipe-body">
            <div>
              <h3>${escapeHtml(recipe.title)}</h3>
              <div class="meta-row">
                <span>By ${escapeHtml(author)}</span>
                <span>${time ? `${time} min` : "Anytime"}</span>
                <span>${escapeHtml(recipe.difficulty || "easy")}</span>
              </div>
            </div>
            <p class="recipe-desc">${escapeHtml(recipe.description || recipe.familyStory || "A family recipe ready to cook, save, and share.")}</p>
            <div class="tags">
              ${recipe.status !== "published" ? `<span class="tag status ${escapeHtml(recipe.status)}">${escapeHtml(recipe.status)}</span>` : ""}
              ${tags}
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  recipeGrid.querySelectorAll(".recipe-card").forEach((card) => {
    card.addEventListener("click", () => openRecipe(card.dataset.recipeId));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter") openRecipe(card.dataset.recipeId);
    });
  });

  recipeGrid.querySelectorAll("[data-favorite]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      await toggleFavorite(button.dataset.favorite);
    });
  });
}

function buildRecipeQuery() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  if (tagFilter.value) params.set("tag", tagFilter.value);
  if (mealFilter.value) params.set("mealType", mealFilter.value);
  if (difficultyFilter.value) params.set("difficulty", difficultyFilter.value);
  if (sortFilter.value) params.set("sort", sortFilter.value);

  if (state.view === "favorites") params.set("favorites", "true");
  if (state.view === "mine") {
    params.set("mine", "true");
    params.set("status", "all");
  }
  if (state.view === "admin" && state.user?.role === "admin") params.set("status", "all");

  return params.toString();
}

async function loadRecipes() {
  if ((state.view === "favorites" || state.view === "mine") && !state.user) {
    state.recipes = [];
    renderRecipes();
    return;
  }

  const data = await api(`/api/recipes?${buildRecipeQuery()}`);
  state.recipes = data.recipes;
  state.tags = data.tags;
  renderTags();
  renderRecipes();
}

async function loadMe() {
  try {
    const data = await api("/api/auth/me");
    state.user = data.user;
  } catch (error) {
    state.user = null;
  }
  renderAccount();
  renderMaintenanceBanner();
}

async function logout() {
  await api("/api/auth/logout", { method: "POST" });
  state.user = null;
  if (["favorites", "mine", "admin"].includes(state.view)) state.view = "browse";
  renderAccount();
  renderTabs();
  await loadRecipes();
}

async function toggleFavorite(id) {
  if (!state.user) {
    openAuth("login");
    return;
  }

  await api(`/api/recipes/${id}/favorite`, { method: "POST" });
  await loadRecipes();
}

async function openRecipe(id) {
  const data = await api(`/api/recipes/${id}`);
  const recipe = data.recipe;
  const photo = recipePhoto(recipe);
  const ingredients = recipe.ingredients.map((item) => `<li>${escapeHtml(item.text)}</li>`).join("");
  const steps = recipe.steps.map((item) => `<li>${escapeHtml(item.text)}</li>`).join("");
  const tags = (recipe.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  const time = totalMinutes(recipe);

  recipeDialog.innerHTML = `
    <div class="detail-hero" style="background-image: url('${escapeHtml(photo)}')">
      <form method="dialog" class="dialog-close">
        <button aria-label="Close">x</button>
      </form>
      <div class="detail-title">
        <p class="eyebrow">${escapeHtml(recipe.mealType || "recipe")}</p>
        <h2>${escapeHtml(recipe.title)}</h2>
        <div class="meta-row">
          <span>Shared by ${escapeHtml(recipe.createdBy?.name || "Family")}</span>
          <span>${time ? `${time} min` : "Flexible timing"}</span>
          <span>${escapeHtml(recipe.servings || 4)} servings</span>
          <span>${escapeHtml(recipe.difficulty || "easy")}</span>
        </div>
      </div>
    </div>
    <div class="detail-body">
      <section>
        <p>${escapeHtml(recipe.description || "No description yet.")}</p>
        ${recipe.familyStory ? `<h3>Family Story</h3><p>${escapeHtml(recipe.familyStory)}</p>` : ""}
        ${recipe.sourceName ? `<p class="meta-row"><span>From ${escapeHtml(recipe.sourceName)}</span></p>` : ""}
        <div class="tags">${tags}</div>
        <div class="detail-actions">
          <button data-detail-favorite="${recipe._id}" type="button">${recipe.isFavorite ? "Remove Favorite" : "Add Favorite"}</button>
          ${recipe.canEdit ? `<button class="secondary" data-edit-recipe="${recipe._id}" type="button">Edit</button>` : ""}
          ${recipe.canEdit ? `<button class="danger" data-delete-recipe="${recipe._id}" type="button">Delete</button>` : ""}
        </div>
      </section>
      <section>
        <h3>Ingredients</h3>
        <ul>${ingredients}</ul>
        <h3>Steps</h3>
        <ol>${steps}</ol>
      </section>
    </div>
  `;

  recipeDialog.querySelector("[data-detail-favorite]").addEventListener("click", async () => {
    await toggleFavorite(recipe._id);
    recipeDialog.close();
  });

  const editButton = recipeDialog.querySelector("[data-edit-recipe]");
  if (editButton) {
    editButton.addEventListener("click", () => {
      recipeDialog.close();
      openRecipeEditor(recipe);
    });
  }

  const deleteButton = recipeDialog.querySelector("[data-delete-recipe]");
  if (deleteButton) {
    deleteButton.addEventListener("click", async () => {
      if (!confirm("Delete this recipe permanently?")) return;
      await api(`/api/recipes/${recipe._id}`, { method: "DELETE" });
      recipeDialog.close();
      await loadRecipes();
      if (state.user?.role === "admin") await loadAdmin();
    });
  }

  recipeDialog.showModal();
}

function recipeToForm(recipe) {
  return {
    id: recipe?._id || "",
    title: recipe?.title || "",
    sourceName: recipe?.sourceName || "",
    description: recipe?.description || "",
    mealType: recipe?.mealType || "dinner",
    difficulty: recipe?.difficulty || "easy",
    prepMinutes: recipe?.prepMinutes || "",
    cookMinutes: recipe?.cookMinutes || "",
    servings: recipe?.servings || 4,
    imageUrl: recipe?.imageUrl || "",
    ingredients: (recipe?.ingredients || []).map((item) => item.text).join("\n"),
    steps: (recipe?.steps || []).map((item) => item.text).join("\n"),
    familyStory: recipe?.familyStory || "",
    tags: (recipe?.tags || []).join(", "),
    status: recipe?.status === "draft" ? "draft" : "published"
  };
}

function openRecipeEditor(recipe = null) {
  if (!state.user) {
    openAuth("login");
    return;
  }

  state.editingRecipe = recipe;
  drawerTitle.textContent = recipe ? "Edit Recipe" : "Add Recipe";
  recipeMessage.textContent = "";
  recipeMessage.className = "message";
  recipeForm.reset();

  const values = recipeToForm(recipe);
  Object.entries(values).forEach(([key, value]) => {
    if (recipeForm.elements[key]) recipeForm.elements[key].value = value;
  });

  recipeDrawer.classList.add("open");
  recipeDrawer.setAttribute("aria-hidden", "false");
}

function closeRecipeEditor() {
  recipeDrawer.classList.remove("open");
  recipeDrawer.setAttribute("aria-hidden", "true");
  state.editingRecipe = null;
}

async function saveRecipe(event) {
  event.preventDefault();

  if (!state.user) {
    openAuth("login");
    return;
  }

  const formData = Object.fromEntries(new FormData(recipeForm));
  const id = formData.id;
  delete formData.id;

  try {
    await api(id ? `/api/recipes/${id}` : "/api/recipes", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(formData)
    });
    setMessage(recipeMessage, "Recipe saved.", "success");
    closeRecipeEditor();
    await loadRecipes();
    if (state.user?.role === "admin") await loadAdmin();
  } catch (error) {
    setMessage(recipeMessage, error.message, "error");
  }
}

async function loadAdmin() {
  if (state.user?.role !== "admin") return;

  const [summary, users] = await Promise.all([api("/api/admin/summary"), api("/api/admin/users")]);

  adminStats.innerHTML = Object.entries(summary.stats)
    .map(([key, value]) => `<div class="stat"><strong>${value}</strong><span>${escapeHtml(key.replace(/([A-Z])/g, " $1"))}</span></div>`)
    .join("");

  usersTable.innerHTML = users.users
    .map(
      (user) => `
        <tr>
          <td>${escapeHtml(user.name)}</td>
          <td>${escapeHtml(user.email)}</td>
          <td>
            <select data-user-role="${user.id}">
              <option value="member" ${user.role === "member" ? "selected" : ""}>Member</option>
              <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
            </select>
          </td>
          <td>
            <select data-user-status="${user.id}">
              <option value="active" ${user.status === "active" ? "selected" : ""}>Active</option>
              <option value="disabled" ${user.status === "disabled" ? "selected" : ""}>Disabled</option>
            </select>
          </td>
        </tr>
      `
    )
    .join("");

  adminRecipes.innerHTML = summary.newestRecipes
    .map(
      (recipe) => `
        <div class="admin-recipe">
          <div>
            <strong>${escapeHtml(recipe.title)}</strong>
            <div class="meta-row">
              <span>${escapeHtml(recipe.createdBy?.name || "Family")}</span>
              <span>${escapeHtml(recipe.status)}</span>
            </div>
          </div>
          <div class="admin-actions">
            <button class="secondary" data-admin-status="${recipe._id}" data-status="published" type="button">Publish</button>
            <button class="secondary" data-admin-status="${recipe._id}" data-status="draft" type="button">Draft</button>
            <button class="secondary" data-admin-status="${recipe._id}" data-status="archived" type="button">Archive</button>
            <button class="danger" data-admin-delete="${recipe._id}" type="button">Delete</button>
          </div>
        </div>
      `
    )
    .join("");

  usersTable.querySelectorAll("[data-user-role]").forEach((select) => {
    select.addEventListener("change", () => updateUser(select.dataset.userRole, { role: select.value }));
  });

  usersTable.querySelectorAll("[data-user-status]").forEach((select) => {
    select.addEventListener("change", () => updateUser(select.dataset.userStatus, { status: select.value }));
  });

  adminRecipes.querySelectorAll("[data-admin-status]").forEach((button) => {
    button.addEventListener("click", () => updateRecipeStatus(button.dataset.adminStatus, button.dataset.status));
  });

  adminRecipes.querySelectorAll("[data-admin-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Delete this recipe permanently?")) return;
      await api(`/api/admin/recipes/${button.dataset.adminDelete}`, { method: "DELETE" });
      await Promise.all([loadAdmin(), loadRecipes()]);
    });
  });

  state.maintenanceMode = summary.settings.maintenanceMode;
  state.maintenanceMessage = summary.settings.maintenanceMessage;
  maintenanceToggle.textContent = formatMaintenanceLabel(state.maintenanceMode);
  renderMaintenanceBanner();
}

async function updateUser(id, changes) {
  await api(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes)
  });
  await loadAdmin();
}

async function toggleMaintenanceMode() {
  try {
    maintenanceToggle.disabled = true;
    await updateMaintenanceMode(!state.maintenanceMode);
    await loadAdmin();
  } catch (error) {
    alert(error.message);
  } finally {
    maintenanceToggle.disabled = false;
  }
}

async function updateRecipeStatus(id, status) {
  await api(`/api/admin/recipes/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
  await Promise.all([loadAdmin(), loadRecipes()]);
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(authForm));
  const path = state.mode === "login" ? "/api/auth/login" : "/api/auth/register";

  try {
    const data = await api(path, {
      method: "POST",
      body: JSON.stringify(formData)
    });
    state.user = data.user;
    authDialog.close();
    renderAccount();
    await loadRecipes();
    if (state.user.role === "admin") await loadAdmin();
  } catch (error) {
    setMessage(authMessage, error.message, "error");
  }
});

loginTab.addEventListener("click", () => {
  state.mode = "login";
  renderAuthMode();
});

registerTab.addEventListener("click", () => {
  state.mode = "register";
  renderAuthMode();
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", async () => {
    if (["favorites", "mine"].includes(tab.dataset.view) && !state.user) {
      openAuth("login");
      return;
    }
    if (tab.dataset.view === "admin" && state.user?.role !== "admin") return;

    state.view = tab.dataset.view;
    renderTabs();
    await loadRecipes();
    if (state.view === "admin") await loadAdmin();
  });
});

document.querySelector("#addRecipeHero").addEventListener("click", () => openRecipeEditor());
document.querySelector("#addRecipeSide").addEventListener("click", () => openRecipeEditor());
document.querySelector("#viewFavoritesHero").addEventListener("click", async () => {
  if (!state.user) {
    openAuth("login");
    return;
  }
  state.view = "favorites";
  renderTabs();
  await loadRecipes();
});
document.querySelector("#refreshAdmin").addEventListener("click", loadAdmin);
maintenanceToggle.addEventListener("click", toggleMaintenanceMode);

recipeForm.addEventListener("submit", saveRecipe);

document.querySelectorAll("[data-close-drawer]").forEach((button) => {
  button.addEventListener("click", closeRecipeEditor);
});

let searchTimeout;
[tagFilter, mealFilter, difficultyFilter, sortFilter].forEach((input) => {
  input.addEventListener("change", loadRecipes);
});
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadRecipes, 250);
});

(async function init() {
  renderTabs();
  await loadMe();
  await loadSettings();
  await loadRecipes();
  if (state.user?.role === "admin") await loadAdmin();
})();
