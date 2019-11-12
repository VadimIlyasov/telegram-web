import App from './modules/app.js';
import config from './modules/config.js';

$(document).ready(function () {
    const app = new App();

    (new Promise(function (resolve, reject) {
        app.bootstrap(function () {
            return resolve();
        });
    }))
        .then(function () {
            $(window).bind( 'hashchange', function() {
                let body = $('body');

                switch (location.hash) {
                    case '#chat':
                        body.removeAttr('class');
                        body.addClass('webogram chat-page');
                        body.load('./chat.html', function () {});
                        app.loadJsFile('chat.js', config.load_modules_path, 'module');
                        break;
                    default:
                        break;
                }
            });
        })
        .then(function () {
            if (app.getCookie('userHash') === CryptoJS.SHA256(localStorage.code).toString()) {
                window.location.hash = '#chat';
            } else {
                app.loadJsFile('login.js', config.load_modules_path, 'module');
            }
        })
        .then(function () {
            $.each(config.load_modules_list, function (index, filename) {
                app.loadJsFile(filename, config.load_modules_path, 'module');
            });
        })
        .then(function () {
            $.each(config.load_extensions_list, function (index, filename) {
                app.loadJsFile(filename, config.load_extensions_path);
            });
        })
        .then((resolve) => {
            $.each(config.load_file_list, function (index, filename) {
                app.loadJsFile(filename, config.load_file_path);
            });
        })
        .then(function () {
            $(window).trigger('hashchange');
        });
});