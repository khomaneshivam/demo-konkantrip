require("dotenv").config();
const express = require("express");
const db = require("./src/config/db");
const registerUser = require("./src/routes/RegisterRoutes");

const app = express();

app.use(express.json());
app.get("/", (req, res) => {
    res.send("hello konan trip");
});

app.use("/register", registerUser);

app.listen(3000, (req,res) =>{
    console.log("server is running on port 3000")
})