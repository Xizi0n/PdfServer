const express = require("express");
const multer = require("multer");
const uuid = require("uuid/v4");
const path = require("path");
const bodyParser = require("body-parser");
const isAuth = require("./middleware/isAuth");
const adminOrTeacher = require("./middleware/AdminOrTeacher");
const mongoose = require("mongoose");
const Lesson = require("./models/lesson");

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "pdf");
  },
  filename: (req, file, cb) => {
    console.log(file.originalname.split(".")[1]);
    const name = uuid() + "." + file.originalname.split(".")[1];
    cb(null, name);
    console.log("i run after callback", name);
  }
});

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

//app.use("/pdf", express.static(path.join(__dirname, "pdf")));

app.use(multer({ storage: pdfStorage, fileFilter: pdfFilter }).single("pdf"));

app.post("/uploadPdf", isAuth, adminOrTeacher, (req, res, next) => {
  console.log("file:", req.file);
  console.log(req.body);
  Lesson.findOne({ _id: req.body.lessonId })
    .then(lesson => {
      lesson.files.push({
        name: req.file.filename,
        title: req.body.name
      });
      return lesson.save();
    })
    .then(result => {
      console.log(result);
      res.status(200).json({ message: "Sucessful upload" });
    })
    .catch(err => console.log(err));
});

app.get("/pdf/:fileName", isAuth, (req, res, next) => {
  const name = req.query.name;
  console.log(name);
  /* res.setHeader("Content-Disposition", `attachment; filename=${name}`);
  res.setHeader("Content-Type", "application/pdf");
  console.log(req.params.fileName);
  res.sendFile(); */
  res.download(path.join(__dirname, "pdf", req.params.fileName));
});

mongoose
  .connect(
    "mongodb+srv://adam:GKLCVf35uvgx3Bev@cluster0-p72yj.mongodb.net/tudastar"
  )
  .then(() => {
    app.listen(4003, () => {
      console.log("PdfServer runnning");
    });
  })
  .catch(err => {
    console.log(err);
  });
