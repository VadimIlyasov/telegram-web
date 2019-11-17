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
        telegramApi.sendCode(phoneNumber).then(function(sentCode) {
            window.phone_code_hash = sentCode.phone_code_hash;
        
            if (!sentCode.phone_registered) {
                // New user
                console.log('dddd');
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

    getDialogs(params, callback) {
        telegramApi.invokeApi('messages.getDialogs', params).then(function(dialogResult) {
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
    
    getFile(photo, callback, errorCallback) {
        let locationData = {
            _:'inputFileLocation',
            local_id: photo.local_id,
            secret: photo.secret,
            volume_id: photo.volume_id
        };

        telegramApi.invokeApi('upload.getFile', {
            location: locationData
        }).then(callback, errorCallback);
    }

    getHistory(data, type, callback) {
        let params = this.preparePeer(type, data);

        let filters = {peer: params};

        if (data.limit) {
            filters.limit = data.limit;
        }

        if (data.max_id) {
            filters.offset_id = data.max_id;
            filters.add_offset = 0;
        }

        telegramApi.invokeApi('messages.getHistory', filters).then(function (res) {
            console.log(res);
            callback(res);
        });
    }

    preparePeer(type, data) {
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

        return params;
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

    sendMessage(peer, message, callback) {
        telegramApi.invokeApi('messages.sendMessage', {
            peer: peer,
            message: message,
            random_id: [this.randomID(),this.randomID()]
        }).then(function (data) {
            callback(data);
        });
    }

    randomID() {
        let min = 0;
        let max = 500000000000;//Number.MAX_VALUE;
        return Math.floor(Math.random() * (max - min)) + min;
    }

    getExternalUserInfo(user_id, access_hash, callback) {
        let userInfo = {
            user_id: user_id,
            access_hash: access_hash,
            _:'inputUser'
        };

        telegramApi.invokeApi('users.getFullUser', {id: userInfo}).then(function(data) {
            callback(data);
        });
    }

    getPhotos(data, type, callback) {
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

        filters.limit = 10;
        filters.filter = {_:'inputMessagesFilterPhotos'};

        telegramApi.invokeApi('messages.search', filters).then(function(data) {
            callback(data);
        });
    }

    checkPassword(password, callback, errorCallback) {
        let app = new App();

        telegramApi.invokeApi('auth.checkPassword', {password: password}, function (res) {
            app.setCookie('userHash', CryptoJS.SHA256(localStorage.getItem('code')).toString());
            delete window.phone_code_hash;

            callback(res);
        }, function (err) {
            errorCallback(err);
        });
    }

    readHistory(data, maxId) {
        let params = this.preparePeer(data.type, data);

        telegramApi.invokeApi('messages.readHistory', {peer: params, max_id: maxId}, function (res) {
            console.log(res);
        });
    }
}