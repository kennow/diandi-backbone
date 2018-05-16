var createError = require('http-errors');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var shoppingRouter = require('./routes/shopping.route');
var userRouter = require('./routes/user.route');
/**
 * The app object has methods for
 * Routing HTTP requests; see for example, app.METHOD and app.param.
 *      -   Configuring middleware; see app.route.
 *      -   Rendering HTML views; see app.render.
 *      -   Registering a template engine; see app.engine.
 */
var app = express();
/**
 * The view argument is a string that is the file path of the view file to render.
 *      -   This can be an absolute path, or a path relative to the views setting.
 * If the path does not contain a file extension, then the view engine setting determines the file extension.
 */
// view engine setup
app.set('views', path.join(__dirname, 'views'));
/**
 *  A template engine enables you to use static template files in your application.
 */
app.set('view engine', 'pug');
/**
 *
 *          app.use([path,] callback [, callback...])
 *
 * Mounts the specified middleware function or functions at the specified path:
 * The middleware function is executed when the base of the requested path matches path.
 */
/**
 * Since path defaults to “/”, middleware mounted without a path will be executed for every request to the app.
 * For example, this middleware function will be executed for every request to the app
 */
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.use(logger('dev'));
/**
 *          body-parser
 *
 * Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
 * The bodyParser object exposes various factories to create middlewares.
 * All middlewares will populate the req.body property with the parsed body when the Content-Type request header matches the type option,
 * or an empty object ({}) if there was no body to parse, the Content-Type was not matched, or an error occurred.
 *
 *          bodyParser.json([options])
 *
 * Returns middleware that only parses json and only looks at requests where the Content-Type header matches the type option.
 *
 *          bodyParser.raw([options])
 *
 * Returns middleware that parses all bodies as a Buffer
 *
 *          bodyParser.text([options])
 *
 * Returns middleware that parses all bodies as a string
 *
 *          bodyParser.urlencoded([options])
 *
 * Returns middleware that only parses urlencoded bodies
 */
require('body-parser-xml')(bodyParser);
// app.use(express.json());
app.use(bodyParser.xml({
    limit: '1MB',               // Reject payload bigger than 1 MB
    xmlParseOptions: {
        normalize: true,        // Trim whitespace inside text nodes
        normalizeTags: true,    // Transform tags to lowercase
        explicitArray: false    // Only put nodes in array if >1
    }
}));
app.use(bodyParser.json());
app.use(express.urlencoded({extended: false}));
/**
 *          cookie-parser
 *
 * Parse Cookie header and populate req.cookies with an object keyed by the cookie names.
 */
app.use(cookieParser());
/**
 *          express.static
 *
 * It serves static files and is based on serve-static.
 * To serve static files such as images, CSS files, and JavaScript files, use the express.static built-in middleware function.
 * --    app.use(express.static('public'))  // Now, you can load the files that are in the public directory:
 * Or specify a mount path for the static directory, as shown below:
 * --    app.use('/static', express.static('public'))
 * If you run the express app from another directory, it’s safer to use the absolute path of the directory that you want to serve:
 * --    app.use('/static', express.static(path.join(__dirname, 'public')))
 */
app.use(express.static(path.join(__dirname, 'public')));
/**
 * Middleware functions are executed sequentially, therefore the order of middleware inclusion is important.
 */
app.use('/shopping', shoppingRouter);
app.use('/user', userRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
// Error-handling middleware always takes four arguments
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
