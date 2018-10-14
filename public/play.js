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

		// Two dimensional array that represents the playing field
		var lines = [];

		var puzzleFont = "30pt courier";
		var puzzleDeltaX = 0;
		var puzzleDeltaY = 40;
		var puzzleLettersPerLine = 38;
		var puzzleSpacing = 3;

		var selectionFont = "36pt courier";
		var selectionDeltaX = 0;
		var selectionDeltaY = 50;

		var puzzle = document.getElementById("puzzle");
		var selection = document.getElementById("selection");
		var quip_ta = document.getElementById("quip");
		var quips_ta = document.getElementById("quips");
		var title_t = document.getElementById("title");
		var hide = true;

		var theQuip = {
			value: "",
			name: "Sample",
			key: "",
			time: 0,
			valid: true
		};

		var letter = 'a';
		var alphabet = "aeiou bcdfghjklmnpqrstvwxyz *";
		var dayOfWeek = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" ");
		var dict = {};

		function build_list() {
			var keys = [];
			for (var i = 0; i < localStorage.length; i++) {
				var s = localStorage.key(i);
				if (s.startsWith("keep ")) {
					keys.push(s);
				}
			}
			$("tr:gt(0)").remove();
			keys = keys.sort();
			for (var i = keys.length; i > 0; --i) {
				var s = keys[i - 1];
				var name = s.substring(5);
				var value = localStorage[s];
				var solved = localStorage["solved " + name] == "Y" ? "&check;" : "";
				$("#items").append('<tr title="' + name + '"><td>' //
					+ solved + '</td><td>' //
					+ name + '</td><td>' //
					+ value.small() + '</td></tr>' //
				)
			}
			$("tr:gt(0)").click(select_row);
			show_hide(hide);
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

		function restoreQuip() {
			if ("quip" in localStorage) {
				try {
					var q = JSON.parse(localStorage["quip"]);
					if (q.valid) {
						theQuip = q;
					}
				} catch (e) {
					theQuip.value = "";
					theQuip.name = "Sample";
					theQuip.key = "";
					theQuip.valid = true;
				}
				quip_ta.value = theQuip.value;
				title_t.value = theQuip.name;
			}
		}

		function saveQuip() {
			var key = letter;
			for (var i = 0; i < alphabet.length; i++) {
				var c = alphabet[i];
				if (c in dict) {
					key += c + dict[c];
				}
			}
			theQuip.key = key;

			theQuip.value = quip_ta.value.toUpperCase();
			theQuip.name = title_t.value;
			localStorage["quip"] = JSON.stringify(theQuip, 0, 1);
			quip_ta.value = theQuip.value;
		}

		function setDictFromKey() {
			dict = {};
			if (theQuip.key.length > 1) {
				var key = theQuip.key;
				for (var i = 1; i < key.length; i += 2) {
					dict[key[i]] = key[i + 1];
					dict[key[i + 1]] = key[i];
				}
				letter = key[0];
			} else {
				letter = theQuip.value[0];
			}
		}

		function store(e) {
			var value = quip_ta.value.toUpperCase();
			if (theQuip.name != "" && theQuip.name != title_t.value && theQuip.value == value) {
				delete localStorage["keep " + theQuip.name];
				delete localStorage["solved " + theQuip.name];
			}
			theQuip.name = title_t.value;
			theQuip.value = value;
			quip_ta.value = value;

			if (theQuip.name != "") {
				localStorage["keep " + theQuip.name] = value;
			}

			$("#store").disable(true);
			$("#delete").disable(false);
		}

		function inc_title(n) {
			var v = /\d+-\d+-\d+$/g.exec(title_t.value);
			if (v) {
				var d = new Date(v[0]);
				d.setTime(d.getTime() + n * 24 * 3600000);
				title_t.value = "STrib " + d.toISOString().slice(0, 10);
				$("#delete").disable(true);
				$("#store").disable(false);
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
				$("#delete").disable(true);
				$("#store").disable(false);
				return;
			}
		}

		function select_row(e) {
			theQuip.name = e.currentTarget.title;
			theQuip.value = localStorage["keep " + theQuip.name];
			theQuip.key = "";

			quip_ta.value = theQuip.value;
			title_t.value = theQuip.name;
			dict = {};

			$('button[name^="marge"]').disable(true);
			$("#delete").disable(true);
			$("#store").disable(false);
			showPanel("run");
		}

		function clean_url() {
			if (document.URL.indexOf("?") > 0) {
				window.history.replaceState('', '', document.URL.substring(0, document.URL.indexOf("?")));
			}
		}

		function showPanel(p) {
			$("body > div").hide();
			if (p == "run") {
				setDictFromKey();
				saveQuip();
				repaintPuzzle();
				updateLink();
				$("#run").show();
			} else if (p == "choose") {
				build_list();
				$("#choose").show();
			} else if (p == "load") {
				quips_ta.value = "";
				$("#load").show();
			} else if (p == "export") {
				quips_ta.value = exportAll();
				$("#load").show();
			} else if (p == "exportone") {
				quips_ta.value = exportOne();
				$("#load").show();
			} else {
				setEditButtons(p);
				clean_url();
				quip_ta.focus();
				$("#setup").show();
			}
			localStorage["panel"] = p;
		}

		function setEditButtons(p) {
			if (title_t.value == "") {
				$("#delete").disable(true);
				$("#store").disable(true);
			} else {
				var found = "keep " + title_t.value in localStorage;
				$("#delete").disable(!found);
				$("#store").disable(quip_ta.value == ""
					|| found && quip_ta.value == localStorage["keep " + title_t.value]);
			}
		}

		function updateLink() {
			var mail_a = document.getElementById("mail");
			if (mail_a != null) {
				var day = dayOfWeek[new Date().getDay()];
				var iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
				var mail = iOS ? "googlegmail:///co" : "mailto:";
				var body = document.URL.split("?")[0] + "?" + encodeURI(theQuip.name) + "&" + encodeURI(theQuip.value);
				mail_a.href = mail + "?"
					+ "subject=" + encodeURIComponent(day + "'s quip")
					+ "&body=" + encodeURIComponent(body);
			}
		}

		function exportAll() {
			var map = {};
			var keys = [];
			for (var i = 0; i < localStorage.length; i++) {
				var s = localStorage.key(i);
				if (s.startsWith("keep ")) {
					keys.push(s);
				}
			}
			keys.sort();
			for (var i = keys.length; i > 0; --i) {
				var s = keys[i - 1];
				var name = s.substring(s.indexOf(" ") + 1);
				map[name] = {
					v: localStorage[s],
					s: localStorage["solved " + name]
				};
			}
			return JSON.stringify(map, 0, 1);
		}

		function exportOne () {
			var map = {};
			var name = theQuip.name;
			map[name] = {
				v: localStorage["keep " + name],
				s: localStorage["solved " + name]
			};
			return JSON.stringify(map, 0, 1);
		}

		// Global actions
		$('button[name^="new"]').click(function (e) {
			var today = new Date();
			today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
			theQuip.name = "STrib " + today.toISOString().slice(0, 10);
			theQuip.value = "";
			theQuip.key = "";

			title_t.value = theQuip.name;
			quip_ta.value = theQuip.value;
			dict = {};

			saveQuip();
			quip_ta.focus();
			$("#store").disable(false);
			showPanel("setup");
		});
		$('button[name^="list"]').click(e => showPanel("choose"));
		$('button[name^="edit"]').click(e => showPanel("setup"));

		// Setup panel actions
		$("#solve").click(function (e) {
			store();
			showPanel("run");
		});
		$("#title").keyup(setEditButtons);
		$("#quip").keyup(setEditButtons);
		$("#store").click(store);
		$("#delete").click(function (e) {
			delete localStorage["keep " + theQuip.name];
			delete localStorage["solved " + theQuip.name];
			this.disabled = true;
		});
		$("#exportone").click(e => showPanel("exportone"));
		$("#inctitle").click(e => inc_title(1));
		$("#dectitle").click(e => inc_title(-1));

		// List panel actions
		$("#hide").click(e => show_hide(true));
		$("#show").click(e => show_hide(false));
		$("#maint").click(e => showPanel("load"));
		$("#exportlist").click(e => showPanel("export"));

		// Solve panel actions
		$("#solved").click(function (e) {
			localStorage["solved " + theQuip.name] = "Y";
			showPanel("setup");
		});
		$("#clear").click(function (e) {
			dict = {};
			saveQuip();

			repaintPuzzle();
		});

		// Load panel actions
		$("#import").click(function (e) {
			var map = JSON.parse(quips_ta.value);
			for (var name in map) {
				localStorage["keep " + name] = map[name].v;
				if (map[name].s == "Y")
					localStorage["solved " + name] = "Y";
			}
			showPanel("choose")
		});

		$(puzzle).click(function (e) {

			// e will give us absolute x, y so we need to calculate
			// relative to puzzle position
			var pos = $(puzzle).position();
			var ox = e.pageX - pos.left;
			var oy = e.pageY - pos.top;

			var yField = Math.floor(oy / puzzleDeltaY / puzzleSpacing);
			var xField = Math.floor(ox / puzzleDeltaX);
			if (oy > yField * puzzleDeltaY * puzzleSpacing + puzzleDeltaY) {
				return;
			}

			char = lines[yField][xField];
			if (char >= "A" && char <= "Z" && letter != char) {
				updatePuzzle(char);
				saveQuip();
			}

		});

		$(selection).click(function (e) {

			// e will give us absolute x, y so we need to calculate
			// relative to puzzle position
			var pos = $(selection).position();
			var ox = e.pageX - pos.left;

			var xField = Math.floor(ox / selectionDeltaX);

			char = alphabet[xField];
			if (char >= "a" && char <= "z") {
				var drops = {};
				if (char in dict) {
					drops[dict[char]] = 1;
					delete dict[dict[char]];
					delete dict[char];
				}
				if (letter in dict) {
					drops[dict[letter]] = 1;
					delete dict[dict[letter]];
					delete dict[letter];
				}

				dict[letter] = char;
				dict[char] = letter;
				saveQuip();
				changeSub(char, drops);

			} else if (char == "*") {
				var drops = {};
				if (letter in dict) {
					drops[dict[letter]] = 1;
					delete dict[dict[letter]];
					delete dict[letter];
				}
				saveQuip();
				changeSub(" ", drops);
			}

		});

		function decode(c) {
			if (c < 'A' || c > 'Z') {
				return c;
			}
			if (c in dict) {
				return dict[c];
			}
			return ' ';
		}

		function complete() {
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				for (var j = 0; j < line.length; j++) {
					var c = line[j];
					if (c != ' ' && decode(c) == ' ') {
						return false;
					}
				}
			}
			return true;
		}

		/* Change the highlighted letter */
		function updatePuzzle(l) {
			if (l == letter)
				return;
			var ctx = puzzle.getContext("2d");
			ctx.font = puzzleFont;
			ctx.textAlign = "center";
			ctx.textBaseline = "bottom";

			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				for (var j = 0; j < line.length; j++) {
					var c = line[j];
					if (c != l && c != letter)
						continue;
					ctx.fillStyle = c == l ? "#DC143C" : "#006400";
					var x = j * puzzleDeltaX;
					var y = i * puzzleDeltaY * puzzleSpacing;
					ctx.clearRect(x, y, puzzleDeltaX, puzzleDeltaY);
					ctx
						.fillText(c, x + puzzleDeltaX / 2, y
							+ puzzleDeltaY);
				}
			}
			letter = l;
		}

		function isSentenceEnding(c, line, i) {
			if (c == "." || c == "?" || c == "!") {
				return i + 1 == line.length || line[i + 1] == " ";
			}
			return false;
		}

		/* Change the highlighted letter */
		function changeSub(s, drops) {
			var ctx = puzzle.getContext("2d");
			ctx.font = puzzleFont;
			ctx.textAlign = "center";
			ctx.textBaseline = "bottom";
			ctx.fillStyle = '#000000';

			var makeCap = true;
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				for (var j = 0; j < line.length; j++) {
					var c = line[j];
					if (c == " ") {
						continue;
					}
					if (c == letter || c in drops) {
						var x = j * puzzleDeltaX;
						var y = i * puzzleDeltaY * puzzleSpacing + puzzleDeltaY;
						ctx.clearRect(x, y, puzzleDeltaX, puzzleDeltaY);
						if (c == letter) {
							ctx.fillText(makeCap ? s.toUpperCase() : s, x + puzzleDeltaX / 2, y
								+ puzzleDeltaY);
						}
					}
					makeCap = isSentenceEnding(c, line, j);
				}
			}

			ctx = selection.getContext("2d");
			ctx.font = selectionFont;
			ctx.textAlign = "center";
			ctx.textBaseline = "bottom";

			for (var j = 0; j < alphabet.length; j++) {
				var c = alphabet[j];
				if (c == s || c in drops) {
					var x = j * selectionDeltaX;
					ctx.clearRect(x, 0, selectionDeltaX, selectionDeltaY);
					ctx.fillStyle = c == s ? '#A00000' : '#000000';
					ctx.fillText(c, x + selectionDeltaX / 2, selectionDeltaY);
				}
			}

			$("#solved").disable(!complete());
		}

		/*
		* Repaints the puzzle
		*/
		function repaintPuzzle() {

			// Get the context to draw on
			var ctx = selection.getContext("2d");

			ctx.font = selectionFont;
			selectionDeltaX = ctx.measureText("Q").width + 2;
			var selectionWidth = alphabet.length * selectionDeltaX;
			if (window.innerWidth - 5 < selectionWidth) {
				ctx.font = selectionFont = selectionFont.replace("36", "30");
				selectionDeltaX = ctx.measureText("Q").width + 2;
				selectionWidth = alphabet.length * selectionDeltaX;
			}
			selection.width = selectionWidth;
			selection.height = selectionDeltaY;
			ctx = selection.getContext("2d");

			// clear the canvas
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			// Write the alphabet line
			ctx.font = selectionFont;
			ctx.textAlign = "center";
			ctx.textBaseline = "bottom";
			for (var j = 0; j < alphabet.length; j++) {
				var c = alphabet[j];
				ctx.fillStyle = c in dict ? '#A00000' : '#000000';
				ctx.fillText(c, j * selectionDeltaX + selectionDeltaX / 2,
					selectionDeltaY);
			}

			/* puzzle.height = lines.length * puzzleSpacing * puzzleDeltaY; */
			// Get the context to draw on
			ctx = puzzle.getContext("2d");

			ctx.font = puzzleFont;
			puzzleDeltaX = ctx.measureText("Q").width + 1;
			var width = selection.width + puzzleDeltaX * 4;
			if (window.innerWidth - 30 < width)
				width = selectionWidth;
			puzzleLettersPerLine = Math.floor(width / puzzleDeltaX);
			lines = [""];
			var words = theQuip.value.split(" ");
			var line = 0;
			for (var i = 0; i < words.length; i++) {
				if (words[i].length + lines[line].length + 1 > puzzleLettersPerLine) {
					lines[++line] = "";
				} else if (lines[line].length > 0) {
					lines[line] += " ";
				}
				lines[line] += words[i];
			}
			puzzle.width = puzzleLettersPerLine * puzzleDeltaX;
			puzzle.height = lines.length * puzzleDeltaY * puzzleSpacing;
			ctx = puzzle.getContext("2d");

			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			// Write the cryptogram and current solution
			ctx.font = puzzleFont;
			ctx.textAlign = "center";
			ctx.textBaseline = "bottom";
			var makeCap = true;
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				for (var j = 0; j < line.length; j++) {
					var c = line[j];
					ctx.fillStyle = c == letter ? "#DC143C"
						: "#006400";
					ctx.fillText(c, j * puzzleDeltaX + puzzleDeltaX / 2, i
						* puzzleDeltaY * puzzleSpacing + puzzleDeltaY);
					c = decode(c);
					if (c == ' ')
						continue;
					ctx.fillStyle = '#000000';
					ctx.fillText(makeCap ? c.toUpperCase() : c, j * puzzleDeltaX + puzzleDeltaX / 2, i
						* puzzleDeltaY * puzzleSpacing + 2 * puzzleDeltaY);
					makeCap = isSentenceEnding(c, line, j);
				}
			}

			$("#solved").disable(!complete());
		}

		// Initialize quip from URL query if present
		if (document.URL.indexOf("?") > 0) {
			var query = document.URL.substring(document.URL.indexOf("?") + 1);
			var pos = query.indexOf("&");
			if (pos > 0) {
				quip_ta.value = decodeURI(query.substring(pos + 1));
				title_t.value = decodeURI(query.substring(0, pos));
				dict = {};
				saveQuip();
				store();
				localStorage["panel"] = "run";
			}

		} else {
			restoreQuip();
		}

		showPanel(localStorage["panel"]);

	});