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
		
		function is_play() {
			return mode == 'play';
		}
		
		function is_edit() {
			return mode == 'edit';
		}
		
		function setMode(m) {
			if (mode != m) {
				$('button').hide();
				switch (m) {
				case 'edit': 
					$('#new, #solve, #delete, #dectitle, #inctitle').show();
					$('div div').css("color", "red");
					$('div div').each(function(i) {$(this).text(theSudoku.value[i])})
					break;
				case 'play':
					$('#new, #solved, #edit, #reset').show();
					check_guess();
					$('div div').css("color", "black");
					$('div div').each(function(i) {
						$(this).text(theSudoku.guess[i]);
						if (theSudoku.value[i] != ' ') {
							$(this).css("color", "red");
						}
					})
					break;
				}
				mode = m;
			}
		}

		function loadFromStorage() {
			var keys = [];
			for ( var i = 0; i < localStorage.length; i++) {
				var s = localStorage.key(i);
				if (s.indexOf("keep ") == 0) {
					keys.push(s.substring(s.indexOf(" ") + 1));
				}
			}

			keys.sort();
			for (k in keys) {
				add(keys[k]);
			}

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
					theSudoku.valid = true;
				}
				title_t.value = theSudoku.name;
			}
		}

		loadFromStorage();

		function save() {
			theSudoku.name = title_t.value;
			localStorage["sudoku"] = JSON.stringify(theSudoku, 0, 1);
		}

		function store(e) {
			if (theSudoku.name != title_t.value) {
				if (theSudoku.name != "" && theSudoku.value == value) {
					delete localStorage["keep " + theSudoku.name];
					delete localStorage["solved " + theSudoku.name];
					find(theSudoku.name).remove();
				}
				theSudoku.name = title_t.value;
			}

			if (localStorage["keep " + theSudoku.name] != theSudoku.value) {
				find(theSudoku.name).remove();
				localStorage["keep " + theSudoku.name] = theSudoku.value;
				add(theSudoku.name);
			}

			$('#delete').disable(true);
			$('store').disable(false);
		}
		function inc_title(n) {
			var v = /\d+-\d+-\d+$/g.exec(title_t.value);
			if (v) {
				var d = new Date(v[0]);
				d.setTime(d.getTime() + n * 24*3600000);
				title_t.value = "STrib " + d.toISOString().split("T")[0];
				$('#delete').disable(true);
				$('#store').disable(false);
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
				$('#store').disable(false);
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
		
		function check_guess () {
			for (var i=0; i<9; i++) {
				if (is_bad(get_row(i)) || is_bad(get_column(i)) || is_bad(get_square(i)))
					return false;
			}
			if (is_complete() == false) {
				$('#solved').disable(false);
			}
		}

		function select_row(e) {
			theSudoku.name = e.currentTarget.title;
			theSudoku.value = localStorage["keep " + theQuip.name];
			theSudoku.guess = "";

			title_t.value = theSudoku.name;

			setMode("run");
		}
		
		function add(name) {
			var solved = localStorage["solved " + name] ? "&check;"	: "";
			$("#items").append('<tr title="' + name + '"><td>' //
					+ solved + '</td><td>' //
					+ name + '</td><td>' //
					+ localStorage["keep " + name].small() //
					+ '</td></tr>' //
			);
			$("tr:last").click(select_row);
			if (hide && solved)
				$("tr:last").hide();
		}
		function find(name) {
			return $("tr").filter(function(i) {
				return this.title == name;
			});
		}
		
		var digit;

		// select a digit
		$('li').click(function(li) {
			if (digit != null)
				$(digit).removeClass('theDigit');
			digit = li.target;
			$(digit).addClass('theDigit');
		});
		
		// Put the selected digit in the clicked cell
		$('div div').click(function(div) {
			if (digit == null)
				return;
			var value = digit.innerText;
			if (value == '*') {
				value = ' ';
			}
			if (is_play() && theSudoku.value[div.target.id] != ' ')
				return;
			$(div.target).text(value);
			theSudoku.guess[div.target.id] = value;
			if (mode == 'edit')
				theSudoku.value[div.target.id] = value;
		});
		
		// Clear all the cells
		$('div div').text('');
		
		// Assign an id for each cell 1-81 
		$('div div').each(function(i) {this.id = i})

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
			setMode("play");
		});
		$("#delete").click(function(e) {
			delete localStorage["keep " + theSudoku.name];
			delete localStorage["solved " + theSudoku.name];
			find(theSudoku.name).remove();
			this.disabled = true;
		});
		
		$("#title").keyup(function (p) {
			$('#store, #delete').disable(true);
			if (title_t.value != "") {
				$('#delete').disable("keep " + title_t.value in localStorage);
			}
		});
		$("#inctitle").click(function (e) {inc_title(1);});
		$("#dectitle").click(function (e) {inc_title(-1);});

		// Play mode actions
		$("#solved").click(function(e) {
			localStorage["solved " + theSudoku.name] = "Y";
			find(theSudoku.name).remove();
			add(theSudoku.name);
			setMode("edit");
		});
		$("#reset").click(function(e) {
			theSudoku.guess = theSudoku.value;
			mode = '';
			setMode('play');
		});
		$("#edit").click(function(e) {
			setMode("edit");
		});

		setMode("edit");

	});