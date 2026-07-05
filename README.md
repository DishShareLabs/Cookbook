# Family Cookbook

A full-stack family cookbook website. Family members can create an account, log in, browse recipes, search and filter, favorite dishes, submit recipes, edit their own recipes, and use an admin panel to manage users and recipe status. Recipes and user accounts are stored in MongoDB. On the example deployed site, it has been disabled. It's just mean to show what it look's like.

## Features

- Visual recipe homepage with photo cards, search, tag filtering, meal filtering, difficulty filtering, and sorting.
- Login and registration backed by MongoDB users and hashed passwords.
- First registered user automatically becomes an admin.
- Recipe creation with title, description, ingredients, steps, tags, meal type, difficulty, timing, servings, photo URL, source, family story, and draft/published status.
- Favorites, My Recipes, editable owned recipes, and recipe detail modal.
- Admin panel with summary stats, member role/status management, and recipe publish/draft/archive/delete controls.
- Vercel-ready API entry point for public deployment.

## File Structure

```text
family-cookbook/
  api/
    index.js            # Vercel serverless API entry point
  public/
    app.js              # Browser-side UI logic
    index.html          # Homepage, auth dialog, and recipe form
    styles.css          # Responsive visual styling
  src/
    middleware/
      auth.js           # JWT cookie authentication middleware
    models/
      Recipe.js         # Flexible MongoDB recipe document schema
      User.js           # User account schema
    routes/
      admin.js          # Admin dashboard API
      auth.js           # Register, login, logout, current-user routes
      recipes.js        # Recipe list/search/filter/create/edit/delete/favorite routes
    db.js               # MongoDB connection
  .env.example          # Local environment variable template
  package.json          # App dependencies and scripts
  server.js             # Express server entry point
  vercel.json           # Vercel routing config
```

## MongoDB Recipe Document Shape

Recipes are saved as MongoDB documents through Mongoose:

```js
{
  title: "Grandma's Sunday Sauce",
  description: "Slow-simmered and perfect for Sunday dinner.",
  ingredients: [{ text: "2 cans crushed tomatoes" }],
  steps: [{ text: "Simmer gently for 2 hours." }],
  tags: ["dinner", "italian", "family-favorite"],
  mealType: "dinner",
  difficulty: "easy",
  prepMinutes: 15,
  cookMinutes: 120,
  servings: 8,
  imageUrl: "https://example.com/sauce.jpg",
  familyStory: "Served every Sunday after church.",
  sourceName: "Grandma",
  status: "published",
  favorites: [ObjectId("...")],
  createdBy: ObjectId("..."),
  createdAt: Date,
  updatedAt: Date
}
```

The schema is intentionally flexible: ingredients and steps are arrays of small embedded documents, tags are normalized strings, favorites are user references, and `createdBy` links recipes to the MongoDB user document that submitted them.

## Run Locally

1. Install Node.js 20+ and MongoDB.
2. Start MongoDB locally.
3. Install dependencies:

   ```powershell
   npm.cmd install
   ```

   On Windows PowerShell, use `npm.cmd` if `npm` is blocked by the script execution policy.

4. Create your environment file:

   ```powershell
   copy .env.example .env
   ```

5. Update `.env` if needed:

   ```text
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/family_cookbook
   JWT_SECRET=replace-this-with-a-long-random-secret
   ```

6. Start the app:

   ```powershell
   npm.cmd run dev
   ```

7. Open `http://localhost:3000`.

## Fix MongoDB Atlas Connection Errors

If you see this:

```text
querySrv ECONNREFUSED _mongodb._tcp.cluster0.example.mongodb.net
```

Node could not resolve the MongoDB Atlas SRV DNS record. Try these fixes:

- Rotate the database user password if the URI was ever shared or committed.
- In Atlas, go to Network Access and add your current IP address, or use `0.0.0.0/0` for a quick test before tightening it.
- Make sure your connection string includes a database name:

  ```text
  mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/family_cookbook?retryWrites=true&w=majority
  ```

- If your network blocks SRV DNS lookups, use Atlas's standard connection string instead of the `mongodb+srv://...` string. Atlas shows this under driver connection options.
- For local development without Atlas, run MongoDB locally and use:

  ```text
  MONGODB_URI=mongodb://127.0.0.1:27017/family_cookbook
  ```

## Deploy on Vercel

This project is ready for Vercel. The frontend is served from `public/`, and the Express API runs through `api/index.js` as a serverless function.

For a public deployed site, use MongoDB Atlas or another remotely accessible MongoDB deployment. Vercel cannot connect to your local `mongodb://127.0.0.1:27017/...` database.

1. Push this project to GitHub.
2. Create a MongoDB Atlas cluster and copy its connection string.
3. In Vercel, import the GitHub repository.
4. Add these environment variables in Vercel Project Settings:

   ```text
   MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/family_cookbook?retryWrites=true&w=majority
   JWT_SECRET=use-a-long-random-secret-here
   ```

5. Deploy. Vercel will install dependencies from `package.json` and route `/api/*` requests to the serverless API.

The same login and recipe features work locally and on Vercel because the browser calls same-origin `/api/...` endpoints.

---


## 🐛 Known Issues & Security Tracking

We maintain full transparency regarding active tracking items within our development pipeline. Below are the current critical anomalies identified within the repository:

> [!CAUTION]
> ### ⚠️ Authentication Engine: Account Creation Manipulation
> * **Vulnerability ID:** DSL-2026-VULN-01
> * **Severity:** Critical / High Risk
> * **Target Component:** User Onboarding & Registration Ingestion (`/api/auth/register`)
> 
> **Description:** A validation mismatch exists where client-side parameter tampering during local execution or layout manipulation can bypass standard registration constraints, potentially allowing unverified account generation.
> 
> **Current Status:** **Unmitigated.** This issue has no planned patch as of right now. 
> 
> **Architectural Note for Hybrid Deployments:** While this codebase is optimized for seamless, single-click deployment to Vercel via serverless functions, running a production-exposed instance without manual backend remediation is not recommended. If deploying publicly, ensure you implement robust server-side schema constraints or network-level rate limiting on authentication routes to mitigate exposure. Local-only (`localhost`) instances are structurally isolated but remain inherently unpatched.

---

> 📬 **Vulnerability Reporting:** To report a new security vulnerability or bug found within any DishShare Labs project, please do not open a public issue. Review our `SECURITY.md` file for instructions on secure, encrypted disclosure.

## API Overview

- `POST /api/auth/register` creates a user and logs them in.
- `POST /api/auth/login` logs in an existing user.
- `POST /api/auth/logout` clears the login cookie.
- `GET /api/auth/me` returns the current logged-in user.
- `GET /api/recipes?q=&tag=` lists recipes, with optional search and tag filter.
- `POST /api/recipes` creates a recipe. Login required.
- `PUT /api/recipes/:id` updates a recipe owned by the user or any recipe for admins.
- `DELETE /api/recipes/:id` deletes a recipe owned by the user or any recipe for admins.
- `POST /api/recipes/:id/favorite` toggles favorite status.
- `GET /api/admin/summary` returns admin stats and recent recipes. Admin required.
- `GET /api/admin/users` lists users. Admin required.
- `PATCH /api/admin/users/:id` changes user role/status. Admin required.
- `PATCH /api/admin/recipes/:id/status` changes recipe status. Admin required.
