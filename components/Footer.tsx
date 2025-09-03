import { ComponentPropsWithoutRef } from "react";

export default function Footer({
  className,
  ...props
}: ComponentPropsWithoutRef<"footer">) {
  return (
    <footer
      className={`mt-2 py-6 text-center text-sm text-gray-500 ${className}`}
      {...props}
    >
      © {new Date().getFullYear()} NZLouis | Louis Lu. All rights reserved.
    </footer>
  );
}
