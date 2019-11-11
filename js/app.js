import TelegramAPI from "./telegram.js";

export default class App {
    bootstrap(callback) {
        let telegram = new TelegramAPI();
        telegram.initialize();

        if (typeof callback === 'function') {
            callback();
        }
    }

    loadJsFile(filename, filepath, type) {
        let el = $('<script/>', {
            type: type || "text/javascript",
            src: filepath + filename,
        });

        $('head').append(el);
    }
}