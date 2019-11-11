$(document).ready(function () {
    let body =  $('body');

    (new Promise(function (resolve, reject) {
        body.addClass('webogram login-page');
        body.load('./html/components/auth.html', function () {
            resolve();
        });
    })).then(function () {
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
            let countryCode = $('.login-page #sign-in-country').val();
            let phoneNumber = $('.login-page .phone').val();


            telegramApi.sendCode(countryCode + phoneNumber).then(function(sent_code) {
                console.log(sent_code);
                if (!sent_code.phone_registered) {
                    // New user
                }

                // phone_code_hash will need to sign in or sign up
                window.phone_code_hash = sent_code.phone_code_hash;
            });
        });
    });
});