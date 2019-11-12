$(document).ready(function () {
    $.fn.extend({
        blurDecoration: function() {
            $(this).on('focus', function() {
                $(this).parent().addClass('md-input-has-value').addClass('active');
            });

            return this;
        },
        focusDecoration: function() {
            $(this).on('blur', function() {
                if (!$(this).val())
                    $(this).parent().removeClass('md-input-has-value');

                $(this).parent().removeClass('active');
            });

            return this;
        },
        invalid: function () {
            $(this).parent().addClass('invalid');
        },
        concerned: function () {
            $(this).addClass('concerned');
        }
    });
});