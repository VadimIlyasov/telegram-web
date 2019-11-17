import TelegramAPI from "./telegram.js";
import App from "./app.js";

export default class Chat {
    constructor() {
        this.users = [];
        this.chats = [];
        this.dialogs = [];
        this.messages = [];
        this.user = {};
        this.photos = [];
        this.telegram = new TelegramAPI();


        this.accessHash = '';
        this.id = 0;
        this.type = '';
    }

    loadDialogs(max_id, callback) {
        let contactTpl = _.template($('#contact-tpl').html());
        let self = this;
        let params = {
            offset_peer: {_: 'inputPeerEmpty'},
            limit: 20
        };

        if (max_id) {
            params.max_id = max_id;
        }

        this.telegram.getDialogs(params,function (res) {
            let list = self.prepareDialogsList(res);

            let $contactsList = $('.contacts-list');
            let contactsHTML = '';
            let contactData = [];

            $.each(list.dialogs, function (id, el) {
                // let date = new Date(list.messages[el.top_message].date * 1000);
                let message = list.messages[el.top_message].message;

                if (el.peer.user_id) {
                    if (typeof list['users'][el.id] !== 'undefined') {
                        contactData = list['users'][el.id];
                        self.photos[el.id] = false;

                        if (contactData.photo && contactData.photo.photo_small !== undefined) {
                            self.photos[el.id] = contactData.photo.photo_small;
                        }

                        contactsHTML += contactTpl({
                            name: contactData.first_name + ( (contactData.last_name) ? (' '+contactData.last_name):''),
                            lastMessage: message,
                            time: self.getChatDate(list.messages[el.top_message].date), //date.getUTCHours().pad() + ':' + date.getMinutes().pad(),
                            counter: el.unread_count,
                            id: el.id,
                            type: contactData._,
                            access_hash: contactData.access_hash
                        });
                    }
                } else {
                    if (typeof list['chats'][el.id] !== 'undefined') {
                        contactData = list['chats'][el.id];
                        self.photos[el.id] = false;

                        if (contactData.photo && contactData.photo.photo_small !== undefined) {
                            self.photos[el.id] = contactData.photo.photo_small;
                        }

                        contactsHTML += contactTpl({
                            name: contactData.title,
                            lastMessage: message,
                            time: self.getChatDate(list.messages[el.top_message].date), //date.getUTCHours().pad() + ':' + date.getMinutes().pad(),
                            counter: el.unread_count,
                            id: el.id,
                            type: contactData._,
                            access_hash: contactData.access_hash
                        });
                    }
                }
            });

            $contactsList.append(contactsHTML);

            $('.contacts-list li').click(function () {
                $('.messages-list').empty();

                self.accessHash = $(this).data('access-hash');
                self.type = $(this).data('type');
                self.id = $(this).data('id');

                $('.contacts-list li').removeClass('selected');
                $(this).addClass('selected');

                let id = $(this).data('id'),
                    type = $(this).data('type'),
                    accessHash = $(this).data('access-hash');

                switch (type) {
                    case 'user':
                        self.telegram.getUserById(id, accessHash, function (info) {
                           self.renderTopChatInfo(info, id);
                        });

                        break;
                    case 'channel':
                    case 'chat':
                        self.renderTopChatInfo({}, id);

                        break;
                }

                self.loadDialogMessages(id, type, accessHash, 50);
            });

            self.loadAvatars();
        });
    }

    prepareDialogsList(data) {
        let list = {
            'dialogs': {},
            'messages': {},
            'chats': {},
            'users': {}
        };

        $.each(data, function (index, data) {
            switch (index) {
                case 'dialogs':
                    data.forEach(function (item, i) {
                        if (item.peer.channel_id) {
                            item.id = item.peer.channel_id;
                        } else if (item.peer.user_id) {
                            item.id = item.peer.user_id;
                        } else if (item.peer.chat_id) {
                            item.id = item.peer.chat_id;
                        }

                        list['dialogs'][i] = item;
                    });
                    break;
                case 'messages':
                case 'chats':
                case 'users':
                    data.forEach(function (item) {
                        list[index][item.id] = item;
                    });
                    break;
            }
        });

        this.users = list.users;
        this.dialogs = list.dialogs;
        this.chats = list.chats;
        this.messages = list.messages;

        return list;
    }

