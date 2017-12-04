'use strict';
let gulp = require('gulp');
let connect = require('gulp-connect');
let minifyCss = require('gulp-clean-css');
let uglifyJs = require('gulp-uglify-es').default;
let rename = require('gulp-rename');

function handleError(error) {
  console.log(error.toString());
  process.exit(1);
}

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

gulp.task('minify-css', function () {
  return gulp.src('app/styles.css')
    .pipe(minifyCss()).on('error', handleError)
    .pipe(rename('styles.min.css'))
    .pipe(gulp.dest('app'));
});

gulp.task('minify-js', function () {
  return gulp.src('app/script.js')
    .pipe(uglifyJs()).on('error', handleError)
    .pipe(rename('script.min.js'))
    .pipe(gulp.dest('app'));
});