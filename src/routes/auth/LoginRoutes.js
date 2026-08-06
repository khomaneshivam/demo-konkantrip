const express = require("express");
const router = express.Router();

const { loginUser } = require("../../controller/auth/login");

/**
 * @openapi
 * /login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login a property owner with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/", loginUser);

module.exports = router;
