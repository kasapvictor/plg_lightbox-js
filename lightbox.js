class LightBox {
	constructor ( config = {} ) {
		this.modal = null;
		this.groupItems = null;
		this.preview = config.preview || true;
		this.preloader = config.preloader || '';
		this.overflow = config.overflow || true;
		this.arrowLeft = config.arrowLeft || '';
		this.arrowRight = config.arrowRight || '';
		this.items = document.querySelectorAll ( '[data-lb-item]' );

		if ( this.items.length > 0 ) this.init ();
	}

	// инициализация
	init () {
		// добавляет модальное окно на страницу
		this.renderModal ();

		// слушаем клик по каждому элементу data-lb-item
		this.items.forEach ( item => {
			item.addEventListener ( 'click', () => this.itemHandler ( item ) );
		} );

		// слушает событие по клику на ESC и вызывает функцию закрытия модального окна
		// событие при клике на ESC закрывает модальное окно
		document.addEventListener ( 'keydown', ( e ) => {
			if ( e.code === "Escape" && this.modal.classList.contains ( 'active' ) ) {
				this.modalClose ();
			}
		} );
	}

	// событие по клику на элемент лайтбокса
	itemHandler ( item ) {

		if ( !this.modal ) return false;

		// если элемент состоит в группе и имя группы не пустая строка
		if ( item.dataset.lbItemGroup && item.dataset.lbItemGroup !== "" ) {
			this.renderGroupItems ( item );
		} else {
			// если элементы не в группе
			this.renderItem ( item );
		}
	}

	// отрисовка модального окна
	renderModal () {
		const body = document.querySelector ( 'body' );
		const html = `
		 <div class="modal-lb">
			 <div class="modal-lb__inner">
			     <!-- modal item -->
				 <div class="modal-lb__item-wrap"></div>
				 
				 <!-- modal footer -->
				 <div class="modal-lb__footer">
				     <!-- description -->
				    <div class="modal-lb__item-desc"></div>
				 </div>
				 
				
			 </div>
			 
			<!-- close button -->
			<div class="modal-lb__close modal-lb__close-btn">&times</div>
				 
			 <!-- close background -->
			 <div class="modal-lb__close modal-lb__close-bg"></div>
		 </div>
		`;

		body.insertAdjacentHTML ( 'beforeend', html );


		// добавляем в свойство элемент модального окна
		this.modal = document.querySelector ( '.modal-lb' );

		// функция закрытия модального окна
		this.modalClose ();
	}

	// создаем несколько элементов
	renderGroupItems ( item ) {
		const groupName = item.dataset.lbItemGroup;
		const items = [ ...this.items ];
		let count = 0;
		this.groupItems = items.reduce ( ( prev, curr ) => {
			if ( curr.dataset.lbItemGroup === groupName ) {
				curr.dataset.lbItemIndex = `${ count }`;
				prev.push ( curr );
				count++;
			}
			return prev;
		}, [] );

		// добавление выбранного элемента из группы в модальное окно
		this.renderItem ( item );

		// отрисовка кнопок переключения между изображениями в модальном окне
		this.renderNextPrev ();

		// рендер превью галереи
		this.renderPreview ();
	}

	// вставляем элемент в modal-lb__item-wrap
	renderItem ( item ) {
		const data = {
			tagName: item.tagName.toLowerCase (),
			name: item.dataset.lbItemName || false,
			description: item.dataset.lbItemDesc || false,
			src: item.dataset.lbItemSrc || false,
			group: item.dataset.lbItemGroup || false,
			index: item.dataset.lbItemIndex || false,
		};
		const html = this.createEl ( data.tagName, data.src, data.index, [ 'modal-lb__item' ] );
		const wrapper = document.querySelector ( '.modal-lb__item-wrap' );

		// добавляем описание к элементу
		this.renderDescription ( data );


		wrapper.innerHTML = '';
		// добавляет прелоадер
		if ( this.preloader !== '' ) {
			wrapper.insertAdjacentHTML ( 'beforeend', this.renderPreloader () );
		}

		// добавляет элемент
		wrapper.insertAdjacentElement ( 'afterbegin', html );


		this.modalShow ( data );

		// события при касании
		this.itemEvents ( html )
	}

	// добавляет описание в верстку для элемента
	renderDescription ( data ) {
		const wrapper = this.modal.querySelector ( '.modal-lb__item-desc' );
		wrapper.innerHTML = '';

		// если есть имя то добавить
		if ( data.name ) {
			wrapper.insertAdjacentHTML ( 'afterbegin', ` <div class="modal-lb__item-desc-title">${ data.name }</div>` )
		}

		// если есть описание то добавить
		if ( data.description ) {
			wrapper.insertAdjacentHTML ( 'beforeend', ` <div class="modal-lb__item-desc-text">${ data.description }</div>` )
		}
	}

	// добавление превью галереи
	renderPreview () {
		if ( this.preview ) {
			const items = this.groupItems;
			const modalFooter = this.modal.querySelector ( '.modal-lb__footer' );

			// если есть блок превью то удалить этот блок
			this.removePreview ();

			const previews = items.map ( ( item, index ) => `<div class="modal-lb__preview-item" data-lb-preview-index="${ index }" style="background-image:url('${ item.src }')"></div>` ).join ( '' );
			const html = `<div class="modal-lb__preview">${ previews }</div>`;

			// добавляем блок превью в футер
			modalFooter.insertAdjacentHTML ( 'beforeend', html );

			// переключает активный класс превью для текущего элемента в модальном окне
			this.switchActivePreview ();

			// событие при клике на превью
			this.previewHandler ();

			// смещение превью до активного элемента в полосе превью
			this.scrollToActivePreview ();
		}
	}

	// добавляет класс active для того элемента который отображается
	switchActivePreview () {
		if ( this.preview ) {
			const items = this.modal.querySelectorAll ( '.modal-lb__preview-item' );
			const currentItemIndex = this.modal.querySelector ( '[data-lb-current-item-index]' ).dataset.lbCurrentItemIndex;

			// удаляет у всех превью класс active
			items.forEach ( item => item.classList.remove ( 'active' ) );

			// находим элемент превью соответствующий индексу текущего элемента в модальном окне
			const currentItem = this.modal.querySelector ( `[data-lb-preview-index="${ currentItemIndex }"]` );

			// добавляем класс active к элементу
			currentItem.classList.add ( 'active' );

			// скролл блока preview до области видимости активного элемента и выравнивание по центру
			currentItem.scrollIntoView ( { behavior: "smooth", inline: "center" } );
		}
	}

	// события для элементов превью
	previewHandler () {
		const groupItems = this.groupItems;
		const wrapper = this.modal.querySelector ( '.modal-lb__preview' );
		const previews = wrapper.querySelectorAll ( '.modal-lb__preview-item' );

		// при клике на превью переключить основной элемент и переключить активное превью
		previews.forEach ( item => item.addEventListener ( 'click', () => {
			// если элемент на котором был клик не активный (.active)
			if ( !item.classList.contains ( 'active' ) ) {
				const index = item.dataset.lbPreviewIndex;

				// если кликнули на превью то заменить элемент в модальном окне
				this.renderItem ( groupItems[index] );

				// переключить активный элемент превью на тот который сейчас выводится в коне
				this.switchActivePreview ();
			}
		} ) );

		// если содержимое блока больше области видимости то сделать выравнивание контента по левому краю
		if ( wrapper.clientWidth + 80 < wrapper.scrollWidth ) {
			wrapper.style.justifyContent = 'start';

			// смещение мышкой и скролл
			this.previewEvents ( wrapper );
		}
	}

	// удаляет блок preview
	removePreview () {
		const modalFooter = this.modal.querySelector ( '.modal-lb__footer' );
		const modalPreview = modalFooter.querySelector ( '.modal-lb__preview' );

		if ( modalPreview ) modalPreview.remove ();
	}

	// добавляем кнопки переключения в модальное окно
	renderNextPrev () {
		const arrowLeft = this.arrowLeft === '' ? '&#x203a;' : this.arrowLeft;
		const arrowRight = this.arrowRight === '' ? '&#x2039;' : this.arrowRight;

		// следующий элемент
		const next = this.createEl ( 'div', false, false, [ 'modal-lb__nav', 'modal-lb__item-next' ] );
		next.addEventListener ( 'click', () => this.nextPrevHandler ( 'next' ) );
		next.innerHTML = arrowLeft;
		this.modal.insertAdjacentElement ( 'beforeend', next );

		// предыдущий элемент
		const prev = this.createEl ( 'div', false, false, [ 'modal-lb__nav', 'modal-lb__item-prev' ] );
		prev.addEventListener ( 'click', () => this.nextPrevHandler ( 'prev' ) );
		prev.innerHTML = arrowRight;
		this.modal.insertAdjacentElement ( 'beforeend', prev );
	}

	// удаляем кнопки навигации
	removeNextPrev () {
		const navs = this.modal.querySelectorAll ( '.modal-lb__nav' );

		if ( navs.length > 0 ) {
			navs.forEach ( nav => nav.remove () );
		}
	}

	// переключение элементов группы
	nextPrevHandler ( direction ) {
		const groupItems = this.groupItems;
		const currentItem = this.modal.querySelector ( '.modal-lb__item' );
		const currentIndex = +currentItem.dataset.lbCurrentItemIndex;

		// предыдущий элемент
		if ( direction === 'prev' ) {
			if ( currentIndex + 1 <= groupItems.length && currentIndex !== 0 ) {
				this.renderItem ( groupItems[currentIndex - 1] );
			} else {
				this.renderItem ( groupItems[groupItems.length - 1] );
			}
		}

		// следующий элемент
		if ( direction === 'next' ) {
			if ( currentIndex + 1 < groupItems.length ) {
				this.renderItem ( groupItems[currentIndex + 1] );
			} else {
				this.renderItem ( groupItems[0] );
			}
		}

		// переключаемся между активным превью
		this.switchActivePreview ()
	}

	// создает прелоадер
	renderPreloader () {
		return `<div class="modal-lb__preloader">
						${ this.preloader }
					</div>`;
	}

	// создаем элемент
	createEl ( selector, src = false, index = false, cls = [] ) {
		const el = document.createElement ( `${ selector }` );

		// если есть src то добавить к элементу
		if ( src ) {
			el.setAttribute ( 'src', `${ src }` );
		}

		// для группы - если есть index (порядковый номер элемента в массиве группы)
		// то добавить атрибут с индексом
		if ( index ) {
			el.dataset.lbCurrentItemIndex = index;
		}

		if ( cls.length > 0 ) {
			cls.forEach ( name => el.classList.add ( name ) );
		}

		return el;
	}

	// открыть модальное окно
	modalShow () {
		if ( this.modal ) {
			this.modal.classList.add ( 'active' );

			if ( this.overflow ) {
				document.querySelector ( 'body' ).style.overflow = 'hidden';
			}

		}
	}

	// закрыть модальное окно
	modalClose () {
		if ( this.modal ) {
			const closes = this.modal.querySelectorAll ( '.modal-lb__close' );

			closes.forEach ( close => close.addEventListener ( 'click', () => {
				this.reset ();
			} ) );

			this.reset ();
		}
	}

	// сброс параметров элементом модального окна
	reset () {
		// удаляем классы у модального окна
		this.modal.classList.remove ( 'active' );
		this.modal.classList.remove ( 'clear' );

		// удаляем кнопки навигации
		this.removeNextPrev ();

		// проверяет если есть превью блок то удаляет этот блок
		this.removePreview ();

		// сброс данных о группе элементов
		this.groupItems = null;

		// сброс стилей для body
		if ( this.overflow ) {
			document.querySelector ( 'body' ).style.overflow = 'auto';
		}
	}

	// действия при свайпе
	itemEvents ( item ) {
		// источник https://stackoverflow.com/questions/2264072/detect-a-finger-swipe-through-javascript-on-the-iphone-and-android

		let startX;
		let xDown = null;
		let isMove = false;

		// включение / отключение элементов управления
		item.addEventListener ( 'click', () => {
			this.modal.classList.toggle ( 'clear' );
		} );

		// действия при нажатии клавиши мыши
		item.addEventListener ( 'mousedown', ( e ) => {
			startX = e.clientX;
			xDown = e.clientX;
			isMove = true;
		} );

		// остановка если клавиша мыши отжата
		item.addEventListener ( 'mouseup', ( e ) => {
			startX = e.clientX;
			xDown = e.clientX;
			isMove = false;
		} );

		// действия при движении мыши
		item.addEventListener ( 'mousemove', ( e ) => {
			e.preventDefault ();
			let x = e.clientX;
			let diff = x - startX;

			if ( !xDown ) {
				return;
			}

			if ( isMove ) {

				// следующий элемент
				if ( diff < -80 ) {
					this.nextPrevHandler ( 'next' );
					xDown = null;
				}

				// предыдущий элемент
				if ( diff > 80 ) {
					this.nextPrevHandler ( 'prev' );
					xDown = null;
				}
			}
		}, true );

		// событие касания
		item.addEventListener ( 'touchstart', ( evt ) => {
			const firstTouch = evt.touches[0];

			xDown = firstTouch.clientX;
			startX = firstTouch.clientX;
		}, false );

		// событие перемещения
		item.addEventListener ( 'touchmove', ( evt ) => {
			evt.preventDefault (); // блокирует скролл при открытом модальном окне на телефоне

			let x = evt.touches[0].clientX;

			if ( !xDown ) {
				return;
			}

			let xUp = evt.touches[0].clientX;
			let xDiff = xDown - xUp;

			/* left swipe */
			if ( x + 100 < startX ) {
				if ( xDiff > 0 ) {
					this.nextPrevHandler ( 'next' );
				}
				xDown = null;
			}

			/* right swipe */
			if ( x - startX > 100 ) {
				if ( xDiff < 0 ) {
					this.nextPrevHandler ( 'prev' );
				}
				xDown = null;
			}
		}, false );
	}

	// поведение перетаскиванием мыши
	previewEvents ( el ) {

		//example  https://codepen.io/kasap-victor/pen/NWjGYXv?editors=0010

		let isDown = false;
		let scrollLeft;
		let startX;

		// при скролле сдвигает блок влево или право
		el.addEventListener ( 'wheel', ( e ) => {
			el.scrollLeft += e.deltaY;
			startX = el.scrollLeft;
		} );

		// левая клавиша мышки нажата
		el.addEventListener ( 'mousedown', ( e ) => {
			isDown = true;
			startX = e.pageX; // начальная позиция курсора относительно документа
			scrollLeft = el.scrollLeft; // смещение элемента
		} );

		// если курсор вне зоны области превью то остановить перемещение
		el.addEventListener ( 'mouseleave', () => {
			isDown = false;
		} );

		// левая клавиша мышки отжата
		el.addEventListener ( 'mouseup', ( e ) => {
			isDown = false;
		} );

		// движение мыши над блоком превью
		el.addEventListener ( 'mousemove', ( e ) => {
			if ( !isDown ) return;

			e.preventDefault ();

			const x = e.pageX; // позиция элемента на документе -> постоянно обновляется при перемещении курсора
			// startX - начальная позиция курсора относительно документа
			const walk = (x - startX) * 3; // разница смещения между началом клика и координаты движения Х

			// scrollLeft - значение смещения в момент нажатия кнопки мыши
			el.scrollLeft = scrollLeft - walk; // меняет смещение элемента в момент движения высчитывая разницу
		}, true );
	}

	// смещение првеью до элемента который активный
	scrollToActivePreview () {
		const wrapper = this.modal.querySelector ( '.modal-lb__preview' );
		const item = wrapper.querySelector ( '.modal-lb__preview-item.active' );

		wrapper.scrollLeft = item.offsetLeft - (wrapper.scrollWidth * .111);
	}
}

