$(document).ready(
	function() {

		var puzzle = document.getElementById("puzzle");
		var selection = document.getElementById("selection");
		var delete_b = document.getElementById("delete");
		var store_b = document.getElementById("store");
		var title_t = document.getElementById("title");
		
		var hide;

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
						theQuip = q;
					}
				} catch (e) {
					theSudoku.value = "";
					theSudoku.name = "Sample";
					theSudoku.key = "";
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

			delete_b.disabled = false;
			store_b.disabled = true;
		}
		function inc_title(n) {
			var v = /\w+ \d+ 20\d+$/g.exec(title_t.value);
			if (v) {
				var d = new Date(v[0]);
				d.setTime(d.getTime() + n * 24*3600000);
				var date = d.toDateString();
				date = date.substring(date.indexOf(" ") + 1);
				title_t.value = title_t.value.substring(0, v.index) + date;
				delete_b.disabled = true;
				store_b.disabled = false;
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
				delete_b.disabled = true;
				store_b.disabled = false;
				return;
			}
		}

		function select_row(e) {
			theSudoku.name = e.currentTarget.title;
			theSudoku.value = localStorage["keep " + theQuip.name];
			theSudoku.key = "";

			title_t.value = theQuip.name;

			delete_b.disabled = false;
			store_b.disabled = false;
			showPanel("run");
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
		function findSolved() {
			return $("tr").filter(function(i) {
				return localStorage["solved " + this.title] == "Y";
			});
		}
		function showPanel(p) {
			localStorage["panel"] = p;
		}
		function setEditButtons(p) {
			if (title_t.value == "") {
				store_b.disabled = true;
				delete_b.disabled = true;
			} else {
				var found = "keep " + title_t.value in localStorage;
				delete_b.disabled = ! found;
				store_b.disabled = quip_ta.value == "" || found && quip_ta.value == localStorage["keep " + title_t.value];
			}
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
			if (digit.innerText == '*')
				$(div.target).text(' ');
			else
				$(div.target).text(digit.innerText);
		});
		
		// Clear all the cells
		$('div div').text('');
		
		// Assign an id for each cell 1-81 
		$('section').children().each(function (i) {
			$(this).children().each(function (j){ this.id = ""+(i*9+j+1)})
		});

		// Global actions
		$('button[name^="new"]').click(function(e) {
			var date = new Date().toDateString();
			date = date.substring(date.indexOf(" ") + 1);
			theQuip.value = "";
			theQuip.name = "STrib " + date;
			theQuip.key = "";

			title_t.value = theQuip.name;
			quip_ta.value = theQuip.value;
			dict = {};

			saveDict();
			quip_ta.focus();
			store_b.disabled = false;
			showPanel("setup");
		});
		$('button[name^="open"]').click(function(e) {
			showPanel("choose");
		});
		$('button[name^="back"]').click(function(e) {
			showPanel("setup");
		});
		// Setup panel actions
		$("#solve").click(function(e) {
			showPanel("run");
		});
		$("#title").keyup(setEditButtons);
		$("#quip").keyup(setEditButtons);
		$("#store").click(store);
		$("#delete").click(function(e) {
			delete localStorage["keep " + theSudoku.name];
			delete localStorage["solved " + theSudoku.name];
			find(theSudoku.name).remove();
			this.disabled = true;
		});
		$("#inctitle").click(function (e) {inc_title(1);});
		$("#dectitle").click(function (e) {inc_title(-1);});

		// Choose panel actions
		$("#hide").click(function(e) {
			findSolved().hide();
			$("#show").show();
			$("#hide").hide();
			hide = true;
		});
		$("#show").click(function(e) {
			findSolved().show();
			$("#hide").show();
			$("#show").hide();
			hide = false;
		});
		$("#maint").click(function(e) {
			showPanel("load");
		});

		// Solve panel actions
		$("#solved").click(function(e) {
			localStorage["solved " + theSudoku.name] = "Y";
			find(theSudoku.name).remove();
			add(theSudoku.name);
			showPanel("setup");
		});
		$("#reset").click(function(e) {
			repaintPuzzle();
		});
		
		$("#choices li").click(function(e) {
			e.currentTarget
			var char = e.currentTarget.innerText;
			var ee = char;
		});

		showPanel(localStorage["panel"]);

	});