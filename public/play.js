$(document)
		.ready(
				function() {

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
					var delete_b = document.getElementById("delete");
					var store_b = document.getElementById("store");
					var title_t = document.getElementById("title");
					var hide = true;

					var theQuip = {
						value : "",
						name : "Sample",
						key : "",
						time : 0,
						valid : true
					};

					var letter = 'a';
					var alphabet = "aeiou bcdfghjklmnpqrstvwxyz *";
					var dict = {};

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
							updateLink();
						}
					}

					loadFromStorage();

					function save() {
						theQuip.value = quip_ta.value.toUpperCase();
						theQuip.name = title_t.value;
						localStorage["quip"] = JSON.stringify(theQuip, 0, 1);
						quip_ta.value = theQuip.value;
					}

					function saveDict() {
						var key = letter;
						for ( var i = 0; i < alphabet.length; i++) {
							var c = alphabet[i];
							if (c in dict) {
								key += c + dict[c];
							}
						}
						theQuip.key = key;
						save();
					}

					function setDictFromKey() {

						if (theQuip.key.length > 1) {
							var key = theQuip.key;
							for ( var i = 1; i < key.length; i += 2) {
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
						if (theQuip.name != title_t.value) {
							if (theQuip.name != "" && theQuip.value == value) {
								delete localStorage["keep " + theQuip.name];
								delete localStorage["solved " + theQuip.name];
								find(theQuip.name).remove();
							}
							theQuip.name = title_t.value;
						}
						theQuip.value = value;
						quip_ta.value = theQuip.value;

						if (localStorage["keep " + theQuip.name] != theQuip.value) {
							find(theQuip.name).remove();
							localStorage["keep " + theQuip.name] = theQuip.value;
							add(theQuip.name);
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
						theQuip.name = e.currentTarget.title;
						theQuip.value = localStorage["keep " + theQuip.name];
						theQuip.key = "";

						quip_ta.value = theQuip.value;
						title_t.value = theQuip.name;
						dict = {};

						delete_b.disabled = false;
						store_b.disabled = false;
						showPanel("run");
						updateLink();
					}
					
					function add(name) {
						var solved = localStorage["solved " + name] ? "&check;"
								: "";
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
						$("#setup").hide();
						$("#choose").hide();
						$("#run").hide();
						$("#load").hide();
						if (p == "run") {
							save();
							setDictFromKey();
							repaintPuzzle();
							$("#run").show();
						}  else if (p == "choose") {
							$("#choose").show();
						} else  if (p == "load") {
							quips_ta.value = "";
							$("#load").show();
						} else {
							// must be setup
							$("#setup").show();
							setEditButtons(p);
						}
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
					
					function updateLink() {
						var link_a = document.getElementById("link");
						link_a.href = document.URL.split("?")[0] + "?" + 
							encodeURI(theQuip.name) + "&" + encodeURI(theQuip.value);
					}

					// Check if the browser supports <canvas>
					if (!puzzle.getContext) {
						alert("This demo requires a browser that supports the <canvas> element.");
						return;
					}
					
					// Initialize quip from URL query if present
					if (document.URL.indexOf("?") > 0) {
						var query = document.URL.substring(document.URL.indexOf("?")+1);
						var pos = query.indexOf("&");
						if (pos > 0) {
							quip_ta.value = decodeURI(query.substring(pos+1));
							title_t.value = decodeURI(query.substring(0, pos));
						} else {
							quip_ta.value = decodeURI(query);
						}
						dict = {};
						saveDict();
						updateLink();
						localStorage["panel"] = "run";
					}

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
						updateLink();
					});
					$('button[name^="open"]').click(function(e) {
						showPanel("choose");
					});
					$('button[name^="back"]').click(function(e) {
						showPanel("setup");
					});

					// Setup panel actions
					$("#solve").click(function(e) {
						updateLink();
						showPanel("run");
					});
					$("#title").keyup(setEditButtons);
					$("#quip").keyup(setEditButtons);
					$("#store").click(store);
					$("#delete").click(function(e) {
						delete localStorage["keep " + theQuip.name];
						delete localStorage["solved " + theQuip.name];
						find(theQuip.name).remove();
						this.disabled = true;
					});
					$("#exportone").click(function(e) {
						showPanel("load");
						var map = {};
						var name = theQuip.name;
						map[name] = {
								v : localStorage["keep " + name],
								s : localStorage["solved " + name]
							};
						quips_ta.value = JSON.stringify(map, 0, 1);
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
					$("#exportlist").click(function(e) {
						showPanel("load");
						var map = {};
						for ( var i = 0; i < localStorage.length; i++) {
							var s = localStorage.key(i);
							if (s.indexOf("keep ") == 0) {
								var name = s.substring(s.indexOf(" ") + 1);
								map[name] = {
									v : localStorage[s],
									s : localStorage["solved " + name]
								};
							}
						}

						quips_ta.value = JSON.stringify(map, 0, 1);
					});

					// Solve panel actions
					$("#solved").click(function(e) {
						localStorage["solved " + theQuip.name] = "Y";
						find(theQuip.name).remove();
						add(theQuip.name);
						showPanel("setup");
					});
					$("#reset").click(function(e) {
						dict = {};
						saveDict();

						repaintPuzzle();
					});

					// Load panel actions
					$("#import").click(function(e) {
						var map = JSON.parse(quips_ta.value);
						for ( var name in map) {
							localStorage["keep " + name] = map[name].v;
							if (map[name].s == "Y")
								localStorage["solved " + name] = "Y";
							find(name).remove();
							add(name);
						}
					});

					$(puzzle).click(function(e) {

						// e will give us absolute x, y so we need to calculate
						// relative to puzzle position
						var pos = $(puzzle).position();
						var ox = e.pageX - pos.left;
						var oy = e.pageY - pos.top;

						var yField = Math.floor(oy / puzzleDeltaY / puzzleSpacing);
						var xField = Math.floor(ox / puzzleDeltaX);
						if (oy > yField * puzzleDeltaY * puzzleSpacing + puzzleDeltaY)
							return;

						char = lines[yField][xField];
						if (char >= "A" && char <= "Z" && letter != char) {
							updatePuzzle(char);
							saveDict();
						}

						// e.stopPropagation();

					});

					$(selection).click(function(e) {

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
							saveDict();
							changeSub(char, drops);
						} else if (char == "*") {
                            var drops = {};
                            if (letter in dict) {
                                drops[dict[letter]] = 1;
                                delete dict[dict[letter]];
                                delete dict[letter];
                            }
                            saveDict();
                            changeSub(" ", drops);
                        }
						// e.stopPropagation();

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
						for ( var i = 0; i < lines.length; i++) {
							var line = lines[i];
							for ( var j = 0; j < line.length; j++) {
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

						for ( var i = 0; i < lines.length; i++) {
							var line = lines[i];
							for ( var j = 0; j < line.length; j++) {
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
					
					function isSentenceEnding(c, line, i)
					{
						if (c == "." || c == "?" || c == "!") {
							return i + 1 == line.length || line[i+1] == " ";
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
						for ( var i = 0; i < lines.length; i++) {
							var line = lines[i];
							for ( var j = 0; j < line.length; j++) {
								var c = line[j];
								if (c == " ")
									continue;
								if (c == letter || c in drops) {
									var x = j * puzzleDeltaX;
									var y = i * puzzleDeltaY * puzzleSpacing + puzzleDeltaY;
									ctx.clearRect(x, y, puzzleDeltaX, puzzleDeltaY);
									if (c == letter)
									{
										ctx.fillText(makeCap? s.toUpperCase(): s, x + puzzleDeltaX / 2, y
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

						for ( var j = 0; j < alphabet.length; j++) {
							var c = alphabet[j];
							if (c == s || c in drops) {
								var x = j * selectionDeltaX;
								ctx.clearRect(x, 0, selectionDeltaX, selectionDeltaY);
								ctx.fillStyle = c == s ? '#A00000' : '#000000';
								ctx.fillText(c, x + selectionDeltaX / 2, selectionDeltaY);
							}
						}

						$("#solved")[0].disabled = !complete();
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
						for ( var j = 0; j < alphabet.length; j++) {
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
						lines = [ "" ];
						var words = theQuip.value.split(" ");
						var line = 0;
						for ( var i = 0; i < words.length; i++) {
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
						for ( var i = 0; i < lines.length; i++) {
							var line = lines[i];
							for ( var j = 0; j < line.length; j++) {
								var c = line[j];
								ctx.fillStyle = c == letter ? "#DC143C"
										: "#006400";
								ctx.fillText(c, j * puzzleDeltaX + puzzleDeltaX / 2, i
										* puzzleDeltaY * puzzleSpacing + puzzleDeltaY);
								c = decode(c);
								if (c == ' ')
									continue;
								ctx.fillStyle = '#000000';
								ctx.fillText(makeCap?c.toUpperCase():c, j * puzzleDeltaX + puzzleDeltaX / 2, i
										* puzzleDeltaY * puzzleSpacing + 2 * puzzleDeltaY);
								makeCap = isSentenceEnding(c, line, j);
							}
						}

						$("#solved")[0].disabled = !complete();
					}
					
					showPanel(localStorage["panel"]);

				});