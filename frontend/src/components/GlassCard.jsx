export default function GlassCard({ children, className = "", strong = false, as: Tag = "div", ...rest }) {
  return (
    <Tag className={`${strong ? "glass-strong" : "glass"} rounded-2xl ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
