const fs = require("fs")
const http = require("http");
const prompt = require("prompt-sync")();
const formidable = require("formidable");
const cliProgress = require("cli-progress")

const PORT = process.env.PORT || 9876;
const SAVEPATH = process.env.SAVEPATH || "./" ;

http.createServer(async (req, res) => {
    switch (decodeURIComponent(req.url).split("|")[0]) {
        case "/upload":
            console.clear();
            console.log("Incoming File Transfer!");
            let acceptFile = await prompt(`Accept incoming file "${decodeURIComponent(req.url).split("|")[1]}"? [Y/n] `);

            if ((acceptFile.toLowerCase() !== "y") && (acceptFile.length > 0)) {
                console.log("File rejected")
                res.writeHead(403, { 'Content-Type': 'text/html' })
                res.write("Upload rejected by host");
                res.end();
                return;
            }

            let form = new formidable.IncomingForm({ maxFileSize: 1024 * 1024 * 1024});
            var bar = new cliProgress.SingleBar({etaBuffer: 64, fps: 1, format: '[{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'}, cliProgress.Presets.legacy)
            bar.start(100, 0);
            form.on("progress", (d, m) => {
                bar.setTotal(m)
                bar.update(d)
            })
            form.parse(req, async (err, fields, files) => {
                bar.stop();
                var oldpath = files.file.filepath;
                var newpath = SAVEPATH + files.file.originalFilename;
                fs.cp(oldpath, newpath, async err => {
                    if (err) throw err;
                    console.log(`File received! Saved to ${newpath}`)
                    res.writeHead(200, { 'Content-Type': 'text/html' })
                    res.write("Uploaded");
                    res.end();
                })
            })

            break;

        default:
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.write(html)
            res.end()
    }
}).listen(PORT)

console.clear();
console.info("Running on port " + PORT)

var os = require('os');

var interfaces = os.networkInterfaces();
var addresses = [];
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
        }
    }
}

addresses.forEach(address => {
    console.info(`${addresses.indexOf(address)}: http://${address}:${PORT}`)
})

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            font-family: Arial, Helvetica, sans-serif;
        }
    </style>
    <title>Local File Upload</title>
</head>
<body>
    <center>
        <h1>Local File Transfer</h1>
        Select a file below and click submit query to upload.
        <br>
        <br>
        <form id="form" action="upload" method="post" enctype="multipart/form-data">
            <input id="file" type="file" name="file" required onchange="setAction()">
            <br>
            <br>
            <input type="submit">
        </form>
        <br>
        <br>
        LFT v0.0.1
    </center>
    <script>
        setAction()
        function setAction() {
            document.getElementById("form").setAttribute("action", "upload|" + document.getElementById("file").files[0].name)
        }
    </script>
</body>
</html>
`