const preloader = `<?xml version="1.0" encoding="utf-8"?>
					<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="margin: auto; background: none; display: block; shape-rendering: auto;" width="211px" height="211px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
					<circle cx="50" cy="50" r="0" fill="none" stroke="#85a2b6" stroke-width="2">
					  <animate attributeName="r" repeatCount="indefinite" dur="2s" values="0;40" keyTimes="0;1" keySplines="0 0.2 0.8 1" calcMode="spline" begin="0s"></animate>
					  <animate attributeName="opacity" repeatCount="indefinite" dur="2s" values="1;0" keyTimes="0;1" keySplines="0.2 0 0.8 1" calcMode="spline" begin="0s"></animate>
					</circle><circle cx="50" cy="50" r="0" fill="none" stroke="#bbcedd" stroke-width="2">
					  <animate attributeName="r" repeatCount="indefinite" dur="2s" values="0;40" keyTimes="0;1" keySplines="0 0.2 0.8 1" calcMode="spline" begin="-1s"></animate>
					  <animate attributeName="opacity" repeatCount="indefinite" dur="2s" values="1;0" keyTimes="0;1" keySplines="0.2 0 0.8 1" calcMode="spline" begin="-1s"></animate>
					</circle>
					</svg>`;
const config = {
	preview: true, // показать миниатюры
	preloader: '', // svg прелоадер https://loading.io/
	overflow: true, // включить overflow:hidden для body когда открыта галерея
	arrowLeft: 'nxt', // стрелка влево
	arrowRight: 'prv', // стрелка вправо
};
new LightBox ( config );
