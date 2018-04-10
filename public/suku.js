function for_each(query, fn) {
	document.querySelectorAll(query).forEach(fn)
}
function disable(query, state) {
	for_each(query, function (node) {
		switch (node.tagName.toLowerCase()) {
			case "input":
			case "button":
				node.disabled = state
				break
			case "select":
				if (state) {
					node.setAttribute('disabled', 'disabled')
				} else {
					node.removeAttribute('disabled')
				}
				break
			default:
				node.classList.toggle('disabled', state)
				break
		}
	})
}
function add_click(query, fn) {
	for_each(query, n => n.addEventListener('click', fn))
}

document.addEventListener("DOMContentLoaded", function () {
	document.removeEventListener("DOMContentLoaded", arguments.callee, false);

	function show_all(query) {
		for_each(query, n => n.style.display = '')
	}
	function hide_all(query) {
		for_each(query, n => n.style.display = 'none')
	}

	var title_t = document.getElementById("title");
	var empty = Array(81).fill(0);
	var theSudoku = { value: empty.slice(), guess: empty.slice(), name: '', solved: false };
	var hide = true;
	var mode;
	var undo = [];

	function setMode(m) {
		hide_all('button, #items, #setup, #choices, #entry, a')
		for_each('#menu', n => n.style.gridArea = "")
		switch (m) {
			case 'edit':
				show_all('#setup, #choices, #entry, #new, #solve, #dectitle, #inctitle, #list, #delete')
				disable('#delete', !("sk " + title_t.value) in localStorage)
				disable("#title", false)
				for_each("div > div", function (n, i) {
					n.textContent = theSudoku.value[i] == 0 ? ' ' : theSudoku.value[i]
					n.style.color = "red"
					n.style.background = ""
				})
				change_digit(null)
				clean_url()
				break
			case 'play':
				show_all('#setup, #choices, #entry, #new, #solved, #edit, #save, #clear, #list, #undo, a')
				disable("#title, #undo", true)
				for_each("div > div", n => n.style.color = "black")
				for_each('div > div', function (n, i) {
					n.style.color = "black"
					n.textContent = theSudoku.guess[i] == 0 ? ' ' : theSudoku.guess[i];
					if (theSudoku.value[i] != 0) {
						n.style.color = "red"
					}
				})
				highlight_cell(null)
				check_guess()
				updateLink()
				undo = []
				break
			case 'list':
				show_all('#new, #solve, #edit, #items')
				for_each('#menu', n => n.style.gridArea = "name")
				show_hide(hide_all)
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
		hide_all = h
		if (hide_all) {
			$("tr").has(":contains('✓')").hide()
			hide_all("#hide")
			show_all("#show_all")

		} else {
			show_all("tr, #hide")
			hide_all("#show_all")
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
			}
		} catch (e) { }
	}

	function store() {
		save()
		var value = as_string(theSudoku.value, theSudoku.solved) + ";" + as_string(theSudoku.guess, false)
		localStorage["sk " + theSudoku.name] = value
		disable('#delete', false)
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
		disable('#delete', !saved)
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
		disable('#solved', true)

		var counts = Array(10).fill(0)
		for (i = 0; i < 81; i++) {
			counts[theSudoku.guess[i]]++
		}
		for (i = 1; i < counts.length; i++) {
			for_each("#d" + i, n => n.style.color = counts[i] > 8 ? "red" : "")
		}
		for (i = 1; i < counts.length; i++) {
			if (counts[i] != 9) return
		}
		for (var i = 0; i < 9; i++) {
			if (is_bad(get_row(i)) || is_bad(get_column(i)) || is_bad(get_square(i)))
				return
		}
		theSudoku.solved = true
		disable('#solved', false)
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
		//for_each("tr:gt(0)", n => n.remove())
		keys = keys.sort()
		for (var i = keys.length; i > 0; --i) {
			var s = keys[i - 1]
			var value = localStorage[s].split(";")[0]
			var name = s.substring(3)
			var solved = value.endsWith("Y") ? "&check;" : ""
			document.getElementById("items").insertAdjacentHTML('beforeend', '<tr title="' + name + '"><td>' //
				+ solved + '</td><td>' //
				+ name + '</td><td>' //
				+ value + '</td></tr>' //
			)
			add_click("tr:last", select_row)
			if (hide_all && solved) hide_all("tr:last")
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
			for_each("div > div", (n, i) => n.style.background = theSudoku.guess[i] == v ? 'lightgray' : "")
		}
		else for_each("div > div", n => n.style.background = '')
	}

	var digit;
	var theCell;
	function highlight_cell(c) {
		for_each("div > div", n => n.style.background = '')
		if (c != null) c.style.background = 'lightgray'
		theCell = c
	}

	function change_digit(d) {
		if (digit == d) return

		for_each('.theDigit', n => n.classList.remove('theDigit'))
		if (d != null) for_each(d, n => n.classList.add('theDigit'))
		digit = d
		highlight_cells(d);
	}

	function set_cell_value(c, value, is_edit) {
		value = get_digit(value)
		c.textContent = value == 0 ? ' ' : value
		theSudoku.guess[c.id] = value
		if (is_edit) {
			theSudoku.value[c.id] = value
			highlight_cell(document.getElementById(parseInt(c.id) + 1))
		} else {
			c.style.background = value != 0 && value == get_digit(digit) ? 'lightgray' : ''
			check_guess()
		}
	}

	// select a digit
	add_click("#choices > li", function (li) {
		if (mode == 'edit') {
			if (theCell != null) set_cell_value(theCell, li.target, true)
		} else {
			change_digit(li.target)
		}
	})
	for_each("#choices > li", n => n.id = "d" + n.innerText)

	// Put the selected digit in the clicked cell
	add_click("div > div", function (div) {
		if (mode == 'edit') {
			highlight_cell(div.target)
		} else if (theSudoku.value[div.target.id] == 0 && digit != null) {
			undo.push("#" + div.target.id + ":" + theSudoku.guess[div.target.id])
			set_cell_value(div.target, digit, false)
			if (undo.length == 1) disable("#undo", false)
			save()
		}
	})

	// Clear all the cells
	for_each("div > div", n => n.textContent = '')

	// Assign an id for each cell 1-81 
	for_each("div > div", (n, i) => n.id = i)

	// Global actions
	add_click('#new', function (e) {
		var today = new Date()
		today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
		theSudoku.name = "STrib " + today.toISOString().slice(0, 10)
		theSudoku.value = empty.slice()
		theSudoku.guess = empty.slice()
		theSudoku.solved = false

		title_t.value = theSudoku.name

		setMode("edit")
	})

	// Edit mode actions
	add_click("#solve", function (e) {
		theSudoku.name = title_t.value
		store()
		setMode("play")
	})
	add_click("#delete", function (e) {
		delete localStorage["sk " + theSudoku.name]
		this.disabled = true
	})

	for_each("#title", n => n.addEventListener('keyup', check_title))
	add_click("#inctitle", e => inc_title(1))
	add_click("#dectitle", e => inc_title(-1))

	// Play mode actions
	add_click("#solved", function (e) {
		store()
		setMode("list")
	})
	add_click("#clear", function (e) {
		change_digit(null)
		theSudoku.guess = theSudoku.value.slice()
		setMode("play")
	})
	add_click("#edit", e => setMode("edit"))
	add_click("#list", e => setMode("list"))
	add_click("#save", e => store())

	add_click("#undo", function (e) {
		if (undo.length == 0) return
		var last = undo.pop().split(":")
		if (undo.length == 0) disable("#undo", true)
		set_cell_value(document.getElementById(last[0].substr(1)), last[1], false)
	})

	// List panel actions
	add_click("#hide", e => show_hide(true))
	add_click("#show_all", e => show_hide(false))

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
				if (v == null || v.solved == false) store()
				else save()
			}
			setMode('play')
		} else
			setMode("edit")

	} else {
		setMode("edit")
	}

});