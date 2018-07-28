jQuery.fn.extend({
	disable: function (state) {
		return this.each(function () {
			var $this = jQuery(this)
			if ($this.is('input, button'))
				this.disabled = state
			else if ($this.is('select') && state)
				$this.attr('disabled', 'disabled')
			else if ($this.is('select') && !state)
				$this.removeAttr('disabled')
			else
				$this.toggleClass('disabled', state)
		})
	}
});
$(document).ready(
	function () {

		var title_t = document.getElementById("title");
		var empty = Array(81).fill(0);
		var theSudoku = { value: empty.slice(), guess: empty.slice(), name: '', solved: false };
		var hide = true;
		var mode;
		var undo = [];
		var marked = [];

		function setMode(m) {
			$('button, #items, #setup, #choices, #entry, a').hide()
			$('#menu').css("grid-area", "")
			switch (m) {
				case 'edit':
					$('#setup, #choices, #entry, #new, #solve, #dectitle, #inctitle, #list, #delete').show()
					$('#delete').disable(!("sk " + title_t.value) in localStorage)
					$("#title").disable(false)
					$("div > div").css({ color: "red", background: "" })
					$("div > div").each(function (i) {
						$(this).text(theSudoku.value[i] == 0 ? ' ' : theSudoku.value[i])
					})
					$("#choices > li").css("color", "")
					change_digit(null)
					clean_url()
					break
				case 'play':
					$('#setup, #choices, #entry, #undo, #mark, #edit, #solved, #save, #clear, a').show()
					$("#title").disable(true)
					$("#undo, #mark").disable(undo.length == 0)
					$("div > div").css("color", "black")
					$("div > div").each(function (i) {
						$(this).text(theSudoku.guess[i] == 0 ? ' ' : theSudoku.guess[i])
						if (theSudoku.value[i] != 0) {
							$(this).css("color", "red")
						}
					})
					if (marked.length > 0) {
						marked.forEach(e => $(e.split(":")[0]).css("color", "gray"))
						$("#retry").show()
						$("#clear").hide()
					}
					highlight_cell(null)
					check_guess()
					updateLink()
					break
				case 'list':
					$('#new, #solve, #edit, #items').show()
					$('#menu').css("grid-area", "name")
					show_hide(hide)
					build_list()
					clean_url()
					break
			}
			mode = m
		}

		function clean_url() {
			if (document.URL.indexOf("?") > 0) {
				window.history.replaceState('', '', document.URL.substring(0, document.URL.indexOf("?")))
			}
		}

		function show_hide(h) {
			hide = h
			if (hide) {
				$("tr").has(":contains('✓')").hide()
				$("#hide").hide()
				$("#show").show()

			} else {
				$("tr").show()
				$("#hide").show()
				$("#show").hide()
			}
		}

		function as_string(value, solved) {
			return value.join('') + (solved ? 'Y' : 'N')
		}

		function from_string(s) {
			return s.substr(0, 81).replace(/ /g, '0').split('').map(c => parseInt(c))
		}

		var dayOfWeek = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" ")
		function updateLink() {
			var href = document.URL.split("?")[0] + "?" +
				encodeURI(theSudoku.name) + "&" + as_string(theSudoku.value, false)
			var mail_a = document.getElementById("mail")
			if (mail_a != null) {
				var v = /\d+-\d+-\d+$/g.exec(theSudoku.name)
				var d = v ? new Date(v[0]).getUTCDay() : new Date().getDay()
				var day = dayOfWeek[d]
				var iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)
				var mail = iOS ? "googlegmail:///co" : "mailto:"
				mail_a.href = mail + "?"
					+ "subject=" + encodeURIComponent(day + "'s sudoku")
					+ "&body=" + encodeURIComponent(href)
			}
		}

		function save() {
			theSudoku.name = title_t.value
			theSudoku.valid = true
			localStorage["sudoku"] = JSON.stringify(theSudoku, 0, 1)
		}

		function restore_sudoku() {
			try {
				var q = JSON.parse(localStorage["sudoku"]);
				if (q.valid) {
					theSudoku = q
					title_t.value = theSudoku.name
					undo = []
					marked = []
				}
			} catch (e) { }
		}

		function store() {
			save()
			var value = as_string(theSudoku.value, theSudoku.solved) + ";" + as_string(theSudoku.guess, false)
			localStorage["sk " + theSudoku.name] = value
			$('#delete').disable(false)
		}

		function fetch(name) {
			var v = localStorage["sk " + name]
			if (v == null) return null
			var q = v.split(';')
			if (q.length < 1) return null
			return { name: name, value: from_string(q[0]), guess: from_string(q[q.length - 1]), solved: q[0].endsWith('Y') }
		}

		function check_title() {
			saved = ("sk " + title_t.value) in localStorage
			$('#delete').disable(!saved)
		}

		function inc_title(n) {
			var v = /\d+-\d+-\d+$/g.exec(title_t.value)
			if (v) {
				var d = new Date(v[0])
				d.setTime(d.getTime() + n * 24 * 3600000)
				title_t.value = "STrib " + d.toISOString().slice(0, 10)
				check_title()
				return
			}
			v = /\d+$/g.exec(title_t.value)
			if (v) {
				var num = parseInt(v[0]) + n
				var str = num.toFixed(0)
				while (str.length < v[0].length) {
					str = "0" + str
				}
				title_t.value = title_t.value.substring(0, v.index) + str
				check_title()
				return;
			}
		}

		function get_row(n) {
			var value = Array(10).fill(0)
			var s = Math.floor(s / 3) * 3 * 9 + (n % 3) * 3
			for (i = 0; i < 3; i++) {
				for (j = 0; j < 3; j++) {
					value[theSudoku.guess[s + i * 9 + j]] += 1
				}
			}
			return value.slice(1)
		}

		function get_column(n) {
			var value = Array(10).fill(0)
			var s = Math.floor(s / 3) * 9 + (n % 3) * 3
			for (i = 0; i < 3; i++) {
				for (j = 0; j < 3; j++) {
					value[theSudoku.guess[s + i * 9 + j * 3]] += 1
				}
			}
			return value.slice(1)
		}

		function get_square(n) {
			var value = Array(10).fill(0)
			for (i = 0; i < 9; i++) {
				value[theSudoku.guess[n * 9 + i]] += 1
			}
			return value.slice(1)
		}

		function found9(n) {
			var count = 0
			for (i = 0; i < 81; i++) {
				if (theSudoku.guess[i] == n) count += 1
			}
			return count == 9
		}

		function is_bad(v) {
			return v.find(n => n > 1) >= 0
		}

		function check_guess() {
			theSudoku.solved = false
			$('#solved').disable(true)

			var counts = Array(10).fill(0)
			for (i = 0; i < 81; i++) {
				counts[theSudoku.guess[i]]++
			}
			for (i = 1; i < counts.length; i++) {
				$("#d" + i).css("color", counts[i] > 8 ? "red" : "")
			}
			for (i = 1; i < counts.length; i++) {
				if (counts[i] != 9) return
			}
			for (var i = 0; i < 9; i++) {
				if (is_bad(get_row(i)) || is_bad(get_column(i)) || is_bad(get_square(i)))
					return
			}
			theSudoku.solved = true
			$('#solved').disable(false)
		}

		function select_row(e) {
			var name = e.currentTarget.title
			var ts = fetch(name)
			if (ts == null) return
			theSudoku = ts
			title_t.value = name
			save()
			change_digit(null)
			setMode("play")
		}

		function build_list() {
			var keys = []
			for (var i = 0; i < localStorage.length; i++) {
				var s = localStorage.key(i);
				if (s.startsWith("sk ")) keys.push(s)
			}
			$("tr:gt(0)").remove()
			keys = keys.sort()
			for (var i = keys.length; i > 0; --i) {
				var s = keys[i - 1]
				var value = localStorage[s].split(";")[0]
				var name = s.substring(3)
				var solved = value.endsWith("Y") ? "&check;" : ""
				$("#items").append('<tr title="' + name + '"><td>' //
					+ solved + '</td><td>' //
					+ name + '</td><td>' //
					+ value + '</td></tr>' //
				)
				$("tr:last").click(select_row)
				if (hide && solved) $("tr:last").hide()
			}
		}

		function get_digit(d) {
			if (d == null) return 0
			switch (typeof (d)) {
				case "object":
					d = d.innerText
				case "string":
					d = (d == '*') ? 0 : parseInt(d)
				case "number":
			}
			return d
		}

		function highlight_cells(c) {
			var v = get_digit(c);
			if (v != 0) {
				$("div > div").each(function (i) {
					$(this).css('background', theSudoku.guess[i] == v ? 'lightgray' : "")
				})
			}
			else $("div > div").css('background', '')
		}

		var digit;
		var theCell;
		function highlight_cell(c) {
			$("div > div").css('background', '')
			if (c != null) $(c).css('background', 'lightgray')
			theCell = c
		}

		function change_digit(d) {
			if (digit == d) return

			$('.theDigit').removeClass('theDigit')
			if (d != null) $(d).addClass('theDigit')
			digit = d
			highlight_cells(d);
		}

		function set_cell_value(c, value, is_edit) {
			value = get_digit(value)
			$(c).text(value == 0 ? ' ' : value)
			theSudoku.guess[c.id] = value
			if (is_edit) {
				theSudoku.value[c.id] = value
				highlight_cell(document.getElementById(parseInt(c.id) + 1))
			} else {
				$(c).css('background', value != 0 && value == get_digit(digit) ? 'lightgray' : '').css("color", "black")
				check_guess()
			}
		}

		// select a digit
		$("#choices > li").click(function (li) {
			if (mode == 'edit') {
				if (theCell != null) {
					set_cell_value(theCell, li.target, true)
					undo = []
					marked = []
				}
			} else {
				change_digit(li.target)
			}
		})
		$("#choices > li").each(function (i) {
			this.id = "d" + this.innerText
		})

		// Put the selected digit in the clicked cell
		$("div > div").click(function (div) {
			if (mode == 'edit') {
				highlight_cell(div.target)
			} else if (theSudoku.value[div.target.id] == 0 && digit != null) {
				undo.push("#" + div.target.id + ":" + theSudoku.guess[div.target.id])
				set_cell_value(div.target, digit, false)
				if (undo.length == 1) $("#undo, #mark").disable(false)
				save()
			}
		})

		// Clear all the cells
		$("div > div").text('')

		// Assign an id for each cell 1-81 
		$("div > div").each(function (i) { this.id = i })

		// Global actions
		$('#new').click(function (e) {
			var today = new Date()
			today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
			theSudoku.name = "STrib " + today.toISOString().slice(0, 10)
			theSudoku.value = empty.slice()
			theSudoku.guess = empty.slice()
			theSudoku.solved = false

			title_t.value = theSudoku.name
			undo = []
			marked = []

			setMode("edit")
		})

		// Edit mode actions
		$("#solve").click(function (e) {
			theSudoku.name = title_t.value
			store()
			setMode("play")
		})
		$("#delete").click(function (e) {
			delete localStorage["sk " + theSudoku.name]
			this.disabled = true
		})

		$("#title").keyup(check_title)
		$("#inctitle").click(e => inc_title(1))
		$("#dectitle").click(e => inc_title(-1))

		// Play mode actions
		$("#solved").click(function (e) {
			store()
			setMode("list")
		})
		$("#clear").click(function (e) {
			change_digit(null)
			theSudoku.guess = theSudoku.value.slice()
			undo = []
			marked = []
			setMode("play")
		})
		$("#edit").click(e => setMode("edit"))
		$("#list").click(e => setMode("list"))
		$("#save").click(e => store())

		$("#undo").click(function (e) {
			if (undo.length == 0) return
			var top = undo.pop()
			var last = top.split(":")
			if (marked.length > 0 && marked[marked.length - 1] == top) {
				marked.pop()
				if (marked.length == 0) {
					$("#retry").hide()
					$("#clear").show()
				}
			}
			if (undo.length == 0) $("#undo, #mark").disable(true)
			set_cell_value($(last[0])[0], last[1], false)
		})

		$("#mark").click(function (e) {
			if (undo.length == 0) return
			var last = undo[undo.length-1].split(":")
			$(last[0]).css("color", "gray")
			marked.push(undo[undo.length-1])
			$("#retry").show()
			$("#clear").hide()
		})
		$("#retry").click(function (e) {
			while (undo.length  > 0 && marked.length > 0) {
				if (marked[marked.length - 1] == undo[undo.length - 1]) return
				var last = undo.pop().split(":")
				set_cell_value($(last[0])[0], last[1], false)
			}
		})

		// List panel actions
		$("#hide").click(e => show_hide(true))
		$("#show").click(e => show_hide(false))

		restore_sudoku()

		// Initialize quip from URL query if present
		if (document.URL.indexOf("?") > 0) {
			var query = document.URL.substring(document.URL.indexOf("?") + 1)
			var pos = query.indexOf("&")
			if (pos > 0) {
				var name = decodeURI(query.substring(0, pos))
				var value_string = query.substring(pos + 1)
				if (theSudoku.name != name || as_string(theSudoku.value, false) != value_string) {
					theSudoku.name = name
					theSudoku.value = from_string(value_string)
					theSudoku.guess = theSudoku.value.slice()
					title_t.value = theSudoku.name
					var v = fetch(name)
					if (v == null || v.solved == false)	store()
					else save()
				}
				setMode('play')
			} else
				setMode("edit")

		} else {
			setMode("edit")
		}

	});