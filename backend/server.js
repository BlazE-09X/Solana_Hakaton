import express from "express";
import cors from "cors";
import { exec } from "child_process";

const app = express();
app.use(cors());

app.get("/buy", (req, res) => {
  exec("node backend/send-token.js", (error, stdout, stderr) => {
    if (error) {
      console.error(stderr);
      return res.status(500).send("Transaction failed");
    }
    res.send(stdout);
  });
});

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});