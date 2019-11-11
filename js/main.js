import App from './app.js';
import config from './config.js';

$(document).ready(function () {
    const app = new App();

    (new Promise(function (resolve, reject) {
        app.bootstrap(function () {
            return resolve();
        });
    })).then((resolve) => {
        $.each(config.load_file_list, function (index, filename) {
            app.loadJsFile(filename, config.load_file_path);
        });
    });
});