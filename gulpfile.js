'use strict';
let gulp = require('gulp');
let connect = require('gulp-connect');

gulp.task('default', function () {
  console.log('gulp has run!');
});

gulp.task('connect', function () {
  connect.server({
     root: './',
     port: 8000,
     middleware: function (connect, opt) {
       return [
         function middleware(req, res, next) {
           // urls to respond to
           let urls = {
             '/response.json': __dirname + '/chapter8/response.json',
             '/signin': __dirname + '/chapter8/loginresponse.json',
             '/get_request': __dirname + '/chapter8/getresponse.json',
             '/get_request?test_data': __dirname + '/chapter8/getresponse.json',
             '/create_account': __dirname + '/chapter8/createaccount.json'
           };
           let match = false;

           function respond(jsonFileUrl) {
             // set json response header
             res.setHeader('Content-type', 'application/json');
             jsonfile.readFile(jsonFileUrl, function (err, obj) {
               if (err) { console.log(err); }

               res.writeHead(200, { 'Connection': 'close',
                 'Access-Control-Allow-Origin': '*' });

               // stringify json from .json file
               res.end(JSON.stringify(obj));
             });
           }

           if (req.url === '/upload') {
             let busboy = new Busboy({ headers: req.headers });

             busboy.on('file', function (fieldname, file, filename,
                                         encoding, mimetype) {
               let destinationFile = path.join(__dirname + '/uploadedFiles',
                 '/', filename);

               if (fs.existsSync(destinationFile)) {
                 // delete file if it exists
                 fs.unlinkSync(destinationFile);
               }

               // create uploaded file in filesystem
               file.pipe(fs.createWriteStream(destinationFile));
             });

             busboy.on('finish', function () {
               match = true;
               respond(__dirname + '/chapter8/uploadresponse.json');
             });

             return req.pipe(busboy);
           }

           Object.keys(urls).forEach(function (url) {
             if (req.url === url) {
               match = true;
               respond(urls[url]);
             }
           });

           if (!match) {
             next();
           }
         }
       ];
     }
   });
});