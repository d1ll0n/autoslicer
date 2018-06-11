var express = require("express"),
  http = require("http"),
  formidable = require("formidable"),
  fs = require("fs"),
  path = require("path"),
  bodyParser = require("body-parser");

const { exec } = require("child_process");

var app = express();
const uploadDir = path.join(__dirname, "/uploads/");

app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/public/index.html");
});
app.post("/upload", uploadMedia);

app.get("/slice/:fileName.:ext", sliceFile);

function uploadMedia(req, res, next) {
  var form = new formidable.IncomingForm();
  form.multiples = true;
  form.keepExtensions = true;
  form.uploadDir = uploadDir;
  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({ error: err });
  });
  form.on("fileBegin", function(name, file) {
    const [fileName, fileExt] = file.name.split(".");
    if (fileExt !== 'stl') return res.status(500).json({ error: 'Only stl files allowed' });
    const newName = `${fileName}_${new Date().getTime()}.${fileExt}`;
    res.status(200).json({ uploaded: true, fileName: newName });
    file.path = path.join(uploadDir, newName);
  });
}

function sliceFile(req, res) {
  // manual.slic3r.org/advanced/command-line
  var [fileName, ext] = [req.params.fileName, req.params.ext];
  if (ext !== "stl") return res.status(500).json({ error: 'Only stl files allowed' });
  var filePath = `${__dirname}/uploads/${fileName}.${ext}`;
  // add cli options
  exec("slic3r "+filePath, (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}

app.listen(3000, () => console.log("listening on port 3000"));
