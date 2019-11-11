$(document).ready(function () {
    let body =  $('body');

    (new Promise(function (resolve, reject) {
        body.addClass('webogram login-page');
        body.load('./html/components/auth.html', function () {
            resolve();
        });
    })).then(function (res) {
        $('select').select2();

        $('input[type="text"]').on('focus', function() { $(this).parent().addClass('md-input-has-value').addClass('active') });
        $('input[type="text"]').on('blur', function() { if (!$(this).val()) $(this).parent().removeClass('md-input-has-value'); $(this).parent().removeClass('active'); });

        $('#sign-in-country').change(function() {
            if ($(this).val()) {
                $(this).parent().addClass('md-input-has-value');
                $('.login-page .phone').val($(this).val()).focus();
            } else {
                $(this).parent().removeClass('md-input-has-value');
            }
        });

        $(document).on('click', '.login-page .next', function () {
            let phoneNumber = $('.login-page .phone').val();


            telegramApi.sendCode(phoneNumber).then(function(sentCode) {
                if (!sentCode.phone_registered) {
                    // New user
                } else {
                    //render send code page
                    body.load('./html/components/auth-code.html', function () {
                        $(document).on('focus', 'input[type="text"]', function() { $(this).parent().addClass('md-input-has-value').addClass('active') });
                        $(document).on('blur', 'input[type="text"]', function() { if (!$(this).val()) $(this).parent().removeClass('md-input-has-value'); $(this).parent().removeClass('active'); });

                        // ToDo: Fake validation for demonstrating highlights, replace with real one
                        $('#auth-code').on('change', function() {
                            telegramApi.signIn(phoneNumber, sentCode.phone_code_hash, $(this).val()).then(function() {
                                body.load('./html/components/auth-password.html', function () {
                                    $(document).on('focus', 'input.text', function() { $(this).parent().addClass('md-input-has-value').addClass('active') });
                                    $(document).on('blur', 'input.text', function() { if (!$(this).val()) $(this).parent().removeClass('md-input-has-value'); $(this).parent().removeClass('active'); });

                                    // ToDo: Fake validation for demonstrating highlights, replace with real one
                                    $(document).on('change', '#auth-password', function() {
                                        $(this).parent().addClass('invalid');
                                    });

                                    $(document).on('click', '.show-password-button', function() {
                                        if ($('.auth-password-form').hasClass('show-password')) {
                                            $('.auth-password-form').removeClass('show-password');
                                            $('.show-password-button span').removeClass('close');
                                            $('#auth-password').attr('type', 'password');
                                        } else {
                                            $('.auth-password-form').addClass('show-password');
                                            $('.show-password-button span').addClass('close');
                                            $('#auth-password').attr('type', 'text');
                                        }
                                    });
                                });
                            }, function(err) {
                                switch (err.type) {
                                    case 'PHONE_CODE_INVALID':
                                        $('#auth-code').parent().addClass('invalid');
                                        $('.auth-code-form').addClass('concerned');
                                        break;
                                    case 'PHONE_NUMBER_UNOCCUPIED':
                                        alert('User not registered, you should use signUp method');
                                        break;
                                }
                            });
                        });
                    });
                }
            });
        });
    });
});