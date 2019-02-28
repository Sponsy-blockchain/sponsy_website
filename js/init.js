'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function redirectCountry() {
	$.getJSON('http://api.ipstack.com/check?access_key=4d78af7c788de9f73fe581faf00229f2&format=1', function(data) {
			switch (data.country_code) {
				case 'BY':
				case 'RU':
				case 'UA':
				case 'KZ':
				if (window.location.href.indexOf("rus") == -1) {
					showLangTopPane('Russian', (window.location.href.indexOf("index") == -1) ? "tokensale_rus.html" : "index_rus.html");
				}
				break;
				case 'MO':
				case 'CN':
				case 'TW':
				if (window.location.href.indexOf("cn") == -1) {
					showLangTopPane('Chinese', (window.location.href.indexOf("index") == -1) ? "tokensale_cn.html" : "index_cn.html");
				}
				break;
				case 'JP':
				if (window.location.href.indexOf("jp") == -1) {
					showLangTopPane('Japanese', (window.location.href.indexOf("index") == -1) ? "tokensale_jp.html" : "index_jp.html");
				}
				break;
				case 'KR':
				if (window.location.href.indexOf("kor") == -1) {
					showLangTopPane('Korean', (window.location.href.indexOf("index") == -1) ? "tokensale_kor.html" : "index_kor.html");
				}
				break;
			}
	});
};

function showLangTopPane(lang,url) {
	$('#topLineLanguage').css('display', 'block');
	$('#topPaneLangLink').attr('href', url);
	$('#topPaneLangPrompt').text('You seem to be speaking '+lang+'. Click to switch to '+lang+' version of the website.');
}

var confirmation_code = "";

redirectCountry();

