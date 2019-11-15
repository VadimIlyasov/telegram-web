import TelegramAPI from "./telegram.js";

export default class Chat {
    constructor() {
        this.users = [];
        this.chats = [];
        this.dialogs = [];
        this.messages = [];
        this.user = {};
        this.photos = [];
        this.telegram = new TelegramAPI();
    }

    loadDialogs(callback) {
        let contactTpl = _.template($('#contact-tpl').html());
        let self = this;

        this.telegram.getDialogs(function (res) {
            let list = self.prepareDialogsList(res);

            let $contactsList = $('.contacts-list');
            let contactsHTML = '';
            let contactData = [];

            $.each(list.dialogs, function (id, el) {
                // let date = new Date(list.messages[el.top_message].date * 1000);
                let message = list.messages[el.top_message].message;

                if (el.peer.user_id) {
                    if (typeof list['users'][id] !== 'undefined') {
                        contactData = list['users'][id];
                        self.photos[id] = false;

                        if (contactData.photo && contactData.photo.photo_small !== undefined) {
                            self.photos[id] = contactData.photo.photo_small;
                        }

                        contactsHTML += contactTpl({
                            name: contactData.first_name + ( (contactData.last_name) ? (' '+contactData.last_name):''),
                            lastMessage: message,
                            time: self.getChatDate(list.messages[el.top_message].date), //date.getUTCHours().pad() + ':' + date.getMinutes().pad(),
                            counter: el.unread_count,
                            id: id,
                            type: contactData._,
                            access_hash: contactData.access_hash
                        });
                    }
                } else {
                    if (typeof list['chats'][id] !== 'undefined') {
                        contactData = list['chats'][id];
                        self.photos[id] = false;

                        if (contactData.photo && contactData.photo.photo_small !== undefined) {
                            self.photos[id] = contactData.photo.photo_small;
                        }

                        contactsHTML += contactTpl({
                            name: contactData.title,
                            lastMessage: message,
                            time: self.getChatDate(list.messages[el.top_message].date), //date.getUTCHours().pad() + ':' + date.getMinutes().pad(),
                            counter: el.unread_count,
                            id: id,
                            type: contactData._,
                            access_hash: contactData.access_hash
                        });
                    }
                }
            });

            $contactsList.append(contactsHTML);

            $('.contacts-list li').click(function () {

                $('.contacts-list li').removeClass('selected');
                $(this).addClass('selected');

                let id = $(this).data('id'),
                    type = $(this).data('type'),
                    accessHash = $(this).data('access-hash');

                switch (type) {
                    case 'user':
                        self.telegram.getUserById(id, accessHash, function (info) {
                            let title = self.getUserName(info),
                                status = '';

                            if (info.status.expires) {
                                status = 'Online';
                            }

                            $('.chat-window .info .name').html(title);
                            $('.chat-window .info .status').html(status);
                            $('.top-bar .avatar-container').html($('<img>', {
                                src: self.photos[id]
                            }));
                        });

                        break;
                    case 'channel':
                    case 'chat':
                        $('.chat-window .info .name').html(self.chats[id].title);
                        $('.chat-window .info .status').html('');
                        $('.top-bar .avatar-container').append($('<img>', {
                            src: this.photos[id]
                        }));

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
                    data.forEach(function (item) {
                        if (item.peer.channel_id) {
                            list['dialogs'][item.peer.channel_id] = item;
                        } else if (item.peer.user_id) {
                            list['dialogs'][item.peer.user_id] = item;
                        } else if (item.peer.chat_id) {
                            list['dialogs'][item.peer.chat_id] = item;
                        }
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

    loadDialogMessages(id, type, accessHash, num) {
        let messageTpl = _.template($('#message-tpl').html());
        let messagesHTML = '';
        let self = this;

        $('.messages-list').empty();

        num = (num || 50);

        this.telegram.getHistory({
            id: id,
            limit: num,
            access_hash: $('.contacts-list li[data-id="' + id + '"]').data('access-hash')
        }, type, function (data) {
            var totalCount = data.count || data.messages.length;

            data.messages.forEach(function (message) {
                let date = new Date(message.date * 1000);

                $('.messages-list').prepend(messageTpl({
                    id: id,
                    message_type: (message.from_id === self.user.id) ? 'my-message' : '',
                    message: message.message,
                    from: message.from_id,
                    time: date.getUTCHours().pad() + ':' + date.getMinutes().pad()
                }));
            });
        });
    }

    loadAvatars() {
        let data = [];
        let photo = {};
        let avatarChar = '';
        let self = this;

        $('.contacts-list li').each(function () {
            data.push($(this).data('id'));
        });

        data.forEach(function (index) {
            if (self.photos[index] !== undefined) {
                let avatarExists = false;
                photo = self.photos[index];

                if (photo) {
                    self.telegram.getAvatar(photo, function (res) {
                        if (res) {
                            avatarExists = true;
                            photo = 'data:image/jpeg;base64,' + toBase64(res.bytes);
                            self.photos[index] = photo;

                            $('.contacts-list li[data-id="' + index + '"] .avatar-container').append($('<img>', {
                                src: 'data:image/jpeg;base64,' + toBase64(res.bytes)
                            }));
                        }
                    });
                } else {
                    let name = $('.contacts-list li[data-id="' + index + '"]').data('name');
                    avatarChar = self.getAvatarCode(name);

                    $('.contacts-list li[data-id="' + index + '"] .avatar-container').css('background-color', self.getAvatarColor(name)).append(avatarChar);
                }

                // if (!avatarExists) {
                //     avatarChar = $('.contacts-list li[data-id="' + index + '"]').data('name')[0];
                //
                //     $('.contacts-list li[data-id="' + index + '"] .avatar-container').append($('<span>', {
                //         html: avatarChar
                //     })).addClass('background-char-g');
                // }
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

    loadCurrentUserData() {
        let self = this;

        this.telegram.getUserInfo(function (user) {
            self.user = user;
        });
    }

    getUserName(user) {
        return user.first_name + ( (user.last_name) ? (' ' + user.last_name) : '');
    }
}

$(document).ready(function () {
    let chat = new Chat();

    chat.loadCurrentUserData();
    chat.loadDialogs();
    chat.initSearch();
});
