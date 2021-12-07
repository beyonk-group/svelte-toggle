<a href="https://beyonk.com">
  <img src="https://user-images.githubusercontent.com/218949/144224348-1b3a20d5-d68e-4a7a-b6ac-6946f19f4a86.png" width="198" />
</a>


# Svelte Toggle

by [@antony](https://github.com/antony)

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com) [![CircleCI](https://circleci.com/gh/beyonk-adventures/svelte-toggle.svg?style=shield)](https://circleci.com/gh/beyonk-adventures/svelte-toggle) [![svelte-v3](https://img.shields.io/badge/svelte-v3-blueviolet.svg)](https://svelte.dev)

A toggle component for Svelte.

## Installation

`npm i -D @beyonk/svelte-toggle`

## Usage

Basic:

```
<Toggle bind:checked on:change={someFunction} />

<script>
  import Toggle from '@beyonk/svelte-toggle'

  let checked = false
</script>
```

## Labels

Specify both on and off labels

```
<Toggle bind:checked onLabel="Checked" offLabel="Unchecked />

<script>
  import Toggle from '@beyonk/svelte-toggle'

  let checked = false
</script>
```

### Change event

```
<Toggle bind:checked on:change={someFunction} />

<script>
  import Toggle from '@beyonk/svelte-toggle'

  function someFunction () {
    console.log('Toggle changed value')
  }
</script>
```

### Styling

You can pass in some custom styling:


```
  const css = {
    fontSize: '1rem',
    align: 'left',
    checkedColor: '#bbe572'
  }

  <Toggle bind:checked {css} />
```
