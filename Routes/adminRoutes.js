const express = require("express");
const { createAdmin, getAllAdmins, loginAdmin } = require("../Controllers/AdminController");

const AdminRouter = express.Router();

AdminRouter.post("/", createAdmin);
AdminRouter.get("/", getAllAdmins);
AdminRouter.post("/login", loginAdmin);

module.exports = AdminRouter;