<script>
  export let checked = false
  export let onLabel = null
  export let offLabel = null
  export let disabled = false

  export let fontSize = '1rem'
  export let align = 'left'
  export let checkedColor = '#bbe572'
  export let borderTop = 'none'
  export let borderBottom = 'none'
  export let padding = '0'
  export let margin = '0'
</script>

<div class="toggle" class:disabled style="font-size: {fontSize}; text-align: {align}; 
                  border-top: {borderTop}; border-bottom: {borderBottom};
                  padding: {padding}; margin: {margin}">
   <div class="controls">
    <div class="toggle">
      <label class="toggle-label">
        <input class="toggle-input" type="checkbox" bind:checked on:change {disabled}>
        <span class="toggle-track" style={checked ? `background-color: ${checkedColor};` : ''}>
          <span class="toggle-switch"></span>
        </span>
        {#if onLabel && offLabel}
        <span class="toggle-title">{checked ? onLabel : offLabel}</span>
        {/if}
      </label>
    </div>
   </div>
</div>

<style>
  .toggle.disabled {
    pointer-events: none;
  }

  .toggle {
    position: relative;
  }

  .toggle-input {
    border: 0;
    clip: rect(0 0 0 0);
    height: auto;
    margin: 0;
    overflow: hidden;
    padding: 0;
    position: absolute;
    width: 1px;
    white-space: nowrap;
  }

  .toggle-label {
    cursor: pointer;
    position: relative;
  }

  .toggle-label, .toggle-title, .toggle-track, .toggle-switch {
    display: inline-block;
    vertical-align: middle;
  }

  .toggle-track {
    position: relative;
    top: -0.125em;
    width: 2.8125em;
    height: 1.875em;
    background-color: #eee;
    border: 0.0625em solid rgba(0, 0, 0, 0.15);
    border-radius: 5px;
    transition: 0.35s cubic-bezier(0.785, 0.135, 0.15, 0.86);
    transition-property: background-color, border-color;
  }

  .toggle-label .toggle-input:checked ~ .toggle-track {
    border-color: rgba(0, 0, 0, 0.05);
  }

  .toggle-track + .toggle-title {
    margin-left: 0.375em;
  }

  .toggle-switch {
    position: absolute;
    top: 0;
    right: 0.9375em;
    bottom: 0;
    left: 0;
    margin: 2px;
    background-color: white;
    border-radius: 5px;
    box-shadow: 1px 1px 6px rgba(0, 0, 0, 0.2), inset 1px 1px 3px rgba(255, 255, 255, 0.8);
    transition: 0.35s cubic-bezier(0.785, 0.135, 0.15, 0.86);
    transition-property: left, right;
    transition-delay: 0s, 0.05s;
  }

  .toggle-label:active .toggle-switch {
    box-shadow: 1px 1px 6px rgba(0, 0, 0, 0.2), inset 1px 1px 3px rgba(255, 255, 255, 0.8), inset 1px 1px 6px rgba(0, 0, 0, 0.1);
  }

  .toggle-label .toggle-input:checked ~ .toggle-track > .toggle-switch {
    right: 0;
    left: 0.9375em;
    transition: 0.35s cubic-bezier(0.785, 0.135, 0.15, 0.86);
    transition-property: left, right;
    transition-delay: 0.05s, 0s;
  }
</style>