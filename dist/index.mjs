function noop() { }
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
    else
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.data !== data)
        text.data = data;
}
function set_style(node, key, value) {
    node.style.setProperty(key, value);
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}

let current_component;
function set_current_component(component) {
    current_component = component;
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
function flush() {
    const seen_callbacks = new Set();
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
                callback();
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
}
function update($$) {
    if ($$.fragment) {
        $$.update($$.dirty);
        run_all($$.before_update);
        $$.fragment.p($$.dirty, $$.ctx);
        $$.dirty = null;
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment.m(target, anchor);
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
    if (component.$$.fragment) {
        run_all(component.$$.on_destroy);
        component.$$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        component.$$.on_destroy = component.$$.fragment = null;
        component.$$.ctx = {};
    }
}
function make_dirty(component, key) {
    if (!component.$$.dirty) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty = blank_object();
    }
    component.$$.dirty[key] = true;
}
function init(component, options, instance, create_fragment, not_equal, prop_names) {
    const parent_component = current_component;
    set_current_component(component);
    const props = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props: prop_names,
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
        dirty: null
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, props, (key, value) => {
            if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                if ($$.bound[key])
                    $$.bound[key](value);
                if (ready)
                    make_dirty(component, key);
            }
        })
        : props;
    $$.update();
    ready = true;
    run_all($$.before_update);
    $$.fragment = create_fragment($$.ctx);
    if (options.target) {
        if (options.hydrate) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.l(children(options.target));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.c();
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

/* src/Component.svelte generated by Svelte v3.9.0 */

function add_css() {
	var style = element("style");
	style.id = 'svelte-1rfy3ng-style';
	style.textContent = ".toggle.svelte-1rfy3ng{margin-bottom:1em}.toggle.disabled.svelte-1rfy3ng{pointer-events:none}.toggle+.toggle.svelte-1rfy3ng{margin-top:1.25em;padding-top:1em;border-top:1px solid #ddd}.toggle.svelte-1rfy3ng{position:relative}.toggle-input.svelte-1rfy3ng{border:0;clip:rect(0 0 0 0);height:auto;margin:0;overflow:hidden;padding:0;position:absolute;width:1px;white-space:nowrap}.toggle-label.svelte-1rfy3ng{cursor:pointer;position:relative}.toggle-label.svelte-1rfy3ng,.toggle-title.svelte-1rfy3ng,.toggle-track.svelte-1rfy3ng,.toggle-switch.svelte-1rfy3ng{display:inline-block;vertical-align:middle}.toggle-title+.toggle-track.svelte-1rfy3ng{margin-left:0.375em}.toggle-track.svelte-1rfy3ng{position:relative;top:-0.125em;width:2.8125em;height:1.875em;background-color:#eee;border:0.0625em solid rgba(0, 0, 0, 0.15);border-radius:5px;-webkit-transition:0.35s cubic-bezier(0.785, 0.135, 0.15, 0.86);transition:0.35s cubic-bezier(0.785, 0.135, 0.15, 0.86);-webkit-transition-property:background-color, border-color;transition-property:background-color, border-color}.toggle-label .toggle-input:checked~.toggle-track.svelte-1rfy3ng{border-color:rgba(0, 0, 0, 0.05)}.toggle-track+.toggle-title.svelte-1rfy3ng{margin-left:0.375em}.toggle-switch.svelte-1rfy3ng{position:absolute;top:0;right:0.9375em;bottom:0;left:0;margin:2px;background-color:white;border-radius:5px;box-shadow:1px 1px 6px rgba(0, 0, 0, 0.2), inset 1px 1px 3px rgba(255, 255, 255, 0.8);-webkit-transition:0.35s cubic-bezier(0.785, 0.135, 0.15, 0.86);transition:0.35s cubic-bezier(0.785, 0.135, 0.15, 0.86);-webkit-transition-property:left, right;transition-property:left, right;-webkit-transition-delay:0s, 0.05s;transition-delay:0s, 0.05s}.toggle-label.svelte-1rfy3ng:active .toggle-switch.svelte-1rfy3ng{box-shadow:1px 1px 6px rgba(0, 0, 0, 0.2), inset 1px 1px 3px rgba(255, 255, 255, 0.8), inset 1px 1px 6px rgba(0, 0, 0, 0.1)}.toggle-label .toggle-input:checked~.toggle-track.svelte-1rfy3ng>.toggle-switch.svelte-1rfy3ng{right:0;left:0.9375em;-webkit-transition:0.35s cubic-bezier(0.785, 0.135, 0.15, 0.86);transition:0.35s cubic-bezier(0.785, 0.135, 0.15, 0.86);-webkit-transition-property:left, right;transition-property:left, right;-webkit-transition-delay:0.05s, 0s;transition-delay:0.05s, 0s}";
	append(document.head, style);
}

function create_fragment(ctx) {
	var div2, div1, div0, label, input, t0, span1, span0, span1_style_value, t1, span2, t2_value = ctx.checked ? ctx.onLabel : ctx.offLabel + "", t2, dispose;

	return {
		c() {
			div2 = element("div");
			div1 = element("div");
			div0 = element("div");
			label = element("label");
			input = element("input");
			t0 = space();
			span1 = element("span");
			span0 = element("span");
			t1 = space();
			span2 = element("span");
			t2 = text(t2_value);
			attr(input, "class", "toggle-input svelte-1rfy3ng");
			attr(input, "type", "checkbox");
			input.disabled = ctx.disabled;
			attr(span0, "class", "toggle-switch svelte-1rfy3ng");
			attr(span1, "class", "toggle-track svelte-1rfy3ng");
			attr(span1, "style", span1_style_value = ctx.checked ? `background-color: ${ctx.css.checkedColor};` : "");
			attr(span2, "class", "toggle-title svelte-1rfy3ng");
			attr(label, "class", "toggle-label svelte-1rfy3ng");
			toggle_class(label, "disabled", ctx.disabled);
			attr(div0, "class", "toggle svelte-1rfy3ng");
			attr(div1, "class", "controls");
			attr(div2, "class", "toggle svelte-1rfy3ng");
			set_style(div2, "font-size", ctx.css.fontSize);
			set_style(div2, "text-align", ctx.css.align);

			dispose = [
				listen(input, "change", ctx.input_change_handler),
				listen(input, "change", ctx.change_handler)
			];
		},

		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div1);
			append(div1, div0);
			append(div0, label);
			append(label, input);

			input.checked = ctx.checked;

			append(label, t0);
			append(label, span1);
			append(span1, span0);
			append(label, t1);
			append(label, span2);
			append(span2, t2);
		},

		p(changed, ctx) {
			if (changed.checked) input.checked = ctx.checked;

			if (changed.disabled) {
				input.disabled = ctx.disabled;
			}

			if ((changed.checked || changed.css) && span1_style_value !== (span1_style_value = ctx.checked ? `background-color: ${ctx.css.checkedColor};` : "")) {
				attr(span1, "style", span1_style_value);
			}

			if ((changed.checked || changed.onLabel || changed.offLabel) && t2_value !== (t2_value = ctx.checked ? ctx.onLabel : ctx.offLabel + "")) {
				set_data(t2, t2_value);
			}

			if (changed.disabled) {
				toggle_class(label, "disabled", ctx.disabled);
			}

			if (changed.css) {
				set_style(div2, "font-size", ctx.css.fontSize);
				set_style(div2, "text-align", ctx.css.align);
			}
		},

		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(div2);
			}

			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { checked = false, onLabel = 'Checked', offLabel = 'Unchecked', disabled = false, css = {
    fontSize: '1rem',
    align: 'left',
    checkedColor: '#bbe572'
  } } = $$props;

	function change_handler(event) {
		bubble($$self, event);
	}

	function input_change_handler() {
		checked = this.checked;
		$$invalidate('checked', checked);
	}

	$$self.$set = $$props => {
		if ('checked' in $$props) $$invalidate('checked', checked = $$props.checked);
		if ('onLabel' in $$props) $$invalidate('onLabel', onLabel = $$props.onLabel);
		if ('offLabel' in $$props) $$invalidate('offLabel', offLabel = $$props.offLabel);
		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
		if ('css' in $$props) $$invalidate('css', css = $$props.css);
	};

	return {
		checked,
		onLabel,
		offLabel,
		disabled,
		css,
		change_handler,
		input_change_handler
	};
}

class Component extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1rfy3ng-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, ["checked", "onLabel", "offLabel", "disabled", "css"]);
	}
}

const target = document.createElement('div');
document.body.appendChild(target);

new Component({
  target,
  props: {}
});
