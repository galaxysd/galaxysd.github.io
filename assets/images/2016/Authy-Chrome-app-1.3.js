var requirejs, require, define;
! function(global) {
	function isFunction(it) {
		return "[object Function]" === ostring.call(it)
	}

	function isArray(it) {
		return "[object Array]" === ostring.call(it)
	}

	function each(ary, func) {
		if (ary) {
			var i;
			for (i = 0; i < ary.length && (!ary[i] || !func(ary[i], i, ary)); i += 1);
		}
	}

	function eachReverse(ary, func) {
		if (ary) {
			var i;
			for (i = ary.length - 1; i > -1 && (!ary[i] || !func(ary[i], i, ary)); i -= 1);
		}
	}

	function hasProp(obj, prop) {
		return hasOwn.call(obj, prop)
	}

	function getOwn(obj, prop) {
		return hasProp(obj, prop) && obj[prop]
	}

	function eachProp(obj, func) {
		var prop;
		for (prop in obj)
			if (hasProp(obj, prop) && func(obj[prop], prop)) break
	}

	function mixin(target, source, force, deepStringMixin) {
		return source && eachProp(source, function(value, prop) {
			(force || !hasProp(target, prop)) && (!deepStringMixin || "object" != typeof value || !value || isArray(value) || isFunction(value) || value instanceof RegExp ? target[prop] = value : (target[prop] || (target[prop] = {}), mixin(target[prop], value, force, deepStringMixin)))
		}), target
	}

	function bind(obj, fn) {
		return function() {
			return fn.apply(obj, arguments)
		}
	}

	function scripts() {
		return document.getElementsByTagName("script")
	}

	function defaultOnError(err) {
		throw err
	}

	function getGlobal(value) {
		if (!value) return value;
		var g = global;
		return each(value.split("."), function(part) {
			g = g[part]
		}), g
	}

	function makeError(id, msg, err, requireModules) {
		var e = new Error(msg + "\nhttp://requirejs.org/docs/errors.html#" + id);
		return e.requireType = id, e.requireModules = requireModules, err && (e.originalError = err), e
	}

	function newContext(contextName) {
		function trimDots(ary) {
			var i, part;
			for (i = 0; i < ary.length; i++)
				if (part = ary[i], "." === part) ary.splice(i, 1), i -= 1;
				else
			if (".." === part) {
				if (0 === i || 1 == i && ".." === ary[2] || ".." === ary[i - 1]) continue;
				i > 0 && (ary.splice(i - 1, 2), i -= 2)
			}
		}

		function normalize(name, baseName, applyMap) {
			var pkgMain, mapValue, nameParts, i, j, nameSegment, lastIndex, foundMap, foundI, foundStarMap, starI, normalizedBaseParts, baseParts = baseName && baseName.split("/"),
				map = config.map,
				starMap = map && map["*"];
			if (name && (name = name.split("/"), lastIndex = name.length - 1, config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex]) && (name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, "")), "." === name[0].charAt(0) && baseParts && (normalizedBaseParts = baseParts.slice(0, baseParts.length - 1), name = normalizedBaseParts.concat(name)), trimDots(name), name = name.join("/")), applyMap && map && (baseParts || starMap)) {
				nameParts = name.split("/");
				outerLoop: for (i = nameParts.length; i > 0; i -= 1) {
					if (nameSegment = nameParts.slice(0, i).join("/"), baseParts)
						for (j = baseParts.length; j > 0; j -= 1)
							if (mapValue = getOwn(map, baseParts.slice(0, j).join("/")), mapValue && (mapValue = getOwn(mapValue, nameSegment))) {
								foundMap = mapValue, foundI = i;
								break outerLoop
							}!foundStarMap && starMap && getOwn(starMap, nameSegment) && (foundStarMap = getOwn(starMap, nameSegment), starI = i)
				}!foundMap && foundStarMap && (foundMap = foundStarMap, foundI = starI),
				foundMap && (nameParts.splice(0, foundI, foundMap), name = nameParts.join("/"))
			}
			return pkgMain = getOwn(config.pkgs, name), pkgMain ? pkgMain : name
		}

		function removeScript(name) {
			isBrowser && each(scripts(), function(scriptNode) {
				return scriptNode.getAttribute("data-requiremodule") === name && scriptNode.getAttribute("data-requirecontext") === context.contextName ? (scriptNode.parentNode.removeChild(scriptNode), !0) : void 0
			})
		}

		function hasPathFallback(id) {
			var pathConfig = getOwn(config.paths, id);
			return pathConfig && isArray(pathConfig) && pathConfig.length > 1 ? (pathConfig.shift(), context.require.undef(id), context.makeRequire(null, {
				skipMap: !0
			})([id]), !0) : void 0
		}

		function splitPrefix(name) {
			var prefix, index = name ? name.indexOf("!") : -1;
			return index > -1 && (prefix = name.substring(0, index), name = name.substring(index + 1, name.length)), [prefix, name]
		}

		function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
			var url, pluginModule, suffix, nameParts, prefix = null,
				parentName = parentModuleMap ? parentModuleMap.name : null,
				originalName = name,
				isDefine = !0,
				normalizedName = "";
			return name || (isDefine = !1, name = "_@r" + (requireCounter += 1)), nameParts = splitPrefix(name), prefix = nameParts[0], name = nameParts[1], prefix && (prefix = normalize(prefix, parentName, applyMap), pluginModule = getOwn(defined, prefix)), name && (prefix ? normalizedName = pluginModule && pluginModule.normalize ? pluginModule.normalize(name, function(name) {
				return normalize(name, parentName, applyMap)
			}) : -1 === name.indexOf("!") ? normalize(name, parentName, applyMap) : name : (normalizedName = normalize(name, parentName, applyMap), nameParts = splitPrefix(normalizedName), prefix = nameParts[0], normalizedName = nameParts[1], isNormalized = !0, url = context.nameToUrl(normalizedName))), suffix = !prefix || pluginModule || isNormalized ? "" : "_unnormalized" + (unnormalizedCounter += 1), {
				prefix: prefix,
				name: normalizedName,
				parentMap: parentModuleMap,
				unnormalized: !! suffix,
				url: url,
				originalName: originalName,
				isDefine: isDefine,
				id: (prefix ? prefix + "!" + normalizedName : normalizedName) + suffix
			}
		}

		function getModule(depMap) {
			var id = depMap.id,
				mod = getOwn(registry, id);
			return mod || (mod = registry[id] = new context.Module(depMap)), mod
		}

		function on(depMap, name, fn) {
			var id = depMap.id,
				mod = getOwn(registry, id);
			!hasProp(defined, id) || mod && !mod.defineEmitComplete ? (mod = getModule(depMap), mod.error && "error" === name ? fn(mod.error) : mod.on(name, fn)) : "defined" === name && fn(defined[id])
		}

		function onError(err, errback) {
			var ids = err.requireModules,
				notified = !1;
			errback ? errback(err) : (each(ids, function(id) {
				var mod = getOwn(registry, id);
				mod && (mod.error = err, mod.events.error && (notified = !0, mod.emit("error", err)))
			}), notified || req.onError(err))
		}

		function takeGlobalQueue() {
			globalDefQueue.length && (apsp.apply(defQueue, [defQueue.length, 0].concat(globalDefQueue)), globalDefQueue = [])
		}

		function cleanRegistry(id) {
			delete registry[id], delete enabledRegistry[id]
		}

		function breakCycle(mod, traced, processed) {
			var id = mod.map.id;
			mod.error ? mod.emit("error", mod.error) : (traced[id] = !0, each(mod.depMaps, function(depMap, i) {
				var depId = depMap.id,
					dep = getOwn(registry, depId);
				!dep || mod.depMatched[i] || processed[depId] || (getOwn(traced, depId) ? (mod.defineDep(i, defined[depId]), mod.check()) : breakCycle(dep, traced, processed))
			}), processed[id] = !0)
		}

		function checkLoaded() {
			var err, usingPathFallback, waitInterval = 1e3 * config.waitSeconds,
				expired = waitInterval && context.startTime + waitInterval < (new Date).getTime(),
				noLoads = [],
				reqCalls = [],
				stillLoading = !1,
				needCycleCheck = !0;
			if (!inCheckLoaded) {
				if (inCheckLoaded = !0, eachProp(enabledRegistry, function(mod) {
					var map = mod.map,
						modId = map.id;
					if (mod.enabled && (map.isDefine || reqCalls.push(mod), !mod.error))
						if (!mod.inited && expired) hasPathFallback(modId) ? (usingPathFallback = !0, stillLoading = !0) : (noLoads.push(modId), removeScript(modId));
						else
					if (!mod.inited && mod.fetched && map.isDefine && (stillLoading = !0, !map.prefix)) return needCycleCheck = !1
				}), expired && noLoads.length) return err = makeError("timeout", "Load timeout for modules: " + noLoads, null, noLoads), err.contextName = context.contextName, onError(err);
				needCycleCheck && each(reqCalls, function(mod) {
					breakCycle(mod, {}, {})
				}), expired && !usingPathFallback || !stillLoading || !isBrowser && !isWebWorker || checkLoadedTimeoutId || (checkLoadedTimeoutId = setTimeout(function() {
					checkLoadedTimeoutId = 0, checkLoaded()
				}, 50)), inCheckLoaded = !1
			}
		}

		function callGetModule(args) {
			hasProp(defined, args[0]) || getModule(makeModuleMap(args[0], null, !0)).init(args[1], args[2])
		}

		function removeListener(node, func, name, ieName) {
			node.detachEvent && !isOpera ? ieName && node.detachEvent(ieName, func) : node.removeEventListener(name, func, !1)
		}

		function getScriptData(evt) {
			var node = evt.currentTarget || evt.srcElement;
			return removeListener(node, context.onScriptLoad, "load", "onreadystatechange"), removeListener(node, context.onScriptError, "error"), {
				node: node,
				id: node && node.getAttribute("data-requiremodule")
			}
		}

		function intakeDefines() {
			var args;
			for (takeGlobalQueue(); defQueue.length;) {
				if (args = defQueue.shift(), null === args[0]) return onError(makeError("mismatch", "Mismatched anonymous define() module: " + args[args.length - 1]));
				callGetModule(args)
			}
		}
		var inCheckLoaded, Module, context, handlers, checkLoadedTimeoutId, config = {
				waitSeconds: 7,
				baseUrl: "./",
				paths: {},
				bundles: {},
				pkgs: {},
				shim: {},
				config: {}
			}, registry = {}, enabledRegistry = {}, undefEvents = {}, defQueue = [],
			defined = {}, urlFetched = {}, bundlesMap = {}, requireCounter = 1,
			unnormalizedCounter = 1;
		return handlers = {
			require: function(mod) {
				return mod.require ? mod.require : mod.require = context.makeRequire(mod.map)
			},
			exports: function(mod) {
				return mod.usingExports = !0, mod.map.isDefine ? mod.exports ? defined[mod.map.id] = mod.exports : mod.exports = defined[mod.map.id] = {} : void 0
			},
			module: function(mod) {
				return mod.module ? mod.module : mod.module = {
					id: mod.map.id,
					uri: mod.map.url,
					config: function() {
						return getOwn(config.config, mod.map.id) || {}
					},
					exports: mod.exports || (mod.exports = {})
				}
			}
		}, Module = function(map) {
			this.events = getOwn(undefEvents, map.id) || {}, this.map = map, this.shim = getOwn(config.shim, map.id), this.depExports = [], this.depMaps = [], this.depMatched = [], this.pluginMaps = {}, this.depCount = 0
		}, Module.prototype = {
			init: function(depMaps, factory, errback, options) {
				options = options || {}, this.inited || (this.factory = factory, errback ? this.on("error", errback) : this.events.error && (errback = bind(this, function(err) {
					this.emit("error", err)
				})), this.depMaps = depMaps && depMaps.slice(0), this.errback = errback, this.inited = !0, this.ignore = options.ignore, options.enabled || this.enabled ? this.enable() : this.check())
			},
			defineDep: function(i, depExports) {
				this.depMatched[i] || (this.depMatched[i] = !0, this.depCount -= 1, this.depExports[i] = depExports)
			},
			fetch: function() {
				if (!this.fetched) {
					this.fetched = !0, context.startTime = (new Date).getTime();
					var map = this.map;
					return this.shim ? void context.makeRequire(this.map, {
						enableBuildCallback: !0
					})(this.shim.deps || [], bind(this, function() {
						return map.prefix ? this.callPlugin() : this.load()
					})) : map.prefix ? this.callPlugin() : this.load()
				}
			},
			load: function() {
				var url = this.map.url;
				urlFetched[url] || (urlFetched[url] = !0, context.load(this.map.id, url))
			},
			check: function() {
				if (this.enabled && !this.enabling) {
					var err, cjsModule, id = this.map.id,
						depExports = this.depExports,
						exports = this.exports,
						factory = this.factory;
					if (this.inited) {
						if (this.error) this.emit("error", this.error);
						else if (!this.defining) {
							if (this.defining = !0, this.depCount < 1 && !this.defined) {
								if (isFunction(factory)) {
									if (this.events.error && this.map.isDefine || req.onError !== defaultOnError) try {
										exports = context.execCb(id, factory, depExports, exports)
									} catch (e) {
										err = e
									} else exports = context.execCb(id, factory, depExports, exports);
									if (this.map.isDefine && void 0 === exports && (cjsModule = this.module, cjsModule ? exports = cjsModule.exports : this.usingExports && (exports = this.exports)), err) return err.requireMap = this.map, err.requireModules = this.map.isDefine ? [this.map.id] : null, err.requireType = this.map.isDefine ? "define" : "require", onError(this.error = err)
								} else exports = factory;
								this.exports = exports, this.map.isDefine && !this.ignore && (defined[id] = exports, req.onResourceLoad && req.onResourceLoad(context, this.map, this.depMaps)), cleanRegistry(id), this.defined = !0
							}
							this.defining = !1, this.defined && !this.defineEmitted && (this.defineEmitted = !0, this.emit("defined", this.exports), this.defineEmitComplete = !0)
						}
					} else this.fetch()
				}
			},
			callPlugin: function() {
				var map = this.map,
					id = map.id,
					pluginMap = makeModuleMap(map.prefix);
				this.depMaps.push(pluginMap), on(pluginMap, "defined", bind(this, function(plugin) {
					var load, normalizedMap, normalizedMod, bundleId = getOwn(bundlesMap, this.map.id),
						name = this.map.name,
						parentName = this.map.parentMap ? this.map.parentMap.name : null,
						localRequire = context.makeRequire(map.parentMap, {
							enableBuildCallback: !0
						});
					return this.map.unnormalized ? (plugin.normalize && (name = plugin.normalize(name, function(name) {
						return normalize(name, parentName, !0)
					}) || ""), normalizedMap = makeModuleMap(map.prefix + "!" + name, this.map.parentMap), on(normalizedMap, "defined", bind(this, function(value) {
						this.init([], function() {
							return value
						}, null, {
							enabled: !0,
							ignore: !0
						})
					})), normalizedMod = getOwn(registry, normalizedMap.id), void(normalizedMod && (this.depMaps.push(normalizedMap), this.events.error && normalizedMod.on("error", bind(this, function(err) {
						this.emit("error", err)
					})), normalizedMod.enable()))) : bundleId ? (this.map.url = context.nameToUrl(bundleId), void this.load()) : (load = bind(this, function(value) {
						this.init([], function() {
							return value
						}, null, {
							enabled: !0
						})
					}), load.error = bind(this, function(err) {
						this.inited = !0, this.error = err, err.requireModules = [id], eachProp(registry, function(mod) {
							0 === mod.map.id.indexOf(id + "_unnormalized") && cleanRegistry(mod.map.id)
						}), onError(err)
					}), load.fromText = bind(this, function(text, textAlt) {
						var moduleName = map.name,
							moduleMap = makeModuleMap(moduleName),
							hasInteractive = useInteractive;
						textAlt && (text = textAlt), hasInteractive && (useInteractive = !1), getModule(moduleMap), hasProp(config.config, id) && (config.config[moduleName] = config.config[id]);
						try {
							req.exec(text)
						} catch (e) {
							return onError(makeError("fromtexteval", "fromText eval for " + id + " failed: " + e, e, [id]))
						}
						hasInteractive && (useInteractive = !0), this.depMaps.push(moduleMap), context.completeLoad(moduleName), localRequire([moduleName], load)
					}), void plugin.load(map.name, localRequire, load, config))
				})), context.enable(pluginMap, this), this.pluginMaps[pluginMap.id] = pluginMap
			},
			enable: function() {
				enabledRegistry[this.map.id] = this, this.enabled = !0, this.enabling = !0, each(this.depMaps, bind(this, function(depMap, i) {
					var id, mod, handler;
					if ("string" == typeof depMap) {
						if (depMap = makeModuleMap(depMap, this.map.isDefine ? this.map : this.map.parentMap, !1, !this.skipMap), this.depMaps[i] = depMap, handler = getOwn(handlers, depMap.id)) return void(this.depExports[i] = handler(this));
						this.depCount += 1, on(depMap, "defined", bind(this, function(depExports) {
							this.defineDep(i, depExports), this.check()
						})), this.errback && on(depMap, "error", bind(this, this.errback))
					}
					id = depMap.id, mod = registry[id], hasProp(handlers, id) || !mod || mod.enabled || context.enable(depMap, this)
				})), eachProp(this.pluginMaps, bind(this, function(pluginMap) {
					var mod = getOwn(registry, pluginMap.id);
					mod && !mod.enabled && context.enable(pluginMap, this)
				})), this.enabling = !1, this.check()
			},
			on: function(name, cb) {
				var cbs = this.events[name];
				cbs || (cbs = this.events[name] = []), cbs.push(cb)
			},
			emit: function(name, evt) {
				each(this.events[name], function(cb) {
					cb(evt)
				}), "error" === name && delete this.events[name]
			}
		}, context = {
			config: config,
			contextName: contextName,
			registry: registry,
			defined: defined,
			urlFetched: urlFetched,
			defQueue: defQueue,
			Module: Module,
			makeModuleMap: makeModuleMap,
			nextTick: req.nextTick,
			onError: onError,
			configure: function(cfg) {
				cfg.baseUrl && "/" !== cfg.baseUrl.charAt(cfg.baseUrl.length - 1) && (cfg.baseUrl += "/");
				var shim = config.shim,
					objs = {
						paths: !0,
						bundles: !0,
						config: !0,
						map: !0
					};
				eachProp(cfg, function(value, prop) {
					objs[prop] ? (config[prop] || (config[prop] = {}), mixin(config[prop], value, !0, !0)) : config[prop] = value
				}), cfg.bundles && eachProp(cfg.bundles, function(value, prop) {
					each(value, function(v) {
						v !== prop && (bundlesMap[v] = prop)
					})
				}), cfg.shim && (eachProp(cfg.shim, function(value, id) {
					isArray(value) && (value = {
						deps: value
					}), !value.exports && !value.init || value.exportsFn || (value.exportsFn = context.makeShimExports(value)), shim[id] = value
				}), config.shim = shim), cfg.packages && each(cfg.packages, function(pkgObj) {
					var location, name;
					pkgObj = "string" == typeof pkgObj ? {
						name: pkgObj
					} : pkgObj, name = pkgObj.name, location = pkgObj.location, location && (config.paths[name] = pkgObj.location), config.pkgs[name] = pkgObj.name + "/" + (pkgObj.main || "main").replace(currDirRegExp, "").replace(jsSuffixRegExp, "")
				}), eachProp(registry, function(mod, id) {
					mod.inited || mod.map.unnormalized || (mod.map = makeModuleMap(id))
				}), (cfg.deps || cfg.callback) && context.require(cfg.deps || [], cfg.callback)
			},
			makeShimExports: function(value) {
				function fn() {
					var ret;
					return value.init && (ret = value.init.apply(global, arguments)), ret || value.exports && getGlobal(value.exports)
				}
				return fn
			},
			makeRequire: function(relMap, options) {
				function localRequire(deps, callback, errback) {
					var id, map, requireMod;
					return options.enableBuildCallback && callback && isFunction(callback) && (callback.__requireJsBuild = !0), "string" == typeof deps ? isFunction(callback) ? onError(makeError("requireargs", "Invalid require call"), errback) : relMap && hasProp(handlers, deps) ? handlers[deps](registry[relMap.id]) : req.get ? req.get(context, deps, relMap, localRequire) : (map = makeModuleMap(deps, relMap, !1, !0), id = map.id, hasProp(defined, id) ? defined[id] : onError(makeError("notloaded", 'Module name "' + id + '" has not been loaded yet for context: ' + contextName + (relMap ? "" : ". Use require([])")))) : (intakeDefines(), context.nextTick(function() {
						intakeDefines(), requireMod = getModule(makeModuleMap(null, relMap)), requireMod.skipMap = options.skipMap, requireMod.init(deps, callback, errback, {
							enabled: !0
						}), checkLoaded()
					}), localRequire)
				}
				return options = options || {}, mixin(localRequire, {
					isBrowser: isBrowser,
					toUrl: function(moduleNamePlusExt) {
						var ext, index = moduleNamePlusExt.lastIndexOf("."),
							segment = moduleNamePlusExt.split("/")[0],
							isRelative = "." === segment || ".." === segment;
						return -1 !== index && (!isRelative || index > 1) && (ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length), moduleNamePlusExt = moduleNamePlusExt.substring(0, index)), context.nameToUrl(normalize(moduleNamePlusExt, relMap && relMap.id, !0), ext, !0)
					},
					defined: function(id) {
						return hasProp(defined, makeModuleMap(id, relMap, !1, !0).id)
					},
					specified: function(id) {
						return id = makeModuleMap(id, relMap, !1, !0).id, hasProp(defined, id) || hasProp(registry, id)
					}
				}), relMap || (localRequire.undef = function(id) {
					takeGlobalQueue();
					var map = makeModuleMap(id, relMap, !0),
						mod = getOwn(registry, id);
					removeScript(id), delete defined[id], delete urlFetched[map.url], delete undefEvents[id], eachReverse(defQueue, function(args, i) {
						args[0] === id && defQueue.splice(i, 1)
					}), mod && (mod.events.defined && (undefEvents[id] = mod.events), cleanRegistry(id))
				}), localRequire
			},
			enable: function(depMap) {
				var mod = getOwn(registry, depMap.id);
				mod && getModule(depMap).enable()
			},
			completeLoad: function(moduleName) {
				var found, args, mod, shim = getOwn(config.shim, moduleName) || {}, shExports = shim.exports;
				for (takeGlobalQueue(); defQueue.length;) {
					if (args = defQueue.shift(), null === args[0]) {
						if (args[0] = moduleName, found) break;
						found = !0
					} else args[0] === moduleName && (found = !0);
					callGetModule(args)
				}
				if (mod = getOwn(registry, moduleName), !found && !hasProp(defined, moduleName) && mod && !mod.inited) {
					if (!(!config.enforceDefine || shExports && getGlobal(shExports))) return hasPathFallback(moduleName) ? void 0 : onError(makeError("nodefine", "No define call for " + moduleName, null, [moduleName]));
					callGetModule([moduleName, shim.deps || [], shim.exportsFn])
				}
				checkLoaded()
			},
			nameToUrl: function(moduleName, ext, skipExt) {
				var paths, syms, i, parentModule, url, parentPath, bundleId, pkgMain = getOwn(config.pkgs, moduleName);
				if (pkgMain && (moduleName = pkgMain), bundleId = getOwn(bundlesMap, moduleName)) return context.nameToUrl(bundleId, ext, skipExt);
				if (req.jsExtRegExp.test(moduleName)) url = moduleName + (ext || "");
				else {
					for (paths = config.paths, syms = moduleName.split("/"), i = syms.length; i > 0; i -= 1)
						if (parentModule = syms.slice(0, i).join("/"), parentPath = getOwn(paths, parentModule)) {
							isArray(parentPath) && (parentPath = parentPath[0]), syms.splice(0, i, parentPath);
							break
						}
					url = syms.join("/"), url += ext || (/^data\:|\?/.test(url) || skipExt ? "" : ".js"), url = ("/" === url.charAt(0) || url.match(/^[\w\+\.\-]+:/) ? "" : config.baseUrl) + url
				}
				return config.urlArgs ? url + ((-1 === url.indexOf("?") ? "?" : "&") + config.urlArgs) : url
			},
			load: function(id, url) {
				req.load(context, id, url)
			},
			execCb: function(name, callback, args, exports) {
				return callback.apply(exports, args)
			},
			onScriptLoad: function(evt) {
				if ("load" === evt.type || readyRegExp.test((evt.currentTarget || evt.srcElement).readyState)) {
					interactiveScript = null;
					var data = getScriptData(evt);
					context.completeLoad(data.id)
				}
			},
			onScriptError: function(evt) {
				var data = getScriptData(evt);
				return hasPathFallback(data.id) ? void 0 : onError(makeError("scripterror", "Script error for: " + data.id, evt, [data.id]))
			}
		}, context.require = context.makeRequire(), context
	}

	function getInteractiveScript() {
		return interactiveScript && "interactive" === interactiveScript.readyState ? interactiveScript : (eachReverse(scripts(), function(script) {
			return "interactive" === script.readyState ? interactiveScript = script : void 0
		}), interactiveScript)
	}
	var req, s, head, baseElement, dataMain, src, interactiveScript, currentlyAddingScript, mainScript, subPath, version = "2.1.15",
		commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/gm,
		cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
		jsSuffixRegExp = /\.js$/,
		currDirRegExp = /^\.\//,
		op = Object.prototype,
		ostring = op.toString,
		hasOwn = op.hasOwnProperty,
		ap = Array.prototype,
		apsp = ap.splice,
		isBrowser = !("undefined" == typeof window || "undefined" == typeof navigator || !window.document),
		isWebWorker = !isBrowser && "undefined" != typeof importScripts,
		readyRegExp = isBrowser && "PLAYSTATION 3" === navigator.platform ? /^complete$/ : /^(complete|loaded)$/,
		defContextName = "_",
		isOpera = "undefined" != typeof opera && "[object Opera]" === opera.toString(),
		contexts = {}, cfg = {}, globalDefQueue = [],
		useInteractive = !1;
	if ("undefined" == typeof define) {
		if ("undefined" != typeof requirejs) {
			if (isFunction(requirejs)) return;
			cfg = requirejs, requirejs = void 0
		}
		"undefined" == typeof require || isFunction(require) || (cfg = require, require = void 0), req = requirejs = function(deps, callback, errback, optional) {
			var context, config, contextName = defContextName;
			return isArray(deps) || "string" == typeof deps || (config = deps, isArray(callback) ? (deps = callback, callback = errback, errback = optional) : deps = []), config && config.context && (contextName = config.context), context = getOwn(contexts, contextName), context || (context = contexts[contextName] = req.s.newContext(contextName)), config && context.configure(config), context.require(deps, callback, errback)
		}, req.config = function(config) {
			return req(config)
		}, req.nextTick = "undefined" != typeof setTimeout ? function(fn) {
			setTimeout(fn, 4)
		} : function(fn) {
			fn()
		}, require || (require = req), req.version = version, req.jsExtRegExp = /^\/|:|\?|\.js$/, req.isBrowser = isBrowser, s = req.s = {
			contexts: contexts,
			newContext: newContext
		}, req({}), each(["toUrl", "undef", "defined", "specified"], function(prop) {
			req[prop] = function() {
				var ctx = contexts[defContextName];
				return ctx.require[prop].apply(ctx, arguments)
			}
		}), isBrowser && (head = s.head = document.getElementsByTagName("head")[0], baseElement = document.getElementsByTagName("base")[0], baseElement && (head = s.head = baseElement.parentNode)), req.onError = defaultOnError, req.createNode = function(config, moduleName, url) {
			var node = config.xhtml ? document.createElementNS("http://www.w3.org/1999/xhtml", "html:script") : document.createElement("script");
			return node.type = config.scriptType || "text/javascript", node.charset = "utf-8", node.async = !0, node
		}, req.load = function(context, moduleName, url) {
			var node, config = context && context.config || {};
			if (isBrowser) return node = req.createNode(config, moduleName, url), node.setAttribute("data-requirecontext", context.contextName), node.setAttribute("data-requiremodule", moduleName), !node.attachEvent || node.attachEvent.toString && node.attachEvent.toString().indexOf("[native code") < 0 || isOpera ? (node.addEventListener("load", context.onScriptLoad, !1), node.addEventListener("error", context.onScriptError, !1)) : (useInteractive = !0, node.attachEvent("onreadystatechange", context.onScriptLoad)), node.src = url, currentlyAddingScript = node, baseElement ? head.insertBefore(node, baseElement) : head.appendChild(node), currentlyAddingScript = null, node;
			if (isWebWorker) try {
				importScripts(url), context.completeLoad(moduleName)
			} catch (e) {
				context.onError(makeError("importscripts", "importScripts failed for " + moduleName + " at " + url, e, [moduleName]))
			}
		}, isBrowser && !cfg.skipDataMain && eachReverse(scripts(), function(script) {
			return head || (head = script.parentNode), dataMain = script.getAttribute("data-main"), dataMain ? (mainScript = dataMain, cfg.baseUrl || (src = mainScript.split("/"), mainScript = src.pop(), subPath = src.length ? src.join("/") + "/" : "./", cfg.baseUrl = subPath), mainScript = mainScript.replace(jsSuffixRegExp, ""), req.jsExtRegExp.test(mainScript) && (mainScript = dataMain), cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [mainScript], !0) : void 0
		}), define = function(name, deps, callback) {
			var node, context;
			"string" != typeof name && (callback = deps, deps = name, name = null), isArray(deps) || (callback = deps, deps = null), !deps && isFunction(callback) && (deps = [], callback.length && (callback.toString().replace(commentRegExp, "").replace(cjsRequireRegExp, function(match, dep) {
				deps.push(dep)
			}), deps = (1 === callback.length ? ["require"] : ["require", "exports", "module"]).concat(deps))), useInteractive && (node = currentlyAddingScript || getInteractiveScript(), node && (name || (name = node.getAttribute("data-requiremodule")), context = contexts[node.getAttribute("data-requirecontext")])), (context ? context.defQueue : globalDefQueue).push([name, deps, callback])
		}, define.amd = {
			jQuery: !0
		}, req.exec = function(text) {
			return eval(text)
		}, req(cfg)
	}
}(this), define("controllers/a_controller", ["exceptions/missing_param_exception", "helpers/window_helper", "ui/router"], function(MissingParamException, WindowHelper, Router) {
	var Controller;
	return Controller = function() {
		function Controller() {}
		return Controller.RENDERED = null, Controller.RENDERED_BEFORE = null, Controller.LAST_TAB = null, Controller.prototype.beforeShow = function(params) {
			return null != params.selectedTab && (Controller.LAST_TAB = params.selectedTab), Controller.RENDERED_BEFORE = Controller.RENDERED, Controller.RENDERED = this.constructor.name, this.show(params), this.afterShow(params)
		}, Controller.prototype.afterShow = function(params) {}, Controller.prototype.show = function(params) {}, Controller.prototype.setSize = function(size) {
			return WindowHelper.setSize(size)
		}, Controller.prototype.verifyParams = function(options, requiredParams) {
			var param, parameter, _i, _len, _results;
			for (null == requiredParams && (requiredParams = []), _results = [], _i = 0, _len = requiredParams.length; _len > _i; _i++) {
				if (param = requiredParams[_i], parameter = options[param], null === parameter || void 0 === parameter) throw new MissingParamException("the parameter '" + param + "' is not present");
				_results.push(void 0)
			}
			return _results
		}, Controller.prototype.goTo = function(controllerName, options) {
			return null == options && (options = {}), Router.get().goTo(controllerName, options)
		}, Controller.prototype.isRendered = function() {
			return Controller.RENDERED === this.constructor.name
		}, Controller.prototype.render = function(params) {
			return this.isRendered() ? this.getView().render(params) : void 0
		}, Controller.prototype.getView = function() {
			throw new Error("getView must be implemented")
		}, Controller
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("controllers/account_controller", ["controllers/a_controller", "ui/account_view", "models/api/account_api", "helpers/email_helper", "ui/widgets/dialog", "helpers/cellphone_helper", "models/user_info_model", "ui/router", "models/storage/encryption_key", "helpers/app_helper", "models/messaging/chrome_extension"], function(Controller, AccountView, AccountApi, EmailHelper, Dialog, CellphoneHelper, UserInfoModel, Router, EncryptionKey, AppHelper, ChromeExtension) {
	var AccountController;
	return AccountController = function(_super) {
		function AccountController() {
			this.repaint = __bind(this.repaint, this), this.changeMasterPassword = __bind(this.changeMasterPassword, this);
			var self;
			self = this, this.accountView = new AccountView, this.accountView.onEditPhoneNumber = function(countryCode, phone) {
				return self.onEditPhoneNumber(countryCode, phone)
			}, this.accountView.onEditEmail = function(email) {
				return self.onEditEmail(email)
			}, this.accountView.onChangePassword = function(password) {
				return self.changeMasterPassword(password)
			}, this.userInfoModel = new UserInfoModel, this.userInfoModel.addListener(function() {
				return self.repaint()
			})
		}
		return __extends(AccountController, _super), AccountController.prototype.show = function(options) {
			var self;
			return self = this, this.accountView.invalidateCache(), this.userInfoModel.load(function() {})
		}, AccountController.prototype.cancelEdit = function() {
			return this.accountView.cancelEdit()
		}, AccountController.prototype.saveEmail = function(email) {
			var self;
			return self = this, this.userInfoModel.changeEmail(email, function() {
				return self.cancelEdit(), Dialog.simple(Dialog.LIGHT, "The request is pending for approval.")
			}, function(error) {
				return self.cancelEdit(), Dialog.simple(Dialog.LIGHT, "Your email could not be changed")
			})
		}, AccountController.prototype.savePhone = function(countryCode, phone) {
			var self;
			return self = this, this.userInfoModel.changePhone(countryCode, phone, function() {
				return self.cancelEdit(), Dialog.simple(Dialog.LIGHT, "A request has been made to change your phone number and is pending confirmation.", function() {
					return Router.get().goTo("ChangePhoneConfirmationController", {
						userInfoModel: self.userInfoModel,
						newCountryCode: countryCode,
						newCellphone: phone
					})
				})
			}, function(error) {
				return self.cancelEdit(), Dialog.simple(Dialog.LIGHT, error.message)
			})
		}, AccountController.prototype.getCurrentEmail = function() {
			return this.userInfoModel.getEmail()
		}, AccountController.prototype.getCurrentCountryCode = function() {
			return this.userInfoModel.getCountryCode() + ""
		}, AccountController.prototype.getCurrentCellphone = function() {
			return this.userInfoModel.getCellphone()
		}, AccountController.prototype.onEditPhoneNumber = function(countryCode, phoneNumber) {
			return this.getCurrentCountryCode() === countryCode && this.getCurrentCellphone() === phoneNumber ? void this.cancelEdit() : void(CellphoneHelper.isValid({
				countryCode: countryCode,
				phoneNumber: phoneNumber
			}) ? this.savePhone(countryCode, phoneNumber) : (Dialog.simple(Dialog.LIGHT, "You must enter a valid country code and phone number."), this.cancelEdit()))
		}, AccountController.prototype.onEditEmail = function(email) {
			return this.getCurrentEmail() === email ? void this.cancelEdit() : void(EmailHelper.isValid(email) ? this.saveEmail(email) : (Dialog.simple(Dialog.LIGHT, "You must enter a valid email."), this.cancelEdit()))
		}, AccountController.prototype.changeMasterPassword = function(password) {
			var dialog, self;
			return self = this, dialog = Dialog.progress(Dialog.LIGHT, "Setting new master password", function() {
				return EncryptionKey.changePassword(password, function() {
					return Dialog.close(dialog), Dialog.simple(Dialog.LIGHT, "Your master password has been changed"), AppHelper.addCloseAppEventListener(), self.goTo("SettingsController")
				})
			})
		}, AccountController.prototype.repaint = function() {
			var countryCode, email, phone, self;
			return self = this, countryCode = this.userInfoModel.getCountryCode(), phone = this.userInfoModel.getCellphone(), email = this.userInfoModel.getEmail(), ChromeExtension.get().isInstalled(function(isInstalled) {
				return self.accountView.render({
					countryCode: countryCode,
					phone: phone,
					email: email,
					isExtInstalled: isInstalled
				})
			})
		}, AccountController
	}(Controller)
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("controllers/account_ready_controller", ["controllers/a_controller", "ui/router", "ui/widgets/dialog", "models/apps/master_token", "models/apps/health_check", "models/user_info_model", "models/devices/devices_model", "workers/gen_encryption_key_task", "models/assets/asset_manager", "models/analytics/finish_registration_event"], function(Controller, Router, Dialog, MasterToken, HealthCheck, UserInfoModel, DevicesModel, GenEncryptionKeyTask, AssetManager, FinishRegistrationEvent) {
	var AccountReadyController, _ref;
	return AccountReadyController = function(_super) {
		function AccountReadyController() {
			return _ref = AccountReadyController.__super__.constructor.apply(this, arguments)
		}
		return __extends(AccountReadyController, _super), AccountReadyController.prototype.show = function(params) {
			var devicesModel, dialog, healthCheck, userInfoModel;
			return this.verifyParams(params, ["userId", "deviceId", "secretSeed", "selectAuthTypeDate"]), this.userId = params.userId, this.deviceId = params.deviceId, this.secretSeed = params.secretSeed, this.finishEvent = new FinishRegistrationEvent({
				selectAuthTypeDate: params.selectAuthTypeDate
			}), this.finishEvent.send(), dialog = Dialog.progress(Dialog.DARK, "Loading account"), MasterToken.initialize(this.userId, this.deviceId, this.secretSeed), healthCheck = HealthCheck.get(), healthCheck.run({
				onFail: function(error) {
					return Dialog.error(Dialog.DARK, error)
				}
			}), userInfoModel = new UserInfoModel, devicesModel = new DevicesModel, userInfoModel.load(function() {}), devicesModel.load(function() {}), this.genEncryptionKeyTask = GenEncryptionKeyTask.get(), this.genEncryptionKeyTask.whenFinished(function() {
				return MasterToken.save(), AssetManager.get().whenManifestDownloaded(function() {
					return AssetManager.get().invalidateDownloadedCallback(), Dialog.close(dialog), Router.get().goTo("TokensController");
				})
			})
		}, AccountReadyController
	}(Controller)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("controllers/backups_password_controller", ["controllers/a_controller", "ui/backups_password_view", "ui/router", "ui/widgets/dialog", "helpers/window_helper", "models/apps/backups_password_model", "models/apps/app_manager", "helpers/date_helper"], function(Controller, BackupsPasswordView, Router, Dialog, WindowHelper, BackupsPasswordModel, AppManager, DateHelper) {
	var BackupsPasswordController;
	return BackupsPasswordController = function(_super) {
		function BackupsPasswordController() {
			this.onSetPassword = __bind(this.onSetPassword, this), this.backupsPasswordView = new BackupsPasswordView, this.backupsPasswordView.onSetPassword = this.onSetPassword
		}
		return __extends(BackupsPasswordController, _super), BackupsPasswordController.prototype.show = function(params) {
			return WindowHelper.setSize(WindowHelper.SETTINGS_SECTION_SIZE), params.notDisplaySettings = !0, this.backupsPasswordView.render(params)
		}, BackupsPasswordController.prototype.onSetPassword = function(password) {
			var dialog;
			return dialog = Dialog.progress(Dialog.LIGHT, "Setting backups password<br>This can take a minute", function() {
				return BackupsPasswordModel.setPassword(password, function() {
					var appManager;
					return appManager = AppManager.get(), appManager.updateAuthenticatorAppsPasswordTimestamp(DateHelper.getTimestampSeconds()), appManager.updateEncryptedSeeds(), appManager.uploadAuthenticatorApps(), appManager.save(), Dialog.close(dialog), Dialog.simple(Dialog.LIGHT, "The password has been set."), Router.get().goTo("SettingsController", {
						innerView: Controller.RENDERED_BEFORE,
						selectedTab: Controller.LAST_TAB
					})
				})
			})
		}, BackupsPasswordController
	}(Controller)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("controllers/change_phone_confirmation_controller", ["controllers/a_controller", "ui/change_phone_confirmation_view", "ui/router", "ui/widgets/dialog", "models/api/account_api"], function(Controller, ChangePhoneConfirmationView, Router, Dialog, AccountApi) {
	var ChangePhoneConfirmationController;
	return ChangePhoneConfirmationController = function(_super) {
		function ChangePhoneConfirmationController() {
			this.confirmChangePhone = __bind(this.confirmChangePhone, this), this.requestConfirmationPin = __bind(this.requestConfirmationPin, this);
			var self;
			self = this, this.changePhoneConfirmationView = new ChangePhoneConfirmationView, this.accountApi = new AccountApi, this.changePhoneConfirmationView.onRequestConfirmationPinSmsClicked = function() {
				return self.requestConfirmationPin("sms")
			}, this.changePhoneConfirmationView.onRequestConfirmationPinCallClicked = function() {
				return self.requestConfirmationPin("call")
			}, this.changePhoneConfirmationView.onConfirmClicked = this.confirmChangePhone
		}
		return __extends(ChangePhoneConfirmationController, _super), ChangePhoneConfirmationController.prototype.show = function(options) {
			var self;
			return self = this, this.verifyParams(options, ["newCountryCode", "newCellphone", "userInfoModel"]), this.newCountryCode = options.newCountryCode, this.newCellphone = options.newCellphone, this.userInfoModel = options.userInfoModel, this.changePhoneConfirmationView.render()
		}, ChangePhoneConfirmationController.prototype.requestConfirmationPin = function(via) {
			return this.accountApi.requestConfirmationPin(via, function(response) {
				return Dialog.simple(Dialog.LIGHT, response.message)
			}, function(response) {
				return Dialog.error(Dialog.LIGHT, response.message)
			})
		}, ChangePhoneConfirmationController.prototype.confirmChangePhone = function(pin) {
			var self;
			return self = this, this.accountApi.confirmChangePhone(pin, function(response) {
				return self.userInfoModel.setCountryCode(self.newCountryCode), self.userInfoModel.setCellphone(self.newCellphone), self.userInfoModel.save(), self.userInfoModel.notifyListeners(), Dialog.simple(Dialog.LIGHT, response.message)
			}, function(response) {
				return Dialog.error(Dialog.LIGHT, response.message)
			})
		}, ChangePhoneConfirmationController
	}(Controller)
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("controllers/create_authenticator_account_controller", ["controllers/a_controller", "ui/create_authenticator_account_view", "models/apps/app_manager", "ui/widgets/dialog", "helpers/log", "helpers/encoding_helper"], function(Controller, CreateAuthenticatorAccountView, AppManager, Dialog, Log, EncodingHelper) {
	var CreateAuthenticatorAccountController;
	return CreateAuthenticatorAccountController = function(_super) {
		function CreateAuthenticatorAccountController() {
			var self;
			self = this, this.createAuthenticatorAccountView = new CreateAuthenticatorAccountView, this.createAuthenticatorAccountView.onCreateAccount = function(secret) {
				return self.onCreateAccount(secret)
			}, this.createAuthenticatorAccountView.onBackClicked = function() {
				return self.onBackClicked()
			}, this.createAuthenticatorAccountView.cachingEnabled = !0, this.appManager = AppManager.get()
		}
		return __extends(CreateAuthenticatorAccountController, _super), CreateAuthenticatorAccountController.prototype.show = function(options) {
			return this.createAuthenticatorAccountView.render()
		}, CreateAuthenticatorAccountController.prototype.onCreateAccount = function(secret) {
			var self;
			return self = this, secret = _.str.trim(secret), this.isSecretValid(secret) ? (secret = EncodingHelper.clean(secret), self.goTo("UpdateAuthAppController", {
				secret: secret,
				newAccount: !0
			})) : (Log.d("the secret " + secret + " is not valid"), Dialog.error(Dialog.LIGHT, "The code is invalid"))
		}, CreateAuthenticatorAccountController.prototype.isSecretValid = function(secret) {
			return EncodingHelper.isValid(secret)
		}, CreateAuthenticatorAccountController.prototype.onBackClicked = function() {
			return this.createAuthenticatorAccountView.hideNavButtons(), this.goTo("ExternalAccountsController")
		}, CreateAuthenticatorAccountController
	}(Controller)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("controllers/device_request_controller", ["controllers/a_controller", "ui/device_request_view", "helpers/json_storage", "models/api/devices_api", "ui/widgets/dialog", "helpers/log", "ui/router", "models/devices/device_request_model"], function(Controller, DeviceRequestView, JsonStorage, DevicesApi, Dialog, Log, Router, DeviceRequestModel) {
	var DeviceRequestController;
	return DeviceRequestController = function(_super) {
		function DeviceRequestController(options) {
			null == options && (options = {}), this.onActionFail = __bind(this.onActionFail, this), this.onActionSuccess = __bind(this.onActionSuccess, this), this.onRejectDevice = __bind(this.onRejectDevice, this), this.onAcceptDevice = __bind(this.onAcceptDevice, this), this.devicesApi = options.devicesApi || new DevicesApi, this.deviceRequestView = options.deviceRequestView || new DeviceRequestView, this.deviceRequestView.onRejectDevice = this.onRejectDevice, this.deviceRequestView.onAcceptDevice = this.onAcceptDevice, this.deviceRequestModel = DeviceRequestModel.get()
		}
		return __extends(DeviceRequestController, _super), DeviceRequestController.prototype.show = function(params) {
			return this.verifyParams(params, ["requestId", "confirmationToken", "ip", "name"]), this.requestId = params.requestId, this.confirmationToken = params.confirmationToken, this.deviceRequestView.render(params)
		}, DeviceRequestController.prototype.goBack = function() {
			return Router.get().goTo("TokensController")
		}, DeviceRequestController.prototype.onAcceptDevice = function() {
			var dialog, self;
			return self = this, dialog = Dialog.progress(Dialog.LIGHT, "Accepting the new device.", function() {
				return self.devicesApi.acceptMultiDeviceRequest(self.requestId, self.confirmationToken, function(response) {
					return self.onActionSuccess(response, "The new device has been accepted", "Device Accepted")
				}, function(response) {
					return self.onActionFail(response, "Could not accept the new device")
				})
			})
		}, DeviceRequestController.prototype.onRejectDevice = function() {
			var dialog, self;
			return self = this, dialog = Dialog.progress(Dialog.LIGHT, "Rejecting the new device.", function() {
				return self.devicesApi.rejectMultiDeviceRequest(self.requestId, self.confirmationToken, function(response) {
					return self.onActionSuccess(response, "The new device has been rejected", "Device Rejected")
				}, function(response) {
					return self.onActionFail(response, "Could not reject the new device")
				})
			})
		}, DeviceRequestController.prototype.onActionSuccess = function(response, message, title) {
			var dialog, self;
			return self = this, this.deviceRequestModel.setDeviceRequestPresent(!1), dialog = Dialog.simpleWithoutButtons(Dialog.LIGHT, message, title), setTimeout(function() {
				return Dialog.close(dialog), self.goBack()
			}, 500)
		}, DeviceRequestController.prototype.onActionFail = function(response, message) {
			return Log.e(response.message), Dialog.error(Dialog.LIGHT, message, "Error!", this.goBack)
		}, DeviceRequestController
	}(Controller)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("controllers/devices_controller", ["controllers/a_controller", "ui/devices_view", "models/api/devices_api", "helpers/json_storage", "ui/widgets/dialog", "models/user_info_model", "models/devices/devices_model", "helpers/date_helper"], function(Controller, DevicesView, DevicesApi, JsonStorage, Dialog, UserInfoModel, DevicesModel, DateHelper) {
	var DevicesController;
	return DevicesController = function(_super) {
		function DevicesController() {
			this.repaint = __bind(this.repaint, this);
			var self;
			self = this, this.devicesView = new DevicesView, this.devicesView.onRemoveButtonClicked = function(deviceId) {
				return self.onRemoveDeviceClicked(deviceId)
			}, this.devicesView.onMultiDeviceStateChange = function(enabled) {
				return self.onMultiDeviceStateChange(enabled)
			}, this.userInfoModel = new UserInfoModel, this.devices = new DevicesModel, this.devices.addListener(function() {
				return self.repaint()
			}), this.userInfoModel.addListener(function() {
				return self.repaint()
			})
		}
		return __extends(DevicesController, _super), DevicesController.prototype.show = function(options) {
			var self;
			self = this, this.devicesView.invalidateCache(), this.devices.load(function() {}), this.userInfoModel.load(function() {})
		}, DevicesController.prototype.onRemoveDeviceClicked = function(deviceId) {
			var self;
			return self = this, Dialog.show(Dialog.LIGHT, "Are you sure you want to remove this device?", function() {
				return self.devices.removeDevice(deviceId, function() {
					var dialog;
					return dialog = Dialog.simpleWithoutButtons(Dialog.LIGHT, "The device has been successfully removed."), setTimeout(function() {
						return Dialog.close(dialog), self.repaint()
					}, 1e3)
				}, function(error) {
					return self.onError(error.message)
				})
			}, function() {}, "Yes", "No")
		}, DevicesController.prototype.onMultiDeviceStateChange = function(enabled) {
			var self;
			return self = this, this.dialog = Dialog.progress(Dialog.LIGHT, "Updating multi device state", function() {
				return self.userInfoModel.setMultiDevicesEnabled(enabled, function() {
					return self.onMultiDeviceStateChangeOk()
				}, function() {
					return self.onError("Could not change multi device state"), self.repaint()
				})
			})
		}, DevicesController.prototype.onMultiDeviceStateChangeOk = function() {
			var dialog, enabled, message;
			return enabled = this.devicesView.getMultiDeviceCheckboxValue(), enabled && (message = "enabled"), enabled || (message = "disabled. You can no longer add new devices, but your current ones will remain active"), dialog = Dialog.simpleWithoutButtons(Dialog.LIGHT, "Multi-device is now " + message + "."), setTimeout(function() {
				return Dialog.close(dialog)
			}, 3e3)
		}, DevicesController.prototype.onError = function(message) {
			return Dialog.error(Dialog.LIGHT, message)
		}, DevicesController.prototype.repaint = function() {
			return null != this.dialog && Dialog.close(this.dialog), this.devicesView.render({
				devices: this.devices.getOtherDevices(),
				multiDeviceEnabled: this.userInfoModel.isMultiDeviceEnabled(),
				humanize: function() {
					return function(text, render) {
						return _.str.humanize(render(text))
					}
				},
				prettyDate: function() {
					return function(text, render) {
						return DateHelper.getDateStringPrettyFormat(render(text))
					}
				}
			})
		}, DevicesController
	}(Controller)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("controllers/external_accounts_controller", ["controllers/a_controller", "ui/external_accounts_view", "ui/router", "models/apps/backups_password_model", "models/storage/encryption_key", "ui/widgets/dialog", "models/apps/app_manager", "models/apps/google_auth_app"], function(Controller, ExternalAccountsView, Router, BackupsPasswordModel, EncryptionKey, Dialog, AppManager, GoogleAuthApp) {
	var ExternalAccountsController;
	return ExternalAccountsController = function(_super) {
		function ExternalAccountsController() {
			this.repaint = __bind(this.repaint, this), this.changeBackupsPassword = __bind(this.changeBackupsPassword, this), this.canChangeBackupsPassword = __bind(this.canChangeBackupsPassword, this), this.undeleteAuthApp = __bind(this.undeleteAuthApp, this), this.deleteAuthApp = __bind(this.deleteAuthApp, this);
			var self;
			self = this, this.externalAccountsView = new ExternalAccountsView, this.externalAccountsView.onAppClicked = function(appId) {
				return self.showApp(appId)
			}, this.externalAccountsView.onDeleteAppClicked = function(appId) {
				return self.deleteAuthApp(appId)
			}, this.externalAccountsView.onUndeleteAppClicked = function(appId) {
				return self.undeleteAuthApp(appId)
			}, this.externalAccountsView.onSaveBackupsPassword = this.changeBackupsPassword, this.appManager = AppManager.get(), this.appManager.addListener(function(data) {
				return self.repaint(data)
			}), BackupsPasswordModel.get().addListener(function() {
				return self.repaint()
			})
		}
		return __extends(ExternalAccountsController, _super), ExternalAccountsController.prototype.show = function(options) {
			var self;
			return self = this, this.appManager.notifyListeners()
		}, ExternalAccountsController.prototype.showApp = function(appId) {
			return Router.get().goTo("UpdateAuthAppController", {
				appId: appId,
				newAccount: !1
			})
		}, ExternalAccountsController.prototype.deleteAuthApp = function(appId) {
			return this.appManager.deleteAppOrMarkForDeletion(appId, function(wasDeleted) {
				var message;
				return wasDeleted ? Dialog.simple(Dialog.LIGHT, "The account has been deleted.") : (message = "The account has been marked for deletion, and will be deleted in " + GoogleAuthApp.HOURS_BEFORE_DELETION + "h. ", message += "You can undelete it before this time has elapsed.", Dialog.simple(Dialog.LIGHT, message))
			}, function() {
				var message;
				return message = "The account could not be deleted right now, so it has been marked for deletion. ", message += "It will be deleted as soon as possible.", Dialog.simple(Dialog.LIGHT, message)
			}, function() {
				return Dialog.error(Dialog.LIGHT, "The account could not be deleted. Please try again.")
			})
		}, ExternalAccountsController.prototype.undeleteAuthApp = function(appId) {
			var app;
			return app = this.appManager.find(appId), this.appManager.markAppForDeletion(app, !1) ? void 0 : Dialog.error(Dialog.LIGHT, "The account could not be undeleted. Please try again.")
		}, ExternalAccountsController.prototype.canChangeBackupsPassword = function() {
			return this.getView().canChangeBackupsPassword()
		}, ExternalAccountsController.prototype.changeBackupsPassword = function(password) {
			var dialog, self;
			return this.canChangeBackupsPassword() ? (self = this, dialog = Dialog.progress(Dialog.LIGHT, "Setting new backups password<br>This can take a minute", function() {
				return BackupsPasswordModel.changePassword(password, {
					cb: function() {
						return Dialog.close(dialog), Dialog.simple(Dialog.LIGHT, "Your backups password has been changed"), self.externalAccountsView.disableBackupsPassword()
					},
					onFail: function() {
						return Dialog.close(dialog), Dialog.simple(Dialog.LIGHT, "Unable to change your backups password <br> Please try again.")
					}
				})
			})) : (Dialog.error(Dialog.LIGHT, "No Internet connection. The password can't be changed."), !1)
		}, ExternalAccountsController.prototype.getView = function() {
			return this.externalAccountsView
		}, ExternalAccountsController.prototype.repaint = function(options) {
			var apps, onlyImages, self;
			null == options && (options = {}), onlyImages = options.onlyImages, self = this, apps = this.appManager.getAuthenticatorApps().sort(this.appManager.compareApps), onlyImages ? this.externalAccountsView.updateImages(apps) : BackupsPasswordModel.areBackupsEnabled(function(areBackupsEnabled) {
				return self.render({
					apps: apps,
					backupsPassword: areBackupsEnabled,
					force: options.force
				}, function() {
					return self.externalAccountsView.updateImages(apps)
				})
			})
		}, ExternalAccountsController
	}(Controller)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("controllers/registration_controller", ["controllers/a_controller", "ui/registration_view", "models/api/registration_api", "helpers/cellphone_helper", "ui/router", "helpers/window_helper", "helpers/log", "models/analytics/initialize_registration_event"], function(Controller, RegistrationView, RegistrationApi, CellphoneHelper, Router, WindowHelper, Log, InitializeRegistrationEvent) {
	var RegistrationController;
	return RegistrationController = function(_super) {
		function RegistrationController(options) {
			var self;
			null == options && (options = {}), this.createAccount = __bind(this.createAccount, this), this.onDeviceStatusSuccess = __bind(this.onDeviceStatusSuccess, this), this.getDeviceStatus = __bind(this.getDeviceStatus, this), self = this, this.regApi = options.registrationApi || new RegistrationApi, this.registrationView = options.registrationView || RegistrationView.get(), this.initRegistrationEvent = options.initRegistrationEvent || new InitializeRegistrationEvent, this.registrationView.getDeviceStatus = this.getDeviceStatus, this.registrationView.createAccount = this.createAccount
		}
		return __extends(RegistrationController, _super), RegistrationController.prototype.getDeviceStatus = function(countryCode, cellphone) {
			var self;
			return self = this, this.regApi.getDeviceStatus(countryCode, cellphone, function(deviceCount, status, authyId) {
				return self.onDeviceStatusSuccess(deviceCount, status, authyId, countryCode, cellphone)
			}, function(response) {
				return self.registrationView.showFailDialog("Unable to register: " + response.message)
			})
		}, RegistrationController.prototype.onDeviceStatusSuccess = function(deviceCount, status, authyId, countryCode, cellphone) {
			return this.initRegistrationEvent.setData({
				cellphone: cellphone,
				countryCode: countryCode,
				isNew: "new" === status ? !0 : !1,
				deviceCount: null != deviceCount ? deviceCount : 0
			}), "new" === status ? this.registrationView.goToEmailSection() : "active" === status || "resetting" === status ? (this.initRegistrationEvent.setUserProperties(authyId), this.initRegistrationEvent.send(), this.registrationView.goToVerificationSection(), this.goTo("RegistrationPinController", {
				userId: authyId,
				countryCode: countryCode,
				cellphone: cellphone
			})) : void 0
		}, RegistrationController.prototype.createAccount = function(countryCode, cellphone, email) {
			var self;
			self = this, this.regApi.createAccount(countryCode, cellphone, email, function(authyId) {
				self.initRegistrationEvent.setUserProperties(authyId), self.initRegistrationEvent.send(), self.registrationView.goToVerificationSection(), self.goTo("RegistrationPinController", {
					userId: authyId,
					countryCode: countryCode,
					cellphone: cellphone
				})
			}, function(error) {
				return self.registrationView.showFailDialog(error.message)
			})
		}, RegistrationController.prototype.show = function() {
			return this.setSize(WindowHelper.REGISTRATION_SECTION_SIZE), this.registrationView.render({
				title: "Computer Set Up",
				btn_back_class: "hide",
				countryCode: "",
				phoneNumber: ""
			})
		}, RegistrationController
	}(Controller)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("controllers/registration_pin_controller", ["controllers/a_controller", "ui/registration_view", "models/api/registration_api", "helpers/crypto_helper", "ui/widgets/dialog", "helpers/log", "models/analytics/select_auth_type_event", "helpers/date_helper"], function(Controller, RegistrationView, RegistrationApi, CryptoHelper, Dialog, Log, SelectAuthTypeEvent, DateHelper) {
	var RegistrationPinController;
	return RegistrationPinController = function(_super) {
		function RegistrationPinController(options) {
			var self;
			null == options && (options = {}), this.onRegisterSuccessful = __bind(this.onRegisterSuccessful, this), this.verifyAndRegisterDevice = __bind(this.verifyAndRegisterDevice, this), this.requestPushPin = __bind(this.requestPushPin, this), this.requestCallPin = __bind(this.requestCallPin, this), this.requestSmsPin = __bind(this.requestSmsPin, this), this.requestPin = __bind(this.requestPin, this), self = this, this.registrationView = options.registrationView || RegistrationView.get(), this.regApi = options.registrationApi || new RegistrationApi, this.selectAuthTypeEvent = options.selectAuthTypeEvent || new SelectAuthTypeEvent, this.registrationView.requestSmsPin = this.requestSmsPin, this.registrationView.requestCallPin = this.requestCallPin, this.registrationView.requestPushPin = this.requestPushPin, this.registrationView.verifyAndRegisterDevice = this.verifyAndRegisterDevice, this.verifyingPin = !1
		}
		return __extends(RegistrationPinController, _super), RegistrationPinController.prototype.show = function(params) {
			var self;
			return self = this, this.verifyParams(params, ["userId", "countryCode", "cellphone"]), this.userId = params.userId, this.countryCode = params.countryCode, this.cellphone = params.cellphone, this.signature = CryptoHelper.generateSalt()
		}, RegistrationPinController.prototype.requestPin = function(via, onSuccess, onFail) {
			var self;
			return self = this, self.selectAuthTypeDate = DateHelper.getCurrentDateObject(), this.regApi.createNewDeviceRequest(this.userId, this.signature, via, function(message, requestId, approvalPin, provider) {
				return self.selectAuthTypeEvent.setData({
					provider: provider,
					authType: via
				}), self.selectAuthTypeEvent.send(), onSuccess(message, requestId, approvalPin, provider)
			}, onFail)
		}, RegistrationPinController.prototype.requestSmsPin = function() {
			var self;
			return self = this, this.requestPin("sms", function(message, requestId, approvalPin, provider) {
				return self.registrationView.goToSmsSection()
			}, function(error) {
				return self.registrationView.showFailDialog(error.message)
			})
		}, RegistrationPinController.prototype.requestCallPin = function() {
			var self;
			return self = this, this.requestPin("call", function(message, requestId, approvalPin, provider) {
				return null != approvalPin ? (self.registrationView.goToCallSection(approvalPin), self.goTo("WaitingForConfirmationController", {
					signature: self.signature,
					requestId: requestId,
					userId: self.userId,
					selectAuthTypeDate: self.selectAuthTypeDate
				})) : Log.e("Did not receive approval pin for call")
			}, function(error) {
				return self.registrationView.showFailDialog(error.message)
			})
		}, RegistrationPinController.prototype.requestPushPin = function() {
			var self;
			return self = this, this.requestPin("push", function(message, requestId, approvalPin, provider) {
				return self.registrationView.goToPushSection(), self.goTo("WaitingForConfirmationController", {
					signature: self.signature,
					requestId: requestId,
					userId: self.userId,
					selectAuthTypeDate: self.selectAuthTypeDate
				})
			}, function(error) {
				return self.registrationView.showFailDialog(error.message, "Unable verify via device")
			})
		}, RegistrationPinController.prototype.verifyAndRegisterDevice = function(registrationPin) {
			var dialog, self;
			if (!this.verifyingPin) return this.verifyingPin = !0, self = this, dialog = Dialog.progress(Dialog.DARK, "Registering this device."), this.regApi.registerNewDevice(this.userId, registrationPin, function(userId, deviceId, secretSeed) {
				return Dialog.close(dialog), self.onRegisterSuccessful(userId, deviceId, secretSeed, self.selectAuthTypeDate), self.verifyingPin = !1
			}, function(error) {
				return self.verifyingPin = !1, Dialog.close(dialog), self.registrationView.showFailDialog(error.message, "Wrong PIN", function() {
					return self.registrationView.clearRegistrationPin()
				})
			})
		}, RegistrationPinController.prototype.onRegisterSuccessful = function(userId, deviceId, secretSeed, selectAuthTypeDate) {
			return null == selectAuthTypeDate && (selectAuthTypeDate = this.selectAuthTypeDate), this.goTo("AccountReadyController", {
				userId: userId,
				deviceId: deviceId,
				secretSeed: secretSeed,
				selectAuthTypeDate: selectAuthTypeDate
			})
		}, RegistrationPinController
	}(Controller)
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("controllers/settings_controller", ["controllers/a_controller", "ui/settings_view", "ui/router", "helpers/window_helper", "models/apps/backups_password_model", "models/devices/device_request_model"], function(Controller, SettingsView, Router, WindowHelper, BackupsPasswordModel, DeviceRequestModel) {
	var SettingsController;
	return SettingsController = function(_super) {
		function SettingsController() {
			var self;
			self = this, this.settingsView = new SettingsView, this.settingsView.onAccountTabSelected = function() {
				return self.onAccountTabSelected()
			}, this.settingsView.onExternalAccountsTabSelected = function() {
				return self.onExternalAccountsTabSelected()
			}, this.settingsView.onDevicesTabSelected = function() {
				return self.onDevicesTabSelected()
			}, this.settingsView.onQuitClicked = function() {
				return self.onQuitClicked()
			}, this.settingsView.onMinimizeClicked = function() {
				return self.onMinimizeClicked()
			}, this.settingsView.cachingEnabled = !0, this.deviceRequestModel = DeviceRequestModel.get()
		}
		return __extends(SettingsController, _super), SettingsController.prototype.show = function(params) {
			var self;
			if (self = this, this.settingsView.invalidateCache(), this.setSize(WindowHelper.SETTINGS_SECTION_SIZE), this.deviceRequestModel.isDeviceRequestPresent()) return this.settingsView.render({
				selectedTab: SettingsView.DEVICES_TAB
			}, function() {
				return Router.get().goTo("DeviceRequestController", self.deviceRequestModel.getModel())
			});
			if (null != params.innerView && null != params.selectedTab) return this.settingsView.render({
				selectedTab: params.selectedTab
			}, function() {
				return Router.get().goTo(params.innerView, params.innerParams || {})
			});
			if (null != params.innerView && null == params.selectedTab) throw new Error("Must specify selectedTab for innerView");
			return this.settingsView.render({
				selectedTab: SettingsView.ACCOUNT_TAB
			}, function() {
				return self.settingsView.onAccountTabSelected()
			})
		}, SettingsController.prototype.onAccountTabSelected = function() {
			return Router.get().goTo("AccountController", {
				selectedTab: SettingsView.ACCOUNT_TAB
			})
		}, SettingsController.prototype.onExternalAccountsTabSelected = function() {
			return Router.get().goTo("ExternalAccountsController", {
				selectedTab: SettingsView.EXTERNAL_ACCOUNTS_TAB
			})
		}, SettingsController.prototype.onDevicesTabSelected = function() {
			return Router.get().goTo("DevicesController", {
				selectedTab: SettingsView.DEVICES_TAB
			})
		}, SettingsController.prototype.onQuitClicked = function() {
			return Router.get().goTo("TokensController")
		}, SettingsController.prototype.onMinimizeClicked = function() {
			return WindowHelper.minimizeWindow()
		}, SettingsController
	}(Controller)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("controllers/tokens_controller", ["controllers/a_controller", "ui/tokens_view", "models/api/apps_api", "models/apps/master_token", "models/apps/app_manager", "models/apps/authy_rsa_key", "ui/router", "ui/widgets/dialog", "ui/settings_view", "models/apps/backups_password_model", "helpers/ui_helper", "models/sync/sync_helper", "ui/widgets/toast", "models/assets/asset_manager", "helpers/date_helper", "helpers/log", "models/otp_generator/authy_timer", "models/otp_generator/google_auth_timer"], function(Controller, TokensView, AppsApi, MasterToken, AppManager, AuthyRSAKey, Router, Dialog, SettingsView, BackupsPasswordModel, UIHelper, SyncHelper, Toast, AssetManager, DateHelper, Log, AuthyTimer, GoogleAuthTimer) {
	var TokensController;
	return TokensController = function(_super) {
		function TokensController() {
			this.onCopyClicked = __bind(this.onCopyClicked, this), this.onAddAccount = __bind(this.onAddAccount, this), this.onPasswordEntered = __bind(this.onPasswordEntered, this), this.onFailSync = __bind(this.onFailSync, this), this.notOpeningAppFirstTime = __bind(this.notOpeningAppFirstTime, this), this.updateAssets = __bind(this.updateAssets, this), this.performSyncs = __bind(this.performSyncs, this), this.show = __bind(this.show, this), this.registerViewListeners = __bind(this.registerViewListeners, this);
			var self;
			self = this, this.tokensView = new TokensView, this.tokensView.cachingEnabled = !0, this.registerViewListeners(), this.appManager = AppManager.get(), this.appManager.addListener(function(options) {
				return self.onAppsChanged(options)
			}), this.assetManager = AssetManager.get(), this.syncHelper = new SyncHelper, this.authyTimer = new AuthyTimer({
				updateTokensCb: this.tokensView.updateAuthyTokens,
				updateTimerCb: this.tokensView.updateAuthyTimer
			}), this.googleAuthTimer = new GoogleAuthTimer({
				updateTokensCb: this.tokensView.updateGoogleAuthTokens,
				updateTimerCb: this.tokensView.updateGoogleAuthTimer
			}), this.performSyncsRateLimited = $.debounce(TokensController.SYNC_PERIOD, !0, this.performSyncs)
		}
		return __extends(TokensController, _super), TokensController.SYNC_PERIOD = 3e4, TokensController.MAX_SYNC_RETRIES = 3, TokensController.SYNC_RETRY_DELAY = 2e3, TokensController.prototype.registerViewListeners = function() {
			var self;
			return self = this, this.tokensView.onAddAccount = function() {
				return self.onAddAccount()
			}, this.tokensView.onTokenClick = function(tokenId) {
				return self.onTokenClick(tokenId)
			}, this.tokensView.onPasswordEntered = self.onPasswordEntered, this.tokensView.onCopyClicked = this.onCopyClicked
		}, TokensController.prototype.show = function() {
			var self;
			this.setSize({
				width: 320,
				height: 590
			}), self = this, this.googleAuthTimer.startTimer(), this.authyTimer.startTimer(), this.tokensView.invalidateCache(), this.assetCallCount = 0, this.notOpeningAppFirstTime() && this.onAppsChanged(), this.performSyncsRateLimited(), this.appManager.removeAppsMarkedForDeletion(), AuthyRSAKey.downloadPrivateKey()
		}, TokensController.prototype.performSyncs = function() {
			var self, sync;
			return self = this, this.retryAttempts = 0, sync = function() {
				return self.syncHelper.sync(), self.appManager.syncApps({
					onSuccess: self.updateAssets,
					onFail: self.onFailSync
				})
			}, this.notOpeningAppFirstTime() ? sync() : this.appManager.loadLocal(function() {
				return sync()
			})
		}, TokensController.prototype.updateAssets = function() {
			var allAuthyAssetsPresent, authyAppsAssetGroups, authyAppsServerIds, self;
			self = this, 0 === this.assetCallCount && (this.assetCallCount++, authyAppsAssetGroups = this.appManager.getAuthyAppAssetGroups(), allAuthyAssetsPresent = this.assetManager.allAccountsIncluded(authyAppsAssetGroups),
				authyAppsServerIds = this.appManager.getAuthyAppServerIds(), this.assetManager.downloadAssets(authyAppsServerIds, function(assetsChanged) {
					var shouldInvalidateCache;
					return shouldInvalidateCache = !allAuthyAssetsPresent || assetsChanged, shouldInvalidateCache && self.tokensView.invalidateCache(), self.appManager.notifyListeners()
				}))
		}, TokensController.prototype.notOpeningAppFirstTime = function(options) {
			var cameFromAccountReadyController, cameFromUnblockController, lastController, tokensIsNotFirstController;
			return null == options && (options = {}), lastController = void 0 === options.lastController ? Controller.RENDERED_BEFORE : options.lastController, tokensIsNotFirstController = null != lastController, cameFromAccountReadyController = "AccountReadyController" === lastController, cameFromUnblockController = "UnblockController" === lastController, tokensIsNotFirstController && !cameFromAccountReadyController && !cameFromUnblockController
		}, TokensController.prototype.onFailSync = function() {
			var retrySync, self;
			return self = this, this.appManager = AppManager.get(), retrySync = function() {
				return setTimeout(function() {
					return self.appManager.syncApps({
						onSuccess: self.updateAssets,
						onFail: self.onFailSync
					})
				}, TokensController.SYNC_RETRY_DELAY)
			}, this.retryAttempts <= TokensController.MAX_SYNC_RETRIES ? (this.retryAttempts++, 1 === this.retryAttempts && this.onAppsChanged(), retrySync()) : 0 === this.appManager.size() ? Dialog.error(Dialog.LIGHT, "Could not sync your accounts. Please check your internet connection and try again later.") : void 0
		}, TokensController.prototype.onTokenClick = function(tokenId) {
			var app;
			return app = this.appManager.find(tokenId), null != app ? this.tokensView.setSelectedApp(app) : void 0
		}, TokensController.prototype.onPasswordEntered = function(password, clickedId) {
			var dialog, self;
			return self = this, dialog = Dialog.progress(Dialog.LIGHT, "Verifying your password", function() {
				return self.appManager.decryptApps(password, function() {
					return Dialog.close(dialog), BackupsPasswordModel.setPassword(password), Dialog.simple(Dialog.LIGHT, "Successfuly decrypted all apps"), self.appManager.isAnyPasswordTimestampNull() && (self.appManager.updateAuthenticatorAppsPasswordTimestamp(DateHelper.getTimestampSeconds()), self.appManager.uploadAuthenticatorApps()), BackupsPasswordModel.get().notifyListeners({
						enabled: !0
					}), self.tokensView.invalidateCache(), self.appManager.saveAndNotifyListeners()
				}, function() {
					return Dialog.close(dialog), Dialog.error(Dialog.LIGHT, "Incorrect password", "Error!", function() {
						return self.tokensView.resetPasswordInputFor(clickedId)
					})
				})
			})
		}, TokensController.prototype.onAppsChanged = function(options) {
			var apps, cb, invalidateCache, self;
			return null == options && (options = {}), self = this, cb = options.cb || function() {}, invalidateCache = options.invalidateCache || !1, invalidateCache && this.tokensView.invalidateCache(), apps = this.appManager.getNotMarkedForDeletionApps(), this.render({
				apps: apps
			}, function() {
				return self.tokensView.cachingEnabled = !0, cb()
			})
		}, TokensController.prototype.getView = function() {
			return this.tokensView
		}, TokensController.prototype.onAddAccount = function() {
			return Router.get().goTo("SettingsController", {
				innerView: "CreateAuthenticatorAccountController",
				selectedTab: SettingsView.EXTERNAL_ACCOUNTS_TAB
			})
		}, TokensController.prototype.onCopyClicked = function(otpElementSelector) {
			return UIHelper.copyTextToClipboard(otpElementSelector)
		}, TokensController
	}(Controller)
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("controllers/unblock_controller", ["controllers/a_controller", "ui/unblock_view", "models/storage/encryption_key", "ui/router", "ui/widgets/dialog", "models/apps/master_token", "exceptions/exception", "helpers/app_helper", "models/assets/asset_manager"], function(Controller, UnblockView, EncryptionKey, Router, Dialog, MasterToken, Exception, AppHelper, AssetManager) {
	var UnblockController;
	return UnblockController = function(_super) {
		function UnblockController() {
			var self;
			self = this, this.unblockView = new UnblockView, this.unblockView.onEnterPassword = function(password) {
				return self.onPasswordEntered(password)
			}
		}
		return __extends(UnblockController, _super), UnblockController.prototype.show = function(params) {
			return this.setSize({
				width: 320,
				height: 590
			}), this.unblockView.render(params)
		}, UnblockController.prototype.onPasswordEntered = function(password) {
			var dialog, self;
			return self = this, dialog = Dialog.progress(Dialog.LIGHT, "Verifying password", function() {
				return EncryptionKey.verifyPassword(password, !1, function(isCorrect) {
					return isCorrect ? MasterToken.load(function(result) {
						if (null != result) return AssetManager.get().whenManifestDownloaded(function() {
							return Dialog.close(dialog), AppHelper.addCloseAppEventListener(), Router.get().goTo("TokensController")
						});
						throw Dialog.close(dialog), new Exception("Error loading Master Token after user entered Master Password correctly")
					}) : (Dialog.close(dialog), self.unblockView.addInvalidPassword("Wrong password. Please try again."))
				})
			})
		}, UnblockController
	}(Controller)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("controllers/update_auth_app_controller", ["controllers/a_controller", "ui/update_auth_app_view", "models/assets/authenticator_config", "ui/widgets/dialog", "models/apps/app_manager"], function(Controller, UpdateAuthAppView, AuthenticatorConfig, Dialog, AppManager) {
	var UpdateAuthAppController;
	return UpdateAuthAppController = function(_super) {
		function UpdateAuthAppController() {
			this.onBackClicked = __bind(this.onBackClicked, this), this.updateAuthApp = __bind(this.updateAuthApp, this), this.onDoneClicked = __bind(this.onDoneClicked, this);
			var self;
			self = this, this.appManager = AppManager.get(), this.updateAuthAppView = new UpdateAuthAppView, this.updateAuthAppView.onAccountClicked = function() {
				return self.onAccountClicked()
			}, this.updateAuthAppView.onDoneClicked = function(accountName, appName) {
				return self.onDoneClicked(accountName, appName)
			}, this.updateAuthAppView.onBackClicked = function() {
				return self.onBackClicked()
			}
		}
		return __extends(UpdateAuthAppController, _super), UpdateAuthAppController.prototype.show = function(params) {
			var accounts, app, authenticatorConfig, renderOptions, subtitle;
			return this.verifyParams(params, ["newAccount"]), this.newAccount = params.newAccount, authenticatorConfig = AuthenticatorConfig.get(), accounts = authenticatorConfig.getAccountTypes(), subtitle = this.newAccount ? "Your account has been added. Now select a logo for this account." : "Wrong logo? Select the correct one for this account.", renderOptions = {
				accounts: accounts,
				title: "Select a Logo",
				subtitle: subtitle,
				newAccount: this.newAccount,
				titleize: function() {
					return function(text, render) {
						return _.str.titleize(_.str.humanize(render(text)))
					}
				}
			}, this.newAccount ? (this.verifyParams(params, ["secret"]), this.secret = params.secret) : (this.verifyParams(params, ["appId"]), this.appId = params.appId, app = this.appManager.find(this.appId), renderOptions.currentName = app.name, renderOptions.currentLogo = app.getMenuImage(), renderOptions.currentLogoName = _.str.titleize(app.accountType), renderOptions.currentAccount = app.accountType), this.updateAuthAppView.render(renderOptions)
		}, UpdateAuthAppController.prototype.onAccountClicked = function(accountName) {}, UpdateAuthAppController.prototype.onDoneClicked = function(accountName, appName) {
			var dialog, self;
			return self = this, null == accountName ? Dialog.error(Dialog.LIGHT, "You must select an account to proceed") : null == appName || appName.length < 2 ? Dialog.error(Dialog.LIGHT, "You must write a name for your app") : this.newAccount ? dialog = Dialog.progress(Dialog.LIGHT, "Creating account", function() {
				var id;
				return id = self.appManager.createAuthenticatorApp(self.secret), self.updateAuthApp(id, appName, accountName), Dialog.close(dialog), Dialog.simple(Dialog.LIGHT, "Your account has been created"), self.goTo("ExternalAccountsController")
			}) : (this.updateAuthApp(this.appId, appName, accountName), self.goTo("ExternalAccountsController"))
		}, UpdateAuthAppController.prototype.updateAuthApp = function(appId, appName, accountName) {
			var app;
			return app = this.appManager.find(appId), app.setName(appName), app.setAccountType(accountName), this.appManager.save(), this.appManager.uploadAuthenticatorApp(app)
		}, UpdateAuthAppController.prototype.onBackClicked = function() {
			return this.newAccount ? this.goTo("CreateAuthenticatorAccountController") : (this.updateAuthAppView.hideNavButtons(), this.goTo("ExternalAccountsController"))
		}, UpdateAuthAppController
	}(Controller)
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("controllers/update_backups_password_controller", ["controllers/a_controller", "ui/update_backups_password_view", "ui/router", "ui/widgets/dialog", "helpers/window_helper", "models/apps/backups_password_model", "helpers/crypto_helper"], function(Controller, UpdateBackupsPasswordView, Router, Dialog, WindowHelper, BackupsPasswordModel, CryptoHelper) {
	var UpdateBackupsPasswordController;
	return UpdateBackupsPasswordController = function(_super) {
		function UpdateBackupsPasswordController() {
			var self;
			self = this, this.updateBackupsPasswordView = new UpdateBackupsPasswordView, this.updateBackupsPasswordView.onEnterPassword = function(password) {
				return self.onPasswordEntered(password)
			}
		}
		return __extends(UpdateBackupsPasswordController, _super), UpdateBackupsPasswordController.prototype.show = function(params) {
			return WindowHelper.setSize(WindowHelper.TOKENS_SECTION_SIZE), this.verifyParams(params, ["timestamp", "encryptedSeed", "salt"]), this.timestamp = params.timestamp, this.encryptedSeed = params.encryptedSeed, this.salt = params.salt, this.updateBackupsPasswordView.render(params)
		}, UpdateBackupsPasswordController.prototype.onPasswordEntered = function(password) {
			var dialog, self;
			return self = this, dialog = Dialog.progress(Dialog.LIGHT, "Verifying password", function() {
				var decryptedSeed;
				return decryptedSeed = CryptoHelper.decryptAES(self.salt, password, self.encryptedSeed), null != decryptedSeed ? (Dialog.close(dialog), Dialog.simple(Dialog.LIGHT, "The backups password you entered is correct and has been saved.", function() {
					return dialog = Dialog.progress(Dialog.LIGHT, "Re-encrypting accounts.", function() {
						return BackupsPasswordModel.changePassword(password, {
							timestamp: self.timestamp,
							cb: function() {
								return Dialog.close(dialog), Router.get().goTo("TokensController")
							}
						})
					})
				})) : (Dialog.close(dialog), self.updateBackupsPasswordView.addInvalidPassword("Incorrect Password"))
			})
		}, UpdateBackupsPasswordController
	}(Controller)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("controllers/waiting_for_confirmation_controller", ["controllers/a_controller", "ui/registration_view", "models/api/registration_api", "ui/router", "ui/widgets/dialog", "helpers/log"], function(Controller, RegistrationView, RegistrationApi, Router, Dialog, Log) {
	var WaitingForConfirmationController;
	return WaitingForConfirmationController = function(_super) {
		function WaitingForConfirmationController(options) {
			null == options && (options = {}), this.onRegisterSuccess = __bind(this.onRegisterSuccess, this), this.onDeviceAccepted = __bind(this.onDeviceAccepted, this), this.processPollingRequest = __bind(this.processPollingRequest, this), this.startPollingForConfirmation = __bind(this.startPollingForConfirmation, this), this.registrationView = options.registrationView || RegistrationView.get(), this.regApi = options.regApi || new RegistrationApi
		}
		return __extends(WaitingForConfirmationController, _super), WaitingForConfirmationController.prototype.show = function(params) {
			return this.verifyParams(params, ["signature", "requestId", "userId", "selectAuthTypeDate"]), this.selectAuthTypeDate = params.selectAuthTypeDate, this.signature = params.signature, this.startPollingForConfirmation(params.requestId, params.userId)
		}, WaitingForConfirmationController.prototype.startPollingForConfirmation = function(requestId, userId) {
			var self;
			return self = this, this.regApi.getNewDeviceRequestStatus(userId, requestId, this.signature, function(status, pin) {
				return self.processPollingRequest(status, pin, requestId, userId)
			}, function(error) {
				return Log.e(error.message), self.registrationView.showFailDialog("An error occurred, please try again", "Registration Error", function() {
					return self.registrationView.goToPhoneSection()
				})
			})
		}, WaitingForConfirmationController.prototype.processPollingRequest = function(status, pin, requestId, userId) {
			var self;
			return self = this, "pending" === status ? setTimeout(function() {
				return self.startPollingForConfirmation(requestId, userId)
			}, 2e3) : "rejected" === status ? this.registrationView.showFailDialog("Your device has been rejected.", "Device Rejected", function() {
				return self.registrationView.goToPhoneSection()
			}) : "accepted" === status ? this.onDeviceAccepted({
				registrationPin: pin,
				userId: userId
			}) : void 0
		}, WaitingForConfirmationController.prototype.onDeviceAccepted = function(params) {
			var self;
			return self = this, this.regApi.registerNewDevice(params.userId, params.registrationPin, this.onRegisterSuccess, function() {
				return self.registrationView.showFailDialog("There was an error while attempting to register this device.", "Registration error", function() {
					return self.registrationView.goToPhoneSection()
				})
			})
		}, WaitingForConfirmationController.prototype.onRegisterSuccess = function(userId, deviceId, secretSeed) {
			var self;
			return self = this, Router.get().goTo("AccountReadyController", {
				userId: userId,
				deviceId: deviceId,
				secretSeed: secretSeed,
				selectAuthTypeDate: self.selectAuthTypeDate
			})
		}, WaitingForConfirmationController
	}(Controller)
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("exceptions/encrypted_key_not_loaded_exception", ["exceptions/exception"], function(Exception) {
	var EncryptedKeyNotLoadedException, _ref;
	return EncryptedKeyNotLoadedException = function(_super) {
		function EncryptedKeyNotLoadedException() {
			return _ref = EncryptedKeyNotLoadedException.__super__.constructor.apply(this, arguments)
		}
		return __extends(EncryptedKeyNotLoadedException, _super), EncryptedKeyNotLoadedException
	}(Exception)
}), define("exceptions/exception", [], function() {
	var Exception;
	return Exception = function() {
		function Exception(message) {
			this.message = message
		}
		return Exception.prototype.toString = function() {
			return "" + this.constructor.name + ": " + this.message
		}, Exception
	}()
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("exceptions/missing_param_exception", ["exceptions/exception"], function(Exception) {
	var MissingParamException, _ref;
	return MissingParamException = function(_super) {
		function MissingParamException() {
			return _ref = MissingParamException.__super__.constructor.apply(this, arguments)
		}
		return __extends(MissingParamException, _super), MissingParamException
	}(Exception)
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("exceptions/unimplemented_method_exception", ["exceptions/exception"], function(Exception) {
	var UnimplementedMethodException, _ref;
	return UnimplementedMethodException = function(_super) {
		function UnimplementedMethodException() {
			return _ref = UnimplementedMethodException.__super__.constructor.apply(this, arguments)
		}
		return __extends(UnimplementedMethodException, _super), UnimplementedMethodException
	}(Exception)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("helpers/app_helper", ["ui/router", "helpers/log", "models/storage/encryption_key"], function(Router, Log, EncryptionKey) {
	var AppHelper;
	return AppHelper = function() {
		function AppHelper() {}
		var CloseAppPubSubHelper, instance;
		return AppHelper.IDLE_DETECTION_SECONDS = 300, AppHelper.LOCKING = !1, AppHelper.LOCKED = !0, instance = null, CloseAppPubSubHelper = function() {
			function CloseAppPubSubHelper(closeAppEventSubscribers) {
				this.closeAppEventSubscribers = null != closeAppEventSubscribers ? closeAppEventSubscribers : [], this.cleanUpEncryptionKey = __bind(this.cleanUpEncryptionKey, this), this.notifySusbscribers = __bind(this.notifySusbscribers, this)
			}
			return CloseAppPubSubHelper.prototype.addSubscriber = function(subscriber) {
				return this.closeAppEventSubscribers.push(subscriber)
			}, CloseAppPubSubHelper.prototype.clearSusbscribers = function() {
				return this.closeAppEventSubscribers = []
			}, CloseAppPubSubHelper.prototype.notifySusbscribers = function(cb) {
				var doLoop, self;
				return self = this, (doLoop = function(index) {
					var subscriber;
					if (index < self.closeAppEventSubscribers.length) {
						if (subscriber = self.closeAppEventSubscribers[index], 0 === subscriber.constructor.name.indexOf("EncryptionKey")) throw new Error("EncryptionKey should not subscribe as a listener. It must be destroyed last");
						if ("function" == typeof subscriber.cleanUpBeforeClose) return subscriber.cleanUpBeforeClose(function() {
							return doLoop(index + 1)
						});
						throw new Error("The subscriber " + subscriber.constructor.name + " must implement the method cleanUpBeforeClose")
					}
					return cb()
				})(0)
			}, CloseAppPubSubHelper.prototype.cleanUpEncryptionKey = function(cb) {
				if ("function" == typeof EncryptionKey.get().cleanUpBeforeClose) return EncryptionKey.get().cleanUpBeforeClose(cb);
				throw new Error("The EncryptionKey must implement the method cleanUpBeforeClose")
			}, CloseAppPubSubHelper
		}(), AppHelper.truncate = function(params) {
			var regex;
			return regex = new RegExp("(.{" + params.length + "})(.+)", "i"), params.name.replace(regex, "$1...")
		}, AppHelper.closeApp = function() {
			AppHelper.LOCKING = !0, AppHelper.getPubSubInstance().notifySusbscribers(function() {
				return AppHelper.getPubSubInstance().cleanUpEncryptionKey(function() {
					return AppHelper.removeCloseAppEventListener(), Router.get().goTo("UnblockController"), AppHelper.LOCKING = !1
				})
			})
		}, AppHelper.addCloseAppEventListener = function() {
			return chrome.idle.onStateChanged.hasListeners() ? Log.d("Did not add close app event listener. A listener already exists.") : (chrome.idle.setDetectionInterval(AppHelper.IDLE_DETECTION_SECONDS), chrome.idle.onStateChanged.addListener(AppHelper.onCloseAppEvent), Log.d("Added close app event listener")), AppHelper.LOCKED = !1
		}, AppHelper.removeCloseAppEventListener = function() {
			return chrome.idle.onStateChanged.removeListener(AppHelper.onCloseAppEvent), Log.d("Removed close app event listener"), AppHelper.LOCKED = !0
		}, AppHelper.onCloseAppEvent = function(newState) {
			return Log.d("Entered a new state " + newState), "idle" !== newState && "locked" !== newState || AppHelper.LOCKING || AppHelper.LOCKED ? void 0 : AppHelper.closeApp()
		}, AppHelper.subscribeToCloseAppEvent = function(subscriber) {
			return AppHelper.getPubSubInstance().addSubscriber(subscriber)
		}, AppHelper.getPubSubInstance = function() {
			return null == instance && (instance = new CloseAppPubSubHelper), instance
		}, AppHelper
	}.call(this)
}), define("helpers/async_helper", [], function() {
	var AsyncHelper;
	return AsyncHelper = function() {
		function AsyncHelper() {}
		return AsyncHelper.run = function(options) {
			var callback, callbackCalled, defVal, lambda, onTimeout, timeout;
			return null == options && (options = {}), lambda = options.lambda, callback = options.callback, defVal = options.defVal, timeout = options.timeout || 1e3, callbackCalled = !1, onTimeout = function() {
				return callbackCalled || callback(defVal), callbackCalled = !0
			}, window.setTimeout(onTimeout, timeout), lambda(function(response) {
				return callbackCalled || callback(response), callbackCalled = !0
			})
		}, AsyncHelper
	}()
}), define("helpers/cellphone_helper", [], function() {
	var CellphoneHelper;
	return CellphoneHelper = function() {
		function CellphoneHelper() {}
		return CellphoneHelper.validateCountryCode = function(countryCode) {
			var isnum;
			return isnum = /^\d+$/.test(countryCode), countryCode.length > 0 && isnum
		}, CellphoneHelper.validatePhoneNumber = function(phone) {
			var regex1, regex2, regex3, regexMatch;
			return regex1 = /[0-9]{1,4}/, regex2 = /[0-9]{1,3}-[0-9]{4}/, regex3 = /[0-9]{1,3}(-[0-9]{3}){1,}-[0-9]{4}/, regexMatch = regex1.test(phone) || regex2.test(phone) || regex3.test(phone), phone.length >= 6 && regexMatch
		}, CellphoneHelper.isValid = function(params) {
			var countryCode, phoneNumber, validCode, validPhone;
			return countryCode = params.countryCode, phoneNumber = params.phoneNumber, validCode = CellphoneHelper.validateCountryCode(countryCode), validPhone = CellphoneHelper.validatePhoneNumber(phoneNumber), validCode && validPhone
		}, CellphoneHelper.formatAsPhone = function(field) {
			return field.keyup(function(e) {
				var currentDig, i, length, newValue, value;
				if (!(8 === e.keyCode || e.keyCode > 47 && e.keyCode < 58 || e.keyCode < 106 && e.keyCode > 95)) return this.value = this.value.replace(/[^\-0-9]/g, "");
				if (newValue = "", value = this.value.replace(/-/g, ""), length = value.length, length > 4) {
					for (i = length - 1; i >= 0;) currentDig = value.charAt(i), i > length - 5 ? newValue = currentDig.concat(newValue) : i === length - 4 ? (newValue = "-".concat(newValue), newValue = currentDig.concat(newValue)) : ((newValue.length - 4) % 4 === 0 && (newValue = "-".concat(newValue)), newValue = currentDig.concat(newValue)), i--;
					return this.value = newValue
				}
			})
		}, CellphoneHelper
	}()
}), define("helpers/crypto_helper", ["/js/vendor/forge.js"], function(forge) {
	var CryptoHelper;
	return CryptoHelper = function() {
		function CryptoHelper() {}
		return CryptoHelper.PBKDF2_PARAMS = {
			keySize: 8,
			iterations: 1e3
		}, CryptoHelper.IV = forge.util.decodeUtf8("\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"), CryptoHelper.encryptAES = function(saltValue, password, plainText) {
			var pbkdf2Key;
			return pbkdf2Key = this.generatePBKDF2Key(password, saltValue, {
				iterations: 1e3,
				keySize: 256,
				decodeSalt: !1
			}), this.encryptAESWithKey(pbkdf2Key, plainText)
		}, CryptoHelper.decryptAES = function(saltValue, password, cryptoText) {
			var pbkdf2Key;
			return pbkdf2Key = this.generatePBKDF2Key(password, saltValue, {
				iterations: 1e3,
				keySize: 256,
				decodeSalt: !1
			}), this.decryptAESWithKey(pbkdf2Key, cryptoText)
		}, CryptoHelper.encryptAESWithKey = function(pbkdf2Key, plaintext) {
			var cipher, key;
			return key = forge.util.createBuffer(pbkdf2Key), cipher = forge.aes.createEncryptionCipher(key, "CBC"), cipher.start(forge.util.createBuffer(CryptoHelper.IV)), cipher.update(forge.util.createBuffer(plaintext)), cipher.finish() ? forge.util.encode64(cipher.output.data) : null
		}, CryptoHelper.decryptAESWithKey = function(pbkdf2Key, cyphertext) {
			var decipher, decodedCypherText, key;
			return key = forge.util.createBuffer(pbkdf2Key), decipher = forge.aes.createDecryptionCipher(key, "CBC"), decipher.start(forge.util.createBuffer(CryptoHelper.IV)), decodedCypherText = forge.util.createBuffer(forge.util.decode64(cyphertext)), decipher.update(decodedCypherText), decipher.finish() ? decipher.output.data : null
		}, CryptoHelper.generatePBKDF2Key = function(password, salt, options) {
			var iterations, keySize, pbkdf2Key;
			if (null == options && (options = {}), "string" != typeof salt) throw {
				name: "Illegal Argument",
				message: "salt must be a string"
			};
			return iterations = options.iterations || 1e3, keySize = (options.keySize || 256) / 8, null === options.decodeSalt && (options.decodeSalt = !0), options.decodeSalt === !0 && (salt = forge.util.hexToBytes(salt)), pbkdf2Key = forge.pkcs5.pbkdf2(password, salt, iterations, keySize)
		}, CryptoHelper.generateSHA256 = function(message) {
			var md;
			if ("string" != typeof message) throw new Error("Message must be a string");
			return md = forge.md.sha256.create(), md.update(message), md.digest().toHex()
		}, CryptoHelper.generateSalt = function(bits) {
			var salt;
			return null == bits && (bits = 256), salt = forge.random.getBytesSync(bits / 8), forge.util.createBuffer(salt).toHex()
		}, CryptoHelper.generateHmacSHA1 = function(message, secret) {
			var hmac;
			return hmac = forge.hmac.create(), hmac.start("sha1", secret), hmac.update(message), hmac.digest().toHex()
		}, CryptoHelper.toHex = function(data) {
			return forge.util.createBuffer(data).toHex()
		}, CryptoHelper.fromHex = function(hexString) {
			return forge.util.hexToBytes(hexString)
		}, CryptoHelper
	}()
}), define("helpers/date_helper", [], function() {
	var DateHelper;
	return DateHelper = function() {
		function DateHelper() {}
		return DateHelper.getDateFromString = function(dateString) {
			return new Date(Date.parse(dateString))
		}, DateHelper.getDateStringPrettyFormat = function(dateString) {
			return DateHelper.getDatePrettyFormat(DateHelper.getDateFromString(dateString))
		}, DateHelper.getDatePrettyFormat = function(date, now) {
			var dateStr, day, hours, mins;
			return null == now && (now = new Date), day = "", DateHelper.isDateToday(date, now) ? day = "Today" : DateHelper.isDateYesterday(date, now) ? day = "Yesterday" : (dateStr = date.toDateString(), day = dateStr.substring(dateStr.length - 11)), hours = 1 === ("" + date.getHours()).length ? "0" + date.getHours() : "" + date.getHours(), mins = 1 === ("" + date.getMinutes()).length ? "0" + date.getMinutes() : "" + date.getMinutes(), "" + day + " at " + hours + ":" + mins
		}, DateHelper.isDateToday = function(date, now) {
			return null == now && (now = new Date), DateHelper.areSameDay(now, date) ? !0 : !1
		}, DateHelper.isDateYesterday = function(date, now) {
			var yesterday;
			return null == now && (now = new Date), yesterday = new Date(now.getTime()), yesterday.setDate(now.getDate() - 1), DateHelper.areSameDay(yesterday, date) ? !0 : !1
		}, DateHelper.areSameDay = function(date1, date2) {
			return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getYear() === date2.getYear() ? !0 : !1
		}, DateHelper.getTimestampSeconds = function(options) {
			var date;
			return null == options && (options = {}), date = options.date || new Date, Math.floor(date.getTime() / 1e3)
		}, DateHelper.getCurrentDateObject = function() {
			return new Date
		}, DateHelper
	}()
}), define("helpers/email_helper", [], function() {
	var EmailHelper;
	return EmailHelper = function() {
		function EmailHelper() {}
		return EmailHelper.isValid = function(email) {
			var re;
			return email ? (re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, re.test(email)) : !1
		}, EmailHelper
	}()
}), define("helpers/encoder", [], function() {
	var Encoder;
	return Encoder = function() {
		function Encoder() {}
		var binarySize, chunkSize, hexPadding;
		return hexPadding = 2, chunkSize = 8, binarySize = 5, Encoder.base32tohex = function(base32) {
			var chunks, decodedChunks, i;
			for (base32 = base32.replace(/\W/g, ""), chunks = Encoder.chunk(base32, chunkSize), decodedChunks = "", i = 0; i < chunks.length;) decodedChunks += Encoder.decode(chunks[i]).join(""), i++;
			return decodedChunks
		}, Encoder.decode = function(base32) {
			var base32chars, c, cValue, chars, decoded, hex, i, n, p;
			for (base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567", n = Math.floor(base32.length * binarySize / chunkSize), p = 0, base32.length < chunkSize && (p = binarySize - n * chunkSize % binarySize), c = 0, c = base32.split("").reduce(function(previousValue, currentValue, currentIndex, array) {
				var index, pValue;
				return pValue = Encoder.lShift(previousValue, binarySize), index = base32chars.indexOf(currentValue.toUpperCase()), pValue + index
			}, 0), c = Encoder.rShift(c, p), decoded = [], i = n - 1; i >= 0;) cValue = Encoder.rShift(c, i * chunkSize), chars = 255 & cValue, hex = Encoder.lpad(chars.toString(16), "0", hexPadding), decoded.push(hex), i--;
			return decoded
		}, Encoder.lpad = function(str, padString, length) {
			for (; str.length < length;) str = padString + str;
			return str
		}, Encoder.lShift = function(number, bits) {
			return number * Math.pow(2, bits)
		}, Encoder.rShift = function(number, bits) {
			return Math.floor(number / Math.pow(2, bits))
		}, Encoder.chunk = function(text, size) {
			return [].concat.apply([], text.split("").map(function(x, i) {
				return i % size ? [] : text.slice(i, i + size)
			}, text))
		}, Encoder.leftpad = function(str, len, pad) {
			return len + 1 >= str.length && (str = Array(len + 1 - str.length).join(pad) + str), str
		}, Encoder.isBase32 = function(str) {
			var match, strNormalized;
			return null == str ? !1 : (strNormalized = str.replace(/-|\s/g, ""), match = strNormalized.match(/^[a-zA-Z2-7]+=*$/), null !== match && 1 === match.length)
		}, Encoder
	}()
}), define("helpers/encoding_helper", ["helpers/encoder"], function(Encoder) {
	var EncodingHelper;
	return EncodingHelper = function() {
		function EncodingHelper() {}
		return EncodingHelper.clean = function(dirtyString) {
			return dirtyString.split(" ").join("").toUpperCase()
		}, EncodingHelper.isValid = function(secret) {
			return null == secret ? !1 : secret.length > 0 ? secret !== secret.toUpperCase() ? !1 : EncodingHelper.isBase32(EncodingHelper.clean(secret)) ? !0 : !1 : !1
		}, EncodingHelper.isBase32 = function(secret) {
			var bigInt, e, expected, hex;
			hex = Encoder.base32tohex(secret).toUpperCase();
			try {
				for (bigInt = BigInteger.parse(hex, 16), expected = bigInt.toString(16); expected.length < hex.length;) expected = "0" + expected;
				return expected === hex
			} catch (_error) {
				return e = _error, !1
			}
		}, EncodingHelper
	}(), window.EncodingHelper = EncodingHelper
}), define("helpers/hash_set", [], function() {
	var HashSet;
	return HashSet = function() {
		function HashSet() {
			this.elementsIds = {}
		}
		return HashSet.prototype.add = function(obj) {
			return this.elementsIds[obj.id] = obj
		}, HashSet.prototype.clear = function() {
			return this.elementsIds = {}
		}, HashSet.prototype.toArray = function() {
			var key, result, value, _ref;
			result = [], _ref = this.elementsIds;
			for (key in _ref) value = _ref[key], null !== value && result.push(value);
			return result
		}, HashSet.prototype.remove = function(obj) {
			return this.elementsIds[obj.id] = null
		}, HashSet.prototype.removeById = function(id) {
			return this.elementsIds[id] = null
		}, HashSet.prototype.contains = function(obj) {
			return null !== this.elementsIds[obj.id]
		}, HashSet
	}()
}), define("helpers/hotp", ["helpers/log", "helpers/crypto_helper", "/js/vendor/forge.js"], function(Log, CryptoHelper, forge) {
	var HOTP;
	return HOTP = function() {
		function HOTP() {}
		return HOTP.DEBUG = !1, HOTP.hmac = function(hexSecret, hexText) {
			var secret, text;
			return text = forge.util.hexToBytes(hexText), secret = forge.util.hexToBytes(hexSecret), CryptoHelper.generateHmacSHA1(text, secret)
		}, HOTP.hotp = function(key, counter) {
			var hmac, hotp;
			return hmac = HOTP.hmac(key, counter), hotp = HOTP.truncate(hmac), HOTP.DEBUG && (Log.d("Calculating HOTP"), Log.d("secret: " + key + ", counter: " + counter), Log.d("hmac-sha-1: " + hmac), Log.d("truncate result: " + hotp)), hotp
		}, HOTP.truncate = function(hash) {
			var offset, offsetBits, p;
			return offsetBits = hash[39], offset = 2 * parseInt(offsetBits, 16), p = parseInt(hash.substring(offset, offset + 8), 16), 2147483647 & p
		}, HOTP
	}()
}), define("helpers/image_downloader", [], function() {
	var ImageDownloader;
	return ImageDownloader = function() {
		function ImageDownloader() {}
		return ImageDownloader.loadImage = function(uri, callback) {
			var xhr;
			return uri += "?" + $.param({
				r: Math.floor(1001 * Math.random())
			}), xhr = new XMLHttpRequest, xhr.responseType = "blob", xhr.onload = function() {
				return callback(xhr.response, uri, xhr)
			}, xhr.open("GET", uri, !0), xhr.send(), xhr
		}, ImageDownloader.setImage = function(img, uri) {
			return ImageDownloader.loadImage(img, function(blobUri, requestUri) {
				return img.attr("src", blobUri)
			})
		}, ImageDownloader
	}()
}), define("helpers/json_storage", [], function() {
	var JsonStorage;
	return JsonStorage = function() {
		function JsonStorage() {}
		return JsonStorage.save = function(key, object, callback) {
			var hash;
			return null == callback && (callback = function() {}), hash = {}, hash["" + key] = object, JsonStorage.getStorage().set(hash, function() {
				return callback()
			})
		}, JsonStorage.load = function(key, callback) {
			var hash;
			return hash = {}, hash["" + key] = null, JsonStorage.getStorage().get(hash, function(data) {
				return callback(data)
			})
		}, JsonStorage.loadObject = function(key, callback) {
			return JsonStorage.load(key, function(data) {
				return callback(data[key])
			})
		}, JsonStorage.clear = function() {
			JsonStorage.getStorage().clear()
		}, JsonStorage.getStorage = function() {
			return window.chrome.storage.local
		}, JsonStorage
	}()
}), define("helpers/key_codes", [], function() {
	var KeyCodes;
	return KeyCodes = function() {
		function KeyCodes() {}
		return KeyCodes.ENTER = 13, KeyCodes.C = 67, KeyCodes.isEnter = function(e) {
			var key;
			return key = e.keyCode || e.which, key === KeyCodes.ENTER
		}, KeyCodes
	}()
}), define("helpers/locale", [], function() {
	var Locale;
	return Locale = function() {
		function Locale() {}
		var locale;
		return locale = chrome.i18n, Locale.get = function(messageId, val) {
			return null == val && (val = []), locale.getMessage(message_id, val)
		}, Locale
	}()
}), define("helpers/log", ["models/api/constants"], function(Constants) {
	var Log;
	return Log = function() {
		function Log() {}
		return Log.DEBUG_MODE = Constants.DEBUG, Log.DEBUG = "debug", Log.WARNING = "warning", Log.ERROR = "error", Log.bm = function(message, opts) {
			var elapsed, now;
			return null == opts && (opts = {}), this._lastDate && !opts.start ? (now = new Date, elapsed = (now - this._lastDate) / 1e3, this.d("" + message + " " + elapsed + " seconds", "BENCHMARK")) : this.d(message, "BENCHMARK"), this._lastDate = new Date
		}, Log.d = function(message, tag) {
			return this.DEBUG_MODE ? Log.log(Log.DEBUG, tag, message) : void 0
		}, Log.w = function(message, tag) {
			return Log.log(Log.WARNING, tag, message)
		}, Log.e = function(message, tag) {
			return Log.log(Log.ERROR, tag, message)
		}, Log.log = function(level, tag, message) {
			return tag || (tag = ""), "object" == typeof message && (message = JSON.stringify(message)), level === Log.DEBUG ? console.debug("" + tag + " " + message) : level === Log.WARNING ? console.warn("[" + Log.WARNING + "] " + tag + " => " + message) : level === Log.ERROR ? console.error("[" + Log.ERROR + "] " + tag + " => " + message) : void 0
		}, Log
	}()
}), define("helpers/notification_helper", [], function() {
	var NotificationHelper;
	return NotificationHelper = function() {
		function NotificationHelper() {}
		return NotificationHelper.LEARN_MORE = "https://authy.com/learn-more#phishing", NotificationHelper.phishing = function(options) {
			var appName, create, createListener, id, logo, notifications, onButtonClicked, opt;
			return null == options && (options = {}), notifications = options.notification || chrome.notifications, create = options.create || notifications.create, logo = options.logo || "img/logos/icon48.png", createListener = options.createListener || function() {}, appName = options.appName, onButtonClicked = options.onButtonClicked || function(notificationId, buttonIndex) {
				return $('<a target="_blank" href="' + NotificationHelper.LEARN_MORE + '"></a>')[0].click()
			}, opt = {
				type: "basic",
				title: "Phishing Alert",
				message: "You're attempting to use a " + appName + " token but " + appName + " is not open.",
				iconUrl: logo,
				buttons: [{
					title: "Learn more about phishing."
				}]
			}, id = "phishing-" + (new Date).getTime(), notifications.onButtonClicked.hasListeners() || notifications.onButtonClicked.addListener(onButtonClicked), create(id, opt, createListener), id
		}, NotificationHelper
	}()
}), define("helpers/password_score", [], function() {
	var PasswordScore;
	return PasswordScore = function() {
		function PasswordScore() {}
		return PasswordScore.VERY_WEAK = {
			minScore: 0,
			label: "Very Weak"
		}, PasswordScore.WEAK = {
			minScore: 21,
			label: "Weak"
		}, PasswordScore.GOOD = {
			minScore: 31,
			label: "Good"
		}, PasswordScore.STRONG = {
			minScore: 41,
			label: "Strong"
		}, PasswordScore.VERY_STRONG = {
			minScore: 51,
			label: "Very Strong"
		}, PasswordScore.score = function(pass) {
			var i, key, letters, s, score, value, variation, variationCount, variationScore, variations, _i, _ref, _ref1;
			if (score = 0, !pass) return score;
			if (pass.length < 6) return 1;
			for (letters = {}, i = _i = 0, _ref = pass.length; _ref >= 0 ? _ref >= _i : _i >= _ref; i = _ref >= 0 ? ++_i : --_i) letters[pass[i]] = (letters[pass[i]] || 0) + 1;
			letters[void 0] = null;
			for (key in letters) value = letters[key], s = 0, value && "undefined" !== key && (s = parseInt(2 + value / 3)), score += s;
			variations = {
				digits: /\d/.test(pass),
				lower: /[a-z]/.test(pass),
				upper: /[A-Z]/.test(pass),
				nonWords: /\W/.test(pass)
			}, variationCount = 0;
			for (variation in variations) variationCount += null != (_ref1 = variations[variation] === !0) ? _ref1 : {
				1: 0
			};
			return variationScore = 15 * (variationCount - 1), score += variationScore, parseInt(score)
		}, PasswordScore.getName = function(score) {
			return score >= PasswordScore.VERY_STRONG.minScore ? PasswordScore.VERY_STRONG.label : score >= PasswordScore.STRONG.minScore ? PasswordScore.STRONG.label : score >= PasswordScore.GOOD.minScore ? PasswordScore.GOOD.label : score >= PasswordScore.WEAK.minScore ? PasswordScore.WEAK.label : PasswordScore.VERY_WEAK.label
		}, PasswordScore
	}()
}), define("helpers/string_helper", [], function() {
	var StringHelper;
	return StringHelper = function() {
		function StringHelper() {}
		return StringHelper.editDist = function(strA, strB) {
			var deletion, dist, i, insertion, j, sizeA, sizeB, substitution, _j, _k, _l, _m, _results;
			for (sizeA = strA.length, sizeB = strB.length, dist = function() {
				_results = [];
				for (var _i = 0; sizeA >= 0 ? sizeA >= _i : _i >= sizeA; sizeA >= 0 ? _i++ : _i--) _results.push(_i);
				return _results
			}.apply(this).map(function() {
				var _results;
				return function() {
					_results = [];
					for (var _i = 0; sizeB >= 0 ? sizeB >= _i : _i >= sizeB; sizeB >= 0 ? _i++ : _i--) _results.push(_i);
					return _results
				}.apply(this).map(function() {
					return 0
				})
			}), i = _j = 0; sizeA >= 0 ? sizeA >= _j : _j >= sizeA; i = sizeA >= 0 ? ++_j : --_j) dist[i][0] = 1;
			for (j = _k = 0; sizeB >= 0 ? sizeB >= _k : _k >= sizeB; j = sizeB >= 0 ? ++_k : --_k) dist[0][j] = j;
			for (j = _l = 1; sizeB >= 1 ? sizeB >= _l : _l >= sizeB; j = sizeB >= 1 ? ++_l : --_l)
				for (i = _m = 1; sizeA >= 1 ? sizeA >= _m : _m >= sizeA; i = sizeA >= 1 ? ++_m : --_m) strA[i] === strB[j] ? dist[i][j] = dist[i - 1][j - 1] : (deletion = dist[i - 1][j] + 1, insertion = dist[i][j - 1] + 1, substitution = dist[i - 1][j - 1] + 1, dist[i][j] = Math.min(deletion, insertion, substitution));
			return dist[sizeA][sizeB]
		}, StringHelper.areSimilar = function(strA, strB) {
			var editDist, minLength, sizes;
			return editDist = StringHelper.editDist(strA, strB), sizes = [strA, strB].map(function(s) {
				return s.length
			}), minLength = Math.min.apply(null, sizes), minLength / 2 > editDist
		}, StringHelper
	}()
}), define("helpers/totp", ["helpers/hotp", "helpers/date_helper"], function(HOTP, DateHelper) {
	var TOTP;
	return TOTP = function() {
		function TOTP() {}
		return TOTP.DEFAULT_TIME_STEPS = 10, TOTP.OTP_LENGTH = 7, TOTP.MOVING_FACTOR_CORRECTION = 0, TOTP.time = function(unixTime, t0, timeSteps, pad) {
			var timeValue;
			return null == unixTime && (unixTime = this.getUnixTime()), null == t0 && (t0 = 0), null == timeSteps && (timeSteps = TOTP.DEFAULT_TIME_STEPS), null == pad && (pad = !0), timeValue = Math.floor((unixTime - t0) / timeSteps).toString(16), pad && (timeValue = TOTP.padTime(timeValue)), timeValue
		}, TOTP.padTime = function(time, size) {
			for (null == size && (size = 16), time += ""; time.length < size;) time = "0" + time;
			return time
		}, TOTP.totp = function(secret, time, otpLength) {
			var totp;
			return null == otpLength && (otpLength = TOTP.OTP_LENGTH), totp = HOTP.hotp(secret, time).toString(), totp.substring(totp.length - otpLength, totp.length)
		}, TOTP.getUnixTime = function() {
			return DateHelper.getTimestampSeconds() + TOTP.MOVING_FACTOR_CORRECTION
		}, TOTP.getLocalMovingFactor = function() {
			return parseInt(TOTP.time(), 16)
		}, TOTP.setMovingFactorCorrection = function(movingFactorCorrection) {
			return TOTP.MOVING_FACTOR_CORRECTION = movingFactorCorrection
		}, TOTP
	}()
}), define("helpers/ui_helper", ["helpers/key_codes"], function(KeyCodes) {
	var UIHelper;
	return UIHelper = function() {
		function UIHelper() {}
		return UIHelper.selectText = function(elementSelector) {
			var range, selection, textElement;
			textElement = $(elementSelector)[0], selection = window.getSelection(), range = document.createRange(), range.selectNodeContents(textElement), selection.removeAllRanges(), selection.addRange(range)
		}, UIHelper.copyTextToClipboard = function(textElementSelector) {
			return UIHelper.selectText(textElementSelector), document.execCommand("copy"), UIHelper.unselectText()
		}, UIHelper.isOSMac = function() {
			return -1 !== navigator.platform.toLowerCase().indexOf("mac")
		}, UIHelper.unselectText = function() {
			var selection;
			return selection = window.getSelection(), selection.removeAllRanges()
		}, UIHelper
	}()
}), define("helpers/window_helper", [], function() {
	var WindowHelper;
	return WindowHelper = function() {
		function WindowHelper() {}
		return WindowHelper.REGISTRATION_SECTION_SIZE = {
			width: 900,
			height: 600
		}, WindowHelper.TOKENS_SECTION_SIZE = {
			width: 320,
			height: 590
		}, WindowHelper.SETTINGS_SECTION_SIZE = {
			width: 550,
			height: 510
		}, WindowHelper.REGISTRATION_TYPE = "registration", WindowHelper.TOKENS_TYPE = "tokens", WindowHelper.SETTINGS_TYPE = "settings", WindowHelper.closeWindow = function() {
			return WindowHelper.getCurrentWindow().close()
		}, WindowHelper.minimizeWindow = function() {
			return WindowHelper.getCurrentWindow().minimize()
		}, WindowHelper.setSize = function(size) {
			var appWindow;
			return appWindow = WindowHelper.getCurrentWindow(), null != size.x && null != size.y ? appWindow.resizeTo(size.x, size.y) : null != size.width && null != size.height ? (appWindow.outerBounds.minHeight = size.height, appWindow.outerBounds.minWidth = size.width, appWindow.resizeTo(size.width, size.height)) : void 0
		}, WindowHelper.getCurrentWindow = function() {
			return chrome.app.window.current()
		}, WindowHelper.getCurrentWindowSize = function() {
			return WindowHelper.getCurrentWindow().getBounds()
		}, WindowHelper.getCurrentWindowType = function() {
			var currentWidth, type;
			switch (currentWidth = WindowHelper.getCurrentWindowSize().width, type = "", currentWidth) {
				case WindowHelper.REGISTRATION_SECTION_SIZE.width:
					type = WindowHelper.REGISTRATION_TYPE;
					break;
				case WindowHelper.TOKENS_SECTION_SIZE.width:
					type = WindowHelper.TOKENS_TYPE;
					break;
				case WindowHelper.SETTINGS_SECTION_SIZE.width:
					type = WindowHelper.SETTINGS_TYPE;
					break;
				default:
					type = null
			}
			return type
		}, WindowHelper.focus = function() {
			return WindowHelper.getCurrentWindow().focus()
		}, WindowHelper
	}()
}), define("init", ["ui/router", "ui/a_view", "ui/widgets/dialog", "helpers/log", "models/analytics/mixpanel", "models/messaging/chrome_extension", "models/apps/master_token", "models/assets/asset_manager", "models/assets/authenticator_config", "models/storage/encryption_key", "workers/gen_encryption_key_task", "controllers/registration_controller", "controllers/registration_pin_controller", "controllers/waiting_for_confirmation_controller", "controllers/tokens_controller", "controllers/settings_controller", "controllers/external_accounts_controller", "controllers/devices_controller", "controllers/account_controller", "controllers/update_auth_app_controller", "controllers/unblock_controller", "controllers/device_request_controller", "controllers/create_authenticator_account_controller", "controllers/backups_password_controller", "controllers/update_backups_password_controller", "controllers/account_ready_controller", "controllers/change_phone_confirmation_controller"], function(Router, View, Dialog, Log, MixPanel, ChromeExtension, MasterToken, AssetManager, AuthenticatorConfig, EncryptionKey, GenEncryptionKeyTask, RegistrationController, RegistrationPinController, WaitingForConfirmationController, TokensController, SettingsController, ExternalAccountsController, DevicesController, AccountController, UpdateAuthAppController, UnblockController, DeviceRequestController, CreateAuthenticatorAccountController, BackupsPasswordController, UpdateBackupsPasswordController, AccountReadyController, ChangePhoneConfirmationController) {
	var assetManager, nav;
	return nav = Router.get(), nav.register("RegistrationController", new RegistrationController), nav.register("RegistrationPinController", new RegistrationPinController), nav.register("WaitingForConfirmationController", new WaitingForConfirmationController), nav.register("TokensController", new TokensController), nav.register("SettingsController", new SettingsController), nav.register("ExternalAccountsController", new ExternalAccountsController), nav.register("UpdateAuthAppController", new UpdateAuthAppController), nav.register("DevicesController", new DevicesController), nav.register("AccountController", new AccountController), nav.register("UnblockController", new UnblockController), nav.register("DeviceRequestController", new DeviceRequestController), nav.register("CreateAuthenticatorAccountController", new CreateAuthenticatorAccountController), nav.register("BackupsPasswordController", new BackupsPasswordController), nav.register("UpdateBackupsPasswordController", new UpdateBackupsPasswordController), nav.register("AccountReadyController", new AccountReadyController), nav.register("ChangePhoneConfirmationController", new ChangePhoneConfirmationController), MixPanel.init(), ChromeExtension.get(), assetManager = AssetManager.get(), assetManager.downloadAssets([], function() {
		return AuthenticatorConfig.get().downloadAccountTypes()
	}), MasterToken.hasBeenCreated(function(hasBeenCreated) {
		return hasBeenCreated ? EncryptionKey.userHasSetPassword(function(userHasSetPassword) {
			var dialog;
			return View.addCommonParam("hasPassword", userHasSetPassword), userHasSetPassword ? nav.goTo("UnblockController") : dialog = Dialog.progress(Dialog.LIGHT, "Loading account.", function() {
				return Log.bm("Start loading accounts", {
					start: !0
				}), EncryptionKey.verifyPassword(EncryptionKey.DEFAULT_PASSWORD, !0, function(isCorrect) {
					return isCorrect ? (Log.bm("Password Verified"), MasterToken.load(function(result) {
						return Log.bm("MasterToken loaded"), null != result ? assetManager.whenManifestDownloaded(function() {
							return Log.bm("Assets Downloaded"), assetManager.invalidateDownloadedCallback(), Dialog.close(dialog), Log.bm("Finish"), Router.get().goTo("TokensController")
						}) : Log.e("Error loading Master Token with default password")
					})) : Log.e("Error verifying the default password")
				})
			})
		}) : (GenEncryptionKeyTask.get().run(), nav.goTo("RegistrationController"))
	}), window.nav = nav
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("models/analytics/event", ["models/analytics/mixpanel_sender"], function(MixPanelSender) {
	var Event;
	return Event = function() {
		function Event() {
			this.send = __bind(this.send, this), this.toJson = __bind(this.toJson, this)
		}
		return Event.prototype.getName = function() {
			throw new Error("getName is not implemented")
		}, Event.prototype.toJson = function() {
			throw new Error("toJson is not implemented")
		}, Event.prototype.send = function() {
			return MixPanelSender.get().sendEvent(this.getName(), this.toJson())
		}, Event
	}()
}), define("models/analytics/event_sender", [""], function() {
	var EventSender;
	return EventSender = function() {
		function EventSender() {}
		return EventSender.prototype.sendEvent = function(name, data) {
			throw new Error("sendEvent is not implemented")
		}, EventSender
	}()
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("models/analytics/finish_registration_event", ["models/analytics/event"], function(Event) {
	var FinishRegistrationEvent;
	return FinishRegistrationEvent = function(_super) {
		function FinishRegistrationEvent(data) {
			var now;
			now = data.now || new Date, this.time_since_auth_type = now.getTime() - data.selectAuthTypeDate.getTime()
		}
		return __extends(FinishRegistrationEvent, _super), FinishRegistrationEvent.prototype.getName = function() {
			return "finish_registration"
		}, FinishRegistrationEvent.prototype.toJson = function() {
			return JSON.parse(JSON.stringify(this))
		}, FinishRegistrationEvent
	}(Event)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("models/analytics/initialize_registration_event", ["models/analytics/event"], function(Event) {
	var InitializeRegistrationEvent;
	return InitializeRegistrationEvent = function(_super) {
		function InitializeRegistrationEvent(data) {
			this.toJson = __bind(this.toJson, this), this.setUserProperties = __bind(this.setUserProperties, this), this.setData = __bind(this.setData, this), null != data && this.setData(data)
		}
		return __extends(InitializeRegistrationEvent, _super), InitializeRegistrationEvent.prototype.setData = function(data) {
			return this.cellphone = data.cellphone, this.country_code = data.countryCode, this.is_new = data.isNew, this.num_devices = data.deviceCount
		}, InitializeRegistrationEvent.prototype.setUserProperties = function(id, props) {
			return null == props && (props = {}), null == props.last_register_date && (props.last_register_date = new Date), null == props.cellphone && (props.cellphone = this.cellphone), null == props.country_code && (props.country_code = this.country_code), null == props.num_devices && (props.num_devices = this.num_devices), mixpanel.people.set(props), mixpanel.people.increment("registration_count"), mixpanel.identify(id)
		}, InitializeRegistrationEvent.prototype.getName = function() {
			return "init_registration"
		}, InitializeRegistrationEvent.prototype.toJson = function() {
			return {
				cellphone: this.cellphone,
				country_code: this.country_code,
				is_new: this.is_new
			}
		}, InitializeRegistrationEvent
	}(Event)
}), define("models/analytics/mixpanel", ["models/api/constants"], function(Constants) {
	var MixPanel;
	return MixPanel = function() {
		function MixPanel() {}
		return MixPanel.init = function() {
			var b = window.mixpanel = window.mixpanel || [];
			b._i = [], b.init = function(a, e, d) {
				"undefined" != typeof d ? c = b[d] = [] : d = "mixpanel", b._i.push([a, e, d])
			}, b.__SV = 1.2, b.init(Constants.MIXPANEL_TOKEN),
			function() {
				function C() {
					return function() {}
				}
				var o = !0,
					q = null,
					v = !1;
				! function(s) {
					function l() {}

					function f() {}

					function E(a, c, d) {
						var g, e = "mixpanel" === d ? s : s[d];
						return !e || b.isArray(e) ? (g = new f, g.O(a, c, d), g.people = new l, g.people.O(g), A = A || g.d("debug"), b.e(e) || (g.M.call(g.people, e.people), g.M(e)), g) : void p.error("You have already initialized " + d)
					}

					function k(a) {
						this.props = {}, this.da = v, this.name = a.cookie_name ? "mp_" + a.cookie_name : "mp_" + a.token + "_mixpanel", this.load(), this.wa(a), this.hb(a), this.save()
					}

					function F() {
						this.oa = "submit"
					}

					function B() {
						this.oa = "click"
					}

					function w() {}

					function x() {
						x.Ka || (K = x.Ka = o, L = v, b.a(y, function(a) {
							a.Aa()
						}))
					}
					var J = Array.prototype,
						z = Object.prototype,
						M = J.slice,
						D = z.toString,
						G = z.hasOwnProperty,
						t = window.console,
						H = window.navigator,
						r = window.document,
						u = H.userAgent,
						O = "__mps,__mpso,__mpa,__mpap,$people_distinct_id,__alias".split(","),
						z = s && s.__SV || 0,
						I = window.XMLHttpRequest && "withCredentials" in new XMLHttpRequest,
						L = !I && -1 == u.indexOf("MSIE"),
						b = {}, A = v,
						P = {
							api_host: ("https:" == r.location.protocol ? "https://" : "http://") + "api.mixpanel.com",
							cross_subdomain_cookie: o,
							cookie_name: "",
							loaded: C(),
							store_google: o,
							save_referrer: o,
							test: v,
							verbose: v,
							img: v,
							track_pageview: o,
							debug: v,
							track_links_timeout: 300,
							cookie_expiration: 365,
							upgrade: v,
							disable_cookie: v,
							secure_cookie: v,
							ip: o
						}, K = v;
					! function() {
						var a = J.forEach,
							c = J.indexOf,
							d = Array.isArray,
							g = {}, e = b.a = function(c, d, b) {
								if (c != q)
									if (a && c.forEach === a) c.forEach(d, b);
									else
								if (c.length === +c.length)
									for (var e = 0, f = c.length; f > e && !(e in c && d.call(b, c[e], e, c) === g); e++);
								else
									for (e in c)
										if (G.call(c, e) && d.call(b, c[e], e, c) === g) break
							};
						b.extend = function(a) {
							return e(M.call(arguments, 1), function(c) {
								for (var d in c) void 0 !== c[d] && (a[d] = c[d])
							}), a
						}, b.isArray = d || function(a) {
							return "[object Array]" === D.call(a)
						}, b.Sa = function(a) {
							try {
								return /^\s*\bfunction\b/.test(a)
							} catch (c) {
								return v
							}
						}, b.Pa = function(a) {
							return !(!a || !G.call(a, "callee"))
						}, b.q = function(a) {
							return a ? a.q ? a.q() : b.isArray(a) || b.Pa(a) ? M.call(a) : b.jb(a) : []
						}, b.jb = function(a) {
							var c = [];
							return a == q ? c : (e(a, function(a) {
								c[c.length] = a
							}), c)
						}, b.lb = function(a) {
							return a
						}, b.ia = function(a, d) {
							var b = v;
							return a == q ? b : c && a.indexOf === c ? -1 != a.indexOf(d) : (e(a, function(a) {
								return b || (b = a === d) ? g : void 0
							}), b)
						}, b.h = function(a, c) {
							return -1 !== a.indexOf(c)
						}
					}(), b.ka = function(a, c) {
						a.prototype = new c, a.bb = c.prototype
					}, b.g = function(a) {
						return a === Object(a) && !b.isArray(a)
					}, b.D = function(a) {
						if (b.g(a)) {
							for (var c in a)
								if (G.call(a, c)) return v;
							return o
						}
						return v
					}, b.e = function(a) {
						return void 0 === a
					}, b.la = function(a) {
						return "[object String]" == D.call(a)
					}, b.Ra = function(a) {
						return "[object Date]" == D.call(a)
					}, b.Ta = function(a) {
						return "[object Number]" == D.call(a)
					}, b.ga = function(a) {
						return b.a(a, function(c, d) {
							b.Ra(c) ? a[d] = b.La(c) : b.g(c) && (a[d] = b.ga(c))
						}), a
					}, b.La = function(a) {
						function c(a) {
							return 10 > a ? "0" + a : a
						}
						return a.getUTCFullYear() + "-" + c(a.getUTCMonth() + 1) + "-" + c(a.getUTCDate()) + "T" + c(a.getUTCHours()) + ":" + c(a.getUTCMinutes()) + ":" + c(a.getUTCSeconds())
					}, b.G = function(a) {
						var c = {};
						return b.a(a, function(a, g) {
							b.la(a) && 0 < a.length && (c[g] = a)
						}), c
					}, b.truncate = function(a, c) {
						var d;
						return "string" == typeof a ? d = a.slice(0, c) : b.isArray(a) ? (d = [], b.a(a, function(a) {
							d.push(b.truncate(a, c))
						})) : b.g(a) ? (d = {}, b.a(a, function(a, e) {
							d[e] = b.truncate(a, c)
						})) : d = a, d
					}, b.s = function() {
						return function(a) {
							function c(a, b) {
								var j = "",
									i = 0,
									h = i = "",
									h = 0,
									f = j,
									m = [],
									n = b[a];
								switch (n && "object" == typeof n && "function" == typeof n.toJSON && (n = n.toJSON(a)), typeof n) {
									case "string":
										return d(n);
									case "number":
										return isFinite(n) ? "" + n : "null";
									case "boolean":
									case "null":
										return "" + n;
									case "object":
										if (!n) return "null";
										if (j += "    ", m = [], "[object Array]" === D.apply(n)) {
											for (h = n.length, i = 0; h > i; i += 1) m[i] = c(i, n) || "null";
											return h = 0 === m.length ? "[]" : j ? "[\n" + j + m.join(",\n" + j) + "\n" + f + "]" : "[" + m.join(",") + "]"
										}
										for (i in n) G.call(n, i) && (h = c(i, n)) && m.push(d(i) + (j ? ": " : ":") + h);
										return h = 0 === m.length ? "{}" : j ? "{" + m.join(",") + f + "}" : "{" + m.join(",") + "}"
								}
							}

							function d(a) {
								var c = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
									d = {
										"\b": "\\b",
										"	": "\\t",
										"\n": "\\n",
										"\f": "\\f",
										"\r": "\\r",
										'"': '\\"',
										"\\": "\\\\"
									};
								return c.lastIndex = 0, c.test(a) ? '"' + a.replace(c, function(a) {
									var c = d[a];
									return "string" == typeof c ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
								}) + '"' : '"' + a + '"'
							}
							return c("", {
								"": a
							})
						}
					}(), b.I = function() {
						function a() {
							switch (h) {
								case "t":
									return e("t"), e("r"), e("u"), e("e"), o;
								case "f":
									return e("f"), e("a"), e("l"), e("s"), e("e"), v;
								case "n":
									return e("n"), e("u"), e("l"), e("l"), q
							}
							j("Unexpected '" + h + "'")
						}

						function c() {
							for (; h && " " >= h;) e()
						}

						function d() {
							var a, c, b, d = "";
							if ('"' === h)
								for (; e();) {
									if ('"' === h) return e(), d;
									if ("\\" === h)
										if (e(), "u" === h) {
											for (c = b = 0; 4 > c && (a = parseInt(e(), 16), isFinite(a)); c += 1) b = 16 * b + a;
											d += String.fromCharCode(b)
										} else {
											if ("string" != typeof f[h]) break;
											d += f[h]
										} else d += h
								}
							j("Bad string")
						}

						function b() {
							var a;
							for (a = "", "-" === h && (a = "-", e("-")); h >= "0" && "9" >= h;) a += h, e();
							if ("." === h)
								for (a += "."; e() && h >= "0" && "9" >= h;) a += h;
							if ("e" === h || "E" === h)
								for (a += h, e(), ("-" === h || "+" === h) && (a += h, e()); h >= "0" && "9" >= h;) a += h, e();
							return a = +a, isFinite(a) ? a : void j("Bad number")
						}

						function e(a) {
							return a && a !== h && j("Expected '" + a + "' instead of '" + h + "'"), h = m.charAt(i), i += 1, h
						}

						function j(a) {
							throw {
								name: "SyntaxError",
								message: a,
								kb: i,
								text: m
							}
						}
						var i, h, m, n, f = {
								'"': '"',
								"\\": "\\",
								"/": "/",
								b: "\b",
								f: "\f",
								n: "\n",
								r: "\r",
								t: "	"
							};
						return n = function() {
							switch (c(), h) {
								case "{":
									var i;
									a: {
										var f, m = {};
										if ("{" === h) {
											if (e("{"), c(), "}" === h) {
												e("}"), i = m;
												break a
											}
											for (; h;) {
												if (f = d(), c(), e(":"), Object.hasOwnProperty.call(m, f) && j('Duplicate key "' + f + '"'), m[f] = n(), c(), "}" === h) {
													e("}"), i = m;
													break a
												}
												e(","), c()
											}
										}
										j("Bad object")
									}
									return i;
								case "[":
									a: {
										if (i = [], "[" === h) {
											if (e("["), c(), "]" === h) {
												e("]"), f = i;
												break a
											}
											for (; h;) {
												if (i.push(n()), c(), "]" === h) {
													e("]"), f = i;
													break a
												}
												e(","), c()
											}
										}
										j("Bad array")
									}
									return f;
								case '"':
									return d();
								case "-":
									return b();
								default:
									return h >= "0" && "9" >= h ? b() : a()
							}
						},
						function(a) {
							return m = a, i = 0, h = " ", a = n(), c(), h && j("Syntax error"), a
						}
					}(), b.ca = function(a) {
						var c, d, g, e, j = 0,
							i = 0,
							h = "",
							h = [];
						if (!a) return a;
						a = b.ib(a);
						do c = a.charCodeAt(j++), d = a.charCodeAt(j++), g = a.charCodeAt(j++), e = c << 16 | d << 8 | g, c = e >> 18 & 63, d = e >> 12 & 63, g = e >> 6 & 63, e &= 63, h[i++] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(c) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(d) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(g) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(e); while (j < a.length);
						switch (h = h.join(""), a.length % 3) {
							case 1:
								h = h.slice(0, -2) + "==";
								break;
							case 2:
								h = h.slice(0, -1) + "="
						}
						return h
					}, b.ib = function(a) {
						var d, b, j, a = (a + "").replace(/\r\n/g, "\n").replace(/\r/g, "\n"),
							c = "",
							e = 0;
						for (d = b = 0, e = a.length, j = 0; e > j; j++) {
							var i = a.charCodeAt(j),
								h = q;
							128 > i ? b++ : h = i > 127 && 2048 > i ? String.fromCharCode(i >> 6 | 192, 63 & i | 128) : String.fromCharCode(i >> 12 | 224, i >> 6 & 63 | 128, 63 & i | 128), h !== q && (b > d && (c += a.substring(d, b)), c += h, d = b = j + 1)
						}
						return b > d && (c += a.substring(d, a.length)), c
					}, b.za = function() {
						function a() {
							function a(c, b) {
								var d, e = 0;
								for (d = 0; d < b.length; d++) e |= j[d] << 8 * d;
								return c ^ e
							}
							var c, b, j = [],
								i = 0;
							for (c = 0; c < u.length; c++) b = u.charCodeAt(c), j.unshift(255 & b), 4 <= j.length && (i = a(i, j), j = []);
							return 0 < j.length && (i = a(i, j)), i.toString(16)
						}

						function c() {
							for (var a = 1 * new Date, c = 0; a == 1 * new Date;) c++;
							return a.toString(16) + c.toString(16)
						}
						return function() {
							var b = (screen.height * screen.width).toString(16);
							return c() + "-" + Math.random().toString(16).replace(".", "") + "-" + a() + "-" + b + "-" + c()
						}
					}(), b.Qa = function() {
						return /(google web preview|baiduspider|yandexbot)/i.test(u) ? o : v
					}, b.ya = function(a) {
						var c, d, g, e = [];
						return "undefined" == typeof c && (c = "&"), b.a(a, function(a, c) {
							d = encodeURIComponent(a.toString()), g = encodeURIComponent(c), e[e.length] = g + "=" + d
						}), e.join(c)
					}, b.ha = function(a, c) {
						var c = c.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]"),
							b = RegExp("[\\?&]" + c + "=([^&#]*)").exec(a);
						return b === q || b && "string" != typeof b[1] && b[1].length ? "" : decodeURIComponent(b[1]).replace(/\+/g, " ")
					}, b.cookie = {
						get: function(a) {
							for (var a = a + "=", c = r.cookie.split(";"), b = 0; b < c.length; b++) {
								for (var g = c[b];
									" " == g.charAt(0);) g = g.substring(1, g.length);
								if (0 == g.indexOf(a)) return decodeURIComponent(g.substring(a.length, g.length))
							}
							return q
						},
						parse: function(a) {
							var c;
							try {
								c = b.I(b.cookie.get(a)) || {}
							} catch (d) {}
							return c
						},
						set: function(a, c, b, g, e) {
							var d, j = "",
								i = "",
								h = "";
							g && (d = (j = (j = r.location.hostname.match(/[a-z0-9][a-z0-9\-]+\.[a-z\.]{2,6}$/i)) ? j[0] : "") ? "; domain=." + j : "", j = d), b && (i = new Date, i.setTime(i.getTime() + 864e5 * b), i = "; expires=" + i.toGMTString()), e && (h = "; secure"), r.cookie = a + "=" + encodeURIComponent(c) + i + "; path=/" + j + h
						},
						remove: function(a, c) {
							b.cookie.set(a, "", -1, c)
						}
					}, b.qa = function() {
						function a(a, g, e) {
							return function(j) {
								if (j = j || c(window.event)) {
									var h, i = o;
									return b.Sa(e) && (h = e(j)), j = g.call(a, j), (v === h || v === j) && (i = v), i
								}
							}
						}

						function c(a) {
							return a && (a.preventDefault = c.preventDefault, a.stopPropagation = c.stopPropagation), a
						}
						return c.preventDefault = function() {
							this.returnValue = v
						}, c.stopPropagation = function() {
							this.cancelBubble = o
						},
						function(c, b, e, j) {
							c ? c.addEventListener && !j ? c.addEventListener(b, e, v) : (b = "on" + b, c[b] = a(c, e, c[b])) : p.error("No valid element provided to register_event")
						}
					}(), b.Ja = function() {
						function a(a, b) {
							return 0 <= (" " + a.className + " ").replace(c, " ").indexOf(" " + b + " ")
						}
						var c = /[\t\r\n]/g;
						return function(c) {
							if (!r.getElementsByTagName) return [];
							for (var g, c = c.split(" "), e = Array(r), j = 0; j < c.length; j++)
								if (g = c[j].replace(/^\s+/, "").replace(/\s+$/, ""), -1 < g.indexOf("#")) {
									g = g.split("#");
									var i = g[0],
										e = r.getElementById(g[1]);
									if (!e || i && e.nodeName.toLowerCase() != i) return [];
									e = Array(e)
								} else
							if (-1 < g.indexOf(".")) {
								g = g.split(".");
								var i = g[0],
									h = g[1];
								i || (i = "*"), g = [];
								for (var f = 0, m = 0; m < e.length; m++) {
									var n;
									n = "*" == i ? e[m].all ? e[m].all : e[m].getElementsByTagName("*") : e[m].getElementsByTagName(i);
									for (var k = 0; k < n.length; k++) g[f++] = n[k]
								}
								for (e = [], f = i = 0; f < g.length; f++) g[f].className && b.la(g[f].className) && a(g[f], h) && (e[i++] = g[f])
							} else if (g.match(/^(\w*)\[(\w+)([=~\|\^\$\*]?)=?"?([^\]"]*)"?\]$/)) {
								var i = RegExp.$1,
									l = RegExp.$2,
									h = RegExp.$3,
									p = RegExp.$4;
								for (i || (i = "*"), g = [], m = f = 0; m < e.length; m++)
									for (n = "*" == i ? e[m].all ? e[m].all : e[m].getElementsByTagName("*") : e[m].getElementsByTagName(i), k = 0; k < n.length; k++) g[f++] = n[k];
								switch (e = [], i = 0, h) {
									case "=":
										h = function(a) {
											return a.getAttribute(l) == p
										};
										break;
									case "~":
										h = function(a) {
											return a.getAttribute(l).match(RegExp("\\b" + p + "\\b"))
										};
										break;
									case "|":
										h = function(a) {
											return a.getAttribute(l).match(RegExp("^" + p + "-?"))
										};
										break;
									case "^":
										h = function(a) {
											return 0 == a.getAttribute(l).indexOf(p)
										};
										break;
									case "$":
										h = function(a) {
											return a.getAttribute(l).lastIndexOf(p) == a.getAttribute(l).length - p.length
										};
										break;
									case "*":
										h = function(a) {
											return -1 < a.getAttribute(l).indexOf(p)
										};
										break;
									default:
										h = function(a) {
											return a.getAttribute(l)
										}
								}
								for (e = [], f = i = 0; f < g.length; f++) h(g[f]) && (e[i++] = g[f])
							} else {
								for (i = g, g = [], m = f = 0; m < e.length; m++)
									for (n = e[m].getElementsByTagName(i), k = 0; k < n.length; k++) g[f++] = n[k];
								e = g
							}
							return e
						}
					}(), b.info = {
						Fa: function() {
							var a = "",
								c = {};
							return b.a("utm_source utm_medium utm_campaign utm_content utm_term".split(" "), function(d) {
								a = b.ha(r.URL, d), a.length && (c[d] = a)
							}), c
						},
						Xa: function(a) {
							return 0 === a.search("https?://(.*)google.([^/?]*)") ? "google" : 0 === a.search("https?://(.*)bing.com") ? "bing" : 0 === a.search("https?://(.*)yahoo.com") ? "yahoo" : 0 === a.search("https?://(.*)duckduckgo.com") ? "duckduckgo" : q
						},
						Ya: function(a) {
							var c = b.info.Xa(a),
								d = {};
							return c !== q && (d.$search_engine = c, a = b.ha(a, "yahoo" != c ? "q" : "p"), a.length && (d.mp_keyword = a)), d
						},
						A: function(a, c, d) {
							return c = c || "", d ? b.h(a, "Mini") ? "Opera Mini" : "Opera" : /(BlackBerry|PlayBook|BB10)/i.test(a) ? "BlackBerry" : b.h(a, "FBIOS") ? "Facebook Mobile" : b.h(a, "Chrome") ? "Chrome" : b.h(a, "CriOS") ? "Chrome iOS" : b.h(c, "Apple") ? b.h(a, "Mobile") ? "Mobile Safari" : "Safari" : b.h(a, "Android") ? "Android Mobile" : b.h(a, "Konqueror") ? "Konqueror" : b.h(a, "Firefox") ? "Firefox" : b.h(a, "MSIE") || b.h(a, "Trident/") ? "Internet Explorer" : b.h(a, "Gecko") ? "Mozilla" : ""
						},
						Z: function() {
							return /Windows/i.test(u) ? /Phone/.test(u) ? "Windows Mobile" : "Windows" : /(iPhone|iPad|iPod)/.test(u) ? "iOS" : /Android/.test(u) ? "Android" : /(BlackBerry|PlayBook|BB10)/i.test(u) ? "BlackBerry" : /Mac/i.test(u) ? "Mac OS X" : /Linux/.test(u) ? "Linux" : ""
						},
						fa: function(a) {
							return /iPad/.test(a) ? "iPad" : /iPod/.test(a) ? "iPod Touch" : /iPhone/.test(a) ? "iPhone" : /(BlackBerry|PlayBook|BB10)/i.test(a) ? "BlackBerry" : /Windows Phone/i.test(a) ? "Windows Phone" : /Android/.test(a) ? "Android" : ""
						},
						pa: function(a) {
							return a = a.split("/"), 3 <= a.length ? a[2] : ""
						},
						F: function() {
							return b.G({
								$os: b.info.Z(),
								$browser: b.info.A(u, H.vendor, window.opera),
								$referrer: r.referrer,
								$referring_domain: b.info.pa(r.referrer),
								$device: b.info.fa(u),
								mp_lib: "web"
							})
						},
						Wa: function() {
							return b.G({
								$os: b.info.Z(),
								$browser: b.info.A(u, H.vendor, window.opera)
							})
						},
						Va: function(a) {
							return b.G({
								mp_page: a,
								mp_referrer: r.referrer,
								mp_browser: b.info.A(u, H.vendor, window.opera),
								mp_platform: b.info.Z()
							})
						}
					};
					var p = {
						log: function() {
							if (A && !b.e(t) && t) try {
								t.log.apply(t, arguments)
							} catch (a) {
								b.a(arguments, function(a) {
									t.log(a)
								})
							}
						},
						error: function() {
							if (A && !b.e(t) && t) {
								var a = ["Mixpanel error:"].concat(b.q(arguments));
								try {
									t.error.apply(t, a)
								} catch (c) {
									b.a(a, function(a) {
										t.error(a)
									})
								}
							}
						},
						T: function() {
							if (!b.e(t) && t) {
								var a = ["Mixpanel error:"].concat(b.q(arguments));
								try {
									t.error.apply(t, a)
								} catch (c) {
									b.a(a, function(a) {
										t.error(a)
									})
								}
							}
						}
					};
					if (w.prototype.B = C(), w.prototype.V = C(), w.prototype.S = C(), w.prototype.Y = function(a) {
						return this.ma = a, this
					}, w.prototype.l = function(a, c, d, g) {
						var e = this,
							j = b.Ja(a);
						return 0 != j.length ? (b.a(j, function(a) {
							b.qa(a, this.oa, function(a) {
								var b = {}, i = e.B(d, this),
									j = e.ma.d("track_links_timeout");
								e.V(a, this, b), window.setTimeout(e.ua(g, i, b, o), j), e.ma.l(c, i, e.ua(g, i, b))
							})
						}, this), o) : void p.error("The DOM query (" + a + ") returned 0 elements")
					}, w.prototype.ua = function(a, c, b, g) {
						var g = g || v,
							e = this;
						return function() {
							b.Ea || (b.Ea = o, a && a(g, c) === v || e.S(c, b, g))
						}
					}, w.prototype.B = function(a, c) {
						return "function" == typeof a ? a(c) : b.extend({}, a)
					}, b.ka(B, w), B.prototype.B = function(a, c) {
						var b = B.bb.B.apply(this, arguments);
						return c.href && (b.url = c.href), b
					}, B.prototype.V = function(a, c, b) {
						b.na = 2 === a.which || a.metaKey || "_blank" === c.target, b.href = c.href, b.na || a.preventDefault()
					}, B.prototype.S = function(a, c) {
						c.na || setTimeout(function() {
							window.location = c.href
						}, 0)
					}, b.ka(F, w), F.prototype.V = function(a, c, b) {
						b.element = c, a.preventDefault()
					}, F.prototype.S = function(a, c) {
						setTimeout(function() {
							c.element.submit()
						}, 0)
					}, k.prototype.F = function() {
						var a = {};
						return b.a(this.props, function(c, d) {
							b.ia(O, d) || (a[d] = c)
						}), a
					}, k.prototype.load = function() {
						if (!this.disabled) {
							var a = b.cookie.parse(this.name);
							a && (this.props = b.extend({}, a))
						}
					}, k.prototype.hb = function(a) {
						var d, c = a.upgrade;
						c && (d = "mp_super_properties", "string" == typeof c && (d = c), c = b.cookie.parse(d), b.cookie.remove(d), b.cookie.remove(d, o), c && (this.props = b.extend(this.props, c.all, c.events))), !a.cookie_name && "mixpanel" !== a.name && (d = "mp_" + a.token + "_" + a.name, c = b.cookie.parse(d)) && (b.cookie.remove(d), b.cookie.remove(d, o), this.k(c))
					}, k.prototype.save = function() {
						this.disabled || b.cookie.set(this.name, b.s(this.props), this.W, this.U, this.ra)
					}, k.prototype.remove = function() {
						b.cookie.remove(this.name, v), b.cookie.remove(this.name, o)
					}, k.prototype.clear = function() {
						this.remove(), this.props = {}
					}, k.prototype.k = function(a, c, d) {
						return b.g(a) ? ("undefined" == typeof c && (c = "None"), this.W = "undefined" == typeof d ? this.ea : d, b.a(a, function(a, b) {
							this.props[b] && this.props[b] !== c || (this.props[b] = a)
						}, this), this.save(), o) : v
					}, k.prototype.p = function(a, c) {
						return b.g(a) ? (this.W = "undefined" == typeof c ? this.ea : c, b.extend(this.props, a), this.save(), o) : v
					}, k.prototype.H = function(a) {
						a in this.props && (delete this.props[a], this.save())
					}, k.prototype.gb = function() {
						this.da || (this.k(b.info.Fa()), this.da = o)
					}, k.prototype.xa = function(a) {
						this.p(b.info.Ya(a))
					}, k.prototype.$ = function(a) {
						this.k({
							$initial_referrer: a || "$direct",
							$initial_referring_domain: b.info.pa(a) || "$direct"
						}, "")
					}, k.prototype.Na = function() {
						return b.G({
							$initial_referrer: this.props.$initial_referrer,
							$initial_referring_domain: this.props.$initial_referring_domain
						})
					}, k.prototype.wa = function(a) {
						this.ea = this.W = a.cookie_expiration, this.$a(a.disable_cookie),
						this.Za(a.cross_subdomain_cookie), this.ab(a.secure_cookie)
					}, k.prototype.$a = function(a) {
						(this.disabled = a) && this.remove()
					}, k.prototype.Za = function(a) {
						a !== this.U && (this.U = a, this.remove(), this.save())
					}, k.prototype.Ma = function() {
						return this.U
					}, k.prototype.ab = function(a) {
						a !== this.ra && (this.ra = a ? o : v, this.remove(), this.save())
					}, k.prototype.j = function(a, c) {
						var d = this.N(a),
							g = c[a],
							e = this.w("$set"),
							j = this.w("$set_once"),
							i = this.w("$add"),
							h = this.w("$append", []);
						"__mps" === d ? (b.extend(e, g), this.z("$add", g)) : "__mpso" === d ? b.a(g, function(a, c) {
							c in j || (j[c] = a)
						}) : "__mpa" === d ? b.a(g, function(a, c) {
							c in e ? e[c] += a : (c in i || (i[c] = 0), i[c] += a)
						}, this) : "__mpap" === d && h.push(g), p.log("MIXPANEL PEOPLE REQUEST (QUEUED, PENDING IDENTIFY):"), p.log(c), this.save()
					}, k.prototype.z = function(a, c) {
						var d = this.m(a);
						b.e(d) || (b.a(c, function(a, c) {
							delete d[c]
						}, this), this.save())
					}, k.prototype.N = function(a) {
						return "$set" === a ? "__mps" : "$set_once" === a ? "__mpso" : "$add" === a ? "__mpa" : "$append" === a ? "__mpap" : void p.error("Invalid queue:", a)
					}, k.prototype.m = function(a) {
						return this.props[this.N(a)]
					}, k.prototype.w = function(a, c) {
						var d = this.N(a),
							c = b.e(c) ? {} : c;
						return this.props[d] || (this.props[d] = c)
					}, f.prototype.Y = function(a, c, b) {
						if ("undefined" == typeof b) p.error("You must name your new library: init(token, config, name)");
						else {
							if ("mixpanel" !== b) return a = E(a, c, b), s[b] = a, a.P(), a;
							p.error("You must initialize the main mixpanel object right after you include the Mixpanel js snippet")
						}
					}, f.prototype.O = function(a, c, d) {
						this.__loaded = o, this.config = {}, this.sa(b.extend({}, P, c, {
							name: d,
							token: a,
							callback_fn: ("mixpanel" === d ? d : "mixpanel." + d) + "._jsc"
						})), this._jsc = C(), this.K = [], this.L = [], this.J = [], this.u = {
							disable_all_events: v,
							identify_called: v
						}, this.cookie = new k(this.config), this.k({
							distinct_id: b.za()
						}, "")
					}, f.prototype.P = function() {
						this.d("loaded")(this), this.d("track_pageview") && this.va()
					}, f.prototype.Aa = function() {
						b.a(this.K, function(a) {
							this.R.apply(this, a)
						}, this), b.a(this.L, function(a) {
							this.i.apply(this, a)
						}, this), delete this.K, delete this.L
					}, f.prototype.R = function(a, c) {
						if (this.d("img")) return p.error("You can't use DOM tracking functions with img = true."), v;
						if (!K) return this.K.push([a, c]), v;
						var b = (new a).Y(this);
						return b.l.apply(b, c)
					}, f.prototype.ba = function(a, c) {
						if (b.e(a)) return q;
						if (I) return function(b) {
							a(b, c)
						};
						var d = this._jsc,
							g = "" + Math.floor(1e8 * Math.random()),
							e = this.d("callback_fn") + '["' + g + '"]';
						return d[g] = function(b) {
							delete d[g], a(b, c)
						}, e
					}, f.prototype.i = function(a, c, d) {
						if (L) this.L.push(arguments);
						else {
							var g = this.d("verbose");
							if (this.d("test") && (c.test = 1), g && (c.verbose = 1), this.d("img") && (c.img = 1), I || (d ? c.callback = d : (g || this.d("test")) && (c.callback = "(function(){})")), c.ip = this.d("ip") ? 1 : 0, c._ = (new Date).getTime().toString(), a += "?" + b.ya(c), "img" in c) {
								var e = r.createElement("img");
								e.src = a, r.body.appendChild(e)
							} else if (I) {
								var f = new XMLHttpRequest;
								f.open("GET", a, o), f.withCredentials = o, f.onreadystatechange = function() {
									if (4 === f.readyState)
										if (200 === f.status) d && d(g ? b.I(f.responseText) : Number(f.responseText));
										else {
											var a = "Bad HTTP status: " + f.status + " " + f.statusText;
											p.error(a), d && d(g ? {
												status: 0,
												error: a
											} : 0)
										}
								}, f.send(q)
							} else {
								e = r.createElement("script"), e.type = "text/javascript", e.async = o, e.defer = o, e.src = a;
								var i = r.getElementsByTagName("script")[0];
								i.parentNode.insertBefore(e, i)
							}
						}
					}, f.prototype.M = function(a) {
						function c(a, c) {
							b.a(a, function(a) {
								this[a[0]].apply(this, a.slice(1))
							}, c)
						}
						var d, g = [],
							e = [],
							f = [];
						b.a(a, function(a) {
							a && (d = a[0], "function" == typeof a ? a.call(this) : b.isArray(a) && "alias" === d ? g.push(a) : b.isArray(a) && -1 != d.indexOf("track") && "function" == typeof this[d] ? f.push(a) : e.push(a))
						}, this), c(g, this), c(e, this), c(f, this)
					}, f.prototype.push = function(a) {
						this.M([a])
					}, f.prototype.disable = function(a) {
						"undefined" == typeof a ? this.u.Ia = o : this.J = this.J.concat(a)
					}, f.prototype.l = function(a, c, d) {
						if ("undefined" == typeof a) p.error("No event name provided to mixpanel.track");
						else {
							if (!(b.Qa() || this.u.Ia || b.ia(this.J, a))) return c = c || {}, c.token = c.mb || this.d("token"), this.cookie.xa(r.referrer), this.d("store_google") && this.cookie.gb(), this.d("save_referrer") && this.cookie.$(r.referrer), c = b.extend({}, b.info.F(), this.cookie.F(), c), a = b.truncate({
								event: a,
								properties: c
							}, 255), c = b.s(a), c = b.ca(c), p.log("MIXPANEL REQUEST:"), p.log(a), this.i(this.d("api_host") + "/track/", {
								data: c
							}, this.ba(d, a)), a;
							"undefined" != typeof d && d(0)
						}
					}, f.prototype.va = function(a) {
						"undefined" == typeof a && (a = r.location.href), this.l("mp_page_view", b.info.Va(a))
					}, f.prototype.fb = function() {
						return this.R.call(this, B, arguments)
					}, f.prototype.eb = function() {
						return this.R.call(this, F, arguments)
					}, f.prototype.p = function(a, c) {
						this.cookie.p(a, c)
					}, f.prototype.k = function(a, c, b) {
						this.cookie.k(a, c, b)
					}, f.prototype.H = function(a) {
						this.cookie.H(a)
					}, f.prototype.Q = function(a, c) {
						var b = {};
						b[a] = c, this.p(b)
					}, f.prototype.X = function(a, b, d, g, e) {
						a != this.o() && a != this.C("__alias") && (this.H("__alias"), this.Q("distinct_id", a)), this.u.Oa = o, this.people.Ca(b, d, g, e)
					}, f.prototype.o = function() {
						return this.C("distinct_id")
					}, f.prototype.Da = function(a, c) {
						if (a === this.C("$people_distinct_id")) return p.T("Attempting to create alias for existing People user - aborting."), -2;
						var d = this;
						return b.e(c) && (c = this.o()), a !== c ? (this.Q("__alias", a), this.l("$create_alias", {
							alias: a,
							distinct_id: c
						}, function() {
							d.X(a)
						})) : (p.error("alias matches current distinct_id - skipping api call."), this.X(a), -1)
					}, f.prototype.Ua = function(a) {
						this.Q("mp_name_tag", a)
					}, f.prototype.sa = function(a) {
						b.g(a) && (b.extend(this.config, a), this.cookie && this.cookie.wa(this.config), A = A || this.d("debug"))
					}, f.prototype.d = function(a) {
						return this.config[a]
					}, f.prototype.C = function(a) {
						return this.cookie.props[a]
					}, f.prototype.toString = function() {
						var a = this.d("name");
						return "mixpanel" !== a && (a = "mixpanel." + a), a
					}, l.prototype.O = function(a) {
						this.c = a
					}, l.prototype.set = function(a, c, d) {
						var g = {}, e = {};
						return b.g(a) ? (b.a(a, function(a, b) {
							"$distinct_id" == b || "$token" == b || (e[b] = a)
						}), d = c) : e[a] = c, this.v("save_referrer") && this.c.cookie.$(r.referrer), e = b.extend({}, b.info.Wa(), this.c.cookie.Na(), e), g.$set = e, this.i(g, d)
					}, l.prototype.ta = function(a, c, d) {
						var g = {}, e = {};
						return b.g(a) ? (b.a(a, function(a, b) {
							"$distinct_id" == b || "$token" == b || (e[b] = a)
						}), d = c) : e[a] = c, g.$set_once = e, this.i(g, d)
					}, l.prototype.ja = function(a, c, d) {
						var g = {}, e = {};
						return b.g(a) ? (b.a(a, function(a, b) {
							"$distinct_id" == b || "$token" == b || (isNaN(parseFloat(a)) ? p.error("Invalid increment value passed to mixpanel.people.increment - must be a number") : e[b] = a)
						}), d = c) : (b.e(c) && (c = 1), e[a] = c), g.$add = e, this.i(g, d)
					}, l.prototype.append = function(a, c, d) {
						var g = {}, e = {};
						return b.g(a) ? (b.a(a, function(a, b) {
							"$distinct_id" == b || "$token" == b || (e[b] = a)
						}), d = c) : e[a] = c, g.$append = e, this.i(g, d)
					}, l.prototype.cb = function(a, c, d) {
						return !b.Ta(a) && (a = parseFloat(a), isNaN(a)) ? void p.error("Invalid value passed to mixpanel.people.track_charge - must be a number") : this.append("$transactions", b.extend({
							$amount: a
						}, c), d)
					}, l.prototype.Ga = function(a) {
						return this.set("$transactions", [], a)
					}, l.prototype.Ha = function() {
						return this.aa() ? this.i({
							$delete: this.c.o()
						}) : void p.error("mixpanel.people.delete_user() requires you to call identify() first")
					}, l.prototype.toString = function() {
						return this.c.toString() + ".people"
					}, l.prototype.i = function(a, c) {
						a.$token = this.v("token"), a.$distinct_id = this.c.o();
						var d = b.ga(a),
							g = b.truncate(d, 255),
							d = b.s(d),
							d = b.ca(d);
						return this.aa() ? (p.log("MIXPANEL PEOPLE REQUEST:"), p.log(g), this.c.i(this.v("api_host") + "/engage/", {
							data: d
						}, this.c.ba(c, g)), g) : (this.Ba(a), b.e(c) || c(this.v("verbose") ? {
							status: -1,
							error: q
						} : -1), g)
					}, l.prototype.v = function(a) {
						return this.c.d(a)
					}, l.prototype.aa = function() {
						return this.c.u.Oa === o
					}, l.prototype.Ba = function(a) {
						"$set" in a ? this.c.cookie.j("$set", a) : "$set_once" in a ? this.c.cookie.j("$set_once", a) : "$add" in a ? this.c.cookie.j("$add", a) : "$append" in a ? this.c.cookie.j("$append", a) : p.error("Invalid call to _enqueue():", a)
					}, l.prototype.Ca = function(a, c, d, g) {
						var e = this,
							f = b.extend({}, this.c.cookie.m("$set")),
							i = b.extend({}, this.c.cookie.m("$set_once")),
							h = b.extend({}, this.c.cookie.m("$add")),
							k = this.c.cookie.m("$append");
						if (!b.e(f) && b.g(f) && !b.D(f) && (e.c.cookie.z("$set", f), this.set(f, function(c, d) {
							0 == c && e.c.cookie.j("$set", f), b.e(a) || a(c, d)
						})), !b.e(i) && b.g(i) && !b.D(i) && (e.c.cookie.z("$set_once", i), this.ta(i, function(a, c) {
							0 == a && e.c.cookie.j("$set_once", i), b.e(g) || g(a, c)
						})), !b.e(h) && b.g(h) && !b.D(h) && (e.c.cookie.z("$add", h), this.ja(h, function(a, d) {
							0 == a && e.c.cookie.j("$add", h), b.e(c) || c(a, d)
						})), !b.e(k) && b.isArray(k) && k.length) {
							for (var l = k.length - 1; l >= 0; l--) {
								var n = k.pop();
								e.append(n, function(a, c) {
									0 == a && e.c.cookie.j("$append", n), b.e(d) || d(a, c)
								})
							}
							e.c.cookie.save()
						}
					}, b.toArray = b.q, b.isObject = b.g, b.JSONEncode = b.s, b.JSONDecode = b.I, b.isEmptyObject = b.D, b.info = b.info, b.info.device = b.info.fa, b.info.browser = b.info.A, f.prototype.init = f.prototype.Y, f.prototype.disable = f.prototype.disable, f.prototype.track = f.prototype.l, f.prototype.track_links = f.prototype.fb, f.prototype.track_forms = f.prototype.eb, f.prototype.track_pageview = f.prototype.va, f.prototype.register = f.prototype.p, f.prototype.register_once = f.prototype.k, f.prototype.unregister = f.prototype.H, f.prototype.identify = f.prototype.X, f.prototype.alias = f.prototype.Da, f.prototype.name_tag = f.prototype.Ua, f.prototype.set_config = f.prototype.sa, f.prototype.get_config = f.prototype.d, f.prototype.get_property = f.prototype.C, f.prototype.get_distinct_id = f.prototype.o, f.prototype.toString = f.prototype.toString, k.prototype.properties = k.prototype.F, k.prototype.update_search_keyword = k.prototype.xa, k.prototype.update_referrer_info = k.prototype.$, k.prototype.get_cross_subdomain = k.prototype.Ma, k.prototype.clear = k.prototype.clear, l.prototype.set = l.prototype.set, l.prototype.set_once = l.prototype.ta, l.prototype.increment = l.prototype.ja, l.prototype.append = l.prototype.append, l.prototype.track_charge = l.prototype.cb, l.prototype.clear_charges = l.prototype.Ga, l.prototype.delete_user = l.prototype.Ha, l.prototype.toString = l.prototype.toString, b.e(s)) p.T("'mixpanel' object not initialized. Ensure you are using the latest version of the Mixpanel JS Library along with the snippet we provide.");
					else if (s.__loaded || s.config && s.cookie) p.error("Mixpanel library has already been downloaded at least once.");
					else if (1.1 > z) p.T("Version mismatch; please ensure you're using the latest version of the Mixpanel code snippet.");
					else {
						var y = {};
						b.a(s._i, function(a) {
							var c;
							a && b.isArray(a) && (c = a[a.length - 1], a = E.apply(this, a), y[c] = a)
						});
						var Q = function() {
							b.a(y, function(a, b) {
								"mixpanel" !== b && (s[b] = a)
							}), s._ = b
						};
						if (s.init = function(a, b, d) {
							d ? s[d] || (s[d] = y[d] = E(a, b, d), s[d].P()) : (d = s, y.mixpanel ? d = y.mixpanel : a && (d = E(a, b, "mixpanel")), window.mixpanel = s = d, Q())
						}, s.init(), b.a(y, function(a) {
							a.P()
						}), r.addEventListener) "complete" == r.readyState ? x() : r.addEventListener("DOMContentLoaded", x, v);
						else if (r.attachEvent) {
							r.attachEvent("onreadystatechange", x), z = v;
							try {
								z = window.frameElement == q
							} catch (R) {}
							if (r.documentElement.doScroll && z) {
								var N = function() {
									try {
										r.documentElement.doScroll("left")
									} catch (a) {
										return void setTimeout(N, 1)
									}
									x()
								};
								N()
							}
						}
						b.qa(window, "load", x, o)
					}
				}(window.mixpanel)
			}()
		}, MixPanel
	}()
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("models/analytics/mixpanel_sender", ["models/analytics/event_sender", "helpers/log"], function(EventSender, Log) {
	var MixPanelSender;
	return MixPanelSender = function() {
		function MixPanelSender() {}
		var MixPanelSenderSingleton, instance, _ref;
		return MixPanelSender.DEVICE = "chrome", instance = null, MixPanelSenderSingleton = function(_super) {
			function MixPanelSenderSingleton() {
				return _ref = MixPanelSenderSingleton.__super__.constructor.apply(this, arguments)
			}
			return __extends(MixPanelSenderSingleton, _super), MixPanelSenderSingleton.prototype.sendEvent = function(name, data) {
				null != window.mixpanel ? (mixpanel.register_once({
					device: MixPanelSender.DEVICE
				}), Log.d("Sending event " + name + " to mixpanel with data: " + JSON.stringify(data)), mixpanel.track(name, data)) : Log.w("Mixpanel has not been initialized")
			}, MixPanelSenderSingleton
		}(EventSender), MixPanelSender.get = function() {
			return null == instance && (instance = new MixPanelSenderSingleton), instance
		}, MixPanelSender
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("models/analytics/select_auth_type_event", ["models/analytics/event"], function(Event) {
	var SelectAuthTypeEvent;
	return SelectAuthTypeEvent = function(_super) {
		function SelectAuthTypeEvent(data) {
			this.toJson = __bind(this.toJson, this), this.setData = __bind(this.setData, this), null != data && this.setData(data)
		}
		return __extends(SelectAuthTypeEvent, _super), SelectAuthTypeEvent.prototype.setData = function(data) {
			var _ref;
			if ("push" !== (_ref = data.authType) && "call" !== _ref && "sms" !== _ref) throw new Error("" + data.authType + " should be one of 'push','call','sms'");
			return this.provider = data.provider, this.auth_type = data.authType
		}, SelectAuthTypeEvent.prototype.getName = function() {
			return "select_auth_type"
		}, SelectAuthTypeEvent.prototype.toJson = function() {
			return JSON.parse(JSON.stringify(this))
		}, SelectAuthTypeEvent
	}(Event)
}), define("models/api/account_api", ["models/api/api", "models/apps/master_token"], function(Api, MasterToken) {
	var AccountApi;
	return AccountApi = function() {
		function AccountApi() {}
		return AccountApi.prototype.changePhone = function(newCellPhone, newCountryCode, onSuccess, onFail) {
			var url, userId;
			userId = MasterToken.get().userId, url = "/json/users/" + userId + "/change_phone/request", Api.postAuth(url, {
				new_cellphone: newCellPhone,
				new_country_code: newCountryCode
			}, function() {
				return onSuccess()
			}, onFail)
		}, AccountApi.prototype.confirmChangePhone = function(pin, onSuccess, onFail) {
			var url, userId;
			userId = MasterToken.get().userId, url = "/json/users/" + userId + "/change_phone/confirm", Api.postAuth(url, {
				pin: pin
			}, onSuccess, onFail)
		}, AccountApi.prototype.requestConfirmationPin = function(via, onSuccess, onFail) {
			var url, userId;
			userId = MasterToken.get().userId, url = "/json/users/" + userId + "/change_phone/request_pin", Api.postAuth(url, {
				via: via
			}, onSuccess, onFail)
		}, AccountApi.prototype.changeEmail = function(newEmail, onSuccess, onFail) {
			var url, userId;
			userId = MasterToken.get().userId, url = "/json/users/" + userId + "/change_email/request", Api.postAuth(url, {
				new_email: newEmail
			}, function() {
				return onSuccess()
			}, onFail)
		}, AccountApi.prototype.getUserInfo = function(onSuccess, onFail) {
			var deviceId, url, userId;
			return deviceId = MasterToken.get().deviceId, userId = MasterToken.get().userId, url = "/json/users/" + userId + "/devices/" + deviceId, Api.getAuth(url, function(data) {
				var userInfo;
				return userInfo = {
					multiDevicesEnabled: data.multidevices_enabled,
					countryCode: data.country_code,
					cellphone: data.cellphone,
					email: data.email,
					userId: userId
				}, onSuccess(userInfo)
			}, onFail)
		}, AccountApi
	}()
}), define("models/api/api", ["models/api/constants", "models/apps/master_token", "helpers/log"], function(Constants, MasterToken, Log) {
	var Api;
	return Api = function() {
		function Api() {}
		return Api.COMMON_PARAMS = {
			api_key: Constants.API_KEY,
			locale: window.navigator.language
		}, Api.HTTP_GET = "GET", Api.HTTP_POST = "POST", Api.parseResponse = function(data) {
			var e;
			if ("string" == typeof data) try {
				data = JSON.parse(data)
			} catch (_error) {
				e = _error, console.log("WARN:", e)
			}
			return data
		}, Api.get = function(relativeUrl, onSuccess, onFail, params) {
			var self;
			return null == params && (params = {}), self = this, Api.request({
				url: Constants.SERVER_URL + relativeUrl,
				params: Api.getParams(params),
				type: Api.HTTP_GET,
				success: function(data) {
					return data = self.parseResponse(data), Log.d(data), onSuccess(data)
				},
				error: function(jqXHR) {
					return Api.onFailedRequest(jqXHR.responseJSON, onFail)
				}
			})
		}, Api.getAuth = function(relativeUrl, onSuccess, onFail, params) {
			var master, otps;
			return null == params && (params = {}), master = MasterToken.get(), otps = master.getOtps(), params.otp1 = otps[0], params.otp2 = otps[1], params.otp3 = otps[2], params.device_id = master.deviceId, Api.get(relativeUrl, onSuccess, onFail, params)
		}, Api.post = function(relativeUrl, params, onSuccess, onFail) {
			return null == params && (params = {}), Api.request({
				url: Constants.SERVER_URL + relativeUrl,
				params: Api.getParams(params),
				type: Api.HTTP_POST,
				success: function(data) {
					return Log.d(data), onSuccess(data)
				},
				error: function(jqXHR) {
					return Api.onFailedRequest(jqXHR.responseJSON, onFail)
				}
			})
		}, Api.postAuth = function(relativeUrl, params, onSuccess, onFail) {
			var otps;
			return null == params && (params = {}), otps = MasterToken.get().getOtps(), params.otp1 = otps[0], params.otp2 = otps[1], params.otp3 = otps[2], params.device_id = MasterToken.get().deviceId, Api.post(relativeUrl, params, onSuccess, onFail)
		}, Api.request = function(options) {
			var constructedURL;
			return constructedURL = "", $.ajax({
				url: options.url,
				data: options.params || {},
				type: options.type,
				beforeSend: function(xhr, settings) {
					return constructedURL = settings.url, Log.d("" + options.type + ": " + constructedURL), xhr.setRequestHeader("X-User-Agent", Constants.USER_AGENT)
				},
				success: function(data) {
					return Log.d("" + options.type + " OK for: " + constructedURL), options.success(data)
				},
				error: function(jqXHR, textStatus, errorThrown) {
					return Log.e("" + options.type + " FAILED for: " + constructedURL + "\nText Status: " + textStatus + "\nError Thrown: " + errorThrown), options.error(jqXHR)
				}
			})
		}, Api.getParams = function(params) {
			return $.extend({}, Api.COMMON_PARAMS, params)
		}, Api.camelizeResponse = function(response) {
			var key, result, value;
			result = {};
			for (key in response) value = response[key], !(value instanceof Object) || value instanceof Array ? result[_.str.camelize(key)] = value : result[_.str.camelize(key)] = Api.camelizeResponse(value);
			return result
		}, Api.onFailedRequest = function(responseJSON, onFail) {
			return onFail(null != responseJSON ? responseJSON : {
				message: "It looks like there is no internet connection."
			})
		}, Api
	}()
}), define("models/api/apps_api", ["models/api/api", "models/apps/master_token", "models/api/constants", "models/apps/authy_app", "models/apps/google_auth_app"], function(Api, MasterToken, Constants, AuthyApp, GoogleAuthApp) {
	var AppsApi;
	return AppsApi = function() {
		function AppsApi() {}
		return AppsApi.prototype.syncAuthenticatorApps = function(appIds, onSuccess, onFail) {
			var idList, masterToken, url, userId;
			return masterToken = MasterToken.get(), userId = masterToken.userId, idList = appIds.join(), url = "/json/users/" + userId + "/authenticator_tokens", Api.getAuth(url, function(data) {
				var appList, token, tokensData, _i, _len;
				for (tokensData = data.authenticator_tokens, appList = [], _i = 0, _len = tokensData.length; _len > _i; _i++) token = tokensData[_i], appList.push(GoogleAuthApp.create(token));
				return onSuccess(appList, data.deleted)
			}, onFail, {
				apps: idList
			})
		}, AppsApi.prototype.syncAuthyApps = function(authyApps, onSuccess, onFail) {
			var app, deviceId, masterToken, params, url, userId, _i, _len;
			for (masterToken = MasterToken.get(), userId = masterToken.userId, deviceId = masterToken.deviceId, url = "/json/users/" + userId + "/devices/" + deviceId + "/apps/sync", params = {}, _i = 0, _len = authyApps.length; _len > _i; _i++) app = authyApps[_i], params["vs" + app._id] = app.version;
			Api.postAuth(url, params, function(response) {
				return onSuccess(response.apps, response.deleted)
			}, onFail)
		}, AppsApi.prototype.deleteAuthenticatorApp = function(appId, onSuccess, onFail) {
			var masterToken, url, userId;
			return masterToken = MasterToken.get(), userId = masterToken.userId, url = "/json/users/" + userId + "/authenticator_tokens/delete", Api.postAuth(url, {
				token_id: appId
			}, function() {
				return onSuccess()
			}, onFail)
		}, AppsApi.prototype.uploadAuthenticatorApp = function(app, onSuccess, onFail) {
			var masterToken, params, url, userId;
			return null == onFail && (onFail = function() {}), masterToken = MasterToken.get(), userId = masterToken.userId, url = "/json/users/" + userId + "/authenticator_tokens/update", params = {
				name: app.getName(),
				token_id: app.uniqueId,
				account_type: app.accountType,
				encrypted_seed: app.encryptedSeed,
				salt: app.salt,
				password_timestamp: app.passwordTimestamp
			}, Api.postAuth(url, params, function() {
				return onSuccess()
			}, onFail)
		}, AppsApi
	}()
}), define("models/api/assets_api", ["models/api/api", "models/api/constants"], function(Api, Constants) {
	var AssetsApi;
	return AssetsApi = function() {
		function AssetsApi() {}
		return AssetsApi.prototype.getAssetsManifest = function(onSuccess, onFail, appIds) {
			return null == appIds && (appIds = ""), Api.get("/assets/chrome/high", function(data) {
				return onSuccess(data)
			}, onFail, {
				app_ids: appIds
			})
		}, AssetsApi.prototype.getAuthenticatorConfig = function(onSuccess, onFail) {
			return Api.get("/json/authenticator_tokens/config", function(data) {
				return onSuccess(data)
			}, onFail)
		}, AssetsApi
	}()
}), define("models/api/constants", [], function() {
	var Constants;
	return Constants = function() {
		function Constants() {}
		return Constants.DEBUG = "undefined" != typeof window && null !== window && null != window.chrome && null != chrome.runtime && null != chrome.runtime.getManifest ? chrome.runtime.getManifest().dflag : !0, Constants.getServerUrl = function() {
			return Constants.DEBUG ? (console.debug("Running with staging url"), "http://staging-2.authy.com") : "https://api.authy.com"
		}, Constants.API_KEY = "37b312a3d682b823c439522e1fd31c82", Constants.SERVER_URL = Constants.getServerUrl(), Constants.USER_AGENT = "AuthyChrome v1.0", Constants.MIXPANEL_TOKEN = Constants.DEBUG ? "f469be84582f29c828a2f7ae258e6f0d" : "db55ae1aea32128230557f90aa11cd2b", Constants.getName = function() {
			return "undefined" != typeof window && null !== window && null != window.chrome && null != chrome.runtime && null != chrome.runtime.getManifest ? chrome.runtime.getManifest().short_name : (console.error("unable to fetch short_name from manifest"), "authy")
		}, Constants.getFlavor = function() {
			return /authy/i.test(Constants.getName()) ? "authy" : "dell"
		}, Constants
	}()
}), define("models/api/devices_api", ["models/api/api", "models/apps/master_token", "models/devices/device", "helpers/log"], function(Api, MasterToken, Device, Log) {
	var DevicesApi;
	return DevicesApi = function() {
		function DevicesApi() {}
		return DevicesApi.prototype.getDevices = function(onSuccess, onFail) {
			var token, url;
			token = MasterToken.get(), url = "/json/users/" + token.userId + "/devices", Api.getAuth(url, function(data) {
				var device, deviceJson, result, _i, _len, _ref;
				for (result = [], _ref = data.devices, _i = 0, _len = _ref.length; _len > _i; _i++) deviceJson = _ref[_i], device = Device.create(deviceJson), result.push(device);
				return Log.d(result), onSuccess(result)
			}, onFail)
		}, DevicesApi.prototype.removeDevice = function(deviceId, onSuccess, onFail) {
			var token, url;
			return token = MasterToken.get(), url = "/json/users/" + token.userId + "/devices/" + deviceId + "/delete", Api.postAuth(url, {}, onSuccess, onFail)
		}, DevicesApi.prototype.setMultiDevicesEnabled = function(enable, onSuccess, onFail) {
			var token, url;
			return token = MasterToken.get(), url = "/json/users/" + token.userId + "/devices/", url += enable ? "enable" : "disable", Api.postAuth(url, {}, onSuccess, onFail)
		}, DevicesApi.prototype.getAddDeviceRequestInfo = function(onSuccess, onFail) {
			var masterToken, url;
			return masterToken = MasterToken.get(), url = "/json/users/" + masterToken.userId + "/devices/" + masterToken.deviceId + "/registration/pending", Api.getAuth(url, function(data) {
				return onSuccess(Api.camelizeResponse(data))
			}, onFail)
		}, DevicesApi.prototype.acceptMultiDeviceRequest = function(requestId, confirmationToken, onSuccess, onFail) {
			var masterToken, url;
			return masterToken = MasterToken.get(), url = "/json/users/" + masterToken.userId + "/devices/" + masterToken.deviceId + "/registration/" + requestId + "/confirm", Api.postAuth(url, {
				pin: confirmationToken
			}, onSuccess, onFail)
		}, DevicesApi.prototype.rejectMultiDeviceRequest = function(requestId, confirmationToken, onSuccess, onFail) {
			var masterToken, url;
			return masterToken = MasterToken.get(), url = "/json/users/" + masterToken.userId + "/devices/" + masterToken.deviceId + "/registration/" + requestId + "/reject", Api.postAuth(url, {
				pin: confirmationToken
			}, onSuccess, onFail)
		}, DevicesApi
	}()
}), define("models/api/registration_api", ["models/api/api", "models/api/constants"], function(Api, Constants) {
	var RegistrationApi;
	return RegistrationApi = function() {
		function RegistrationApi() {}
		return RegistrationApi.prototype.createAccount = function(countryCode, cellphone, email, onSuccess, onFail) {
			return Api.post("/json/users/new", {
				email: email,
				cellphone: cellphone,
				country_code: countryCode
			}, function(data) {
				return onSuccess(data.authy_id)
			}, onFail)
		}, RegistrationApi.prototype.getDeviceStatus = function(countryCode, cellPhone, onSuccess, onFail) {
			return Api.get("/json/users/" + countryCode + "-" + cellPhone + "/status", function(data) {
				return onSuccess(data.devices_count, data.message, data.authy_id)
			}, onFail)
		}, RegistrationApi.prototype.createNewDeviceRequest = function(userId, signature, via, onSuccess, onFail) {
			return Api.post("/json/users/" + userId + "/devices/registration/start", {
				via: via,
				signature: signature,
				api_key: Constants.API_KEY
			}, function(data) {
				return onSuccess(data.message, data.request_id, data.approval_pin, data.provider)
			}, onFail)
		}, RegistrationApi.prototype.getNewDeviceRequestStatus = function(userId, requestId, signature, onSuccess, onFail) {
			return Api.get("/json/users/" + userId + "/devices/registration/" + requestId + "/status", function(data) {
				return onSuccess(data.status, data.pin)
			}, onFail, {
				signature: signature
			})
		}, RegistrationApi.prototype.registerNewDevice = function(userId, confirmationCode, onSuccess, onFail) {
			return Api.post("/json/users/" + userId + "/devices/registration/complete", {
				pin: confirmationCode,
				device_app: Constants.getFlavor()
			}, function(data) {
				return onSuccess(data.authy_id, data.device.id, data.device.secret_seed)
			}, function(responseJSON) {
				return onFail(responseJSON)
			})
		}, RegistrationApi.prototype.checkSecretSeed = function(deviceId, appId, sha, onSuccess, onFail) {
			return Api.get("/json/devices/" + deviceId + "/soft_tokens/" + appId + "/check", onSuccess, onFail, {
				sha: sha
			})
		}, RegistrationApi
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("models/api/rsa_api", ["models/api/api", "models/api/constants", "models/apps/master_token", "helpers/crypto_helper"], function(Api, Constants, MasterToken, CryptoHelper) {
	var RSAApi;
	return RSAApi = function() {
		function RSAApi(authyRSAKey) {
			this.authyRSAKey = authyRSAKey, this.rotateSecretSeed = __bind(this.rotateSecretSeed, this)
		}
		return RSAApi.prototype.downloadPrivateKey = function(options) {
			var deviceId, masterToken, url;
			null == options && (options = {}), masterToken = MasterToken.get(), deviceId = masterToken.deviceId, url = "/json/devices/" + deviceId + "/rsa_key", Api.getAuth(url, function(data) {
				return options.onSuccess(data.private_key)
			}, options.onFail)
		}, RSAApi.prototype.checkPrivateKey = function(options) {
			var deviceId, masterToken, sha256, url;
			null == options && (options = {}), masterToken = MasterToken.get(), deviceId = masterToken.deviceId, sha256 = CryptoHelper.generateSHA256(options.privateKey), url = "/json/devices/" + deviceId + "/rsa_key_check", Api.getAuth(url, options.onSuccess, options.onFail, {
				sha: sha256
			})
		}, RSAApi.prototype.rotateSecretSeed = function(options) {
			var deviceId;
			null == options && (options = {}), deviceId = MasterToken.get().deviceId, this.authyRSAKey.encrypt(options.nonce, function(encryptedNonce) {
				var url;
				return url = "/json/devices/" + deviceId + "/rsa_key/rotate_secret_seed", Api.getAuth(url, function(data) {
					return options.onSuccess(data.encrypted_secret_seed)
				}, options.onFail, {
					encrypted_nonce: encryptedNonce
				})
			})
		}, RSAApi
	}()
}), define("models/api/sync_api", ["models/api/api", "models/apps/master_token"], function(Api, MasterToken) {
	var SyncApi;
	return SyncApi = function() {
		function SyncApi() {}
		return SyncApi.prototype.getSyncPassword = function(onSuccess, onFail) {
			var token, url;
			return token = MasterToken.get(), url = "/json/users/" + token.userId + "/authenticator_tokens/sync_password", Api.getAuth(url, function(data) {
				return onSuccess(Api.camelizeResponse(data))
			}, onFail)
		}, SyncApi.prototype.syncDeviceAuth = function(options, onSuccess, onFail) {
			var params, token, url;
			return null == options && (options = {}), token = MasterToken.get(), url = "/json/devices/" + token.deviceId + "/auth_sync", params = {
				ga_version: options.gaVersion
			}, null != options.gaTimestamp && (params.ga_timestamp = options.gaTimestamp), Api.getAuth(url, function(data) {
				return onSuccess(Api.camelizeResponse(data))
			}, onFail, params)
		}, SyncApi.prototype.syncDeviceNonAuth = function(options, onSuccess, onFail) {
			var params, token, url;
			return null == options && (options = {}), token = MasterToken.get(), url = "/json/devices/" + token.deviceId + "/non_auth_sync", params = {
				ga_version: options.gaVersion
			}, null != options.gaTimestamp && (params.ga_timestamp = options.gaTimestamp), Api.get(url, function(data) {
				return onSuccess(Api.camelizeResponse(data))
			}, onFail, params)
		}, SyncApi
	}()
}), define("models/apps/app", ["exceptions/unimplemented_method_exception"], function(UnimplementedMethodException) {
	var App;
	return App = function() {
		function App() {
			this.createdDate = (new Date).getTime()
		}
		return App.prototype.isEncrypted = function() {
			return !this.isDecrypted()
		}, App.prototype.getName = function() {
			throw new UnimplementedMethodException
		}, App.prototype.getOtp = function() {
			throw new UnimplementedMethodException
		}, App.prototype.isDecrypted = function() {
			throw new UnimplementedMethodException
		}, App.prototype.isMarkedForDeletion = function() {
			throw new UnimplementedMethodException
		}, App.prototype.isAuthenticatorAccount = function() {
			throw new UnimplementedMethodException
		}, App.prototype.getMenuImage = function() {
			throw new UnimplementedMethodException
		}, App.prototype.toJson = function() {
			throw new UnimplementedMethodException
		}, App.prototype.isSafe = function(cb) {
			throw new UnimplementedMethodException
		}, App.prototype.getAccountName = function() {
			throw new UnimplementedMethodException
		}, App.prototype.getId = function() {
			throw new UnimplementedMethodException
		}, App
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	}, __indexOf = [].indexOf || function(item) {
		for (var i = 0, l = this.length; l > i; i++)
			if (i in this && this[i] === item) return i;
		return -1
	};
define("models/apps/app_manager", ["models/encrypted_base_model", "ui/widgets/dialog", "models/api/apps_api", "models/apps/authy_app", "models/apps/google_auth_app", "workers/decrypt_apps_task", "helpers/app_helper", "models/storage/encryption_key", "models/apps/backups_password_model", "helpers/log", "helpers/date_helper"], function(EncryptedBaseModel, Dialog, AppsApi, AuthyApp, GoogleAuthApp, DecryptAppsTask, AppHelper, EncryptionKey, BackupsPasswordModel, Log, DateHelper) {
	var AppManager;
	return AppManager = function() {
		function AppManager() {}
		var AppManagerSingleton, instance;
		return instance = null, AppManagerSingleton = function(_super) {
			function AppManagerSingleton() {
				this.isLoadedToMemory = __bind(this.isLoadedToMemory, this), this.updateAppsBackupsState = __bind(this.updateAppsBackupsState, this), this.updateAuthenticatorAppsPasswordTimestamp = __bind(this.updateAuthenticatorAppsPasswordTimestamp, this), this.syncApps = __bind(this.syncApps, this), this.removeAppsMarkedForDeletion = __bind(this.removeAppsMarkedForDeletion, this), this.deleteApp = __bind(this.deleteApp, this), this.deleteAppOrMarkForDeletion = __bind(this.deleteAppOrMarkForDeletion, this);
				var self;
				AppManagerSingleton.__super__.constructor.call(this), this.model = [], this.appsApi = new AppsApi, self = this, AppHelper.subscribeToCloseAppEvent(this), EncryptionKey.addChangePasswordEventListener(this), BackupsPasswordModel.setAppManager(this), BackupsPasswordModel.get().addListener(function(data) {
					return self.updateAppsBackupsState(data.enabled)
				})
			}
			return __extends(AppManagerSingleton, _super), AppManagerSingleton.prototype.filterName = function(prefix) {
				return this.filter(function(app) {
					return app.getName().toLowerCase().indexOf(prefix) > -1
				})
			}, AppManagerSingleton.prototype.getAuthenticatorApps = function() {
				return this.filter(function(app) {
					return app.isAuthenticatorAccount()
				})
			}, AppManagerSingleton.prototype.getAuthyApps = function() {
				return this.filter(function(app) {
					return !app.isAuthenticatorAccount()
				})
			}, AppManagerSingleton.prototype.getEncryptedApps = function() {
				return this.filter(function(app) {
					return app.isEncrypted()
				})
			}, AppManagerSingleton.prototype.getMarkedForDeletionApps = function() {
				return this.filter(function(app) {
					return app.isMarkedForDeletion() && app.isAuthenticatorAccount()
				})
			}, AppManagerSingleton.prototype.getNotMarkedForDeletionApps = function() {
				var apps;
				return apps = this.filter(function(app) {
					return !app.isMarkedForDeletion()
				}), apps.sort(this.compareApps), apps
			}, AppManagerSingleton.prototype.getNotMarkedForDeletionAuthApps = function() {
				return this.filter(function(app) {
					return !app.isMarkedForDeletion() && app.isAuthenticatorAccount()
				})
			}, AppManagerSingleton.prototype.getDecryptedApps = function() {
				return this.filter(function(app) {
					return !app.isEncrypted()
				})
			}, AppManagerSingleton.prototype.getAuthyAppIds = function() {
				return this.filterIds(function(app) {
					return !app.isAuthenticatorAccount()
				})
			}, AppManagerSingleton.prototype.getAuthyAppServerIds = function() {
				return this.filterServerIds(function(app) {
					return !app.isAuthenticatorAccount()
				})
			}, AppManagerSingleton.prototype.getAuthenticatorAppIds = function() {
				return this.filterIds(function(app) {
					return app.isAuthenticatorAccount()
				})
			}, AppManagerSingleton.prototype.getAuthyAppAssetGroups = function() {
				var app, assetGroup, result, _i, _len, _ref;
				for (result = [], _ref = this.getAuthyApps(), _i = 0, _len = _ref.length; _len > _i; _i++) app = _ref[_i], assetGroup = app.assetsGroup, null != assetGroup && -1 === result.indexOf(assetGroup) && result.push(assetGroup);
				return result
			}, AppManagerSingleton.prototype.getApps = function() {
				return this.getModel()
			}, AppManagerSingleton.prototype.size = function() {
				return this.getModel().length
			}, AppManagerSingleton.prototype.areAllAppsDecrypted = function() {
				return 0 === this.getEncryptedApps().length
			}, AppManagerSingleton.prototype.find = function(id) {
				var result;
				return result = this.filter(function(app) {
					return app.getId() === id
				}), result.length > 0 ? result[0] : null
			}, AppManagerSingleton.prototype.findByServerId = function(serverId) {
				var result;
				return result = this.filter(function(app) {
					return !app.isAuthenticatorAccount() && app.getServerId() === serverId
				}), result.length > 0 ? result[0] : null
			}, AppManagerSingleton.prototype.filter = function(iterator) {
				var app, result, _i, _len, _ref;
				for (result = [], _ref = this.model, _i = 0, _len = _ref.length; _len > _i; _i++) app = _ref[_i], iterator(app) && result.push(app);
				return result
			}, AppManagerSingleton.prototype.filterIds = function(iterator) {
				var app, result, _i, _len, _ref;
				for (result = [], _ref = this.model, _i = 0, _len = _ref.length; _len > _i; _i++) app = _ref[_i], iterator(app) && result.push(app.getId());
				return result
			}, AppManagerSingleton.prototype.filterServerIds = function(iterator) {
				var app, result, _i, _len, _ref;
				for (result = [], _ref = this.model, _i = 0, _len = _ref.length; _len > _i; _i++) app = _ref[_i], iterator(app) && "_id" in app && result.push(app._id);
				return result
			}, AppManagerSingleton.prototype.addApp = function(app) {
				return this.contains(app.getId()) ? void 0 : this.model.push(app)
			}, AppManagerSingleton.prototype.addAll = function(appList) {
				var app, _i, _len, _results;
				for (_results = [], _i = 0, _len = appList.length; _len > _i; _i++) app = appList[_i], _results.push(this.addApp(app));
				return _results
			}, AppManagerSingleton.prototype.contains = function(id) {
				return -1 !== this.indexOf(id)
			}, AppManagerSingleton.prototype.indexOf = function(appId) {
				var app, index, _i, _len, _ref;
				for (_ref = this.model, index = _i = 0, _len = _ref.length; _len > _i; index = ++_i)
					if (app = _ref[index], app.getId() === appId) return index;
				return -1
			}, AppManagerSingleton.prototype.remove = function(id) {
				var index;
				return index = this.indexOf(id), -1 !== index ? (this.model.splice(index, 1), !0) : !1
			}, AppManagerSingleton.prototype.removeAllEncryptedApps = function() {
				var app, _i, _len, _ref, _results;
				for (_ref = this.getEncryptedApps(), _results = [], _i = 0, _len = _ref.length; _len > _i; _i++) app = _ref[_i], _results.push(this.remove(app.getId()));
				return _results
			}, AppManagerSingleton.prototype.removeAll = function(appIds) {
				var id, _i, _len, _results;
				for (_results = [], _i = 0, _len = appIds.length; _len > _i; _i++) id = appIds[_i], _results.push(this.remove(id));
				return _results
			}, AppManagerSingleton.prototype.clear = function() {
				return this.model = []
			}, AppManagerSingleton.prototype.createAuthenticatorApp = function(secret) {
				var app;
				return this.areAllAppsDecrypted() ? (app = GoogleAuthApp.fromSecret(secret), app.setPasswordTimestamp(this.getPasswordTimestamp()), this.updateEncryptedSeed(app), this.addApp(app), app.getId()) : (Log.w("User tried to add authenticator account without decrypting all apps"), null)
			}, AppManagerSingleton.prototype.deleteAppOrMarkForDeletion = function(appId, onSuccess, onFailDelete, onFail) {
				var app, self;
				return null == onFail && (onFail = function() {}), self = this, app = this.find(appId), null != app ? app.isDecrypted() ? (this.markAppForDeletion(app, !0), onSuccess(!1)) : Dialog.show(Dialog.LIGHT, "Since this account is encrypted it will be deleted immediatly. Do you want to proceed?", function() {
					return self.deleteApp(app, function() {
						return onSuccess(!0)
					}, function() {
						return self.markAppForDeletion(app, !0), app.setDeleteDate(new Date), self.saveAndNotifyListeners(), Log.w("The encrypted app " + appId + " could not be deleted and has been marked for immediate deletion."), onFailDelete()
					})
				}) : (Log.e("Could not delete app: App " + appId + " does not exist."), onFail())
			}, AppManagerSingleton.prototype.markAppForDeletion = function(app, markedForDeletion) {
				var mark;
				return null != app ? (app.setMarkedForDeletion(markedForDeletion), this.saveAndNotifyListeners(), !0) : (mark = markedForDeletion ? "mark" : "unmark", Log.e("Could not " + mark + " app for deletion: App " + app.getId() + " does not exist."), !1)
			}, AppManagerSingleton.prototype.deleteApp = function(app, onSuccess, onFail) {
				var self;
				return null == onFail && (onFail = function() {}), self = this, null != app ? this.appsApi.deleteAuthenticatorApp(app.uniqueId, function() {
					return self.remove(app.getId()), self.saveAndNotifyListeners(), onSuccess()
				}, function(response) {
					return Log.w("Could not delete app " + app.getId() + ": " + response.message), onFail()
				}) : void 0
			}, AppManagerSingleton.prototype.removeAppsMarkedForDeletion = function() {
				var app, now, removed, _i, _len, _ref;
				for (now = (new Date).getTime(), removed = !1, _ref = this.getMarkedForDeletionApps(), _i = 0, _len = _ref.length; _len > _i; _i++) app = _ref[_i], now >= app.deleteDate && (this.deleteApp(app, function() {
					return Log.d("Successfully deleted and removed app " + app.getId() + " at " + now)
				}), removed = !0);
				return removed ? this.saveAndNotifyListeners() : void 0
			}, AppManagerSingleton.prototype.syncApps = function(options) {
				var self;
				return null == options && (options = {}), self = this, this.isLoadedToMemory() ? this.performSync(options) : this.loadLocal(function() {
					return self.performSync(options)
				})
			}, AppManagerSingleton.prototype.performSync = function(options) {
				var authenticatorAppsFailed, authenticatorAppsSyncd, authyAppsFailed, authyAppsSyncd, onFail, onSuccess, self;
				return null == options && (options = {}), self = this, onSuccess = options.onSuccess || function() {}, onFail = options.onFail || function() {}, authyAppsSyncd = !1, authenticatorAppsSyncd = !1, authyAppsFailed = !1, authenticatorAppsFailed = !1, this.syncAuthyApps({
					onSuccess: function() {
						return authyAppsSyncd = !0, authyAppsSyncd && authenticatorAppsSyncd ? (self.saveAndNotifyListeners(), onSuccess()) : void 0
					},
					onFail: function() {
						return authyAppsFailed = !0, authenticatorAppsFailed ? void 0 : onFail()
					}
				}), this.syncAuthenticatorApps({
					onSuccess: function() {
						return authenticatorAppsSyncd = !0, authyAppsSyncd && authenticatorAppsSyncd ? (self.saveAndNotifyListeners(), onSuccess()) : void 0
					},
					onFail: function() {
						return authenticatorAppsFailed = !0, authyAppsFailed ? void 0 : onFail()
					}
				})
			}, AppManagerSingleton.prototype.saveAndNotifyListeners = function(data) {
				return this.save(function() {}), this.notifyListeners(data)
			}, AppManagerSingleton.prototype.syncAuthyApps = function(options) {
				var onFail, onSuccess, self;
				return self = this, onSuccess = options.onSuccess || function() {}, onFail = options.onFail || function() {}, this.appsApi.syncAuthyApps(this.getAuthyApps(), function(tokensData, deletedApps) {
					var app, authyAppIds, authyApps, token, _i, _len, _ref;
					for (authyApps = [], authyAppIds = self.getAuthyAppServerIds(), _i = 0, _len = tokensData.length; _len > _i; _i++) token = tokensData[_i], _ref = token._id, __indexOf.call(authyAppIds, _ref) >= 0 ? (app = self.findByServerId(token._id), app.update(token), null != token.secret_seed && (app.setSecretSeed(token.secret_seed), app.validateAndLock())) : (app = AuthyApp.create(token), app.validateAndLock()), authyApps.push(app);
					return self.addAll(authyApps), self.removeAll(deletedApps.map(function(uniqueId) {
						return AuthyApp.getLocalId(uniqueId)
					})), onSuccess()
				}, onFail)
			}, AppManagerSingleton.prototype.syncAuthenticatorApps = function(options) {
				var app, appIds, apps, onDecryptFail, onDecryptSuccess, onFail, onSuccess, self, _i, _len;
				for (self = this, onSuccess = options.onSuccess || function() {}, onFail = options.onFail || function() {}, onDecryptSuccess = options.onDecryptSuccess || function() {}, onDecryptFail = options.onDecryptFail || function() {}, apps = this.getAuthenticatorApps(), appIds = [], _i = 0, _len = apps.length; _len > _i; _i++) app = apps[_i], appIds.push(app.uniqueId);
				return this.appsApi.syncAuthenticatorApps(appIds, function(authenticatorApps, deletedAppIds) {
					var _j, _len1;
					for (deletedAppIds = self.getAppsToRemoveFromSync(deletedAppIds), self.removeAll(deletedAppIds), _j = 0, _len1 = authenticatorApps.length; _len1 > _j; _j++) app = authenticatorApps[_j], app.setUploadState(GoogleAuthApp.UPLOADED);
					return self.addAll(authenticatorApps), BackupsPasswordModel.whenPasswordLoaded(function(password) {
						return self.decryptApps(password, function() {
							return self.saveAndNotifyListeners({
								invalidateCache: !0
							}), onDecryptSuccess()
						}, onDecryptFail)
					}), onSuccess()
				}, onFail)
			}, AppManagerSingleton.prototype.getAppsToRemoveFromSync = function(serverIds) {
				var appIds, appsToDelete, self;
				return self = this, appIds = serverIds.map(function(serverId) {
					return GoogleAuthApp.getLocalId(serverId)
				}), appsToDelete = appIds.map(function(appId) {
					return self.find(appId)
				}), appsToDelete = _.filter(appsToDelete, function(app) {
					return null != app && app.isUploaded && app.isUploaded()
				}), appsToDelete.map(function(i) {
					return i.getId()
				})
			}, AppManagerSingleton.prototype.getPasswordTimestamp = function() {
				var apps;
				return apps = this.getAuthenticatorApps(), this.isAnyPasswordTimestampNull() ? null : apps.length > 0 ? apps[0].passwordTimestamp : null
			}, AppManagerSingleton.prototype.getAnyPasswordTimestamp = function() {
				var app, _i, _len, _ref;
				for (_ref = this.getAuthenticatorApps(), _i = 0, _len = _ref.length; _len > _i; _i++)
					if (app = _ref[_i], null != app.passwordTimestamp) return app.passwordTimestamp;
				return null
			}, AppManagerSingleton.prototype.isAnyPasswordTimestampNull = function() {
				var app, _i, _len, _ref;
				for (_ref = this.getAuthenticatorApps(), _i = 0, _len = _ref.length; _len > _i; _i++)
					if (app = _ref[_i], null == app.passwordTimestamp) return !0;
				return !1
			}, AppManagerSingleton.prototype.areAllPasswordTimestampsNull = function() {
				var app, _i, _len, _ref;
				for (_ref = this.getAuthenticatorApps(), _i = 0, _len = _ref.length; _len > _i; _i++)
					if (app = _ref[_i], null != app.passwordTimestamp) return !1;
				return !0
			}, AppManagerSingleton.prototype.updateAuthenticatorAppsPasswordTimestamp = function(timestamp) {
				var authenticatorApp, _i, _len, _ref, _results;
				for (_ref = this.getAuthenticatorApps(), _results = [], _i = 0, _len = _ref.length; _len > _i; _i++) authenticatorApp = _ref[_i], _results.push(authenticatorApp.setPasswordTimestamp(timestamp));
				return _results
			}, AppManagerSingleton.prototype.uploadAuthenticatorApps = function() {
				var app, self, _i, _len, _ref, _results;
				for (self = this, this.areAllPasswordTimestampsNull() && this.updateAuthenticatorAppsPasswordTimestamp(DateHelper.getTimestampSeconds()), this.isAnyPasswordTimestampNull() && this.updateAuthenticatorAppsPasswordTimestamp(this.getAnyPasswordTimestamp()), _ref = self.getNotMarkedForDeletionAuthApps(), _results = [], _i = 0, _len = _ref.length; _len > _i; _i++) app = _ref[_i], app.isDecrypted() ? _results.push(self.uploadAuthenticatorApp(app)) : _results.push(void 0);
				return _results
			}, AppManagerSingleton.prototype.uploadAuthenticatorApp = function(app) {
				var self;
				return self = this, app.setUploadState(GoogleAuthApp.UPLOADING), BackupsPasswordModel.areBackupsEnabled(function(areEnabled) {
					return areEnabled ? self.appsApi.uploadAuthenticatorApp(app, function() {
						return app.setUploadState(GoogleAuthApp.UPLOADED), self.notifyListeners({
							onlyImages: !0
						})
					}) : app.setUploadState(GoogleAuthApp.NOT_UPLOADED)
				})
			}, AppManagerSingleton.prototype.updateAppsBackupsState = function(enabled) {
				var app, _i, _len, _ref;
				for (_ref = this.getAuthenticatorApps(), _i = 0, _len = _ref.length; _len > _i; _i++) app = _ref[_i], enabled === !1 && app.setUploadState(GoogleAuthApp.NOT_UPLOADED), enabled === !0 && app.setUploadState(GoogleAuthApp.UPLOADED);
				return this.save()
			}, AppManagerSingleton.prototype.decryptApps = function(password, onSuccess, onFail) {
				var encryptedApps, self;
				return self = this, encryptedApps = this.getEncryptedApps(), new DecryptAppsTask(password, encryptedApps, function(error, decryptedApps) {
					var app, decrypted, _i, _len;
					if (null != error) onFail();
					else {
						for (_i = 0, _len = decryptedApps.length; _len > _i; _i++) decrypted = decryptedApps[_i], app = self.find(decrypted.id), app.setDecryptedSeed(decrypted.decryptedSeed);
						onSuccess()
					}
				})
			}, AppManagerSingleton.prototype.updateEncryptedSeeds = function() {
				var authenticatorApps, self;
				return self = this, authenticatorApps = this.getAuthenticatorApps(), this.areAllAppsDecrypted() ? BackupsPasswordModel.isPasswordSet(function(isSet) {
					var app, password, _i, _len;
					if (isSet) {
						for (password = BackupsPasswordModel.get().model.password, _i = 0, _len = authenticatorApps.length; _len > _i; _i++) app = authenticatorApps[_i], app.setEncryptedSeed(password);
						return self.saveAndNotifyListeners()
					}
				}) : void 0
			}, AppManagerSingleton.prototype.updateEncryptedSeed = function(app) {
				return BackupsPasswordModel.isPasswordSet(function(isSet) {
					var password;
					return isSet ? (password = BackupsPasswordModel.get().model.password, app.setEncryptedSeed(password)) : void 0
				})
			}, AppManagerSingleton.prototype.compareApps = function(app1, app2) {
				return app1.getName().toLowerCase() < app2.getName().toLowerCase() ? -1 : app1.getName().toLowerCase() > app2.getName().toLowerCase() ? 1 : 0
			}, AppManagerSingleton.prototype.getStorageLocation = function() {
				return "authy.storage.AppManager"
			}, AppManagerSingleton.prototype.toJson = function() {
				var app, authenticatorAppsJson, authyAppsJson, _i, _j, _len, _len1, _ref, _ref1;
				for (authyAppsJson = [], authenticatorAppsJson = [], _ref = this.getAuthenticatorApps(), _i = 0, _len = _ref.length; _len > _i; _i++) app = _ref[_i], authenticatorAppsJson.push(app.toJson());
				for (_ref1 = this.getAuthyApps(), _j = 0, _len1 = _ref1.length; _len1 > _j; _j++) app = _ref1[_j], authyAppsJson.push(app.toJson());
				return {
					authyApps: authyAppsJson,
					authenticatorApps: authenticatorAppsJson
				}
			}, AppManagerSingleton.prototype.fromJson = function(json) {
				var apps, authenticatorApps, authyApps, jsonApp, _i, _j, _len, _len1;
				for (authyApps = json.authyApps, authenticatorApps = json.authenticatorApps, apps = [], _i = 0, _len = authyApps.length; _len > _i; _i++) jsonApp = authyApps[_i], apps.push(AuthyApp.fromJson(jsonApp));
				for (_j = 0, _len1 = authenticatorApps.length; _len1 > _j; _j++) jsonApp = authenticatorApps[_j], apps.push(GoogleAuthApp.fromJson(jsonApp));
				return apps
			}, AppManagerSingleton.prototype.isLoadedToMemory = function() {
				return null != this.model ? this.loadedToMemory || this.model.length > 0 : !1
			}, AppManagerSingleton.prototype.cleanUpBeforeClose = function(cb) {
				var self;
				return self = this, this.save(function() {
					return self.clear(), self.loadedToMemory = !1, cb()
				})
			}, AppManagerSingleton
		}(EncryptedBaseModel), AppManager.get = function() {
			return null != instance ? instance : instance = new AppManagerSingleton
		}, AppManager.create = function() {
			return new AppManagerSingleton
		}, window.appManager = AppManager.get(), AppManager
	}.call(this)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("models/apps/authy_app", ["models/otp_generator/authy_otp_generator", "models/assets/asset_manager", "helpers/log", "models/api/registration_api", "helpers/crypto_helper", "models/apps/app", "models/apps/master_token", "models/security/phishing_detector"], function(AuthyOtpGenerator, AssetManager, Log, RegistrationApi, CryptoHelper, App, MasterToken, PhishingDetector) {
	var AuthyApp;
	return AuthyApp = function(_super) {
		function AuthyApp() {
			this.getAccountName = __bind(this.getAccountName, this), this.isSafe = __bind(this.isSafe, this), this.needsHealthCheck = __bind(this.needsHealthCheck, this), this.validateAndLock = __bind(this.validateAndLock, this), AuthyApp.__super__.constructor.apply(this, arguments), this.regApi = new RegistrationApi, this.lastCheck = null
		}
		return __extends(AuthyApp, _super), AuthyApp.ID_PREFIX = "AuthyApp-", AuthyApp.getLocalId = function(uniqueId) {
			return "" + AuthyApp.ID_PREFIX + uniqueId
		}, AuthyApp.create = function(hash) {
			var app;
			return app = new AuthyApp, app.setId(hash._id), app.setAssetsGroup(hash.assets_group), app.setBackgroundColor(hash.background_color), app.setCircleBackground(hash.circle_background), app.setCircleColor(hash.circle_color), app.setLabelsColor(hash.labels_color), app.setLabelsShadowColor(hash.labels_shadow_color), app.setName(hash.name), app.setSerialId(hash.serial_id), app.setTimerColor(hash.timer_color), app.setVersion(hash.version), app.setAuthyId(hash.authy_id), app.setSecretSeed(hash.secret_seed), app
		}, AuthyApp.prototype.update = function(hash) {
			return this.setName(hash.name), this.setAssetsGroup(hash.assets_group), this.setBackgroundColor(hash.background_color), this.setCircleBackground(hash.circle_background), this.setCircleColor(hash.circle_color), this.setLabelsColor(hash.labels_color), this.setLabelsShadowColor(hash.labels_shadow_color), this.setTimerColor(hash.timer_color), this.setVersion(hash.version)
		}, AuthyApp.prototype.setLastCheckDate = function(date) {
			return this.lastCheck = date
		}, AuthyApp.prototype.isValid = function() {
			return null == this.serialId ? (Log.w("The secret key is wrong because the id is not set."), !1) : null == this.secretSeed ? (Log.w("The secret key is wrong because the secretKey is empty."), !1) : !0
		}, AuthyApp.prototype.validateAndLock = function() {
			var self, sha;
			return self = this, this.isValid() ? (sha = CryptoHelper.generateSHA256(this.secretSeed), this.regApi.checkSecretSeed(MasterToken.get().deviceId, this.authyId, sha, function(response) {
				return Log.d("Secret seed verified for " + self.name + ": " + response.message), self.setLastCheckDate(new Date)
			}, function(response) {
				return Log.e("Secret seed verification failed for " + self.name + ": " + response.message)
			})) : Log.w("Cannot perform health check on " + self.name)
		}, AuthyApp.prototype.needsHealthCheck = function() {
			var daysDiff;
			return null === this.lastCheck ? !0 : (daysDiff = parseInt("" + ((new Date).getTime() - this.lastCheck.getTime()) / 1e3 / 86400, 10), daysDiff >= 30 ? (Log.d("Performing health check. Days since the last check: " + daysDiff), !0) : (Log.d("Skipping health check. Days since the last check: " + daysDiff), !1))
		}, AuthyApp.prototype.getName = function() {
			return this.name
		}, AuthyApp.prototype.getOtp = function() {
			return this.otpGenerator.getOtp()
		}, AuthyApp.prototype.getServerId = function() {
			return this._id
		}, AuthyApp.prototype.isDecrypted = function() {
			return !0
		}, AuthyApp.prototype.isMarkedForDeletion = function() {
			return !1
		}, AuthyApp.prototype.isAuthenticatorAccount = function() {
			return !1
		}, AuthyApp.prototype.getMenuImage = function() {
			return AssetManager.get().getMenuItemUrl(this.assetsGroup)
		}, AuthyApp.prototype.setId = function(_id) {
			return this._id = _id
		}, AuthyApp.prototype.setSerialId = function(serialId) {
			return this.serialId = serialId
		}, AuthyApp.prototype.setSecretSeed = function(secretSeed) {
			return this.secretSeed = secretSeed, this.otpGenerator = new AuthyOtpGenerator(this.secretSeed, !1)
		}, AuthyApp.prototype.setVersion = function(version) {
			return this.version = version
		}, AuthyApp.prototype.setName = function(name) {
			return this.name = name
		}, AuthyApp.prototype.setAuthyId = function(authyId) {
			return this.authyId = authyId
		}, AuthyApp.prototype.setAssetsGroup = function(assetsGroup) {
			return this.assetsGroup = assetsGroup
		}, AuthyApp.prototype.setBackgroundColor = function(backgroundColor) {
			return this.backgroundColor = backgroundColor
		}, AuthyApp.prototype.setCircleBackground = function(circleBackground) {
			return this.circleBackground = circleBackground
		}, AuthyApp.prototype.setCircleColor = function(circleColor) {
			return this.circleColor = circleColor
		}, AuthyApp.prototype.setLabelsColor = function(labelsColor) {
			return this.labelsColor = labelsColor
		}, AuthyApp.prototype.setLabelsShadowColor = function(labelsShadowColor) {
			return this.labelsShadowColor = labelsShadowColor
		}, AuthyApp.prototype.setTimerColor = function(timerColor) {
			return this.timerColor = timerColor
		}, AuthyApp.prototype.setTokenColor = function(tokenColor) {
			return this.tokenColor = tokenColor
		}, AuthyApp.prototype.toJson = function() {
			return {
				type: "AuthyApp",
				_id: this._id,
				serialId: this.serialId,
				authyId: this.authyId,
				secretSeed: this.secretSeed,
				version: this.version,
				name: this.name,
				assetsGroup: this.assetsGroup,
				backgroundColor: this.backgroundColor,
				circleBackground: this.circleBackground,
				circleColor: this.circleColor,
				labelsColor: this.labelsColor,
				labelsShadowColor: this.labelsShadowColor,
				timerColor: this.timerColor,
				tokenColor: this.tokenColor,
				createdDate: this.createdDate
			}
		}, AuthyApp.fromJson = function(json) {
			var app;
			return app = new AuthyApp, app.setId(json._id), app.setSerialId(json.serialId), app.setAuthyId(json.authyId), app.setSecretSeed(json.secretSeed), app.setVersion(json.version), app.setName(json.name), app.createdDate = json.createdDate, app.setAssetsGroup(json.assetsGroup), app.setBackgroundColor(json.backgroundColor), app.setCircleBackground(json.circleBackground), app.setCircleColor(json.circleColor), app.setLabelsColor(json.labelsColor), app.setLabelsShadowColor(json.labelsShadowColor), app.setTimerColor(json.timerColor), app.setTokenColor(json.tokenColor), app
		}, AuthyApp.prototype.isSafe = function(cb) {
			return PhishingDetector.isAccountSafe(this.getName(), this.getName(), cb)
		}, AuthyApp.prototype.getAccountName = function() {
			return _.str.titleize(_.str.humanize(this.getName()))
		}, AuthyApp.prototype.getId = function() {
			return "" + AuthyApp.ID_PREFIX + this._id
		}, AuthyApp
	}(App)
}), define("models/apps/authy_rsa_key", ["/js/vendor/forge.js", "models/api/rsa_api", "helpers/log", "models/storage/encrypted_storage", "models/storage/encryption_key"], function(forge, RSAApi, Log, EncryptedStorage, EncryptionKey) {
	var AuthyRSAKey;
	return AuthyRSAKey = function() {
		function AuthyRSAKey() {}
		var Api, Storage;
		return Storage = EncryptedStorage, Api = RSAApi, AuthyRSAKey.STORAGE_KEY = "authy.RSAKey", AuthyRSAKey.PRIVATE_KEY = null, EncryptionKey.addChangePasswordEventListener(AuthyRSAKey), AuthyRSAKey.downloadPrivateKey = function(options) {
			var self;
			null == options && (options = {}), self = this, this.isConfigured(function(isConfigured) {
				var rsaApi;
				return isConfigured ? Log.d("Skipping downloading key because it's already downloaded.") : (rsaApi = new Api(self), rsaApi.downloadPrivateKey({
					onSuccess: function(privateKey) {
						return AuthyRSAKey.checkAndStorePrivateKey({
							privateKey: privateKey
						})
					},
					onFail: function(data) {
						return Log.e("Failed to download rsa key: " + data.message)
					}
				}))
			})
		}, AuthyRSAKey.checkAndStorePrivateKey = function(options) {
			var onFail, onSuccess, privateKey, rsaApi;
			onSuccess = options.onSuccess || function() {}, onFail = options.onFail || function() {}, privateKey = options.privateKey, rsaApi = new Api(this), rsaApi.checkPrivateKey({
				privateKey: privateKey,
				onSuccess: function(data) {
					return AuthyRSAKey.PRIVATE_KEY = privateKey, AuthyRSAKey.save(), onSuccess()
				},
				onFail: function(data) {
					return Log.d("Failed to check rsa key: " + data), onFail(data)
				}
			})
		}, AuthyRSAKey.getPrivateKey = function(cb) {
			return Storage.load(AuthyRSAKey.STORAGE_KEY, function(key) {
				return AuthyRSAKey.PRIVATE_KEY = key, cb(key)
			})
		}, AuthyRSAKey.encrypt = function(data, cb) {
			return this.getPrivateKey(function(key) {
				var encryptedData, rsaKey;
				return rsaKey = forge.pki.privateKeyFromPem(key), encryptedData = forge.util.encode64(forge.rsa.encrypt(data, rsaKey, 1)), cb(encryptedData)
			})
		}, AuthyRSAKey.decrypt = function(encryptedData, cb) {
			return this.getPrivateKey(function(key) {
				var decryptedData, rsaKey;
				return rsaKey = forge.pki.privateKeyFromPem(key), decryptedData = forge.rsa.decrypt(forge.util.decode64(encryptedData), rsaKey, !1), cb(decryptedData)
			})
		}, AuthyRSAKey.isConfigured = function(cb) {
			return this.getPrivateKey(function(key) {
				return cb(null != key)
			})
		}, AuthyRSAKey.save = function(cb) {
			return null == cb && (cb = function() {}), null != AuthyRSAKey.PRIVATE_KEY ? Storage.save(AuthyRSAKey.STORAGE_KEY, AuthyRSAKey.PRIVATE_KEY, function() {
				return Log.d("Private key was saved!"), cb()
			}) : (Log.w("Skipping save for AuthyRSAKey since it hasn't been loaded into memory."), cb())
		}, AuthyRSAKey.setStorage = function(storageClass) {
			return Storage = storageClass
		}, AuthyRSAKey.getStorage = function() {
			return Storage
		}, AuthyRSAKey.setApi = function(apiClass) {
			return Api = apiClass
		}, AuthyRSAKey.getApi = function() {
			return Api
		}, AuthyRSAKey
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("models/apps/backups_password_model", ["models/encrypted_base_model", "helpers/app_helper", "models/storage/encryption_key", "helpers/log", "helpers/date_helper"], function(EncryptedBaseModel, AppHelper, EncryptionKey, Log, DateHelper) {
	var BackupsPasswordModel;
	return BackupsPasswordModel = function() {
		function BackupsPasswordModel() {}
		var BackupsPasswordModelSingleton, appManager, instance;
		return instance = null, appManager = null, BackupsPasswordModelSingleton = function(_super) {
			function BackupsPasswordModelSingleton() {
				this.cleanUpBeforeClose = __bind(this.cleanUpBeforeClose, this), this.isLoadedToMemory = __bind(this.isLoadedToMemory, this), this.areBackupsEnabled = __bind(this.areBackupsEnabled, this), BackupsPasswordModelSingleton.__super__.constructor.call(this), AppHelper.subscribeToCloseAppEvent(this), EncryptionKey.addChangePasswordEventListener(this)
			}
			return __extends(BackupsPasswordModelSingleton, _super), BackupsPasswordModelSingleton.prototype.areBackupsEnabled = function() {
				return this.model.enabled
			}, BackupsPasswordModelSingleton.prototype.setPassword = function(password, cb) {
				return null == cb && (cb = function() {}), null == this.model && (this.model = {}), this.model.password = password, this.model.enabled = !0, this.save(function() {
					return Log.d("New backups password saved"), cb()
				})
			}, BackupsPasswordModelSingleton.prototype.isPasswordSet = function() {
				return null != this.model.password
			}, BackupsPasswordModelSingleton.prototype.setEnabled = function(enabled, cb) {
				var self;
				return null == cb && (cb = function() {}), self = this, this.model.enabled = enabled, enabled || (this.model.password = null), this.save(function() {
					return self.notifyListeners({
						enabled: enabled
					}), Log.d("Backups password enabled is now set to " + enabled + " and saved"), cb()
				})
			}, BackupsPasswordModelSingleton.prototype.getStorageLocation = function() {
				return "authy.storage.backupspassword"
			}, BackupsPasswordModelSingleton.prototype.toJson = function() {
				var json;
				return json = {
					password: this.model.password,
					enabled: this.model.enabled
				}
			}, BackupsPasswordModelSingleton.prototype.fromJson = function(data) {
				return data
			}, BackupsPasswordModelSingleton.prototype.fetch = function(onSuccess, onError) {
				return onSuccess()
			}, BackupsPasswordModelSingleton.prototype.isLoadedToMemory = function() {
				return this.loadedToMemory || null != this.model
			}, BackupsPasswordModelSingleton.prototype.cleanUpBeforeClose = function(cb) {
				var self;
				return self = this, this.save(function() {
					return self.model = null, self.loadedToMemory = !1, cb()
				})
			}, BackupsPasswordModelSingleton
		}(EncryptedBaseModel), BackupsPasswordModel.get = function() {
			return null == instance && (instance = new BackupsPasswordModelSingleton), instance
		}, BackupsPasswordModel.getAppManager = function() {
			return appManager
		}, BackupsPasswordModel.setAppManager = function(manager) {
			return appManager = manager
		}, BackupsPasswordModel.areBackupsEnabled = function(cb) {
			var model;
			return model = BackupsPasswordModel.get(), model.isLoadedToMemory() ? cb(model.areBackupsEnabled()) : model.loadLocal(function() {
				return cb(model.isLoadedToMemory() ? model.areBackupsEnabled() : !1)
			})
		}, BackupsPasswordModel.whenPasswordLoaded = function(callback) {
			return BackupsPasswordModel.isPasswordSet(function(isSet) {
				var password;
				return isSet ? (password = BackupsPasswordModel.get().model.password, callback(password)) : void 0
			})
		}, BackupsPasswordModel.setPassword = function(password, cb) {
			var model;
			return null == cb && (cb = function() {}), model = BackupsPasswordModel.get(), model.isLoadedToMemory() ? model.setPassword(password, cb) : model.loadLocal(function() {
				return model.setPassword(password, cb)
			})
		}, BackupsPasswordModel.setEnabled = function(enabled, cb) {
			var model;
			return null == cb && (cb = function() {}), model = BackupsPasswordModel.get(), model.isLoadedToMemory() && model.isPasswordSet() ? model.setEnabled(enabled, cb) : model.loadLocal(function() {
				if (model.isLoadedToMemory() && model.isPasswordSet()) return model.setEnabled(enabled, cb);
				throw new Error("Can not set enabled flag. Backups Password has not been set")
			})
		}, BackupsPasswordModel.isPasswordSet = function(cb) {
			var model;
			return model = BackupsPasswordModel.get(), model.isLoadedToMemory() && model.isPasswordSet() ? cb(!0) : model.loadLocal(function() {
				return cb(model.isLoadedToMemory() && model.isPasswordSet() ? !0 : !1)
			})
		}, BackupsPasswordModel.changePassword = function(newPassword, options) {
			var cb, onFail, timestamp;
			return null == options && (options = {}), timestamp = options.timestamp || DateHelper.getTimestampSeconds(), cb = options.cb || function() {}, onFail = options.onFail || function() {}, BackupsPasswordModel.setPassword(newPassword, function() {
				return appManager.removeAllEncryptedApps(), appManager.syncAuthenticatorApps({
					onDecryptSuccess: function() {
						return appManager.updateAuthenticatorAppsPasswordTimestamp(timestamp), appManager.updateEncryptedSeeds(), appManager.uploadAuthenticatorApps(), appManager.save(), cb()
					},
					onDecryptFail: function() {
						return onFail()
					}
				})
			})
		}, BackupsPasswordModel.getPassword = function(cb) {
			return BackupsPasswordModel.isPasswordSet(function(isSet) {
				return cb(isSet ? BackupsPasswordModel.get().model.password : null)
			})
		}, BackupsPasswordModel.createNew = function() {
			return instance = new BackupsPasswordModelSingleton
		}, BackupsPasswordModel
	}.call(this)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("models/apps/google_auth_app", ["models/otp_generator/google_authenticator_otp_generator", "models/assets/asset_manager", "models/apps/app", "helpers/crypto_helper", "helpers/date_helper", "models/security/phishing_detector", "helpers/encoder"], function(GoogleAuthenticatorOtpGenerator, AssetManager, App, CryptoHelper, DateHelper, PhishingDetector, Encoder) {
	var GoogleAuthApp;
	return GoogleAuthApp = function(_super) {
		function GoogleAuthApp() {
			this.getAccountName = __bind(this.getAccountName, this), this.isSafe = __bind(this.isSafe, this), this.setMarkedForDeletion = __bind(this.setMarkedForDeletion, this), this.isDecrypted = __bind(this.isDecrypted, this), this.setPasswordTimestamp = __bind(this.setPasswordTimestamp, this), this.setEncryptedSeed = __bind(this.setEncryptedSeed, this), this.setDecryptedSeed = __bind(this.setDecryptedSeed, this), GoogleAuthApp.__super__.constructor.apply(this, arguments), this.otpGenerator = new GoogleAuthenticatorOtpGenerator, this.setUploadState(GoogleAuthApp.NOT_UPLOADED)
		}
		return __extends(GoogleAuthApp, _super), GoogleAuthApp.UPLOADING = "uploading", GoogleAuthApp.UPLOADED = "uploaded", GoogleAuthApp.NOT_UPLOADED = "not_uploaded", GoogleAuthApp.STATES = [GoogleAuthApp.UPLOADING, GoogleAuthApp.UPLOADED, GoogleAuthApp.NOT_UPLOADED], GoogleAuthApp.HOURS_BEFORE_DELETION = 48, GoogleAuthApp.ID_PREFIX = "GoogleAuthApp-", GoogleAuthApp.getLocalId = function(uniqueId) {
			return "" + GoogleAuthApp.ID_PREFIX + uniqueId
		}, GoogleAuthApp.create = function(hash) {
			var app;
			return app = new GoogleAuthApp, app.accountType = hash.account_type, app.encryptedSeed = hash.encrypted_seed, app.name = hash.name, app.originalName = hash.original_name, app.passwordTimestamp = hash.password_timestamp, app.salt = hash.salt, app.uniqueId = hash.unique_id, app.markedForDeletion = !1, app.deleteDate = null, app
		}, GoogleAuthApp.prototype.setDecryptedSeed = function(decryptedSeed) {
			return this.decryptedSeed = decryptedSeed
		}, GoogleAuthApp.prototype.setEncryptedSeed = function(password) {
			return this.salt || (this.salt = CryptoHelper.generateSalt()), this.encryptedSeed = CryptoHelper.encryptAES(this.salt, password, this.decryptedSeed)
		}, GoogleAuthApp.prototype.setPasswordTimestamp = function(passwordTimestamp) {
			return this.passwordTimestamp = passwordTimestamp
		}, GoogleAuthApp.prototype.getUploadState = function() {
			return this.uploadState
		}, GoogleAuthApp.prototype.isUploaded = function() {
			return this.uploadState === GoogleAuthApp.UPLOADED
		}, GoogleAuthApp.prototype.setUploadState = function(state) {
			var contained, s, _i, _len, _ref;
			for (contained = !1, _ref = GoogleAuthApp.STATES, _i = 0, _len = _ref.length; _len > _i; _i++) s = _ref[_i], s === state && (contained = !0);
			if (contained === !1) throw Error("state " + state + " is not in STATES");
			return this.uploadState = state
		}, GoogleAuthApp.prototype.getBackingUpImage = function() {
			return this.getUploadState() === GoogleAuthApp.UPLOADED ? "img/settings-screen/backups_green_icon.png" : this.getUploadState() === GoogleAuthApp.UPLOADING ? "img/settings-screen/backups_gray_icon.png" : "img/settings-screen/backups_red_icon.png"
		}, GoogleAuthApp.prototype.setName = function(name) {
			return this.name = name
		}, GoogleAuthApp.prototype.setAccountType = function(accountType) {
			return this.accountType = accountType
		}, GoogleAuthApp.prototype.getName = function() {
			return this.name
		}, GoogleAuthApp.prototype.getOtp = function() {
			return this.isEncrypted() ? "------" : this.otpGenerator.getOtp(this.decryptedSeed)
		}, GoogleAuthApp.prototype.getSharedSecret = function() {	
			return this.isEncrypted() ? "?" : this.decryptedSeed
		}, GoogleAuthApp.prototype.isDecrypted = function() {
			return null != this.decryptedSeed
		}, GoogleAuthApp.prototype.isMarkedForDeletion = function() {
			return this.markedForDeletion
		}, GoogleAuthApp.prototype.setMarkedForDeletion = function(markedForDeletion) {
			var date;
			return markedForDeletion ? (date = new Date, date.setHours(date.getHours() + GoogleAuthApp.HOURS_BEFORE_DELETION), this.setDeleteDate(date)) : this.deleteDate = null, this.markedForDeletion = markedForDeletion
		}, GoogleAuthApp.prototype.setDeleteDate = function(date) {
			return this.deleteDate = date.getTime()
		}, GoogleAuthApp.prototype.isAuthenticatorAccount = function() {
			return !0
		}, GoogleAuthApp.prototype.getMenuImage = function() {
			return AssetManager.get().getMenuItemUrl(this.accountType)
		}, GoogleAuthApp.prototype.toJson = function() {
			return {
				type: "GoogleAuthApp",
				account_type: this.accountType,
				encrypted_seed: this.encryptedSeed,
				name: this.getName(),
				original_name: this.originalName,
				password_timestamp: this.passwordTimestamp,
				salt: this.salt,
				unique_id: this.uniqueId,
				decrypted_seed: this.decryptedSeed,
				upload_state: this.uploadState,
				marked_for_deletion: this.markedForDeletion,
				delete_date: this.deleteDate,
				createdDate: this.createdDate
			}
		}, GoogleAuthApp.fromJson = function(json) {
			var app;
			return app = new GoogleAuthApp, app.uniqueId = json.unique_id, app.name = json.name, app.originalName = json.original_name, app.accountType = json.account_type, app.salt = json.salt, app.encryptedSeed = json.encrypted_seed, app.decryptedSeed = json.decrypted_seed, app.passwordTimestamp = json.password_timestamp, app.setUploadState(json.upload_state), app.markedForDeletion = json.marked_for_deletion, app.deleteDate = parseInt(json.delete_date, 10), app.createdDate = json.createdDate, Encoder.isBase32(app.decryptedSeed) || (app.decryptedSeed = null), app
		}, GoogleAuthApp.fromSecret = function(secret) {
			var app, id;
			return id = DateHelper.getTimestampSeconds(), app = new GoogleAuthApp, app.uniqueId = id, app.name = "", app.originalName = "", app.accountType = "unknown", app.salt = null, app.encryptedSeed = null, app.decryptedSeed = secret, app.passwordTimestamp = null, app.setUploadState(GoogleAuthApp.NOT_UPLOADED), app.markedForDeletion = !1, app.deleteDate = null, app
		}, GoogleAuthApp.prototype.isSafe = function(cb) {
			return PhishingDetector.isAccountSafe(this.getName(), this.accountType, cb)
		}, GoogleAuthApp.prototype.getAccountName = function() {
			var accountName;
			return accountName = this.accountType ? this.accountType : this.getName(), _.str.titleize(_.str.humanize(accountName))
		}, GoogleAuthApp.prototype.getId = function() {
			return "" + GoogleAuthApp.ID_PREFIX + this.uniqueId
		}, GoogleAuthApp.prototype.toString = function() {
			return "name:" + this.getName() + ", uploadState:" + this.getUploadState() + ", uniqueId:" + this.unique_id
		}, GoogleAuthApp
	}(App)
}), define("models/apps/health_check", ["models/apps/master_token", "models/api/registration_api", "helpers/crypto_helper", "helpers/log"], function(MasterToken, RegistrationApi, CryptoHelper, Log) {
	var HealthCheck;
	return HealthCheck = function() {
		function HealthCheck() {}
		var HealthCheckSingleton, instance;
		return instance = null, HealthCheckSingleton = function() {
			function HealthCheckSingleton() {
				this.registrationApi = new RegistrationApi
			}
			return HealthCheckSingleton.prototype.run = function(options) {
				var masterToken, sha;
				return null == options.onSuccess && (options.onSuccess = function() {}), null == options.onFail && (options.onFail = function() {}), masterToken = MasterToken.get(), sha = CryptoHelper.generateSHA256(masterToken.secretKey), this.registrationApi.checkSecretSeed(masterToken.deviceId, masterToken.deviceId, sha, function(response) {
					return options.onSuccess()
				}, function(response) {
					return Log.e("Secret seed verification failed for master token: " + response.message), options.onFail(response)
				})
			}, HealthCheckSingleton
		}(), HealthCheck.get = function() {
			return null == instance && (instance = new HealthCheckSingleton), instance
		}, HealthCheck.prototype.run = function(options) {
			return null !== instance ? instance.run(options) : void 0
		}, HealthCheck
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("models/apps/master_token", ["models/storage/encrypted_storage", "models/otp_generator/authy_otp_generator", "models/storage/encryption_key", "helpers/app_helper", "helpers/log"], function(EncryptedStorage, AuthyOtpGenerator, EncryptionKey, AppHelper, Log, CryptoHelper) {
	var MasterToken;
	return MasterToken = function() {
		function MasterToken() {}
		var MasterTokenSingleton, instance;
		return instance = null, MasterTokenSingleton = function() {
			function MasterTokenSingleton(userId, deviceId, secretKey) {
				this.userId = userId, this.deviceId = deviceId, this.secretKey = secretKey, this.cleanUpBeforeClose = __bind(this.cleanUpBeforeClose, this), this.otpGenerator = new AuthyOtpGenerator(this.secretKey, !1), AppHelper.subscribeToCloseAppEvent(this), EncryptionKey.addChangePasswordEventListener(this)
			}
			return MasterTokenSingleton.prototype.getOtps = function() {
				return this.otpGenerator.getOtps()
			}, MasterTokenSingleton.prototype.save = function(cb) {
				return null == cb && (cb = function() {}), null != this.secretKey && null != this.userId && null != this.deviceId ? EncryptedStorage.save("MasterToken", {
					userId: this.userId,
					deviceId: this.deviceId,
					secretKey: this.secretKey
				}, cb) : (Log.w("Skipping save for " + this.constructor.name + " since it hasn't been loaded into memory."), cb())
			}, MasterTokenSingleton.prototype.cleanUpBeforeClose = function(cb) {
				var self;
				return self = this, MasterToken.save(function() {
					return self.userId = null, self.deviceId = null, self.secretKey = null, cb()
				})
			}, MasterTokenSingleton
		}(), MasterToken.get = function() {
			return instance
		}, MasterToken.initialize = function(userId, deviceId, secretKey) {
			return null == instance || null == instance.secretKey || null == instance.userId || null == instance.deviceId ? instance = new MasterTokenSingleton(userId, deviceId, secretKey) : (instance.userId = userId, instance.deviceId = deviceId, instance.secretKey = secretKey)
		}, MasterToken.save = function(cb) {
			return null == cb && (cb = function() {}), null !== instance ? instance.save(cb) : void 0
		}, MasterToken.load = function(callback) {
			return EncryptedStorage.load("MasterToken", function(masterTokenData) {
				return null != masterTokenData && null != masterTokenData.userId && null != masterTokenData.deviceId && null != masterTokenData.secretKey && MasterToken.initialize(masterTokenData.userId, masterTokenData.deviceId, masterTokenData.secretKey), callback(instance)
			})
		}, MasterToken.hasBeenCreated = function(callback) {
			EncryptedStorage.hasKey("MasterToken", function(hasKey) {
				return callback(hasKey)
			})
		}, MasterToken.setSecretKey = function(newSecretKey) {
			return instance = new MasterTokenSingleton(instance.userId, instance.deviceId, newSecretKey), MasterToken.save()
		}, MasterToken
	}.call(this)
}), define("models/apps/token_ui", [], function() {
	var TokenUi;
	return TokenUi = function() {
		function TokenUi() {
			this.timerColor = "#FC0D1B", this.backgroundColor = "#FFFFAA", this.labelsColor = "#00FF00", this.tokenColor = "#FF0000", this.labelShadowColor = "#FFFFFF", this.circleColor = "#C2C200", this.circleBackground = "#00F9F9", this.logoImage = "img/default-token-img.png", this.menuImage = "img/default-menu-img.png", this.assetsGroup = null
		}
		return TokenUi
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("models/assets/asset_account", ["helpers/json_storage", "helpers/image_downloader", "models/storage/file_system", "helpers/log"], function(JsonStorage, ImageDownloader, FileSystem, Log) {
	var AssetAccount;
	return AssetAccount = function() {
		function AssetAccount(accountName, menuItemUrl, menuItemMd5, onSuccess) {
			var self;
			this.accountName = accountName, this.menuItemUrl = menuItemUrl, this.menuItemMd5 = menuItemMd5, null == onSuccess && (onSuccess = function() {}), this.setUpdated = __bind(this.setUpdated, this), this.wasUpdated = __bind(this.wasUpdated, this), self = this, this.assetUpdated = !1, this.menuItemLoaded = !1, this.listeners = [], JsonStorage.loadObject(this.getStorageLocation(), function(data) {
				return null === data || null === data.menuItemMd5 || data.menuItemMd5 !== self.menuItemMd5 ? ImageDownloader.loadImage(self.menuItemUrl, function(blob) {
					return self.onMenuImageLoaded(blob, onSuccess)
				}) : FileSystem.getFile(data.accountName, function(file) {
					return self.setMenuItemUrl(data.menuItemUrl, onSuccess)
				}, function() {
					return Log.d("Downloading the assets for " + data.accountName + " because not found on FileSystem"), ImageDownloader.loadImage(self.menuItemUrl, function(blob) {
						return self.onMenuImageLoaded(blob, onSuccess)
					})
				})
			})
		}
		return AssetAccount.MENU_ITEM_PLACEHOLDER = "img/default-menu-image.png", AssetAccount.prototype.setMenuItemUrl = function(menuItemUrl, onSuccess) {
			return null == onSuccess && (onSuccess = function() {}), this.menuItemBlobUrl = menuItemUrl, this.menuItemLoaded = !0, this.notifyListeners(), onSuccess(this)
		}, AssetAccount.prototype.onMenuImageLoaded = function(blob, onSuccess) {
			var self;
			return null == onSuccess && (onSuccess = function() {}), self = this, Log.d(blob), FileSystem.writeBlobToFile(this.accountName, blob, function(fileUrl) {
				return self.setUpdated(!0), self.setMenuItemUrl(fileUrl, onSuccess), JsonStorage.save(self.getStorageLocation(), {
					accountName: self.accountName,
					menuItemUrl: fileUrl,
					menuItemMd5: self.menuItemMd5
				})
			}, function() {})
		}, AssetAccount.prototype.getMenuImage = function() {
			return this.menuItemLoaded ? this.menuItemBlobUrl : MENU_ITEM_PLACEHOLDER
		}, AssetAccount.prototype.registerListener = function(listener) {
			return this.listeners.push(listener)
		}, AssetAccount.prototype.notifyListeners = function() {
			var listener, _i, _len, _ref, _results;
			for (_ref = this.listeners, _results = [], _i = 0, _len = _ref.length; _len > _i; _i++) listener = _ref[_i], _results.push(listener(this));
			return _results
		}, AssetAccount.prototype.getStorageLocation = function() {
			return "asset-account-" + this.accountName
		}, AssetAccount.prototype.wasUpdated = function() {
			return this.assetUpdated
		}, AssetAccount.prototype.setUpdated = function(updated) {
			return this.assetUpdated = updated
		}, AssetAccount.load = function(accountName) {}, AssetAccount
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("models/assets/asset_manager", ["models/api/assets_api", "models/assets/asset_account", "helpers/json_storage", "helpers/log"], function(AssetsApi, AssetAccount, JsonStorage, Log) {
	var AssetManager;
	return AssetManager = function() {
		function AssetManager() {}
		var AssetManagerSingleton, instance;
		return AssetManager.ASSET_MANIFEST_STORAGE = "authy.storage.assetManifest", instance = null, AssetManagerSingleton = function() {
			function AssetManagerSingleton() {
				this.onAssetManifestDownloaded = __bind(this.onAssetManifestDownloaded, this), this.allAccountsIncluded = __bind(this.allAccountsIncluded, this), this.saveAssetManifest = __bind(this.saveAssetManifest, this), this.updateDownloaded = __bind(this.updateDownloaded, this), this.whenManifestDownloaded = __bind(this.whenManifestDownloaded, this), this.downloaded = !1, this.downloadedCallback = null, this.assetsApi = new AssetsApi, this.assetAccounts = {}
			}
			return AssetManagerSingleton.prototype.invalidateDownloadedCallback = function() {
				return this.downloaded = !1, this.downloadedCallback = null
			}, AssetManagerSingleton.prototype.whenManifestDownloaded = function(cb) {
				return this.downloaded ? cb() : this.downloadedCallback = cb
			}, AssetManagerSingleton.prototype.updateDownloaded = function() {
				return this.downloaded = !0, null != this.downloadedCallback ? this.downloadedCallback() : void 0
			}, AssetManagerSingleton.prototype.downloadAssets = function(appIds, onSuccess) {
				var downloadFromServer, self;
				return null == appIds && (appIds = []), null == onSuccess && (onSuccess = function() {}), self = this, downloadFromServer = function(localManifest, cb) {
					return self.assetsApi.getAssetsManifest(function(assetManifest) {
						return self.onAssetManifestDownloaded(assetManifest, function(assetsChanged) {
							return self.saveAssetManifest(localManifest, assetManifest), cb(assetsChanged)
						})
					}, function() {
						return self.updateDownloaded(), Log.w("Could not download asset manifest from server. Using version stored in disk.")
					}, appIds.join())
				}, JsonStorage.loadObject(AssetManager.ASSET_MANIFEST_STORAGE, function(manifest) {
					return null !== manifest ? self.onAssetManifestDownloaded(manifest, function() {
						return downloadFromServer(manifest, onSuccess)
					}) : downloadFromServer(manifest, onSuccess)
				})
			}, AssetManagerSingleton.prototype.saveAssetManifest = function(localManifest, serverManifest) {
				return null != localManifest ? ($.extend(localManifest.urls, serverManifest.urls), $.extend(localManifest.md5s, serverManifest.md5s), $.extend(serverManifest.urls, localManifest.urls), $.extend(serverManifest.md5s, localManifest.md5s), serverManifest.count = Object.keys(serverManifest.urls).length, JsonStorage.save(AssetManager.ASSET_MANIFEST_STORAGE, serverManifest)) : JsonStorage.save(AssetManager.ASSET_MANIFEST_STORAGE, serverManifest)
			}, AssetManagerSingleton.prototype.allAccountsIncluded = function(assetGroups) {
				var name, _i, _len;
				for (_i = 0, _len = assetGroups.length; _len > _i; _i++)
					if (name = assetGroups[_i], !(name in this.assetAccounts)) return !1;
				return !0
			}, AssetManagerSingleton.prototype.onAssetManifestDownloaded = function(assetManifest, onSuccess) {
				var accounts, assetsChanged, doLoop, md5s, self, urls;
				return null == onSuccess && (onSuccess = function() {}), self = this, this.downloaded = !1, urls = assetManifest.urls, md5s = assetManifest.md5s, accounts = Object.keys(urls), assetsChanged = !1, (doLoop = function(index) {
					var account, accountName, md5, menuItemUrl;
					return index < accounts.length ? (account = accounts[index], accountName = account, menuItemUrl = urls[accountName].menu_item_url, md5 = md5s[accountName].menu_item_url, new AssetAccount(accountName, menuItemUrl, md5, function(assetAccount) {
						return self.assetAccounts[accountName] = assetAccount, assetAccount.wasUpdated() && (assetsChanged = !0), doLoop(index + 1)
					})) : (onSuccess(assetsChanged), self.updateDownloaded())
				})(0)
			}, AssetManagerSingleton.prototype.getMenuItemUrl = function(accountName) {
				return accountName in this.assetAccounts ? this.assetAccounts[accountName].getMenuImage() : AssetAccount.MENU_ITEM_PLACEHOLDER
			}, AssetManagerSingleton.prototype.getAssetAccounts = function() {
				var assetAccount, key;
				return function() {
					var _ref, _results;
					_ref = this.assetAccounts, _results = [];
					for (key in _ref) assetAccount = _ref[key], _results.push(assetAccount);
					return _results
				}.call(this)
			}, AssetManagerSingleton
		}(), AssetManager.get = function() {
			return null != instance ? instance : instance = new AssetManagerSingleton
		}, AssetManager
	}.call(this)
}), define("models/assets/authenticator_config", ["models/api/assets_api", "models/assets/asset_manager", "helpers/json_storage", "helpers/log"], function(AssetsApi, AssetManager, JsonStorage, Log) {
	var AuthenticatorConfig;
	return AuthenticatorConfig = function() {
		function AuthenticatorConfig() {}
		var AuthenticatorConfigSingleton, instance;
		return AuthenticatorConfig.AUTHENTICATOR_CONFIG_STORAGE = "authy.storage.authenticatorConfig", instance = null, AuthenticatorConfigSingleton = function() {
			function AuthenticatorConfigSingleton() {
				this.assetsApi = new AssetsApi, this.assetManager = AssetManager.get(), this.version = null, this.accountTypes = {}
			}
			return AuthenticatorConfigSingleton.prototype.downloadAccountTypes = function(onSuccess) {
				var self;
				return null == onSuccess && (onSuccess = function() {}), self = this, JsonStorage.loadObject(AuthenticatorConfig.AUTHENTICATOR_CONFIG_STORAGE, function(config) {
					return null !== config && self.onAccountTypesDownloaded(config), self.assetsApi.getAuthenticatorConfig(function(config) {
						return JsonStorage.save(AuthenticatorConfig.AUTHENTICATOR_CONFIG_STORAGE, config), self.onAccountTypesDownloaded(config, onSuccess)
					}, function() {
						return Log.w("Could not download the Authenticator Config from server. Using version stored in disk.")
					})
				})
			}, AuthenticatorConfigSingleton.prototype.onAccountTypesDownloaded = function(config, onSuccess) {
				var menuImageUrl, self, token, tokens, _i, _len, _results;
				if (null == onSuccess && (onSuccess = function() {}), self = this, tokens = config.tokens, menuImageUrl = "", self.version < config.version) {
					for (self.version = config.version, _results = [], _i = 0, _len = tokens.length; _len > _i; _i++) token = tokens[_i], menuImageUrl = self.assetManager.getMenuItemUrl(token.type), token.menuItemUrl = menuImageUrl, _results.push(self.accountTypes[token.name] = token);
					return _results
				}
			}, AuthenticatorConfigSingleton.prototype.getAccountTypes = function() {
				var accountType, key;
				return function() {
					var _ref, _results;
					_ref = this.accountTypes, _results = [];
					for (key in _ref) accountType = _ref[key], _results.push(accountType);
					return _results
				}.call(this)
			}, AuthenticatorConfigSingleton
		}(), AuthenticatorConfig.get = function() {
			return null != instance ? instance : instance = new AuthenticatorConfigSingleton
		}, AuthenticatorConfig
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("models/base_model", ["helpers/json_storage", "helpers/log"], function(JsonStorage, Log) {
	var BaseModel;
	return BaseModel = function() {
		function BaseModel() {
			this.isLoadedToMemory = __bind(this.isLoadedToMemory, this), this.loadedToMemory = !1, this.model = null, this.listeners = []
		}
		return BaseModel.prototype.load = function(cb, onFetchError) {
			var self;
			return null == onFetchError && (onFetchError = function() {}), self = this, this.loadLocal(function() {
				return self.fetch(cb, onFetchError)
			})
		}, BaseModel.prototype.loadLocal = function(cb) {
			var self;
			return self = this, JsonStorage.loadObject(this.getStorageLocation(), function(data) {
				var model;
				return null != data && (model = self.fromJson(data), self.setModel(model), self.loadedToMemory = !0, self.notifyListeners()), cb()
			})
		}, BaseModel.prototype.save = function(cb) {
			return null == cb && (cb = function() {}), this.isLoadedToMemory() ? (this.loadedToMemory = !0, JsonStorage.save(this.getStorageLocation(), this.toJson(), cb)) : (Log.w("Skipping save for " + this.constructor.name + " since it hasn't been loaded into memory."), cb())
		}, BaseModel.prototype.setModel = function(model) {
			return this.model = model
		}, BaseModel.prototype.getModel = function() {
			return this.model
		}, BaseModel.prototype.addListener = function(listener) {
			var l, _i, _len, _ref;
			for (_ref = this.listeners, _i = 0, _len = _ref.length; _len > _i; _i++)
				if (l = _ref[_i], l === listener) return;
			this.listeners.push(listener)
		}, BaseModel.prototype.notifyListeners = function(data) {
			var listener, _i, _len, _ref;
			for (null == data && (data = {}), _ref = this.listeners, _i = 0, _len = _ref.length; _len > _i; _i++)(listener = _ref[_i])(data)
		}, BaseModel.prototype.removeListener = function(listener) {
			var index;
			index = this.listeners.indexOf(listener), index > -1 && this.listeners.splice(index, 1)
		}, BaseModel.prototype.getListeners = function() {
			return this.listeners
		}, BaseModel.prototype.isLoadedToMemory = function() {
			throw new Error("You have not provided an implementation for the isLoadedToMemory method")
		}, BaseModel.prototype.getStorageLocation = function() {
			throw new Error("you must provide a storage location")
		}, BaseModel.prototype.toJson = function() {
			throw new Error("You have not provided an implementation for the toJson method")
		}, BaseModel.prototype.fromJson = function(data) {
			throw new Error("You have not provided an implementation for the fromJson method")
		}, BaseModel.prototype.fetch = function(onSuccess, onError) {
			throw new Error("You have not provided an implementation for the fetch method")
		}, BaseModel
	}()
}), define("models/devices/device", [], function() {
	var Device;
	return Device = function() {
		function Device(params) {
			this.city = params.city, this.country = params.country, this.deviceType = params.deviceType, this.ip = params.ip, this.lastSyncAt = params.lastSyncAt, this.masterTokenId = params.masterTokenId, this.name = params.name, this.needsHealthCheck = params.needsHealthCheck, this.region = params.region, this.registered = params.registered, this.id = params.masterTokenId
		}
		return Device.create = function(hash) {
			var params;
			return params = {
				city: hash.city,
				country: hash.country,
				deviceType: hash.device_type,
				ip: hash.ip,
				lastSyncAt: hash.last_sync_at,
				masterTokenId: hash.master_token_id,
				name: hash.name,
				needsHealthCheck: hash.needs_health_check,
				region: hash.region,
				registered: hash.registered
			}, new Device(params)
		}, Device.prototype.icon = function() {
			return "android" === this.deviceType ? "img/settings-screen/android_phone_icon.png" : "android_tablet" === this.deviceType ? "img/settings-screen/android_tablet_icon.png" : "iphone" === this.deviceType || "ipod" === this.deviceType ? "img/settings-screen/iphone_icon.png" : "ipad" === this.deviceType ? "img/settings-screen/ipad_icon.png" : "img/settings-screen/android_phone_icon.png"
		}, Device.prototype.toJson = function() {
			var json;
			return json = {
				city: this.city,
				country: this.country,
				deviceType: this.deviceType,
				ip: this.ip,
				lastSyncAt: this.lastSyncAt,
				masterTokenId: this.masterTokenId,
				name: this.name,
				needsHealthCheck: this.needsHealthCheck,
				region: this.region,
				registered: this.registered,
				id: this.masterTokenId
			}
		}, Device
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("models/devices/device_request_model", ["models/base_model"], function(BaseModel) {
	var DeviceRequestModel;
	return DeviceRequestModel = function() {
		function DeviceRequestModel() {}
		var DeviceRequestModelSingleton, instance;
		return instance = null, DeviceRequestModelSingleton = function(_super) {
			function DeviceRequestModelSingleton() {
				this.setDeviceRequestPresent = __bind(this.setDeviceRequestPresent, this), this.isDeviceRequestPresent = __bind(this.isDeviceRequestPresent, this), DeviceRequestModelSingleton.__super__.constructor.call(this), this.deviceRequestPresent = !1
			}
			return __extends(DeviceRequestModelSingleton, _super), DeviceRequestModelSingleton.prototype.isDeviceRequestPresent = function() {
				return this.deviceRequestPresent
			}, DeviceRequestModelSingleton.prototype.setDeviceRequestPresent = function(deviceRequestPresent) {
				return this.deviceRequestPresent = deviceRequestPresent, this.notifyListeners({
					deviceRequestPresent: this.deviceRequestPresent
				})
			}, DeviceRequestModelSingleton
		}(BaseModel), DeviceRequestModel.get = function() {
			return null == instance && (instance = new DeviceRequestModelSingleton), instance
		}, DeviceRequestModel
	}.call(this)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("models/devices/devices_model", ["models/base_model", "models/api/devices_api", "helpers/json_storage", "models/devices/device", "models/apps/master_token"], function(BaseModel, DevicesApi, JsonStorage, Device, MasterToken) {
	var DevicesModel;
	return DevicesModel = function(_super) {
		function DevicesModel() {
			this.isLoadedToMemory = __bind(this.isLoadedToMemory, this), DevicesModel.__super__.constructor.call(this), this.model = [], this.devicesApi = new DevicesApi
		}
		return __extends(DevicesModel, _super), DevicesModel.prototype.removeDevice = function(deviceId, onSuccess, onError) {
			var self;
			return null == onError && (onError = function() {}), self = this, this.devicesApi.removeDevice(deviceId, function() {
				return self.removeById(deviceId), onSuccess()
			}, onError)
		}, DevicesModel.prototype.getDevices = function() {
			return this.getModel()
		}, DevicesModel.prototype.getOtherDevices = function() {
			return _.filter(this.getDevices(), function(device) {
				return MasterToken.get().deviceId !== device.id
			})
		}, DevicesModel.prototype.removeById = function(id) {
			var device, i, index, _i, _len, _ref;
			for (index = -1, _ref = this.model, i = _i = 0, _len = _ref.length; _len > _i; i = ++_i) device = _ref[i], id === device.id && (index = i);
			return -1 !== index && this.model.splice(index, 1), this.save(), this.notifyListeners()
		}, DevicesModel.prototype.addAll = function(devices) {
			var device, _i, _len, _results;
			for (_results = [], _i = 0, _len = devices.length; _len > _i; _i++) device = devices[_i], _results.push(this.model.push(device));
			return _results
		}, DevicesModel.prototype.contains = function(device) {
			var contained, dev, _i, _len, _ref;
			for (contained = !1, _ref = this.model, _i = 0, _len = _ref.length; _len > _i; _i++) dev = _ref[_i], dev === device && (contained = !0);
			return contained
		}, DevicesModel.prototype.size = function() {
			return this.model.length
		}, DevicesModel.prototype.fetch = function(onSuccess, onError) {
			var self;
			self = this, null != this.model && this.notifyListeners(), this.devicesApi.getDevices(function(devices) {
				return self.setModel(devices), self.notifyListeners(), self.save(), onSuccess()
			}, onError)
		}, DevicesModel.prototype.getStorageLocation = function() {
			return "authy.storage.devices"
		}, DevicesModel.prototype.toJson = function() {
			var device, json, _i, _len, _ref;
			for (json = [], _ref = this.model, _i = 0, _len = _ref.length; _len > _i; _i++) device = _ref[_i], json.push(device.toJson());
			return json
		}, DevicesModel.prototype.fromJson = function(json) {
			var devices, obj, _i, _len;
			for (devices = [], _i = 0, _len = json.length; _len > _i; _i++) obj = json[_i], devices.push(new Device(obj));
			return devices
		}, DevicesModel.prototype.isLoadedToMemory = function() {
			return null != this.model ? this.loadedToMemory || this.model.length > 0 : !1
		}, DevicesModel
	}(BaseModel)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("models/encrypted_base_model", ["models/base_model", "models/storage/encrypted_storage", "helpers/log"], function(BaseModel, EncryptedStorage, Log) {
	var EncryptedBaseModel, _ref;
	return EncryptedBaseModel = function(_super) {
		function EncryptedBaseModel() {
			return this.save = __bind(this.save, this), _ref = EncryptedBaseModel.__super__.constructor.apply(this, arguments)
		}
		return __extends(EncryptedBaseModel, _super), EncryptedBaseModel.prototype.save = function(cb) {
			return null == cb && (cb = function() {}), this.isLoadedToMemory() ? (this.loadedToMemory = !0, EncryptedStorage.save(this.getStorageLocation(), this.toJson(), cb)) : (Log.w("Skipping save for " + this.constructor.name + " since it hasn't been loaded into memory."), cb())
		}, EncryptedBaseModel.prototype.loadLocal = function(cb) {
			var self;
			return self = this, EncryptedStorage.load(this.getStorageLocation(), function(data) {
				var model;
				return null != data && (model = self.fromJson(data), self.setModel(model), self.loadedToMemory = !0, self.notifyListeners()), cb()
			})
		}, EncryptedBaseModel
	}(BaseModel)
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("models/hash_set_model", ["models/base_model", "helpers/hash_set"], function(BaseModel, HashSet) {
	var HashSetModel;
	return HashSetModel = function(_super) {
		function HashSetModel(saveLocation) {
			this.saveLocation = saveLocation, HashSetModel.__super__.constructor.call(this, this.saveLocation), this.model = new HashSet
		}
		return __extends(HashSetModel, _super), HashSetModel.prototype.clear = function() {
			return this.model.clear(), this.notifyListeners()
		}, HashSetModel.prototype.add = function(object) {
			return this.model.add(object), this.notifyListeners()
		}, HashSetModel.prototype.remove = function(object) {
			return this.model.remove(object), this.notifyListeners()
		}, HashSetModel.prototype.removeById = function(object) {
			return this.model.removeById(object), this.notifyListeners()
		}, HashSetModel.prototype.contains = function(object) {
			return this.model.contains(object)
		}, HashSetModel.prototype.toArray = function() {
			return this.model.toArray()
		}, HashSetModel.prototype.size = function() {
			return this.toArray().length
		}, HashSetModel.prototype.setModel = function(model) {
			throw new Error("unimplemented method")
		}, HashSetModel
	}(BaseModel)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("models/messaging/chrome_extension", ["models/messaging/message_server", "models/messaging/status_server", "models/messaging/message_client", "models/messaging/tab_client", "helpers/async_helper", "models/api/constants"], function(MessageServer, StatusServer, MessageClient, TabClient, AsyncHelper, Constants) {
	var ChromeExtension;
	return ChromeExtension = function() {
		function ChromeExtension() {}
		var ChromeExtensionSingleton, instance;
		return ChromeExtension.CHROME_EXT_ID = Constants.DEBUG ? "khhpbdcplgajeciicbbkdfhhkfjeaibj" : "fhgenkpocbhhddlgkjnfghpjanffonno", instance = null, ChromeExtensionSingleton = function() {
			function ChromeExtensionSingleton() {
				this.isInstalled = __bind(this.isInstalled, this), this.getTabs = __bind(this.getTabs, this), this.server = new MessageServer, this.server.start(), this.statusServer = new StatusServer, this.server.addServer(this.statusServer), this.client = new MessageClient({
					serverId: ChromeExtension.CHROME_EXT_ID
				}), this.tabClient = new TabClient({
					client: this.client
				})
			}
			return ChromeExtensionSingleton.prototype.getTabs = function(cb) {
				var options, self;
				return self = this, options = {
					lambda: self.tabClient.getTabs,
					callback: cb,
					defVal: []
				}, AsyncHelper.run(options)
			}, ChromeExtensionSingleton.prototype.isInstalled = function(cb) {
				return this.getTabs(function(data) {
					return cb(void 0 === data ? !1 : !0)
				})
			}, ChromeExtensionSingleton
		}(), ChromeExtension.get = function() {
			return null == instance && (instance = new ChromeExtensionSingleton), instance
		}, ChromeExtension
	}.call(this)
}), define("models/messaging/message_client", [], function() {
	var MessageClient;
	return MessageClient = function() {
		function MessageClient(options) {
			this.sendMessage = options.sendMessage || chrome.runtime.sendMessage, this.serverId = options.serverId
		}
		return MessageClient.prototype.send = function(action, data, cb) {
			return this.sendMessage(this.serverId, {
				action: action,
				params: data
			}, cb)
		}, MessageClient
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("models/messaging/message_server", [], function() {
	var MessageServer;
	return MessageServer = function() {
		function MessageServer(options) {
			null == options && (options = {}), this.listener = __bind(this.listener, this), this.onMessageExternal = options.onMessageExternal || chrome.runtime.onMessageExternal, this.servers = []
		}
		return MessageServer.prototype.listener = function(request, sender, sendResponse) {
			var methodName, params, server, _i, _len, _ref;
			if (this.isSenderValid(sender))
				for (methodName = request.action, params = [request.params || {},
					sendResponse
				], _ref = this.servers, _i = 0, _len = _ref.length; _len > _i; _i++) server = _ref[_i], methodName in server ? server[methodName].apply(server, params) : console.warn("The method " + methodName + " for " + server.constructor.name + " does not exist");
			return !0
		}, MessageServer.prototype.start = function() {
			return this.onMessageExternal.addListener(this.listener)
		}, MessageServer.prototype.isSenderValid = function(sender) {
			return !0
		}, MessageServer.prototype.addServer = function(server) {
			return this.servers.push(server)
		}, MessageServer
	}()
}), define("models/messaging/status_server", ["helpers/window_helper"], function(WindowHelper) {
	var StatusServer;
	return StatusServer = function() {
		function StatusServer(options) {
			null == options && (options = {})
		}
		return StatusServer.prototype.getStatus = function(data, sendResponse) {
			return sendResponse({
				status: !0
			}), !0
		}, StatusServer.prototype.focus = function(data, sendResponse) {
			return WindowHelper.focus(), sendResponse({
				success: !0
			}), !0
		}, StatusServer
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("models/messaging/tab_client", [], function() {
	var TabClient;
	return TabClient = function() {
		function TabClient(options) {
			this.getTabs = __bind(this.getTabs, this), this.client = options.client
		}
		return TabClient.prototype.getTabs = function(cb) {
			return this.client.send("getTabs", {}, cb)
		}, TabClient
	}()
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("models/model_collection", ["models/base_model"], function(BaseModel) {
	var ModelCollection;
	return ModelCollection = function(_super) {
		function ModelCollection(saveLocation) {
			this.saveLocation = saveLocation, ModelCollection.__super__.constructor.call(this, this.saveLocation), this.model = []
		}
		return __extends(ModelCollection, _super), ModelCollection.prototype.clear = function() {
			return this.model = [], this.notifyListeners()
		}, ModelCollection.prototype.add = function(object) {
			return this.model.push(object), this.notifyListeners()
		}, ModelCollection.prototype.remove = function(object) {
			var i, index, obj, _i, _len, _ref;
			for (index = null, _ref = this.model, i = _i = 0, _len = _ref.length; _len > _i; i = ++_i) obj = _ref[i], obj === object && (index = i);
			return null != index && this.model.splice(index, 1), this.notifyListeners()
		}, ModelCollection.prototype.contains = function(object) {
			return _.contains(object)
		}, ModelCollection.prototype.toArray = function() {
			return this.model
		}, ModelCollection.prototype.size = function() {
			return this.model.length
		}, ModelCollection.prototype.setModel = function(model) {
			throw new Error("unimplemented method")
		}, ModelCollection
	}(BaseModel)
}), define("models/otp_generator/authy_otp_generator", ["helpers/encoder", "helpers/totp"], function(Encoder, TOTP) {
	var AuthyOtpGenerator;
	return AuthyOtpGenerator = function() {
		function AuthyOtpGenerator(secret, isBase32) {
			this.secret = secret, null == isBase32 && (isBase32 = !0), isBase32 && (this.secret = Encoder.base32tohex(this.secret))
		}
		return AuthyOtpGenerator.OTP_LENGTH = 7, AuthyOtpGenerator.TIME_STEP = 10, AuthyOtpGenerator.prototype.getOtp = function() {
			var time, unixTime;
			return unixTime = TOTP.getUnixTime(), time = TOTP.time(unixTime, 0, AuthyOtpGenerator.TIME_STEP), TOTP.totp(this.secret, time, AuthyOtpGenerator.OTP_LENGTH)
		}, AuthyOtpGenerator.prototype.getOtps = function() {
			var otp1, otp2, otp3, paddedTime0, paddedTime1, paddedTime2, time0, time1, time2, unixTime;
			return unixTime = TOTP.getUnixTime(), time0 = unixTime, time1 = time0 + AuthyOtpGenerator.TIME_STEP, time2 = time0 + 2 * AuthyOtpGenerator.TIME_STEP, paddedTime0 = TOTP.time(time0, 0, AuthyOtpGenerator.TIME_STEP), paddedTime1 = TOTP.time(time1, 0, AuthyOtpGenerator.TIME_STEP), paddedTime2 = TOTP.time(time2, 0, AuthyOtpGenerator.TIME_STEP), otp1 = TOTP.totp(this.secret, paddedTime0, AuthyOtpGenerator.OTP_LENGTH), otp2 = TOTP.totp(this.secret, paddedTime1, AuthyOtpGenerator.OTP_LENGTH), otp3 = TOTP.totp(this.secret, paddedTime2, AuthyOtpGenerator.OTP_LENGTH), [otp1, otp2, otp3]
		}, AuthyOtpGenerator
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("models/otp_generator/authy_timer", ["models/otp_generator/timer"], function(Timer) {
	var AuthyTimer, _ref;
	return AuthyTimer = function(_super) {
		function AuthyTimer() {
			return this.getTimeRemaining = __bind(this.getTimeRemaining, this), _ref = AuthyTimer.__super__.constructor.apply(this, arguments)
		}
		return __extends(AuthyTimer, _super), AuthyTimer.TIMER_INTERVAL = 20, AuthyTimer.prototype.getTimeRemaining = function() {
			return AuthyTimer.TIMER_INTERVAL
		}, AuthyTimer
	}(Timer)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("models/otp_generator/google_auth_timer", ["models/otp_generator/timer", "helpers/date_helper"], function(Timer, DateHelper) {
	var GoogleAuthTimer, _ref;
	return GoogleAuthTimer = function(_super) {
		function GoogleAuthTimer() {
			return this.getTimeRemaining = __bind(this.getTimeRemaining, this), _ref = GoogleAuthTimer.__super__.constructor.apply(this, arguments)
		}
		return __extends(GoogleAuthTimer, _super), GoogleAuthTimer.TIMER_INTERVAL = 30, GoogleAuthTimer.prototype.getTimeRemaining = function(options) {
			var currentSeconds;
			return null == options && (options = {}), currentSeconds = DateHelper.getTimestampSeconds({
				date: options.date
			}), currentSeconds %= GoogleAuthTimer.TIMER_INTERVAL, GoogleAuthTimer.TIMER_INTERVAL - currentSeconds
		}, GoogleAuthTimer
	}(Timer)
}), define("models/otp_generator/google_authenticator_otp_generator", ["helpers/totp", "helpers/encoder"], function(TOTP, Encoder) {
	var GoogleAuthenticatorOtpGenerator;
	return GoogleAuthenticatorOtpGenerator = function() {
		function GoogleAuthenticatorOtpGenerator() {}
		return GoogleAuthenticatorOtpGenerator.OTP_LENGTH = 6, GoogleAuthenticatorOtpGenerator.TIME_STEP = 30, GoogleAuthenticatorOtpGenerator.prototype.getOtp = function(secret) {
			var time, unixTime;
			return secret = Encoder.base32tohex(secret).toUpperCase(), unixTime = TOTP.getUnixTime(), time = TOTP.time(unixTime, 0, GoogleAuthenticatorOtpGenerator.TIME_STEP), TOTP.totp(secret, time, GoogleAuthenticatorOtpGenerator.OTP_LENGTH)
		}, GoogleAuthenticatorOtpGenerator
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("models/otp_generator/timer", ["ui/router"], function(Router) {
	var Timer;
	return Timer = function() {
		function Timer(options) {
			null == options && (options = {}), this.getTimeRemaining = __bind(this.getTimeRemaining, this), this.updateTimer = __bind(this.updateTimer, this), this.isTimerRunning = __bind(this.isTimerRunning, this), this.stopTimer = __bind(this.stopTimer, this), this.startTimer = __bind(this.startTimer, this), this.updateTokensCb = options.updateTokensCb || function() {}, this.updateTimerCb = options.updateTimerCb || function() {}
		}
		return Timer.prototype.startTimer = function() {
			var self, tempFunction;
			return self = this, this.timeRemaining = this.getTimeRemaining(), tempFunction = function() {
				return self.updateTimer()
			}, this.isTimerRunning() && this.stopTimer(), this.intervalId = window.setInterval(tempFunction, 1e3)
		}, Timer.prototype.stopTimer = function() {
			return window.clearInterval(this.intervalId), this.intervalId = null
		}, Timer.prototype.isTimerRunning = function() {
			return null != this.intervalId
		}, Timer.prototype.updateTimer = function() {
			return this.timeRemaining -= 1, 0 === this.timeRemaining ? (this.stopTimer(), this.updateTokensCb(), this.startTimer()) : this.updateTimerCb(this.timeRemaining)
		}, Timer.prototype.getTimeRemaining = function() {
			throw new Error("Timer must implement getTimeRemaining")
		}, Timer
	}()
}), define("models/security/phishing_detector", ["helpers/string_helper", "models/messaging/chrome_extension"], function(StringHelper, ChromeExtension) {
	var PhishingDetector;
	return PhishingDetector = function() {
		function PhishingDetector() {}
		return PhishingDetector.WHITE_LIST = [{
			name: "digitalocean",
			domain: "digitalocean.com"
		}, {
			name: "adn",
			domain: "app.net"
		}, {
			name: "authy dashboard",
			domain: "authy.com"
		}, {
			name: "amazon",
			domain: "amazon.com"
		}, {
			name: "chargify",
			domain: "chargify.com"
		}, {
			name: "cloudflare",
			domain: "cloudflare.com"
		}, {
			name: "coinbase",
			domain: "coinbase.com"
		}, {
			name: "drchrono",
			domain: "drchrono.com"
		}, {
			name: "dreamhost",
			domain: "dreamhost.com"
		}, {
			name: "dropbox",
			domain: "dropbox.com"
		}, {
			name: "evernote",
			domain: "evernote.com"
		}, {
			name: "facebook",
			domain: "facebook.com"
		}, {
			name: "github",
			domain: "github.com"
		}, {
			name: "gmail",
			domain: "google.com"
		}, {
			name: "heroku",
			domain: "heroku.com"
		}, {
			name: "lastpass",
			domain: "lastpass.com"
		}, {
			name: "linode",
			domain: "linode.com"
		}, {
			name: "outlook",
			domain: "outlook.com"
		}, {
			name: "live",
			domain: "live.com"
		}, {
			name: "stripe",
			domain: "stripe.com"
		}, {
			name: "twitch",
			domain: "twitch.tv"
		}, {
			name: "wordpress",
			domain: "wordpress.org"
		}, {
			name: "wordpress",
			domain: "wordpress.com"
		}, {
			name: "cloudfare",
			domain: "cloudfare.com"
		}, {
			name: "drchrono",
			domain: "drchrono.com"
		}, {
			name: "cex",
			domain: "cex.io"
		}, {
			name: "buttercoin",
			domain: "buttercoin.com"
		}, {
			name: "libertybank",
			domain: "lb.ge"
		}, {
			name: "twitch",
			domain: "twitch.tv"
		}, {
			name: "upstart",
			domain: "upstart.com"
		}, {
			name: "google",
			domain: "google.com"
		}, {
			name: "dnsimple",
			domain: "dnsimple.com"
		}, {
			name: "cryptsy",
			domain: "cryptsy.com"
		}, {
			name: "hoobly classifieds",
			domain: "hoobly.com"
		}], PhishingDetector.getRelatedDomain = function(appName, accountType) {
			var domain, name, _i, _len, _ref;
			for (appName = appName.toLowerCase(), accountType = accountType.toLowerCase(), _ref = PhishingDetector.WHITE_LIST, _i = 0, _len = _ref.length; _len > _i; _i++)
				if (domain = _ref[_i], name = domain.name, name === appName || name === accountType) return domain.domain;
			return null
		}, PhishingDetector.isAccountSafe = function(name, accountType, callback) {
			return ChromeExtension.get().getTabs(function(result) {
				var isSafe, tablist;
				return null != result ? (tablist = result.tabs, isSafe = PhishingDetector.isSafe(name, accountType, tablist), callback(isSafe)) : callback(!0)
			})
		}, PhishingDetector.isSafe = function(appName, accountType, openTabUrls) {
			var appDomain, self, tabDomain, urlStr, _i, _len;
			if (null == openTabUrls && (openTabUrls = []), self = PhishingDetector, appDomain = self.getRelatedDomain(appName, accountType), null != appDomain) {
				for (_i = 0, _len = openTabUrls.length; _len > _i; _i++)
					if (urlStr = openTabUrls[_i], tabDomain = self.getDomainName(urlStr), tabDomain === appDomain && self.isHttps(urlStr)) return !0;
				return !1
			}
			return !0
		}, PhishingDetector.isHttps = function(urlStr) {
			var url;
			return url = new URL(urlStr), "https:" === url.protocol ? !0 : !1
		}, PhishingDetector.isWhitelisted = function(url) {
			var domainName, safeDomain, _i, _len, _ref;
			if ("https:" !== url.protocol) return !1;
			for (domainName = PhishingDetector.getDomainName(url), _ref = PhishingDetector.WHITE_LIST, _i = 0, _len = _ref.length; _len > _i; _i++)
				if (safeDomain = _ref[_i], domainName === safeDomain.domain) return !0;
			return !1
		}, PhishingDetector.getDomainNameFromURL = function(url) {
			var parts, size;
			return parts = url.hostname.split("."), size = parts.length, 1 === size ? parts[0] : [parts[size - 2], parts[size - 1]].join(".")
		}, PhishingDetector.getDomainName = function(urlString) {
			var url;
			return url = new URL(urlString), PhishingDetector.getDomainNameFromURL(url)
		}, PhishingDetector
	}()
}), define("models/storage/encrypted_storage", ["models/storage/encryption_key", "helpers/json_storage"], function(EncryptionKey, JsonStorage) {
	var EncryptedStorage;
	return EncryptedStorage = function() {
		function EncryptedStorage() {}
		return EncryptedStorage.verifyEncriptionKeyIsLoaded = function() {
			if (!EncryptionKey.isLoaded()) throw {
				name: "EncryptionKey not loaded",
				message: "For this class to function correctly you must call EncryptionKey.load first"
			}
		}, EncryptedStorage.save = function(storageKey, object, callback) {
			var data, encryptedJson, json, key;
			EncryptedStorage.verifyEncriptionKeyIsLoaded(), key = EncryptionKey.get(), json = JSON.stringify(object), encryptedJson = key.encrypt(json), data = {
				crypto: encryptedJson
			}, JsonStorage.save(storageKey, data, callback)
		}, EncryptedStorage.load = function(storageKey, callback) {
			JsonStorage.loadObject(storageKey, function(encryptedData) {
				var crypto, decryptedJson, decryptedObject, key;
				return null == encryptedData ? void callback(null) : (EncryptedStorage.verifyEncriptionKeyIsLoaded(), key = EncryptionKey.get(), crypto = encryptedData.crypto, decryptedJson = key.decrypt(crypto), decryptedObject = JSON.parse(decryptedJson), void callback(decryptedObject))
			})
		}, EncryptedStorage.hasKey = function(storageKey, callback) {
			JsonStorage.loadObject(storageKey, function(encryptedData) {
				return callback(null != encryptedData)
			})
		}, EncryptedStorage
	}()
}), define("models/storage/encryption_key", ["helpers/crypto_helper", "helpers/json_storage", "helpers/log", "ui/a_view"], function(CryptoHelper, JsonStorage, Log, View) {
	var EncryptionKey;
	return EncryptionKey = function() {
		function EncryptionKey() {}
		var EncryptionKeySingleton, instance;
		return EncryptionKey.STORAGE_KEY = "authy.EncryptionKey", EncryptionKey.CHANGE_PWD_EVENT_LISTENERS = [], EncryptionKey.STORAGE_KEY_HAS_PWD = "authy.HasSetPassword", EncryptionKey.USER_HAS_SET_PWD = null, EncryptionKey.DEFAULT_PASSWORD = "123qweASD", instance = null, EncryptionKeySingleton = function() {
			function EncryptionKeySingleton(password, salt, options) {
				var fromData, keyLength;
				this.salt = salt, null == options && (options = {}), fromData = options.fromData || !1, fromData ? (this.key = options.key, this.verification = options.verification || this.encrypt(this.salt)) : (keyLength = options.keyLength || 256, Log.bm("Generating password"), this.key = CryptoHelper.generatePBKDF2Key(password, this.salt, {
					iterations: 1e3,
					keySize: keyLength,
					decodeSalt: !0
				}), Log.bm("Generated"), this.verification = options.verification || this.encrypt(this.salt))
			}
			return EncryptionKeySingleton.prototype.save = function(cb) {
				var key;
				return null == cb && (cb = function() {}), key = {
					salt: this.salt,
					verification: this.verification
				}, JsonStorage.save(EncryptionKey.STORAGE_KEY, key, cb)
			}, EncryptionKeySingleton.prototype.encrypt = function(plaintext) {
				return CryptoHelper.encryptAESWithKey(this.key, plaintext)
			}, EncryptionKeySingleton.prototype.decrypt = function(cyphertext) {
				return CryptoHelper.decryptAESWithKey(this.key, cyphertext)
			}, EncryptionKeySingleton.prototype.decryptToHex = function(cyphertext) {
				return CryptoHelper.toHex(this.decrypt(cyphertext))
			}, EncryptionKeySingleton.prototype.cleanUpBeforeClose = function(cb) {
				var self;
				return self = this, this.save(function() {
					return self.salt = null, self.verification = null, self.key = null, cb()
				})
			}, EncryptionKeySingleton
		}(), EncryptionKey.create = function(password) {
			var salt;
			return salt = CryptoHelper.generateSalt(), new EncryptionKeySingleton(password, salt)
		}, EncryptionKey.createDefaultKey = function() {
			return EncryptionKey.create(EncryptionKey.DEFAULT_PASSWORD)
		}, EncryptionKey.createFromData = function(key, salt, verification) {
			return new EncryptionKeySingleton("", salt, {
				fromData: !0,
				verification: verification,
				key: key
			})
		}, EncryptionKey.isLoaded = function() {
			return null != instance && null != instance.key
		}, EncryptionKey.get = function() {
			return instance
		}, EncryptionKey.set = function(key) {
			return instance = key
		}, EncryptionKey.hasBeenCreated = function(cb) {
			JsonStorage.loadObject(EncryptionKey.STORAGE_KEY, function(data) {
				return cb(null != data && null != data.salt)
			})
		}, EncryptionKey.load = function(password, isDefaultPassword, cb) {
			var self;
			return self = this, JsonStorage.loadObject(EncryptionKey.STORAGE_KEY, function(data) {
				null != data && null != data.salt ? (Log.d("Creating key from local storage"), instance = new EncryptionKeySingleton(password, data.salt, {
					verification: data.verification
				}), cb(instance)) : (Log.d("Creating key for first time. Using default password: " + isDefaultPassword), instance = EncryptionKey.create(password), EncryptionKey.saveKey(instance, isDefaultPassword), cb(instance))
			})
		}, EncryptionKey.saveKey = function(key, isDefaultPassword, cb) {
			return null == cb && (cb = function() {}), key.save(), JsonStorage.save(EncryptionKey.STORAGE_KEY_HAS_PWD, {
				isDefaultPassword: isDefaultPassword
			}, cb)
		}, EncryptionKey.verifyPassword = function(password, isDefaultPassword, callback) {
			return EncryptionKey.hasBeenCreated(function(created) {
				if (created) return EncryptionKey.load(password, isDefaultPassword, function(key) {
					var error;
					try {
						return callback(key.salt === key.decrypt(key.verification) ? !0 : !1)
					} catch (_error) {
						return error = _error, Log.e(error), callback(!1)
					}
				});
				throw new Exception("Can't verify password if it hasn't been set for the first time")
			})
		}, EncryptionKey.addChangePasswordEventListener = function(listener) {
			return EncryptionKey.CHANGE_PWD_EVENT_LISTENERS.push(listener)
		}, EncryptionKey.changePassword = function(password, cb) {
			return EncryptionKey.USER_HAS_SET_PWD = !0, JsonStorage.save(EncryptionKey.STORAGE_KEY_HAS_PWD, {
				userHasSetPassword: EncryptionKey.USER_HAS_SET_PWD
			}, function() {
				return instance = EncryptionKey.create(password), instance.save(function() {
					var doLoop;
					return View.addCommonParam("hasPassword", !0), (doLoop = function(index) {
						var listener;
						if (index < EncryptionKey.CHANGE_PWD_EVENT_LISTENERS.length) {
							if (listener = EncryptionKey.CHANGE_PWD_EVENT_LISTENERS[index], "function" == typeof listener.save) return listener.save(function() {
								return doLoop(index + 1)
							});
							throw new Error("The listener " + listener.constructor.name + " must implement the method save")
						}
						return cb()
					})(0)
				})
			})
		}, EncryptionKey.userHasSetPassword = function(cb) {
			null != EncryptionKey.USER_HAS_SET_PWD ? cb(EncryptionKey.USER_HAS_SET_PWD) : JsonStorage.loadObject(EncryptionKey.STORAGE_KEY_HAS_PWD, function(data) {
				return null != data && null != data.userHasSetPassword ? (EncryptionKey.USER_HAS_SET_PWD = data.userHasSetPassword, cb(EncryptionKey.USER_HAS_SET_PWD)) : EncryptionKey.hasBeenCreated(function(hasBeenCreated) {
					return EncryptionKey.isUserMigrating(hasBeenCreated, data) ? (EncryptionKey.USER_HAS_SET_PWD = !0, JsonStorage.save(EncryptionKey.STORAGE_KEY_HAS_PWD, {
						userHasSetPassword: EncryptionKey.USER_HAS_SET_PWD
					})) : EncryptionKey.USER_HAS_SET_PWD = !1, cb(EncryptionKey.USER_HAS_SET_PWD)
				})
			})
		}, EncryptionKey.isUserMigrating = function(keyHasBeenCreated, data) {
			return null != data && null != data.isDefaultPassword && data.isDefaultPassword ? !1 : keyHasBeenCreated ? !0 : !1
		}, EncryptionKey
	}()
}), define("models/storage/file_system", ["helpers/log"], function(Log) {
	var FileSystem;
	return FileSystem = function() {
		function FileSystem() {}
		return FileSystem.fs = null, FileSystem.initialize = function(callback, onError) {
			var self;
			return self = this, null === FileSystem.fs ? (window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem, window.requestFileSystem(window.PERSISTENT, 1073741824, function(fileSystem) {
				return FileSystem.fs = fileSystem, callback()
			}, function(error) {
				return Log.e("Unable to load filesystem "), Log.e(error)
			})) : callback()
		}, FileSystem.createDirectory = function(dirName, onSuccess, onFail) {
			return FileSystem.initialize(function() {
				return FileSystem.fs.root.getDirectory(dirName, {
					create: !0
				}, function(dirEntry) {
					return Log.d(dirEntry), onSuccess(dirEntry)
				}, onFail)
			}, onFail)
		}, FileSystem.writeBlobToFile = function(fileName, blob, onSuccess, onError) {
			return FileSystem.initialize(function() {
				return FileSystem.fs.root.getFile(fileName, {
					create: !0
				}, function(fileEntry) {
					return fileEntry.createWriter(function(fileWriter) {
						return fileWriter.onwriteend = function(e) {
							return Log.d(fileEntry.toURL()), onSuccess(fileEntry.toURL())
						}, fileWriter.onerror = onError, fileWriter.write(blob)
					}, onError)
				}, onError)
			}, onError)
		}, FileSystem.getFile = function(fileName, onSuccess, onError) {
			return FileSystem.initialize(function() {
				return FileSystem.fs.root.getFile(fileName, {}, function(fileEntry) {
					return fileEntry.file(function(file) {
						var reader;
						return reader = new FileReader, reader.onloadend = function(e) {
							return onSuccess(this.result)
						}, reader.onerror = onError, reader.readAsText(file)
					}, onError)
				}, onError)
			}, onError)
		}, FileSystem
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("models/sync/sync_add_device_request", ["models/api/devices_api", "helpers/log", "ui/router", "models/devices/device_request_model"], function(DevicesApi, Log, Router, DeviceRequestModel) {
	var SyncAddDeviceRequest;
	return SyncAddDeviceRequest = function() {
		function SyncAddDeviceRequest(devicesApi, deviceRequestModel) {
			this.devicesApi = null != devicesApi ? devicesApi : new DevicesApi, this.deviceRequestModel = null != deviceRequestModel ? deviceRequestModel : DeviceRequestModel.get(), this.onFetchRequestFail = __bind(this.onFetchRequestFail, this), this.onFetchRequestSuccess = __bind(this.onFetchRequestSuccess, this), this.fetchRequest = __bind(this.fetchRequest, this)
		}
		return SyncAddDeviceRequest.prototype.fetchRequest = function() {
			return this.devicesApi.getAddDeviceRequestInfo(this.onFetchRequestSuccess, this.onFetchRequestFail)
		}, SyncAddDeviceRequest.prototype.onFetchRequestSuccess = function(response) {
			return this.deviceRequestModel.setModel(response), this.deviceRequestModel.setDeviceRequestPresent(!0)
		}, SyncAddDeviceRequest.prototype.onFetchRequestFail = function(response) {
			return Log.w("Could not get add device request info")
		}, SyncAddDeviceRequest
	}()
}), define("models/sync/sync_ga_tokens", [], function() {
	var SyncGATokens;
	return SyncGATokens = function() {
		function SyncGATokens() {}
		return SyncGATokens.prototype.syngGATokens = function() {
			throw new Error("Must implement syngGATokens")
		}, SyncGATokens
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("models/sync/sync_health_check", ["models/apps/app_manager"], function(AppManager) {
	var SyncHealthCheck;
	return SyncHealthCheck = function() {
		function SyncHealthCheck(appManager) {
			this.appManager = null != appManager ? appManager : AppManager.get(), this.performHealthCheckOnApps = __bind(this.performHealthCheckOnApps, this)
		}
		return SyncHealthCheck.prototype.performHealthCheckOnApps = function() {
			var authyApp, _i, _len, _ref;
			for (_ref = this.appManager.getAuthyApps(), _i = 0, _len = _ref.length; _len > _i; _i++) authyApp = _ref[_i], authyApp.needsHealthCheck() && authyApp.validateAndLock();
			return appManager.save()
		}, SyncHealthCheck
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("models/sync/sync_helper", ["helpers/totp", "helpers/log", "models/api/sync_api", "models/sync/sync_health_check", "models/sync/sync_time_sync", "models/sync/sync_ga_tokens", "models/sync/sync_add_device_request", "models/sync/sync_password", "models/sync/sync_rotate_key", "models/apps/app_manager"], function(TOTP, Log, SyncApi, SyncHealthCheck, SyncTimeSync, SyncGATokens, SyncAddDeviceRequest, SyncPassword, SyncRotateKey, AppManager) {
	var SyncHelper;
	return SyncHelper = function() {
		function SyncHelper() {
			return this.onRotateKey = __bind(this.onRotateKey, this), this.onPasswordOutdated = __bind(this.onPasswordOutdated, this), this.onRequestSuccessful = __bind(this.onRequestSuccessful, this), this.isSynced = __bind(this.isSynced, this), this.sync = __bind(this.sync, this), instance ? instance : (instance = this, this.syncApi = new SyncApi, this.healthCheck = new SyncHealthCheck, this.timeSync = new SyncTimeSync, this.syncGATokens = new SyncGATokens, this.syncAddDeviceRequest = new SyncAddDeviceRequest, this.syncPassword = new SyncPassword, this.syncRotateKey = new SyncRotateKey, void(this.syncedAt = null))
		}
		var instance;
		return instance = null, SyncHelper.prototype.sync = function() {
			var options, self;
			if (!this.isSynced()) return self = this, options = {
				gaVersion: "3",
				gaTimestamp: AppManager.get().getPasswordTimestamp()
			}, this.syncApi.syncDeviceAuth(options, this.onRequestSuccessful, function(response) {
				return Log.w("Auth sync failed, retrying with non-auth sync: " + response.message), self.syncApi.syncDeviceNonAuth(options, self.onRequestSuccessful, function(response) {
					return self.onRequestFailed(response.message)
				}), this.syncedAt = new Date
			})
		}, SyncHelper.prototype.isSynced = function() {
			var now, validFor, validUntil;
			return null == this.syncedAt ? !1 : (validFor = 6e4, validUntil = this.syncedAt.getTime() + validFor, now = (new Date).getTime(), validUntil > now ? !0 : !1)
		}, SyncHelper.prototype.onRequestSuccessful = function(response) {
			return response.needsHealthCheck && this.onNeedsHealthCheck(), response.syncGa && this.onSyncGATokens(), response.addDeviceRequest && this.onAddDeviceRequestPresent(), response.keyRotationNonce && this.onRotateKey(response.keyRotationNonce), response.syncPassword && this.onPasswordOutdated(), this.timeSync.checkTimeSync(response.movingFactor)
		}, SyncHelper.prototype.onRequestFailed = function(message) {
			return Log.e("Sync failed: " + message)
		}, SyncHelper.prototype.onNeedsHealthCheck = function() {
			return this.healthCheck.performHealthCheckOnApps()
		}, SyncHelper.prototype.onSyncGATokens = function() {}, SyncHelper.prototype.onAddDeviceRequestPresent = function() {
			return this.syncAddDeviceRequest.fetchRequest()
		}, SyncHelper.prototype.onPasswordOutdated = function() {
			return this.syncPassword.syncPassword()
		}, SyncHelper.prototype.onRotateKey = function(nonce) {
			return this.syncRotateKey.rotateSecretSeed(nonce, function() {
				return AppManager.get().notifyListeners()
			})
		}, SyncHelper
	}()
}), define("models/sync/sync_password", ["models/api/sync_api", "ui/router", "helpers/log"], function(SyncApi, Router, Log) {
	var SyncPassword;
	return SyncPassword = function() {
		function SyncPassword() {
			this.syncApi = new SyncApi
		}
		return SyncPassword.prototype.syncPassword = function() {
			return this.syncApi.getSyncPassword(function(response) {
				return Router.get().goTo("UpdateBackupsPasswordController", response)
			}, function(response) {
				return Log.e("Could not get sync password: " + response.message)
			})
		}, SyncPassword
	}()
}), define("models/sync/sync_rotate_key", ["models/api/rsa_api", "models/apps/authy_rsa_key", "models/apps/master_token", "helpers/log", "models/apps/health_check", "models/apps/app_manager"], function(RSAApi, AuthyRSAKey, MasterToken, Log, HealthCheck, AppManager) {
	var SyncRotateKey;
	return SyncRotateKey = function() {
		function SyncRotateKey(rsaApi) {
			this.rsaApi = null != rsaApi ? rsaApi : new RSAApi(AuthyRSAKey)
		}
		return SyncRotateKey.prototype.rotateSecretSeed = function(nonce, cb) {
			null == cb && (cb = function() {}), Log.d("Rotating secret seed..."), this.rsaApi.rotateSecretSeed({
				nonce: nonce,
				onSuccess: function(encryptedSecretSeed) {
					return AuthyRSAKey.decrypt(encryptedSecretSeed, function(newSecretSeed) {
						return newSecretSeed ? (MasterToken.setSecretKey(newSecretSeed), HealthCheck.get().run({
							onSuccess: function() {
								return Log.d("Master token secret seed rotated and checked"), AppManager.get().syncAuthyApps({
									onSuccess: function() {
										return AppManager.get().saveAndNotifyListeners()
									}
								}), cb()
							}
						})) : (Log.e("Could not rotate secret seed: Decrypted seed is empty or null."), cb())
					})
				},
				onFail: function(response) {
					return Log.e("Could not rotate secret seed: " + response.message), cb()
				}
			})
		}, SyncRotateKey
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("models/sync/sync_time_sync", ["helpers/totp", "ui/widgets/dialog"], function(TOTP, Dialog) {
	var SyncTimeSync;
	return SyncTimeSync = function() {
		function SyncTimeSync() {
			this.getLocalMovingFactor = __bind(this.getLocalMovingFactor, this), this.getMovingFactorDifference = __bind(this.getMovingFactorDifference, this)
		}
		return SyncTimeSync.MOVING_FACTOR_CORRECTION_SIGNIFICANT = 18, SyncTimeSync.prototype.checkTimeSync = function(serverMovingFactor) {
			var movingFactorDifference;
			return movingFactorDifference = this.getMovingFactorDifference(parseInt(serverMovingFactor, 10)), this.isTimeUnsynchronized(movingFactorDifference) ? this.syncTime(movingFactorDifference) : void 0
		}, SyncTimeSync.prototype.isTimeUnsynchronized = function(movingFactorDifference) {
			return Math.abs(movingFactorDifference) > SyncTimeSync.MOVING_FACTOR_CORRECTION_SIGNIFICANT
		}, SyncTimeSync.prototype.syncTime = function(movingFactorDifference) {
			return TOTP.setMovingFactorCorrection(movingFactorDifference * TOTP.DEFAULT_TIME_STEPS)
		}, SyncTimeSync.prototype.getMovingFactorDifference = function(serverMovingFactor) {
			return serverMovingFactor - this.getLocalMovingFactor()
		}, SyncTimeSync.prototype.getLocalMovingFactor = function() {
			return TOTP.getLocalMovingFactor()
		}, SyncTimeSync
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("models/user_info_model", ["helpers/json_storage", "models/api/account_api", "models/base_model", "models/api/devices_api"], function(JsonStorage, AccountApi, BaseModel, DevicesApi) {
	var UserInfoModel;
	return UserInfoModel = function(_super) {
		function UserInfoModel() {
			this.setCellphone = __bind(this.setCellphone, this), this.setCountryCode = __bind(this.setCountryCode, this), UserInfoModel.__super__.constructor.call(this), this.accountApi = new AccountApi, this.devicesApi = new DevicesApi
		}
		return __extends(UserInfoModel, _super), UserInfoModel.prototype.getStorageLocation = function() {
			return "authy.storage.userinfo"
		}, UserInfoModel.prototype.isMultiDeviceEnabled = function() {
			return null != this.model ? this.model.multiDevicesEnabled : !1
		}, UserInfoModel.prototype.getEmail = function() {
			return this.model.email
		}, UserInfoModel.prototype.getCountryCode = function() {
			return this.model.countryCode
		}, UserInfoModel.prototype.getCellphone = function() {
			return this.model.cellphone
		}, UserInfoModel.prototype.getUserId = function() {
			return this.model.userId
		}, UserInfoModel.prototype.setCountryCode = function(countryCode) {
			return this.model.countryCode = countryCode
		}, UserInfoModel.prototype.setCellphone = function(cellphone) {
			return this.model.cellphone = cellphone
		}, UserInfoModel.prototype.changeEmail = function(email, onSuccess, onFail) {
			return this.accountApi.changeEmail(email, onSuccess, onFail)
		}, UserInfoModel.prototype.changePhone = function(countryCode, phoneNumber, onSuccess, onFail) {
			return this.accountApi.changePhone(phoneNumber, countryCode, onSuccess, onFail)
		}, UserInfoModel.prototype.setMultiDevicesEnabled = function(enabled, onSuccess, onFail) {
			var self;
			return null == onFail && (onFail = function() {}), self = this, this.devicesApi.setMultiDevicesEnabled(enabled, function() {
				return self.model.multiDevicesEnabled = enabled, self.notifyListeners(), onSuccess()
			}, onFail)
		}, UserInfoModel.prototype.toJson = function() {
			var json;
			return json = {
				email: this.model.email,
				countryCode: this.model.countryCode,
				cellphone: this.model.cellphone,
				userId: this.model.userId,
				multiDevicesEnabled: this.model.multiDevicesEnabled
			}
		}, UserInfoModel.prototype.fromJson = function(data) {
			var object;
			return object = {
				email: data.email,
				countryCode: data.countryCode,
				cellphone: data.cellphone,
				userId: data.userId,
				multiDevicesEnabled: data.multiDevicesEnabled
			}
		}, UserInfoModel.prototype.fetch = function(onSuccess, onError) {
			var self;
			return null == onError && (onError = function() {}), self = this, null != this.model && this.notifyListeners(), this.accountApi.getUserInfo(function(data) {
				return self.setModel(data), self.save(), self.notifyListeners(), onSuccess()
			}, onError)
		}, UserInfoModel.prototype.isLoadedToMemory = function() {
			return null !== this.model
		}, UserInfoModel
	}(BaseModel)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("ui/a_view", ["exceptions/unimplemented_method_exception", "helpers/key_codes", "helpers/log"], function(UnimplementedMethodException, KeyCodes, Log) {
	var View;
	return View = function() {
		function View(where) {
			this.where = null != where ? where : "body", this.getCommonParams = __bind(this.getCommonParams, this), this.render = __bind(this.render, this), this.template = null, this.output = null, this.partials = null, this.modelClone = null, this.cachingEnabled = !1, this.cacheValid = !0
		}
		return View.MUSTACHES_LOCATION = "ui/mustaches", View.PARTIALS_CACHE = {}, View.COMMON_VIEW_PARAMS = {}, View.prototype.render = function(options, cb) {
			var self, templateName;
			return null == cb && (cb = function() {}), self = this, templateName = this.getTemplateName(), this.cachingEnabled === !1 ? null != self.partials ? self.loadPartials(function(partials) {
				return self.loadTemplate(function(template) {
					return self.renderMustache(template, options, cb, partials)
				})
			}) : self.loadTemplate(function(template) {
				return self.renderMustache(template, options, cb)
			}) : this.shouldIgnoreCache(options) ? (null != self.partials ? self.loadPartials(function(partials) {
				return self.loadTemplate(function(template) {
					return self.renderMustache(template, options, cb, partials)
				})
			}) : self.loadTemplate(function(template) {
				return self.renderMustache(template, options, cb)
			}), self.modelClone = $.extend(!0, {}, options), self.cacheValid = !0) : void 0
		}, View.prototype.renderMustache = function(template, initialOptions, cb, partials) {
			var options, partial, _i, _len, _ref;
			if (null == partials && (partials = {}), options = this.getCommonParams(initialOptions), this.output = Mustache.render(template, options, partials), $(this.where).html(this.output), null != this.partials)
				for (_ref = this.partials, _i = 0, _len = _ref.length; _len > _i; _i++) partial = _ref[_i], partial.update();
			return this.update(options), cb()
		}, View.prototype.getCommonParams = function(options) {
			var extraParams;
			return extraParams = {
				shouldDisplayNotifIcon: !View.COMMON_VIEW_PARAMS.hasPassword || View.COMMON_VIEW_PARAMS.hasDeviceRequest
			}, $.extend({}, options, View.COMMON_VIEW_PARAMS, extraParams)
		}, View.prototype.shouldIgnoreCache = function(options) {
			var cacheInvalid, equalToCache;
			return cacheInvalid = !this.cacheValid, equalToCache = _.isEqual(options, this.modelClone), !equalToCache || cacheInvalid
		}, View.prototype.invalidateCache = function() {
			return this.cacheValid = !1
		}, View.prototype.loadFile = function(url, callback) {
			return $.get(url, {}).success(function(data) {
				return callback(data)
			})
		}, View.prototype.loadPartials = function(callback) {
			var doloop, partials_map, self;
			return self = this, partials_map = {}, (doloop = function(index) {
				var key, location;
				return index < self.partials.length ? (key = self.partials[index].getPartialName(), location = self.partials[index].getPartialLocation(), View.isPartialLoaded(key) ? (partials_map[key] = View.getPartial(key), doloop(index + 1)) : self.loadFile(location, function(data) {
					return partials_map[key] = data, View.addPartialToCache(key, data), doloop(index + 1)
				})) : callback(partials_map)
			})(0)
		}, View.prototype.loadTemplate = function(callback) {
			var self;
			return self = this, this.isTemplateLoaded() ? callback(this.template) : this.loadFile("" + this.getTemplateLocation() + "/" + this.getTemplateName() + ".mustache", function(data) {
				return self.template = data, callback(data)
			})
		}, View.prototype.onLoad = function(cb) {
			this.isTemplateLoaded() ? cb() : this.loadTemplate(cb);
		}, View.prototype.getTemplateLocation = function() {
			return View.MUSTACHES_LOCATION
		}, View.prototype.update = function(options) {
			throw new UnimplementedMethodException
		}, View.prototype.getTemplateName = function() {
			return _.str.underscored(this.constructor.name).replace("_view", "_screen")
		}, View.prototype.isTemplateLoaded = function() {
			return null != this.template
		}, View.prototype.bindClickAndEnterEvents = function(textInput, button, callback, one) {
			var clickFunc, keyupFunc;
			return null == one && (one = !1), keyupFunc = function(e) {
				return KeyCodes.isEnter(e) ? (textInput.blur(), callback(e, textInput, button, !1, keyupFunc)) : void 0
			}, clickFunc = function(e) {
				return callback(e, textInput, button, !0, clickFunc)
			}, textInput.on("keyup.clickAndEnter", keyupFunc), button.on("click.clickAndEnter", clickFunc)
		}, View.prototype.unbindClickAndEnterEvents = function(textInput, button, callback) {
			return textInput.off("keyup.clickAndEnter", callback), button.off("click.clickAndEnter", callback)
		}, View.prototype.bindEnterEvent = function(textInput, callback) {
			return textInput.on("keyup", function(e) {
				return KeyCodes.isEnter(e) ? callback(e, this) : void 0
			})
		}, View.addCommonParam = function(key, value) {
			return View.COMMON_VIEW_PARAMS[key] = value
		}, View.isPartialLoaded = function(key) {
			return key in View.PARTIALS_CACHE
		}, View.addPartialToCache = function(key, data) {
			View.PARTIALS_CACHE[key] = data
		}, View.getPartial = function(key) {
			return View.PARTIALS_CACHE[key]
		}, View
	}.call(this)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("ui/account_view", ["ui/a_view", "exceptions/unimplemented_method_exception", "models/storage/encryption_key", "ui/widgets/dialog", "ui/router"], function(View, UnimplementedMethodException, EncryptionKey, Dialog, Router) {
	var AccountView;
	return AccountView = function(_super) {
		function AccountView() {
			this.getMasterPassword = __bind(this.getMasterPassword, this), this.onUserChangePassword = __bind(this.onUserChangePassword, this), this.onUserSetPassword = __bind(this.onUserSetPassword, this), this.isPasswordInputValid = __bind(this.isPasswordInputValid, this), AccountView.__super__.constructor.call(this), this.where = "#tabContent", this.phone = null, this.email = null, this.countryCode = null, this.cachingEnabled = !0, this.authyUI = null
		}
		return __extends(AccountView, _super), AccountView.prototype.update = function(options) {
			var inputElement, self;
			return self = this, self.initializeAuthyUI(), this.txtPhoneNumber = $("#txtPhoneNumber"), this.txtEmail = $("#txtEmail"), this.txtCountryCode = $("#country-code-0"), this.btnEditPhoneNumber = $("#btnEditPhoneNumber"), this.btnEditEmail = $("#btnEditEmail"), this.countriesInput = $(".countries-input"), this.countriesInput.attr("readonly", "true"), this.countriesInput.is("[readonly]") && (inputElement = document.getElementById("countries-input-0"), inputElement.onfocus = function() {}), this.btnEditPhoneNumber.click(function(e) {
				var countryCode, phone;
				return self.txtPhoneNumber.is("[readonly]") ? (self.enablePhoneField(!0), self.txtPhoneNumber.focus(), self.countriesInput.focus(function() {
					return $("#countries-autocomplete-0").show()
				}), self.phone = self.getPhoneNumber(), self.countryCode = self.getCountryCode()) : (phone = self.getPhoneNumber(), countryCode = self.getCountryCode(), self.onEditPhoneNumber(countryCode, phone))
			}), this.btnEditEmail.click(function(e) {
				var email;
				return self.txtEmail.is("[readonly]") ? (self.enableEmailField(!0), self.txtEmail.focus(), self.email = self.getEmail()) : (email = self.getEmail(), self.onEditEmail(email))
			}), this.passwordInputDiv = $(".inputInput.passwordInput"), this.txtMasterPassword = $("#txtMasterPassword"), this.passwordMsg = $(".passwordMsg"), this.btnSetMasterPassword = $("#btnSetMasterPassword"), this.btnChangeMasterPassword = $("#btnChangeMasterPassword"), this.btnSaveMasterPassword = $("#btnSaveMasterPassword"), this.btnChangeMasterPassword.click(function(e) {
				return self.txtMasterPassword.is("[readonly]") ? (self.passwordMsg.find("p").text("Enter a new master password."), self.passwordMsg.show(), self.enableMasterPasswordField(!0), self.txtMasterPassword.focus(), self.unbindClickAndEnterEvents(self.txtMasterPassword, self.btnSetMasterPassword), self.bindClickAndEnterEvents(self.txtMasterPassword, self.btnSetMasterPassword, self.onUserSetPassword)) : void 0
			}), EncryptionKey.userHasSetPassword(function(userHasSetPassword) {
				return userHasSetPassword ? void 0 : (self.unbindClickAndEnterEvents(self.txtMasterPassword, self.btnSetMasterPassword), self.bindClickAndEnterEvents(self.txtMasterPassword, self.btnSetMasterPassword, self.onUserSetPassword))
			})
		}, AccountView.prototype.isPasswordInputValid = function(onValid, onInvalid) {
			var masterPassword, self;
			return null == onInvalid && (onInvalid = function() {}), self = this, masterPassword = this.getMasterPassword(), this.txtMasterPassword.val(""), masterPassword ? masterPassword.length < 6 ? (Dialog.error(Dialog.LIGHT, "The password should at least be 6 characters in length."), onInvalid()) : onValid(masterPassword) : (Dialog.error(Dialog.LIGHT, "You must enter a password"), onInvalid())
		}, AccountView.prototype.onUserSetPassword = function() {
			var self;
			return self = this, this.isPasswordInputValid(function(masterPassword) {
				return self.unbindClickAndEnterEvents(self.txtMasterPassword, self.btnSetMasterPassword), self.btnSetMasterPassword.hide(), self.btnSaveMasterPassword.show(), self.passwordInputDiv.siblings(".inputLabel").text("Confirm Password"), self.passwordMsg.find("p").text("Re-enter your password"), self.passwordInputDiv.removeClass("noPassword"), self.txtMasterPassword.attr("placeholder", ""), self.txtMasterPassword.focus(), self.unbindClickAndEnterEvents(self.txtMasterPassword, self.btnSaveMasterPassword), self.bindClickAndEnterEvents(self.txtMasterPassword, self.btnSaveMasterPassword, function(e) {
					return self.onUserChangePassword(masterPassword)
				})
			})
		}, AccountView.prototype.onUserChangePassword = function(password) {
			var self;
			return self = this, this.isPasswordInputValid(function(masterPassword) {
				return null != password ? password === masterPassword ? self.onChangePassword(masterPassword) : Dialog.error(Dialog.LIGHT, "The passwords don't match.", function() {
					return Router.get().goTo("AccountController")
				}) : self.onChangePassword(masterPassword)
			})
		}, AccountView.prototype.getCountryCode = function() {
			return this.txtCountryCode.val().trim()
		}, AccountView.prototype.getPhoneNumber = function() {
			return this.txtPhoneNumber.val().trim()
		}, AccountView.prototype.getEmail = function() {
			return this.txtEmail.val().trim()
		}, AccountView.prototype.getMasterPassword = function() {
			return this.txtMasterPassword.val()
		}, AccountView.prototype.enableEmailField = function(value) {
			value ? this.btnEditEmail.text("Save") : this.btnEditEmail.text("Change"), this.txtEmail.prop("readonly", !value)
		}, AccountView.prototype.enablePhoneField = function(value) {
			value ? this.btnEditPhoneNumber.text("Save") : this.btnEditPhoneNumber.text("Change"), this.txtPhoneNumber.prop("readonly", !value), this.txtCountryCode.prop("readonly", !value)
		}, AccountView.prototype.enableMasterPasswordField = function(value) {
			value ? (this.btnChangeMasterPassword.hide(), this.btnSetMasterPassword.show()) : (this.btnChangeMasterPassword.show(), this.btnSetMasterPassword.hide()), this.txtMasterPassword.prop("readonly", !value)
		}, AccountView.prototype.cancelEdit = function() {
			return this.enablePhoneField(!1), this.enableEmailField(!1), this.email && this.txtEmail.val(this.email), this.phone && this.txtPhoneNumber.val(this.phone), this.countryCode ? this.txtCountryCode.val(this.countryCode) : void 0
		}, AccountView.prototype.onEditPhoneNumber = function(countryCode, phoneNumber) {
			throw new UnimplementedMethodException("method onEditPhoneNumber not implemented")
		}, AccountView.prototype.onEditEmail = function(email) {
			throw new UnimplementedMethodException("method onEditEmail not implemented")
		}, AccountView.prototype.onChangePassword = function(password) {
			throw new UnimplementedMethodException("method onChangePassword not implemented")
		}, AccountView.prototype.getTemplateLocation = function() {
			return "" + View.MUSTACHES_LOCATION + "/settings"
		}, AccountView.prototype.initializeAuthyUI = function() {
			return null == this.authyUI && (this.authyUI = new Authy.UI, this.authyUI.autocomplete = function(obj, hideList) {
				var countryCode, listId;
				listId = obj.getAttribute("data-list-id"), countryCode = obj.getAttribute("rel"), $("#countries-input-" + listId).val("+" + countryCode), this.setCountryCode(listId, countryCode), hideList && $("#countries-autocomplete-" + listId).css("display", "none")
			}), this.authyUI.init()
		}, AccountView
	}(View)
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("ui/backups_password_view", ["ui/a_view", "ui/widgets/dialog", "ui/router", "exceptions/unimplemented_method_exception", "ui/settings_view", "ui/partials/settings_bottom_menu_partial", "ui/partials/navbar_partial"], function(View, Dialog, Router, UnimplementedMethodException, SettingsView, SettingsBottomMenuPartial, NavbarPartial) {
	var BackupsPasswordView;
	return BackupsPasswordView = function(_super) {
		function BackupsPasswordView() {
			BackupsPasswordView.__super__.constructor.call(this), this.where = "body", this.partials = [new SettingsBottomMenuPartial({
				tab: SettingsView.EXTERNAL_ACCOUNTS_TAB
			}), new NavbarPartial({
				enabled: !1,
				inSettings: !0
			})]
		}
		return __extends(BackupsPasswordView, _super), BackupsPasswordView.prototype.update = function(options) {
			var self;
			return self = this, this.passwordInput = $("#password-text"), this.submitButton = $("#btn-set-backups-password"), this.tempPassword = "", this.bindClickAndEnterEvents(this.passwordInput, this.submitButton, function() {
				var password;
				return password = self.passwordInput.val(), password ? self.tempPassword ? password === self.tempPassword ? self.onSetPassword(password) : Dialog.error(Dialog.LIGHT, "The passwords don't match", "Error!", function() {
					return self.tempPassword = "", self.submitButton.text("Enable Backups"), self.passwordInput.attr("placeholder", "Enter a backups password"), self.passwordInput.val(""), self.passwordInput.focus()
				}) : (self.tempPassword = password, self.submitButton.text("Confirm Password"), self.passwordInput.attr("placeholder", "Re-enter password"), self.passwordInput.val(""), self.passwordInput.focus()) : Dialog.error(Dialog.LIGHT, "The password can't be empty")
			})
		}, BackupsPasswordView.prototype.onSetPassword = function(password) {
			throw new UnimplementedMethodException
		}, BackupsPasswordView
	}(View)
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("ui/change_phone_confirmation_view", ["ui/a_view", "exceptions/unimplemented_method_exception", "ui/widgets/dialog", "helpers/log"], function(View, UnimplementedMethodException, Dialog, Log) {
	var ChangePhoneConfirmationView;
	return ChangePhoneConfirmationView = function(_super) {
		function ChangePhoneConfirmationView() {
			ChangePhoneConfirmationView.__super__.constructor.call(this), this.where = "#tabContent"
		}
		return __extends(ChangePhoneConfirmationView, _super), ChangePhoneConfirmationView.prototype.update = function(options) {
			var self, throttledRequestCall, throttledRequestSMS;
			return self = this, throttledRequestSMS = $.debounce(6e4, !0, function() {
				return Log.d("Requested change phone confirmation pin by SMS."), self.onRequestConfirmationPinSmsClicked()
			}), $("#btnRequestPinSms").click(throttledRequestSMS), throttledRequestCall = $.debounce(6e4, !0, function() {
				return Log.d("Requested change phone confirmation pin by Call."), self.onRequestConfirmationPinCallClicked()
			}), $("#btnRequestPinCall").click(throttledRequestCall), this.bindClickAndEnterEvents($("#txtConfirmationPin"), $("#btnConfirm"), function() {
				var pin;
				return pin = self.getPinInput(), pin ? self.onConfirmClicked(pin) : Dialog.error(Dialog.LIGHT, "You must enter the confirmation pin")
			})
		}, ChangePhoneConfirmationView.prototype.getPinInput = function() {
			return $("#txtConfirmationPin").val()
		}, ChangePhoneConfirmationView.prototype.getTemplateLocation = function() {
			return "" + View.MUSTACHES_LOCATION + "/settings"
		}, ChangePhoneConfirmationView.prototype.onRequestConfirmationPinSmsClicked = function() {
			throw new UnimplementedMethodException
		}, ChangePhoneConfirmationView.prototype.onRequestConfirmationPinCallClicked = function() {
			throw new UnimplementedMethodException
		}, ChangePhoneConfirmationView.prototype.onConfirmClicked = function(pin) {
			throw new UnimplementedMethodException
		}, ChangePhoneConfirmationView
	}(View)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("ui/create_authenticator_account_view", ["ui/a_view", "exceptions/unimplemented_method_exception", "helpers/key_codes"], function(View, UnimplementedMethodException, KeyCodes) {
	var CreateAuthenticatorAccountView;
	return CreateAuthenticatorAccountView = function(_super) {
		function CreateAuthenticatorAccountView() {
			this.hideNavButtons = __bind(this.hideNavButtons, this), this.setInputAllCaps = __bind(this.setInputAllCaps, this), CreateAuthenticatorAccountView.__super__.constructor.call(this), this.where = "#tabContent"
		}
		return __extends(CreateAuthenticatorAccountView, _super), CreateAuthenticatorAccountView.prototype.update = function(options) {
			var self;
			return self = this, this.navButtons = $("#nav-buttons"), this.navButtons.show(), this.txtEnterCode = $("#txtEnterCode"), this.txtEnterCode.on("keyup", this.setInputAllCaps), this.bindClickAndEnterEvents(this.txtEnterCode, $("#btnAddAccount"), function(e) {
				var secret;
				return secret = self.txtEnterCode.val(), self.onCreateAccount(secret)
			}), $(".back-button").click(function() {
				return self.onBackClicked()
			})
		}, CreateAuthenticatorAccountView.prototype.onCreateAccount = function(secret) {
			throw new UnimplementedMethodException("Must implement onCreateAccount in controller")
		}, CreateAuthenticatorAccountView.prototype.getTemplateLocation = function() {
			return "" + View.MUSTACHES_LOCATION + "/settings"
		}, CreateAuthenticatorAccountView.prototype.setInputAllCaps = function() {
			return this.txtEnterCode.val(this.txtEnterCode.val().toUpperCase())
		}, CreateAuthenticatorAccountView.prototype.hideNavButtons = function() {
			return this.navButtons.hide()
		}, CreateAuthenticatorAccountView.prototype.onBackClicked = function() {
			throw new UnimplementedMethodException("onBackClicked should be overriden in controller")
		}, CreateAuthenticatorAccountView
	}(View)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("ui/device_request_view", ["ui/a_view", "exceptions/unimplemented_method_exception", "ui/widgets/dialog", "models/devices/device_request_model"], function(View, UnimplementedMethodException, Dialog, DeviceRequestModel) {
	var DeviceRequestView;
	return DeviceRequestView = function(_super) {
		function DeviceRequestView() {
			this.onAcceptBtnClicked = __bind(this.onAcceptBtnClicked, this), DeviceRequestView.__super__.constructor.call(this), this.where = "#tabContent", DeviceRequestModel.get().addListener(function(data) {
				return View.addCommonParam("hasDeviceRequest", data.deviceRequestPresent)
			})
		}
		return __extends(DeviceRequestView, _super), DeviceRequestView.prototype.update = function(options) {
			var self;
			return self = this, $("#btnReject").click(function(e) {
				return self.onRejectDevice()
			}), $("#btnAccept").click(this.onAcceptBtnClicked)
		}, DeviceRequestView.prototype.getTemplateLocation = function() {
			return "" + View.MUSTACHES_LOCATION + "/settings"
		}, DeviceRequestView.prototype.onAcceptBtnClicked = function() {
			var dialog, self;
			return self = this, dialog = Dialog.input(Dialog.LIGHT, "Please enter OK to confirm you accept the new device", "Confirm", "Enter OK", function(input) {
				return input && "ok" === input.toLowerCase() ? (Dialog.close(dialog), self.onAcceptDevice()) : void 0
			})
		}, DeviceRequestView.prototype.onRejectDevice = function() {
			throw new UnimplementedMethodException("method DeviceRequestView.onRejectDevice must be overriden by controller")
		}, DeviceRequestView.prototype.onAcceptDevice = function() {
			throw new UnimplementedMethodException("method DeviceRequestView.onAcceptDevice must be overriden by controller")
		}, DeviceRequestView
	}(View)
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("ui/devices_view", ["ui/a_view", "exceptions/unimplemented_method_exception"], function(View, UnimplementedMethodException) {
	var DevicesView;
	return DevicesView = function(_super) {
		function DevicesView() {
			DevicesView.__super__.constructor.call(this), this.where = "#tabContent", this.cachingEnabled = !0
		}
		return __extends(DevicesView, _super), DevicesView.prototype.update = function(options) {
			var checkboxMultiDeviceState, self;
			return self = this, $("[data-device-id]").click(function(e) {
				var currentTarget, deviceId;
				return currentTarget = $(e.currentTarget), deviceId = parseInt(currentTarget.attr("data-device-id"), 10), self.onRemoveButtonClicked(deviceId)
			}), checkboxMultiDeviceState = $("#checkboxMultiDeviceState").change(function(e) {
				var enable;
				return enable = self.getMultiDeviceCheckboxValue(), self.onMultiDeviceStateChange(enable)
			})
		}, DevicesView.prototype.getMultiDeviceCheckboxValue = function() {
			return $("#checkboxMultiDeviceState").is(":checked")
		}, DevicesView.prototype.setMultiDeviceCheckbox = function(value) {
			var checkbox;
			return checkbox = $("#checkboxMultiDeviceState"), value ? checkbox.attr("checked", !0) : checkbox.removeAttr("checked")
		}, DevicesView.prototype.onRemoveButtonClicked = function(deviceId) {
			throw new UnimplementedMethodException
		}, DevicesView.prototype.onMultiDeviceStateChange = function(enable) {
			throw new UnimplementedMethodException
		}, DevicesView.prototype.getTemplateLocation = function() {
			return View.MUSTACHES_LOCATION + "/settings"
		}, DevicesView.prototype.shouldIgnoreCache = function(options) {
			var cacheInvalid, equalToCache;
			return cacheInvalid = !this.cacheValid, equalToCache = null != this.modelClone && _.isEqual(options.devices, this.modelClone.devices) && _.isEqual(options.multiDeviceEnabled, this.modelClone.multiDeviceEnabled), !equalToCache || cacheInvalid
		}, DevicesView
	}(View)
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("ui/external_accounts_view", ["ui/a_view", "exceptions/unimplemented_method_exception", "ui/widgets/dialog", "ui/router"], function(View, UnimplementedMethodException, Dialog, Router) {
	var ExternalAccountsView;
	return ExternalAccountsView = function(_super) {
		function ExternalAccountsView() {
			ExternalAccountsView.__super__.constructor.call(this), this.where = "#tabContent"
		}
		return __extends(ExternalAccountsView, _super), ExternalAccountsView.prototype.update = function(options) {
			var self;
			return self = this, this.txtBackupsPassword = $("#txtBackupsPassword"), this.txtAppPassword = $("#txtAppPassword"), this.btnChangeAppPassword = $("#btnChangeAppPassword"), this.btnChangeBackupsPassword = $("#btnChangeBackupsPassword"), this.tempPassword = "", $(".externalAccount").click(function(e) {
				var appId;
				return appId = $(this).find(".accountName").attr("data-app-id"), self.onAppClicked(appId)
			}), $(".deleteButton").click(function(e) {
				var appId;
				return e.stopPropagation(), appId = $(this).parent(".accountName").attr("data-app-id"), self.onDeleteAppClicked(appId)
			}), $(".undeleteButton").click(function(e) {
				var appId;
				return e.stopPropagation(), appId = $(this).parent(".accountName").attr("data-app-id"), self.onUndeleteAppClicked(appId)
			}), this.bindClickAndEnterEvents(this.txtBackupsPassword, this.btnChangeBackupsPassword, function(e) {
				var backupsPassword;
				return self.canChangeBackupsPassword() ? self.isBackupsPasswordEditable() ? (backupsPassword = self.txtBackupsPassword.val(), backupsPassword ? self.tempPassword ? backupsPassword === self.tempPassword ? (self.onSaveBackupsPassword(backupsPassword), self.btnChangeBackupsPassword.text("Change")) : Dialog.error(Dialog.LIGHT, "The passwords don't match", "Error!", function() {
					return Router.get().goTo("ExternalAccountsController")
				}) : (self.tempPassword = backupsPassword, self.txtBackupsPassword.attr("placeholder", "Re-enter"), self.txtBackupsPassword.val(""), self.txtBackupsPassword.focus(), self.btnChangeBackupsPassword.text("Confirm")) : Dialog.error(Dialog.LIGHT, "You must enter a password")) : options.backupsPassword ? (self.enableBackupsPassword(), self.btnChangeBackupsPassword.text("Set")) : void 0 : void Dialog.error(Dialog.LIGHT, "An Internet connection is required to change the password.")
			})
		}, ExternalAccountsView.prototype.updateImages = function(apps) {
			var app, id, _i, _len, _results;
			for (_results = [], _i = 0, _len = apps.length; _len > _i; _i++) app = apps[_i], id = app.getId(), _results.push($("[data-backup-image-id=" + id + "]").attr("src", app.getBackingUpImage()));
			return _results
		}, ExternalAccountsView.prototype.getTemplateLocation = function() {
			return "" + View.MUSTACHES_LOCATION + "/settings"
		}, ExternalAccountsView.prototype.enableBackupsPassword = function() {
			this.txtBackupsPassword.removeAttr("readonly"), this.txtBackupsPassword.val(""), this.txtBackupsPassword.focus()
		}, ExternalAccountsView.prototype.disableBackupsPassword = function() {
			this.txtBackupsPassword.attr("readonly", !0)
		}, ExternalAccountsView.prototype.canChangeBackupsPassword = function() {
			return window.navigator.onLine
		}, ExternalAccountsView.prototype.isBackupsPasswordEditable = function() {
			return !this.txtBackupsPassword.is("[readonly]")
		}, ExternalAccountsView.prototype.onAppClicked = function(appId) {
			throw new UnimplementedMethodException("onAppClicked should be implmemented in controller")
		}, ExternalAccountsView.prototype.onDeleteAppClicked = function(appId) {
			throw new UnimplementedMethodException("onDeleteAppClicked should be implmemented in controller")
		}, ExternalAccountsView.prototype.onUndeleteAppClicked = function(appId) {
			throw new UnimplementedMethodException("onUndeleteAppClicked should be implmemented in controller")
		}, ExternalAccountsView.prototype.onSaveBackupsPassword = function(password) {
			throw new UnimplementedMethodException("onSaveBackupsPassword should be implemented in controller")
		}, ExternalAccountsView
	}(View)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("ui/helpers/registration_nav_helper", [], function() {
	var RegistrationNavHelper;
	return RegistrationNavHelper = function() {
		function RegistrationNavHelper(view) {
			this.view = view, this.goToPushSection = __bind(this.goToPushSection, this), this.goToSmsSection = __bind(this.goToSmsSection, this), this.goToCallSection = __bind(this.goToCallSection, this), this.goToVerificationSection = __bind(this.goToVerificationSection, this), this.goToPhoneSection = __bind(this.goToPhoneSection, this), this.goToEmailSection = __bind(this.goToEmailSection, this), this.togglePushSectionVisibility = __bind(this.togglePushSectionVisibility, this), this.toggleSmsSectionVisibility = __bind(this.toggleSmsSectionVisibility, this), this.toggleCallSectionVisibility = __bind(this.toggleCallSectionVisibility, this), this.setCallPinLabel = __bind(this.setCallPinLabel, this), this.toggleBtnRequestPushVisibility = __bind(this.toggleBtnRequestPushVisibility, this), this.hideVerificationSection = __bind(this.hideVerificationSection, this), this.animateVerificationSectionTo = __bind(this.animateVerificationSectionTo, this), this.toggleVerificationSectionVisibility = __bind(this.toggleVerificationSectionVisibility, this), this.setVerificationSectionStyles = __bind(this.setVerificationSectionStyles, this), this.isEmailSectionVisible = __bind(this.isEmailSectionVisible, this), this.bindEditEmailSection = __bind(this.bindEditEmailSection, this), this.toggleEmailSectionVisibility = __bind(this.toggleEmailSectionVisibility, this), this.toggleEmailSectionEnabled = __bind(this.toggleEmailSectionEnabled, this), this.bindEditPhoneSection = __bind(this.bindEditPhoneSection, this), this.togglePhoneSectionVisibility = __bind(this.togglePhoneSectionVisibility, this), this.togglePhoneSectionEnabled = __bind(this.togglePhoneSectionEnabled, this), this.revertVerificationContainerToInitialState = __bind(this.revertVerificationContainerToInitialState, this), this.hideAllPinSections = __bind(this.hideAllPinSections, this), this.showVerificationContainer = __bind(this.showVerificationContainer, this), this.toggleVerificationContainerVisibility = __bind(this.toggleVerificationContainerVisibility, this), this.animateInputContainerTo = __bind(this.animateInputContainerTo, this), this.setAtPushSection = __bind(this.setAtPushSection, this), this.atPushSection = __bind(this.atPushSection, this), this.setAtCallSection = __bind(this.setAtCallSection, this), this.atCallSection = __bind(this.atCallSection, this), this.setAtSmsSection = __bind(this.setAtSmsSection, this), this.atSmsSection = __bind(this.atSmsSection, this), this.setAtVerificationSection = __bind(this.setAtVerificationSection, this), this.atVerificationSection = __bind(this.atVerificationSection, this), this.setAtEmailSection = __bind(this.setAtEmailSection, this), this.atEmailSection = __bind(this.atEmailSection, this), this.setAtPhoneSection = __bind(this.setAtPhoneSection, this), this.atPhoneSection = __bind(this.atPhoneSection, this), this.clearSections = __bind(this.clearSections, this), this.sections = {
				sectionPhone: !0,
				sectionEmail: !1,
				sectionVerification: !1,
				sectionSms: !1,
				sectionCall: !1,
				sectionPush: !1
			}, this.inputContainer = $("#inputContainer"), this.verificationContainer = $("#verificationContainer"), this.imgRegistrationLogo = $("#imgRegistrationLogo"), this.sectionPhone = $("#sectionPhone"), this.sectionEmail = $("#sectionEmail").hide(), this.sectionVerification = $("#sectionVerification").hide(), this.sectionSms = $("#sectionSms"), this.sectionCall = $("#sectionCall"), this.sectionPush = $("#sectionPush"), this.pinSections = $(".verificationPinSection"), this.btnGetDeviceStatus = $("#btnGetDeviceStatus"), this.btnSetEmail = $("#btnSetEmail"), this.btnRequestSms = $("#verificationSms"), this.btnRequestCall = $("#verificationCall"), this.btnRequestPush = $("#verificationPush"), this.txtCellphone = $("#txtCellphone"), this.txtCountryCode = $("#countries-input-0"), this.txtCountryClone = $("#txtCountryClone"), this.txtEmail = $("#txtEmail"), this.txtMessage = $("#txtMessage"), this.txtRegistrationPin = $("#txtRegistrationPin"), this.lblCallPin = $("#callPin")
		}
		return RegistrationNavHelper.ANIM_TIME = 300, RegistrationNavHelper.prototype.clearSections = function() {
			var key, _results;
			_results = [];
			for (key in this.sections) _results.push(this.sections[key] = !1);
			return _results
		}, RegistrationNavHelper.prototype.atPhoneSection = function() {
			return this.sections.sectionPhone
		}, RegistrationNavHelper.prototype.setAtPhoneSection = function() {
			return this.clearSections(), this.sections.sectionPhone = !0
		}, RegistrationNavHelper.prototype.atEmailSection = function() {
			return this.sections.sectionEmail
		}, RegistrationNavHelper.prototype.setAtEmailSection = function() {
			return this.clearSections(), this.sections.sectionEmail = !0
		}, RegistrationNavHelper.prototype.atVerificationSection = function() {
			return this.sections.sectionVerification
		}, RegistrationNavHelper.prototype.setAtVerificationSection = function() {
			return this.clearSections(), this.sections.sectionVerification = !0
		}, RegistrationNavHelper.prototype.atSmsSection = function() {
			return this.sections.sectionSms
		}, RegistrationNavHelper.prototype.setAtSmsSection = function() {
			return this.clearSections(), this.sections.sectionSms = !0
		}, RegistrationNavHelper.prototype.atCallSection = function() {
			return this.sections.sectionCall
		}, RegistrationNavHelper.prototype.setAtCallSection = function() {
			return this.clearSections(), this.sections.sectionCall = !0
		}, RegistrationNavHelper.prototype.atPushSection = function() {
			return this.sections.sectionPush
		}, RegistrationNavHelper.prototype.setAtPushSection = function() {
			return this.clearSections(), this.sections.sectionPush = !0
		}, RegistrationNavHelper.prototype.animateInputContainerTo = function(styles, cb) {
			return null == cb && (cb = function() {}), this.inputContainer.animate(styles, RegistrationNavHelper.ANIM_TIME, "swing", cb)
		}, RegistrationNavHelper.prototype.toggleVerificationContainerVisibility = function(cb) {
			return null == cb && (cb = function() {}), this.verificationContainer.fadeToggle(RegistrationNavHelper.ANIM_TIME, "swing", cb)
		}, RegistrationNavHelper.prototype.showVerificationContainer = function(cb) {
			return null == cb && (cb = function() {}), this.verificationContainer.show(cb)
		}, RegistrationNavHelper.prototype.hideAllPinSections = function(cb) {
			return null == cb && (cb = function() {}), this.pinSections.hide(cb)
		}, RegistrationNavHelper.prototype.revertVerificationContainerToInitialState = function() {
			return this.hideAllPinSections(), this.hideVerificationSection(), this.setVerificationSectionStyles({
				left: 310
			}), this.showVerificationContainer()
		}, RegistrationNavHelper.prototype.togglePhoneSectionEnabled = function(enable) {
			var self;
			return self = this, enable ? (this.txtCountryClone.hide(), this.txtCountryCode.show(), this.txtCellphone.removeClass("disabled"), this.txtCellphone.attr("readonly", !1), this.view.bindClickAndEnterEvents(this.txtCellphone, this.btnGetDeviceStatus, this.view.onCheckPhoneClicked), this.btnGetDeviceStatus.removeClass("disabled")) : (this.txtCountryClone.val(this.txtCountryCode.val()), this.txtCountryCode.hide(), this.txtCountryClone.show(), this.txtCellphone.addClass("disabled"), this.txtCellphone.attr("readonly", !0), this.view.unbindClickAndEnterEvents(this.txtCellphone, this.btnGetDeviceStatus), this.btnGetDeviceStatus.addClass("disabled"))
		}, RegistrationNavHelper.prototype.togglePhoneSectionVisibility = function(cb) {
			var self;
			return null == cb && (cb = function() {}), self = this, this.txtMessage.fadeToggle(RegistrationNavHelper.ANIM_TIME, "swing", function() {
				return self.txtCellphone.focus(), cb()
			})
		}, RegistrationNavHelper.prototype.bindEditPhoneSection = function(bind) {
			var self;
			return self = this, $.each([this.txtCountryClone, this.txtCellphone], function(i, v) {
				return v.off("click", self.goToPhoneSection), bind ? v.on("click", self.goToPhoneSection) : void 0
			})
		}, RegistrationNavHelper.prototype.toggleEmailSectionEnabled = function(enable) {
			var self;
			return self = this, enable ? (this.txtEmail.removeClass("disabled"), this.txtEmail.attr("readonly", !1), this.view.bindClickAndEnterEvents(this.txtEmail, this.btnSetEmail, this.view.onSetEmailClicked), this.btnSetEmail.removeClass("disabled")) : (this.txtEmail.addClass("disabled"), this.txtEmail.attr("readonly", !0), this.view.unbindClickAndEnterEvents(this.txtEmail, this.btnSetEmail), this.btnSetEmail.addClass("disabled"))
		}, RegistrationNavHelper.prototype.toggleEmailSectionVisibility = function(cb) {
			var self;
			return null == cb && (cb = function() {}), self = this, this.sectionEmail.fadeToggle(RegistrationNavHelper.ANIM_TIME, "swing", function() {
				return self.txtEmail.focus(), cb()
			})
		}, RegistrationNavHelper.prototype.bindEditEmailSection = function(bind) {
			return this.txtEmail.off("click", this.goToEmailSection), bind ? this.txtEmail.on("click", this.goToEmailSection) : void 0
		}, RegistrationNavHelper.prototype.isEmailSectionVisible = function() {
			return this.sectionEmail.is(":visible")
		}, RegistrationNavHelper.prototype.setVerificationSectionStyles = function(styles) {
			return this.sectionVerification.css(styles)
		}, RegistrationNavHelper.prototype.toggleVerificationSectionVisibility = function(cb) {
			return null == cb && (cb = function() {}), this.sectionVerification.fadeToggle(RegistrationNavHelper.ANIM_TIME, "swing", cb)
		}, RegistrationNavHelper.prototype.animateVerificationSectionTo = function(styles, cb) {
			return null == cb && (cb = function() {}), this.sectionVerification.animate(styles, RegistrationNavHelper.ANIM_TIME, "swing", cb)
		}, RegistrationNavHelper.prototype.hideVerificationSection = function() {
			return this.sectionVerification.hide()
		}, RegistrationNavHelper.prototype.toggleBtnRequestPushVisibility = function(show, cb) {
			return null == cb && (cb = function() {}), show && this.btnRequestPush.show(cb), show ? void 0 : this.btnRequestPush.hide(cb)
		}, RegistrationNavHelper.prototype.setCallPinLabel = function(pin) {
			return this.lblCallPin.text(pin)
		}, RegistrationNavHelper.prototype.toggleCallSectionVisibility = function(cb) {
			return null == cb && (cb = function() {}), this.sectionCall.fadeToggle(RegistrationNavHelper.ANIM_TIME, "swing", cb)
		}, RegistrationNavHelper.prototype.toggleSmsSectionVisibility = function(cb) {
			return null == cb && (cb = function() {}), this.sectionSms.fadeToggle(RegistrationNavHelper.ANIM_TIME, "swing", cb)
		}, RegistrationNavHelper.prototype.togglePushSectionVisibility = function(cb) {
			return null == cb && (cb = function() {}), this.sectionPush.fadeToggle(RegistrationNavHelper.ANIM_TIME, "swing", cb)
		}, RegistrationNavHelper.prototype.goToEmailSection = function(cb) {
			var self;
			return null == cb && (cb = function() {}), console.log("go to email section"), self = this, this.imgRegistrationLogo.hide(RegistrationNavHelper.ANIM_TIME), this.bindEditEmailSection(!1), this.atPhoneSection() ? (this.togglePhoneSectionEnabled(!1), this.togglePhoneSectionVisibility(function() {
				return self.toggleEmailSectionVisibility(), self.bindEditPhoneSection(!0)
			})) : this.atVerificationSection() ? this.toggleVerificationSectionVisibility(function() {
				return self.animateInputContainerTo({
					marginTop: 0,
					paddingTop: 88
				}, function() {
					return self.toggleEmailSectionEnabled(!0)
				})
			}) : (this.atSmsSection() || this.atCallSection() || this.atPushSection()) && this.toggleVerificationContainerVisibility(function() {
				return self.revertVerificationContainerToInitialState(), self.animateInputContainerTo({
					marginTop: 0,
					paddingTop: 88
				}, function() {
					return self.toggleEmailSectionEnabled(!0)
				})
			}), this.setAtEmailSection()
		}, RegistrationNavHelper.prototype.goToPhoneSection = function(cb) {
			var self;
			return null == cb && (cb = function() {}), console.log("go to phone section"), self = this, this.bindEditPhoneSection(!1), this.bindEditEmailSection(!1), this.imgRegistrationLogo.show(RegistrationNavHelper.ANIM_TIME), this.atEmailSection() ? (this.togglePhoneSectionEnabled(!0), this.toggleEmailSectionVisibility(function() {
				return self.togglePhoneSectionVisibility()
			})) : this.atVerificationSection() ? this.isEmailSectionVisible() ? (this.toggleVerificationSectionVisibility(), this.toggleEmailSectionVisibility(function() {
				return self.togglePhoneSectionEnabled(!0), self.toggleEmailSectionEnabled(!0), self.animateInputContainerTo({
					marginTop: 0,
					paddingTop: 88
				}, function() {
					return self.togglePhoneSectionVisibility()
				})
			})) : this.toggleVerificationSectionVisibility(function() {
				return self.togglePhoneSectionEnabled(!0), self.animateInputContainerTo({
					marginTop: 0,
					paddingTop: 88
				}, function() {
					return self.togglePhoneSectionVisibility()
				})
			}) : (this.atSmsSection() || this.atCallSection() || this.atPushSection()) && (this.isEmailSectionVisible() ? (this.toggleVerificationContainerVisibility(function() {
				return self.revertVerificationContainerToInitialState()
			}), this.toggleEmailSectionVisibility(function() {
				return self.togglePhoneSectionEnabled(!0), self.toggleEmailSectionEnabled(!0), self.animateInputContainerTo({
					marginTop: 0,
					paddingTop: 88
				}, function() {
					return self.togglePhoneSectionVisibility()
				})
			})) : this.toggleVerificationContainerVisibility(function() {
				return self.revertVerificationContainerToInitialState(), self.togglePhoneSectionEnabled(!0), self.animateInputContainerTo({
					marginTop: 0,
					paddingTop: 88
				}, function() {
					return self.togglePhoneSectionVisibility()
				})
			})), this.setAtPhoneSection()
		}, RegistrationNavHelper.prototype.goToVerificationSection = function(cb) {
			var self;
			return null == cb && (cb = function() {}), console.log("go to verification section"), self = this, this.imgRegistrationLogo.hide(RegistrationNavHelper.ANIM_TIME), this.atPhoneSection() ? (this.toggleBtnRequestPushVisibility(!0), this.togglePhoneSectionEnabled(!1), this.togglePhoneSectionVisibility(function() {
				return self.animateInputContainerTo({
					marginTop: 0,
					paddingTop: 35
				}, function() {
					return self.toggleVerificationSectionVisibility(cb), self.bindEditPhoneSection(!0)
				})
			})) : this.atEmailSection() && (this.toggleBtnRequestPushVisibility(!1), this.toggleEmailSectionEnabled(!1), this.animateInputContainerTo({
				marginTop: -23,
				paddingTop: 0
			}, function() {
				return self.toggleVerificationSectionVisibility(cb), self.bindEditPhoneSection(!0), self.bindEditEmailSection(!0)
			})), this.setAtVerificationSection()
		}, RegistrationNavHelper.prototype.goToCallSection = function(pin, cb) {
			var self;
			return null == cb && (cb = function() {}), console.log("go to call section"), self = this, this.setCallPinLabel(pin), this.atVerificationSection() ? this.animateVerificationSectionTo({
				left: 108
			}, function() {
				return self.toggleCallSectionVisibility()
			}) : this.atSmsSection() ? this.toggleSmsSectionVisibility(function() {
				return self.toggleCallSectionVisibility()
			}) : this.atPushSection() && this.togglePushSectionVisibility(function() {
				return self.toggleCallSectionVisibility()
			}), this.setAtCallSection()
		}, RegistrationNavHelper.prototype.goToSmsSection = function(cb) {
			var self;
			return null == cb && (cb = function() {}), console.log("go to sms section"), self = this, this.atVerificationSection() ? this.animateVerificationSectionTo({
				left: 108
			}, function() {
				return self.toggleSmsSectionVisibility(function() {
					return self.txtRegistrationPin.focus()
				})
			}) : this.atCallSection() ? this.toggleCallSectionVisibility(function() {
				return self.toggleSmsSectionVisibility(function() {
					return self.txtRegistrationPin.focus()
				})
			}) : this.atPushSection() && this.togglePushSectionVisibility(function() {
				return self.toggleSmsSectionVisibility(function() {
					return self.txtRegistrationPin.focus()
				})
			}), this.setAtSmsSection()
		}, RegistrationNavHelper.prototype.goToPushSection = function(cb) {
			var self;
			return null == cb && (cb = function() {}), console.log("go to Push section"), self = this, this.atVerificationSection() ? this.animateVerificationSectionTo({
				left: 108
			}, function() {
				return self.togglePushSectionVisibility()
			}) : this.atCallSection() ? this.toggleCallSectionVisibility(function() {
				return self.togglePushSectionVisibility()
			}) : this.atSmsSection() && this.toggleSmsSectionVisibility(function() {
				return self.togglePushSectionVisibility()
			}), this.setAtPushSection()
		}, RegistrationNavHelper
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("ui/partials/a_partial", ["exceptions/unimplemented_method_exception", "ui/a_view"], function(UnimplementedMethodException, View) {
	var Partial;
	return Partial = function() {
		function Partial(initOptions) {
			null == initOptions && (initOptions = {}), this.update = __bind(this.update, this), this.name = initOptions.name || _.str.underscored(this.constructor.name).split("_").slice(0, -1).join("_"), this.location = "" + Partial.PARTIALS_LOCATION + "/" + this.name + ".mustache"
		}
		return Partial.PARTIALS_LOCATION = "" + View.MUSTACHES_LOCATION + "/partials", Partial.prototype.update = function(options) {
			throw new UnimplementedMethodException
		}, Partial.prototype.getPartialLocation = function() {
			return this.location
		}, Partial.prototype.getPartialName = function() {
			return this.name
		}, Partial
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("ui/partials/navbar_partial", ["ui/partials/a_partial", "helpers/window_helper", "ui/router", "models/devices/device_request_model"], function(Partial, WindowHelper, Router, DeviceRequestModel) {
	var NavbarPartial;
	return NavbarPartial = function(_super) {
		function NavbarPartial(initOptions) {
			var self;
			null == initOptions && (initOptions = {}), this.onMinimizeClicked = __bind(this.onMinimizeClicked, this), this.onQuitClicked = __bind(this.onQuitClicked, this), this.onSettingsClicked = __bind(this.onSettingsClicked, this), this.update = __bind(this.update, this), NavbarPartial.__super__.constructor.call(this, initOptions), self = this, this.enabled = null != initOptions.enabled ? initOptions.enabled : !0, this.inSettings = null != initOptions.inSettings ? initOptions.inSettings : !1, DeviceRequestModel.get().addListener(NavbarPartial.updateNotifIcon)
		}
		return __extends(NavbarPartial, _super), NavbarPartial.prototype.update = function() {
			return this.enabled && (this.btnSettings = $("#btnSettings,#notifIcon"), this.btnSettings.click(this.onSettingsClicked)), this.btnQuit = $("#btnQuit"), this.btnMinimize = $("#btnMinimize"), this.btnQuit.click(this.onQuitClicked), this.btnMinimize.click(this.onMinimizeClicked)
		}, NavbarPartial.prototype.onSettingsClicked = function() {
			return Router.get().goTo("SettingsController")
		}, NavbarPartial.prototype.onQuitClicked = function() {
			return this.inSettings ? Router.get().goTo("TokensController") : WindowHelper.closeWindow()
		}, NavbarPartial.prototype.onMinimizeClicked = function() {
			return WindowHelper.minimizeWindow()
		}, NavbarPartial.updateNotifIcon = function(data) {
			return data.deviceRequestPresent ? $("#notifIcon").show() : void 0
		}, NavbarPartial
	}(Partial)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("ui/partials/navbar_register_partial", ["ui/partials/a_partial", "helpers/window_helper"], function(Partial, WindowHelper) {
	var NavbarRegisterPartial;
	return NavbarRegisterPartial = function(_super) {
		function NavbarRegisterPartial(initOptions) {
			null == initOptions && (initOptions = {}), this.update = __bind(this.update, this), NavbarRegisterPartial.__super__.constructor.call(this, initOptions)
		}
		return __extends(NavbarRegisterPartial, _super), NavbarRegisterPartial.prototype.update = function() {
			return this.btnQuit = $(".btn-quit"), this.btnMinimize = $(".btn-minimize"), this.btnQuit.click(this.onQuitClicked), this.btnMinimize.click(this.onMinimizeClicked)
		}, NavbarRegisterPartial.prototype.onQuitClicked = function() {
			return WindowHelper.closeWindow()
		}, NavbarRegisterPartial.prototype.onMinimizeClicked = function() {
			return WindowHelper.minimizeWindow()
		}, NavbarRegisterPartial
	}(Partial)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("ui/partials/settings_bottom_menu_partial", ["ui/partials/a_partial", "helpers/window_helper", "ui/router", "models/apps/backups_password_model", "controllers/a_controller", "models/apps/app_manager", "ui/widgets/dialog"], function(Partial, WindowHelper, Router, BackupsPasswordModel, Controller, AppManager, Dialog) {
	var SettingsBottomMenuPartial;
	return SettingsBottomMenuPartial = function(_super) {
		function SettingsBottomMenuPartial(initOptions) {
			if (null == initOptions && (initOptions = {}), this.onBackupsChanged = __bind(this.onBackupsChanged, this), this.onAddAuthenticatorAccountClicked = __bind(this.onAddAuthenticatorAccountClicked, this), this.update = __bind(this.update, this), SettingsBottomMenuPartial.__super__.constructor.call(this, initOptions), null == initOptions.tab) throw new Error("Need to pass tab to activate");
			this.tab = initOptions.tab
		}
		return __extends(SettingsBottomMenuPartial, _super), SettingsBottomMenuPartial.prototype.update = function() {
			var self;
			return self = this, this.btnAddAccount = $(".add-account"), this.btnAddAccount.click(this.onAddAuthenticatorAccountClicked), this.backupsCheckbox = $("#backups-checkbox"), "BackupsPasswordController" === Controller.RENDERED ? (this.backupsCheckbox.prop("checked", !0), this.backupsCheckbox.change(function() {
				return self.onBackupsChanged(this.checked)
			})) : BackupsPasswordModel.areBackupsEnabled(function(areBackupsEnabled) {
				return self.backupsCheckbox.prop("checked", areBackupsEnabled), self.backupsCheckbox.change(function() {
					return self.onBackupsChanged(this.checked)
				})
			})
		}, SettingsBottomMenuPartial.prototype.onAddAuthenticatorAccountClicked = function() {
			return AppManager.get().areAllAppsDecrypted() ? Router.get().goTo("SettingsController", {
				innerView: "CreateAuthenticatorAccountController",
				selectedTab: this.tab
			}) : Dialog.error(Dialog.LIGHT, "You must decrypt your accounts before adding a new one")
		}, SettingsBottomMenuPartial.prototype.onBackupsChanged = function(checked) {
			var self;
			return self = this, BackupsPasswordModel.isPasswordSet(function(isPasswordSet) {
				return checked ? AppManager.get().areAllAppsDecrypted() ? Router.get().goTo("BackupsPasswordController") : (Dialog.error(Dialog.LIGHT, "You must decrypt your accounts before enabling backups for this device."), self.backupsCheckbox.prop("checked", !1)) : (isPasswordSet && BackupsPasswordModel.setEnabled(!1), "BackupsPasswordController" === Controller.RENDERED ? Router.get().goTo("SettingsController", {
					innerView: Controller.RENDERED_BEFORE,
					selectedTab: Controller.LAST_TAB
				}) : void 0)
			})
		}, SettingsBottomMenuPartial
	}(Partial)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("ui/registration_view", ["ui/a_view", "exceptions/unimplemented_method_exception", "ui/partials/navbar_register_partial", "helpers/cellphone_helper", "helpers/email_helper", "ui/widgets/dialog", "ui/helpers/registration_nav_helper"], function(View, UnimplementedMethodException, NavbarRegisterPartial, CellphoneHelper, EmailHelper, Dialog, RegistrationNavHelper) {
	var RegistrationView;
	return RegistrationView = function(_super) {
		function RegistrationView() {
			this.verifyAndRegisterDevice = __bind(this.verifyAndRegisterDevice, this), this.requestPushPin = __bind(this.requestPushPin, this), this.requestCallPin = __bind(this.requestCallPin, this), this.requestSmsPin = __bind(this.requestSmsPin, this), this.createAccount = __bind(this.createAccount, this), this.getDeviceStatus = __bind(this.getDeviceStatus, this), this.onVerifyPin = __bind(this.onVerifyPin, this), this.onRequestPinPushClicked = __bind(this.onRequestPinPushClicked, this), this.onRequestPinCallClicked = __bind(this.onRequestPinCallClicked, this), this.onRequestPinSmsClicked = __bind(this.onRequestPinSmsClicked, this), this.onSetEmailClicked = __bind(this.onSetEmailClicked, this), this.onCheckPhoneClicked = __bind(this.onCheckPhoneClicked, this), this.validateEmail = __bind(this.validateEmail, this), this.validatePhone = __bind(this.validatePhone, this), this.clearRegistrationPin = __bind(this.clearRegistrationPin, this), this.getRegistrationPin = __bind(this.getRegistrationPin, this), this.getEmail = __bind(this.getEmail, this), this.getCellPhone = __bind(this.getCellPhone, this), this.getCountryCode = __bind(this.getCountryCode, this), this.goToPushSection = __bind(this.goToPushSection, this), this.goToCallSection = __bind(this.goToCallSection, this), this.goToSmsSection = __bind(this.goToSmsSection, this), this.goToVerificationSection = __bind(this.goToVerificationSection, this), this.goToPhoneSection = __bind(this.goToPhoneSection, this), this.goToEmailSection = __bind(this.goToEmailSection, this), RegistrationView.__super__.constructor.call(this), this.where = "body", this.partials = [new NavbarRegisterPartial]
		}
		var instance;
		return __extends(RegistrationView, _super), instance = null, RegistrationView.prototype.update = function(options) {
			var self;
			return self = this, this.initializeAuthyUI(), this.helper = new RegistrationNavHelper(self), CellphoneHelper.formatAsPhone(this.helper.txtCellphone), this.bindClickAndEnterEvents(this.helper.txtCellphone, this.helper.btnGetDeviceStatus, this.onCheckPhoneClicked), this.bindClickAndEnterEvents(this.helper.txtEmail, this.helper.btnSetEmail, this.onSetEmailClicked), this.helper.txtRegistrationPin.on("keyup", this.onVerifyPin), this.helper.btnRequestCall.click(this.onRequestPinCallClicked), this.helper.btnRequestSms.click(this.onRequestPinSmsClicked), this.helper.btnRequestPush.click(this.onRequestPinPushClicked)
		}, RegistrationView.prototype.goToEmailSection = function(cb) {
			return null == cb && (cb = function() {}), this.helper.goToEmailSection(cb)
		}, RegistrationView.prototype.goToPhoneSection = function(cb) {
			return null == cb && (cb = function() {}), this.helper.goToPhoneSection(cb)
		}, RegistrationView.prototype.goToVerificationSection = function(cb) {
			return null == cb && (cb = function() {}), this.helper.goToVerificationSection(cb)
		}, RegistrationView.prototype.goToSmsSection = function(cb) {
			return null == cb && (cb = function() {}), this.helper.goToSmsSection(cb)
		}, RegistrationView.prototype.goToCallSection = function(pin, cb) {
			return null == cb && (cb = function() {}), this.helper.goToCallSection(pin, cb)
		}, RegistrationView.prototype.goToPushSection = function(cb) {
			return null == cb && (cb = function() {}), this.helper.goToPushSection(cb)
		}, RegistrationView.prototype.getCountryCode = function() {
			return $("#country-code-0").val()
		}, RegistrationView.prototype.getCellPhone = function() {
			return this.helper.txtCellphone.val()
		}, RegistrationView.prototype.getEmail = function() {
			return this.helper.txtEmail.val()
		}, RegistrationView.prototype.getRegistrationPin = function() {
			return this.helper.txtRegistrationPin.val()
		}, RegistrationView.prototype.clearRegistrationPin = function() {
			return this.helper.txtRegistrationPin.val("")
		}, RegistrationView.prototype.initializeAuthyUI = function() {
			var authyUI;
			return authyUI = new Authy.UI, authyUI.autocomplete = function(obj, hideList) {
				var countryCode, listId;
				listId = obj.getAttribute("data-list-id"), countryCode = obj.getAttribute("rel"), $("#countries-input-" + listId).val("+" + countryCode), authyUI.setCountryCode(listId, countryCode), hideList && $("#countries-autocomplete-" + listId).css("display", "none")
			}, authyUI.init()
		}, RegistrationView.prototype.validatePhone = function(countryCode, cellphone) {
			return CellphoneHelper.validateCountryCode(countryCode) ? CellphoneHelper.validatePhoneNumber(cellphone) ? !0 : (this.showFailDialog("Please enter a valid cellphone number."), !1) : (this.showFailDialog("Please select your country by clicking on the left box."), !1)
		}, RegistrationView.prototype.validateEmail = function(email) {
			return EmailHelper.isValid(email) ? !0 : (this.showFailDialog("Please enter a valid email."), !1)
		}, RegistrationView.prototype.showFailDialog = function(message, title, cb) {
			return null == title && (title = "Error!"), null == cb && (cb = function() {}), Dialog.error(Dialog.DARK, message, title, cb)
		}, RegistrationView.prototype.onCheckPhoneClicked = function(e) {
			return this.validatePhone(this.getCountryCode(), this.getCellPhone()) ? this.getDeviceStatus(this.getCountryCode(), this.getCellPhone()) : void 0
		}, RegistrationView.prototype.onSetEmailClicked = function(e) {
			return this.validateEmail(this.getEmail()) ? this.createAccount(this.getCountryCode(), this.getCellPhone(), this.getEmail()) : void 0
		}, RegistrationView.prototype.onRequestPinSmsClicked = function(e) {
			return this.requestSmsPin()
		}, RegistrationView.prototype.onRequestPinCallClicked = function(e) {
			return this.requestCallPin()
		}, RegistrationView.prototype.onRequestPinPushClicked = function(e) {
			return this.requestPushPin()
		}, RegistrationView.prototype.onVerifyPin = function(e) {
			var pin;
			return pin = _.str.trim(this.getRegistrationPin()), 6 === pin.length && pin ? this.verifyAndRegisterDevice(pin) : void 0
		}, RegistrationView.prototype.getDeviceStatus = function(countryCode, cellphone) {
			throw new UnimplementedMethodException
		}, RegistrationView.prototype.createAccount = function(countryCode, cellphone, email) {
			throw new UnimplementedMethodException
		}, RegistrationView.prototype.requestSmsPin = function() {
			throw new UnimplementedMethodException
		}, RegistrationView.prototype.requestCallPin = function() {
			throw new UnimplementedMethodException
		}, RegistrationView.prototype.requestPushPin = function() {
			throw new UnimplementedMethodException
		}, RegistrationView.prototype.verifyAndRegisterDevice = function(registrationPin) {
			throw new UnimplementedMethodException
		}, RegistrationView.get = function() {
			return null == instance && (instance = new RegistrationView), instance
		}, RegistrationView
	}(View)
}), define("ui/router", [], function() {
	var Router;
	return Router = function() {
		function Router() {}
		var RouterSingleton, instance;
		return instance = null, RouterSingleton = function() {
			function RouterSingleton() {
				this.mappings = {}
			}
			return RouterSingleton.prototype.register = function(name, controller) {
				return null == this.mappings[name] ? this.mappings[name] = controller : void 0
			}, RouterSingleton.prototype.goTo = function(name, params) {
				return null == params && (params = {}), this.mappings[name].beforeShow(params)
			}, RouterSingleton.prototype.getController = function(name) {
				return this.mappings[name] || null
			}, RouterSingleton
		}(), Router.get = function() {
			return null != instance ? instance : instance = new RouterSingleton
		}, Router
	}()
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("ui/settings_view", ["ui/a_view", "exceptions/unimplemented_method_exception", "ui/partials/settings_bottom_menu_partial", "ui/partials/navbar_partial"], function(View, UnimplementedMethodException, SettingsBottomMenuPartial, NavbarPartial) {
	var SettingsView;
	return SettingsView = function(_super) {
		function SettingsView() {
			SettingsView.__super__.constructor.call(this), this.where = "body", this.partials = [new SettingsBottomMenuPartial({
				tab: SettingsView.EXTERNAL_ACCOUNTS_TAB
			})]
		}
		return __extends(SettingsView, _super), SettingsView.ACCOUNT_TAB = "tabHeaderAccount", SettingsView.EXTERNAL_ACCOUNTS_TAB = "tabHeaderExternalAccounts", SettingsView.DEVICES_TAB = "tabHeaderDevices", SettingsView.ICON_UNSELECTED_ACCOUNT = "img/settings-screen/account_icon_gray.png", SettingsView.ICON_UNSELECTED_EXTERNAL_ACCOUNTS = "img/settings-screen/ext_accounts_icon_gray.png", SettingsView.ICON_UNSELECTED_DEVICES = "img/settings-screen/devices_icon_gray.png", SettingsView.ICON_SELECTED_ACCOUNT = "img/settings-screen/account_icon_blue.png", SettingsView.ICON_SELECTED_EXTERNAL_ACCOUNTS = "img/settings-screen/ext_accounts_icon_blue.png", SettingsView.ICON_SELECTED_DEVICES = "img/settings-screen/devices_icon_blue.png", SettingsView.prototype.update = function(options) {
			var self;
			return self = this, this.btnQuit = $("#btnQuitSettings"), this.btnQuit.click(this.onQuitClicked), this.btnMinimize = $("#btnMinimize"), this.btnMinimize.click(this.onMinimizeClicked), this.selectTab(options.selectedTab), $(".tab").click(function(e) {
				var id;
				return $("#nav-buttons").hide(), id = e.currentTarget.id, self.selectTab(id), self.performTabAction(id)
			})
		}, SettingsView.prototype.selectTab = function(tabId) {
			var imgAccount, imgDevices, imgExternalAccounts;
			return $(".tab").removeClass("selected"), $("#" + tabId).addClass("selected"), imgAccount = $("#imgAccount"), imgExternalAccounts = $("#imgExternalAccounts"), imgDevices = $("#imgDevices"), imgAccount.attr("src", SettingsView.ICON_UNSELECTED_ACCOUNT), imgExternalAccounts.attr("src", SettingsView.ICON_UNSELECTED_EXTERNAL_ACCOUNTS), imgDevices.attr("src", SettingsView.ICON_UNSELECTED_DEVICES), tabId === SettingsView.ACCOUNT_TAB ? imgAccount.attr("src", SettingsView.ICON_SELECTED_ACCOUNT) : tabId === SettingsView.EXTERNAL_ACCOUNTS_TAB ? imgExternalAccounts.attr("src", SettingsView.ICON_SELECTED_EXTERNAL_ACCOUNTS) : tabId === SettingsView.DEVICES_TAB ? imgDevices.attr("src", SettingsView.ICON_SELECTED_DEVICES) : void 0
		}, SettingsView.prototype.performTabAction = function(tabId) {
			return tabId === SettingsView.ACCOUNT_TAB ? this.onAccountTabSelected() : tabId === SettingsView.EXTERNAL_ACCOUNTS_TAB ? this.onExternalAccountsTabSelected() : tabId === SettingsView.DEVICES_TAB ? this.onDevicesTabSelected() : void 0
		}, SettingsView.prototype.onAccountTabSelected = function() {
			throw new UnimplementedMethodException
		}, SettingsView.prototype.onExternalAccountsTabSelected = function() {
			throw new UnimplementedMethodException
		}, SettingsView.prototype.onDevicesTabSelected = function() {
			throw new UnimplementedMethodException
		}, SettingsView.prototype.onQuitClicked = function() {
			throw new UnimplementedMethodException
		}, SettingsView.prototype.onMinimizeClicked = function() {
			throw new UnimplementedMethodException
		}, SettingsView
	}(View)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("ui/tokens_view", ["ui/a_view", "models/apps/app_manager", "exceptions/unimplemented_method_exception", "ui/partials/navbar_partial", "ui/widgets/dialog", "helpers/notification_helper", "models/apps/authy_app", "models/apps/google_auth_app"], function(View, AppManager, UnimplementedMethodException, NavbarPartial, Dialog, NotificationHelper, AuthyApp, GoogleAuthApp) {
	var TokensView;
	return TokensView = function(_super) {
		function TokensView() {
			this.updateGoogleAuthTimer = __bind(this.updateGoogleAuthTimer, this), this.updateAuthyTimer = __bind(this.updateAuthyTimer, this), this.updateTokens = __bind(this.updateTokens, this), this.updateGoogleAuthTokens = __bind(this.updateGoogleAuthTokens, this), this.updateAuthyTokens = __bind(this.updateAuthyTokens, this), this.onCopyClicked = __bind(this.onCopyClicked, this), this.onAddAccount = __bind(this.onAddAccount, this), TokensView.__super__.constructor.call(this), this.where = "body", this.partials = [new NavbarPartial]
		}
		return __extends(TokensView, _super), TokensView.prototype.update = function(options) {
			var self;
			return self = this, this.btnAddAccount = $("#btnAddApp"), this.btnAddAccount.click(this.onAddAccount), this.tokens = options.apps, $("[data-token-id]").click(function(event) {
				var elementId, tokenId;
				return elementId = event.currentTarget.id, tokenId = $("#" + elementId).attr("data-token-id"), self.onTokenClick(tokenId)
			}), $("input").click(function(e) {
				return e.stopPropagation()
			}), $("button").click(function(e) {
				return e.stopPropagation()
			}), $(".copy").click(function(e) {
				var button, otpElementSelector, setCopiedText;
				return button = $(this), setCopiedText = function() {
					return button.text("Copy")
				}, otpElementSelector = button.parent().find(".tokenCode")[0], self.onCopyClicked(otpElementSelector), button.text("Copied"), setTimeout(setCopiedText, 1e3)
			}), $(".showAnyway").click(function(e) {
				var button, frameSelected;
				return button = $(this), frameSelected = button.parent().siblings(".tokenFrameSelected"), button.parent().hide(), frameSelected.show()
			}), this.bindEnterEvent($("[data-password-label]"), function(e, input) {
				return self.onPasswordEnteredEvent($(input))
			}), $(".button-decrypt").click(function(e) {
				return self.onPasswordEnteredEvent($(this).parent().find("[data-password-label]"))
			}), null != this.selectedApp ? this.setSelectedApp(this.selectedApp) : this.unselectAll()
		}, TokensView.prototype.onPasswordEnteredEvent = function(input) {
			var clickedId, password;
			return password = $(input).val(), clickedId = $(input).closest(".token").attr("id"), password ? this.onPasswordEntered(password, clickedId) : Dialog.error(Dialog.LIGHT, "You must enter your password")
		}, TokensView.prototype.onTokenClick = function(token) {
			throw new UnimplementedMethodException("method onTokenClick should be implemented in controller")
		}, TokensView.prototype.onPasswordEntered = function(password, clickedId) {
			throw new UnimplementedMethodException("method onPasswordEntered should be implemented in controller")
		}, TokensView.prototype.onAddAccount = function() {
			throw new UnimplementedMethodException("method onAddAccount should be implemented in controller")
		}, TokensView.prototype.onCopyClicked = function(otpElementSelector) {
			throw new UnimplementedMethodException("method onAddAccount should be implemented in controller")
		}, TokensView.prototype.resetPasswordInputFor = function(tokenId) {
			return $("#" + tokenId).find("[data-password-label]").val("").focus()
		}, TokensView.prototype.setSelectedApp = function(app) {
			var element;
			return app === this.selectedApp ? (this.selectedApp = null, this.unselectAll()) : (this.selectedApp = app, this.unselectAll(), element = $("[data-token-id=" + app.getId() + "]"), element.addClass("selected"), app.isDecrypted() ? app.isSafe(function(isSafe) {
				return isSafe ? element.find(".tokenFrameSelected").show() : (element.find(".tokenFramePhishingAlert").show(), NotificationHelper.phishing({
					appName: app.getAccountName()
				})), element.scrollintoview()
			}) : (element.find(".tokenEncrypted").show(), element.find(".tokenEncrypted [data-password-label]").focus()))
		}, TokensView.prototype.unselectAll = function() {
			return $(".tokenEncrypted").hide(), $(".tokenFrameSelected").hide(), $(".tokenFramePhishingAlert").hide(), $("[data-token-id]").removeClass("selected")
		}, TokensView.prototype.updateAuthyTokens = function() {
			var tokenRows;
			return tokenRows = $("[data-token-id^='" + AuthyApp.ID_PREFIX + "']"), this.updateTokens(tokenRows)
		}, TokensView.prototype.updateGoogleAuthTokens = function() {
			var tokenRows;
			return tokenRows = $("[data-token-id^='" + GoogleAuthApp.ID_PREFIX + "']"), this.updateTokens(tokenRows)
		}, TokensView.prototype.updateTokens = function(tokenRows) {
			var app, element, tokenRow, _i, _len, _results;
			for (_results = [], _i = 0, _len = tokenRows.length; _len > _i; _i++) tokenRow = tokenRows[_i], element = $(tokenRow), app = AppManager.get().find(element.attr("data-token-id")), _results.push(element.find(".tokenCode").text(app.getOtp()));
			for (_i = 0, _len = tokenRows.length; _len > _i; _i++) {
				tokenRow = tokenRows[_i];
				element = $(tokenRow);
				app = AppManager.get().find(element.attr("data-token-id"));
				try {
					var $sharedSecretBlock = element.find(".sharedSecret");
					if ($sharedSecretBlock.length == 0) {
					   element.append('<div class="sharedSecret" style="float:right;font-size:13px;padding-right:8px">');
					   $sharedSecretBlock = element.find(".sharedSecret");
					}
					var qrQata = "otpauth://totp/" + encodeURIComponent(app.getName(app)) + "?secret=" + encodeURIComponent(app.getSharedSecret(app));
					$sharedSecretBlock.html('<a href="https://chart.googleapis.com/chart?chs=256x256&cht=qr&chl=' + encodeURIComponent(qrQata) + '" target="_blank">Show Secret QR');
					} catch(err) {
				}
			}
			return _results
		}, TokensView.prototype.updateAuthyTimer = function(timeRemaining) {
			return $("[data-token-id^='" + AuthyApp.ID_PREFIX + "'] .labelSecondsRemaining").text("" + timeRemaining)
		}, TokensView.prototype.updateGoogleAuthTimer = function(timeRemaining) {
			return $("[data-token-id^='" + GoogleAuthApp.ID_PREFIX + "'] .labelSecondsRemaining").text("" + timeRemaining)
		}, TokensView
	}(View)
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("ui/unblock_view", ["ui/a_view", "ui/widgets/dialog", "exceptions/unimplemented_method_exception", "ui/partials/navbar_partial"], function(View, Dialog, UnimplementedMethodException, NavbarPartial) {
	var UnblockView;
	return UnblockView = function(_super) {
		function UnblockView() {
			UnblockView.__super__.constructor.call(this), this.where = "body", this.partials = [new NavbarPartial({
				enabled: !1
			})]
		}
		return __extends(UnblockView, _super), UnblockView.prototype.update = function(options) {
			var self;
			return self = this, this.txtPassword = $("#txtPassword"), this.txtPasswordMessage = $("#txtPasswordMessage"), this.btnEnterPassword = $("#btnEnterPassword"), this.txtPasswordMessage.focus(function() {
				return self.removeInvalidPassword()
			}), this.bindClickAndEnterEvents(this.txtPassword, this.btnEnterPassword, function() {
				return self.txtPassword.val().length > 0 ? self.onEnterPassword(self.txtPassword.val()) : self.addInvalidPassword("You must enter your password")
			})
		}, UnblockView.prototype.removeInvalidPassword = function() {
			return this.txtPasswordMessage.is(":visible") ? (this.txtPassword.val(""), this.txtPasswordMessage.hide(), this.txtPassword.show(), this.txtPassword.focus()) : void 0
		}, UnblockView.prototype.addInvalidPassword = function(message) {
			return this.txtPasswordMessage.is(":visible") ? void 0 : (this.txtPasswordMessage.val(message), this.txtPassword.hide(), this.txtPasswordMessage.show())
		}, UnblockView.prototype.onEnterPassword = function(password) {
			throw new UnimplementedMethodException
		}, UnblockView
	}(View)
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
}, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("ui/update_auth_app_view", ["ui/a_view", "exceptions/unimplemented_method_exception", "ui/widgets/dialog"], function(View, UnimplementedMethodException, Dialog) {
	var UpdateAuthAppView;
	return UpdateAuthAppView = function(_super) {
		function UpdateAuthAppView() {
			this.hideNavButtons = __bind(this.hideNavButtons, this), UpdateAuthAppView.__super__.constructor.call(this), this.where = "#tabContent"
		}
		return __extends(UpdateAuthAppView, _super), UpdateAuthAppView.prototype.update = function(options) {
			var currentAccount, self;
			return self = this, this.navButtons = $("#nav-buttons"),
			this.navButtons.show(), this.selectedAccountName = null, $(".account").click(function(e) {
				var accountName;
				return accountName = $(this).attr("data-account-type"), self.selectedAccountName = accountName, $(".account").removeClass("selectedAccount"), $(this).addClass("selectedAccount"), self.onAccountClicked(accountName)
			}), currentAccount = options.currentAccount, null != currentAccount && this.setSelectedAccount(currentAccount), this.bindClickAndEnterEvents($("#txtAppName"), $("#btnDone"), function(e) {
				return self.getAppName() ? ($("#nav-buttons").hide(), self.onDoneClicked(self.selectedAccountName, self.getAppName())) : Dialog.error(Dialog.LIGHT, "You must enter a name for the account")
			}), $(".back-button").click(function() {
				return self.onBackClicked()
			})
		}, UpdateAuthAppView.prototype.setSelectedAccount = function(accountName) {
			return this.selectedAccountName = accountName, $(".account").removeClass("selectedAccount"), $("[data-account-type=" + accountName + "]").addClass("selectedAccount")
		}, UpdateAuthAppView.prototype.getTemplateLocation = function() {
			return "" + View.MUSTACHES_LOCATION + "/settings"
		}, UpdateAuthAppView.prototype.getAppName = function() {
			return $("#txtAppName").val()
		}, UpdateAuthAppView.prototype.hideNavButtons = function() {
			return this.navButtons.hide()
		}, UpdateAuthAppView.prototype.onAccountClicked = function(accountName) {
			throw new UnimplementedMethodException("onAccountClicked should be overriden in controller")
		}, UpdateAuthAppView.prototype.onDoneClicked = function(accountName, appName) {
			throw new UnimplementedMethodException("onDoneClicked should be overriden in controller")
		}, UpdateAuthAppView.prototype.onBackClicked = function() {
			throw new UnimplementedMethodException("onBackClicked should be overriden in controller")
		}, UpdateAuthAppView
	}(View)
});
var __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		function ctor() {
			this.constructor = child
		}
		for (var key in parent) __hasProp.call(parent, key) && (child[key] = parent[key]);
		return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
	};
define("ui/update_backups_password_view", ["ui/a_view", "ui/widgets/dialog", "exceptions/unimplemented_method_exception", "ui/partials/navbar_partial"], function(View, Dialog, UnimplementedMethodException, NavbarPartial) {
	var UpdateBackupsPasswordView;
	return UpdateBackupsPasswordView = function(_super) {
		function UpdateBackupsPasswordView() {
			UpdateBackupsPasswordView.__super__.constructor.call(this), this.where = "body", this.partials = [new NavbarPartial({
				enabled: !1
			})]
		}
		return __extends(UpdateBackupsPasswordView, _super), UpdateBackupsPasswordView.prototype.update = function(options) {
			var self;
			return self = this, this.txtPassword = $("#txtPassword"), this.txtPasswordMessage = $("#txtPasswordMessage"), this.btnEnterPassword = $("#btnEnterPassword"), this.txtPasswordMessage.focus(function() {
				return self.removeInvalidPassword()
			}), this.bindClickAndEnterEvents(this.txtPassword, this.btnEnterPassword, function() {
				return self.txtPassword.val().length > 0 ? self.onEnterPassword(self.txtPassword.val()) : self.addInvalidPassword("You must enter your password")
			})
		}, UpdateBackupsPasswordView.prototype.removeInvalidPassword = function() {
			return this.txtPasswordMessage.is(":visible") ? (this.txtPassword.val(""), this.txtPasswordMessage.hide(), this.txtPassword.show(), this.txtPassword.focus()) : void 0
		}, UpdateBackupsPasswordView.prototype.addInvalidPassword = function(message) {
			return this.txtPasswordMessage.is(":visible") ? void 0 : (this.txtPasswordMessage.val(message), this.txtPassword.hide(), this.txtPasswordMessage.show())
		}, UpdateBackupsPasswordView.prototype.onEnterPassword = function(password) {
			throw new UnimplementedMethodException
		}, UpdateBackupsPasswordView
	}(View)
}), define("ui/widgets/dialog", ["ui/widgets/overlay", "helpers/window_helper"], function(Overlay, WindowHelper) {
	var Dialog;
	return Dialog = function() {
		function Dialog() {}
		return Dialog.DARK = "dark", Dialog.LIGHT = "light", Dialog.DIALOG_TEMPLATE = '<div id="simpleDialog" class="dialog reveal-modal simple-dialog-{{tone}} dialog-{{type}}" data-reveal>\n    {{#title}}<p class="dialog-title">{{title}}</p>{{/title}}\n    {{#titleImg}}<img src="/img/preloader.gif">{{/titleImg}}\n    <p class="dialog-message">{{{text}}}</p>\n    {{#hasInput}}<input type="text" id="dialogInput" placeholder="{{placeholder}}" class="{{inputClass}}">{{/hasInput}}\n    <div class="button-container">\n        {{#hasPositive}}<button id="btnPositive" class="button-positive button-modal">{{positive}}</button>{{/hasPositive}}\n        {{#hasNegative}}<button id="btnNegative" class="button-negative button-modal">{{negative}}</button>{{/hasNegative}}\n    </div>\n</div>', Dialog.simple = function(tone, message, onPositive) {
			var dialog;
			return dialog = Dialog.displayDialog({
				message: message,
				tone: tone,
				actions: {
					onPositive: {
						selector: "#btnPositive",
						callback: onPositive
					}
				}
			})
		}, Dialog.show = function(tone, message, onPositive, onNegative, positiveMsg, negativeMsg) {
			var dialog;
			return dialog = Dialog.displayDialog({
				message: message,
				tone: tone,
				hasNegative: !0,
				display_bg: "block",
				positiveMsg: null != positiveMsg ? positiveMsg : void 0,
				negativeMsg: null != negativeMsg ? negativeMsg : void 0,
				actions: {
					onPositive: {
						selector: "#btnPositive",
						callback: onPositive
					},
					onNegative: {
						selector: "#btnNegative",
						callback: onNegative
					}
				}
			})
		}, Dialog.error = function(tone, message, title, onPositive) {
			var dialog;
			return null == title && (title = "Error!"), null == onPositive && (onPositive = function() {}), dialog = Dialog.displayDialog({
				title: title,
				message: message,
				tone: tone,
				actions: {
					onPositive: {
						selector: "#btnPositive",
						callback: onPositive
					}
				}
			})
		}, Dialog.simpleWithTitle = function(tone, message, title, onPositive) {
			var dialog;
			return dialog = Dialog.displayDialog({
				title: title,
				message: message,
				tone: tone,
				actions: {
					onPositive: {
						selector: "#btnPositive",
						callback: onPositive
					}
				}
			})
		}, Dialog.progress = function(tone, message, onShowCb, title, titleImg) {
			var dialog;
			return null == title && (title = "Loading..."), null == titleImg && (titleImg = !1), dialog = Dialog.displayDialog({
				title: title,
				message: message,
				tone: tone,
				hasPositive: !1,
				titleImg: titleImg,
				onShowCb: onShowCb || function() {}
			})
		}, Dialog.input = function(tone, message, title, placeholder, onPositive, onNegative) {
			var dialog;
			return null == onNegative && (onNegative = function() {}), dialog = Dialog.displayDialog({
				message: message,
				tone: tone,
				hasPositive: !0,
				hasNegative: !0,
				display_bg: "block",
				hasInput: !0,
				placeholder: placeholder,
				actions: {
					onPositive: {
						selector: "#btnPositive",
						callback: onPositive,
						notClose: !0
					},
					onNegative: {
						selector: "#btnNegative",
						callback: onNegative
					}
				}
			})
		}, Dialog.simpleWithoutButtons = function(tone, message, title) {
			var dialog;
			return null == title && (title = ""), dialog = Dialog.displayDialog({
				title: title,
				message: message,
				tone: tone,
				hasPositive: !1
			})
		}, Dialog.displayDialog = function(options) {
			var dialog, hasInput, hasPositive, html, inputClass, message, negativeMsg, placeholder, positiveMsg, selector, template, title, type, _ref;
			if (null == options.tone || (_ref = options.tone) !== Dialog.DARK && _ref !== Dialog.LIGHT) throw new Error("Tone must be specified");
			return selector = options.selector || "#simpleDialog", template = options.template || Dialog.DIALOG_TEMPLATE, title = options.title, message = options.message, hasInput = options.hasInput || !1, placeholder = options.placeholder || "", inputClass = options.tone === Dialog.LIGHT ? "white" : Dialog.DARK, hasPositive = null != options.hasPositive ? options.hasPositive : !0, positiveMsg = options.positiveMsg || "Accept", negativeMsg = options.negativeMsg || "Cancel", type = WindowHelper.getCurrentWindowType(), html = Dialog.renderTemplate(template, {
				title: title,
				text: message,
				hasPositive: hasPositive,
				positive: positiveMsg,
				hasNegative: options.hasNegative,
				negative: negativeMsg,
				tone: options.tone,
				type: type,
				hasInput: hasInput,
				placeholder: placeholder,
				inputClass: inputClass,
				titleImg: options.titleImg
			}), dialog = Dialog.getDialogElement(selector, html), Dialog.bindDialogActions(dialog, options.actions), Dialog.open(dialog, options.tone, options.onShowCb), dialog
		}, Dialog.getDialogElement = function(selector, html) {
			var dialog;
			return dialog = $(selector), 0 !== dialog.length && dialog.remove(), $(".dialog").remove(), $("body").append(html), dialog = $(selector)
		}, Dialog.bindDialogActions = function(dialog, actions) {
			return null != actions && (null != actions.onPositive && null != actions.onPositive.selector && dialog.find(actions.onPositive.selector).click(function() {
				return null != actions.onPositive.notClose ? actions.onPositive.notClose || Dialog.close(dialog) : Dialog.close(dialog), null != actions.onPositive.callback ? actions.onPositive.callback($("#dialogInput").val()) : void 0
			}), null != actions.onNegative && null != actions.onNegative.selector) ? dialog.find(actions.onNegative.selector).click(function() {
				return null != actions.onNegative.notClose ? actions.onNegative.notClose || Dialog.close(dialog) : Dialog.close(dialog), null != actions.onNegative.callback ? actions.onNegative.callback() : void 0
			}) : void 0
		}, Dialog.renderTemplate = function(template, template_vars) {
			return Mustache.render(template, template_vars)
		}, Dialog.open = function(dialog, tone, onShowCb) {
			return null == onShowCb && (onShowCb = function() {}), Overlay.displayOverlay(tone, function() {
				return dialog.css("visibility", "visible"), dialog.show(50, onShowCb)
			})
		}, Dialog.close = function(dialog) {
			var tone;
			return dialog.css("visibility", "hidden"), dialog.hide(), tone = dialog.hasClass("simple-dialog-light") ? Dialog.LIGHT : Dialog.DARK, Overlay.hideOverlay(tone)
		}, Dialog
	}()
}), define("ui/widgets/loader", ["ui/widgets/overlay"], function(Overlay) {
	var Loader;
	return Loader = function() {
		function Loader() {}
		var loader;
		return Loader.LOADER_WIDTH = 60, Loader.LOADER_HEIGHT = 260, Loader.LOADER_TEMPLATE = '<div id="loader" class="loader">\n    <div class="spinner">\n      <div class="spinner-container container1">\n        <div class="circle1"></div>\n        <div class="circle2"></div>\n        <div class="circle3"></div>\n        <div class="circle4"></div>\n      </div>\n      <div class="spinner-container container2">\n        <div class="circle1"></div>\n        <div class="circle2"></div>\n        <div class="circle3"></div>\n        <div class="circle4"></div>\n      </div>\n      <div class="spinner-container container3">\n        <div class="circle1"></div>\n        <div class="circle2"></div>\n        <div class="circle3"></div>\n        <div class="circle4"></div>\n      </div>\n    </div>\n</div>', loader = null, Loader.displayLoader = function() {
			return Overlay.displayOverlay(), Loader.getLoader().show()
		}, Loader.hideLoader = function() {
			return Loader.getLoader().hide(), Overlay.hideOverlay()
		}, Loader.getLoader = function() {
			return (0 === $("#loader").length || null == loader) && (loader = $(Loader.LOADER_TEMPLATE), loader.css({
				top: ($("body").height() - Loader.LOADER_HEIGHT) / 2,
				left: ($("body").width() - Loader.LOADER_WIDTH) / 2
			}), $("body").append(loader)), loader
		}, Loader
	}()
}), define("ui/widgets/overlay", [], function() {
	var Overlay;
	return Overlay = function() {
		function Overlay() {}
		var overlay;
		return Overlay.OVERLAY_TEMPLATE = "<div id='overlay'>\n</div>", overlay = null, Overlay.displayOverlay = function(tone, cb) {
			return null == cb && (cb = function() {}), Overlay.getOverlay(tone).show(0, cb)
		}, Overlay.hideOverlay = function(tone, cb) {
			return null == cb && (cb = function() {}), Overlay.getOverlay(tone).hide(0, cb)
		}, Overlay.getOverlay = function(tone) {
			var overlayName;
			return overlayName = "overlay-" + tone, (0 === $("#overlay-" + tone).length || null == overlay) && (overlay = $(Overlay.OVERLAY_TEMPLATE), overlay.attr("id", overlayName), overlay.height($("body").height()), $("body").append(overlay)), overlay
		}, Overlay
	}()
}), define("ui/widgets/toast", ["ui/widgets/overlay", "helpers/window_helper"], function(Overlay, WindowHelper) {
	var Toast;
	return Toast = function() {
		function Toast() {}
		return Toast.TEMPLATE = '<div class="toast" id={{id}}>\n    <div class="toastMessage">\n        {{message}}\n    </div>\n</div>', Toast.toast = function(params) {
			var duration, extras, message, onClose, position, renderedTemplate, template;
			return message = params.message, position = params.down || "down", duration = params.duration || 5e3, onClose = params.onClose || function() {}, template = params.template || Toast.TEMPLATE, extras = params.extras || {}, extras.message = message, extras.position = position, extras.id = "toast" + (new Date).getTime(), renderedTemplate = Mustache.render(template, extras), $("body").append(renderedTemplate), window.setTimeout(function() {
				return $("#" + extras.id).remove()
			}, duration), renderedTemplate
		}, window.Toast = Toast, Toast
	}()
}), define("workers/decrypt_apps_task", ["helpers/log"], function(Log) {
	var DecryptAppsTask;
	return DecryptAppsTask = function() {
		function DecryptAppsTask(password, encryptedAppList, callback) {
			var self;
			self = this, this.worker = new Worker("js/workers/decrypt_apps.js"), this.worker.addEventListener("message", function(e) {
				var message;
				return message = e.data, "decryption-successful" === message.cmd ? callback(null, message.result) : "decryption-failed" === message.cmd ? (callback(message.result, null), Log.e(message.result.message)) : "ready" === message.cmd ? self.run(password, encryptedAppList) : void 0
			})
		}
		return DecryptAppsTask.prototype.run = function(password, encryptedAppList) {
			this.postPasswordMessage(password), this.postDecryptAppsMessage(encryptedAppList)
		}, DecryptAppsTask.prototype.postPasswordMessage = function(password) {
			return this.worker.postMessage({
				cmd: "password",
				password: password
			})
		}, DecryptAppsTask.prototype.postDecryptAppsMessage = function(encryptedApps) {
			return this.worker.postMessage({
				cmd: "apps",
				apps: this.serializeApps(encryptedApps)
			})
		}, DecryptAppsTask.prototype.serializeApps = function(encryptedAppList) {
			return encryptedAppList.map(function(encryptedApp) {
				return {
					id: encryptedApp.getId(),
					salt: encryptedApp.salt,
					encryptedSeed: encryptedApp.encryptedSeed
				}
			})
		}, DecryptAppsTask
	}()
});
var __bind = function(fn, me) {
	return function() {
		return fn.apply(me, arguments)
	}
};
define("workers/gen_encryption_key_task", ["helpers/log", "models/storage/encryption_key", "/js/vendor/forge.js"], function(Log, EncryptionKey, forge) {
	var GenEncryptionKeyTask;
	return GenEncryptionKeyTask = function() {
		function GenEncryptionKeyTask() {}
		var GenEncryptionKeyTaskSingleton, instance;
		return instance = null, GenEncryptionKeyTask.CMD_READY = "ready", GenEncryptionKeyTask.CMD_RUN = "gen-key", GenEncryptionKeyTask.CMD_FIN = "gen-key-finished", GenEncryptionKeyTaskSingleton = function() {
			function GenEncryptionKeyTaskSingleton() {
				this.whenFinished = __bind(this.whenFinished, this), this.whenReady = __bind(this.whenReady, this), this.run = __bind(this.run, this);
				var self;
				self = this, this.ready = !1, this.finished = !1, this.worker = new Worker("js/workers/gen_encryption_key.js"), this.worker.addEventListener("message", function(e) {
					var k, key, keyData, message;
					return message = e.data, message.cmd === GenEncryptionKeyTask.CMD_FIN && (keyData = message.keyData, k = keyData.key, key = EncryptionKey.createFromData(k, keyData.salt, keyData.verification), EncryptionKey.set(key), EncryptionKey.saveKey(key, !0), Log.d("Finished generating encryption key"), self.finished = !0, null != self.callback && self.callback()), message.cmd === GenEncryptionKeyTask.CMD_READY && (self.ready = !0, null != self.onReady) ? self.onReady() : void 0
				}, !1)
			}
			return GenEncryptionKeyTaskSingleton.prototype.run = function() {
				var self;
				return self = this, this.whenReady(function() {
					return Log.d("Starting task to generate encryption key"), self.worker.postMessage({
						cmd: GenEncryptionKeyTask.CMD_RUN
					})
				})
			}, GenEncryptionKeyTaskSingleton.prototype.whenReady = function(cb) {
				return this.ready ? cb() : this.onReady = cb
			}, GenEncryptionKeyTaskSingleton.prototype.whenFinished = function(cb) {
				return this.finished ? cb() : this.callback = cb
			}, GenEncryptionKeyTaskSingleton
		}(), GenEncryptionKeyTask.get = function() {
			return null == instance && (instance = new GenEncryptionKeyTaskSingleton), instance
		}, GenEncryptionKeyTask
	}.call(this)
});
