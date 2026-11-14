# Acadex backend

Express 5 + MongoDB (Mongoose) + Cloudinary, written in the same style as the PetCare backend.

## Run

```bash
npm install
# fill in .env (see .env.example)
npm run createadmin   # once: creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev           # http://localhost:9999  ->  "api working"
```

`.env` keys: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `DEFAULT_STUDENT_PASSWORD`,
`ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET_KEY`.

## How requests work

* Login sets an httpOnly cookie `userToken` (2 days). Send requests with `credentials: "include"`.
* Every reply is `{ success , message , data }`.
* Status codes: `400` wrong input, `401` not logged in, `403` not allowed, `404` not found,
  `422` CSV rows need fixing (`data.errors = [{row , message}]`), `501` server error.
* New students (and students whose password the admin reset) get `mustChangePassword: true`.
  Until they call `/user/changepassword`, every other route answers `403` with
  `data.mustChangePassword = true`, except `/user/getme`.

## Routes

| Method | URL | Who | Body / params |
|---|---|---|---|
| POST | /user/login | anyone | `identifier , password , role` ("admin" / "student" / "cr") |
| POST | /user/logout | anyone | |
| GET | /user/getme | logged in | |
| POST | /user/changepassword | logged in | `oldPassword , newPassword` |
| POST | /student/respondcr | student | `accept` (true / false) |
| GET | /admin/getadminstats | admin | |
| GET | /admin/getstructure | admin | |
| POST | /admin/addsection | admin | `courseId , year , name , students:[{row , name , classRollNo , collegeRollNo}]` |
| POST | /admin/renamesection | admin | `sectionId , name` |
| POST | /admin/archivesection | admin | `sectionId , archived` |
| GET | /admin/getsection/:id | admin | section id in the URL |
| POST | /admin/addstudent | admin | `sectionId , name , classRollNo , rollNo` |
| POST | /admin/updatestudent | admin | `studentId , name , classRollNo , collegeRollNo` |
| POST | /admin/removestudent | admin | `studentId` |
| GET | /admin/getallstudents | admin | |
| POST | /admin/resetpassword | admin | `studentId` |
| POST | /admin/selectcr | admin | `studentId` |
| POST | /admin/removecr | admin | `studentId` |
| POST | /admin/addsubject | admin | `sectionId , name , code` |
| POST | /admin/updatesubject | admin | `sectionId , subjectId , name , code` |
| POST | /admin/removesubject | admin | `sectionId , subjectId` |
| POST | /admin/copysubjects | admin | `sectionId , fromSectionId` |
| GET | /notes/getsubjects | student | |
| GET | /notes/getsubjectlist | student | |
| GET | /notes/getnotes | student | |
| GET | /notes/getmysubmissions | student | |
| POST | /notes/submitnote | student | **form-data**: `title , subject , topic , description` + `pages` (1-30 images, 10 MB each, 60 MB total) |
| POST | /notes/reactnote | student | `noteId , type` ("like" / "dislike") |
| POST | /notes/viewnote | student | `noteId` - a note was opened, it goes on top of the Recently Viewed stack (C) |
| GET | /notes/getrecent | student | Recently Viewed notes, last opened first (C stack) |
| POST | /notes/clearrecent | student | empty the Recently Viewed history (C stack) |
| GET | /cr/getsectionnotes | active CR | |
| POST | /cr/reviewnote | active CR | `noteId , decision` ("approved" / "rejected") `, reason` |
| DELETE | /cr/deletenote/:id | active CR | note id in the URL |
| GET | /cr/getcrstats | active CR | |
| GET | /notification/getnotifications | logged in | |
| POST | /notification/markread | logged in | `id` (one) or nothing (all) |

Each note page is stored as `{url , publicId , name , type , size}`; show the image with `url`.

## Folders

```
index.js          middlewares, routes, JSON 404 + error handler, start
createAdmin.js    makes the first admin account
config/           Database.js (MongoDB), Cloudinary.js (upload / delete images)
middlewares/      validator.js (login + role checks), multer.js (page images)
modules/          User, Section, Note, Notification, Activity  (Mongoose models)
controllers/      User, admin, notes, cr, notification
routes/           one file per URL prefix
utils/            helpers.js, tokenGenerator.js
```
