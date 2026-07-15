import React from 'react';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';

export interface MappingRow {
  internalField: string;
  label: string;
  required: boolean;
  sourceColumn: string | null;   // currently selected source column
  confidence: number | null;     // 0–1 from detection, null if manually set
}

interface ColumnMappingTableProps {
  rows: MappingRow[];
  availableColumns: string[];
  onMappingChange: (internalField: string, sourceColumn: string) => void;
}

function confidenceBadge(confidence: number | null, sourceColumn: string | null, required: boolean) {
  if (!sourceColumn) {
    return required
      ? <Badge variant="danger">Required — not mapped</Badge>
      : <Badge variant="neutral">Optional — not mapped</Badge>;
  }
  if (confidence === null) return <Badge variant="neutral">Manual</Badge>;
  if (confidence >= 0.95) return <Badge variant="success">Auto-detected</Badge>;
  if (confidence >= 0.80) return <Badge variant="info">High confidence</Badge>;
  return <Badge variant="warning">Low confidence — review</Badge>;
}

const FIELD_LABELS: Record<string, string> = {
  order_id:           'Order ID',
  date:               'Date',
  status:             'Status',
  fulfilment:         'Fulfilment',
  category:           'Category',
  qty:                'Quantity',
  amount:             'Amount (₹)',
  ship_state:         'Ship State',
  b2b:                'B2B',
  ship_city:          'Ship City',
  sku:                'SKU',
  ship_service_level: 'Ship Service Level',
  sales_channel:      'Sales Channel',
  size:               'Size',
};

export function buildMappingRows(
  proposedMapping: Record<string, string>,
  requiredFields: string[],
  optionalFields: string[],
  confidence: number,
): MappingRow[] {
  const allFields = [...requiredFields, ...optionalFields];
  return allFields.map((f) => ({
    internalField: f,
    label: FIELD_LABELS[f] ?? f,
    required: requiredFields.includes(f),
    sourceColumn: proposedMapping[f] ?? null,
    confidence: proposedMapping[f] ? confidence : null,
  }));
}

export const ColumnMappingTable: React.FC<ColumnMappingTableProps> = ({
  rows,
  availableColumns,
  onMappingChange,
}) => {
  const columnOptions = [
    { value: '', label: '— select column —' },
    ...availableColumns.map((c) => ({ value: c, label: c })),
  ];

  const requiredRows  = rows.filter((r) => r.required);
  const optionalRows  = rows.filter((r) => !r.required);

  const renderRows = (items: MappingRow[]) =>
    items.map((row) => (
      <tr key={row.internalField} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors duration-fast">
        <td className="py-sm px-md">
          <span className="text-sm font-medium text-text-primary">{row.label}</span>
          {row.required && (
            <span className="ml-xs text-xs text-danger font-semibold">*</span>
          )}
        </td>
        <td className="py-sm px-md">
          <Select
            id={`mapping-${row.internalField}`}
            value={row.sourceColumn ?? ''}
            options={columnOptions}
            onChange={(e) => onMappingChange(row.internalField, e.target.value)}
            className="text-sm"
          />
        </td>
        <td className="py-sm px-md">
          {confidenceBadge(row.confidence, row.sourceColumn, row.required)}
        </td>
      </tr>
    ));

  return (
    <div className="w-full rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-bg border-b border-border">
            <th className="py-sm px-md text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
              Internal Field
            </th>
            <th className="py-sm px-md text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
              Source Column
            </th>
            <th className="py-sm px-md text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
              Confidence
            </th>
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-border">
          {/* Required fields first */}
          {requiredRows.length > 0 && (
            <>
              <tr className="bg-bg/60">
                <td colSpan={3} className="px-md py-xs text-xs font-bold text-text-muted uppercase tracking-widest">
                  Required fields
                </td>
              </tr>
              {renderRows(requiredRows)}
            </>
          )}
          {/* Optional fields */}
          {optionalRows.length > 0 && (
            <>
              <tr className="bg-bg/60">
                <td colSpan={3} className="px-md py-xs text-xs font-bold text-text-muted uppercase tracking-widest">
                  Optional fields
                </td>
              </tr>
              {renderRows(optionalRows)}
            </>
          )}
        </tbody>
      </table>

      <div className="px-md py-sm bg-bg/40 border-t border-border text-xs text-text-muted">
        <span className="text-danger font-semibold">*</span> Required fields must be mapped before processing can begin.
      </div>
    </div>
  );
};
