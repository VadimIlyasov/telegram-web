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
            app.setCookie('userHash', CryptoJS.SHA256(code).toString());
            delete window.phone_code_hash;

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
    
    getAvatar(photo, callback) {
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
        });
    }

    getHistory(data, type, callback) {
        let params = {};

        switch (type) {
            case 'user':
                params._ = 'inputPeerUser';
                params.user_id = data.id;
                params.access_hash = data.access_hash;
                break;
            case 'chat':
                params._ = 'inputPeerChat';
                params.chat_id = data.id;
                break;
            case 'channel':
                params._ = 'inputPeerChannel';
                params.channel_id = data.id;
                params.access_hash = data.access_hash;
                break;
        }

        let filters = {peer: params};

        if (data.max_id) {
            filters.max_id = data.max_id;
        }

        if (data.limit) {
            filters.limit = data.limit;
        }

        telegramApi.invokeApi('messages.getHistory', filters).then(function (res) {
            console.log(res);
            callback(res);
        });
    }

    getMessages(ids, callback) {
        telegramApi.invokeApi('messages.getMessages', {id: ids}).then(function (res) {
            callback(res);
        });
    }

    getChannelMessages(channel, ids, callback) {
        telegramApi.invokeApi('channels.getMessages', {channel: channel, id: ids}).then(function (res) {
            callback(res);
        });
    }

    getUserInfo(callback) {
        telegramApi.getUserInfo().then(function(user) {
            callback(user);
        });
    }

    getUserById(id, access_hash, callback) {
        let userInput =  {
            user_id: id,
            access_hash: access_hash,
            _: 'inputUser'
        };

        telegramApi.invokeApi('users.getUsers', {id: [userInput]}).then(function (info) {
            let res = {};

            if (info.length) {
                res = info[0];
            }

            callback(res);
        });
    }

    getChatById(id, access_hash, callback) {
        let channelInput =  {
            channel_id: id,
            access_hash: access_hash,
            _: 'inputChannel'
        };

        telegramApi.invokeApi('channels.getChannels', {id: [channelInput]}).then(function (info) {
            let res = {};

            if (info.length) {
                res = info[0];
            }

            callback(res);
        });
    }

    subscribe(callback) {
        telegramApi.subscribe('katanagram', callback);
    }
}