    loadDialogMessages(id, type, accessHash, num, max_id) {
        let messageTpl = _.template($('#message-tpl').html());
        let self = this;

        num = (num || 50);

        this.telegram.getHistory({
            id: id,
            limit: num,
            max_id: max_id,
            access_hash: $('.contacts-list li[data-id="' + id + '"]').data('access-hash')
        }, type, function (data) {
            var totalCount = data.count || data.messages.length;

            let doScroll = ($('.messages-list div.message').length > 0)?false:true;
            
            data.messages.forEach(function (message) {
                let date = new Date(message.date * 1000);
                let content = '';


                console.log(message);
                if (message.media && message.media._ === 'messageMediaPhoto') {
                    self.telegram.getFile(message.media.photo.sizes[1].location, function (res) {
                        if (res._ && res._ === 'upload.file') {
                            $('.message[data-id="' + message.id + '"]').find('.message__text__content').prepend($('<img>', {
                                src: 'data:image/jpeg;base64,' + toBase64(res.bytes), 'style': 'display:block'
                            }));
                        }
                    });

                    message.message = message.media.caption;
                }

                if (message.media && message.media._ === 'messageMediaDocument') {
                    if (message.media.document.thumb._ == 'photoSizeEmpty') {

                        content = '<p>'+message.media.document.attributes[0].file_name+'</p>'
                            +'<p>'+self.fileSizeFormat(message.media.document.size)+'</p>'
                            +'<p><a href="#" class="dialog-document-download">Download</a></p>';

                        // special case for "application/pdf"
                    } else {
                        self.telegram.getFile(message.media.document.thumb.location, function (res) {
                            if (res._ && res._ === 'upload.file') {
                                $('.message[data-id="' + message.id + '"]').find('.message__text__content').prepend($('<img>', {
                                    src: 'data:image/jpeg;base64,' + toBase64(res.bytes), 'style': 'display:block'
                                }))
                            }
                        });
                    }

                    message.message = message.media.caption;
                }

                $('.messages-list').prepend(messageTpl({
                    id: message.id,
                    message_type: (message.from_id === self.user.id) ? 'my-message' : '',
                    content: content,
                    message: message.message,
                    from: message.from_id,
                    time: date.getUTCHours().pad() + ':' + date.getMinutes().pad()
                }));
            });

            if (doScroll) {
                $('.chat-window').animate({scrollTop: $('.chat-window')[0].scrollHeight}, 1000);
            }
        });
    }

    loadAvatars() {
        let data = [];
        let photo = {};
        let self = this;
        let called = false;

        $('.contacts-list li').each(function () {
            data.push($(this).data('id'));
        });

        data.forEach(function (index) {
            let name = $('.contacts-list li[data-id="' + index + '"]').data('name');

            if (self.photos[index] !== undefined) {
                photo = self.photos[index];

                if (photo) {
                    self.telegram.getFile(photo, function (res) {
                        if (res) {
                            photo = 'data:image/jpeg;base64,' + toBase64(res.bytes);
                            self.photos[index] = photo;

                            $('.contacts-list li[data-id="' + index + '"] .avatar-container').append($('<img>', {
                                src: 'data:image/jpeg;base64,' + toBase64(res.bytes)
                            }));

                            if (!called) {
                                $('.contacts-list').find('li').first().click();
                                called = true;
                            }
                        }
                    }, function () {
                        self.renderCharAvatar(name, $('.contacts-list li[data-id="' + index + '"] .avatar-container'));
                    });
                } else {
                    self.renderCharAvatar(name, $('.contacts-list li[data-id="' + index + '"] .avatar-container'));
                }
            }
        });
    }

    getAvatarCode(name) {
        let letters = this.getUpperCaseLetters(name, 2);

        return '<span>' + letters + '</span>';
    }

    getUpperCaseLetters(text, num) {
        let result = '';
        let found = 0;

        for(let i = 0; i < text.length; i++)
        {

            if ( (text.charAt(i) == text.charAt(i).toUpperCase()) && (text.charAt(i).toLowerCase() != text.charAt(i).toUpperCase()) ) {
                found++;
                result += text.charAt(i);

                if (found == num) break;
            }
        }

        return result;
    }

    getAvatarColor(name) {
        let colors = ['#001f3f', '#0074D9','#7FDBFF', '#39CCCC', '#3D9970', '#2ECC40', '#01FF70', '#FFDC00', '#FF851B', '#FF4136', '#85144b', '#F012BE', '#B10DC9', '#111111', '#AAAAAA', '#DDDDDD'];
        let sum = 0;

        for(let i = 0; i < name.length; i++) {
            sum += name.charCodeAt(i);
        }

        return colors[sum % colors.length];
    }

