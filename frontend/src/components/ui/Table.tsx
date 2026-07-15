import React from 'react';
import { cn } from '../../lib/utils';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
}

export const Table: React.FC<TableProps> = ({ children, className, wrapperClassName, ...props }) => (
  <div className={cn("w-full overflow-auto rounded-md border border-border bg-surface shadow-sm", wrapperClassName)}>
    <table className={cn("w-full caption-bottom text-sm border-collapse", className)} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => (
  <thead className={cn("bg-bg/80 border-b border-border text-left", className)} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement> & { hoverable?: boolean }> = ({
  children,
  className,
  hoverable = true,
  ...props
}) => (
  <tr
    className={cn(
      "border-b border-border transition-colors duration-fast",
      hoverable && "hover:bg-bg/50",
      className
    )}
    {...props}
  >
    {children}
  </tr>
);

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export const TableHead: React.FC<TableHeadProps> = ({
  children,
  className,
  sortDirection,
  onSort,
  ...props
}) => {
  return (
    <th
      className={cn(
        "h-12 px-lg text-left align-middle font-semibold text-text-secondary select-none transition-colors duration-fast",
        onSort && "cursor-pointer hover:text-text-primary",
        className
      )}
      onClick={onSort}
      {...props}
    >
      <div className="flex items-center gap-xs">
        <span>{children}</span>
        {sortDirection === 'asc' && <span className="text-primary text-[10px]">▲</span>}
        {sortDirection === 'desc' && <span className="text-primary text-[10px]">▼</span>}
      </div>
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className,
  ...props
}) => (
  <td className={cn("p-lg align-middle text-text-primary", className)} {...props}>
    {children}
  </td>
);