(function (window, $) {

	/**
  * @namespace jQueryExtends
  */
	/**
  *
  *
  * @sourcecode jQueryExtends:getMyElements
  * @memberof   jQueryExtends
  * @param      {string}     dataKey - ключ свойства из data объекта элемента.
  * @param      {Selector}   [selector] - селектор поиска
  * @param      {string}     [direction="document"] - направление где искать - `[closest, perent, children, find, prev, next, siblings]`
  * @param      {boolean}    [notSelf] - позволяет не учитывать себя (текущий `this`) при поиске элементов в `document` по такому же селектору, как у текущего элемента
  * @return     {Element}
  */
	$.fn.getMyElements = function (dataKey, selector, direction, notSelf) {

		direction = direction || 'document';
		var $element = this.eq(0);
		var keyIsSelector = typeof dataKey == 'string';
		var $target = keyIsSelector ? $element.data(dataKey) : undefined;

		// debug
		// if ( $target ) {
		// 	console.log( 'get from data -> ', dataKey );
		// } else {
		// 	console.log( 'look -> ', direction );
		// }

		if (undefined === $target) {
			if (direction === 'document') {
				$target = $(selector);
				if ($target.length && notSelf) {
					$target = $target.not($element);
				}
			} else {
				$target = $element[direction](selector);
			}
			$element.data(dataKey, $target);
		}

		if (!$target.length) {
			// console.log( selector + ' не найден!' );
			$element.data(dataKey, undefined);
		}

		return $target;
	};
	/**

  *
  *
  * @sourcecode jQueryExtends:changeMyText
  * @memberof   jQueryExtends
  * @requires   {@link wHelpers.replaceFromArray }
  * @param      {string}     [prop="default"] - Ключ свойтсва с которого нужно взять текст для замены
  * @param      {Array}      [replaceArray=[]] - Массив значений с которых следует сделать замену паттернов
  * @return     {undefined}
  */
	$.fn.changeMyText = function (prop, replaceArray) {

		return this.each(function (index, el) {
			var $element = $(el);
			var textData = $element.data('text');

			if ((typeof textData === 'undefined' ? 'undefined' : _typeof(textData)) !== 'object') {
				console.warn($element, 'Не имеет данных с тектом -> data-text=\'{"key": "value"}\'');
				return true;
			}

			replaceArray = replaceArray || [];
			prop = prop || 'default';
			var value = textData[prop];

			if (typeof value !== 'string') {
				console.warn($element, 'Не имеет свойтва "' + prop + '"');
				return true;
			}

			if (replaceArray.length) {
				value = _helpers.replaceFromArray(value, replaceArray);
			}

			$element.html(value);
		});
	};

	/**
  * @namespace wHTML
  */
	var _self,
	    wHTML = function wHTML() {
		_self = this;

		// если wHTML уже существует
		// к примеру, из-за асинхроности, объявлен ранее в programmer
		if (window.wHTML) {
			// копируем методы
			for (var key in window.wHTML) {
				_self[key] = window.wHTML[key];
			}
		}

		if (undefined === _self.formValidationOnSubmit) {
			/**
    * Событие, при успешной валидации формы.
    * Будет замененно при программировании.
    *
    * @sourcecode  wHTML:formValidationOnSubmit
    * @memberof    wHTML
    *
    * @fires   wHTML#formValidationAfterSubmit
    * @event   wHTML#formValidationOnSubmit
    *
    * @param   {Element}   $form - текущая форма, `jQuery element`
    *
    * @return  {undefined}
    */
			_self.formValidationOnSubmit = function ($form) {
				// отправка на сервак
				// ...
				// в ответе
				var response = {};
				_self.formValidationAfterSubmit($form, response);
			};
		}
	};

	/**
  * @namespace wHelpers
  */
	var _helpers,
	    wHelpers = function wHelpers() {
		_helpers = this;
	};

	// methods
	// ========================================
	/**
  * Инициализация плагина `jquery.inputmask`
  * @see  {@link http://robinherbots.github.io/Inputmask/}
  *
  * @sourcecode wHTML:inputMask
  * @memberof   wHTML
  * @param      {Element}     [$context] - родительский элемен
  * @return     {undefined}
  */
	wHTML.prototype.inputMask = function ($context) {

		var $maskElement = $('.js-inputmask', $context);
		if (!$maskElement.length) {
			return;
		}

		$maskElement.each(function (index, el) {
			var $el = $(el);
			var maskInited = $el.data('mask-inited');
			if (maskInited) {
				return true;
			}

			var mask = $el.data('mask') || '+38(099)9999999';
			// фикс для андроидов, на которых "пригает каретка"
			if (Modernizr.android5) {
				mask = $el.data('android-fix-mask') || '+380999999999';
			}

			$el.data('mask-inited', true);
			$el.inputmask({
				mask: mask,
				clearMaskOnLostFocus: false
			});
		});
	};

	/**
  * Инициализация `inline` метода плагина `magnific-popup`
  * @see  {@link http://dimsemenov.com/plugins/magnific-popup/documentation.html#inline-type}
  *
  * @sourcecode wHTML:mfpInline
  * @memberof   wHTML
  * @param      {string}   [selector='.js-mfp-inline'] - пользовательский css селектор для поиска и инита
  * @return     {undefined}
  */
	wHTML.prototype.mfpInline = function (selector) {
		selector = selector || '.js-mfp-inline';
		$(selector).each(function (index, el) {
			var $el = $(el);
			var customConfig = $el.data('mfpCustomConfig') || {};

			var currentConfig = $.extend(true, customConfig, {
				type: 'inline',
				closeBtnInside: true,
				removalDelay: 300,
				mainClass: 'zoom-in'
			});

			$el.magnificPopup(currentConfig);
		});
	};

	/**
  * Инициализация `ajax` метода плагина `magnific-popup`
  * @see  {@link http://dimsemenov.com/plugins/magnific-popup/documentation.html#ajax-type}
  *
  * @sourcecode wHTML:mfpAjax
  * @memberof   wHTML
  * @requires   {@link wHTML.inputMask }
  * @requires   {@link wHTML.tableWrapper }
  * @requires   {@link wHTML.viewTextImages }
  * @requires   {@link wHTML.viewTextMedia }
  * @requires   {@link wHTML.formValidation }
  * @param      {string}    [selector='.js-mfp-ajax'] - пользовательский css селектор для поиска и инита
  * @return     {undefined}
  */
	wHTML.prototype.mfpAjax = function (selector) {
		selector = selector || '.js-mfp-ajax';
		$('body').magnificPopup({
			type: 'ajax',
			delegate: selector,
			removalDelay: 300,
			mainClass: 'zoom-in',
			callbacks: {

				elementParse: function elementParse(item) {
					var itemData = item.el.data('param') || {};
					var lang = window.location.href.indexOf("index_cn") != -1 ? "chinese" : "non-chinese";
					var itemUrl = 'hidden/team_'+(lang == "chinese" ? "cn_" : "")+item.el.data('personid')+'.html';
					var itemType = item.el.data('type') || 'GET';

					this.st.ajax.settings = {
						url: itemUrl,
						type: itemType.toUpperCase(),
						data: itemData
					};
				},

				ajaxContentAdded: function ajaxContentAdded() {
					var $content = this.content || [];
					if ($content.length) {
						_self.inputMask($content);
						_self.tableWrapper($content);
						_self.viewTextImages($content);
						_self.viewTextMedia($content);
					}

					_self.formValidation($content);
				}
			}
		});
	};

	/**
  * Оформление таблиц при вертикальном скроле
  *
  * @sourcecode wHTML:tableWrapper
  * @memberof   wHTML
  * @param      {Element}     [$context] - родительский элемен
  * @return     {undefined}
  */
	wHTML.prototype.tableWrapper = function ($context) {

		var selector = '.js-table-wrapper';
		var $tableWrappers = $(selector, $context);
		if (!$tableWrappers.length) {
			return;
		}

		$tableWrappers.each(function (index, el) {
			var $tableWrapper = $(el);

			if ($tableWrapper.data('scroll-inited')) {
				return true;
			}
			$tableWrapper.data('scroll-inited', true);

			var $tableHolder = $tableWrapper.children(selector + '__holder');
			var $table = $tableHolder.children(selector + '__table');
			checkScrolledTable($tableWrapper, $tableHolder, $table);

			var timer = null;

			$tableHolder.on('scroll', function () {
				checkScrolledTable($tableWrapper, $tableHolder, $table);
			});

			$(window).on('resize', function () {
				clearTimeout(timer);
				timer = setTimeout(function () {
					checkScrolledTable($tableWrapper, $tableHolder, $table);
				}, 10);
			});
		});
	};

	/**
  * Проверка таблицы и ее враппераб, смотрим:
  *  влезает таблица в контейнер?
  *  таблица прокручена?
  *  прокрученна до конца?
  *
  * @sourcecode  checkScrolledTable
  * @private
  *
  * @param  {Element}  $wrapper
  * @param  {Element}  $holder
  * @param  {Element}  $table
  *
  * @return  {undefined}
  */
	function checkScrolledTable($wrapper, $holder, $table) {

		var holderWidth = $holder.innerWidth();
		var holderScroll = $holder.scrollLeft();
		var holderScrollOffset = $holder.scrollLeft() + holderWidth + 10;
		var tableWidth = $table.innerWidth();

		var doClassLeft = 'removeClass';
		var doClassRight = 'removeClass';

		if (holderScroll > 20) {
			doClassLeft = 'addClass';
		}

		if (tableWidth > holderWidth && tableWidth > holderScrollOffset) {
			doClassRight = 'addClass';
		}

		$wrapper[doClassLeft]('table-wrapper--outside-left');
		$wrapper[doClassRight]('table-wrapper--outside-right');
	}

	// viewTextMedia
	var ignore_class = 'ignore';
	var wrapper_class = 'media-wrapper';
	var holder_class = wrapper_class + '__holder';
	var _getRatio = function _getRatio(element) {
		var ratio = parseFloat((+element.offsetHeight / +element.offsetWidth * 100).toFixed(2));
		if (isNaN(ratio)) {
			// страховка 16:9
			ratio = 56.25;
		}
		return ratio + '';
	};

	/**
  * Поиск и оформление `iframe`, `video` и `table`
  * 	элементов в контентовом тексте
  *
  * @sourcecode wHTML:viewTextMedia
  * @memberof   wHTML
  * @param      {Element}    [$context] - родительский элемен
  * @return     {undefined}
  */
	wHTML.prototype.viewTextMedia = function ($context) {

		var $textElements = $('.view-text', $context);
		if (!$textElements.length) {
			return;
		}

		$textElements.each(function (index, text) {
			var $text = $(text);
			var $media = $text.find('iframe').add($text.find('video'));

			$media.each(function (index, el) {
				var $el = $(el);
				if ($el.hasClass(ignore_class) || $el.parent().hasClass(holder_class)) {
					return;
				}

				var ratio = _getRatio(el);
				var ratio_class = holder_class + ' ' + holder_class + '--' + ratio.replace('.', '-');
				var max_width = el.offsetWidth;

				$el.unwrap('p').wrap('' + '<div class="' + wrapper_class + '" style="max-width:' + max_width + 'px;">' + '<div class="' + ratio_class + '" style="padding-top:' + ratio + '%;"></div>' + '</div>');
			});

			var $tables = $text.children('table');
			$tables.each(function (index, el) {
				$(el).addClass('table-wrapp__table js-table-wrapper__table').wrap('<div class="table-wrapper js-table-wrapper"><div class="table-wrapper__holder js-table-wrapper__holder"></div></div>');
			});

			_self.tableWrapper($text);
		});
	};

	/**
  * Поиск и оформление изображений в контентовом тексте
  *  более подробно читай описание `setTextImageClassSizes`
  *
  * Нужно больше иследовать
  *  как может вести себя текстовый редактор,
  *  какие "комбинации" кода могут быть.
  *  В этом основная проблема - что код может быть разным.
  *
  * Поэтому нужно больше тестов и возможно ограничить
  *  сам редактор при работе.
  *
  *
  * @sourcecode wHTML:viewTextImages
  * @memberof   wHTML
  * @requires   {@link wHelpers:replaceFromArray }
  * @param      {Element}    [$context] - родительский элемен
  * @return     {undefined}
  */
	wHTML.prototype.viewTextImages = function ($context) {

		var $textElements = $('.view-text', $context);
		if (!$textElements.length) {
			return;
		}

		var cssContetClass = 'content-image';
		var cssContetSelector = '.' + cssContetClass;

		$textElements.each(function (index, text) {
			var $text = $(text);
			if ($text.hasClass('js-ignore-content-images')) {
				return true;
			}

			var $images = $text.find('img');

			$images.each(function (index, img) {
				var $img = $(img);
				if ($img.parent(cssContetSelector).length) {
					return true;
				}

				var $img = $(this);

				var width = img.getAttribute('width') || '';
				if (width.length) {
					width = width.replace(/px/, '');
					if (/%/.test(width)) {
						width = width.replace(/%/, '');
						var parentWigth = $img.parent().width();
						width = parentWigth / 100 * parseFloat(width);
					}
					width = parseInt(width);
				} else {
					width = $img.width();
				}

				var classes = [cssContetClass];
				setTextImageClassSizes(classes, cssContetClass, 'width', width);

				var title = img.title;
				var inlineStyle = img.style.cssText;
				if (inlineStyle.length) {
					inlineStyle = ' style="' + inlineStyle + '"';
				}

				$img.addClass(classes.join(' '));
			});
		});
	};

	/**
  * Устанавливает классы для изображения.
  *
  * Меряем ширину изображения по отрезкам в 100px
  *  [100-199, 200-299, 300-399, и тд.]
  *  При проверка ставим классы в зависимости от проверяемой величны.
  *
  * К примеру, есть у нас изображение с ширной 453px,
  *  то наша картинка получает классы:
  *
  * - _ .content-image--width-100-and-more _
  * - _ .content-image--width-200-and-more _
  * - _ .content-image--width-300-and-more _
  * - _ .content-image--width-400-and-more _
  *
  * Набор таких классов даст возможность предугадать
  *  на каком брейкпоинте и какое изображение адаптировать
  *
  * К примеру на медиа запросе в min-width 640px
  * все изображения в котнтенвом блоке с шириной 500 и больше - убрать флоаты
  *
  * ```
  *  .content-image {
  * 		&--width-500-and-more {
  * 		    include media( 640px ) {
  * 		    	display: block;
  *				float: none !important;
  *				margin-left: auto !important;
  *				margin-right: auto !important;
  * 			}
  * 		}
  *  }
  *
  * ```
  *
  * @sourcecode setTextImageClassSizes
  * @private
  * @param      {Array}   classes  The classes
  * @param      {string}  prefix   The prefix
  * @param      {string}  side     The side
  * @param      {number}  value    The value
  * @return     {undefined}
  */
	function setTextImageClassSizes(classes, prefix, side, value) {
		var classMore = prefix + '--%s-and-more';

		for (var i = 1; i <= 20; i++) {
			var size = i * 100;
			var nextSize = size + 99;
			var modificator = side + '-' + size;

			if (value < size) {
				break;
			}
			if (value > size) {
				classes.push(_helpers.replaceFromArray(classMore, modificator));
			}
		}
	}
	//
	// formValidationConfig
	// флаги
	var is_validation_extended = false,
	    is_validation_translated = false,


	// игнор элементов по селектору
	form_ignore_selectos = ':hidden',


	// классы
	form_class = 'js-form',
	    form_selector = '.' + form_class,
	    form_class__submit = 'js-form-submit',
	    form_selector__submit = '.' + form_class__submit,
	    form_class__reset = 'js-form-reset',
	    form_selector__reset = '.' + form_class__reset,
	    form_selector__input_file = 'input[type="file"]',
	    form_selector__js_file = '.js-form-file',
	    form_selector__js_file__input = form_selector__js_file + '__input',
	    form_selector__js_file__result = form_selector__js_file + '__result',
	    form_class__control_holder = 'control-holder',
	    form_selector__control_holder = '.' + form_class__control_holder,
	    form_class__valid = 'form--valid',
	    form_class__no_valid = 'form--no-valid',
	    form_class__error = 'has-error',
	    form_class__success = 'has-success';

	/**
  * Расширяем конфигурацию плагина `jquery-validate`
  *
  * @sourcecode wHTML:formValidationConfig
  * @memberof   wHTML
  * @tutorial   workwith-jquery-validate
  * @return     {undefined}
  */
	wHTML.prototype.formValidationConfig = function () {
		// если плагин еще не расширялся
		if (is_validation_extended) {
			return;
		}

		// расширяем валидатор
		// параметры по умолчанию
		$.extend($.validator.defaults, {
			// переписываем дефолтные значения
			errorClass: form_class__error,
			validClass: form_class__success,
			controlHolder: form_selector__control_holder,
			inputFile: form_selector__input_file,
			ignore: form_ignore_selectos,

			// метод подсветки ошибок
			highlight: function highlight(element, errorClass, validClass) {
				var $el;
				if (element.type === "radio") {
					$el = this.findByName(element.name);
				} else {
					var $el = $(element);
				}

				$el.add($el.closest(form_selector__control_holder)).addClass(errorClass).removeClass(validClass);
			},

			// метод отключения подсветки ошибок
			unhighlight: function unhighlight(element, errorClass, validClass) {
				var $el;
				if (element.type === "radio") {
					$el = this.findByName(element.name);
				} else {
					var $el = $(element);
				}

				$el.add($el.closest(form_selector__control_holder)).removeClass(errorClass).addClass(validClass);
			},

			// обработчик ошибок
			invalidHandler: function invalidHandler(form, validator) {
				$(this).addClass(form_class__no_valid).data('validator').focusInvalid();
			},

			// обработчик сабмита
			submitHandler: function submitHandler(form) {
				var $currentForm = $(form);
				$currentForm.removeClass(form_class__no_valid).addClass(form_class__valid);
				_self.formValidationOnSubmit($currentForm);
			}
		});

		// фикс вывода пользовательских сообщений
		$.extend($.validator.prototype, {
			defaultMessage: function defaultMessage(element, rule) {
				var method = rule.method;
				var method_name = _formGetMethodMsgName(element, method);
				var message = this.findDefined(this.customMessage(element.name, method), this.customDataMessage(element, method),
				// title is never undefined, so handle empty string as undefined
				!this.settings.ignoreTitle && element.title || undefined, $.validator.messages[method_name], "<strong>Warning: No message defined for " + element.name + "</strong>"),
				    theregex = /\$?\{(\d+)\}/g;
				if (typeof message === "function") {
					message = message.call(this, rule.parameters, element);
				} else if (theregex.test(message)) {
					message = $.validator.format(message.replace(theregex, "{$1}"), rule.parameters);
				}

				return message;
			}
		});

		// добавляем пользовательские правила
		$.extend($.validator.methods, {

			email: function email(value, element) {
				return this.optional(element) || /^(([a-zA-Z0-9\&\+\-\=\_])+((\.([a-zA-Z0-9\&\+\-\=\_]){1,})+)?){1,64}\@([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/.test(value);
			},

			password: function password(value, element) {
				return this.optional(element) || /^\S.*$/.test(value);
			},

			filesize: function filesize(value, element, param) {
				var kb = 0;
				for (var i = 0; i < element.files.length; i++) {
					kb += element.files[i].size;
				}
				return this.optional(element) || kb / 1024 <= param;
			},

			filesizeEach: function filesizeEach(value, element, param) {
				var flag = true;
				for (var i = 0; i < element.files.length; i++) {
					if (element.files[i].size / 1024 > param) {
						flag = false;
						break;
					}
				}
				return this.optional(element) || flag;
			},

			filetype: function filetype(value, element, param) {
				var result;
				param = typeof param === "string" ? param.replace(/,/g, "|") : "png|jpe?g|doc|pdf|gif|zip|rar|tar|html|swf|txt|xls|docx|xlsx|odt";
				if (element.multiple) {
					var files = element.files;
					for (var i = 0; i < files.length; i++) {
						var value = files[i].name;
						result = this.optional(element) || value.match(new RegExp(".(" + param + ")$", "i"));
						if (result === null) {
							break;
						}
					}
				} else {
					var result = this.optional(element) || value.match(new RegExp("\\.(" + param + ")$", "i"));
				}
				return result;
			},

			or: function or(value, element, param) {
				var $module = $(element).parents('.js-form');
				return $module.find('.' + param + ':filled').length;
			},

			word: function word(value, element) {
				return this.optional(element) || /^[a-zA-Zа-яА-ЯіІїЇєёЁЄґҐ\'\`\- ]*$/.test(value);
			},

			login: function login(value, element) {
				return this.optional(element) || /^[0-9a-zA-Zа-яА-ЯіІїЇєЄёЁґҐ][0-9a-zA-Zа-яА-ЯіІїЇєЄґҐ\-\._]+$/.test(value);
			},

			phoneUA: function phoneUA(value, element, param) {
				return this.optional(element) || /^(((\+?)(38))\s?)?(([0-9]{3})|(\([0-9]{3}\)))(\-|\s)?(([0-9]{3})(\-|\s)?([0-9]{2})(\-|\s)?([0-9]{2})|([0-9]{2})(\-|\s)?([0-9]{2})(\-|\s)?([0-9]{3})|([0-9]{2})(\-|\s)?([0-9]{3})(\-|\s)?([0-9]{2}))$/.test(value);
			},

			phone: function phone(value, element, param) {
				return this.optional(element) || /^(((\+?)(\d{1,3}))\s?)?(([0-9]{0,4})|(\([0-9]{3}\)))(\-|\s)?(([0-9]{3})(\-|\s)?([0-9]{2})(\-|\s)?([0-9]{2})|([0-9]{2})(\-|\s)?([0-9]{2})(\-|\s)?([0-9]{3})|([0-9]{2})(\-|\s)?([0-9]{3})(\-|\s)?([0-9]{2}))$/.test(value);
			},

			validTrue: function validTrue(value, element, param) {
				if ($(element).data('valid') === true) {
					return true;
				} else {
					return false;
				}
			}
		});

		// переопределяем методы для работы с дивами
		$.extend($.validator.prototype, {
			init: function init() {
				this.labelContainer = $(this.settings.errorLabelContainer);
				this.errorContext = this.labelContainer.length && this.labelContainer || $(this.currentForm);
				this.containers = $(this.settings.errorContainer).add(this.settings.errorLabelContainer);
				this.submitted = {};
				this.valueCache = {};
				this.pendingRequest = 0;
				this.pending = {};
				this.invalid = {};
				this.reset();

				var groups = this.groups = {},
				    rules;
				$.each(this.settings.groups, function (key, value) {
					if (typeof value === "string") {
						value = value.split(/\s/);
					}
					$.each(value, function (index, name) {
						groups[name] = key;
					});
				});
				rules = this.settings.rules;
				$.each(rules, function (key, value) {
					rules[key] = $.validator.normalizeRule(value);
				});

				function delegate2(event) {
					var validator, form, eventType;
					form = this.form;

					if (!form) {
						form = $(this).closest("div[data-form='true']").get(0);
					}
					validator = $.data(form, "validator");
					eventType = "on" + event.type.replace(/^validate/, "");
					/*this.settings = validator.settings;
     if (this.settings[eventType] && !this.is(this.settings.ignore)) {
     	this.settings[eventType].call(validator, this[0], event);
     }*/
					var settings = validator.settings;
					if (settings[eventType] && !$(this).is(settings.ignore)) {
						settings[eventType].call(validator, this, event);
					}
				}

				$(this.currentForm).on("focusin.validate focusout.validate keyup.validate", ":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'], " + "[type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], " + "[type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'], " + "[type='radio'], [type='checkbox']", delegate2)
				// Support: Chrome, oldIE
				// "select" is provided as event.target when clicking a option
				.on("click.validate", "select, option, [type='radio'], [type='checkbox']", delegate2);

				if (this.settings.invalidHandler) {
					$(this.currentForm).on("invalid-form.validate", this.settings.invalidHandler);
				}

				// Add aria-required to any Static/Data/Class required fields before first validation
				// Screen readers require this attribute to be present before the initial submission http://www.w3.org/TR/WCAG-TECHS/ARIA2.html
				$(this.currentForm).find("[required], [data-rule-required], .required").attr("aria-required", "true");
			}
		});

		// переписываем ститческое правило для работы с дивами
		$.validator.staticRules = function (element) {
			if (element.form) {
				validator = $.data(element.form, "validator");
			} else {
				validator = $.data($(element).closest("div[data-form='true']").get(0), "validator");
			}

			var rules = {},

			//validator = $.data(element.form, "validator");
			validator = validator;

			if (validator.settings.rules) {
				rules = $.validator.normalizeRule(validator.settings.rules[element.name]) || {};
			}
			return rules;
		};

		// включаем флаг, что уже расширили плагин
		is_validation_extended = true;

		// если плагин уже бл переведен или глобального объекта переводву нету - выходим
		if (is_validation_translated || window.validationTranslate === undefined) {
			return false;
		}
		// иначе делаем перевод
		var translateMessages = {};
		for (var key in validationTranslate) {
			var value = validationTranslate[key];
			switch (key) {
				case 'maxlength':
				case 'maxlength_checker':
				case 'maxlength_select':

				case 'minlength':
				case 'minlength_checker':
				case 'minlength_select':

				case 'rangelength':
				case 'rangelength_checker':
				case 'rangelength_select':

				case 'range':
				case 'min':
				case 'max':

				case 'filetype':
				case 'filesize':
				case 'filesizeEach':
				case 'pattern':
					translateMessages[key] = $.validator.format(value);
					break;
				default:
					translateMessages[key] = value;
			}
		}
		$.extend($.validator.messages, translateMessages);

		// включаем флаг, что уже перевели плагин
		is_validation_translated = true;
	};

	$.extend($.fn, {

		// http://jqueryvalidation.org/rules/

		rules: function rules(command, argument) {

			var element = this[0],
			    settings,
			    staticRules,
			    existingRules,
			    data,
			    param,
			    filtered;

			// If nothing is selected, return empty object; can't chain anyway

			if (element == null) {

				return;
			}

			if (command) {

				settings = $.data(element.form, "validator").settings;

				staticRules = settings.rules;

				existingRules = $.validator.staticRules(element);

				switch (command) {

					case "add":

						$.extend(existingRules, $.validator.normalizeRule(argument));

						// Remove messages from rules, but allow them to be set separately

						delete existingRules.messages;

						staticRules[element.name] = existingRules;

						if (argument.messages) {

							settings.messages[element.name] = $.extend(settings.messages[element.name], argument.messages);
						}

						break;

					case "remove":

						if (!argument) {

							delete staticRules[element.name];

							return existingRules;
						}

						filtered = {};

						$.each(argument.split(/\s/), function (index, method) {

							filtered[method] = existingRules[method];

							delete existingRules[method];

							if (method === "required") {

								$(element).removeAttr("aria-required");
							}
						});

						return filtered;

				}
			}

			data = $.validator.normalizeRules($.extend({}, $.validator.classRules(element), $.validator.attributeRules(element), $.validator.dataRules(element), $.validator.staticRules(element)), element);

			// Make sure required is at front

			if (data.required) {

				param = data.required;

				delete data.required;

				data = $.extend({ required: param }, data);

				$(element).attr("aria-required", "true");
			}

			// Make sure remote is at back

			if (data.remote) {

				param = data.remote;

				delete data.remote;

				data = $.extend(data, { remote: param });
			}

			return data;
		}

	});

	/**
  * Инициализация плагина `jquery-validate`
  *
  * @sourcecode wHTML:formValidation
  * @memberof   wHTML
  * @fires      wHTML#formOnSubmit
  * @param      {Element}    [$context] - родительский элемен
  * @return     {undefined}
  */
	wHTML.prototype.formValidation = function ($context) {

		var $forms = $(form_selector, $context);
		if (!$forms.length) {
			return;
		}

		// раширяем при первом ините
		_self.formValidationConfig();

		$forms.each(function (index, el) {
			var $form = $(el);
			var validator = $form.data('validator');

			// если форма инитилась -> выходим
			if (undefined !== validator) {
				return;
			}

			// если элемент `form`
			if ($form.is('form')) {
				$form.on('submit', function (event) {
					return false;
				});
			}

			// конфиг для каждой формы
			var validateConfig = {};

			// если нужна последовательная подсветка ошибок, а не всех сразу
			// добавь к форме data-errors-by-step="true"
			if ($form.data('errors-by-step') === true) {
				_formErrorsByStep(validateConfig);
			}

			// инитим плагин
			$form.validate(validateConfig);

			// если форма - блок
			if ($form.is('div')) {
				$form
				// сабмит
				.on('click', form_selector__submit, function (event) {
					$form.submit();
				})
				// ресет
				.on('click', form_selector__reset, function (event) {
					_self.formValidationReset($form);
				});
			}

			// файл
			$form.on('change', form_selector__input_file, function (event) {
				var $this = $(this);
				var $jsFile = $this.closest(form_selector__js_file);

				if ($jsFile.length) {
					_self.formJsChangeFile($this, $jsFile);
				} else {
					_self.formValidationValid($this);
				}
			});
		});
	};
	/**
  * Принудительная валидация элемента
  *
  * @sourcecode wHTML:formValidationValid
  * @memberof   wHTML
  * @requires   {@link jQueryExtends.getMyElements }
  * @param      {Element}   $element  текущий элемент
  * @return     {boolean}
  */
	wHTML.prototype.formValidationValid = function ($element) {
		var element = $element[0];
		var $form = $element.getMyElements('$myForm', form_selector, 'closest');

		return $form.data('validator').element(element);
	};

	/**
  * Сброс формы-дива
  *
  * @sourcecode wHTML:formValidationReset
  * @memberof   wHTML
  * @requires   {@link jQueryExtends.getMyElements }
  * @requires   {@link jQueryExtends.changeMyText }
  * @param      {Element}   $form - текущая форма
  * @return     {undefined}
  */
	wHTML.prototype.formValidationReset = function ($form) {
		var form = $form[0];
		var formValidator = $form.data('validator');
		var settings = formValidator.settings;

		formValidator.resetForm();

		_formResetInputs(settings, $form.find('input'));
		_formResetInputs(settings, $form.find('textarea'));
		_formResetSelects(settings, $form.find('select'));

		var $jsFiles = $form.getMyElements('$jsFiles', form_selector__js_file__result, 'find');

		$jsFiles.each(function (index, el) {
			$(this).changeMyText();
		});

		$form.removeClass(form_class__valid).removeClass(form_class__no_valid);
	};

	/**
  * Событие, после успешной валидации формы и отправки данных.
  *
  * @sourcecode wHTML:formValidationAfterSubmit
  * @memberof   wHTML
  * @event      wHTML#formValidationAfterSubmit
  * @param      {Element}   $form - текущая форма, `jQuery element`
  * @param      {Object}    response - ответ по текущей форме
  * @return     {undefined}
  */
	wHTML.prototype.formValidationAfterSubmit = function ($form, response) {
		$.magnificPopup.close();
		console.info('HTML => Форма отправлена', response);
	};
	/**
  * JS подхват перед загрузкой фалов.
  *  Метод используеться для кастоных кнопок
  *  аля "upload file".
  *  Основная задача:
  *
  * - Определить прошел ли файл валидацию
  * - Есть ли файлы (валидацию может пройти и пустой `input[file]`, если он не `required`)
  * - Получить нужные данные для показа - имя / размер / количество и тд
  * - Вывести полченную инфу на элемент
  *
  * Выводим при помощи вспомогательных методов
  *  (смотри requires'ы и их описания)
  *
  *
  * @sourcecode wHTML:formJsChangeFile
  * @memberof   wHTML
  * @requires   {@link jQueryExtends.getMyElements }
  * @requires   {@link jQueryExtends.changeMyText }
  * @requires   {@link wHelpers.setThousands }
  * @param      {Element}   $element  input[type="file"]
  * @param      {Element}   $jsFile   родительский блок
  * @return     {undefined}
  */
	wHTML.prototype.formJsChangeFile = function ($element, $jsFile) {

		var isValid = _self.formValidationValid($element);
		var $inputResult = $jsFile.getMyElements('$inputResult', form_selector__js_file__result, 'find');

		if (!isValid) {
			$inputResult.changeMyText();
			return false;
		}

		var fileList = $element[0].files;
		if (!fileList.length) {
			$inputResult.changeMyText();
			return false;
		}

		var names = [];
		var sizes = 0;
		for (var i = 0; i < fileList.length; i++) {
			var file = fileList[i];
			names.push(file.name);
			sizes += file.size;
		}

		sizes = (sizes / 1024).toFixed(2);
		sizes = _helpers.setThousands(sizes) + 'kb';

		if (names.length > 1) {
			names = names.length;
		} else {
			names = names[0];
			names = '<span class="_ellipsis" title="' + names + '">' + names + '</span>';
		}

		$inputResult.changeMyText('changed', [names, sizes]);
	};

	/** @private */
	function _formGetTypeName(type) {
		var type_name;
		switch (type) {
			case 'select-one':
			case 'select-multiple':
				type_name = '_select';
				break;
			case 'radio':
			case 'checkbox':
				type_name = '_checker';
				break;
			default:
				type_name = '';
		}
		return type_name;
	}

	/** @private */
	function _formGetMethodMsgName(element, method) {
		var method_name;
		switch (method) {
			case 'required':
			case 'maxlength':
			case 'minlength':
			case 'rangelength':
				method_name = method + _formGetTypeName(element.type);
				break;
			default:
				method_name = method;
		}
		return method_name;
	}

	/** @private */
	function _formErrorsByStep(validateConfig) {
		validateConfig.showErrors = function (errorMap, errorList) {
			if (errorList.length) {
				var firstError = errorList.shift();
				var newErrorList = [];
				newErrorList.push(firstError);
				this.errorList = newErrorList;
			}
			this.defaultShowErrors();
		};
	}

	/** @private */
	function _formResetInputs(settings, elements) {
		for (var i = 0; i < elements.length; i++) {
			var element = elements[i];
			var $element = $(element);

			if ($element.hasClass('js-form-element-noreset')) {
				continue;
			}

			switch (element.type) {
				case 'submit':
				case 'reset':
				case 'button':
				case 'image':
					break;

				case 'radio':
				case 'checkbox':
					element.checked = element.defaultChecked;
					$element.trigger('change');
					break;

				case 'file':
					element.outerHTML = element.outerHTML;
					$element.trigger('change');
					break;

				default:
					element.value = element.defaultValue;
					$element.trigger('change');
			}
		}
	}

	/** @private */
	function _formResetSelects(settings, elements) {
		for (var i = 0; i < elements.length; i++) {
			[].forEach.call(elements[i].options, function (element) {
				element.selected = element.defaultSelected;
			});
		}
	}

	//
	/**
  * Замена значений в строке по паттерну из массива.
  *
  * Паттерн в строке один, с определенным количеством повторений
  * 	Каждый элемент из массива заменить свой паттерн по порядковому номеру
  *
  * К примеру _replaceFromArray( '%s мыла %s', ['Мама', 'раму'] )
  * 	вернет - 'Мама мыла раму'
  *
  *
  * @sourcecode wHelpers:replaceFromArray
  * @memberof   wHelpers
  * @param      {string}   replacingString - Строка в которой будем менять
  * @param      {Array}    values - массив значений
  * @param      {string}   [pattern="%s"] - паттерн для поиска
  * @return     {string}   Заменненая строка
  */
	wHelpers.prototype.replaceFromArray = function (replacingString, values, pattern) {

		pattern = pattern || '%s';
		if (!Array.isArray(values)) {
			values = [values];
		}

		for (var i = 0; i < values.length; i++) {
			var value = values[i];
			replacingString = replacingString.replace(pattern, value);
		}

		return replacingString;
	};

	/**
  * Установка пробелов между тысячами:
  *
  * ```
  *  153      ->  153
  *  7000     ->  7 000
  *  8500.50  ->  8 500.50
  *  7530.00  ->  7 530
  *  1000000  ->  1 000 000
  *
  * ```
  *
  * @sourcecode wHelpers:setThousands
  * @memberof   wHelpers
  * @param      {string|number}  numberText - число для формата
  * @param      {string}         [newSeparator="."] - новый разделитель, при необходимости
  * @param      {string}         [separator="."] - разделитель дробей
  * @return     {string}
  */
	wHelpers.prototype.setThousands = function (numberText, newSeparator, separator) {

		newSeparator = newSeparator || '.';
		separator = separator || '.';
		numberText = '' + numberText;
		numberText = numberText.split(separator);

		var numberPenny = numberText[1] || '';
		var numberValue = numberText[0];

		var thousandsValue = [];
		var counter = 0;

		for (var i = numberValue.length - 1; i >= 0; i--) {
			var num = numberValue[i];
			thousandsValue.push(num);

			if (++counter === 3 && i) {
				thousandsValue.push(' ');
				counter = 0;
			}
		}

		thousandsValue = thousandsValue.reverse().join('');
		if (numberPenny.length) {
			return [thousandsValue, numberPenny].join(newSeparator);
		}
		return thousandsValue;
	};

	//custom methods
	//include _partials/menu.js
	//include _partials/carousel.js
	wHTML.prototype.sort = function () {

		$('.js-catalogSort', 'body').each(function (i, el) {
			var $catalogSort = $(el);
			var url = window.location.href.split('?')[0];

			$catalogSort.on('change', 'select, input', function () {
				window.location.href = url + '?' + composeGetParameters($catalogSort.find('select,input:checked'));
			});
		});

		function composeGetParameters($el) {
			var parameters = $.map($el, function (el, i) {
				var $el = $(el);

				var name = $el.attr('name');
				var value = $el.val();
				var dataType = $el.find('option:selected').data('type');

				return (value ? name + '=' + value : '') + (dataType ? '&type=' + dataType : '');
			});

			return parameters.join('&');
		}
	};
	//include _partials/filter.js
	wHTML.prototype.accardion = function () {

		$('.js-accardWrap').on('click', '.js-accardLink', function (e) {
			e.preventDefault();
			var el = $(this),
			    $item = el.closest('.js-accardItem'),
			    $wrap = el.closest('.js-accardWrap'),
			    $content = $item.find('.js-accardContent');
			var accard = $wrap.attr('data-accard') || false;

			if (!accard) {
				el.toggleClass('has-open');
				$content.slideToggle(300);
				return false;
			}

			if (el.hasClass('has-open')) {
				el.removeClass('has-open');
				$item.removeClass('has-open');
				$content.slideUp(300);
			} else {
				$wrap.find('.js-accardLink').removeClass('has-open');
				$wrap.find('.js-accardItem').removeClass('has-open');
				$wrap.find('.js-accardContent').slideUp(300);
				el.addClass('has-open');
				$item.addClass('has-open');
				$content.slideDown(300);
			}
		});
	};
	//include _partials/tabs.js
	wHTML.prototype.toggleShow = function () {

		$('.js-downListWrap').on('click', '.js-downListLink', function (e) {
			e.preventDefault();
			var el = $(this),
			    $wrap = el.closest('.js-downListWrap'),
			    $content = $wrap.find('.js-downListContent');

			if ($wrap.hasClass('has-active')) {
				$wrap.removeClass('has-active');
				$content.slideUp();
			} else {
				$('.js-downListWrap').removeClass('has-active');
				if (!responsive) {
					$('.js-downListWrap').not('[data-type=inMobile]').find('.js-downListContent').slideUp();
				} else {
					$('.js-downListContent').slideUp();
				}

				$wrap.addClass('has-active');
				$content.slideToggle();
			}
		});

		$(document).on('click', function (e) {
			if (!$('.js-downListWrap').has(e.target).length) {
				var $downWrap = $('.js-downListWrap').not('[data-type=inMobile]');
				$downWrap.removeClass('has-active').find('.js-downListContent').slideUp();
			}
		});
	};

	//animation
	wHTML.prototype.graph = function (controller) {

		var timerAnimagraphItem = 1;
		var tweenGraphItem = TweenMax.from('.js-graphItem .graph__cnt', timerAnimagraphItem, {
			height: 0,
			autoAlpha: 0,
			ease: Linear.easeNone
		});

		var graphItem = new ScrollMagic.Scene({
			triggerElement: '.js-graphItem',
			triggerHook: 0.3,
			offset: -300
		}).setTween(tweenGraphItem)
		//.addIndicators()
		.addTo(controller);
	};

	wHTML.prototype.lineStep = function (controller) {
		if ($('.js-stepLine').length) {
					var $line = $('.js-stepLine'),
		    $lineWrap = $('.js-stepLineWrap');

		constructorLine();

		var lineScene = new ScrollMagic.Scene({
			triggerElement: $lineWrap[0],
			duration: $lineWrap.height(),
			triggerHook: 0.7
		})
		//.addIndicators()
		.addTo(controller).on("progress", function (e) {
			$line.height(e.progress * 100 + '%');
		});

		$('.step__item').each(function (i, el) {
			new ScrollMagic.Scene({
				triggerElement: el,
				triggerHook: 0.7,
				reverse: true
			}).setClassToggle(el, 'has-active')
			//.addIndicators()
			.addTo(controller);
		});

		$(window).on('resize', function () {
			constructorLine();
			lineScene.duration($lineWrap.height());
		});

		function constructorLine() {
			var step1Height = $('.step1')[0].clientHeight,
			    step2Height = $('.step2')[0].clientHeight,
			    step3Height = $('.step3')[0].clientHeight,
			    stepItemHeight = $('.step__item')[0].offsetHeight;
			var lineWrapHeight = step1Height + step2Height + step3Height;
			var stepItem2Position = $('.step2').position().top,
			    stepItem3Position = $('.step3').position().top + 130;

			$lineWrap.height(lineWrapHeight + stepItemHeight);

			$('.step__item--2').css('top', stepItem2Position + 20);
			$('.step__item--3').css('top', stepItem3Position);
		}
		}

	};

	wHTML.prototype.story = function (controller) {
		var $layaut = $('.js-story'),
		    $layautWrap = $('.js-storyWrap'),
		    $cntWrap = $('.js-storyCnt');
		var winHeight,
		    offset = $('.js-storyCnt').innerHeight() + 20;

		setLayautHeight();

		//fix layaut
		var sceneStoryLayaut = new ScrollMagic.Scene({
			triggerElement: $layautWrap[0],
			//offset: winHeight + 20,
			offset: $('.js-story').innerHeight(),
			duration: $layautWrap.height() - (winHeight + 20),
			triggerHook: 1.0,
			reverse: true
		})
		//.addIndicators()
		.addTo(controller).on("start end", function (e) {
			var direction = e.type == "start" ? "toTop" : "toBottom";

			if (direction == 'toBottom') {
				$layaut.addClass('has-toTop');
			} else {
				$layaut.removeClass('has-toTop');
			}
		}).on("enter leave", function (e) {
			var status = e.type == "enter" ? "inside" : "outside";

			if (status == 'inside') {
				$layaut.addClass('has-fixed');
			} else {
				$layaut.removeClass('has-fixed');
			}
		});
/*
		// ANiMATE STORY
		var layautHeight = $layautWrap.height();
		var offsetScene2 = 0.4 * layautHeight,
		    offsetScene3 = 0.6 * layautHeight,
		    offsetScene4 = 0.8 * layautHeight;

		TweenMax.set(['.story__icon--1'], { autoAlpha: 0 });
		TweenMax.set(['.story__icon--2'], { autoAlpha: 0 });
		TweenMax.set(['.story__bubble'], { autoAlpha: 0 });

		var $storyLine1 = $(".story_path1");
		var $storyLine2 = $(".story_path2");

		pathPrepare($storyLine1);
		pathPrepare($storyLine2);

		var el1Ofset = parseInt($storyLine1.css('stroke-dashoffset'));
		$storyLine1.css('stroke-dashoffset', el1Ofset * 2 + 'px');

		var el2Ofset = parseInt($storyLine2.css('stroke-dashoffset'));
		$storyLine2.css('stroke-dashoffset', el2Ofset * 2 + 'px');

		//SCENE2
		var scene2 = new ScrollMagic.Scene({
			triggerElement: $layautWrap[0],
			offset: offsetScene2,
			triggerHook: 0.7,
			reverse: true
		})
		//.addIndicators()
		.addTo(controller).on("enter leave", function (e) {
			var state = e.type == "enter" ? "inside" : "outside";
			if (state == 'inside') {
				setStoryStep(2);
			} else {
				setStoryStep(1);
			}
		});

		//SCENE3
		var scene3 = new ScrollMagic.Scene({
			triggerElement: $layautWrap[0],
			offset: offsetScene3,
			triggerHook: 0.7,
			reverse: true
		})
		//.addIndicators()
		.addTo(controller).on("enter leave", function (e) {
			var state = e.type == "enter" ? "inside" : "outside";
			if (state == 'inside') {
				setStoryStep(3);
			} else {
				setStoryStep(2);
			}
		});

		var icon1Scene3 = new ScrollMagic.Scene({
			triggerElement: $layautWrap[0],
			offset: offsetScene3,
			duration: 350,
			triggerHook: 0.7
		}).setTween(".story__icon--1", {
			// top: '18%',
			// left: '-52%',
			autoAlpha: 1,
			ease: Linear.easeNone
		})
		//.addIndicators()
		.addTo(controller);



		var icon2Scene3 = new ScrollMagic.Scene({
			triggerElement: $layautWrap[0],
			offset: offsetScene3,
			duration: 350,
			triggerHook: 0.7
		}).setTween(".story__icon--2", {
			// top: '18%',
			// left: '174%',
			autoAlpha: 1,
			ease: Linear.easeNone
		})
		//.addIndicators()
		.addTo(controller);

		var dash1Scene3 = new ScrollMagic.Scene({
			triggerElement: $layautWrap[0],
			offset: offsetScene3 + 150,
			duration: 350,
			triggerHook: 0.7
		}).setTween(".story_path1", {
			strokeDashoffset: el1Ofset,
			ease: Linear.easeNone
		})
		//.addIndicators()
		.addTo(controller);

		var dash1Scene3 = new ScrollMagic.Scene({
			triggerElement: $layautWrap[0],
			offset: offsetScene3 + 150,
			duration: 350,
			triggerHook: 0.7
		}).setTween(".story_path2", {
			strokeDashoffset: el2Ofset,
			ease: Linear.easeNone
		})
		//.addIndicators()
		.addTo(controller);

		//SCENE4
		var scene4 = new ScrollMagic.Scene({
			triggerElement: $layautWrap[0],
			offset: offsetScene4,
			triggerHook: 0.7,
			reverse: true
		})
		//.addIndicators()
		.addTo(controller).on("enter leave", function (e) {
			var state = e.type == "enter" ? "inside" : "outside";
			if (state == 'inside') {
				setStoryStep(3);
			} else {
				setStoryStep(2);
			}
		});

		var bubleScene4 = new ScrollMagic.Scene({
			triggerElement: $layautWrap[0],
			offset: offsetScene4,
			duration: 350,
			triggerHook: 0.7
		}).setTween(".story__bubble", {
			autoAlpha: 1,
			scale: 1,
			ease: Linear.easeNone
		})
		//.addIndicators()
		.addTo(controller);

		var faceScene4 = new ScrollMagic.Scene({
			triggerElement: $layautWrap[0],
			offset: offsetScene4,
			triggerHook: 0.7
		}).setClassToggle('.js-storyFace', 'has-active')
		//.addIndicators()
		.addTo(controller);
*/
		$(window).on('resize', function () {
			setLayautHeight();
			sceneStoryLayaut.offset($('.js-story').innerHeight());
		});

		function setStoryStep(step) {
			$('.js-storyPagination [data-item]').removeClass('has-active');
			$('.js-storyPagination [data-item=' + step + ']').addClass('has-active');

			$('.js-storyContent [data-item]').removeClass('has-active');
			$('.js-storyContent [data-item=' + step + ']').addClass('has-active');
		}
		function setLayautHeight() {
			winHeight = $(window).height() - $('.js-fixHeader').innerHeight();
			$layaut.height(winHeight);
		}
	};
	wHTML.prototype.wheel = function (controller) {

		var wheelScene1 = new ScrollMagic.Scene({
			triggerElement: ".diagram_step",
			duration: $('.diagram_step').height(),
			triggerHook: 0.5
		}).setTween(".js-wheelItem1", {
			rotation: 360,
			// repeat: -1,
			ease: Linear.easeNone
		})
		//.addIndicators()
		.addTo(controller);
/*
	var mobile_menu_button_scene = new ScrollMagic.Scene({
		triggerElement: "#menuBack",
		duration: 0,
		triggerHook: 1.0
	}).setClassToggle('.mobile__button span','greenMenuButton').addTo(controller);
	*/

		var wheelScene2 = new ScrollMagic.Scene({
			triggerElement: ".diagram_step",
			duration: $('.diagram_step').height(),
			triggerHook: 0.5
		}).setTween(".js-wheelItem2", {
			rotation: -360,
			// repeat: -1,
			ease: Linear.easeNone
		})
		//.addIndicators()
		.addTo(controller);
	};
	wHTML.prototype.blade = function (controller) {

		var bladeList = $('.js-blade i');

		bladeList.each(function (i, el) {
			var tweenBlade = new TweenMax.to(el, 2, {
				rotation: 360,
				repeat: -1,
				ease: Linear.easeNone
			});

			var bladeScene = new ScrollMagic.Scene({
				triggerElement: '.diagram_step',
				duration: $('.diagram_step').height(),
				triggerHook: 1
			}).setTween(tweenBlade)
			//.addIndicators()
			.addTo(controller);
		});
	};
	wHTML.prototype.speedo = function (controller) {

		// speedoArr1
		var speedoLIne1 = new TimelineMax();

		speedoLIne1.to('.js-speedoArr1 i', 10, {
			rotation: 385,
			//repeat: -1,
			ease: Linear.easeNone
		});

		var bladeScene1 = new ScrollMagic.Scene({
			triggerElement: '.partners__footer',
			//duration: $(window).height() + $('.partners__footer').height(),
			triggerHook: 0.5
		}).setTween(speedoLIne1)
		//.addIndicators()
		.addTo(controller);

		// speedoArr1
		var speedoLIne2 = new TimelineMax();

		speedoLIne2.to('.js-speedoArr2 i', 2, {
			rotation: 385,
			//repeat: -1,
			ease: Linear.easeNone
		}).to('.js-speedoArr2 i', 0.1, {
			rotation: 380,
			repeat: -1,
			yoyo: true,
			ease: Linear.easeNone
		});

		var bladeScene2 = new ScrollMagic.Scene({
			triggerElement: '.partners__footer',
			//duration: $(window).height() + $('.partners__footer').height(),
			triggerHook: 0.5
		}).setTween(speedoLIne2)
		//.addIndicators()
		.addTo(controller);
	};

			wHTML.prototype.work = function (controller) {
					if ($('.work_line').length) {
		var $lineWork1 = $(".work_line");
		var $line1Work1 = $(".work_line1");
		var $line2Work1 = $(".work_line2");

		pathPrepare($lineWork1);
		pathPrepare($line1Work1);
		pathPrepare($line2Work1);

		//main
		var elOfset = parseInt($lineWork1.css('stroke-dashoffset'));
		$lineWork1.css('stroke-dashoffset', elOfset * 2 + 'px');

		var lineTween = TweenMax.to($lineWork1, 1, {
			strokeDashoffset: elOfset,
			ease: Linear.easeNone
		});

		var lineScene = new ScrollMagic.Scene({
			triggerElement: ".work__main",
			duration: 200,
			triggerHook: 0.7,
			tweenChanges: true
		}).setTween(lineTween)
		//.addIndicators()
		.addTo(controller);

		//line1
		var el1Ofset = parseInt($line1Work1.css('stroke-dashoffset'));
		$line1Work1.css('stroke-dashoffset', 0);

		var line1Tween = TweenMax.to($line1Work1, 1, {
			strokeDashoffset: el1Ofset,
			ease: Linear.easeNone
		});

		var line1Scene = new ScrollMagic.Scene({
			triggerElement: ".work__img--type1",
			duration: $('.work__img--type1').height(),
			triggerHook: 0.4,
			tweenChanges: true
		}).setTween(line1Tween)
		//.addIndicators()
		.addTo(controller);

		var el2Ofset = parseInt($line2Work1.css('stroke-dashoffset'));
		$line2Work1.css('stroke-dashoffset', el2Ofset * 2 + 'px');

		var line2Tween = TweenMax.to($line2Work1, 1, {
			strokeDashoffset: el2Ofset,
			ease: Linear.easeNone
		});

		var line2Scene = new ScrollMagic.Scene({
			triggerElement: ".work__img--type2",
			duration: $('.work__img--type2').height(),
			triggerHook: 0.4,
			tweenChanges: true
		}).setTween(line2Tween)
		//.addIndicators()
		.addTo(controller);
	}
	};


	wHTML.prototype.animaDash = function (controller) {

		var lineList = $('.js-animaDash');

		lineList.each(function (i, el) {
			var $line = $(el).find('.js-lineDash');

			new ScrollMagic.Scene({
				triggerElement: el,
				duration: $(window).height() * 2,
				offset: -$(window).height(),
				triggerHook: 0.5,
				reverse: true
			}).setClassToggle($line[0], 'has-animaDash')
			//.addIndicators()
			.addTo(controller);
		});
	};

	wHTML.prototype.coin = function (controller) {

		var coinScene = new ScrollMagic.Scene({
			triggerElement: ".token__icon",
			duration: 500,
			triggerHook: 0.6
		}).setTween(".js-coin", {
			top: '93%',
			ease: Linear.easeNone
		})
		//.addIndicators()
		.addTo(controller);
	};

	wHTML.prototype.indicator = function (controller) {

		var lineIndicator = new ScrollMagic.Scene({
			triggerHook: 0
		})
		//.addIndicators()
		.addTo(controller).on("progress", function (e) {
			$('.js-lineIndex').width(e.progress * 100 + '%');
		});
		//use window duration
		var durationValueCache;

		$(window).on("resize", updateDuration); // update the duration when the window size changes
		$(window).triggerHandler("resize"); // set to initial value
		lineIndicator.duration(getDuration); // supply duration method

		function getDuration() {
			return durationValueCache;
		}
		function updateDuration(e) {
			durationValueCache = $(document).height() - $(window).height();
		}
	};
	wHTML.prototype.table = function (controller) {
		var tweenTable = TweenMax.staggerFrom('.js-table .table__column', 0.3, {
			height: 0,
			autoAlpha: 0,
			ease: Linear.easeNone
		}, 0.3);

		var tableScene = new ScrollMagic.Scene({
			triggerElement: '.js-table',
			triggerHook: 0.7,
			offset: -300
		}).setTween(tweenTable)
		//.addIndicators()
		.addTo(controller);
	};
	wHTML.prototype.restAnima = function (controller) {
		var restScene1 = new ScrollMagic.Scene({
			triggerElement: ".rest",
			duration: 500,
			triggerHook: 0.5
		}).setTween("#restImg1", {
			top: '-21%',
			right: '-35%'
		})
		//.addIndicators()
		.addTo(controller);

		var restScene2 = new ScrollMagic.Scene({
			triggerElement: ".rest",
			duration: 500,
			triggerHook: 0.5
		}).setTween("#restImg2", {
			bottom: '5%',
			left: '-40%'
		})
		//.addIndicators()
		.addTo(controller);
	};
	wHTML.prototype.brick = function (controller) {
		var brickTimeline = new TimelineMax();

		brickTimeline.staggerFrom('.brick__column--type1 .brick__item', 0.1, {
			autoAlpha: 0,
			top: '20px',
			ease: Linear.easeNone
		}, 0.1).from('.brick__column--type1 .brick__text', 0.1, {
			autoAlpha: 0
		}).staggerFrom('.brick__column--type2 .brick__item', 0.1, {
			autoAlpha: 0,
			top: '20px',
			ease: Linear.easeNone
		}, 0.1).from('.brick__column--type2 .brick__text', 0.1, {
			autoAlpha: 0
		}).staggerFrom('.brick__column--type3 .brick__item', 0.1, {
			autoAlpha: 0,
			top: '20px',
			ease: Linear.easeNone
		}, 0.1).from('.brick__column--type3 .brick__text', 0.1, {
			autoAlpha: 0
		}).staggerFrom('.brick__column--type4 .brick__item', 0.1, {
			autoAlpha: 0,
			top: '20px',
			ease: Linear.easeNone
		}, 0.1).from('.brick__column--type4 .brick__text', 0.1, {
			autoAlpha: 0
		}).staggerFrom('.brick__column--type5 .brick__item', 0.1, {
			autoAlpha: 0,
			top: '20px',
			ease: Linear.easeNone
		}, 0.1).from('.brick__column--type5 .brick__text', 0.1, {
			autoAlpha: 0
		});

		var brickScene = new ScrollMagic.Scene({
			triggerElement: '.js-brick',
			triggerHook: 0.6,
			offset: -150
		}).setTween(brickTimeline)
		//.addIndicators()
		.addTo(controller);
	};


		wHTML.prototype.wrongLine = function (controller) {
			if ($('.path1').length) {
		var $line1 = $(".path1");
		var $line2 = $(".path2");
		var $line3 = $(".path3");

		// prepare SVG
		pathPrepare($line1);
		pathPrepare($line2);
		pathPrepare($line3);

		var line1Tween = TweenMax.from($line1, 1, {
			strokeDashoffset: 0,
			ease: Linear.easeNone
		});

		var el2Ofset = parseInt($line2.css('stroke-dashoffset'));
		$line2.css('stroke-dashoffset', el2Ofset * 2 + 'px');
		var line2Tween = TweenMax.to($line2, 1, {
			strokeDashoffset: el2Ofset,
			ease: Linear.easeNone
		});

		var line3Tween = TweenMax.from($line3, 1, {
			strokeDashoffset: 0,
			ease: Linear.easeNone
		});

		var line1Scene = new ScrollMagic.Scene({
			triggerElement: ".wrong__img--item1",
			duration: 400,
			triggerHook: 0.3,
			tweenChanges: true
		}).setTween(line1Tween)
		//.addIndicators() // add indicators (requires plugin)
		.addTo(controller);

		var line2Scene = new ScrollMagic.Scene({
			triggerElement: ".wrong__img--item2",
			duration: 400,
			triggerHook: 0.3,
			tweenChanges: true
		}).setTween(line2Tween)
		//.addIndicators() // add indicators (requires plugin)
		.addTo(controller);

		var line3Scene = new ScrollMagic.Scene({
			triggerElement: ".wrong__img--item3",
			duration: 400,
			triggerHook: 0.3,
			tweenChanges: true
		}).setTween(line3Tween)
		//.addIndicators() // add indicators (requires plugin)
		.addTo(controller);
	}
	};

	wHTML.prototype.libra = function (controller) {
		var libraScene1 = new ScrollMagic.Scene({
			triggerElement: ".libra",
			duration: 500,
			triggerHook: 0.7
		}).setTween("#libra1", {
			top: '-45px'

		})
		//.addIndicators()
		.addTo(controller);

		var libraScene2 = new ScrollMagic.Scene({
			triggerElement: ".libra",
			duration: 500,
			triggerHook: 0.7
		}).setTween("#libra2", {
			top: '16px'

		})
		//.addIndicators()
		.addTo(controller);

		var libraScene3 = new ScrollMagic.Scene({
			triggerElement: ".libra",
			duration: 500,
			triggerHook: 0.7
		}).setTween("#libraLine", {
			rotation: '15deg'

		})
		//.addIndicators()
		.addTo(controller);
	};
	wHTML.prototype.svgMorph = function (controller) {

		$('.js-morph').each(function (i, el) {
			var $el = $(el),
			    $start = $el.find('svg .morf_start'),
			    $finish = $el.find('svg .morf_finish');

			// classMorph = '.morf' + i,
			// classStart = '.start' + i,
			// classFinish = '.finish' + i;

			var duration = 2500 + getRandomArbitary(0, 1000);
			var start = true;

			KUTE.defaultOptions = {
				reverseFirstPath: true,
				reverseSecondPath: true
			};

			var tween = KUTE.to($start[0], {
				path: $finish[0]

			}, {
				morphPrecision: 15,
				morphIndex: 127,
				reverseFirstPath: true,
				reverseSecondPath: true,

				duration: duration,
				easing: 'easeInElastic',
				repeat: Infinity,
				yoyo: true
			});

			var MorfScene = new ScrollMagic.Scene({
				triggerElement: el,
				duration: 1.5 * $(window).height() + $el.height(),
				triggerHook: 0.2,
				offset: -$(window).height()
			})
			//.addIndicators()
			.addTo(controller).on("enter leave", function (e) {
				if (e.type == "enter") {
					start ? tween.start() : tween.resume();
					start = false;
				} else {
					tween.pause();
				}
			});
		});

		function getRandomArbitary(min, max) {
			return Math.random() * (max - min) + min;
		}
	};
	wHTML.prototype.showBlock = function (controller) {

		var blockList = $('.js-showBlock');

		// prepare bloks
		// $('.js-showBlock').each(function(i,el){
		//     $(el).css({
		//         position: 'relative',
		//
		//     })
		//     TweenMax.set(el, {
		//         top: 40,
		//         autoAlpha: 0
		//     });
		// });

		blockList.each(function (i, el) {
			var $el = $(el);
			var start = true;

			new ScrollMagic.Scene({
				triggerElement: el,
				triggerHook: 0.8,
				reverse: true
			})
			//.addIndicators()
			.addTo(controller).on('enter ', function (e) {
				if (!start) return;

				var tween = TweenMax.to(el, 0.5, {
					top: 0,
					autoAlpha: 1,
					ease: Linear.easeNone
				});
				start = false;
			});
		});
	};

	wHTML.prototype.progress = function (controller) {

		var $wrap = $('.js-progress'),
		    $line = $('.js-progressLine'),
		    itemList = $('.js-progressItem');
		var maxWidth = $line.data('max-width');

		TweenMax.set('.js-progressItem', {
			autoAlpha: 0,
			x: 50, y: 50
		});

		var lineScene = new ScrollMagic.Scene({
			triggerElement: $wrap[0],
			triggerHook: 0.9
		})
		//.addIndicators()
		.addTo(controller).setTween($line[0], {
			width: maxWidth,
			ease: Linear.easeNone
		});
		// .on('progress',function(e){
		//     if (e.progress  == 1){
		//         lineScene.remove();
		//     }
		// })


		var itemScene = new ScrollMagic.Scene({
			triggerElement: $wrap[0],
			triggerHook: 0.9
		})
		//.addIndicators()
		.addTo(controller).setTween('.js-progressItem', {
			autoAlpha: 1,
			x: 0, y: 0,
			ease: Linear.easeNone
		});
		// .on('progress',function(e){
		//     if (e.progress  == 1){
		//         itemScene.remove();
		//     }
		// })

	};

	window.wHTML = new wHTML();
	window.wHelpers = new wHelpers();
})(window, jQuery);

//===================================================================================

var server_addr = 'https://task.sponsy.org/Sponsy/Receiver';

function setupVisibility() {
	$.ajax('saleData.json',{
		method:'get',
		dataType:'json',
		contentType:'application/json'
	}).done(function(response) {
		produceVisibility(response);
	})
	.fail(function(jjj,status) {
		console.log('fail_ajax_visibility: '+status);
	})

}

$('#qq_button').click(function(event) {
alert('QQ Group id : 300590237');
});

$('.telegramFixedButton').click(function() {
	gtag('event', 'chatFixed', {
		'event_category':'joinChat'
	});
})

$('.chatLink.communities-row-link').click(function(event) {
	gtag('event', 'chatUpperRed', {
		'event_category':'joinChat'
	});
});

$('#getAppTechButton').click(function(event) {
	gtag('event', 'getAppTech', {
		'event_category':'getApp'
	});
});

$('#getAppUpperButton').click(function(event) {
	gtag('event', 'getAppUpper', {
		'event_category':'getApp'
	});
});

$('#githubtechButton').click(function(event) {
	gtag('event', 'Github', {
		'event_category':'Document'
	});
});

$('#getAppOnTheGoButton').click(function(event) {
	gtag('event', 'getApp-On-The-Go', {
		'event_category':'getApp'
	});
});

$('#spon .contact__social-item a').click(function() {
	gtag('event', 'SocialOpenUpper', {
		'event_category':'Social'
	});
	if ($(this).attr('href').indexOf("t.me") != -1) {
		gtag('event', 'chatBlueUpper', {
			'event_category':'joinChat'
		});
	}
});

$('#contact .contact__social-item a').click(function() {
	gtag('event', 'SocialOpenBottom', {
		'event_category':'Social'
	});
	if ($(this).attr('href').indexOf("t.me") != -1) {
		gtag('event', 'chatBlueBottom', {
			'event_category':'joinChat'
		});
	}
});

$('#header__menu-content .contact__social-item a').click(function() {
	gtag('event', 'SocialOpenMenu', {
		'event_category':'Social'
	});
	console.log('event');
});

$('#spon .spon__wp a').click(function() {
	gtag('event', 'WPUpper', {
		'event_category':'WP'
	});
	console.log('event');
});

$('.invest__item--type1 a').click(function() {
	gtag('event', 'WPDocuments', {
		'event_category':'WP'
	});
	console.log('event');
});

$('.invest__item--type2 a').click(function() {
	gtag('event', 'OnePager', {
		'event_category':'Document'
	});
	console.log('event');
});

$('.invest__item--type3 a').click(function() {
	gtag('event', 'Presentation', {
		'event_category':'Document'
	});
	console.log('event');
});

$('.invest__item--type4 a').click(function() {
	gtag('event', 'MarketResearch', {
		'event_category':'Document'
	});
	console.log('event');
});

$('.invest__item--type5 a').click(function() {
	gtag('event', 'T&C', {
		'event_category':'Document'
	});
	console.log('event');
});

$('.mobile_menu_wp a').click(function() {
	gtag('event', 'WPMenu', {
		'event_category':'WP'
	});
	console.log('event');
});

$('.mobile_menu_telegram a').click(function() {
	gtag('event', 'chatUpperLine', {
		'event_category':'joinChat'
	});
});

$('#solution .mvp_button a').click(function() {
	gtag('event', 'check_MVP_solution', {
		'event_category':'checkMVP'
	});
	console.log('event');
});

$('#mvpButtonTech').click(function() {
	gtag('event', 'check_MVP_tech', {
		'event_category':'checkMVP'
	});
	console.log('event');
});

$('#contact .mvp_link a').click(function() {
	gtag('event', 'check_MVP_footer', {
		'event_category':'checkMVP'
	});
	console.log('event');
});

$('#contact .wp_link_bt a').click(function() {
	gtag('event', 'WPBottom', {
		'event_category':'WP'
	});
	console.log('event');
});

$('.buySPSCountdown').click(function() {
	gtag('event', 'get_tokens_countdown_section', {
		'event_category':'getTokens'
	});
	console.log('event');
});

$('.buySPSSaleSection').click(function() {
	gtag('event', 'get_tokens_sale_section', {
		'event_category':'getTokens'
	});
	console.log('event');
});
/*
$('.add-to-calendar-checkbox').click(function(event) {
	$('')
});
*/

$('.buttonContactCollection').click(function() {
	var email_val = $('.inputEmailContactCollection').val().trim();
	var name_val = $('.inputNameContactCollection').val().trim();
	var msg_val = $('.inputMessageContactCollection').val().trim();
	if ((msg_val === "Thank you for contacting us!") || (msg_val === "Pending...") || (name_val === "Thank you for contacting us!") || (name_val === "Pending...") || (email_val === "Thank you for contacting us!") || (email_val === "Pending...")) return;
	if ((email_val.length > 2) && (name_val.length > 2) && (msg_val.length > 2)) {
		var request = {
			"tasks": [
				{
					"taskType":"website_contact_form",
					"contact_email":email_val,
					"contact_name":name_val,
					"contact_message":msg_val
				}
			]
		}
		console.log(request);
		$.ajax(server_addr,{
			method:'POST',
			dataType:'json',
			data: JSON.stringify(request),
			contentType:'application/json'
		}).done(function(response) {
			console.log('sent contact msg ok');
		})
		.fail(function(jjj,status) {
			console.log('fail sending email: '+status+''+jjj);
		})
		.always(function() {
			$('.inputEmailContactCollection').val('Thank you for contacting us!');
			$('.inputNameContactCollection').val('Thank you for contacting us!');
			$('.inputMessageContactCollection').val('Thank you for contacting us!');
			clearContactFields();
		});
		$('.inputEmailContactCollection').val('Pending...');
		$('.inputNameContactCollection').val('Pending...');
		$('.inputMessageContactCollection').val('Pending...');
	}
});

function clearContactFields() {
	setTimeout(function() {
		$('.inputEmailContactCollection').val('');
		$('.inputNameContactCollection').val('');
		$('.inputMessageContactCollection').val('');
	},3600)
}

$('.buttonEmailCollection, .buttonEmailCollectionBottom').click(function() {
	var email_val = $('.inputEmailCollection').val().trim();
	if (email_val.length > 2) {
		var event_name = $(this).hasClass('buttonEmailCollection') ? "EmailCollectedTop" : "EmailCollectedBottom";
		gtag('event', event_name, {
			'event_category':'Email'
		});
		console.log('event');
		var request = {
			"tasks": [
				{
					"taskType":"website_email_form",
					"email":email_val
				}
			]
		}
		console.log(request);
		$.ajax(server_addr,{
			method:'POST',
			dataType:'json',
			data: JSON.stringify(request),
			contentType:'application/json'
		}).done(function(response) {
			console.log('sent email ok');
			$('.inputEmailCollection').val('Check your email inbox to make sure you are signed up!');
				clearEmailField();
		})
		.fail(function(jjj,status) {
			console.log('fail sending email: '+status);
			$('.inputEmailCollection').val('Sign up failed. Check your connection and try again.');
				clearEmailField();
		})
		.always(function() {
				
		})
		$('.inputEmailCollection').val('Pending...');
	}
});

$('#buttonReset').click(function() {
	var email = $('#email_restore').val().trim();
	var err = "";
	if (email.length < 3) err = "Email is incorrect. Please contact support";
	if (err.length != 0) {
		alert("Error! "+err);
		return;
	}
	var request = {
		"tasks": [
			{
				"taskType":"reset_password",
				"email":email,
				"stage":"email"
			}
		]
	}
	$.ajax(server_addr,{
		method:'POST',
		dataType:'json',
		data: JSON.stringify(request),
		contentType:'application/json'
	}).done(function(response) {
		console.log('sent reset ok');
		var result = response.answers[0].result;
		$('#reset_ok').text(result ? "Confirmation link was sent to your email" : "There is no such email");
		$('#reset_ok').css('color', result ? 'green' : 'red');
		$('#email_restore').val('');
	})
	.fail(function(jjj,status) {
		console.log('fail sending activate: '+status+''+jjj);
		$('#reset_ok').text("Error!")
		$('#reset_ok').css('color', 'red');
	})
});

$('#buttonNewPass').click(function() {
	var new_pass = $('#new_pass').val().trim();
	var err = false;
	if ((new_pass.length < 5) || (new_pass.length > 40)) err = true;
  if (!(/^[0-9a-zA-Z!?@.,]+$/.test(new_pass))) err = true;
	if (err) {
		alert("Error! Password field must contain at least 5 symbols and not more than 40 symbols. Only alphanumeric symbols and some basic punctuation like !?., allowed.");
		return;
	}
	if (confirmation_code.length <= 5) {
		alert("Troubles with confirmation code. Please contact Support");
		return;
	}
	var request = {
		"tasks": [
			{
				"taskType":"reset_password",
				"new_pass":new_pass,
				"confirmation_code":confirmation_code,
				"stage":"new_pass"
			}
		]
	}
	$.ajax(server_addr,{
		method:'POST',
		dataType:'json',
		data: JSON.stringify(request),
		contentType:'application/json'
	}).done(function(response) {
		console.log('sent setup pass ok');
		var result = response.answers[0].result;
		$('#setup_pass_ok').html(result ? "The password has been reset. Follow <a href = 'sponsy_login.html'>this link to get back to the Sponsy Web App page</a>" : "The error occured");
		$('#setup_pass_ok').css('color', result ? 'green' : 'red');
		$('#new_pass').val('');
	})
	.fail(function(jjj,status) {
		console.log('fail sending activate: '+status+''+jjj);
		$('#setup_pass_ok').text("Error!")
		$('#setup_pass_ok').css('color', 'red');
	})
});

$('#buttonActivate').click(function() {
	var email = $('#email').val().trim();
	var promo = $('#promo').val().trim();
	var country = $('#country').val().trim();
	var money = $('#money').val().trim();
	var mobile = $('#mobile').val().trim();
	var err = "";
	if (email.length < 3) err = "Email is incorrect. Please contact support";
	if (promo.length != 10) err = "Promocode is incorrect. Please contact support";
	if (isNaN(money)) err = "Sum of money is not a number";
	if ((country.length < 3) || (country.length > 100)) err = "Country is too short / long";
	if (err.length != 0) {
		alert("Error! "+err);
		return;
	}
	var request = {
		"tasks": [
			{
				"taskType":"promo_activate",
				"email":email,
				"promo":promo,
				"country":country,
				"money":money,
				"mobile":mobile
			}
		]
	}
	$.ajax(server_addr,{
		method:'POST',
		dataType:'json',
		data: JSON.stringify(request),
		contentType:'application/json'
	}).done(function(response) {
		console.log('sent activate ok');
		$('#activate_ok').text("Success!")
		$('#activate_ok').css('color', 'green');
		$('#country').val('');
		$('#money').val('');
		$('#mobile').val('');
	})
	.fail(function(jjj,status) {
		console.log('fail sending activate: '+status+''+jjj);
		$('#activate_ok').text("Error!")
		$('#activate_ok').css('color', 'red');
	})
	.always(function() {
		$('.inputEmailContactCollection').val('Thank you for contacting us!');
		$('.inputNameContactCollection').val('Thank you for contacting us!');
		$('.inputMessageContactCollection').val('Thank you for contacting us!');
		clearContactFields();
	})
});

$('#buttonActivateFullWhitelist').click(function() {
	var email_valid_reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	var email = $('#email').val().trim();
	var first_name = $('#first_name').val().trim();
	var last_name = $('#last_name').val().trim();
	var birth = $('#birth').val().trim();
	var country = $('#country').val().trim();
	var money = $('#money').val().trim();
	var mobile = $('#mobile').val().trim();
	var err = "";
	if ((email.length < 3) || (!(email_valid_reg.test(email)))) err = "Email is incorrect. Please contact support";
	if ((first_name.length < 2) || (first_name.length > 40)) err = "First name cannot be shorter than 2 symbols or longer than 40 symbols";
	if ((last_name.length < 2) || (last_name.length > 40)) err = "Last name cannot be shorter than 2 symbols or longer than 40 symbols";
	if ((birth.length < 6) || (birth.length > 40)) err = "Your date of birth cannot be shorter than 6 symbols or longer than 40 symbols";
	if (isNaN(money)) err = "Sum of money is not a number";
	if (money.length > 6) err = "Amount of money entered is unreal!";
	if (mobile.length > 40) err = "Mobile number is too long";
	if (err.length != 0) {
		$('#activate_ok').text("Error! "+err);
		$('#activate_ok').css('color', 'red');
		return;
	}
	else $('#activate_ok').text("");
	var request = {
		"tasks": [
			{
				"taskType":"get_whitelisted",
				"email":email,
				"first_name":first_name,
				"last_name":last_name,
				"birth":birth,
				"country":country,
				"money":money,
				"mobile":mobile,
				"date":new Date().toString()
			}
		]
	}
	$.ajax(server_addr,{
		method:'POST',
		dataType:'json',
		data: JSON.stringify(request),
		contentType:'application/json'
	}).done(function(response) {
		var result = response.answers[0].result;
		console.log('activated whitelist with result '+result);
		if (result == "ok") {
			$('#activate_ok').text("Success!")
			$('#activate_ok').css('color', 'green');
			$('#country').val('');
			$('#money').val('');
			$('#mobile').val('');
		}
		else if (result == "email_busy") {
			$('#activate_ok').text("This email is whitelisted! Please contact support");
			$('#activate_ok').css('color', 'red');
		}
	})
	.fail(function(jjj,status) {
		console.log('fail sending activate: '+status+''+jjj);
		$('#activate_ok').text("Error!")
		$('#activate_ok').css('color', 'red');
	})
	$('#activate_ok').text("Pending...");
	$('#activate_ok').css('color', 'blue');
});

function clearEmailField() {
	setTimeout(function() {
		$('.inputEmailCollection').val('');
	},3600)
}

var countdown_present = false;
var countdown_time_left = 0;


function produceVisibility(data) {
	var head_on = data.saleHeadVisible;
	var countdown_on = data.saleCountVisible;
	var info_on = data.saleInfoVisible;
	var progress_on = data.saleProgressVisible;
	var prices_on = data.salePriceVisible;
	var top_line_on = data.displayTopLine;
	var add_calendar_button_on = data.displayCalendarButton;
	if (head_on) $('.tokenSaleHeadId').css('display', 'block')
	else $('.tokenSaleHeadId').css('display', 'none');
	if (countdown_on) $('.tokenSaleCountId').css('display', 'flex')
	else $('.tokenSaleCountId').css('display', 'none');
	if (info_on) $('#tokenSaleInfoId').css('display', 'flex')
	else $('#tokenSaleInfoId').css('display', 'none');
	if (progress_on) $('.tokenSaleProgressId').css('display', 'block')
	else $('.tokenSaleProgressId').css('display', 'none');
	if (prices_on) $('#tokenSalePriceId').css('display', 'block')
	else $('#tokenSalePriceId').css('display', 'none');
	if ((!head_on) && (!countdown_on) && (!info_on)) $('.tokenSaleTotalId').css('display', 'none');
	if (head_on) {
		$('.tokenSaleHeadId .view-text h2').text(data.saleTitleText);
		$('.tokenSaleHeadId .view-text p.saleSubtitle').text(data.saleSubtitleText);
	}
	if (add_calendar_button_on) $('.add-to-calendar-checkbox').css('display', 'block')
	else $('.add-to-calendar-checkbox').css('display', 'none');
	if (countdown_on) {
		countdown_present = true;
		countdown_time_left = data.saleTime - new Date().getTime();
		if (countdown_time_left > 0) {
			startCountdown();
		}
	}
	$('.info-price-value').text(data.currentPriceString);
	if (info_on) {
		var total_raised = data.totalRaised;
		var raised_mil = Math.floor(total_raised / 1000000);
		var raised_th = Math.floor((total_raised - raised_mil * 1000000) / 1000);
		var raised_money = Math.floor(total_raised % 1000);
		var total_raised_string = '$'+(raised_mil > 0 ? raised_mil+'.' : '')+(((raised_th > 0) || (raised_mil > 0)) ? makeTriple(raised_th,(raised_mil > 0))+'.' : '')+(((raised_money > 0) || (raised_mil > 0) || (raised_th > 0)) ? makeTriple(raised_money,((raised_th > 0) || (raised_mil > 0))) : '0');
		$('.info-raised-value').text(total_raised_string);
		$('.info-price-value').text(data.currentPriceString);
		$('.info-tokens-value').text(data.tokensSoldString);
	}
	if (prices_on) {
		var prices = data.salePrices;
		for (var i = 0;i < prices.length; i++) {
			var wrapper_selector = '.priceWrapper.price--'+(i+1);
			$(wrapper_selector+' .priceFiat').text(prices[i].priceValue);
			$(wrapper_selector+' .priceDate').text(prices[i].priceDate.toUpperCase());
			if (prices[i].currentPrice) {
				$(wrapper_selector).addClass('nowPrice');
			}
		}
	}
	if (progress_on) {
		var hard_cap = Number.parseFloat($('.tokenSaleProgressId').attr('harddata'));
		var soft_cap = Number.parseFloat($('.tokenSaleProgressId').attr('softdata'));
		var raised_percentage = Number.parseFloat(data.totalRaised) / hard_cap * 100.0;
		$('span.progress-line-width').css('width', raised_percentage+'%');
		if (data.totalRaised >= soft_cap) $('.progress__item.progress-soft .progress__index').addClass('has-active');
	}
	if (top_line_on) {
		$('#topLineTokensale').text(data.topLineText);
		$('#topLineTokensale').css('display', 'block');
	}
	//showSalePopup(1100,'14 hours');
}

//use it to show popup . ultimate aim is to raise conversion

function showSalePopup(spsAmount,timeAgo) {
	var popup_s = $('.tokensPopup');
	popup_s.css('opacity', '0');
	popup_s.css('bottom', '-10px');
	popup_s.css('display', 'block');
	popup_s.find('.popupTokensAmount').text('SPS '+spsAmount);
	popup_s.find('.popupTokensCaption').text('were purchased '+timeAgo+' ago');
	popup_s.stop(true,false).animate({'opacity': '1.0', 'bottom': '20px'}, 350);
	setTimeout(function() {
		popup_s.stop(true,false).animate({'opacity': '0.0'}, 300);
	},4000)
}

function makeTriple(num,beforePresent) {
	var new_num = num;
	var l_1 = Math.floor(num / 100);
	new_num -= l_1 * 100;
	var l_2 = Math.floor(new_num / 10);
	new_num -= l_2 * 10;
	return (beforePresent ? l_1.toString() : (l_1 > 0) ? l_1.toString() : '')+(beforePresent ? l_2.toString() : (l_2 > 0) ? l_2.toString() : '')+new_num.toString();
}

function startCountdown() {
	setCountdown();
	setInterval(setCountdown,1000);
}

function setCountdown() {
	var time_left_seconds = countdown_time_left / 1000;
	var days = Math.floor(time_left_seconds / 86400);
	time_left_seconds = time_left_seconds % 86400;
	var hours = Math.floor(time_left_seconds / 3600);
	time_left_seconds = time_left_seconds % 3600;
	var minutes = Math.floor(time_left_seconds / 60);
	var seconds = Math.floor(time_left_seconds % 60);
	$('.count-days').text(makeDouble(days));
	$('.count-hours').text(makeDouble(hours));
	$('.count-minutes').text(makeDouble(minutes));
	$('.count-seconds').text(makeDouble(seconds));
	countdown_time_left -= 1000;
	$('.countSemicolon').stop(true,false).animate({'opacity': '0'}, 500, function() {
		$('.countSemicolon').stop(true,false).animate({'opacity':'1'}, 200);
	})
}

function makeDouble(num) {
	var add_zero = num < 10;
	var result = num.toString();
	if (add_zero) return '0'+result
	else return result;
}

function setupCharts() {
	var el1 = document.getElementById("allocationChart");
	if (el1) {
		var ctx = el1.getContext('2d');
		if (ctx) {
		var myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        datasets: [{
            label: 'Tokens Allocation',
            data: [70, 15, 5, 5, 4, 1],
            backgroundColor: [
                'rgba(255, 99, 132, 1.0)',
                'rgba(54, 162, 235, 1.0)',
                'rgba(100, 69, 54, 1.0)',
                'rgba(178, 103, 94, 1.0)',
                'rgba(196, 163, 129, 1.0)',
                'rgba(187, 214, 134, 1.0)'
            ],
            borderColor: [
                'rgba(255,255,255,1)',
                'rgba(255,255,255,1)',
                'rgba(255,255,255,1)',
                'rgba(255,255,255,1)',
                'rgba(255,255,255,1)',
                'rgba(255,255,255,1)'
            ],
            borderWidth: 5
        }]
    },
    options: {
        animation: {
        	animateRotate: false,
        	animateScale: true
        },
        legend: {
        	display: false
        },
        tooltips: {
        	enabled: false
        }
    }
});
	}
}
	

	var el2 = document.getElementById("fundsChart");
	if (el2) {
		var ctx_funds = el2.getContext('2d');
		if (ctx_funds) {
		var myChartFunds = new Chart(ctx_funds, {
    type: 'doughnut',
    data: {
        datasets: [{
            label: 'Use of Proceeds',
            data: [30, 30, 15.5, 10, 7, 5, 2],
            backgroundColor: [
                'rgba(249, 200, 14, 1.0)',
                'rgba(248, 102, 36, 1.0)',
                'rgba(234, 53, 70, 1.0)',
                'rgba(102, 46, 155, 1.0)',
                'rgba(27, 153, 139, 1.0)',
                'rgba(153, 104, 136, 1.0)',
                'rgba(61, 214, 208, 1.0)'
            ],
            borderColor: [
                'rgba(255,255,255,1)',
                'rgba(255,255,255,1)',
                'rgba(255,255,255,1)',
                'rgba(255,255,255,1)',
                'rgba(255,255,255,1)',
                'rgba(255,255,255,1)',
                'rgba(255,255,255,1)'
            ],
            borderWidth: 5
        }]
    },
    options: {
        animation: {
        	animateRotate: false,
        	animateScale: true
        },
        legend: {
        	display: false
        },
        tooltips: {
        	enabled: false
        }
    }
});
	}
	}
	
}