    getChatDate(timestamp) {
        let weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        let today = new Date();
        let currentDate = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

        let chatDate = new Date(timestamp * 1000);
        let chatDateFormatted = chatDate.getFullYear()+'-'+(chatDate.getMonth()+1)+'-'+chatDate.getDate();

        // Display time only
        if (currentDate == chatDateFormatted) {
            return chatDate.getUTCHours().pad() + ':' + chatDate.getMinutes().pad();
        }

        // Display day of week
        let diffTime = today.getTime() - chatDate.getTime();
        let diffDays = diffTime / (1000 * 3600 * 24); 

        if (diffDays < 7) {
            return weekDays[chatDate.getDay()];
        }

        // Display date
        return (chatDate.getMonth()+1)+'/'+chatDate.getDate() + '/' + chatDate.getFullYear().toString().substr(-2);
    }

    initSearch() {
        $('.search-bar-container input').keyup(function() {
            if ($(this).val()) {
                let filter = $(this).val().toLowerCase();
                $('.contacts-list > li').hide();


                $('.contacts-list > li').each(function(index, item) {
                    if ($(item).data('name').toLowerCase().indexOf(filter) > -1) {
                        $(item).show();
                    }
                })
            } else {
                $('.contacts-list > li').show();
            }
        });
    }

    loadCurrentUserData(app) {
        let self = this;

        this.telegram.getUserInfo(function (user) {
            if (user) {
                self.user = user;
            } else {
                localStorage.removeItem('code');
                app.setCookie('userHash', '');
            }
        });
    }

    getUserName(user) {
        return user.first_name + ( (user.last_name) ? (' ' + user.last_name) : '');
    }


    initMessagesWindow() {
        let self = this;

        // On scroll to top
        $('.chat-window').scroll(function() {
            if ($(this).scrollTop() == 0) {

                if ($('.messages-list .message').length) {
                    // get ID of the oldest message
                    let max_id = $('.messages-list .message').first().data('id');
                    self.loadDialogMessages(self.id, self.type, self.accessHash, 50+$('.messages-list > div.message').length, max_id);
                }
            }
        });
    }

    renderTopChatInfo(data, entityId) {
        let title = '';

        if (Object.keys(data).length) {
            title = this.getUserName(data);

            if (data.status) {
                $('.chat-window .info .status').data('user', entityId);
                this.setChatTopBarStatus(data.status._, data.status.was_online, entityId);
            }
        } else {
            title = this.chats[entityId].title;
            $('.chat-window .info .status').data('user', '').html('');
        }

        $('.chat-window .info .name').html(title);

        if (typeof this.photos[entityId] === 'string') {
            $('.top-bar .avatar-container').html($('<img>', {
                src: this.photos[entityId]
            }));
        } else {
            let avatarChar = this.getAvatarCode(title);

            $('.top-bar .avatar-container').css('background-color', this.getAvatarColor(title)).html(avatarChar);
        }
    }

    setChatTopBarStatus(statusType, timestamp, userId) {
        let barStatusUserId = $('.chat-window .info .status').data('user');
        let status = '';

        if (this.type != 'user') return;

        if (barStatusUserId && barStatusUserId === userId) {
            let statusColor = 'black';

            if (statusType === 'userStatusOnline') {
                status = 'Online';
                $('.chat-window .info .status').data('status', 'online');
                statusColor = '#3390ec';
            } else if (statusType === 'userStatusOffline') {
                $('.chat-window .info .status').data('status', 'offline');
                $('.chat-window .info .status').data('timestamp', timestamp);
                status = 'last seen ' + this.getChatTopBarDate(timestamp);
            }

            $('.chat-window .info .status').html(status).css('color', statusColor);
        }
    }

