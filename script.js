(function () {

    window.onload = function () {
        // check if voice input is available
        (window.SpeechRecognition || window.webkitSpeechRecognition) == undefined ? false : activateMic();

        /*
        showForm([{
                title: 'Name',
                type: 'text'
            },
            {
                title: 'Datum',
                type: 'date'
            }
        ])

        showButtons([{
            label: 'Schaden melden'
        }, {
            label: 'Nö',
            value: 'Nein'
        }, {
            value: 'Vielleicht'
        }]);
        */

    };

    activateMic = function () {
        document.getElementById('microphone_button').style.display = "flex";
    };

    var Message;
    Message = function (arg) {
        this.text = arg.text, this.message_side = arg.message_side, this.intent = arg.intent;
        this.draw = function (_this) {
            return function () {
                var $message;
                $message = $($('.message_template').clone().html());
                $message.addClass(_this.message_side).find('.text').html(_this.text);
                _this.intent ? $message.addClass(_this.message_side).find('.intent').html('#'+_this.intent):false;
                $('.messages').append($message);
                return setTimeout(function () {
                    return $message.addClass('appeared');
                }, 0);
            };
        }(this);
        return this;
    };

    var getMessageText, message_side, sendMessage, context;

    getMessageText = function () {
        var $message_input;
        $message_input = $('.message_input');
        return $message_input.val();
    };
    sendMessage = function (text, message_side, voice) {
        var $messages, message;
        if (text.trim() === '') {
            return;
        }

        addMessage(text, 'right');

        $.ajax( {
            url: '/conversation',
            type: 'POST',
            data: {'message': text , 'context': context},
            ContentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success:function(data){
                context = data.context;
                if (voice) {
                    var msg = new SpeechSynthesisUtterance(data.output.text);
                    window.speechSynthesis.speak(msg);
                }
                console.info(data);
                addMessage(data.output.text, 'left', data.intents[0].intent);
            },
            error:function(XMLHttpRequest,status,error){
                //do nothing
            }
        })

    };

    openSpeechRecognition = function () {
        window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        var recognition = new SpeechRecognition();
        recognition.language = 'de';
        return recognition;
    }

    speech = function (callback) {
        var recognition = openSpeechRecognition();

        recognition.addEventListener('result', e => {
            var transcript = Array.from(e.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');

            if (e.results[0].isFinal) {
                callback(transcript);
                recognition.stop();

            }
        });
        recognition.start();
    }

    recordMessage = function () {
        speech(function (text) {
            sendMessage(text, 'right', true);
        });
    };

    addMessage = function (text, message_side, intent) {
        $('.message_input').val('');
        $messages = $('.messages');

        console.log(text + ' - #' + intent)

        message = new Message({
            text: text,
            message_side: message_side,
            intent: intent
        });
        message.draw();
        return $messages.animate({
            scrollTop: $messages.prop('scrollHeight')
        }, 300);
    }

    $(function () {
        $('.send_message').click(function (e) {
            return sendMessage(getMessageText());
        });
        $('.speak_message').click(function (e) {
            return recordMessage();
        });
        $('.message_input').keyup(function (e) {
            if (e.which === 13) {
                return sendMessage(getMessageText());
            }
        });
        $('.reload').click(function (e) {
            location.reload();
        })

        // call for initial Message
        $.ajax( {
                url: '/conversation',
                type: 'POST',
                data: {'message': "" , 'context': {}},
                ContentType: 'application/json; charset=utf-8',
                dataType: 'json',
                success:function(data){
    
                    context = data.context;
                    addMessage(data.output.text, 'left');
    
                },
                error:function(XMLHttpRequest,status,error){
                    //do nothing
                }
            })
    
    })


    /*** Templating ***/
    template = function (type, data) {
        return document.getElementById('template_anchor').innerHTML = data.map(type).join('');
    }
    closeInput = function () {
        document.getElementById('template_anchor').innerHTML = ''
    }

    /*** Form ***/
    showForm = function (data) {
        return template(form_template, data)
    };

    /*** Buttons ***/
    showButtons = function (data) {
        return template(buttons_template, data)
    };
    chatbuttonClicked = function (e) {
        closeInput();
        sendMessage(e);
    }

    /*** Templates ***/
    form_template = ({
        title,
        type
    }) => {
        if (type == 'text') return `<label class="template_form" for="input_${title}">${title}:
                                        <input type="text" id="input_${title}" name="${title}">
                                    </label>`;
        if (type == 'date') return `<label class="template_form" for="input_${title}">${title}:
                                        <input type="date" id="input_${title}" name="${title}">
                                    </label>`;
    }

    buttons_template = ({
        label,
        value
    }) => `<div onclick="chatbuttonClicked('${value || label}')" class="chatbutton" value="${value || label}">${label || value}</div>`;

}.call(this));
