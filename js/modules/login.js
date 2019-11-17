import TelegramAPI from "./telegram.js";

$(document).ready(function () {
    let body =  $('body');
    let telegram = new TelegramAPI();

    (new Promise(function (resolve, reject) {
        body.addClass('webogram login-page');
        body.load('./html/components/auth.html', function () {
            resolve();
        });
    })).then(function (res) {
        $('select').select2();
        $('input[type="text"]')
            .blurDecoration()
            .focusDecoration();

        $('#sign-in-country').change(function() {
            if ($(this).val()) {
                $(this).parent().addClass('md-input-has-value');
                $('.login-page .phone').val($(this).val()).focus();
            } else {
                $(this).parent().removeClass('md-input-has-value');
            }
        });

        $(document).on('submit', '.login-form', function () {
            let phoneNumber = $('.login-page .phone').val();

            telegram.sendCode(phoneNumber, function() {
                //render send code page
                body.load('./html/components/auth-code.html', function () {
                    $('.phone').text(phoneNumber);
                    $('input[type="text"]')
                        .blurDecoration()
                        .focusDecoration();

                    $(document).on('submit', '.auth-code-form', function() {
                        telegram.signIn(phoneNumber, $('#auth-code').val(), function(res) {
                            console.log(res);
                            window.location.hash = '#chat';
                        }, function (err) {
                            if (err.type === 'SESSION_PASSWORD_NEEDED') {
                                body.load('./html/components/auth-password.html', function () {
                                    $('input[type="text"]')
                                        .blurDecoration()
                                        .focusDecoration();

                                    $(document).on('click', '.show-password-button', function() {
                                        passwordToggling();
                                    });

                                    $(document).on('submit', '.auth-password-form', function() {
                                        let password = {
                                            _: 'InputCheckPasswordSRP',
                                            srp_id: $('#auth-password').val(),
                                            A: 'A',
                                            M1: 'M1'
                                        }
                                        telegram.checkPassword(, function(res) {
                                            console.log(res);
                                            window.location.hash = '#chat';
                                        }, function (err) {
                                            $('#auth-password').invalid();
                                            $('.auth-password-form').concerned();
                                        });

                                        return false;
                                    });
                                });
                            } else {
                                $('#auth-code').invalid();
                                $('.auth-code-form').concerned();
                            }
                        });

                        return false;
                    });
                });
            });

            return false;
        });
    });
});

function passwordToggling() {
    let passwordForm = $('.auth-password-form');
    let passwordButton = $('.show-password-button span');
    let authPassword = $('#auth-password');

    if (passwordForm.hasClass('show-password')) {
        passwordForm.removeClass('show-password');
        passwordButton.removeClass('close');
        authPassword.attr('type', 'password');
    } else {
        passwordForm.addClass('show-password');
        passwordButton.addClass('close');
        authPassword.attr('type', 'text');
    }
}