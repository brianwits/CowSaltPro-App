import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      // DOM Presence and Visibility
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeEmpty(): R;
      toBeEmptyDOMElement(): R;

      // Form Element States
      toBeChecked(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toHaveFocus(): R;

      // Content and Attributes
      toHaveTextContent(text: string | RegExp): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveStyle(style: Record<string, unknown>): R;
      toHaveClass(className: string): R;
      toHaveValue(value?: string | string[] | number): R;

      // DOM Structure
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(html: string): R;
    }
  }
} 