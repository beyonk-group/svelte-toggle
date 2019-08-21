import Component from '../src/Component.svelte'
import { render, cleanup } from '@testing-library/svelte'
import '@testing-library/jest-dom/extend-expect'

describe('App', () => {
  beforeEach(() => {
    cleanup()
  })

  test('should render greeting', () => {
    const { getByText } = render(Component, { props: {} })

    expect(getByText(`Checked`))
  })
})