// global values
var mobileSize = 1024,
    responsive = false;

jQuery(document).ready(function ($) {
	isMobile();
	setupSlick();
	setupCharts();
	setupTabs();

	setupVisibility();
	// magnific-popup
	wHTML.mfpInline();
	wHTML.mfpAjax();
	// forms
	wHTML.inputMask();
	wHTML.formValidation();
	// text
	wHTML.viewTextMedia();
	wHTML.tableWrapper();
	// menu
	//wHTML.menu();

	//toggleShow
	wHTML.toggleShow();

	// filter
	//wHTML.sort();
	//wHTML.filter();

	//accardion and tab

	wHTML.accardion();
	//wHTML.tabs();

	checkWhiteList();
	checkConfirmationCode();


	// = = = = =   START   = == = = =   HOLST
	var controller = new ScrollMagic.Controller();

	controller.scrollTo(function (target) {
		TweenMax.to(window, 0.5, {
			scrollTo: {
				y: target, // scroll position of the target along y axis
				autoKill: true, // allows user to kill scroll action smoothly
				offsetY: 0
			},
			ease: Cubic.easeInOut
		});
	});

	//  Bind scroll to anchor links
	$(document).on("click", 'a[href^=\\#]', function (e) {
		var id = $(this).attr("href");
		if ($(id).length > 0) {
			e.preventDefault();

			// If supported by the browser we can also update the URL
			if (window.history && window.history.pushState) {
				history.pushState("", document.title, id);
			}
		}
	});

	//slip Header
	var sceneSlipHeader = new ScrollMagic.Scene({
		triggerElement: ".js-fixHeader",
		duration: $(document).height() - 100, // pin element for the window height - 1
		triggerHook: 0,
		offset: 1,
		reverse: true // allows the effect to trigger when scrolled in the reverse direction
	}).setPin(".js-fixHeader").setClassToggle('.js-fixHeader', 'has-active')
	//.addIndicators()
	.addTo(controller);

	//show Active
	var scenesAncherArr = [];
	var $linkAnchorList = $('.js-anchor').find('a[href^=\\#]');

	$linkAnchorList.each(function (i, el) {
		scenesAncherArr.push($(el).attr('href'));
	});

	scenesAncherArr.forEach(function (el, i) {
		new ScrollMagic.Scene({
			triggerElement: el,
			duration: $(el).height(),
			triggerHook: .06,
			reverse: true
		}).setClassToggle('a[href=\\' + el + ']', 'has-active')
		//.addIndicators()
		.addTo(controller);
	});

	$('.dismissTopPane').click(function() {
		$('#topLineLanguage').css('display', 'none');
	});

	$('.interview__img').click(function() {
		var video_url = $(this).attr('video-url');
		if (video_url.length < 3) return;
		var video_frame = '<iframe class = "interview_video" src = "'+video_url+'" frameborder="0" allowfullscreen = "1"></iframe>';
		$(this).html(video_frame);
		var video_action = "Video_Interviews_Section";
		if ($(this).hasClass('video-top-slider')) video_action = "Video_Roll_Upper";
		var interview_id = $(this).attr('inter_id');
		var video_label = Number(inteview_id) == 5 ? 'SponsyApp_Video' : Number(inteview_id) == 6 ? 'SponsyIntro_Video' : Number(interview_id) == 7 ? 'SponsyMVP_Video' : "inter_"+interview_id;
		gtag('event', video_action, {
			'event_category':'Video',
			'event_label':video_label
		});
	});

	//  Bind scroll to anchor links
	$(document).on("click", 'a[href^=\\#]', function (e) {
		var id = $(this).attr("href");
		if (($(id).length > 0) && (!(id.startsWith('#clr')))) {
			e.preventDefault();
			console.log(id);
			controller.scrollTo(id);

			// If supported by the browser we can also update the URL
			if (window.history && window.history.pushState) {
				history.pushState("", document.title, id);
			}
		}
	});

	//base global animated
	//add indicator line


	wHTML.indicator(controller);
	wHTML.svgMorph(controller);
	wHTML.animaDash(controller);
	wHTML.showBlock(controller);

	//set ANIMATION to section

	//id="spon"
if (!($(document.body).hasClass('faq!'))) {
wHTML.progress(controller);
}
	//

	//id="fact"

	wHTML.graph(controller);
	wHTML.table(controller);

	//id="rest"
	wHTML.restAnima(controller);
	wHTML.brick(controller);

	//id="wrong"

//because of hell out BUG here i need to check the wepage

if (!($(document.body).hasClass('faq!'))) {
	wHTML.wrongLine(controller);
	wHTML.libra(controller);

	//id="scBlock"
	wHTML.story(controller);

	//id="techno"
	wHTML.speedo(controller);

	//id="work"
	wHTML.work(controller);

	//id="step"

	wHTML.lineStep(controller);
	wHTML.blade(controller);
	wHTML.wheel(controller);

	//id="step"
	wHTML.coin(controller);

}



	// = = = = =   END   = == = = =   HOLST


	$('.js-menuButton').on('click', function () {
		$(this).toggleClass('has-active');
		$('.js-menuContent').slideToggle(400);
	});

	$(document).on('click', function (e) {
		if (!$('.header__menu ').has(e.target).length && responsive) {
			$('.js-menuButton').removeClass('has-active');
			$('.js-menuContent').slideUp();
		}
	});
});

