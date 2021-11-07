const express = require("express");
const path = require("path");
const fs = require("fs");
const https = require("https");
const app = express();
require("dotenv").config();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static("./public"));
app.use(express.json());
const { auth, requiresAuth } = require("express-openid-connect");
const exp = require("constants");
app.use(
  auth({
    authRequired: false,
    auth0Logout: true,
    issuerBaseURL: process.env.ISSUER_BASE_URL,
    baseURL: process.env.BASE_URL,
    clientID: process.env.CLIENT_ID,
    secret: process.env.SECRET,
  })
);

var userInfo = [
  { name: "Marko1", lat: 45.8227, lon: 16.0726, time: "4:53:47 PM", status: 0 },
  { name: "Jana2", lat: 45.9, lon: 16.023, time: "6:24:12 PM", status: 0 },
  { name: "Ivan3", lat: 45.7, lon: 16.06, time: "5:43:22 PM", status: 0 },
  { name: "Pero4", lat: 45.7, lon: 16.05, time: "11:57:32 AM", status: 0 },
  { name: "Darko5", lat: 45.504, lon: 16.101, time: "10:53:23 AM", status: 0 },
];

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  var stat = req.oidc.isAuthenticated();
  if (!stat) {
    res.render("index");
  } else {
    res.render("users");
  }
});

app.post("/", requiresAuth(), (req, res) => {
  let user = req.oidc.user.name;
  var found = false;
  const insertUser = {
    name: user,
    lat: req.body.lat,
    lon: req.body.lon,
    time: req.body.entryTime,
    status: 1,
  };
  for (u in userInfo) {
    check = userInfo[u];
    if (check.name === user && check.status === 0) {
      //console.log(userInfo);
      userInfo.splice(u, 1);
      userInfo.push(insertUser);
      //console.log(userInfo);
      found = true;
      break;
    } else if (check.name === user && check.status === 1) {
      //console.log("Found");
      found = true;
      break;
    }
  }
  if (found === false) {
    //console.log("Add");
    userInfo.push(insertUser);
  }
  res.json({
    status: "success",
    userInfo: userInfo,
    skip: user,
  });
});

app.get("/my-logout", (req, res) => {
  let user = req.oidc.user.name;
  //console.log("Logout");
  for (u in userInfo) {
    check = userInfo[u];
    if (check.name === user) {
      userInfo[u].status = 0;
      break;
    }
  }
  res.oidc.logout({ returnTo: "/" });
});

https
  .createServer(
    {
      key: fs.readFileSync("./server.key"),
      cert: fs.readFileSync("./server.cert"),
    },
    app
  )
  .listen(port, () => {
    console.log(`Server running at https://localhost:${port}/`);
  });
