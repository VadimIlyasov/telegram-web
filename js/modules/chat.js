import TelegramAPI from "./telegram.js";

$(document).ready(function () {
    let contactTpl = _.template($('#contact-tpl').html());
    let telegram = new TelegramAPI();

    (new Promise(function (resolve, reject) {
        telegram.getDialogs(function (res) {
            resolve(res);
        });
    })).then(function (res) {
        return prepareDialogsList(res);
    }).then(function (list) {
        let $contactsList = $('.contacts-list');
        let contactsHTML = '';
        let contactData = [];

        $.each(list.dialogs, function (id, el) {
            let date = new Date(list.messages[el.top_message].date * 1000);
            let message = list.messages[el.top_message].message;

            if (el.peer.user_id) {
                if (typeof list['users'][id] !== 'undefined') {
                    contactData = list['users'][id];
                    contactsHTML += contactTpl({name: contactData.first_name, lastMessage: message, time: date.getUTCHours().pad() + ':' + date.getMinutes().pad(), counter: el.unread_count});
                }
            } else {
                if (typeof list['chats'][id] !== 'undefined') {
                    contactData = list['chats'][id];
                    contactsHTML += contactTpl({name: contactData.title, lastMessage: message, time: date.getUTCHours().pad() + ':' + date.getMinutes().pad(), counter: el.unread_count});
                }
            }
        });

        $contactsList.append(contactsHTML);
    });
});

function prepareDialogsList(data) {
    let list = {
        'dialogs': {},
        'messages': {},
        'chats': {},
        'users': {}
    };

    $.each(data, function (index, data) {
        switch (index) {
            case 'dialogs':
                data.forEach(function(item) {
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
                data.forEach(function(item) {
                    list[index][item.id] = item;
                });
                break;
        }
    });

    return list;
}