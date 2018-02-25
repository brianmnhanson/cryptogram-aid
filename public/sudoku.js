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

		var empty = Array(81).fill(0);

		var theSudoku = {value: empty.slice(), guess: empty.slice(), name: '', solved: false};
		var hide;
		
		var mode;
		
		function setMode(m) {
			if (mode != m) {
				$('button, table, a, checkbox').hide();
				switch (m) {
				case 'edit': 
					$('#setup, #choices, #new, #solve, #dectitle, #inctitle, #list').show();
					$('div div').css("color", "red");
					$('div div').each(function(i) {
						$(this).text(theSudoku.value[i] == 0 ? ' ' : theSudoku.value[i]);
					});
					change_digit(null);
					break;
				case 'play':
					$('#setup, #choices, #new, #solved, #edit, #reset, #list, a').show();
					$('div div').css("color", "black");
					$('div div').each(function(i) {
						$(this).text(theSudoku.guess[i] == 0 ? ' ' : theSudoku.guess[i]);
						if (theSudoku.value[i] != 0) {
							$(this).css("color", "red");
						}
					});
					highlight_cell(null);
					check_guess();
					break;
				case 'list':
					$('#new, #solve, #edit, #all').show();
					$('#setup, #choices').hide();
					$('table').show();
					build_list();
					break;
				}
				mode = m;
			}
		}
		
		function as_string(value, solved) {
			return value.join('') + (solved?'Y':'N');
		}
		
		function from_string(s) {
			return s.substr(0, 81).replace(/ /g, '0').split('');
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
				check_guess();
			}
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
			var value = Array(10).fill(0);
			var s = Math.floor(s/3)*3*9 + (n % 3) * 3;
			for (i = 0; i<3; i++ ) {
				for (j=0; j<3; j++) {
					value[theSudoku.guess[s+i*9 + j]]+=1;
				}
			}
			return value.slice(1);
		}
		
		function get_column (n) {
			var value = Array(10).fill(0);
			var s = Math.floor(s/3)*9 + (n % 3) * 3;
			for (i = 0; i<3; i++ ) {
				for (j=0; j<3; j++) {
					value[theSudoku.guess[s+i*9+j*3]]+=1;
				}
			}
			return value.slice(1);
		}
		
		function get_square (n) {
			var value = Array(10).fill(0);
			for (i = 0; i<9; i++ ) {
				value[theSudoku.guess[n*9 + i]]+=1;
			}
			return value.slice(1);
		}
		
		function is_bad(v) {
			return v.find(n => n > 1) >= 0;
		}
		
		function is_complete() {
			return theSudoku.guess.indexOf("0") < 0;
		}
		
		function check_guess (n) {
			theSudoku.solved = false;
			$('#solved').disable(true);
			if (is_complete() == false)  {
				return;
			}
			if (n != null) {
				if (theSudoku.guess[n] == 0) {
					return;
				} 
				if (is_bad(get_row(Math.floor((n % 9)/3)+Math.floor(n/27)*3)) 
						|| is_bad(get_column(n % 9)) 
						|| is_bad(get_square(Math.floor(n/9)))) {
					return;
				}
				if (is_complete() == false)  {
					return;
				}
			}
			for (var i=0; i<9; i++) {
				if (is_bad(get_row(i)) || is_bad(get_column(i)) || is_bad(get_square(i))) {
					return;
				}
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

			setMode("play");
		}

		function build_list () {
			$("tr:gt(0)").remove();
			for ( var i = localStorage.length; i > 0; --i) {
				var s = localStorage.key(i-1);
				if (s.startsWith("sk ")) {
					var value = localStorage[s].split(";")[0];
					var name = s.substring(3);
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
			}
		}
		
		var digit;
		var theCell;
		function highlight_cell(c) {
			if (theCell != null) $(theCell).css('background', theCell.save_background);
			theCell = c;
			if (c != null) $(c).css('background', 'lightgray');
		}
		function change_digit(d) {
			if (digit != null) {
				$(digit).removeClass('theDigit');
				var v = get_digit(digit);
				if (v != 0) {
					$('div div').each(function(i) {
						if (theSudoku.guess[i] == v) $(this).css('background', this.save_background);
					});
				}
			}
			digit = d;
			if (d != null) {
				$(d).addClass('theDigit');
				var v = get_digit(d);
				if (v != 0) {
					$('div div').each(function(i) {
						if (theSudoku.guess[i] == v) $(this).css('background', 'lightgray');
					});
				}
			}
		}
		function get_digit(d) {
			if (d == null)
				return 0;
			var value = d.innerText;
			if (value == '*') value = 0;
			return value;
		}
		
		function set_cell_value(theCell, digit) {
			var value = get_digit(digit);
			$(theCell).text(value == 0 ? ' ' : value);
			theSudoku.guess[theCell.id] = value;
			return value;
		}
		
		// select a digit
		$('li').click(function(li) {
			if (mode == 'edit') {
				if (theCell == null) return;
				theSudoku.value[theCell.id] = set_cell_value(theCell, li.target);
				highlight_cell(document.getElementById(parseInt(theCell.id)+1));
			} else {
				change_digit(li.target);
			}
		});
		
		// Put the selected digit in the clicked cell
		$('div div').click(function(div) {
			if (mode == 'edit') {
				highlight_cell(div.target);
			} else if (theSudoku.value[div.target.id] == 0 && digit != null) {
				set_cell_value(div.target, digit);
				if (value != 0) $(div.target).css('background', 'lightgray')
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
			localStorage["sk " + theSudoku.name] = 
				as_string(theSudoku.value, theSudoku.solved) + ";" + as_string(theSudoku.guess, false);
			setMode("list");
		});
		$("#reset").click(function(e) {
			change_digit(null);
			theSudoku.guess = theSudoku.value.slice();
			mode = '';
			check_guess();
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
		} else {
			loadFromStorage();
		}

		setMode("edit");

	});