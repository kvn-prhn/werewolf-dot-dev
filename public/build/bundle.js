
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const LOCATION = {};
    const ROUTER = {};

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    function getLocation(source) {
      return {
        ...source.location,
        state: source.history.state,
        key: (source.history.state && source.history.state.key) || "initial"
      };
    }

    function createHistory(source, options) {
      const listeners = [];
      let location = getLocation(source);

      return {
        get location() {
          return location;
        },

        listen(listener) {
          listeners.push(listener);

          const popstateListener = () => {
            location = getLocation(source);
            listener({ location, action: "POP" });
          };

          source.addEventListener("popstate", popstateListener);

          return () => {
            source.removeEventListener("popstate", popstateListener);

            const index = listeners.indexOf(listener);
            listeners.splice(index, 1);
          };
        },

        navigate(to, { state, replace = false } = {}) {
          state = { ...state, key: Date.now() + "" };
          // try...catch iOS Safari limits to 100 pushState calls
          try {
            if (replace) {
              source.history.replaceState(state, null, to);
            } else {
              source.history.pushState(state, null, to);
            }
          } catch (e) {
            source.location[replace ? "replace" : "assign"](to);
          }

          location = getLocation(source);
          listeners.forEach(listener => listener({ location, action: "PUSH" }));
        }
      };
    }

    // Stores history entries in memory for testing or other platforms like Native
    function createMemorySource(initialPathname = "/") {
      let index = 0;
      const stack = [{ pathname: initialPathname, search: "" }];
      const states = [];

      return {
        get location() {
          return stack[index];
        },
        addEventListener(name, fn) {},
        removeEventListener(name, fn) {},
        history: {
          get entries() {
            return stack;
          },
          get index() {
            return index;
          },
          get state() {
            return states[index];
          },
          pushState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            index++;
            stack.push({ pathname, search });
            states.push(state);
          },
          replaceState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            stack[index] = { pathname, search };
            states[index] = state;
          }
        }
      };
    }

    // Global history uses window.history as the source if available,
    // otherwise a memory history
    const canUseDOM = Boolean(
      typeof window !== "undefined" &&
        window.document &&
        window.document.createElement
    );
    const globalHistory = createHistory(canUseDOM ? window : createMemorySource());

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    const paramRe = /^:(.+)/;

    const SEGMENT_POINTS = 4;
    const STATIC_POINTS = 3;
    const DYNAMIC_POINTS = 2;
    const SPLAT_PENALTY = 1;
    const ROOT_POINTS = 1;

    /**
     * Check if `segment` is a root segment
     * @param {string} segment
     * @return {boolean}
     */
    function isRootSegment(segment) {
      return segment === "";
    }

    /**
     * Check if `segment` is a dynamic segment
     * @param {string} segment
     * @return {boolean}
     */
    function isDynamic(segment) {
      return paramRe.test(segment);
    }

    /**
     * Check if `segment` is a splat
     * @param {string} segment
     * @return {boolean}
     */
    function isSplat(segment) {
      return segment[0] === "*";
    }

    /**
     * Split up the URI into segments delimited by `/`
     * @param {string} uri
     * @return {string[]}
     */
    function segmentize(uri) {
      return (
        uri
          // Strip starting/ending `/`
          .replace(/(^\/+|\/+$)/g, "")
          .split("/")
      );
    }

    /**
     * Strip `str` of potential start and end `/`
     * @param {string} str
     * @return {string}
     */
    function stripSlashes(str) {
      return str.replace(/(^\/+|\/+$)/g, "");
    }

    /**
     * Score a route depending on how its individual segments look
     * @param {object} route
     * @param {number} index
     * @return {object}
     */
    function rankRoute(route, index) {
      const score = route.default
        ? 0
        : segmentize(route.path).reduce((score, segment) => {
            score += SEGMENT_POINTS;

            if (isRootSegment(segment)) {
              score += ROOT_POINTS;
            } else if (isDynamic(segment)) {
              score += DYNAMIC_POINTS;
            } else if (isSplat(segment)) {
              score -= SEGMENT_POINTS + SPLAT_PENALTY;
            } else {
              score += STATIC_POINTS;
            }

            return score;
          }, 0);

      return { route, score, index };
    }

    /**
     * Give a score to all routes and sort them on that
     * @param {object[]} routes
     * @return {object[]}
     */
    function rankRoutes(routes) {
      return (
        routes
          .map(rankRoute)
          // If two routes have the exact same score, we go by index instead
          .sort((a, b) =>
            a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
          )
      );
    }

    /**
     * Ranks and picks the best route to match. Each segment gets the highest
     * amount of points, then the type of segment gets an additional amount of
     * points where
     *
     *  static > dynamic > splat > root
     *
     * This way we don't have to worry about the order of our routes, let the
     * computers do it.
     *
     * A route looks like this
     *
     *  { path, default, value }
     *
     * And a returned match looks like:
     *
     *  { route, params, uri }
     *
     * @param {object[]} routes
     * @param {string} uri
     * @return {?object}
     */
    function pick(routes, uri) {
      let match;
      let default_;

      const [uriPathname] = uri.split("?");
      const uriSegments = segmentize(uriPathname);
      const isRootUri = uriSegments[0] === "";
      const ranked = rankRoutes(routes);

      for (let i = 0, l = ranked.length; i < l; i++) {
        const route = ranked[i].route;
        let missed = false;

        if (route.default) {
          default_ = {
            route,
            params: {},
            uri
          };
          continue;
        }

        const routeSegments = segmentize(route.path);
        const params = {};
        const max = Math.max(uriSegments.length, routeSegments.length);
        let index = 0;

        for (; index < max; index++) {
          const routeSegment = routeSegments[index];
          const uriSegment = uriSegments[index];

          if (routeSegment !== undefined && isSplat(routeSegment)) {
            // Hit a splat, just grab the rest, and return a match
            // uri:   /files/documents/work
            // route: /files/* or /files/*splatname
            const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1);

            params[splatName] = uriSegments
              .slice(index)
              .map(decodeURIComponent)
              .join("/");
            break;
          }

          if (uriSegment === undefined) {
            // URI is shorter than the route, no match
            // uri:   /users
            // route: /users/:userId
            missed = true;
            break;
          }

          let dynamicMatch = paramRe.exec(routeSegment);

          if (dynamicMatch && !isRootUri) {
            const value = decodeURIComponent(uriSegment);
            params[dynamicMatch[1]] = value;
          } else if (routeSegment !== uriSegment) {
            // Current segments don't match, not dynamic, not splat, so no match
            // uri:   /users/123/settings
            // route: /users/:id/profile
            missed = true;
            break;
          }
        }

        if (!missed) {
          match = {
            route,
            params,
            uri: "/" + uriSegments.slice(0, index).join("/")
          };
          break;
        }
      }

      return match || default_ || null;
    }

    /**
     * Check if the `path` matches the `uri`.
     * @param {string} path
     * @param {string} uri
     * @return {?object}
     */
    function match(route, uri) {
      return pick([route], uri);
    }

    /**
     * Combines the `basepath` and the `path` into one path.
     * @param {string} basepath
     * @param {string} path
     */
    function combinePaths(basepath, path) {
      return `${stripSlashes(
    path === "/" ? basepath : `${stripSlashes(basepath)}/${stripSlashes(path)}`
  )}/`;
    }

    /* node_modules\svelte-routing\src\Router.svelte generated by Svelte v3.31.2 */

    function create_fragment(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $base;
    	let $location;
    	let $routes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, ['default']);
    	let { basepath = "/" } = $$props;
    	let { url = null } = $$props;
    	const locationContext = getContext(LOCATION);
    	const routerContext = getContext(ROUTER);
    	const routes = writable([]);
    	validate_store(routes, "routes");
    	component_subscribe($$self, routes, value => $$invalidate(7, $routes = value));
    	const activeRoute = writable(null);
    	let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

    	// If locationContext is not set, this is the topmost Router in the tree.
    	// If the `url` prop is given we force the location to it.
    	const location = locationContext || writable(url ? { pathname: url } : globalHistory.location);

    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(6, $location = value));

    	// If routerContext is set, the routerBase of the parent Router
    	// will be the base for this Router's descendants.
    	// If routerContext is not set, the path and resolved uri will both
    	// have the value of the basepath prop.
    	const base = routerContext
    	? routerContext.routerBase
    	: writable({ path: basepath, uri: basepath });

    	validate_store(base, "base");
    	component_subscribe($$self, base, value => $$invalidate(5, $base = value));

    	const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
    		// If there is no activeRoute, the routerBase will be identical to the base.
    		if (activeRoute === null) {
    			return base;
    		}

    		const { path: basepath } = base;
    		const { route, uri } = activeRoute;

    		// Remove the potential /* or /*splatname from
    		// the end of the child Routes relative paths.
    		const path = route.default
    		? basepath
    		: route.path.replace(/\*.*$/, "");

    		return { path, uri };
    	});

    	function registerRoute(route) {
    		const { path: basepath } = $base;
    		let { path } = route;

    		// We store the original path in the _path property so we can reuse
    		// it when the basepath changes. The only thing that matters is that
    		// the route reference is intact, so mutation is fine.
    		route._path = path;

    		route.path = combinePaths(basepath, path);

    		if (typeof window === "undefined") {
    			// In SSR we should set the activeRoute immediately if it is a match.
    			// If there are more Routes being registered after a match is found,
    			// we just skip them.
    			if (hasActiveRoute) {
    				return;
    			}

    			const matchingRoute = match(route, $location.pathname);

    			if (matchingRoute) {
    				activeRoute.set(matchingRoute);
    				hasActiveRoute = true;
    			}
    		} else {
    			routes.update(rs => {
    				rs.push(route);
    				return rs;
    			});
    		}
    	}

    	function unregisterRoute(route) {
    		routes.update(rs => {
    			const index = rs.indexOf(route);
    			rs.splice(index, 1);
    			return rs;
    		});
    	}

    	if (!locationContext) {
    		// The topmost Router in the tree is responsible for updating
    		// the location store and supplying it through context.
    		onMount(() => {
    			const unlisten = globalHistory.listen(history => {
    				location.set(history.location);
    			});

    			return unlisten;
    		});

    		setContext(LOCATION, location);
    	}

    	setContext(ROUTER, {
    		activeRoute,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute
    	});

    	const writable_props = ["basepath", "url"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("$$scope" in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		setContext,
    		onMount,
    		writable,
    		derived,
    		LOCATION,
    		ROUTER,
    		globalHistory,
    		pick,
    		match,
    		stripSlashes,
    		combinePaths,
    		basepath,
    		url,
    		locationContext,
    		routerContext,
    		routes,
    		activeRoute,
    		hasActiveRoute,
    		location,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute,
    		$base,
    		$location,
    		$routes
    	});

    	$$self.$inject_state = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("hasActiveRoute" in $$props) hasActiveRoute = $$props.hasActiveRoute;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$base*/ 32) {
    			// This reactive statement will update all the Routes' path when
    			// the basepath changes.
    			 {
    				const { path: basepath } = $base;

    				routes.update(rs => {
    					rs.forEach(r => r.path = combinePaths(basepath, r._path));
    					return rs;
    				});
    			}
    		}

    		if ($$self.$$.dirty & /*$routes, $location*/ 192) {
    			// This reactive statement will be run when the Router is created
    			// when there are no Routes and then again the following tick, so it
    			// will not find an active Route in SSR and in the browser it will only
    			// pick an active Route after all Routes have been registered.
    			 {
    				const bestMatch = pick($routes, $location.pathname);
    				activeRoute.set(bestMatch);
    			}
    		}
    	};

    	return [
    		routes,
    		location,
    		base,
    		basepath,
    		url,
    		$base,
    		$location,
    		$routes,
    		$$scope,
    		slots
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { basepath: 3, url: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get basepath() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set basepath(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-routing\src\Route.svelte generated by Svelte v3.31.2 */

    const get_default_slot_changes = dirty => ({
    	params: dirty & /*routeParams*/ 4,
    	location: dirty & /*$location*/ 16
    });

    const get_default_slot_context = ctx => ({
    	params: /*routeParams*/ ctx[2],
    	location: /*$location*/ ctx[4]
    });

    // (40:0) {#if $activeRoute !== null && $activeRoute.route === route}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*component*/ ctx[0] !== null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:0) {#if $activeRoute !== null && $activeRoute.route === route}",
    		ctx
    	});

    	return block;
    }

    // (43:2) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, routeParams, $location*/ 532) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(43:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (41:2) {#if component !== null}
    function create_if_block_1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ location: /*$location*/ ctx[4] },
    		/*routeParams*/ ctx[2],
    		/*routeProps*/ ctx[3]
    	];

    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*$location, routeParams, routeProps*/ 28)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*$location*/ 16 && { location: /*$location*/ ctx[4] },
    					dirty & /*routeParams*/ 4 && get_spread_object(/*routeParams*/ ctx[2]),
    					dirty & /*routeProps*/ 8 && get_spread_object(/*routeProps*/ ctx[3])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(41:2) {#if component !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$activeRoute*/ ctx[1] !== null && /*$activeRoute*/ ctx[1].route === /*route*/ ctx[7] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$activeRoute*/ ctx[1] !== null && /*$activeRoute*/ ctx[1].route === /*route*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$activeRoute*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $activeRoute;
    	let $location;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Route", slots, ['default']);
    	let { path = "" } = $$props;
    	let { component = null } = $$props;
    	const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
    	validate_store(activeRoute, "activeRoute");
    	component_subscribe($$self, activeRoute, value => $$invalidate(1, $activeRoute = value));
    	const location = getContext(LOCATION);
    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(4, $location = value));

    	const route = {
    		path,
    		// If no path prop is given, this Route will act as the default Route
    		// that is rendered if no other Route in the Router is a match.
    		default: path === ""
    	};

    	let routeParams = {};
    	let routeProps = {};
    	registerRoute(route);

    	// There is no need to unregister Routes in SSR since it will all be
    	// thrown away anyway.
    	if (typeof window !== "undefined") {
    		onDestroy(() => {
    			unregisterRoute(route);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("path" in $$new_props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$new_props) $$invalidate(0, component = $$new_props.component);
    		if ("$$scope" in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		onDestroy,
    		ROUTER,
    		LOCATION,
    		path,
    		component,
    		registerRoute,
    		unregisterRoute,
    		activeRoute,
    		location,
    		route,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), $$new_props));
    		if ("path" in $$props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$props) $$invalidate(0, component = $$new_props.component);
    		if ("routeParams" in $$props) $$invalidate(2, routeParams = $$new_props.routeParams);
    		if ("routeProps" in $$props) $$invalidate(3, routeProps = $$new_props.routeProps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$activeRoute*/ 2) {
    			 if ($activeRoute && $activeRoute.route === route) {
    				$$invalidate(2, routeParams = $activeRoute.params);
    			}
    		}

    		 {
    			const { path, component, ...rest } = $$props;
    			$$invalidate(3, routeProps = rest);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		component,
    		$activeRoute,
    		routeParams,
    		routeProps,
    		$location,
    		activeRoute,
    		location,
    		route,
    		path,
    		$$scope,
    		slots
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { path: 8, component: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get path() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const directionSigns = [
      { 
        text: "Start", 
        style: `font-size: 52px; top: 8%; left: 15%;`
      },
      { 
        text: "Creating",
        style: `font-size: 40px; top: 18%; left: 10%;`
      },
      {
        text: "Games.",
        style: `font-size: 46px; top: 14%; left: 12%;`
      },
    ];

    /* src\components\DirectionSign.svelte generated by Svelte v3.31.2 */
    const file = "src\\components\\DirectionSign.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let section;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			section = element("section");
    			t = text(/*text*/ ctx[1]);
    			attr_dev(section, "class", "sign-text svelte-16xh9m2");
    			attr_dev(section, "style", /*style*/ ctx[2]);
    			add_location(section, file, 34, 2, 869);
    			attr_dev(main, "class", "direciton-sign-component svelte-16xh9m2");
    			toggle_class(main, "active", /*active*/ ctx[0]);
    			add_location(main, file, 33, 0, 804);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, section);
    			append_dev(section, t);

    			if (!mounted) {
    				dispose = listen_dev(main, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*active*/ 1) {
    				toggle_class(main, "active", /*active*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let active;
    	let $selectedIndex;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DirectionSign", slots, []);
    	let { index = -1 } = $$props;
    	let { text, style } = directionSigns[index] || {};
    	let { selectedIndex } = getContext("sign-select");
    	validate_store(selectedIndex, "selectedIndex");
    	component_subscribe($$self, selectedIndex, value => $$invalidate(5, $selectedIndex = value));
    	const writable_props = ["index"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DirectionSign> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("index" in $$props) $$invalidate(4, index = $$props.index);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		directionSigns,
    		index,
    		text,
    		style,
    		selectedIndex,
    		active,
    		$selectedIndex
    	});

    	$$self.$inject_state = $$props => {
    		if ("index" in $$props) $$invalidate(4, index = $$props.index);
    		if ("text" in $$props) $$invalidate(1, text = $$props.text);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("selectedIndex" in $$props) $$invalidate(3, selectedIndex = $$props.selectedIndex);
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*index, $selectedIndex*/ 48) {
    			 $$invalidate(0, active = index === $selectedIndex);
    		}
    	};

    	return [active, text, style, selectedIndex, index, $selectedIndex, click_handler];
    }

    class DirectionSign extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { index: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DirectionSign",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get index() {
    		throw new Error("<DirectionSign>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<DirectionSign>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\HowlMoon.svelte generated by Svelte v3.31.2 */

    const file$1 = "src\\components\\HowlMoon.svelte";

    function create_fragment$3(ctx) {
    	let main;

    	const block = {
    		c: function create() {
    			main = element("main");
    			attr_dev(main, "class", "svelte-32eov7");
    			add_location(main, file$1, 14, 0, 286);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("HowlMoon", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<HowlMoon> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class HowlMoon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HowlMoon",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const woodenSigns = [
      {
        intro: "with a fresh Discord server.",
        list: [
          `Give it a name.`,
          `<a href="https://discord.com/oauth2/authorize?client_id=791862018113798154&scope=bot&permissions=93264" target="_blank">Invite the bot</a> to your new server.`,
          `Celebrate! You took the 1st step 🎉`
        ],
        marginTop: "-1%"
      },
      {
        intro: "a project is a breeze with bot commands",
        list: [
          `<span class="command">$start</span> creates the text channels you need`,
          `<strike><span class="command">$example</span> provides some MoonScript, images, and sounds to play with</strike> (Under construction!)`,
          `<span class="command">$howl</span> shares a link of your current werewolf.dev project`
        ],
        marginTop: "5%"
      },
      {
        intro: `You just created one. <span style="color: white">You took the 1st step.
    Everything else is secondary. Finishing is secondary. Starting is an achievement.
    Be proud 💜</span>`,
        marginTop: "11%"
      }
    ];

    /* src\components\WoodenSign.svelte generated by Svelte v3.31.2 */
    const file$2 = "src\\components\\WoodenSign.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (59:8) {#each list as listItem}
    function create_each_block(ctx) {
    	let li;
    	let raw_value = /*listItem*/ ctx[8] + "";

    	const block = {
    		c: function create() {
    			li = element("li");
    			attr_dev(li, "class", "svelte-5gh3nz");
    			add_location(li, file$2, 59, 10, 1298);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			li.innerHTML = raw_value;
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(59:8) {#each list as listItem}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let main;
    	let section;
    	let span;
    	let t;
    	let div;
    	let ol;
    	let each_value = /*list*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			section = element("section");
    			span = element("span");
    			t = space();
    			div = element("div");
    			ol = element("ol");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span, "class", "intro svelte-5gh3nz");
    			add_location(span, file$2, 55, 4, 1176);
    			attr_dev(ol, "class", "svelte-5gh3nz");
    			add_location(ol, file$2, 57, 6, 1248);
    			attr_dev(div, "class", "list svelte-5gh3nz");
    			add_location(div, file$2, 56, 4, 1222);
    			attr_dev(section, "class", "sign-text svelte-5gh3nz");
    			add_location(section, file$2, 54, 2, 1143);
    			attr_dev(main, "class", "wooden-sign-component svelte-5gh3nz");
    			attr_dev(main, "style", /*style*/ ctx[1]);
    			toggle_class(main, "active", /*active*/ ctx[0]);
    			add_location(main, file$2, 53, 0, 1082);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, section);
    			append_dev(section, span);
    			span.innerHTML = /*intro*/ ctx[2];
    			append_dev(section, t);
    			append_dev(section, div);
    			append_dev(div, ol);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ol, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*list*/ 8) {
    				each_value = /*list*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ol, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*style*/ 2) {
    				attr_dev(main, "style", /*style*/ ctx[1]);
    			}

    			if (dirty & /*active*/ 1) {
    				toggle_class(main, "active", /*active*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let active;
    	let style;
    	let $selectedIndex;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("WoodenSign", slots, []);
    	let { index = -1 } = $$props;
    	let { intro, list = [], marginTop } = woodenSigns[index] || {};
    	let { selectedIndex } = getContext("sign-select");
    	validate_store(selectedIndex, "selectedIndex");
    	component_subscribe($$self, selectedIndex, value => $$invalidate(6, $selectedIndex = value));
    	const writable_props = ["index"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WoodenSign> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("index" in $$props) $$invalidate(5, index = $$props.index);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		woodenSigns,
    		index,
    		intro,
    		list,
    		marginTop,
    		selectedIndex,
    		active,
    		$selectedIndex,
    		style
    	});

    	$$self.$inject_state = $$props => {
    		if ("index" in $$props) $$invalidate(5, index = $$props.index);
    		if ("intro" in $$props) $$invalidate(2, intro = $$props.intro);
    		if ("list" in $$props) $$invalidate(3, list = $$props.list);
    		if ("marginTop" in $$props) $$invalidate(7, marginTop = $$props.marginTop);
    		if ("selectedIndex" in $$props) $$invalidate(4, selectedIndex = $$props.selectedIndex);
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("style" in $$props) $$invalidate(1, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*index, $selectedIndex*/ 96) {
    			 $$invalidate(0, active = index === $selectedIndex);
    		}
    	};

    	 $$invalidate(1, style = `margin-top: ${marginTop}`);
    	return [active, style, intro, list, selectedIndex, index, $selectedIndex];
    }

    class WoodenSign extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { index: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WoodenSign",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get index() {
    		throw new Error("<WoodenSign>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<WoodenSign>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\routes\Home.svelte generated by Svelte v3.31.2 */
    const file$3 = "src\\routes\\Home.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (40:3) {#each directionSigns as _, index}
    function create_each_block_1(ctx) {
    	let div;
    	let directionsign;
    	let t;
    	let current;

    	function click_handler() {
    		return /*click_handler*/ ctx[2](/*index*/ ctx[6]);
    	}

    	directionsign = new DirectionSign({
    			props: { index: /*index*/ ctx[6] },
    			$$inline: true
    		});

    	directionsign.$on("click", click_handler);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(directionsign.$$.fragment);
    			t = space();
    			attr_dev(div, "class", "direction-sign-wrapper svelte-1phgwxu");
    			add_location(div, file$3, 40, 4, 911);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(directionsign, div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(directionsign.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(directionsign.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(directionsign);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(40:3) {#each directionSigns as _, index}",
    		ctx
    	});

    	return block;
    }

    // (47:2) {#each woodenSigns as _, index}
    function create_each_block$1(ctx) {
    	let woodensign;
    	let current;

    	woodensign = new WoodenSign({
    			props: { index: /*index*/ ctx[6] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(woodensign.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(woodensign, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(woodensign.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(woodensign.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(woodensign, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(47:2) {#each woodenSigns as _, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;
    	let howlmoon;
    	let t0;
    	let section;
    	let div;
    	let t1;
    	let current;
    	howlmoon = new HowlMoon({ $$inline: true });
    	let each_value_1 = directionSigns;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = woodenSigns;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(howlmoon.$$.fragment);
    			t0 = space();
    			section = element("section");
    			div = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "direction-signs");
    			add_location(div, file$3, 38, 2, 837);
    			attr_dev(section, "class", "all-the-signs svelte-1phgwxu");
    			add_location(section, file$3, 37, 1, 802);
    			add_location(main, file$3, 35, 0, 778);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(howlmoon, main, null);
    			append_dev(main, t0);
    			append_dev(main, section);
    			append_dev(section, div);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div, null);
    			}

    			append_dev(section, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selectSign*/ 2) {
    				each_value_1 = directionSigns;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(howlmoon.$$.fragment, local);

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(howlmoon.$$.fragment, local);
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(howlmoon);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $selectedIndex;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	let selectedIndex = writable(0);
    	validate_store(selectedIndex, "selectedIndex");
    	component_subscribe($$self, selectedIndex, value => $$invalidate(3, $selectedIndex = value));
    	setContext("sign-select", { selectedIndex });

    	function selectSign(index) {
    		set_store_value(selectedIndex, $selectedIndex = index, $selectedIndex);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	const click_handler = index => selectSign(index);

    	$$self.$capture_state = () => ({
    		setContext,
    		writable,
    		DirectionSign,
    		HowlMoon,
    		WoodenSign,
    		directionSigns,
    		woodenSigns,
    		selectedIndex,
    		selectSign,
    		$selectedIndex
    	});

    	$$self.$inject_state = $$props => {
    		if ("selectedIndex" in $$props) $$invalidate(0, selectedIndex = $$props.selectedIndex);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selectedIndex, selectSign, click_handler];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    function moonscriptTemplate(moonscriptSegments) {
    	return `
-- Core
export TYPE = "__class"
export NAME = "__name"
export SCENE = {}

-- Physics
export class KINEMATIC
export class STATIC
export class POINTER
export class KINEMATIC_POINTER

export UP = "Up"
export DOWN = "Down"
export LEFT = "Left"
export RIGHT = "Right"

-- Input
export class HOLD
export class ONCE

export PRESS_HOLD = {}
export PRESS_HOLD_KEYS = {}

export CLICK_HOLD = {}
export HOVER_HOLD = {}
export KEYS = {}

-- Sprites
export ANIMATED = {}


-- Scene objects
export class Scene_Object
	@count: 0
	new: =>
		@@count += 1
		@x = 0
		@y = 0
		@angle = 0


export class Text
	new: =>
		@content = ""
		@size = 16
		@font = "Arial"
		@color = 0x00aaff
		@_is_text = true
	overlap: =>

export class Physics_Text
	new: =>
		@content = ""
		@size = 16
		@font = "Arial"
		@color = 0x00aaff
		@_is_text = true
	collide: =>

export class Static_Text extends Physics_Text
	collide: => STATIC

export class Kinematic_Text extends Physics_Text
	collide: => KINEMATIC

export class Pointer_Text extends Physics_Text
	collide: => POINTER

export class Kinematic_Pointer_Text extends Physics_Text
	collide: => KINEMATIC_POINTER


export class Timer
	new: =>
		@fire = -> nil
		@rate = 1000
		@count = 1
		@_is_timer = true


export spawn = (archetype, config = {}) ->
	scene_object_temp = Scene_Object!
	instance = with archetype!
		-- TODO: Keep the base modification below?
		[TYPE].__base[k] = v for k,v in pairs scene_object_temp
		[k] = v for k,v in pairs scene_object_temp
		[k] = v for k,v in pairs config
		.id = Scene_Object.count
		._class_name = archetype[NAME]
		._has_click = .click ~= nil
		._has_unclick = .unclick ~= nil
		._has_hover = .hover ~= nil
		._has_unhover = .unhover ~= nil
		._has_draw = .draw ~= nil
		if .collide
			collide_obj = \\collide {}
			if collide_obj then ._collide_name = collide_obj[NAME] else ._collide_name = "GRAVITY"
		if .overlap
			overlap_obj = \\overlap {}
			if overlap_obj then ._overlap_name = overlap_obj[NAME] else ._overlap_name = "GHOST"
	
	for k,v in pairs instance[TYPE].__base
		instance["__" .. k] = v

	js.global.SPAWN_OBJECT = Object(instance)
	js.global._spawn!
	
	SCENE[instance.id] = instance
	-- update_scene!
	
	return instance
    

-- TODO: Remove most of this function?
export destroy = (instance) ->
	instance._is_dead = true
	
	
	-- last_scene_object = table.remove(SCENE)
	-- Scene_Object.count -= 1
	
	-- if #SCENE > 0
	-- 	last_scene_object.id = instance.id
	-- 	SCENE[instance.id] = last_scene_object
		
	-- js.global.DESTROY_INSTANCE = Object(instance)
	-- js.global._destroy!
	
	-- update_scene!
	
	
	-- _document\\dispatchEvent(js.new(_custom_event, "destroy", Object({
	-- 	detail: Object(instance)
	-- })))


export mirror = (instance) ->
	js.global.MIRROR_ID = instance.id
	js.global.MIRROR_X = true
	js.global.mirrorSprite!

export unmirror = (instance) ->
	js.global.MIRROR_ID = instance.id
	js.global.MIRROR_X = false
	js.global.mirrorSprite!


export flip = (instance) ->
	js.global.FLIP_ID = instance.id
	js.global.FLIP_Y = true
	js.global.flipSprite!

export unflip = (instance) ->
	js.global.FLIP_ID = instance.id
	js.global.FLIP_Y = false
	js.global.flipSprite!


export animate = (instance, name) ->
	if ANIMATED[instance.id] == nil
		js.global.ANIMATE_ID = instance.id
		js.global.ANIMATE_NAME = name
		js.global.animateSprite!
		ANIMATED[instance.id] = name

export unanimate = (instance) ->
	if ANIMATED[instance.id]
		js.global.UNANIMATE_ID = instance.id
		js.global.UNANIMATE_NAME = ANIMATED[instance.id]
		js.global.unanimateSprite!
		ANIMATED[instance.id] = nil


export thrust = (instance, direction, amount) ->
	js.global.THRUST_ID = instance.id
	js.global.THRUST_DIRECTION = direction
	js.global.THRUST_AMOUNT = amount
	js.global.applyThrust!


export play = (sound_name) ->
	js.global.SOUND_NAME = sound_name
	js.global.playSound!

export pause = (sound_name) ->
	js.global.SOUND_NAME = sound_name
	js.global.pauseSound!

export resume = (sound_name) ->
	js.global.SOUND_NAME = sound_name
	js.global.resumeSound!
	
export stop = (sound_name) ->
	js.global.SOUND_NAME = sound_name
	js.global.stopSound!
	
	
export line = (config) ->
	js.global.LINE_CONFIG = Object(config)
	js.global.drawLine!

export rectangle = (config) ->
	js.global.RECTANGLE_CONFIG = Object(config)
	js.global.drawRectangle!

export ellipse = (config) ->
	js.global.ELLIPSE_CONFIG = Object(config)
	js.global.drawEllipse!


${moonscriptSegments.create}
`
    }

    function luaTemplate(luaSegments) {
      return `
js = require "js"

function Object(t)
	local o = js.new(js.global.Object)
	for k, v in pairs(t) do
		o[k] = v
	end
	return o
end

_document = js.global.document
_custom_event = js.global.CustomEvent

function update_scene()
	-- js.global.SCENE = js.global:Array()
end

js.global.set_position = function()
	local id = js.global._SET_POSITION_ID
	local x = js.global._SET_POSITION_X
	local y = js.global._SET_POSITION_Y
	
	SCENE[id].x = x
	SCENE[id].y = y
end

js.global.add_keys = function()
	local id = js.global.ID
	local has_press = js.global.HAS_PRESS
	SCENE[id]._has_press = has_press
	
	SCENE[id]._keys = {}
	for k,v in pairs(js.global.KEYS) do
		SCENE[id]._keys[v] = true
	end
end


js.global.run_press = function()
	local key = js.global.KEY
	local press_callback_name = "press_" .. key
	
	PRESS_HOLD_KEYS[key] = {}
	
	for id, scene_object in pairs(SCENE) do
		if scene_object[press_callback_name] then
			local result = scene_object[press_callback_name](scene_object)
			
			if (result and result[NAME] ~= "ONCE") or result == nil then
				PRESS_HOLD_KEYS[key][id] = scene_object
			end
		end
	end
	
end

js.global.run_unpress = function()
	local key = js.global.KEY
	local unpress_callback_name = "unpress_" .. key
	
	for id, scene_object in pairs(SCENE) do
		if scene_object[unpress_callback_name] then
			scene_object[unpress_callback_name](scene_object)
		end
	end
	
	PRESS_HOLD_KEYS[key] = {}
end


js.global.run_hover = function()
	local id = js.global.HOVER_ID
	local hover_object = SCENE[id]:hover()
	
	if hover_object and hover_object[NAME] == "HOLD" then
		HOVER_HOLD[id] = SCENE[id]
	end
end

js.global.run_unhover = function()
	local id = js.global.UNHOVER_ID
	
	if SCENE[id].unhover then
		SCENE[id]:unhover()
	end
	
	HOVER_HOLD = {}
end


js.global.run_click = function()
	local id = js.global.CLICK_ID
	local click_object = SCENE[id]:click()
	
	if click_object and click_object[NAME] == "HOLD" then
		CLICK_HOLD[id] = SCENE[id]
	end
end

js.global.run_unclick = function()
	local id = js.global.UNCLICK_ID
		
	if SCENE[id].unclick then
		SCENE[id]:unclick()
	end

	CLICK_HOLD = {}
end


js.global.run_draw = function()
	local id = js.global.DRAW_ID
	
	if SCENE[id].draw then
		SCENE[id]:draw()
	end
end


js.global.run_collide = function()
	local id1 = js.global.COLLIDE_ID1
	local id2 = js.global.COLLIDE_ID2
	SCENE[id1]:collide(SCENE[id2])
	SCENE[id2]:collide(SCENE[id1])
end

js.global.run_overlap = function()
	local id1 = js.global.OVERLAP_ID1
	local id2 = js.global.OVERLAP_ID2
	SCENE[id1]:overlap(SCENE[id2])
	SCENE[id2]:overlap(SCENE[id1])
end


${luaSegments.create}

js.global.game_update = function()
	${luaSegments.update}
	
	for input_key, v in pairs(PRESS_HOLD_KEYS) do
		local press_callback_name = "press_" .. input_key
		
		for id, scene_object in pairs(PRESS_HOLD_KEYS[input_key]) do
			if scene_object[press_callback_name] then
				scene_object[press_callback_name](scene_object)
			end
		end
	end
	
	for id, scene_object in pairs(HOVER_HOLD) do
		if scene_object and scene_object.hover then
			scene_object:hover()
		end
	end

	for id, scene_object in pairs(CLICK_HOLD) do
		if scene_object and scene_object.click then
			scene_object:click()
		end
	end
	
	local to_be_destroyed = {}
	
	for id, scene_object in pairs(SCENE) do
		js.global.LUA_SCENE_OBJECT = Object(scene_object)
		js.global._updateSceneObject()
		
		if scene_object._is_dead then
			to_be_destroyed[id] = scene_object
		end
	end
	
	for id, _ in pairs(to_be_destroyed) do
		last_scene_object = table.remove(SCENE)
		Scene_Object.count = Scene_Object.count - 1
		
		if #SCENE > 0 and last_scene_object.id ~= id then
			last_scene_object.id = id
			SCENE[id] = last_scene_object
		end
	end
end
`
    }

    window.mirrorSprite = () => {
      const index = window.MIRROR_ID - 1;
      const sceneObject = SCENE[index];
      
      sceneObject.obj.flipX = window.MIRROR_X;
    };

    window.flipSprite = () => {
      const index = window.FLIP_ID - 1;
      const sceneObject = SCENE[index];
      
      sceneObject.obj.flipY = window.FLIP_Y;
    };

    window.animateSprite = () => {
      const index = window.ANIMATE_ID - 1;
      const sceneObject = SCENE[index];
      
      if (sceneObject.obj.anims) {
        sceneObject.obj.anims.play(window.ANIMATE_NAME);
      }
    };

    window.unanimateSprite = () => {
      const index = window.UNANIMATE_ID - 1;
      const sceneObject = SCENE[index];
      
      if (sceneObject.obj.anims) {
        sceneObject.obj.anims.pause();
        sceneObject.obj.anims.setProgress(0);
      }
    };

    window.applyThrust = () => {
      const index = window.THRUST_ID - 1;
      const sceneObject = SCENE[index];
      
      if (sceneObject.obj) {
        // Rotate the direction anti-clockwise because why the hell not amirite?
        const direction = 
          window.THRUST_DIRECTION === "Up" ? "Left" :
          window.THRUST_DIRECTION === "Down" ? "Right" :
          window.THRUST_DIRECTION === "Left" ? "Back" :
          window.THRUST_DIRECTION === "Right" ? "" : null;
          
        if (direction !== null) {
          const amount = window.THRUST_AMOUNT;
          sceneObject.obj[`thrust${direction}`](amount);
        }
      }
    };

    window._isKinematic = (sceneObject) => {
      const { _collide_name } = sceneObject;
      return _collide_name && _collide_name.startsWith("KINEMATIC");
    };
      
    window._collideUsesPointer = (sceneObject) => {
      const { _collide_name } = sceneObject;
      return _collide_name && _collide_name.endsWith("POINTER");
    };

    window._overlapUsesPointer = (sceneObject) => {
      const { _overlap_name } = sceneObject;
      return _overlap_name && _overlap_name.endsWith("POINTER");
    };

    window.playSound = () => {
      const name = window.SOUND_NAME.toLowerCase();
      phaserContext.sound.setVolume(0.25);
      soundObjects[name].play();
    };

    window.pauseSound = () => {
      const name = window.SOUND_NAME.toLowerCase();
      soundObjects[name].pause();
    };

    window.resumeSound = () => {
      const name = window.SOUND_NAME.toLowerCase();
      phaserContext.sound.setVolume(0.25);
      soundObjects[name].resume();
    };

    window.stopSound = () => {
      const name = window.SOUND_NAME.toLowerCase();
      soundObjects[name].stop();
    };

    window.drawLine = () => {
      const {
        x1 = 0,
        y1 = 0,
        x2 = x1,
        y2 = y1,
        thickness = 1,
        color = 0x00aaff,
        opacity = 1,
      } = window.LINE_CONFIG;
      
      graphics.lineStyle(thickness, color, opacity);
      graphics.lineBetween(x1, y1, x2, y2);
    };

    window.drawRectangle = () => {
      const {
        x = 0,
        y = 0,
        width = 1,
        height = 1,
        thickness = 1,
        color = 0x00aaff,
        opacity = 1,
        stroke,
      } = window.RECTANGLE_CONFIG;
      
      graphics.lineStyle(thickness, stroke, opacity);
      graphics.fillStyle(color, opacity);
      graphics.fillRect(x, y, width, height);
      
      if (stroke) {
        graphics.strokeRect(x, y, width, height);
      }
    };

    window.drawEllipse = () => {
      const {
        x = 0,
        y = 0,
        radius = 1,
        thickness = 1,
        color = 0x00aaff,
        opacity = 1,
        height,
        stroke,
      } = window.ELLIPSE_CONFIG;
      
      graphics.lineStyle(thickness, stroke, opacity);
      graphics.fillStyle(color, opacity);
      
      if (height) {
        graphics.fillEllipse(x, y, radius, height);
        
        if (stroke) {
          graphics.strokeEllipse(x, y, radius, height);
        }
      }
      else {
        graphics.fillCircle(x, y, radius);
        
        if (stroke) {
          graphics.strokeCircle(x, y, radius);
        }
      }
    };

    window._spawn = () => {
      const sceneObject = window.SPAWN_OBJECT;
      const { x, y, angle, _class_name, id } = sceneObject;
      const name = _class_name.toLowerCase();
      
      let isKinematic = _isKinematic(sceneObject);
      let isStatic = sceneObject._collide_name === "STATIC" || isKinematic;
      
      const ignorePointer = !_collideUsesPointer(sceneObject) && !_overlapUsesPointer(sceneObject);
      const isSensor = !!sceneObject._overlap_name;
      
      const index = id - 1;
      SCENE[index] = sceneObject;
      
      // Text
      if (sceneObject._is_text) {
        const { content, font, size, color } = sceneObject;
        
        // Convert 0x00... into "#00..."
        const baseHexColor = color.toString(16);
        let padZeros = "";
        
        for (let i = 0; i < 6 - baseHexColor.length; i++) {
          padZeros += "0";
        }
        
        const hexColor = "#" + padZeros + baseHexColor;
        
        let text = phaserContext.add.text(x, y, content, { fontFamily: font, fontSize: size, fill: hexColor });
        
        if (sceneObject._collide_name) {
          let matterText =
            phaserContext.matter.add.gameObject(text, { isSensor, ignorePointer })
            .setStatic(isStatic)
            .setIgnoreGravity(isSensor || isKinematic)
            .setAngle(angle);
            
          sceneObject.obj = matterText;
        }
        else {
          sceneObject.obj = text;
        }
      }
      // Timers
      else if (sceneObject._is_timer) {
        const { rate, count } = sceneObject;
        const event = {
          delay: rate,
          callbackScope: phaserContext,
          callback: () => {
            sceneObject.fire();
          }
        };
        
        if (count > 0) {
          event.repeat = count - 1;
        }
        else {
          event.loop = true;
        }
        
        phaserContext.time.addEvent(event);
      }
      // Images
      else {
        const spriteType = spriteTypeRefs[name];
        
        // TODO: Add scale (and a bunch of other properties)
        let img = phaserContext.matter.add[spriteType](x, y, name, null, {
          ignorePointer,
          isSensor
        }).setAngle(angle);
        
        // Tweak img
        if (img.texture.key === "__MISSING") {
          img.destroy();
          img = null;
        }
        else {
          img.setStatic(isStatic);
          img.setIgnoreGravity(isSensor || isKinematic || !sceneObject._collide_name);
        }
        
        sceneObject.obj = img;
      }
      
      // Set misc "private" variables
      if (sceneObject._has_hover) {
        sceneObject._hover = false;
        sceneObject._pointer_down = false;
      }
      
      // Set the adjusted sceneObject
      SCENE[index] = sceneObject;
    };

    window._updateSceneObject = () => {
      const { x, y, id, _is_dead } = window.LUA_SCENE_OBJECT;
      const index = id - 1;
      const sceneObject = SCENE[index];
      
      if (_is_dead) {
        const lastSceneObject = SCENE.pop();
        const doesNotMatchLastObject = lastSceneObject.id !== sceneObject.id;
        
        if (SCENE.length > 0 && doesNotMatchLastObject) {
          lastSceneObject.id = id;
          SCENE[index] = lastSceneObject;
        }
        
        sceneObject.obj.destroy();
      }
      else if (sceneObject && sceneObject.obj) {
        sceneObject.obj.x = x;
        sceneObject.obj.y = y;
      }
    };

    /* src\routes\Server64.svelte generated by Svelte v3.31.2 */

    const { Object: Object_1, document: document_1 } = globals;
    const file$4 = "src\\routes\\Server64.svelte";

    function create_fragment$6(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			if (script0.src !== (script0_src_value = "/fengari-web.js")) attr_dev(script0, "src", script0_src_value);
    			attr_dev(script0, "type", "text/javascript");
    			add_location(script0, file$4, 293, 1, 8390);
    			if (script1.src !== (script1_src_value = "/phaser.min.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$4, 294, 1, 8455);
    			if (script2.src !== (script2_src_value = "/moonscript/index.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$4, 295, 1, 8496);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document_1.head, script0);
    			append_dev(document_1.head, script1);
    			append_dev(document_1.head, script2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Server64", slots, []);
    	let { server64 } = $$props;
    	window.sceneObjectTemplate = { x: 0, y: 0, angle: 0 };
    	window.SCENE = [];
    	window.refSceneObjects = [];
    	window.spriteTypeRefs = {};
    	window.soundObjects = {};

    	onMount(async () => {
    		// Load data from server
    		const botAPIEndpoint = "https://wwd-site-bot.uc.r.appspot.com/";

    		const botAPIResponse = await fetch(botAPIEndpoint + server64);
    		const data = await botAPIResponse.json();
    		const { moonscriptSegments, assets } = data;

    		// Create and execute Lua template
    		const moonscriptCreate = moonscriptTemplate(moonscriptSegments).trim();

    		const luaSegments = {
    			create: await window.MoonScript.compile(moonscriptCreate),
    			update: await window.MoonScript.compile(moonscriptSegments.update)
    		};

    		const returnPattern = /^return/gm;
    		luaSegments.create = luaSegments.create.replaceAll(returnPattern, "");
    		luaSegments.update = luaSegments.update.replaceAll(returnPattern, "");
    		const lua = luaTemplate(luaSegments);

    		// Phaser - Load assets
    		function preload() {
    			for (let asset of assets) {
    				const name = asset.name.toLowerCase();
    				const { url } = asset;

    				if (asset.animations.length) {
    					const { frameWidth, frameHeight } = asset;
    					this.load.spritesheet(name, url, { frameWidth, frameHeight });
    				} else if (asset.type === "sound") {
    					this.load.audio(name, [url]);
    				} else {
    					this.load.image(name, url);
    				}
    			}
    		}

    		// Phaser - Start game
    		function create() {
    			// Global config
    			window.phaserContext = this;

    			window.graphics = this.add.graphics();

    			// Physics config
    			this.matter.world.autoUpdate = false;

    			this.matter.world.setBounds();
    			this.matter.add.pointerConstraint({ length: 1, stiffness: 1 });

    			// Assets config
    			for (let asset of assets) {
    				const name = asset.name.toLowerCase();
    				const { animations, frameRate, type } = asset;

    				// Animations
    				spriteTypeRefs[name] = animations.length ? "sprite" : "image";

    				for (let animation of animations) {
    					const [key] = Object.keys(animation);
    					const frames = animation[key];
    					const lastFrame = frames.pop();
    					let repeat = 1;

    					if (typeof lastFrame === "string" && lastFrame.toLowerCase() === "loop") {
    						repeat = -1;
    					} else {
    						frames.push(lastFrame);
    					}

    					this.anims.create({
    						key,
    						frames: this.anims.generateFrameNumbers(name, { frames }),
    						frameRate,
    						repeat
    					});
    				}

    				// Sounds
    				if (type === "sound") {
    					const sound = this.sound.add(name);
    					soundObjects[name] = sound;
    				}
    			}

    			// Physics events
    			this.matter.world.on("collisionstart", (event, body1, body2) => {
    				// Colliding bodies
    				let collideRefs = SCENE.filter(sceneObject => sceneObject._collide_name);

    				let collideObject1 = collideRefs.find(sceneObject => sceneObject.obj.body === body1);
    				let collideObject2 = collideRefs.find(sceneObject => sceneObject.obj.body === body2);

    				if (collideObject1 && collideObject1.id && (collideObject2 && collideObject2.id)) {
    					window.COLLIDE_ID1 = collideObject1.id;
    					window.COLLIDE_ID2 = collideObject2.id;
    					window.run_collide();
    				}

    				// Overlapping bodies
    				let overlapRefs = SCENE.filter(sceneObject => sceneObject._overlap_name);

    				let overlapObject1 = overlapRefs.find(sceneObject => sceneObject.obj.body === body1);
    				let overlapObject2 = overlapRefs.find(sceneObject => sceneObject.obj.body === body2);

    				if (overlapObject1 && overlapObject1.id && (overlapObject2 && overlapObject2.id)) {
    					window.OVERLAP_ID1 = overlapObject1.id;
    					window.OVERLAP_ID2 = overlapObject2.id;
    					window.run_collide();
    				}
    			});

    			// Keyboard events
    			document.addEventListener("keydown", e => {
    				if (e.repeat) return;

    				const key = e.key.trim()
    				? e.key.toUpperCase()
    				: e.code.toUpperCase();

    				window.KEY = key;
    				window.run_press();
    			});

    			document.addEventListener("keyup", e => {
    				if (e.repeat) return;
    				const key = e.key.toUpperCase();
    				window.KEY = key;
    				window.run_unpress();
    			});

    			// Pointer events
    			this.input.on("pointermove", pointer => {
    				const { worldX, worldY } = pointer;
    				const hoverObjects = SCENE.filter(sceneObject => sceneObject._has_hover && sceneObject.obj);

    				SCENE.forEach(sceneObject => {
    					const { body } = sceneObject.obj || {};

    					if (body) {
    						sceneObject._isPointerOver = this.matter.containsPoint(body, worldX, worldY);
    					}
    				});

    				// DE-DUPE
    				hoverObjects.forEach(sceneObject => {
    					if (sceneObject._isPointerOver) {
    						if (!sceneObject._did_hover && !sceneObject._pointer_down) {
    							window.HOVER_ID = sceneObject.id;
    							window.run_hover();
    							sceneObject._did_hover = true;
    						}

    						if (sceneObject._pointer_down) {
    							sceneObject._dragging = true;
    						}
    					} else if (sceneObject._did_hover) {
    						if (sceneObject._has_unhover) {
    							window.UNHOVER_ID = sceneObject.id;
    							window.run_unhover();
    						}

    						if (sceneObject._has_unclick && !sceneObject._dragging) {
    							window.UNCLICK_ID = sceneObject.id;
    							window.run_unclick();
    						} else {
    							sceneObject.dragging = false;
    						}

    						sceneObject._did_hover = false;
    					}
    				});
    			});

    			this.input.on("pointerdown", pointer => {
    				// const { worldX, worldY } = pointer;
    				const clickObjects = SCENE.filter(sceneObject => sceneObject._has_click);

    				clickObjects.forEach(sceneObject => {
    					if (sceneObject._isPointerOver) {
    						window.CLICK_ID = sceneObject.id;
    						window.run_click();
    						sceneObject._pointer_down = true;
    					}

    					if (sceneObject._collide_name === "KINEMATIC_POINTER") {
    						sceneObject.obj.setStatic(false);
    					}
    				});
    			});

    			this.input.on("pointerup", pointer => {
    				const { worldX, worldY } = pointer;
    				const unclickObjects = SCENE.filter(sceneObject => sceneObject._has_unclick);

    				unclickObjects.forEach(sceneObject => {
    					if (sceneObject._pointer_down) {
    						window.UNCLICK_ID = sceneObject.id;
    						window.run_unclick();
    						sceneObject._pointer_down = false;
    					}

    					const { body } = sceneObject.obj;
    					sceneObject._did_hover = body && this.matter.containsPoint(body, worldX, worldY);

    					if (sceneObject._collide_name === "KINEMATIC_POINTER") {
    						sceneObject.obj.setStatic(true);
    					}
    				});
    			});

    			// Execute our Lua, bay-bee!
    			window.fengari.load(lua)();
    		}

    		// Phaser - Once per frame
    		function update(time, delta) {
    			// Lua game update
    			window.game_update();

    			// Physics
    			this.matter.world.step(delta);

    			SCENE.filter(sceneObject => sceneObject._collide_name).forEach(collideSceneObject => {
    				const { x, y } = collideSceneObject.obj;
    				window._SET_POSITION_ID = collideSceneObject.id;
    				window._SET_POSITION_X = x;
    				window._SET_POSITION_Y = y;
    				window.set_position();

    				if (_isKinematic(collideSceneObject)) {
    					collideSceneObject.obj.setAngularVelocity(0);
    					collideSceneObject.obj.setVelocity(0);
    				}
    			});

    			// Draw
    			graphics.clear();

    			SCENE.filter(sceneObject => sceneObject._has_draw).forEach(drawSceneObject => {
    				window.DRAW_ID = drawSceneObject.id;
    				window.run_draw();
    			});
    		}

    		// Create Phaser game
    		let gameConfig = {
    			// ...window.configStub,
    			type: Phaser.AUTO,
    			physics: { default: "matter" },
    			scene: { preload, create, update }
    		};

    		window.game = new Phaser.Game(gameConfig);
    	});

    	const writable_props = ["server64"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Server64> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("server64" in $$props) $$invalidate(0, server64 = $$props.server64);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		moonscriptTemplate,
    		luaTemplate,
    		server64
    	});

    	$$self.$inject_state = $$props => {
    		if ("server64" in $$props) $$invalidate(0, server64 = $$props.server64);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [server64];
    }

    class Server64 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { server64: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Server64",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*server64*/ ctx[0] === undefined && !("server64" in props)) {
    			console.warn("<Server64> was created without expected prop 'server64'");
    		}
    	}

    	get server64() {
    		throw new Error("<Server64>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set server64(value) {
    		throw new Error("<Server64>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.31.2 */

    // (8:1) <Route path="/">
    function create_default_slot_2(ctx) {
    	let home;
    	let current;
    	home = new Home({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(home.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(home, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(home, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(8:1) <Route path=\\\"/\\\">",
    		ctx
    	});

    	return block;
    }

    // (12:1) <Route path="/:server64" let:params>
    function create_default_slot_1(ctx) {
    	let server64;
    	let current;
    	const server64_spread_levels = [/*params*/ ctx[0]];
    	let server64_props = {};

    	for (let i = 0; i < server64_spread_levels.length; i += 1) {
    		server64_props = assign(server64_props, server64_spread_levels[i]);
    	}

    	server64 = new Server64({ props: server64_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(server64.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(server64, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const server64_changes = (dirty & /*params*/ 1)
    			? get_spread_update(server64_spread_levels, [get_spread_object(/*params*/ ctx[0])])
    			: {};

    			server64.$set(server64_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(server64.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(server64.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(server64, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(12:1) <Route path=\\\"/:server64\\\" let:params>",
    		ctx
    	});

    	return block;
    }

    // (7:0) <Router>
    function create_default_slot(ctx) {
    	let route0;
    	let t;
    	let route1;
    	let current;

    	route0 = new Route({
    			props: {
    				path: "/",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route1 = new Route({
    			props: {
    				path: "/:server64",
    				$$slots: {
    					default: [
    						create_default_slot_1,
    						({ params }) => ({ 0: params }),
    						({ params }) => params ? 1 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route0.$$.fragment);
    			t = space();
    			create_component(route1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(route0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(route1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route0_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route0_changes.$$scope = { dirty, ctx };
    			}

    			route0.$set(route0_changes);
    			const route1_changes = {};

    			if (dirty & /*$$scope, params*/ 3) {
    				route1_changes.$$scope = { dirty, ctx };
    			}

    			route1.$set(route1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route0.$$.fragment, local);
    			transition_in(route1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(route1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(7:0) <Router>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let router;
    	let current;

    	router = new Router({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const router_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				router_changes.$$scope = { dirty, ctx };
    			}

    			router.$set(router_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Router, Route, Home, Server64 });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
