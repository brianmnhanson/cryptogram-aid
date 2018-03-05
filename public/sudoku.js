jQuery.fn.extend({
	disable: function (state) {
		return this.each(function () {
			var $this = jQuery(this);
			if ($this.is('input, button'))
				this.disabled = state;
			else if ($this.is('select') && state)
				$this.attr('disabled', 'disabled');
			else if ($this.is('select') && !state)
				$this.removeAttr('disabled');
			else
				$this.toggleClass('disabled', state);
		});
	}
});
$(document).ready(
	function () {

		var title_t = document.getElementById("title");
		var empty = Array(81).fill(0);
		var theSudoku = { value: empty.slice(), guess: empty.slice(), name: '', solved: false };
		var hide = true;
		var mode;

		function setMode(m) {
			$('button, table, a, checkbox').hide();
			switch (m) {
				case 'edit':
					$('#setup, #choices, #new, #solve, #dectitle, #inctitle, #list, #delete').show();
					$('#delete').disable(!("sk " + title_t.value) in localStorage);
					$("#title").disable(false);
					$("div > div").css("color", "red");
					$("div > div").each(function (i) {
						$(this).text(theSudoku.value[i] == 0 ? ' ' : theSudoku.value[i]);
					});
					change_digit(null);
					break;
				case 'play':
					$('#setup, #choices, #new, #solved, #edit, #save, #reset, #list, a').show();
					$("#title").disable(true);
					$("div > div").css("color", "black");
					$("div > div").each(function (i) {
						$(this).text(theSudoku.guess[i] == 0 ? ' ' : theSudoku.guess[i]);
						if (theSudoku.value[i] != 0) {
							$(this).css("color", "red");
						}
					});
					highlight_cell(null);
					check_guess();
					break;
				case 'list':
					$('#new, #solve, #edit, #items').show();
					$('#setup, #choices').hide();
					show_hide(hide);
					build_list();
					break;
			}
			mode = m;
		}

		function show_hide(h) {
			hide = h;
			if (hide) {
				$("tr").has(":contains('✓')").hide();
				$("#hide").hide();
				$("#show").show();

			} else {
				$("tr").show();
				$("#hide").show();
				$("#show").hide();
			}
		}

		function as_string(value, solved) {
			return value.join('') + (solved ? 'Y' : 'N');
		}

		function from_string(s) {
			return s.substr(0, 81).replace(/ /g, '0').split('').map(c => parseInt(c));
		}

		var dayOfWeek = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" ");
		function updateLink() {
			var href = document.URL.split("?")[0] + "?" +
				encodeURI(theSudoku.name) + "&" + as_string(theSudoku.value, false);
			var mail_a = document.getElementById("mail");
			if (mail_a != null) {
				var v = /\d+-\d+-\d+$/g.exec(theSudoku.name);
				var d = v ? new Date(v[0]).getUTCDay() : new Date().getDay();
				var day = dayOfWeek[d];
				var iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
				var mail = iOS ? "googlegmail:///co" : "mailto:";
				mail_a.href = mail + "?"
					+ "subject=" + encodeURIComponent(day + "'s sudoku")
					+ "&body=" + encodeURIComponent(href);
			}
		}

		function save() {
			theSudoku.name = title_t.value;
			theSudoku.valid = true;
			localStorage["sudoku"] = JSON.stringify(theSudoku, 0, 1);
			store();
			updateLink();
		}

		function restoreSudoku() {
			try {
				var q = JSON.parse(localStorage["sudoku"]);
				if (q.valid) {
					theSudoku = q;
					title_t.value = theSudoku.name;
					updateLink();
				}
			} catch (e) { }
		}

		function store() {
			var value = as_string(theSudoku.value, theSudoku.solved) + ";" + as_string(theSudoku.guess, false);
			if (theSudoku.name != title_t.value) {
				if (theSudoku.name != "" && localStorage["sk " + theSudoku.name] == value) {
					delete localStorage["sk " + theSudoku.name];
				}
				theSudoku.name = title_t.value;
			}

			localStorage["sk " + theSudoku.name] = value;
			$('#delete').disable(false);
		}

		function check_title() {
			saved = ("sk " + title_t.value) in localStorage;
			$('#delete').disable(!saved);
		}

		function inc_title(n) {
			var v = /\d+-\d+-\d+$/g.exec(title_t.value);
			if (v) {
				var d = new Date(v[0]);
				d.setTime(d.getTime() + n * 24 * 3600000);
				title_t.value = "STrib " + d.toISOString().slice(0, 10);
				check_title();
				return;
			}
			v = /\d+$/g.exec(title_t.value);
			if (v) {
				var num = parseInt(v[0]) + n;
				var str = num.toFixed(0);
				while (str.length < v[0].length) {
					str = "0" + str;
				}
				title_t.value = title_t.value.substring(0, v.index) + str;
				check_title();
				return;
			}
		}

		function get_row(n) {
			var value = Array(10).fill(0);
			var s = Math.floor(s / 3) * 3 * 9 + (n % 3) * 3;
			for (i = 0; i < 3; i++) {
				for (j = 0; j < 3; j++) {
					value[theSudoku.guess[s + i * 9 + j]] += 1;
				}
			}
			return value.slice(1);
		}

		function get_column(n) {
			var value = Array(10).fill(0);
			var s = Math.floor(s / 3) * 9 + (n % 3) * 3;
			for (i = 0; i < 3; i++) {
				for (j = 0; j < 3; j++) {
					value[theSudoku.guess[s + i * 9 + j * 3]] += 1;
				}
			}
			return value.slice(1);
		}

		function get_square(n) {
			var value = Array(10).fill(0);
			for (i = 0; i < 9; i++) {
				value[theSudoku.guess[n * 9 + i]] += 1;
			}
			return value.slice(1);
		}

		function found9(n) {
			var count = 0;
			for (i = 0; i < 81; i++) {
				if (theSudoku.guess[i] == n) count += 1;
			}
			return count == 9;
		}


		function is_bad(v) {
			return v.find(n => n > 1) >= 0;
		}

		function is_complete() {
			return theSudoku.guess.indexOf(0) < 0;
		}

		function check_guess(n) {
			theSudoku.solved = false;
			$('#solved').disable(true);

			var counts = Array(10).fill(0);
			for (i = 0; i < 81; i++) {
				counts[theSudoku.guess[i]]++;
			}
			for (i = 1; i < counts.length; i++) {
				$("#d" + i).css("color", counts[i] > 8 ? "red" : "")
			}
			for (i = 1; i < counts.length; i++) {
				if (counts[i] != 9) return;
			}
			for (var i = 0; i < 9; i++) {
				if (is_bad(get_row(i)) || is_bad(get_column(i)) || is_bad(get_square(i)))
					return;
			}
			theSudoku.solved = true;
			$('#solved').disable(false);
		}

		function select_row(e) {
			var name = e.currentTarget.title;
			try {
				var q = localStorage["sk " + name].split(';');
				theSudoku.name = name;
				theSudoku.value = from_string(q[0]);
				theSudoku.guess = q.length < 2 ? from_string(q[0]) : from_string(q[1]);
				theSudoku.solved = q[0].endsWith('Y');
			} catch (e) {
				return;
			}
			title_t.value = theSudoku.name;
			check_guess();
			change_digit(null);
			setMode("play");
		}

		function build_list() {
			var keys = [];
			for (var i = 0; i < localStorage.length; i++) {
				var s = localStorage.key(i);
				if (s.startsWith("sk "))
					keys.push(s);
			}
			$("tr:gt(0)").remove();
			keys = keys.sort();
			for (var i = keys.length; i > 0; --i) {
				var s = keys[i - 1];
				var value = localStorage[s].split(";")[0];
				var name = s.substring(3);
				var solved = value.endsWith("Y") ? "&check;" : "";
				$("#items").append('<tr title="' + name + '"><td>' //
					+ solved + '</td><td>' //
					+ name + '</td><td>' //
					+ value + '</td></tr>' //
				)
				$("tr:last").click(select_row);
				if (hide && solved) {
					$("tr:last").hide();
				}
			}
		}

		var digit;
		var theCell;
		function highlight_cell(c) {
			if (theCell != null) $(theCell).css('background', '');
			theCell = c;
			if (c != null) $(c).css('background', 'lightgray');
		}

		function get_digit(d) {
			if (d == null)
				return 0;
			var value = d.innerText;
			if (value == '*') value = 0;
			else value = parseInt(value);
			return value;
		}

		function change_digit(d) {
			if (digit == d)
				return;

			$('.theDigit').removeClass('theDigit');
			if (d != null) {
				$(d).addClass('theDigit');
			}
			digit = d;

			var v = get_digit(digit);
			if (v != 0) {
				$("div > div").each(function (i) {
					$(this).css('background', theSudoku.guess[i] == v ? 'lightgray' : "");
				});
			}
			else {
				$("div > div").css('background', '');
			}
		}

		function set_cell_value(c, digit) {
			var value = get_digit(digit);
			$(c).text(value == 0 ? ' ' : value);
			theSudoku.guess[c.id] = value;
			return value;
		}

		// select a digit
		$("#choices > li").click(function (li) {
			if (mode == 'edit') {
				if (theCell == null) return;
				theSudoku.value[theCell.id] = set_cell_value(theCell, li.target);
				highlight_cell(document.getElementById(parseInt(theCell.id) + 1));
			} else {
				change_digit(li.target);
			}
		});
		$("#choices > li").each(function (i) {
			this.id = "d" + this.innerText
		});

		// Put the selected digit in the clicked cell
		$("div > div").click(function (div) {
			if (mode == 'edit') {
				highlight_cell(div.target);
			} else if (theSudoku.value[div.target.id] == 0 && digit != null) {
				var value = set_cell_value(div.target, digit);
				if (value != 0) $(div.target).css('background', 'lightgray')
				check_guess(div.target.id);
			}
		});

		// Clear all the cells
		$("div > div").text('');

		// Assign an id for each cell 1-81 
		$("div > div").each(function (i) { this.id = i })

		// Global actions
		$('#new').click(function (e) {
			var today = new Date();
			today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
			theSudoku.name = "STrib " + today.toISOString().slice(0, 10);
			theSudoku.value = empty.slice();
			theSudoku.guess = empty.slice();

			title_t.value = theSudoku.name;

			setMode("edit");
		});

		// Edit mode actions
		$("#solve, #save").click(function (e) {
			save();
			setMode("play");
		});
		$("#delete").click(function (e) {
			delete localStorage["sk " + theSudoku.name];
			this.disabled = true;
		});

		$("#title").keyup(check_title);
		$("#inctitle").click(e => inc_title(1));
		$("#dectitle").click(e => inc_title(-1));

		// Play mode actions
		$("#solved").click(function (e) {
			localStorage["sk " + theSudoku.name] =
				as_string(theSudoku.value, theSudoku.solved) + ";" + as_string(theSudoku.guess, false);
			setMode("list");
		});
		$("#reset").click(function (e) {
			change_digit(null);
			theSudoku.guess = theSudoku.value.slice();
			check_guess();
			setMode("play");
		});
		$("#edit").click(e => setMode("edit"));
		$("#list").click(e => setMode("list"));

		// List panel actions
		$("#hide").click(e => show_hide(true));
		$("#show").click(e => show_hide(false));

		// Initialize quip from URL query if present
		if (document.URL.indexOf("?") > 0) {
			var query = document.URL.substring(document.URL.indexOf("?") + 1);
			var pos = query.indexOf("&");
			if (pos > 0) {
				theSudoku.name = decodeURI(query.substring(0, pos));
				theSudoku.value = from_string(query.substring(pos + 1));
				theSudoku.guess = theSudoku.value.slice();
				title_t.value = theSudoku.name;
				save();
				setMode('play');
				window.history.replaceState('', '', document.URL.substring(0, document.URL.indexOf("?")));
			} else
				setMode("edit");

		} else {
			restoreSudoku();
			setMode("edit");
		}

	});