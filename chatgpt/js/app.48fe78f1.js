(function() {
	"use strict";
	var e = {
			959: function(e, t, n) {
				var a = n(9242),
					o = (n(7658), n(541), n(3396)),
					l = n(7139),
					s = n(4870),
					i = n(4161);
				const c = {
						id: "main"
					},
					u = {
						id: "center"
					},
					r = {
						id: "bottom"
					};
				var d = (0, o.aZ)({
						__name: "dialogCom",
						props: {
							title: null,
							show: {
								type: Boolean
							}
						},
						setup(e) {
							const t = e;
							return (e, n) => ((0, o.wg)(), (0, o.iD)("div", {
								id: "dialog",
								class: (0, l.C_)({
									show: t.show
								})
							}, [(0, o._)("div", c, [(0, o._)("p", null, (0, l.zw)(t.title), 1),
								(0, o._)("div", u, [(0, o.WI)(e.$slots, "center")]), (0,
									o._)("div", r, [(0, o.WI)(e.$slots, "bottom")])
							])], 2))
						}
					}),
					v = n(89);
				const p = (0, v.Z)(d, [
					["__scopeId", "data-v-7549cf0a"]
				]);
				var h = p;
				let m = 0;

				function f(e) {
					const t = document.querySelector("body"),
						n = document.createElement("div");
					n.id = "messageBox", n.className = "messageBox-" + ++m, n.innerHTML =
						`<div class="${e.type}">${e.content}</div>`, t?.appendChild(n), setTimeout((() => {
							m--, n.remove()
						}), 3e3)
				}
				var g = f,
					y = n(5068),
					w = n(5792),
					_ = n(8134),
					k = n.n(_),
					b = n(3099),
					S = n.n(b);
				const C = (0, s.iH)("");

				function T(e) {
					window.localStorage.setItem("n0ts-chatgpt-theme", e), C.value = e
				}

				function O() {
					const e = window.localStorage.getItem("n0ts-chatgpt-theme");
					e ? C.value = e : T("light"), document.documentElement.setAttribute("theme", e || "light")
				}

				function H() {
					C.value = window.localStorage.getItem("n0ts-chatgpt-theme"), C.value = "light" === C.value ?
						"dark" : "light", T(C.value), O()
				}
				var I = {
						switchTheme: H,
						load: O,
						themeCache: C
					},
					D = {
						key: "",
						data: {
							model: "gpt-3.5-turbo"
						},
						system: ""
					};

				function x() {
					return window.localStorage.setItem("n0ts-chatgpt-config", JSON.stringify(D)), D
				}

				function U() {
					const e = JSON.parse(window.localStorage.getItem("n0ts-chatgpt-config") ?? "{}");
					return e.key ? (D.key = e.key, D.data = e.data, D.system = e.system, D) : x()
				}
				var E = {
					save: x,
					read: U,
					config: D
				};
				const M = e => ((0, o.dD)("data-v-094ddb60"), e = e(), (0, o.Cn)(), e),
					N = {
						id: "chatgpt"
					},
					j = {
						id: "chats"
					},
					A = ["onClick"],
					P = ["onClick"],
					q = {
						id: "bottom"
					},
					Y = {
						key: 0,
						class: "money"
					},
					$ = {
						id: "main"
					},
					L = {
						key: 0,
						id: "messages"
					},
					B = {
						class: "img"
					},
					K = {
						key: 0,
						class: "system"
					},
					z = {
						key: 1,
						class: "user"
					},
					J = {
						key: 2,
						class: "ai"
					},
					G = ["innerHTML"],
					Z = M((() => (0, o._)("div", {
						id: "stretch"
					}, null, -1))),
					V = {
						key: 1,
						id: "home"
					},
					W = M((() => (0, o._)("div", null, [(0, o._)("p", null, "🤪 ChatGPT 基于 gpt-3.5-turbo 开发"), (
						0, o._)("div", {
						class: "content"
					}, [(0, o._)("p", null, " 本项目纯前端自娱自乐，数据仅在 localStorage 中读取 "), (0, o._)(
						"p", null, "国内随意访问，解决 api 无法访问问题"), (0, o._)("p", null,
						"瞎写一通，功能简单所以代码较臭"), (0, o._)("p", null, [(0, o.Uk)(
						" 开源地址（求 star）："), (0, o._)("a", {
						href: "https://gitee.com/n0ts/chat-gpt",
						target: "_blank"
					}, "Gitee")]), (0, o._)("p", null, [(0, o.Uk)(" 技术交流："), (0, o._)(
						"a", {
							href: "https://jq.qq.com/?_wv=1027&k=Mh7ah6Dd"
						}, "坚果小栈")])])], -1))),
					F = [W],
					R = {
						id: "input"
					},
					Q = M((() => (0, o._)("p", null, "请在下方输入你的 key", -1))),
					X = M((() => (0, o._)("p", null, [(0, o.Uk)(" 申请地址："), (0, o._)("a", {
						href: "https://platform.openai.com/account/api-keys",
						target: "_blank"
					}, "点我")], -1))),
					ee = ["onKeydown"],
					te = M((() => (0, o._)("p", {
						class: "tips"
					}, " key 会保存在本地浏览器(localStorage)中，只供本地使用 ", -1))),
					ne = {
						class: "panel"
					},
					ae = M((() => (0, o._)("p", null, "key：", -1))),
					oe = M((() => (0, o._)("p", {
						class: "tips"
					}, "OpenAI 申请的 Key", -1))),
					le = M((() => (0, o._)("p", null, "行为设定：", -1))),
					se = {
						class: "tips"
					},
					ie = M((() => (0, o._)("span", null, "给 OpenAI 设定一个行为，比如：", -1))),
					ce = M((() => (0, o._)("br", null, null, -1))),
					ue = M((() => (0, o._)("span", null, "“你是一直猫，每句话后面加个 喵~”", -1))),
					re = M((() => (0, o._)("br", null, null, -1))),
					de = M((() => (0, o._)("span", null, "又或者", -1))),
					ve = M((() => (0, o._)("br", null, null, -1))),
					pe = ["innerHTML"];
				var he = (0, o.aZ)({
					__name: "App",
					setup(e) {
						const {
							config: t,
							read: n,
							save: c
						} = E;
						n();
						const u = (0, s.iH)("" == t.key);
						let r = null,
							d = null;
						(0, o.bv)((() => {
							d = new(S())(document.querySelector("#main")), r = document
								.querySelector("#messages"), I.load(), t.key && Oe()
						}));
						const v = (0, s.iH)("");
						function p() {
							if ("" == v.value) return g({
								type: "warning",
								content: "key 不能为空"
							});
							t.key = v.value, v.value = "", c(), u.value = !1, g({
								type: "success",
								content: "key 存储成功，开始提问吧"
							}), Oe()
						}
						const m = (0, s.iH)(!1);
						async function f() {
							m.value = !0, _("assistant", ""), fetch(
								"https://node.fatshady.cn/chatgpt-stream", {
									method: "POST",
									body: JSON.stringify({
										key: t.key,
										model: t.data.model,
										messages: he[me.value].contents,
										timeout: 6e4
									}),
									headers: {
										"Content-Type": "application/json"
									}
								}).then((e => {
								const t = e.body.getReader(),
									n = new TextDecoder("utf-8");
								let a = "";
								t.read().then((async function e(l) {
									if (l.done) return;
									const s = n.decode(l.value);
									return s.includes("未知错误，请联系站长解决！") ?
										(m.value = !1, Ie(s)) : s
										.includes("data: [DONE]") ? (m
											.value = !1, b(), await (0,
												o.Y3)(), ye(), void d
											.update()) : (s.replaceAll(
												"data: ", "").split(
												"\n").filter(Boolean)
											.forEach((async e => {
												const t =
													JSON
													.parse(
														e);
												t.choices[0]
													.delta
													.content &&
													(a += t
														.choices[
															0
															]
														.delta
														.content,
														he[me
															.value
															]
														.contents[
															he[me
																.value
																]
															.contents
															.length -
															1
															]
														.content =
														y.TU
														.parse(
															a
															),
														await (
															0,
															o
															.Y3
															)
														(),
														ye()
														)
											})), t.read().then(e))
								}))
							})).catch((() => {
								m.value = !1
							}))
						}
						async function _(e, t, n) {
							he[me.value].contents.push({
								role: e,
								content: n || t
							}), b(), await (0, o.Y3)(), ye(), d.update()
						}

						function b() {
							window.localStorage.setItem("message-data", JSON.stringify(he))
						}
						const C = (0, s.iH)("");

						function T() {
							if ("" != C.value && "" != C.value.trim() && !m.value) {
								if (-1 == me.value && (he.unshift({
										name: "",
										contents: []
									}), me.value = 0), t.system && 0 == he[me.value].contents.length &&
									_("system", t.system), _("user", C.value), 1 == he[me.value]
									.contents.length || "system" == he[me.value].contents[0].role &&
									2 == he[me.value].contents.length) {
									const e = C.value;
									let t = 1;
									he.forEach((n => {
											0 == n.name.indexOf(e) && t++
										})), he[me.value].name = e + (1 == t ? "" : ` #${t}`), document
										.title = e + " | ChatGPT"
								}
								C.value = "", f()
							}
						}
						let O = !1;

						function H() {
							O || (O = !0, setTimeout((() => {
								O = !1, r = document.querySelector("#messages"), r ? r
									.scrollTo({
										top: r.scrollHeight,
										behavior: "smooth"
									}) : H()
							}), 300))
						}
						let D = !1;

						function x(e) {
							if (16 === e.keyCode && (D = !0), !D && 13 === e.keyCode) return T(), e
								.preventDefault(), !1
						}

						function U(e) {
							16 === e.keyCode && (D = !1)
						}
						const M = (0, s.iH)(24);
						(0, o.YP)((() => C.value), (() => {
							const e = C.value.split("\n").length;
							M.value = 24 * e
						}));
						const W = window.localStorage.getItem("message-data"),
							he = (0, s.qj)(W ? JSON.parse(W) : []),
							me = (0, s.iH)(-1);

						function fe() {
							b();
							let e = 1;
							he.forEach((t => {
								0 == t.name.indexOf("新会话") && e++
							})), he.unshift({
								name: "新会话" + (1 == e ? "" : ` #${e}`),
								contents: []
							}), C.value = "", me.value = 0
						}

						function ge(e) {
							document.title = "🤪ChatGPT", he.splice(e, 1), me.value = -1, b()
						}
						async function ye() {
							const e = [];
							document.querySelectorAll("#messages pre code").forEach((t => {
								const n = t;
								if (!n.className.includes("hljs")) {
									const t = document.createElement("div");
									t.className = "copyBtn", t.innerHTML = "复制", t
										.setAttribute("code", n.innerText), t
										.addEventListener("click", (e => {
											ke(e)
										})), n.parentElement?.appendChild(t), w.Z
										.highlightElement(n), e.push(n)
								}
							})), we(e), H()
						}

						function we(e) {
							for (let t = 0; t < e.length; t++) {
								const n = e[t].innerHTML.replace(/\n/g, "</li><li>");
								e[t].innerHTML = `<ol><li>${n}</li></ol>`.replace("<li></li></ol>",
									"</ol>")
							}
						}(0, o.YP)((() => me.value), (async () => {
							he[me.value] && (document.title = he[me.value].name +
								" | 🤪ChatGPT", await (0, o.Y3)(), ye(), d.update())
						}));
						const _e = (0, s.iH)(!1);

						function ke(e) {
							const t = e.target.getAttribute("code");
							t && (k().copy(t), g({
								type: "success",
								content: "复制成功"
							}))
						}

						function be() {
							window.localStorage.removeItem("message-data"), window.localStorage
								.removeItem("n0ts-chatgpt-theme"), window.localStorage.removeItem(
									"n0ts-chatgpt-config"), window.location.reload()
						}
						const Se = (0, s.iH)(!1);

						function Ce() {
							Se.value = !Se.value, c(), g({
								type: "success",
								content: "设置已保存"
							})
						}
						const Te = (0, s.iH)(null);
						async function Oe() {
							const {
								data: e
							} = await (0, i.Z)({
								method: "post",
								url: "https://node.fatshady.cn/cors",
								data: {
									method: "GET",
									url: "https://api.openai.com/dashboard/billing/credit_grants",
									headers: {
										authorization: `Bearer ${t.key}`
									}
								}
							});
							Te.value = e.data
						}

						function He(e, t) {
							return Number(e.toFixed(t))
						}

						function Ie(e) {
							const n = JSON.parse(e.replace("未知错误，请联系站长解决！", ""));
							console.log(n), he[me.value].contents[he[me.value].contents.length - 1]
								.content = e, "invalid_api_key" == n.error.code && (g({
									type: "danger",
									content: "API Key 错误，请重新配置"
								}), t.key = "", c(), u.value = !0)
						}
						return (e, n) => ((0, o.wg)(), (0, o.iD)(o.HY, null, [(0, o._)("div", N, [(0, o
							._)("div", {
							id: "sidebar",
							class: (0, l.C_)({
								sideBarShow: _e.value
							})
						}, [(0, o._)("div", {
							class: "btns"
						}, [(0, o._)("div", {
							class: "btn",
							onClick: fe
						}, "🤓 新建会话")]), (0, o._)("div", j, [((0, o.wg)(
							!0), (0, o.iD)(o.HY, null, (0, o
							.Ko)(he, ((e, t) => ((0, o
							.wg)(), (0, o
							.iD)("div", {
								key: t,
								onClick: e =>
									me
									.value =
									t,
								class: (0, l
										.C_)
									({
										active: me
											.value ==
											t
									})
							}, [(0, o._)(
								"p",
								null, (
									0, l
									.zw)
								(e
								.name),
								1), (0,
								o._)(
								"span", {
									onClick: (
											0,
											a
											.iM
											)
										((e => ge(
												t)),
											[
												"stop"]
											)
								},
								"🗑 删除",
								8, P)], 10,
							A)))), 128))]), (0, o._)("div", q, [(0, o._)
							("div", {
								class: "btn",
								onClick: n[0] || (n[0] = (...
									e) => (0, s.SU)(I)
									.switchTheme && (0, s
										.SU)(I).switchTheme(
										...e))
							}, (0, l.zw)("light" == (0, s.SU)(I)
								.themeCache.value ? "🌃 暗色模式" :
								"🌇 亮色模式"), 1), (0, o._)("div", {
								class: "btn",
								onClick: n[1] || (n[1] = e => Se
									.value = !0)
							}, "👐 打开配置"), (0, o._)("div", {
								class: "btn",
								onClick: be
							}, "👊 重置配置"), Te.value ? ((0, o.wg)(),
								(0, o.iD)("div", Y, " 余额：" + (0, l
										.zw)(He(Te.value
										.total_available, 2)) +
									" $，已用：" + (0, l.zw)(He(Te.value
										.total_used, 2)) + " $ ", 1)
								) : (0, o.kq)("", !0)
						]), (0, o._)("div", {
							id: "showBtn",
							onClick: n[2] || (n[2] = e => _e
								.value = !_e.value)
						}, (0, l.zw)(_e.value ? "👈" : "👉"), 1)], 2), (0, o._)(
							"div", $, [he[me.value] ? ((0, o.wg)(), (0, o.iD)(
								"div", L, [((0, o.wg)(!0), (0, o.iD)(o
									.HY, null, (0, o.Ko)(he[me
										.value].contents, ((
										e, t) => ((0, o
										.wg)(), (0,
										o.iD)(
									"div", {
										key: t
									}, [(0, o._)
										("div",
											B, ["system" ==
												e
												.role ?
												((0, o
														.wg)
													(),
													(0, o
														.iD
														)
													("div",
														K,
														" SY "
														)
													) :
												"user" ==
												e
												.role ?
												((0, o
														.wg)
													(),
													(0, o
														.iD
														)
													("div",
														z,
														" Me "
														)
													) :
												((0, o
														.wg)
													(),
													(0, o
														.iD
														)
													("div",
														J,
														"AI"
														)
													)
											]),
										(0, o._)
										("div", {
												class: (0,
														l
														.C_
														)
													(["content",
													{
														end: !
															m
															.value ||
															t !=
															he[me
																.value
																]
															.contents
															.length -
															1
													}]),
												innerHTML: e
													.content
											},
											null,
											10,
											G)
									])))), 128)), Z])) : ((0, o.wg)(), (0, o
								.iD)("div", V, F)), (0, o._)("div", R, [(0,
								o.wy)((0, o._)("textarea", {
								"onUpdate:modelValue": n[
									3] || (n[3] = e => C
										.value = e),
								onKeydown: x,
								onKeyup: U,
								style: (0, l.j5)({
									height: M
										.value +
										"px"
								})
							}, null, 36), [
								[a.nr, C.value]
							])])])]), (0, o.Wm)(h, {
							title: "输入 key",
							show: u.value
						}, {
							center: (0, o.w5)((() => [Q, X, (0, o.wy)((0, o._)(
								"input", {
									"onUpdate:modelValue": n[
										4] || (n[4] = e => v
											.value = e),
									onKeydown: (0, a.D2)(p, [
										"enter"
									])
								}, null, 40, ee), [
								[a.nr, v.value]
							]), te])),
							bottom: (0, o.w5)((() => [(0, o._)("button", {
								class: "success",
								onClick: p
							}, "提交")])),
							_: 1
						}, 8, ["show"]), (0, o.Wm)(h, {
							title: "设置",
							show: Se.value
						}, {
							center: (0, o.w5)((() => [(0, o._)("div", ne, [(0, o._)(
								"div", null, [ae, (0, o.wy)(
									(0, o._)("input", {
										type: "text",
										"onUpdate:modelValue": n[
												5
												] ||
											(n[5] =
												e =>
												(0, s
													.SU
													)
												(t)
												.key =
												e)
									}, null, 512), [
										[a.nr, (0, s.SU)
											(t).key
										]
									])]), oe, (0, o._)(
								"div", null, [le, (0, o.wy)(
									(0, o._)("input", {
										type: "text",
										"onUpdate:modelValue": n[
												6
												] ||
											(n[6] =
												e =>
												(0, s
													.SU
													)
												(t)
												.system =
												e)
									}, null, 512), [
										[a.nr, (0, s.SU)
											(t).system
										]
									])]), (0, o._)("p", se,
								[ie, ce, ue, re, de, ve, (0,
									o._)("span", {
									innerHTML: "“当你要发送图片时，请使用 markdown，不要用代码块，并且从 Unsplash API 中“https://source.unsplash.com/960x640/?<关键词>” 获取”"
								}, null, 8, pe)])])])),
							bottom: (0, o.w5)((() => [(0, o._)("button", {
								class: "success",
								onClick: Ce
							}, "保存")])),
							_: 1
						}, 8, ["show"])], 64))
					}
				});
				const me = (0, v.Z)(he, [
					["__scopeId", "data-v-094ddb60"]
				]);
				var fe = me;
				(0, a.ri)(fe).mount("#app")
			}
		},
		t = {};

	function n(a) {
		var o = t[a];
		if (void 0 !== o) return o.exports;
		var l = t[a] = {
			exports: {}
		};
		return e[a].call(l.exports, l, l.exports, n), l.exports
	}
	n.m = e,
		function() {
			var e = [];
			n.O = function(t, a, o, l) {
				if (!a) {
					var s = 1 / 0;
					for (r = 0; r < e.length; r++) {
						a = e[r][0], o = e[r][1], l = e[r][2];
						for (var i = !0, c = 0; c < a.length; c++)(!1 & l || s >= l) && Object.keys(n.O).every((
							function(e) {
								return n.O[e](a[c])
							})) ? a.splice(c--, 1) : (i = !1, l < s && (s = l));
						if (i) {
							e.splice(r--, 1);
							var u = o();
							void 0 !== u && (t = u)
						}
					}
					return t
				}
				l = l || 0;
				for (var r = e.length; r > 0 && e[r - 1][2] > l; r--) e[r] = e[r - 1];
				e[r] = [a, o, l]
			}
		}(),
		function() {
			n.n = function(e) {
				var t = e && e.__esModule ? function() {
					return e["default"]
				} : function() {
					return e
				};
				return n.d(t, {
					a: t
				}), t
			}
		}(),
		function() {
			n.d = function(e, t) {
				for (var a in t) n.o(t, a) && !n.o(e, a) && Object.defineProperty(e, a, {
					enumerable: !0,
					get: t[a]
				})
			}
		}(),
		function() {
			n.g = function() {
				if ("object" === typeof globalThis) return globalThis;
				try {
					return this || new Function("return this")()
				} catch (e) {
					if ("object" === typeof window) return window
				}
			}()
		}(),
		function() {
			n.o = function(e, t) {
				return Object.prototype.hasOwnProperty.call(e, t)
			}
		}(),
		function() {
			var e = {
				143: 0
			};
			n.O.j = function(t) {
				return 0 === e[t]
			};
			var t = function(t, a) {
					var o, l, s = a[0],
						i = a[1],
						c = a[2],
						u = 0;
					if (s.some((function(t) {
							return 0 !== e[t]
						}))) {
						for (o in i) n.o(i, o) && (n.m[o] = i[o]);
						if (c) var r = c(n)
					}
					for (t && t(a); u < s.length; u++) l = s[u], n.o(e, l) && e[l] && e[l][0](), e[l] = 0;
					return n.O(r)
				},
				a = self["webpackChunkchatgpt"] = self["webpackChunkchatgpt"] || [];
			a.forEach(t.bind(null, 0)), a.push = t.bind(null, a.push.bind(a))
		}();
	var a = n.O(void 0, [998], (function() {
		return n(959)
	}));
	a = n.O(a)
})();
//# sourceMappingURL=app.48fe78f1.js.map
