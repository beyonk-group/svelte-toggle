import Component from './Component.svelte'

const target = document.createElement('div')
document.body.appendChild(target)

// eslint-disable-next-line no-new
new Component({
  target,
  props: {}
})