$('.js-menuContent a').on('click', function () {
	if (responsive) {
		if ($('.js-menuButton').hasClass('has-active')) {
			$('.js-menuButton').toggleClass('has-active');
			$('.js-menuContent').slideToggle(400);
		}
	}
})

$('.socialTopButton.faq__expansion').click(function () {
	$(this).toggleClass('button__expanded');
	$('.faq__list.faq__list__second').fadeToggle({
		duration:300
	});
	if ($(this).hasClass('button__expanded')) {
		$(this).find('span').text('SEE LESS QUESTIONS');
	}
	else {
		$(this).find('span').text('SEE MORE QUESTIONS');
	}
})

$('.socialTopButton.problems__expansion').click(function () {
	$(this).toggleClass('button__expanded');
	$('.wrong__list').fadeToggle({
		duration:300
	});
	if ($(this).hasClass('button__expanded')) {
		$(this).find('span').text('SEE LESS PROBLEMS');
	}
	else {
		$(this).find('span').text('LEARN MORE ABOUT PROBLEMS');
	}
})

jQuery(window).on('scroll', function () {});

jQuery(window).on('resize', function () {

	isMobile();
});

jQuery(window).on('load', function () {
	// content-image
	wHTML.viewTextImages();
});

function setupTabs() {
	if ($('#roadshow_js').length) {
		$('#roadshow_js').colorfulTab({
			theme:'elliptic',
			overlayOpacity: '0.7'
		})
	}
}