    getChatTopBarDate(timestamp) {
        let today = new Date();
        let chatDate = new Date(timestamp * 1000);

        // Display day of week
        let diffTime =  Math.floor((today.getTime() - chatDate.getTime()) / 60000);
        let diffHours = Math.floor(diffTime / 60);
        let diffDays =  Math.floor(diffTime / (1000 * 3600 * 24));

        if (diffTime < 1) {
            return 'just now';
        } else if (diffTime < 60) {
            if (diffTime == 1) {
                return diffTime + ' minute ago';
            } else {
                return diffTime + ' minutes ago';
            }
        } else if (diffHours < 24) {
            if (diffHours == 1) {
                return diffHours + ' hour ago';
            } else {
                return diffHours + ' hours ago';
            }
        } else if (diffDays < 2) {
            return 'yesterday at ' + chatDate.getUTCHours().pad() + ':' + chatDate.getMinutes().pad();
        }

        return chatDate.getDate() + '.' + (chatDate.getMonth() + 1) + chatDate.getFullYear().toString().substr(-2);
    }

    initNotifications() {
        let self = this;

        self.telegram.subscribe(function (data) {
            switch (data._) {
                case 'updateShort':
                    if (data.update._ === 'updateUserStatus') {
                        // updateUserStatus in top bar
                        self.setChatTopBarStatus(data.update.status._, data.update.status.was_online, data.update.user_id);
                        self.updateContactStatus(data.update.status._, data.update.status.was_online, data.update.user_id);
                    }
                    break;
                case 'updateShortMessage':
                    // message from user
                    self.telegram.getMessages([data.id], function (messages) {
                        self.addNewMessage('user', data.user_id, messages.messages[0]);
                    });
                    break;
                case 'updateShortChatMessage':
                    // message from chat
                    self.telegram.getMessages([data.id], function(messages) {
                        self.addNewMessage('chat', data.chat_id, messages.messages[0]);
                    });
                    break;
                case 'updates':
                    let channelId = 0;
                    
                    for (let i = 0; i<data.updates.length; i++) {
                        if (data.updates[i].channel_id) {
                            channelId = data.updates[i].channel_id;
                        }
                        if (data.updates[i].message) {
                            // message from channel
                            self.telegram.getChannelMessages({channel_id: channelId, access_hash: data.chats[0].access_hash, _:'inputChannel'}, [data.updates[i].message.id], function(messages) {

                                self.addNewMessage('channel', channelId, messages.messages[0]);
                            });
                        }
                    }
                    
                    break;
            }
        });
    }

    addNewMessage(dialogType, dialogID, message) {
        let self = this;
        // Update messages counter
        self.addCounter(dialogType, dialogID);

        // Append message to the dialog
        if ((self.type == dialogType) && (dialogID == self.id)) {
            let messageTpl = _.template($('#message-tpl').html());
            let messagesHTML = '';
            let self = this;

            let date = new Date(message.date * 1000);

            $('.messages-list').append(messageTpl({
                id: message.id,
                message_type: (message.from_id === self.user.id) ? 'my-message' : '',
                message: message.message,
                content: '',
                from: message.from_id,
                time: date.getUTCHours().pad() + ':' + date.getMinutes().pad()
            }));

            $('.chat-window').animate({scrollTop: $('.chat-window')[0].scrollHeight}, 1000);
        }

        // Update last message in contacts list
        $('.contacts-list li[data-id='+dialogID+'][data-type='+dialogType+'] .last-message').html(_.escape(message.message));
        $('.contacts-list li[data-id='+dialogID+'][data-type='+dialogType+']').detach().prependTo('.contacts-list');
    }

    addCounter(dialogType, dialogID) {
        let counterEl = $('.contacts-list li[data-id='+dialogID+'][data-type='+dialogType+'] .messages-counter');
        if (!counterEl.length) {
            $('.contacts-list li[data-id='+dialogID+'][data-type='+dialogType+'] .info').append('<p class="messages-counter">1</p>');
        } else {
            counterEl.text(1+parseInt(counterEl.text()));
        }
    }

    updateContactStatus(statusType, timestamp, userId) {
        
        if (statusType === 'userStatusOnline') {
            $('.contacts-list li[data-id=' + userId + '] .avatar').append($('<div>', {'class': 'online'}));
        } else {
            $('.contacts-list li[data-id=' + userId + '] .avatar .online').remove();
        }
    }

    regularStatusUpdate(chat) {
        let status = $('.chat-window .info .status').data('status');

        if (status == 'offline') {
            let timestamp = $('.chat-window .info .status').data('timestamp');
            let statusText = 'last seen ' + chat.getChatTopBarDate(timestamp);

            $('.chat-window .info .status').html(statusText).css('color', 'black');
        }
    }

