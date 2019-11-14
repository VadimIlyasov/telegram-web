import config from './config.js';
import App from './app.js';

export default class TelegramAPI {
    initialize() {
        telegramApi.setConfig({
            app: {
                id: config.api_id,
                hash: config.api_hash,
                version: config.version
            },
            server: {
                test: [
                    {
                        id: config.test_dc_id,
                        host: config.test_host,
                        port: config.test_port
                    }
                ],
                production: [
                    {
                        id: config.prod_dc_id,
                        host: config.prod_host,
                        port: config.prod_port
                    }
                ]
            }
        });
    }

    sendCode(phoneNumber, callback) {
        // let sentCode = {
        //     is_password: false,
        //     phone_code_hash: "5c4ea02f9f0ff0b0e5",
        //     phone_registered: true,
        //     send_call_timeout: 3600
        // };

        // callback(sentCode);
        telegramApi.sendCode(phoneNumber).then(function(sentCode) {
            window.phone_code_hash = sentCode.phone_code_hash;
        
            if (!sentCode.phone_registered) {
                // New user
            } else {
                if (typeof callback === 'function') {
                    callback(sentCode);
                }
            }
        });
    }

    signIn(phoneNumber, code, callback, errorCallback) {
        localStorage.setItem('code', code);

        let app = new App();
        // let err = {
        //     code: 400,
        //     description: "CODE#400 PHONE_CODE_INVALID",
        //     handled: true,
        //     input: "auth.signIn",
        //     type: "PHONE_CODE_INVALID"
        // };

        // app.setCookie('userHash', CryptoJS.SHA256(code).toString());
        // callback();
        telegramApi.signIn(phoneNumber, window.phone_code_hash, code).then(function() {
            delete window.phone_code_hash;
        
            app.setCookie('userHash', CryptoJS.SHA256(code).toString());
            if (typeof callback === 'function') {
                callback();
            }
        }, function(err) {
            if (typeof errorCallback === 'function') {
                errorCallback(err);
            }
        });
    }

    twoFactorAuth() {

    }

    signUp(phoneNumber, code, data, callback) {
        let firstName = data.firstName;
        let lastName = data.lastName || '';

        telegramApi.signUp(phoneNumber, window.phone_code_hash, code, firstName, lastName).then(function() {
            // Sign up complete
            delete window.phone_code_hash;
        });
    }

    getDialogs(callback) {
        telegramApi.invokeApi('messages.getDialogs', {
            offset_peer: {_: 'inputPeerEmpty'},
            offset_date: 0,
            limit: 20
        }).then(function(dialogResult) {
            if (typeof callback === 'function') {
                callback(dialogResult);
            }
        });
    }

    getUserPhotos(user, callback) {
        let userId = {
            _: user.type,
            user_id: user.id,
            access_hash: user.access_hash
        };

        telegramApi.invokeApi('photos.getUserPhotos', {
            user_id: userId
        }).then(function(res) {
            if (typeof callback === 'function') {
                callback(res);
            }
        });
    }
    
    getAvatar(user, callback) {
        this.getUserPhotos(user, function (data) {
            if (data && typeof data.photos[0] !== 'undefined') {
                let photo = data.photos[0].sizes[0].location;
                let locationData = {
                    _:'inputFileLocation',
                    local_id: photo.local_id,
                    secret: photo.secret,
                    volume_id: photo.volume_id
                };

                telegramApi.invokeApi('upload.getFile', {
                    location: locationData
                }).then(function (res) {
                    callback(res);
                })
            } else {
                callback(data);
            }
        });
    }
}