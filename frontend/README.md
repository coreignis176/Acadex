# Acadex frontend

React 19 + Vite 6 + Redux Toolkit (RTK Query) + Tailwind CSS 4, same structure as the PetCare project.
It talks to the Express backend in `../backend` (see `../backend/README.md` for every API route).

## Run

Start the backend first (`cd ../backend && npm run dev`, port 9999), then:

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build -> dist/
npm run lint
```

The backend address comes from `VITE_BACKEND_URL` (optional `.env` file in this folder).
Without it the app uses `http://localhost:9999`. When deployed, set it to the backend's public URL,
and set `FRONTEND_URL` in the backend's `.env` to this site's URL so the backend allows it.

## Logging in

There is no sign-up page: the admin registers every student.

| Who | Logs in with |
| --- | --- |
| Admin | email + password (created once on the backend with `npm run createadmin`) |
| Student | college roll number + the default student password, then must choose their own password |
| CR | a student the admin appointed, after they confirm it in their notifications |

Forgotten student passwords: Admin → Academic Structure → section → student → **Reset password**.

## Folder map

```
src/
  main.jsx, App.jsx, index.css      start-up, routes, colours and fonts (@theme)
  store/Store.jsx                   the Redux store (the logged-in user is saved with redux-persist)
  store/slice/UserSlice.jsx         logged-in user, login modal
  store/slice/PortalSlice.jsx       portal popups + mobile sidebar
  store/Api/Api.jsx                 every backend URL + RTK Query hooks
  data/courses.js                   the courses Acadex supports
  utils/                            csv, note pages (Cloudinary links), formatting and subject helpers
  components/                       Navbar, AuthPage, ChangePassword, Footer, Loader, NoData, Modal,
                                    NotesBrowser, NoteRow, NotePopup, NoteDetails, NotificationList...
  components/portal/                PortalLayout (role guard), Sidebar, Topbar, portalLinks
  pages/home, pages/about           public pages (each section is its own component)
  pages/admin                       dashboard, academic structure, section students, students, CRs
  pages/cr                          dashboard, notes, approvals, section
  pages/student                     all notes, upload notes
  pages/common/Notifications.jsx    shared by all three portals
  pages/NotFound.jsx                404 page
```

File names: components and pages are PascalCase (`NoData.jsx`); data and helper modules are camelCase (`homeData.js`, `notePages.js`).

Deploy: Vercel (`vercel.json` sends every URL to the app so page refreshes work).