    renderCharAvatar(name, $block) {
        let avatarChar = this.getAvatarCode(name);

        $block.css('background-color', this.getAvatarColor(name)).append(avatarChar);
    }

    fileSizeFormat(bytes) {
        let size = bytes;

        if (size < 1000) {
            return size + ' bytes';
        } else if (size < 1000000) {
            return Math.floor(size/1000)+'K';
        } else if (size < 1000000000) {
            return Math.floor(size/1000000)+'M';
        } else if (size < 1000000000000) {
            return Math.floor(size/1000000000)+'G';
        }
    }

    initContactsListScrollListener() {
        let self = this;
        let $contactsList = $('aside.contacts');

        // On scroll to top
        $contactsList.scroll(function () {
            let scrollTop = $(this).scrollTop(),
                scrollHeight = $(this)[0].scrollHeight,
                height = $(this).height();
            let bottomReached = scrollHeight - (scrollTop + height + 100) < 0;

            console.log(scrollHeight - (scrollTop + height + 100), 'REACHED');
            if (bottomReached) {
                if ($contactsList.find('li').length) {
                    // get ID of the oldest contact
                    self.loadDialogs($contactsList.find('li').last().data('id'));
                }
            }
        });
    }

    initMessagesInput() {
        let self = this;

        $('.message-input-box input').keypress(function(e) {
            if (e.keyCode == 13) {

                let peer = {};

                if (self.type == 'user') {
                    peer = {
                         _: 'inputPeerUser',
                         user_id: self.id,
                         access_hash: self.accessHash
                    };
                } else if (self.type == 'chat') {
                    peer = {
                         _: 'inputPeerChat',
                         chat_id: self.id
                    };
                } else if (self.type == 'channel') {
                    peer = {
                         _: 'inputPeerChannel',
                         channel_id: self.id,
                         access_hash: self.accessHash
                    };
                }
                self.telegram.sendMessage(peer, $(this).val(), function(updates) {
                    $('.message-input-box input').val('');
                    console.log(updates);

                    if (updates._ == 'updateShortSentMessage') {
                        self.telegram.getMessages([updates.id], function (messages) {
                            if (messages.chats.length) {
                                    // Chat message
                                    self.addNewMessage('chat', messages.chats[0].id, messages.messages[0]);
                                // }
                            } else {
                                // User messages
                                self.addNewMessage('user', messages.messages[0].to_id.user_id, messages.messages[0]);
                            }

                            
                        });
                    } else if (updates._ == 'updates') {
                        let channelId = 0;
                        
                        for (let i = 0; i<updates.updates.length; i++) {
                            if (updates.updates[i].channel_id) {
                                channelId = updates.updates[i].channel_id;
                            }
                            if (updates.updates[i].message) {
                                // message from channel
                                self.telegram.getChannelMessages({channel_id: channelId, access_hash: updates.chats[0].access_hash, _:'inputChannel'}, [updates.updates[i].message.id], function(messages) {
                                    // console.log(messages.messages[0]);

                                    self.addNewMessage('channel', channelId, messages.messages[0]);
                                });
                            }
                        }   
                    }
                });
            } else {
                // send "typing" message
            }
        });
            
    }

    initSmiles() {
        $('.display-smiles').click(function() {
            $('.smiles-list').toggle();
            return false;
        });

        $('.smiles-list a').click(function() {
            $('.message-input-box input').val($('.message-input-box input').val() + $(this).text());
            $('.smiles-list').hide();
            return false;
        });
    }

    initInfoClick() {
        let self = this;

        $('.chat-window .top-bar .avatar-container').click(function() {

            // Get user info
            if (self.type == 'user') {
                self.telegram.getExternalUserInfo(self.id, self.accessHash, function(data) {
                    console.log(data);

                    $('.user-info > .username').text(data.user.first_name + ' ' + data.user.last_name);
                    $('.fields-phone').text(data.user.phone);
                    $('.fields-username').text(data.user.username);
                });
            }

            return false;
        });
    }
}

$(document).ready(function () {
    let chat = new Chat();
    let app = new App();

    chat.loadCurrentUserData(app);
    chat.loadDialogs();
    chat.initSearch();
    chat.initMessagesWindow();
    chat.initNotifications();
    chat.initMessagesInput();
    chat.initSmiles();
    chat.initInfoClick();
    // chat.initContactsListScrollListener();

    // Update minutes and hours
    setInterval(chat.regularStatusUpdate, 60000, chat);
});
