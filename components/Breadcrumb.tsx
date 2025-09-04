"use client";

interface BreadcrumbItem {
  label: string;
  icon?: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="text-sm text-gray-500 flex items-center">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {item.href ? (
            <a href={item.href} className="flex items-center hover:text-blue-600">
              {item.icon && <span className="mr-1">{item.icon}</span>}
              {item.label}
            </a>
          ) : (
            <span className="flex items-center text-gray-900">
              {item.icon && <span className="mr-1">{item.icon}</span>}
              {item.label}
            </span>
          )}
          {index < items.length - 1 && <span className="mx-2">/</span>}
        </div>
      ))}
    </nav>
  );
}