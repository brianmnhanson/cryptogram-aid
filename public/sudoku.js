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

		var title_t = document.getElementById("title")
		var empty = Array(81).fill(0)
		var theSudoku = { value: empty.slice(), guess: empty.slice(), name: '', solved: false }
		var hide = true
		var mode = ""
		var undo = []
		var marked = new Set()
		var digits = []
		
		var audio_context
		var starting_url = document.URL

		function beep(vol, freq, duration, offset, type) {
			if (duration == 0)
				return
			duration += offset;
            if (typeof audio_context == "undefined")  audio_context = new AudioContext()
			var v=audio_context.createOscillator()
			var u=audio_context.createGain()
			v.connect(u)
			v.frequency.value=freq
			v.type="triangle"
			v.type="sawtooth"
			v.type="square"
			v.type="sine"
			v.type=type
			u.connect(audio_context.destination)
			u.gain.value=vol*0.01
			v.start(audio_context.currentTime+offset*0.001)
			v.stop(audio_context.currentTime+duration*0.001)
		}

		function do_beep(v, count) {
			beep(10, 600 + v, count * 60, 0, "sine")
		}

		function highlight_marks() {
			    marked.forEach(v => {
					var id = v.split(":")[0]
					var item = undo.find(v => v.split(":")[0] == id)
					if (item == v) 
						$(id).css("color", "gray")
				}
			)
			$("#retry").disable(marked.size < 1)
		}

		function setMode(m) {
			$('button, #the-list, #setup, #entry, #mail').hide()
			$('#menu').css("grid-area", "menu")
			$("#choices").show()
			switch (m) {
				case 'edit':
					$('#setup, #entry, #new, #solve, #dectitle, #inctitle, #list, #delete').show()
					$('#delete').disable(!("sk " + title_t.value) in localStorage)
					$("#title").disable(false)
					$("section > div > div").css({ color: "red", background: "" })
					$("section > div > div").each(function (i) {
						$(this).text(theSudoku.value[i] == 0 ? ' ' : theSudoku.value[i])
					})
					$("#choices > li").css("color", "")
					change_digit(null)
					enable_disable_solve()
					clean_url()
					break
				case 'play':
					audio_context = new AudioContext()
					$('#setup, #entry, #undo, #mark, #edit, #solved, #save, #clear, #retry, #mail').show()
					$("#title").disable(true)
					if (undo.length == 0)
						init_undo()
					$("#undo, #mark, #clear").disable(undo.length == 0)
					$("section > div > div").css("color", "black")
					$("section > div > div").each(function (i) {
						$(this).text(theSudoku.guess[i] == 0 ? ' ' : theSudoku.guess[i])
						if (theSudoku.value[i] != 0) {
							$(this).css("color", "red")
						}
					})
					highlight_marks()
					highlight_cell(null)
					check_guess()
					updateLink()
					break
				case 'list':
					$('#new, #solve, #edit, #the-list').show()
					$('#choices').hide()
					show_hide(hide)
					build_list()
					clean_url()
					break
				default: 
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
			var href = starting_url.split("?")[0] + "?" +
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
			theSudoku.undo = undo
			theSudoku.marked = [...marked]
			theSudoku.mode = mode
			localStorage["sudoku"] = JSON.stringify(theSudoku, 0, 1)
		}

		function restore_sudoku() {
			try {
				var q = JSON.parse(localStorage["sudoku"]);
				if (q.valid) {
					theSudoku = q
					title_t.value = theSudoku.name
					undo = q.undo
					marked = new Set(q.marked)
					if (typeof q.mode == "undefined") q.mode = "edit"
					if (q.mode != mode) setMode(q.mode)
				}
			} catch (e) { }
		}

		function store() {
			save()
			do_beep(300, 2)
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

		function get_row(board, n) {
			var value = Array(10).fill(0)
			var s = Math.floor(n / 3) * 27 + (n % 3) * 3
			for (var i = 0; i < 3; i++) {
				for (var j = 0; j < 3; j++) {
					var v = board[s + i * 9 + j]
					value[v] += 1
				}
			}
			return value.slice(1)
		}

		function get_column(board, n) {
			var value = Array(10).fill(0)
			var s = Math.floor(n / 3) * 9 + (n % 3)
			for (var i = 0; i < 3; i++) {
				for (var j = 0; j < 3; j++) {
					var v = board[s + (i * 9 + j) * 3]
					value[v] += 1
				}
			}
			return value.slice(1)
		}

		function get_square(board, n) {
			var value = Array(10).fill(0)
			for (i = 0; i < 9; i++) {
				value[board[n * 9 + i]] += 1
			}
			return value.slice(1)
		}

		function is_bad(v) {
			return v.find(n => n > 1) > 1
		}

		function sudoku_has_conflicts()
        {
			for (var i = 0; i < 9; i++) {
				if (is_bad(get_row(theSudoku.guess, i)) 
				|| is_bad(get_column(theSudoku.guess, i))
				|| is_bad(get_square(theSudoku.guess, i)))
					return true
			}
			return false
		}

		function check_guess() {
			theSudoku.solved = false
			$('#solved').disable(true)

            // mark all digits with 9 entered values as red. If all digits occur 9 times then it might be solved
			digits = Array(10).fill(0)
			for (i = 0; i < 81; i++) {
				digits[theSudoku.guess[i]]++
			}
			for (i = 1; i < digits.length; i++) {
				var color = digits[i] > 8 ? "red" : ""
				$("#d" + i).css("color", color)
			}
			for (i = 1; i < digits.length; i++) {
				if (digits[i] != 9) return
			}

            // Check for conflicts
            if (sudoku_has_conflicts()) return

			theSudoku.solved = true
			$('#solved').disable(false)
		}

		function enable_disable_solve() {
			var bad = theSudoku.value.filter(v => v == 0).length == 81 ||
            	sudoku_has_conflicts()
            $("#solve").disable(bad)
		}

		function init_undo() {
			for (i = 0; i<81; i++) {
				if (theSudoku.value[i] == theSudoku.guess[i]) continue;
				undo.push("#" + i + ":" + 0)
			}
		}

		function select_row(e) {
			var name = e.currentTarget.title
			var ts = fetch(name)
			if (ts == null) return
			theSudoku = ts
			title_t.value = name
			undo = []
			marked.clear()
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
					d = d.match(/\d/) ? parseInt(d) : 0
				case "number":
			}
			return d
		}

		function highlight_cells(c) {
			var v = get_digit(c);
			if (v != 0) {
				$("section > div > div").each(function (i) {
					$(this).css('background', theSudoku.guess[i] == v ? 'lightgray' : "")
				})
			}
			else $("section > div > div").css('background', '')
		}

		var digit;
		var theCell;
		function highlight_cell(c) {
			$("section > div > div").css('background', '')
			if (c != null) $(c).css('background', 'lightgray')
			var changed = theCell != c
			theCell = c
			return changed && c != null
		}

		function change_digit(d) {
			if (digit == d) return false

			$('.theDigit').removeClass('theDigit')
			if (d != null) $(d).addClass('theDigit')
			var changed = digit != d;
			digit = d
			highlight_cells(d);
			return changed;
		}

		function set_cell_value(c, value, is_edit) {
			value = get_digit(value)
			$(c).text(value == 0 ? ' ' : value)
			var old_guess = theSudoku.guess[c.id]
			theSudoku.guess[c.id] = value
			if (is_edit) {
				if (old_guess != 0 && theSudoku.value[c.id] == 0)  {
					undo = []
					marked = []
				}
				theSudoku.value[c.id] = value
				highlight_cell(document.getElementById(parseInt(c.id) + 1))
			} else {
				$(c).css('background', value != 0 && value == get_digit(digit) ? 'lightgray' : '').css("color", "black")
				check_guess()
			}
			return old_guess != value
		}

		// select a digit
		$("#choices > li").click(function (li) {
			if (li.target.id == 'd') return
			if (mode == 'edit') {
				do_beep(li.target.id == 'd*' ? 0 : 600, 1)
				if (theCell != null) {
					set_cell_value(theCell, li.target, true)
					enable_disable_solve()
					undo = []
					marked.clear()
				}
			} else  if (change_digit(li.target)) {
				do_beep(li.target.id == 'd*' ? 0 : 600, 1)
			}
		})
		$("#choices > li").each(function (i) {
			this.id = "d" + this.innerText
		})

		// Put the selected digit in the clicked cell
		$("section > div > div").click(function (div) {
			if (mode == 'edit') {
				if (highlight_cell(div.target))
					do_beep(200, 1)
			} else if (theSudoku.value[div.target.id] == 0  
				&& digit != null
				&& theSudoku.guess[div.target.id] != get_digit(digit)) {
				undo.push("#" + div.target.id + ":" + theSudoku.guess[div.target.id])
				set_cell_value(div.target, digit, false)
				if (undo.length == 1) $("#undo, #mark, #clear").disable(false)
				save()
				if (digits[get_digit(digit)] != 9)
					do_beep(400, 1)
				else {
					if (theSudoku.solved) {
						do_beep(200, 9)
					} else 
						do_beep(200, 3)
				}
			}
		})

		// Clear all the cells
		$("section > div > div").text('')

		// Assign an id for each cell 1-81 
		$("section > div > div").each(function (i) { this.id = i })

		// Global actions
		$('#new').click(function (e) {
			
			if (theSudoku.solved || undo.length < 1 || confirm("You have not completed the current sudoku. Are you sure?")) {
				var today = new Date()
				today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
				theSudoku.name = "STrib " + today.toISOString().slice(0, 10)
				theSudoku.value = empty.slice()
				theSudoku.guess = empty.slice()
				theSudoku.solved = false

				title_t.value = theSudoku.name
				undo = []
				marked.clear()

				setMode("edit")
			}
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
			setMode("edit")
			save()
		})
		$("#clear").click(function (e) {
			if (confirm("Are you sure you want to clear?")) {
				change_digit(null)
				theSudoku.guess = theSudoku.value.slice()
				undo = []
				marked.clear()
				setMode("play")
			}
			do_beep(300, 1)
		})
		$("#edit").click(e => setMode("edit"))
		$("#list").click(e => setMode("list"))
		$("#save").click(e => store())

		$("#undo").click(function (e) {
			if (undo.length == 0) return
			var top = undo.pop()
			if (marked.has(top)) {
				marked.delete(top)
				$("#retry").disable(marked.size < 1)
			}
			var last = top.split(":")
			set_cell_value($(last[0])[0], last[1], false)
			if (undo.length == 0) 
				$("#undo, #mark, #clear").disable(true);
			else
				highlight_marks()
			save()
			do_beep(0, 1)
		})

		$("#mark").click(function (e) {
			if (undo.length == 0) return
			var last = undo[undo.length-1].split(":")
			$(last[0]).css("color", "gray")
			marked.add(undo[undo.length-1])
			save()
			$("#retry").disable(false)
			do_beep(100, 1)
		})

		$("#retry").click(function (e) {
			var n = 0
			while (undo.length  > 0 && marked.size > 0) {
				if (marked.has(undo[undo.length - 1])) break
				var last = undo.pop().split(":")
				set_cell_value($(last[0])[0], last[1], false)
				n += 1
			}
			save()
			highlight_marks()
			do_beep(0, n)
		})

		// List panel actions
		$("#hide").click(e => show_hide(true))
		$("#show").click(e => show_hide(false))

		// Initialize quip from URL query if present

		var indexOfQ = starting_url.indexOf("?")
		if (indexOfQ > 0) {
			var query = starting_url.substring(indexOfQ + 1)
			var pos = query.indexOf("&")
			if (pos > 0) {
				var name = decodeURI(query.substring(0, pos))
				var value_string = query.substring(pos + 1)
				if (theSudoku.name != name || as_string(theSudoku.value, false) != value_string) {
					theSudoku.name = name
					theSudoku.value = from_string(value_string)
					theSudoku.guess = theSudoku.value.slice()
                    theSudoku.solved = false
					title_t.value = theSudoku.name
					var v = fetch(name)
					if (v == null || v.solved == false)	store()
					else save()
				}
				undo = []
				marked.clear()
				setMode('play')
			}

		} else {
			restore_sudoku()
		}
		if (mode == "") setMode("edit")

	});