function setupSlick() {
	/*
            $('#js-slider').slick({
                dots: false,
                arrows: true,
                infinite: true,
                speed: 300,
                autoplaySpeed: 3000,
                centerMode: true,
                slidesToShow: 1,
                asNavFor: '#js-slider-nav',
                autoplay: false
            });
            */
            $('#js-slider-nav').slick({
                dots: false,
                arrows: false,
                infinite: false,
                slidesToShow: 4,
                asNavFor: '#js-slider',
                variableWidth: true,
                focusOnSelect: true,
                autoplay: false
            });
            $('#home-carousel-wrapper').slick({
                            dots: !1,
            		infinite: !1,
            speed: 300,
            slidesToShow: 3,
            slidesToScroll: 3,
            responsive: [{
                breakpoint: 992,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2
                }
            }, {
                breakpoint: 600,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }]
            });

}

function isMobile() {
	var widthScreen = $(document).width();
	widthScreen >= mobileSize ? responsive = false : responsive = true;
}

function checkWhiteList() {
	var page_name = location.pathname.substring(location.pathname.lastIndexOf("/") + 1);
	if (page_name != null) {
		if (page_name === "completeWhitelist.html") {
			var params = window.location.search.split('&');
			console.log(params);
			if (params.length != 2) return;
			if (params[0].split('=')[0] === "?mail") {
				$('#email').val(decodeURIComponent(params[0].split('=')[1]));
				$('#promo').val(params[1].split('=')[1]);
			}
			else {
				$('#promo').val(params[0].split('=')[1]);
				$('#email').val(params[1].split('=')[1]);
			}
		}
	}
}

function checkConfirmationCode() {
	if (window.location.href.indexOf("sponsyCreateNewPassword") != -1) {
		var conf_code = window.location.search.split('=');
		if (conf_code != null) {
			if (conf_code.length == 2) {
				confirmation_code = conf_code[1];
			}
		}
	}
}

function pathPrepare($el) {
	var lineLength = $el[0].getTotalLength();
	$el.css("stroke-dasharray", lineLength);
	$el.css("stroke-dashoffset", lineLength);
}
