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
}});
$(document).ready(
	function() {
			
		var title_t = document.getElementById("title");

		var empty = [];
		for (var i=0; i<81; i++) {
			empty[i]= ' ';
		}

		var theSudoku = {value: empty.slice(), guess: empty.slice(), name: ''};
		var hide;
		
		var mode;
		function setMode(m) {
			if (mode != m) {
				$('button, table, a').hide();
				switch (m) {
				case 'edit': 
					$('#setup, #choices, #new, #solve, #delete, #dectitle, #inctitle, #list').show();
					$('div div').css("color", "red");
					$('div div').each(function(i) {
						$(this).text(theSudoku.value[i])
					});
					change_digit(null);
					break;
				case 'play':
					$('#setup, #choices, #new, #solved, #edit, #reset, #list, a').show();
					check_guess();
					$('div div').css("color", "black");
					$('div div').each(function(i) {
						$(this).text(theSudoku.guess[i]);
						if (theSudoku.value[i] != ' ') {
							$(this).css("color", "red");
						}
					});
					change_cell(null);
					break;
				case 'list':
					$('#new, #solve, #edit').show();
					$('#setup, #choices').hide();
					$('table').show();
					build_list();
					break;
				}
				mode = m;
			}
		}
		
		function as_string(value, solved) {
			var s = '';
			for (var i=0; i<81; i++) {
				s += value[i] == ' ' ? '0' : value[i];
			}
			return s + (solved?'Y':'N');
		}
		
		function from_string(s) {
			var value = [];
			for (var i=0; i<81; i++) {
				value[i] = s.charAt(i);
				if (value[i] == '0') value[i] = ' ';
			}
			return value;
		}

		function loadFromStorage() {
			if ("sudoku" in localStorage) {
				try {
					var q = JSON.parse(localStorage["sudoku"]);
					if (q.valid) {
						theSudoku = q;
					}
				} catch (e) {
					theSudoku.name = "Sample";
					theSudoku.value = empty.slice();
					theSudoku.guess = empty.slice();
					theSudoku.valid = false;
				}
				title_t.value = theSudoku.name;
			}
		}

		loadFromStorage();
		
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
					+ "subject=" + encodeURIComponent(day+"'s sudoku")
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

		function store() {
			var value = as_string(theSudoku.value, theSudoku.solved);
			if (theSudoku.name != title_t.value) {
				if (theSudoku.name != "" && localStorage["sk " + theSudoku.name] == value) {
					delete localStorage["sk " + theSudoku.name];
				}
				theSudoku.name = title_t.value;
			}

			localStorage["sk " + theSudoku.name] = value;
			$('#delete').disable(false);
		}
		function inc_title(n) {
			var v = /\d+-\d+-\d+$/g.exec(title_t.value);
			if (v) {
				var d = new Date(v[0]);
				d.setTime(d.getTime() + n * 24*3600000);
				title_t.value = "STrib " + d.toISOString().split("T")[0];
				$('#delete').disable(true);
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
				$('#delete').disable(true);
				return;
			}
		}
		
		function get_row (n) {
			var value = [];
			var s = Math.floor(s/3)*3*9 + (n % 3) * 3;
			for (i = 0; i<3; i++ ) {
				for (j=0; j<3; j++) {
					value.push(theSudoku.guess[s+i*9 + j]);
				}
			}
			return value;
		}
		
		function get_column (n) {
			var value = [];
			var s = Math.floor(s/3)*9 + (n % 3) * 3;
			for (i = 0; i<3; i++ ) {
				for (j=0; j<3; j++) {
					value.push(theSudoku.guess[s+i*9+j*3]);
				}
			}
			return value;
		}
		
		function get_square (n) {
			var value = [];
			for (i = 0; i<9; i++ ) {
				value.push(theSudoku.guess[n*9 + i]);
			}
			return value;
		}
		
		function is_bad(v) {
			var m = {};
			for (i=0; i<v.length; i++) {
				var c = v[i];
				if (c != ' ' && m[c]) return true;
				m[c] = true;
			}
			return false;
		}
		
		function is_complete() {
			for (var i=0; i<81; i++) {
				if (theSudoku.guess[i] == ' ')
					return false;
			}
			return true;
		}
		
		function check_guess (n) {
			theSudoku.solved = false;
			if (n != null) {
				if (theSudoku.guess[n] == ' ') {
					$('#solved').disable(true);
					return;
				} 
				if (is_bad(get_row(Math.floor((n % 9)/3)+Math.floor(n/27)*3)) 
						|| is_bad(get_column(n % 9)) 
						|| is_bad(get_square(Math.floor(n/9)))) {
					$('#solved').disable(true);
					return;
				}
				if (is_complete() == false)  {
					$('#solved').disable(true);
					return;
				}
			}
			for (var i=0; i<9; i++) {
				if (is_bad(get_row(i)) || is_bad(get_column(i)) || is_bad(get_square(i))) {
					$('#solved').disable(true);
					return;
				}
			}
			if (is_complete() == false)  {
				$('#solved').disable(true);
				return;
			}
			theSudoku.solved = true;
			$('#solved').disable(false);
		}

		function select_row(e) {
			var name = e.currentTarget.title;
			try {
				var q = from_string(localStorage["sk " + name]);
				theSudoku.name = name;
				theSudoku.value = q;
				theSudoku.guess = q.slice();
			} catch (e) {
				return;
			}
			title_t.value = theSudoku.name;

			setMode("play");
		}

		function build_list () {
			$("tr").remove();
			for ( var i = localStorage.length; i > 0; --i) {
				var s = localStorage.key(i-1);
				if (s.startsWith("sk ")) {
					add_list_item(s.substring(3), localStorage[s]);
				}
			}
		}
		
		function add_list_item(name, value) {
			var solved = value.endsWith("Y") ? "&check;"	: "";
			$("#items").append('<tr title="' + name + '"><td>' //
					+ solved + '</td><td>' //
					+ name + '</td><td>' //
					+ value + '</td></tr>' //
			);
			$("tr:last").click(select_row);
			if (hide && solved)
				$("tr:last").hide();
		}
		
		var digit;
		var theCell;
		function change_cell(c) {
			if (theCell != null) $(theCell).css('background', theCell.save_background);
			theCell = c;
			if (c != null) $(c).css('background', 'lightgray');
		}
		function change_digit(d) {
			if (digit != null) {
				$(digit).removeClass('theDigit');
				var v = get_digit(digit);
				if (v != ' ') {
					$('div div').each(function(i) {
						if (theSudoku.guess[i] == v) $(this).css('background', this.save_background);
					});
				}
			}
			digit = d;
			if (d != null) {
				$(d).addClass('theDigit');
				var v = get_digit(d);
				if (v != ' ') {
					$('div div').each(function(i) {
						if (theSudoku.guess[i] == v) $(this).css('background', 'lightgray');
					});
				}
			}
		}
		function get_digit(d) {
			if (d == null)
				return ' ';
			var value = d.innerText;
			if (value == '*') value = ' ';
			return value;
		}
		
		// select a digit
		$('li').click(function(li) {
			if (mode == 'edit') {
				if (theCell == null) return;
				var value = get_digit(li.target);
				$(theCell).text(value);
				var id = theCell.id;
				theSudoku.guess[id] = value;
				theSudoku.value[id] = value;
				change_cell(document.getElementById(parseInt(id)+1));
			} else {
				change_digit(li.target);
			}
		});
		
		// Put the selected digit in the clicked cell
		$('div div').click(function(div) {
			if (mode == 'edit') {
				change_cell(div.target);
				return;
			}
			if (theSudoku.value[div.target.id] == ' ' && digit != null) {
				var value = get_digit(digit);
				theSudoku.guess[div.target.id] = value;
				$(div.target).text(value);
				if (value != ' ') $(div.target).css('background', 'lightgray')
				check_guess(div.target.id);
			}
		});
		
		// Clear all the cells
		$('div div').text('');
		
		// Assign an id for each cell 1-81 
		$('div div').each(function(i) {
			this.id = i; this.save_background = $(this).css('background')
		})

		// Global actions
		$('#new').click(function(e) {
			theSudoku.name = "STrib " + new Date().toISOString().split("T")[0];
			theSudoku.value = empty.slice();
			theSudoku.guess = empty.slice();

			title_t.value = theSudoku.name;

			setMode("edit");
		});
		
		// Edit mode actions
		$("#solve").click(function(e) {
			save();
			setMode("play");
		});
		$("#delete").click(function(e) {
			delete localStorage["sk " + theSudoku.name];
			this.disabled = true;
		});
		
		$("#title").keyup(function (p) {
			$('#delete').disable(true);
			if (title_t.value != "") {
				$('#delete').disable("sk " + title_t.value in localStorage);
			}
		});
		$("#inctitle").click(function (e) {inc_title(1);});
		$("#dectitle").click(function (e) {inc_title(-1);});

		// Play mode actions
		$("#solved").click(function(e) {
			theSudoku.solved = true;
			localStorage["sk " + theSudoku.name] = as_string(theSudoku.value, theSudoku.solved);
			setMode("edit");
		});
		$("#reset").click(function(e) {
			change_digit(null);
			theSudoku.guess = theSudoku.value.slice();
			theSudoku.solved = false;
			mode = '';
			setMode('play');
		});
		$("#edit").click(function(e) {
			setMode("edit");
		});
		$("#list").click(function(e) {
			setMode("list");
		});
		
		// Initialize quip from URL query if present
		if (document.URL.indexOf("?") > 0) {
			var query = document.URL.substring(document.URL.indexOf("?")+1);
			var pos = query.indexOf("&");
			if (pos > 0) {
				theSudoku.name = decodeURI(query.substring(0, pos));
				theSudoku.value = from_string(query.substring(pos+1));
				theSudoku.guess = theSudoku.value.slice();
				title_t.value = theSudoku.name;
				save();
				setMode('play');
				return;
			}
		}

		setMode("edit");

	});