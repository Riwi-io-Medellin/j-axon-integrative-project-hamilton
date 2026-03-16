const VARIANT_CLASSES = {
  primary: "btn-nuevo",
  primarySmall: "btn-nuevo btn-small",
  page: "btn-page",
  dark: "btn btn-dark",
  outlineDark: "btn btn-outline-dark",
  light: "btn btn-light",
  secondary: "btn btn-secondary",
  outlineSecondary: "btn btn-outline-secondary",
  danger: "btn btn-danger",
  primaryBootstrap: "btn btn-primary",
  nav: "nav-link",
  primaryPill: "btn btn-dark rounded-pill px-3"
};

const escapeAttr = (value) => {
  return String(value).replace(/"/g, "&quot;");
};

const buildAttributes = (attrs = {}) => {
  const parts = [];
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) {
      return;
    }
    if (value === true) {
      parts.push(key);
      return;
    }
    parts.push(`${key}="${escapeAttr(value)}"`);
  });
  return parts.join(" ");
};

export const renderButton = ({
  label,
  content,
  id,
  type = "button",
  variant,
  className,
  attrs,
  disabled
} = {}) => {
  const variantClass = variant ? (VARIANT_CLASSES[variant] || "") : "";
  const classes = ["sigam-btn", variantClass, className].filter(Boolean).join(" ");
  const body = content !== undefined ? content : (label || "");
  const extraAttrs = buildAttributes(attrs);
  const baseAttrs = [
    id ? `id=\"${escapeAttr(id)}\"` : "",
    type ? `type=\"${escapeAttr(type)}\"` : "",
    classes ? `class=\"${escapeAttr(classes)}\"` : "",
    disabled ? "disabled" : "",
    extraAttrs
  ].filter(Boolean).join(" ");

  return `<button ${baseAttrs}>${body}</button>`;
};

export default renderButton;
