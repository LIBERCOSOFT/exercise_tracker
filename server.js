const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const config = require("config");
const shortId = require("shortid");

//connection to mongodb
const db = config.get("MONGO_URI");
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log("Connected to database!!"))
  .catch(err => console.log("There was an error " + err));

//building a schema for new users
let Schema = mongoose.Schema;

let creatingUserSchema = new Schema({
  username: mongoose.Mixed,
  user_id: mongoose.Mixed
});

let creatingUserModel = mongoose.model("creatingUserModel", creatingUserSchema);

//buidling a schema for my user's input
let userSchema = new Schema({
  username: mongoose.Mixed,
  description: mongoose.Mixed,
  duration: Number,
  user_id: mongoose.Mixed,
  date: mongoose.Mixed
});

let userModel = mongoose.model("userModel", userSchema);

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//creating and saving a new username request and response
app.post("/api/exercise/new-user", function(req, res) {
  let username = req.body.username;
  creatingUserModel.findOne({ username: username }, function(err, data) {
    if (err) {
      throw err;
    }
    if (data) {
      res.send("Username taken");
    } else {
      let newUser = { username: username, user_id: shortId.generate() };
      res.json(newUser);
      let newUserDetails = new creatingUserModel(newUser);
      newUserDetails
        .save()
        .then(item => console.log(item, "Saved to database!!"));
    }
  });
});

//printing all the users in my database
app.get("/api/exercise/users", function(req, res) {
  creatingUserModel.find({ __v: 0 }, function(err, data) {
    if (err) {
      throw err;
    }
    res.send(data);
  });
  console.log("All users printed!!");
});

//adding exercise through users's id
app.post("/api/exercise/add", function(req, res) {
  let userId = req.body.userId;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;

  if (date !== "") {
    date = new Date(date).toUTCString();
  } else {
    date = new Date().toUTCString();
  }

  creatingUserModel.findOne({ user_id: userId }, function(err, data) {
    if (data) {
      let userData = {
        username: data.username,
        description: description,
        duration: duration,
        user_id: userId,
        date: date
      };
      res.send(userData);
      let newUserLog = new userModel(userData);
      newUserLog
        .save()
        .then(item => console.log(item, "New user's log saved successfully!!"));
    } else {
      res.send({ error: "unknown_id" });
    }
  });
});

//getting a user's exercise log
app.get("/api/exercise/log/:user_id?", function(req, res) {
  let path = req.path;
  let splitting = path.split("/");
  let userId = splitting[4];

  userModel.find({ user_id: userId }, function(err, data) {
    if (data) {
      res.send(data);
      console.log(data, "All user id's log printed successfully!!");
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
