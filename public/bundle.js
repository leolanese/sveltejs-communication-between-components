
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
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
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
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
    const seen_callbacks = new Set();
    function flush() {
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
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

    const globals = (typeof window !== 'undefined' ? window : global);
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
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\FirstComponent.svelte generated by Svelte v3.18.0 */

    const file = "src\\FirstComponent.svelte";

    function create_fragment(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let h2;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let input0;
    	let t6;
    	let input1;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Hello First child component!";
    			t1 = space();
    			h2 = element("h2");
    			t2 = text(/*name*/ ctx[0]);
    			t3 = space();
    			t4 = text(/*familyName*/ ctx[1]);
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			input1 = element("input");
    			attr_dev(h1, "class", "svelte-xyc6fq");
    			add_location(h1, file, 20, 1, 284);
    			add_location(h2, file, 21, 1, 324);
    			attr_dev(input0, "type", "text");
    			input0.value = /*name*/ ctx[0];
    			attr_dev(input0, "class", "svelte-xyc6fq");
    			add_location(input0, file, 22, 1, 355);
    			attr_dev(input1, "type", "text");
    			input1.value = /*familyName*/ ctx[1];
    			attr_dev(input1, "class", "svelte-xyc6fq");
    			add_location(input1, file, 25, 1, 424);
    			attr_dev(div, "class", "svelte-xyc6fq");
    			add_location(div, file, 19, 0, 276);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, h2);
    			append_dev(h2, t2);
    			append_dev(h2, t3);
    			append_dev(h2, t4);
    			append_dev(div, t5);
    			append_dev(div, input0);
    			set_input_value(input0, /*name*/ ctx[0]);
    			append_dev(div, t6);
    			append_dev(div, input1);
    			set_input_value(input1, /*familyName*/ ctx[1]);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[3]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[4])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t2, /*name*/ ctx[0]);
    			if (dirty & /*familyName*/ 2) set_data_dev(t4, /*familyName*/ ctx[1]);

    			if (dirty & /*name*/ 1 && input0.value !== /*name*/ ctx[0]) {
    				prop_dev(input0, "value", /*name*/ ctx[0]);
    			}

    			if (dirty & /*name*/ 1 && input0.value !== /*name*/ ctx[0]) {
    				set_input_value(input0, /*name*/ ctx[0]);
    			}

    			if (dirty & /*familyName*/ 2 && input1.value !== /*familyName*/ ctx[1]) {
    				prop_dev(input1, "value", /*familyName*/ ctx[1]);
    			}

    			if (dirty & /*familyName*/ 2 && input1.value !== /*familyName*/ ctx[1]) {
    				set_input_value(input1, /*familyName*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
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
    	let { name } = $$props;
    	let { familyName } = $$props;
    	const onChangeName = () => $$invalidate(0, name = event.target.value);
    	const writable_props = ["name", "familyName"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FirstComponent> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate(0, name);
    	}

    	function input1_input_handler() {
    		familyName = this.value;
    		$$invalidate(1, familyName);
    	}

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("familyName" in $$props) $$invalidate(1, familyName = $$props.familyName);
    	};

    	$$self.$capture_state = () => {
    		return { name, familyName };
    	};

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("familyName" in $$props) $$invalidate(1, familyName = $$props.familyName);
    	};

    	return [name, familyName, onChangeName, input0_input_handler, input1_input_handler];
    }

    class FirstComponent extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0, familyName: 1, onChangeName: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FirstComponent",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<FirstComponent> was created without expected prop 'name'");
    		}

    		if (/*familyName*/ ctx[1] === undefined && !("familyName" in props)) {
    			console.warn("<FirstComponent> was created without expected prop 'familyName'");
    		}
    	}

    	get name() {
    		throw new Error("<FirstComponent>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<FirstComponent>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get familyName() {
    		throw new Error("<FirstComponent>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set familyName(value) {
    		throw new Error("<FirstComponent>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onChangeName() {
    		return this.$$.ctx[2];
    	}

    	set onChangeName(value) {
    		throw new Error("<FirstComponent>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.18.0 */

    const { console: console_1 } = globals;
    const file$1 = "src\\App.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let h20;
    	let t3;
    	let h21;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let button;
    	let t10;
    	let input0;
    	let t11;
    	let input1;
    	let t12;
    	let current;
    	let dispose;

    	const firstcomponent = new FirstComponent({
    			props: {
    				name: /*name*/ ctx[0],
    				familyName: /*familyName*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Hello world!";
    			t1 = space();
    			h20 = element("h2");
    			h20.textContent = "I'm the parent Component";
    			t3 = space();
    			h21 = element("h2");
    			t4 = text("My name is: ");
    			t5 = text(/*uppercaseName*/ ctx[2]);
    			t6 = space();
    			t7 = text(/*uppercaseFamilyName*/ ctx[3]);
    			t8 = space();
    			button = element("button");
    			button.textContent = "Change-Name";
    			t10 = space();
    			input0 = element("input");
    			t11 = space();
    			input1 = element("input");
    			t12 = space();
    			create_component(firstcomponent.$$.fragment);
    			attr_dev(h1, "class", "svelte-cl05vu");
    			add_location(h1, file$1, 27, 1, 544);
    			add_location(h20, file$1, 28, 1, 567);
    			add_location(h21, file$1, 29, 1, 602);
    			attr_dev(button, "class", "svelte-cl05vu");
    			add_location(button, file$1, 30, 1, 662);
    			attr_dev(input0, "type", "text");
    			input0.value = /*name*/ ctx[0];
    			attr_dev(input0, "class", "svelte-cl05vu");
    			add_location(input0, file$1, 31, 1, 716);
    			attr_dev(input1, "type", "text");
    			input1.value = /*familyName*/ ctx[1];
    			attr_dev(input1, "class", "svelte-cl05vu");
    			add_location(input1, file$1, 34, 1, 782);
    			attr_dev(div, "class", "svelte-cl05vu");
    			add_location(div, file$1, 26, 0, 537);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, h20);
    			append_dev(div, t3);
    			append_dev(div, h21);
    			append_dev(h21, t4);
    			append_dev(h21, t5);
    			append_dev(h21, t6);
    			append_dev(h21, t7);
    			append_dev(div, t8);
    			append_dev(div, button);
    			append_dev(div, t10);
    			append_dev(div, input0);
    			set_input_value(input0, /*name*/ ctx[0]);
    			append_dev(div, t11);
    			append_dev(div, input1);
    			set_input_value(input1, /*familyName*/ ctx[1]);
    			append_dev(div, t12);
    			mount_component(firstcomponent, div, null);
    			current = true;

    			dispose = [
    				listen_dev(button, "click", /*onChangeName*/ ctx[4], false, false, false),
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[6]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[7])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*uppercaseName*/ 4) set_data_dev(t5, /*uppercaseName*/ ctx[2]);
    			if (!current || dirty & /*uppercaseFamilyName*/ 8) set_data_dev(t7, /*uppercaseFamilyName*/ ctx[3]);

    			if (!current || dirty & /*name*/ 1 && input0.value !== /*name*/ ctx[0]) {
    				prop_dev(input0, "value", /*name*/ ctx[0]);
    			}

    			if (dirty & /*name*/ 1 && input0.value !== /*name*/ ctx[0]) {
    				set_input_value(input0, /*name*/ ctx[0]);
    			}

    			if (!current || dirty & /*familyName*/ 2 && input1.value !== /*familyName*/ ctx[1]) {
    				prop_dev(input1, "value", /*familyName*/ ctx[1]);
    			}

    			if (dirty & /*familyName*/ 2 && input1.value !== /*familyName*/ ctx[1]) {
    				set_input_value(input1, /*familyName*/ ctx[1]);
    			}

    			const firstcomponent_changes = {};
    			if (dirty & /*name*/ 1) firstcomponent_changes.name = /*name*/ ctx[0];
    			if (dirty & /*familyName*/ 2) firstcomponent_changes.familyName = /*familyName*/ ctx[1];
    			firstcomponent.$set(firstcomponent_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(firstcomponent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(firstcomponent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(firstcomponent);
    			run_all(dispose);
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
    	let { name } = $$props;
    	let familyName = "Lanese";
    	const onChangeName = () => $$invalidate(0, name = name === "Leo" ? "Leonardo" : "Leo");
    	const onChangeInput = () => $$invalidate(1, familyName = event.target.value);
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate(0, name);
    	}

    	function input1_input_handler() {
    		familyName = this.value;
    		$$invalidate(1, familyName);
    	}

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => {
    		return {
    			name,
    			familyName,
    			uppercaseName,
    			uppercaseFamilyName
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("familyName" in $$props) $$invalidate(1, familyName = $$props.familyName);
    		if ("uppercaseName" in $$props) $$invalidate(2, uppercaseName = $$props.uppercaseName);
    		if ("uppercaseFamilyName" in $$props) $$invalidate(3, uppercaseFamilyName = $$props.uppercaseFamilyName);
    	};

    	let uppercaseName;
    	let uppercaseFamilyName;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*name*/ 1) {
    			 $$invalidate(2, uppercaseName = name.toUpperCase());
    		}

    		if ($$self.$$.dirty & /*familyName*/ 2) {
    			 $$invalidate(3, uppercaseFamilyName = familyName.toUpperCase());
    		}

    		if ($$self.$$.dirty & /*uppercaseName, uppercaseFamilyName*/ 12) {
    			 console.log(uppercaseName, uppercaseFamilyName);
    		}
    	};

    	return [
    		name,
    		familyName,
    		uppercaseName,
    		uppercaseFamilyName,
    		onChangeName,
    		onChangeInput,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console_1.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'Leo'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
