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

    getCookie(name) {
        let matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    setCookie(name, value, options = {}) {
        options = {
            path: '/',
            expires: 36000
        };

        if (options.expires.toUTCString) {
            options.expires = options.expires.toUTCString();
        }

        let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

        for (let optionKey in options) {
            updatedCookie += "; " + optionKey;
            let optionValue = options[optionKey];
            if (optionValue !== true) {
                updatedCookie += "=" + optionValue;
            }
        }

        document.cookie = updatedCookie;
    }
}