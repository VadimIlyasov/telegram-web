import TelegramAPI from "./telegram.js";

export default class Chat {
    constructor() {
        this.users = [];
        this.dialogs = [];
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
                let date = new Date(list.messages[el.top_message].date * 1000);
                let message = list.messages[el.top_message].message;

                if (el.peer.user_id) {
                    if (typeof list['users'][id] !== 'undefined') {
                        contactData = list['users'][id];
                        self.photos[id] = false;

                        if (contactData.photo && contactData.photo.photo_small !== undefined) {
                            self.photos[id] = contactData.photo.photo_small;
                        }

                        contactsHTML += contactTpl({
                            name: contactData.first_name,
                            lastMessage: message,
                            time: date.getUTCHours().pad() + ':' + date.getMinutes().pad(),
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
                            time: date.getUTCHours().pad() + ':' + date.getMinutes().pad(),
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
                let id = $(this).data('id'),
                    type = $(this).data('type'),
                    accessHash = $(this).data('access-hash');

                self.loadDialogMessages(id, type, accessHash, 50);

                self.telegram.getUserById(id, accessHash, function (info) {
                    console.log(info);
                    let title = self.getUserName(info) || info.title;
                    let status = '';

                    $('.chat-window .info .name').html(title);

                    if (info.status.expires) {
                        status = 'Online';
                    }

                    $('.chat-window .info .status').html(status);
                });
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
            take: num,
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

                /**
                 * message.from_id - Sender ID
                 * message.date - Date
                 * message.media - If message is Document or Photo
                 * message.message - Message text
                 */
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

                            $('.contacts-list li[data-id="' + index + '"] .avatar-container').append($('<img>', {
                                src: 'data:image/jpeg;base64,' + toBase64(res.bytes)
                            }));
                        }
                    });
                } else {
                    avatarChar = $('.contacts-list li[data-id="' + index + '"]').data('name')[0];

                    $('.contacts-list li[data-id="' + index + '"] .avatar-container').append($('<span>', {
                        html: avatarChar
                    })).addClass('background-char-g');
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
});
